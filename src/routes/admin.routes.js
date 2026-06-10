import express from "express";
import pool from "../db.js";
import { authenticate } from "../../middleware/auth.js";

const router = express.Router();

const adminOnly = (req, res, next) => {
  if (Number(req.user.role) !== 1) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// GET all users
router.get("/users", authenticate, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone_number,
              role, is_verified, is_active, is_agent_verified,
              is_premium, listing_count, premium_expires_at, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Change role
router.put("/users/:id/role", authenticate, adminOnly, async (req, res) => {
  const { role } = req.body;
  if (![2, 3].includes(Number(role))) {
    return res.status(400).json({ error: "Invalid role" });
  }
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "You cannot change your own role" });
  }
  try {
    const result = await pool.query(
      `UPDATE users SET role = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, first_name, last_name, email, role`,
      [role, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update role" });
  }
});

// Ban / Unban
router.put("/users/:id/deactivate", authenticate, adminOnly, async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "You cannot deactivate your own account" });
  }
  try {
    const result = await pool.query(
      `UPDATE users SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1
       RETURNING id, first_name, last_name, email, is_active`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user status" });
  }
});

// Manually verify email
router.put("/users/:id/verify", authenticate, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users
       SET is_verified = true,
           verification_token = NULL,
           verification_token_expires = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, first_name, last_name, email, is_verified`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to verify user" });
  }
});

// Toggle verified agent badge
router.put("/users/:id/verify-agent", authenticate, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users SET is_agent_verified = NOT is_agent_verified, updated_at = NOW()
       WHERE id = $1 AND role = 2
       RETURNING id, first_name, last_name, email, is_agent_verified`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Agent not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update agent verification" });
  }
});

// Toggle premium
router.put("/users/:id/premium", authenticate, adminOnly, async (req, res) => {
  try {
    const current = await pool.query(
      "SELECT is_premium FROM users WHERE id = $1",
      [req.params.id]
    );
    if (current.rows.length === 0) return res.status(404).json({ error: "User not found" });

    const newPremium = !current.rows[0].is_premium;

    // If granting premium, set expiry to 1 year from now
    // If revoking, clear expiry
    const expiresAt = newPremium
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : null;

    const result = await pool.query(
      `UPDATE users
       SET is_premium = $1, premium_expires_at = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, first_name, last_name, email, is_premium, premium_expires_at`,
      [newPremium, expiresAt, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update premium status" });
  }
});

export default router;