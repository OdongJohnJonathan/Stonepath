import express from "express";
import { body, validationResult } from "express-validator";
import { authenticate } from "../../middleware/auth.js";
import pool from "../db.js";
import { sendInspectionNotificationToAgent, sendInspectionConfirmationToBuyer } from "../../utils/email.js";

const router = express.Router();

const INSPECTION_FEE = 2000; // UGX

// POST /inspections — buyer books inspection
router.post("/", authenticate, [
  body("property_id").notEmpty(),
  body("preferred_date").notEmpty().withMessage("Preferred date is required"),
  body("preferred_time").notEmpty().withMessage("Preferred time is required"),
  body("phone_number").notEmpty().withMessage("Phone number is required"),
  body("provider").notEmpty().withMessage("Payment provider is required"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
], async (req, res) => {
  try {
    const { property_id, preferred_date, preferred_time, message, phone_number, provider } = req.body;

    // Get property + agent info
    const prop = await pool.query(
      `SELECT p.id, p.title, p.created_by,
              u.first_name as agent_first, u.last_name as agent_last,
              u.email as agent_email, u.phone_number as agent_phone
       FROM properties p
       JOIN users u ON p.created_by = u.id
       WHERE p.id = $1 AND p.deleted_at IS NULL`,
      [property_id]
    );

    if (prop.rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    const property = prop.rows[0];

    if (property.created_by === req.user.id) {
      return res.status(400).json({ error: "You cannot book an inspection for your own property" });
    }

    // Get buyer info
    const buyer = await pool.query(
      "SELECT first_name, last_name, email, phone_number FROM users WHERE id = $1",
      [req.user.id]
    );
    const buyerData = buyer.rows[0];

    // Create inspection record
    const result = await pool.query(
      `INSERT INTO inspections
        (property_id, buyer_id, agent_id, preferred_date, preferred_time,
         message, payment_phone, payment_provider, amount, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        property_id, req.user.id, property.created_by,
        preferred_date, preferred_time, message || null,
        phone_number, provider, INSPECTION_FEE
      ]
    );

    const inspection = result.rows[0];

    // In development — auto confirm payment
    if (process.env.NODE_ENV !== 'production') {
      await pool.query(
        `UPDATE inspections SET payment_status = 'paid', status = 'confirmed', updated_at = NOW()
         WHERE id = $1`,
        [inspection.id]
      );
      inspection.payment_status = 'paid';
      inspection.status = 'confirmed';
    }

    // Send emails
    try {
      await sendInspectionNotificationToAgent({
        agentEmail: property.agent_email,
        agentFirstName: property.agent_first,
        buyerName: `${buyerData.first_name} ${buyerData.last_name}`,
        buyerEmail: buyerData.email,
        buyerPhone: buyerData.phone_number || phone_number,
        propertyTitle: property.title,
        preferredDate: preferred_date,
        preferredTime: preferred_time,
        message: message || '',
      });
    } catch (emailErr) {
      console.error('Failed to send inspection email to agent:', emailErr.message);
    }

    try {
      await sendInspectionConfirmationToBuyer({
        buyerEmail: buyerData.email,
        buyerFirstName: buyerData.first_name,
        propertyTitle: property.title,
        preferredDate: preferred_date,
        preferredTime: preferred_time,
        agentName: `${property.agent_first} ${property.agent_last}`,
        agentEmail: property.agent_email,
        agentPhone: property.agent_phone,
      });
    } catch (emailErr) {
      console.error('Failed to send inspection confirmation to buyer:', emailErr.message);
    }

    res.status(201).json(inspection);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to book inspection" });
  }
});

// GET /inspections/mine — buyer sees their bookings
router.get("/mine", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*,
              p.title as property_title,
              p.images as property_images,
              p.location as property_location,
              u.first_name || ' ' || u.last_name as agent_name,
              u.email as agent_email,
              u.phone_number as agent_phone
       FROM inspections i
       JOIN properties p ON i.property_id = p.id
       JOIN users u ON i.agent_id = u.id
       WHERE i.buyer_id = $1
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch inspections" });
  }
});

// GET /inspections — agent sees inspection requests
router.get("/", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*,
              p.title as property_title,
              p.images as property_images,
              p.location as property_location,
              u.first_name || ' ' || u.last_name as buyer_name,
              u.email as buyer_email,
              u.phone_number as buyer_phone
       FROM inspections i
       JOIN properties p ON i.property_id = p.id
       JOIN users u ON i.buyer_id = u.id
       WHERE i.agent_id = $1
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch inspections" });
  }
});

// PUT /inspections/:id/status — agent confirms or cancels
router.put("/:id/status", authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["confirmed", "cancelled", "completed"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const result = await pool.query(
      `UPDATE inspections SET status = $1, updated_at = NOW()
       WHERE id = $2 AND agent_id = $3 RETURNING *`,
      [status, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Inspection not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update inspection" });
  }
});

export default router;