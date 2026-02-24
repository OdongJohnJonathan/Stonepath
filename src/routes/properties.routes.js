import express from "express";
import { body, validationResult } from "express-validator";
import { getProperties, createProperty, updateProperty, deleteProperty } from "../controllers/properties.controller.js";

const router = express.Router();

// Validation middleware
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

// Routes
router.get("/", getProperties);
router.post("/", validateProperty, createProperty);
router.put("/:id", validateUpdate, updateProperty);
router.delete("/:id", deleteProperty);

export default router;
