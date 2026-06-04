import express from "express";
import { body, validationResult } from "express-validator";
import { authenticate } from "../../middleware/auth.js";
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
  body('bedrooms').isInt({ min: 0 }).withMessage('Bedrooms must be >= 0'),
  body('bathrooms').isInt({ min: 0 }).withMessage('Bathrooms must be >= 0'),
  body('property_type_id').isInt().withMessage('Property type is required'),
  body('transaction_type_id').isInt().withMessage('Transaction type is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

const validateUpdate = [
  body('title').optional().notEmpty(),
  body('description').optional().notEmpty(),
  body('location').optional().notEmpty(),
  body('bedrooms').optional().isInt({ min: 0 }),
  body('bathrooms').optional().isInt({ min: 0 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

// Public: anyone can browse listings
router.get("/", getProperties);

// Protected: only logged-in users (agents/admins) can write
router.post("/", authenticate, validateProperty, createProperty);
router.put("/:id", authenticate, validateUpdate, updateProperty);
router.delete("/:id", authenticate, deleteProperty);

export default router;
