import express from "express";
import { authenticate } from "../../middleware/auth.js";
import pool from "../db.js";
import {
  sendShortStayBookingToHost,
  sendShortStayConfirmationToGuest,
} from "../../utils/email.js";

const router = express.Router();

// GET /short-stays/available?property_id=&check_in=&check_out=
router.get("/available", async (req, res) => {
  const { property_id, check_in, check_out } = req.query;
  if (!property_id || !check_in || !check_out)
    return res.status(400).json({ error: "property_id, check_in, and check_out are required" });
  try {
    const blocked = await pool.query(
      `SELECT id FROM short_stay_blocked_dates
       WHERE property_id = $1 AND blocked_date >= $2::date AND blocked_date < $3::date`,
      [property_id, check_in, check_out]
    );
    const booked = await pool.query(
      `SELECT id FROM short_stay_bookings
       WHERE property_id = $1 AND status NOT IN ('cancelled')
         AND check_in < $3::date AND check_out > $2::date`,
      [property_id, check_in, check_out]
    );
    return res.json({ available: blocked.rows.length === 0 && booked.rows.length === 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /short-stays/blocked/:property_id
router.get("/blocked/:property_id", async (req, res) => {
  try {
    const { property_id } = req.params;
    const blocked = await pool.query(
      `SELECT blocked_date FROM short_stay_blocked_dates
       WHERE property_id = $1 ORDER BY blocked_date`,
      [property_id]
    );
    const booked = await pool.query(
      `SELECT check_in, check_out FROM short_stay_bookings
       WHERE property_id = $1 AND status NOT IN ('cancelled')`,
      [property_id]
    );
    const bookedDates = [];
    for (const row of booked.rows) {
      const cur = new Date(row.check_in);
      const end = new Date(row.check_out);
      while (cur < end) {
        bookedDates.push(cur.toISOString().split("T")[0]);
        cur.setDate(cur.getDate() + 1);
      }
    }
    const blockedDates = blocked.rows.map(r => r.blocked_date.toISOString().split("T")[0]);
    return res.json({ blocked: [...new Set([...blockedDates, ...bookedDates])] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /short-stays/block — host blocks or unblocks dates
router.post("/block", authenticate, async (req, res) => {
  const { property_id, dates, action = "block" } = req.body;
  if (!property_id || !Array.isArray(dates) || dates.length === 0)
    return res.status(400).json({ error: "property_id and dates[] are required" });
  try {
    const prop = await pool.query(
      `SELECT id, created_by FROM properties WHERE id = $1`,
      [property_id]
    );
    if (prop.rows.length === 0)
      return res.status(404).json({ error: "Property not found" });
    if (prop.rows[0].created_by !== req.user.id && req.user.role !== 1)
      return res.status(403).json({ error: "Not authorised" });

    if (action === "unblock") {
      await pool.query(
        `DELETE FROM short_stay_blocked_dates
         WHERE property_id = $1 AND blocked_date = ANY($2::date[])`,
        [property_id, dates]
      );
    } else {
      for (const date of dates) {
        await pool.query(
          `INSERT INTO short_stay_blocked_dates (property_id, blocked_date)
           VALUES ($1, $2::date)
           ON CONFLICT (property_id, blocked_date) DO NOTHING`,
          [property_id, date]
        );
      }
    }
    return res.json({ message: `Dates ${action}ed successfully`, count: dates.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /short-stays/book — guest books a stay
router.post("/book", authenticate, async (req, res) => {
  const { property_id, check_in, check_out, guests = 1, phone_number, provider = "mtn", message } = req.body;
  if (!property_id || !check_in || !check_out || !phone_number)
    return res.status(400).json({ error: "property_id, check_in, check_out, and phone_number are required" });
  try {
    const propResult = await pool.query(
      `SELECT p.*, u.first_name AS host_first_name, u.last_name AS host_last_name,
              u.email AS host_email, u.phone_number AS host_phone
       FROM properties p
       JOIN users u ON u.id = p.created_by
       WHERE p.id = $1 AND p.status = 'approved' AND p.deleted_at IS NULL`,
      [property_id]
    );
    if (propResult.rows.length === 0)
      return res.status(404).json({ error: "Property not found or not approved" });

    const property = propResult.rows[0];

    if (property.transaction_type_id !== 3)
      return res.status(400).json({ error: "This property is not listed as a short stay" });

    const blocked = await pool.query(
      `SELECT id FROM short_stay_blocked_dates
       WHERE property_id = $1 AND blocked_date >= $2::date AND blocked_date < $3::date`,
      [property_id, check_in, check_out]
    );
    const booked = await pool.query(
      `SELECT id FROM short_stay_bookings
       WHERE property_id = $1 AND status NOT IN ('cancelled')
         AND check_in < $3::date AND check_out > $2::date`,
      [property_id, check_in, check_out]
    );
    if (blocked.rows.length > 0 || booked.rows.length > 0)
      return res.status(409).json({ error: "Selected dates are no longer available" });

    const dailyRate = property.amenities?.daily_rate || 0;
    const nights = Math.max(
      1,
      Math.round((new Date(check_out) - new Date(check_in)) / 86400000)
    );
    const totalAmount = dailyRate * nights;

    const booking = await pool.query(
      `INSERT INTO short_stay_bookings
         (property_id, guest_id, host_id, check_in, check_out, guests,
          total_amount, phone_number, provider, message, status, payment_status)
       VALUES ($1,$2,$3,$4::date,$5::date,$6,$7,$8,$9,$10,'pending','pending')
       RETURNING *`,
      [property_id, req.user.id, property.created_by, check_in, check_out,
       guests, totalAmount, phone_number, provider, message || null]
    );

    const guestResult = await pool.query(
      `SELECT first_name, last_name, email, phone_number FROM users WHERE id = $1`,
      [req.user.id]
    );
    const guest = guestResult.rows[0];

    try {
      await sendShortStayBookingToHost({
        hostEmail: property.host_email,
        hostFirstName: property.host_first_name,
        guestName: `${guest.first_name} ${guest.last_name}`,
        guestEmail: guest.email,
        guestPhone: guest.phone_number || phone_number,
        propertyTitle: property.title,
        checkIn: check_in, checkOut: check_out,
        nights, guests, totalAmount,
        currency: property.currency || "UGX",
        message,
      });
      await sendShortStayConfirmationToGuest({
        guestEmail: guest.email,
        guestFirstName: guest.first_name,
        propertyTitle: property.title,
        checkIn: check_in, checkOut: check_out,
        nights, guests, totalAmount,
        currency: property.currency || "UGX",
        hostName: `${property.host_first_name} ${property.host_last_name}`,
        hostEmail: property.host_email,
        hostPhone: property.host_phone,
      });
    } catch (emailErr) {
      console.error("Short stay email failed:", emailErr.message);
    }

    return res.status(201).json({ booking: booking.rows[0], nights, totalAmount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /short-stays/mine — guest's bookings
router.get("/mine", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, p.title AS property_title, p.images AS property_images,
              p.location AS property_location, p.currency,
              u.first_name AS host_first_name, u.last_name AS host_last_name,
              u.email AS host_email, u.phone_number AS host_phone
       FROM short_stay_bookings b
       JOIN properties p ON p.id = b.property_id
       JOIN users u ON u.id = b.host_id
       WHERE b.guest_id = $1 ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /short-stays/hosted — host's incoming bookings
router.get("/hosted", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, p.title AS property_title, p.location AS property_location, p.currency,
              u.first_name AS guest_first_name, u.last_name AS guest_last_name,
              u.email AS guest_email, u.phone_number AS guest_phone
       FROM short_stay_bookings b
       JOIN properties p ON p.id = b.property_id
       JOIN users u ON u.id = b.guest_id
       WHERE b.host_id = $1 ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /short-stays/:id/status — host confirms/cancels/completes
router.put("/:id/status", authenticate, async (req, res) => {
  const { status } = req.body;
  if (!["confirmed", "cancelled", "completed"].includes(status))
    return res.status(400).json({ error: "Invalid status" });
  try {
    const existing = await pool.query(
      `SELECT * FROM short_stay_bookings WHERE id = $1`, [req.params.id]
    );
    if (existing.rows.length === 0)
      return res.status(404).json({ error: "Booking not found" });
    if (existing.rows[0].host_id !== req.user.id && req.user.role !== 1)
      return res.status(403).json({ error: "Not authorised" });
    const updated = await pool.query(
      `UPDATE short_stay_bookings SET status = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    return res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /short-stays/:id — guest cancels pending booking
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const existing = await pool.query(
      `SELECT * FROM short_stay_bookings WHERE id = $1`, [req.params.id]
    );
    if (existing.rows.length === 0)
      return res.status(404).json({ error: "Booking not found" });
    const b = existing.rows[0];
    if (b.guest_id !== req.user.id && req.user.role !== 1)
      return res.status(403).json({ error: "Not authorised" });
    if (b.status === "confirmed")
      return res.status(400).json({ error: "Confirmed bookings cannot be deleted. Ask the host to cancel." });
    await pool.query(`DELETE FROM short_stay_bookings WHERE id = $1`, [req.params.id]);
    return res.json({ message: "Booking deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;