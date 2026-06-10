import express from "express";
import { body, validationResult } from "express-validator";
import { authenticate } from "../../middleware/auth.js";
import pool from "../db.js";
import {
  sendEnquiryNotificationToAgent,
  sendReplyNotificationToBuyer,
} from "../../utils/email.js";

const router = express.Router();

// POST /enquiries — buyer sends enquiry
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

    // Get property + agent info
    const prop = await pool.query(
      `SELECT p.id, p.title, p.created_by,
              u.first_name as agent_first, u.last_name as agent_last,
              u.email as agent_email
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
      return res.status(400).json({ error: "You cannot enquire about your own property" });
    }

    // Get buyer info
    const buyer = await pool.query(
      `SELECT first_name, last_name, email, phone_number
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    const buyerData = buyer.rows[0];

    // Save enquiry
    const result = await pool.query(
      `INSERT INTO enquiries (buyer_id, property_id, agent_id, message, status, created_at)
       VALUES ($1, $2, $3, $4, 'pending', NOW()) RETURNING *`,
      [req.user.id, property_id, property.created_by, message]
    );

    // Send email to agent (don't block response if it fails)
    try {
      await sendEnquiryNotificationToAgent({
        agentEmail: property.agent_email,
        agentFirstName: property.agent_first,
        buyerName: `${buyerData.first_name} ${buyerData.last_name}`,
        buyerEmail: buyerData.email,
        buyerPhone: buyerData.phone_number,
        propertyTitle: property.title,
        message,
      });
    } catch (emailErr) {
      console.error('Failed to send enquiry email to agent:', emailErr.message);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send enquiry" });
  }
});

// GET /enquiries/mine — buyer sees their sent enquiries
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

// PUT /enquiries/:id/reply — agent replies
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

    // Get full enquiry details for the email
    const enquiryResult = await pool.query(
      `SELECT e.*,
              p.title as property_title,
              buyer.first_name as buyer_first,
              buyer.last_name as buyer_last,
              buyer.email as buyer_email,
              agent.first_name as agent_first,
              agent.last_name as agent_last,
              agent.email as agent_email,
              agent.phone_number as agent_phone
       FROM enquiries e
       JOIN properties p ON e.property_id = p.id
       JOIN users buyer ON e.buyer_id = buyer.id
       JOIN users agent ON e.agent_id = agent.id
       WHERE e.id = $1 AND e.agent_id = $2`,
      [req.params.id, req.user.id]
    );

    if (enquiryResult.rows.length === 0) {
      return res.status(404).json({ error: "Enquiry not found" });
    }

    const enquiry = enquiryResult.rows[0];

    // Save reply
    const result = await pool.query(
      `UPDATE enquiries
       SET reply = $1, status = 'responded', updated_at = NOW()
       WHERE id = $2 AND agent_id = $3
       RETURNING *`,
      [reply, req.params.id, req.user.id]
    );

    // Send email to buyer
    try {
      await sendReplyNotificationToBuyer({
        buyerEmail: enquiry.buyer_email,
        buyerFirstName: enquiry.buyer_first,
        agentName: `${enquiry.agent_first} ${enquiry.agent_last}`,
        agentEmail: enquiry.agent_email,
        agentPhone: enquiry.agent_phone,
        propertyTitle: enquiry.property_title,
        originalMessage: enquiry.message,
        reply,
      });
    } catch (emailErr) {
      console.error('Failed to send reply email to buyer:', emailErr.message);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send reply" });
  }
});

// PUT /enquiries/:id/status — update status
router.put("/:id/status", authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "responded", "closed"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const result = await pool.query(
      `UPDATE enquiries SET status = $1, updated_at = NOW()
       WHERE id = $2 AND agent_id = $3 RETURNING *`,
      [status, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Enquiry not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

export default router;