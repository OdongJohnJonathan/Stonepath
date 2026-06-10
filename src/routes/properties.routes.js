import express from "express";
import { body, validationResult } from "express-validator";
import { authenticate } from "../../middleware/auth.js";
import pool from "../db.js";
import { checkAndVerifyAgent } from '../utils/agentVerification.js';
import {
  getProperties,
  createProperty,
  updateProperty,
  deleteProperty
} from "../controllers/properties.controller.js";

const router = express.Router();

const FREE_LISTING_LIMIT = 3;

const validateProperty = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('property_type_id').isInt().withMessage('Property type is required'),
  body('transaction_type_id').isInt().withMessage('Transaction type is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

// GET all properties
router.get("/", getProperties);

// POST — create property with free limit check
router.post("/", authenticate, validateProperty, async (req, res, next) => {
  try {
    if (Number(req.user.role) === 2) {
      const user = await pool.query(
        'SELECT is_premium FROM users WHERE id = $1',
        [req.user.id]
      );

      if (!user.rows[0].is_premium) {
        // Count all active (non-deleted) properties by this agent
        const countResult = await pool.query(
          `SELECT COUNT(*) FROM properties
           WHERE created_by = $1 AND deleted_at IS NULL`,
          [req.user.id]
        );
        const activeCount = parseInt(countResult.rows[0].count);

        if (activeCount >= FREE_LISTING_LIMIT) {
          return res.status(403).json({
            error: `Free accounts are limited to ${FREE_LISTING_LIMIT} listings. Upgrade to premium to list more properties.`,
            upgrade_required: true,
          });
        }
      }
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check listing limit" });
  }
}, createProperty);


// PUT — update property
router.put("/:id", authenticate, updateProperty);

// DELETE — soft delete
router.delete("/:id", authenticate, async (req, res) => {
  try {
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

    // Decrement listing count for agents
    if (Number(req.user.role) === 2) {
      await pool.query(
        "UPDATE users SET listing_count = GREATEST(listing_count - 1, 0) WHERE id = $1",
        [req.user.id]
      );
    }

    res.json({ message: "Property deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete property" });
  }
});

// PUT — approve property
router.put("/:id/approve", authenticate, async (req, res) => {
  try {
    if (Number(req.user.role) !== 1) {
      return res.status(403).json({ error: "Only admins can approve properties" });
    }

    const result = await pool.query(
      `UPDATE properties SET status = 'approved', updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *, created_by`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    const agentId = result.rows[0].created_by;

    // Increment listing count
    await pool.query(
      "UPDATE users SET listing_count = listing_count + 1 WHERE id = $1",
      [agentId]
    );

    // Check if agent now qualifies for verified badge
    await checkAndVerifyAgent(agentId);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to approve property" });
  }
});


// PUT — toggle availability
router.put("/:id/availability", authenticate, async (req, res) => {
  try {
    const { availability } = req.body;
    const allowed = ["available", "taken"];
    if (!allowed.includes(availability)) {
      return res.status(400).json({ error: "Invalid availability status" });
    }

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

// PUT — feature a property (admin only)
router.put("/:id/feature", authenticate, async (req, res) => {
  try {
    if (Number(req.user.role) !== 1) {
      return res.status(403).json({ error: "Only admins can feature properties" });
    }

    const { days = 30 } = req.body;
    const featuredUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const result = await pool.query(
      `UPDATE properties
       SET is_featured = true, featured_until = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [featuredUntil, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Property not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to feature property" });
  }
});

// PUT — unfeature a property (admin only)
router.put("/:id/unfeature", authenticate, async (req, res) => {
  try {
    if (Number(req.user.role) !== 1) {
      return res.status(403).json({ error: "Only admins can unfeature properties" });
    }

    const result = await pool.query(
      `UPDATE properties
       SET is_featured = false, featured_until = NULL, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Property not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to unfeature property" });
  }
});

export default router;