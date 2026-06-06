import express from "express";
import { body, validationResult } from "express-validator";
import { authenticate } from "../../middleware/auth.js";
import pool from "../db.js";
import {
  getProperties,
  createProperty,
  updateProperty,
  deleteProperty
} from "../controllers/properties.controller.js";

const router = express.Router();

const validateProperty = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('bedrooms').isInt({ min: 0 }).withMessage('Bedrooms must be a number'),
  body('bathrooms').isInt({ min: 0 }).withMessage('Bathrooms must be a number'),
  body('property_type_id').isInt().withMessage('Property type is required'),
  body('transaction_type_id').isInt().withMessage('Transaction type is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

// Admin only — approve a property
router.put("/:id/approve", authenticate, async (req, res) => {
  try {
    if (Number(req.user.role) !== 1) {
      return res.status(403).json({ error: "Only admins can approve properties" });
    }

    const result = await pool.query(
      `UPDATE properties SET status = 'approved', updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to approve property" });
  }
});

router.get("/", getProperties);
router.post("/", authenticate, validateProperty, createProperty);
router.put("/:id", authenticate, updateProperty);
router.delete("/:id", authenticate, deleteProperty);

// Agent/Admin — toggle availability (available / taken)
router.put("/:id/availability", authenticate, async (req, res) => {
  try {
    const { availability } = req.body; // 'available' or 'taken'
    const allowed = ["available", "taken"];
    if (!allowed.includes(availability)) {
      return res.status(400).json({ error: "Invalid availability status" });
    }

    // Only the owner or admin can update
    const prop = await pool.query(
      "SELECT created_by FROM properties WHERE id = $1 AND deleted_at IS NULL",
      [req.params.id]
    );
    if (prop.rows.length === 0) return res.status(404).json({ error: "Property not found" });
    if (Number(req.user.role) !== 1 && prop.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: "Not authorised" });
    }

    const result = await pool.query(
      `UPDATE properties SET amenities = amenities || $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [JSON.stringify({ availability }), req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update availability" });
  }
});

// Agent/Admin — delete a property
router.delete("/:id", authenticate, async (req, res) => {
  try {
    // Only the owner or admin can delete
    const prop = await pool.query(
      "SELECT created_by FROM properties WHERE id = $1 AND deleted_at IS NULL",
      [req.params.id]
    );
    if (prop.rows.length === 0) return res.status(404).json({ error: "Property not found" });
    if (Number(req.user.role) !== 1 && prop.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: "Not authorised" });
    }

    await pool.query(
      "UPDATE properties SET deleted_at = NOW() WHERE id = $1",
      [req.params.id]
    );

    res.json({ message: "Property deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete property" });
  }
});

export default router;