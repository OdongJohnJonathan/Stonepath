import express from "express";
import { body, validationResult } from "express-validator";
import { authenticate } from "../../middleware/auth.js";
import pool from "../db.js";

const router = express.Router();

// GET /users/me — get your own profile
router.get("/me", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone_number,
              role, is_verified, profile_image_url, created_at
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

// PUT /users/me — update your own profile
router.put("/me", authenticate, [
  body("first_name").optional().notEmpty().withMessage("First name cannot be empty"),
  body("last_name").optional().notEmpty().withMessage("Last name cannot be empty"),
  body("phone_number").optional().isMobilePhone().withMessage("Invalid phone number"),
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
       RETURNING id, first_name, last_name, email, phone_number, profile_image_url`,
      [first_name, last_name, phone_number, profile_image_url, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;