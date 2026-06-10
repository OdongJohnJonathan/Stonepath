import express from "express";
import pool from "../db.js";
import { authenticate } from "../../middleware/auth.js";

const router = express.Router();

// Middleware — admin only
const adminOnly = (req, res, next) => {
  if (Number(req.user.role) !== 1) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// GET /admin/users — list all users
router.get("/users", authenticate, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone_number,
              role, is_verified, is_active, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// PUT /admin/users/:id/role — change user role
router.put("/users/:id/role", authenticate, adminOnly, async (req, res) => {
  const { role } = req.body;
  const allowed = [2, 3]; // admins can only assign agent or buyer

  if (!allowed.includes(Number(role))) {
    return res.status(400).json({ error: "Invalid role. Use 2 (Agent) or 3 (Buyer)" });
  }

  // Prevent admin from changing their own role
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

// PUT /admin/users/:id/deactivate — ban or unban a user
router.put("/users/:id/deactivate", authenticate, adminOnly, async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "You cannot deactivate your own account" });
  }

  try {
    // Toggle is_active
    const result = await pool.query(
      `UPDATE users
       SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1
       RETURNING id, first_name, last_name, email, is_active`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    const { is_active } = result.rows[0];
    res.json({ ...result.rows[0], message: is_active ? "User activated" : "User deactivated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user status" });
  }
});

// PUT /admin/users/:id/verify — manually verify a user's email
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

// PUT /admin/users/:id/verify-agent — grant verified agent badge
router.put("/users/:id/verify-agent", authenticate, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users SET is_agent_verified = NOT is_agent_verified, updated_at = NOW()
       WHERE id = $1 AND role = 2
       RETURNING id, first_name, last_name, email, is_agent_verified`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Agent not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update agent verification" });
  }
});

// PUT /admin/users/:id/premium — grant or revoke premium
router.put("/users/:id/premium", authenticate, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users SET is_premium = NOT is_premium, updated_at = NOW()
       WHERE id = $1
       RETURNING id, first_name, last_name, email, is_premium`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update premium status" });
  }
});

export default router;