import express from "express";
import { authenticate } from "../../middleware/auth.js";
import pool from "../db.js";

const router = express.Router();

// GET /saved — get all properties saved by logged-in user
router.get("/", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*
       FROM saved_properties sp
       JOIN properties p ON sp.property_id = p.id
       WHERE sp.user_id = $1
       ORDER BY sp.saved_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch saved properties" });
  }
});

// POST /saved/:propertyId — save a property
router.post("/:propertyId", authenticate, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO saved_properties (user_id, property_id, saved_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, property_id) DO NOTHING`,
      [req.user.id, req.params.propertyId]
    );

    res.status(201).json({ message: "Property saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save property" });
  }
});

// DELETE /saved/:propertyId — unsave a property
router.delete("/:propertyId", authenticate, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM saved_properties
       WHERE user_id = $1 AND property_id = $2`,
      [req.user.id, req.params.propertyId]
    );

    res.json({ message: "Property removed from saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove saved property" });
  }
});

export default router;