import express from "express";
import crypto from "crypto";
import pool from "../db.js";
import { authenticate } from "../../middleware/auth.js";
import { Resend } from "resend";

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const isAdmin = (role) => [3, 4].includes(Number(role));

// POST /newsletter/subscribe
router.post("/subscribe", async (req, res) => {
  const { email, first_name } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email is required" });
  }
  try {
    const unsubToken = crypto.randomBytes(32).toString("hex");

    await pool.query(
      `INSERT INTO newsletter_subscribers (email, first_name, token, is_active)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (email) DO UPDATE
       SET is_active = true, first_name = COALESCE($2, newsletter_subscribers.first_name), updated_at = NOW()`,
      [email.toLowerCase().trim(), first_name || null, unsubToken]
    );

    // Send welcome email
    try {
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: "You're subscribed to Stonepath updates",
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#0a0a0b;color:#fff;">
            <h1 style="font-size:22px;color:#c9a84c;margin-bottom:24px;">Stonepath™</h1>
            <h2 style="font-size:20px;font-weight:400;margin-bottom:12px;">You're on the list${first_name ? `, ${first_name}` : ""}!</h2>
            <p style="color:#8892a4;line-height:1.6;margin-bottom:24px;">
              You'll now receive updates about new property listings, short stay openings, and exclusive offers on Stonepath Estates.
            </p>
            <a href="${FRONTEND_URL}" style="background:#c9a84c;color:#000;padding:14px 32px;text-decoration:none;font-weight:600;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;display:inline-block;">
              Browse Listings
            </a>
            <p style="color:#555;font-size:12px;margin-top:32px;">
              Don't want these emails?
              <a href="${FRONTEND_URL}/unsubscribe?token=${unsubToken}" style="color:#c9a84c;">Unsubscribe here</a>
            </p>
          </div>`,
      });
    } catch (emailErr) {
      console.error("Newsletter welcome email failed:", emailErr.message);
    }

    res.json({ message: "Subscribed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

// GET /newsletter/unsubscribe?token=
router.get("/unsubscribe", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "Invalid unsubscribe link" });
  try {
    await pool.query(
      "UPDATE newsletter_subscribers SET is_active = false WHERE token = $1",
      [token]
    );
    res.json({ message: "Unsubscribed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to unsubscribe" });
  }
});

// POST /newsletter/send — admin sends a broadcast
// Body: { subject, html_body, property_id? }
router.post("/send", authenticate, async (req, res) => {
  if (!isAdmin(req.user.role)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  const { subject, html_body } = req.body;
  if (!subject || !html_body) {
    return res.status(400).json({ error: "Subject and body are required" });
  }
  try {
    const subscribers = await pool.query(
      "SELECT email, first_name, token FROM newsletter_subscribers WHERE is_active = true"
    );

    if (subscribers.rows.length === 0) {
      return res.json({ message: "No active subscribers", sent: 0 });
    }

    let sent = 0;
    let failed = 0;

    // Send in batches of 50 to avoid rate limits
    const BATCH = 50;
    for (let i = 0; i < subscribers.rows.length; i += BATCH) {
      const batch = subscribers.rows.slice(i, i + BATCH);
      await Promise.allSettled(batch.map(async (sub) => {
        try {
          await resend.emails.send({
            from: FROM,
            to: sub.email,
            subject,
            html: `
              <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#0a0a0b;color:#fff;">
                <h1 style="font-size:22px;color:#c9a84c;margin-bottom:24px;">Stonepath™</h1>
                ${html_body}
                <hr style="border-color:#333;margin:32px 0;" />
                <p style="color:#555;font-size:12px;">
                  You're receiving this because you subscribed to Stonepath property alerts.
                  <a href="${FRONTEND_URL}/unsubscribe?token=${sub.token}" style="color:#c9a84c;">Unsubscribe</a>
                </p>
              </div>`,
          });
          sent++;
        } catch {
          failed++;
        }
      }));
    }

    res.json({ message: `Broadcast sent`, sent, failed, total: subscribers.rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send broadcast" });
  }
});

// GET /newsletter/subscribers — admin view
router.get("/subscribers", authenticate, async (req, res) => {
  if (!isAdmin(req.user.role)) return res.status(403).json({ error: "Admin access required" });
  try {
    const result = await pool.query(
      "SELECT id, email, first_name, is_active, created_at FROM newsletter_subscribers ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch subscribers" });
  }
});

// POST /newsletter/notify-new-property — called internally after property approved
router.post("/notify-new-property", authenticate, async (req, res) => {
  if (!isAdmin(req.user.role)) return res.status(403).json({ error: "Admin access required" });
  const { property_id } = req.body;
  if (!property_id) return res.status(400).json({ error: "property_id required" });

  try {
    const prop = await pool.query(
      `SELECT p.*, u.first_name as agent_first, u.last_name as agent_last
       FROM properties p JOIN users u ON u.id = p.created_by
       WHERE p.id = $1`,
      [property_id]
    );
    if (prop.rows.length === 0) return res.status(404).json({ error: "Property not found" });
    const p = prop.rows[0];

    const price = p.amenities?.price || p.amenities?.daily_rate || 0;
    const currency = p.currency || "UGX";
    const priceLabel = price
      ? `${currency} ${price >= 1000000 ? `${(price / 1000000).toFixed(1)}M` : `${(price / 1000).toFixed(0)}K`}`
      : "Price on Request";
    const typeLabel = p.transaction_type_id === 3 ? "Short Stay" : p.transaction_type_id === 2 ? "For Rent" : "For Sale";
    const image = p.images?.[0] || "";

    const html_body = `
      <h2 style="font-size:20px;font-weight:400;color:#fff;margin-bottom:8px;">New Listing: ${p.title}</h2>
      <p style="color:#8892a4;margin-bottom:16px;">📍 ${p.location}${p.district ? `, ${p.district}` : ""}</p>
      ${image ? `<img src="${image}" style="width:100%;height:200px;object-fit:cover;margin-bottom:16px;" />` : ""}
      <div style="background:#1a1a1a;padding:16px;margin-bottom:16px;">
        <div style="color:#c9a84c;font-size:22px;font-weight:600;margin-bottom:8px;">${priceLabel}</div>
        <div style="color:#8892a4;font-size:13px;">${typeLabel}${p.bedrooms ? ` · ${p.bedrooms} beds` : ""}${p.bathrooms ? ` · ${p.bathrooms} baths` : ""}</div>
      </div>
      <p style="color:#8892a4;line-height:1.6;margin-bottom:24px;">${(p.description || "").slice(0, 200)}${(p.description || "").length > 200 ? "..." : ""}</p>
      <a href="${FRONTEND_URL}" style="background:#c9a84c;color:#000;padding:14px 32px;text-decoration:none;font-weight:600;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;display:inline-block;">
        View Property
      </a>`;

    // Reuse the send route logic inline
    const subscribers = await pool.query(
      "SELECT email, first_name, token FROM newsletter_subscribers WHERE is_active = true"
    );

    let sent = 0;
    const BATCH = 50;
    for (let i = 0; i < subscribers.rows.length; i += BATCH) {
      const batch = subscribers.rows.slice(i, i + BATCH);
      await Promise.allSettled(batch.map(async (sub) => {
        try {
          await resend.emails.send({
            from: FROM,
            to: sub.email,
            subject: `New on Stonepath: ${p.title}`,
            html: `
              <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#0a0a0b;color:#fff;">
                <h1 style="font-size:22px;color:#c9a84c;margin-bottom:24px;">Stonepath™</h1>
                ${html_body}
                <hr style="border-color:#333;margin:32px 0;" />
                <p style="color:#555;font-size:12px;">
                  You're receiving this because you subscribed to Stonepath property alerts.
                  <a href="${FRONTEND_URL}/unsubscribe?token=${sub.token}" style="color:#c9a84c;">Unsubscribe</a>
                </p>
              </div>`,
          });
          sent++;
        } catch { /* silent */ }
      }));
    }

    res.json({ message: `Notified ${sent} subscribers about "${p.title}"` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send property notifications" });
  }
});

export default router;