import express from "express";
import { body, validationResult } from "express-validator";
import { authenticate } from "../../middleware/auth.js";
import pool from "../db.js";

const router = express.Router();

router.get("/me", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone_number,
              role, is_verified, is_active, is_premium,
              is_agent_verified, listing_count, premium_expires_at,
              profile_image_url, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.put("/me", authenticate, [
  body("first_name").optional().notEmpty(),
  body("last_name").optional().notEmpty(),
  body("phone_number").optional().isMobilePhone(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
], async (req, res) => {
  try {
    const { first_name, last_name, phone_number, profile_image_url } = req.body;
    const result = await pool.query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name  = COALESCE($2, last_name),
           phone_number = COALESCE($3, phone_number),
           profile_image_url = COALESCE($4, profile_image_url),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, first_name, last_name, email, phone_number,
                 role, is_verified, is_active, is_premium,
                 is_agent_verified, listing_count, premium_expires_at,
                 profile_image_url, created_at`,
      [first_name, last_name, phone_number, profile_image_url, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// PUT /users/me/password — change own password
router.put("/me/password", authenticate, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: "Current and new password are required" });
  }
  if (new_password.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters" });
  }
  try {
    const result = await pool.query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });

    const { comparePassword, hashPassword } = await import("../../utils/hash.js");
    const valid = await comparePassword(current_password, result.rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: "Current password is incorrect" });

    const newHash = await hashPassword(new_password);
    await pool.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [newHash, req.user.id]);
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

export default router;