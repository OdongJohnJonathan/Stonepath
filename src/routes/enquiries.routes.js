import express from "express";
import { body, validationResult } from "express-validator";
import { authenticate } from "../../middleware/auth.js";
import pool from "../db.js";

const router = express.Router();

// POST /enquiries — buyer sends enquiry about a property
router.post("/", authenticate, [
  body("property_id").notEmpty(),
  body("message").notEmpty().withMessage("Message is required"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
], async (req, res) => {
  try {
    const { property_id, message } = req.body;

    const prop = await pool.query(
      "SELECT id, created_by FROM properties WHERE id = $1 AND deleted_at IS NULL",
      [property_id]
    );
    if (prop.rows.length === 0) return res.status(404).json({ error: "Property not found" });

    // Prevent agents from enquiring about their own property
    if (prop.rows[0].created_by === req.user.id) {
      return res.status(400).json({ error: "You cannot enquire about your own property" });
    }

    const result = await pool.query(
      `INSERT INTO enquiries (buyer_id, property_id, agent_id, message, status, created_at)
       VALUES ($1, $2, $3, $4, 'pending', NOW()) RETURNING *`,
      [req.user.id, property_id, prop.rows[0].created_by, message]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send enquiry" });
  }
});

// GET /enquiries/mine — buyer sees their own sent enquiries
router.get("/mine", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*,
              p.title as property_title,
              p.images as property_images,
              p.location as property_location,
              u.first_name || ' ' || u.last_name as agent_name,
              u.email as agent_email,
              u.phone_number as agent_phone
       FROM enquiries e
       JOIN properties p ON e.property_id = p.id
       JOIN users u ON e.agent_id = u.id
       WHERE e.buyer_id = $1
       ORDER BY e.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch your enquiries" });
  }
});

// GET /enquiries — agent sees enquiries for their listings
router.get("/", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*,
              p.title as property_title,
              p.images as property_images,
              p.location as property_location,
              u.first_name || ' ' || u.last_name as buyer_name,
              u.email as buyer_email,
              u.phone_number as buyer_phone
       FROM enquiries e
       JOIN properties p ON e.property_id = p.id
       JOIN users u ON e.buyer_id = u.id
       WHERE e.agent_id = $1
       ORDER BY e.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch enquiries" });
  }
});

// PUT /enquiries/:id/reply — agent replies to an enquiry
router.put("/:id/reply", authenticate, [
  body("reply").notEmpty().withMessage("Reply message is required"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
], async (req, res) => {
  try {
    const { reply } = req.body;

    const result = await pool.query(
      `UPDATE enquiries
       SET reply = $1, status = 'responded', updated_at = NOW()
       WHERE id = $2 AND agent_id = $3
       RETURNING *`,
      [reply, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Enquiry not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send reply" });
  }
});

// PUT /enquiries/:id/status — agent updates status
router.put("/:id/status", authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "responded", "closed"];
    if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });

    const result = await pool.query(
      `UPDATE enquiries SET status = $1, updated_at = NOW()
       WHERE id = $2 AND agent_id = $3 RETURNING *`,
      [status, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Enquiry not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

export default router;