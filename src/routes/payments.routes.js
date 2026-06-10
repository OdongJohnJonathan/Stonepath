import express from "express";
import pool from "../db.js";
import { authenticate } from "../../middleware/auth.js";

const router = express.Router();

// Pricing (in UGX)
export const PRICES = {
  premium_monthly: 50000,   // UGX 50,000/month
  premium_yearly: 480000,   // UGX 480,000/year (20% discount)
  featured_7days: 20000,    // UGX 20,000 for 7 days
  featured_14days: 35000,   // UGX 35,000 for 14 days
  featured_30days: 60000,   // UGX 60,000 for 30 days
};

// GET /payments/prices — get current pricing
router.get("/prices", (req, res) => {
  res.json(PRICES);
});

// POST /payments/premium — initiate premium upgrade
// Will connect to MTN/Airtel/M-Pesa in Phase 3
router.post("/premium", authenticate, async (req, res) => {
  try {
    const { plan, phone_number, provider } = req.body;
    // plan: 'monthly' | 'yearly'
    // provider: 'mtn' | 'airtel' | 'mpesa'

    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const amount = plan === 'yearly' ? PRICES.premium_yearly : PRICES.premium_monthly;

    // Store pending payment
    const payment = await pool.query(
      `INSERT INTO payments
        (user_id, type, amount, plan, phone_number, provider, status, created_at)
       VALUES ($1, 'premium', $2, $3, $4, $5, 'pending', NOW())
       RETURNING *`,
      [req.user.id, amount, plan, phone_number, provider]
    );

    // TODO Phase 3: trigger actual mobile money request here
    // For now, simulate success for testing
    if (process.env.NODE_ENV === 'development') {
      await activatePremium(req.user.id, plan);
      return res.json({
        message: "Premium activated (development mode)",
        payment: payment.rows[0],
      });
    }

    res.json({
      message: "Payment initiated. Complete the prompt on your phone.",
      payment_id: payment.rows[0].id,
      amount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
});

// POST /payments/feature — initiate featured listing payment
router.post("/feature", authenticate, async (req, res) => {
  try {
    const { property_id, days, phone_number, provider } = req.body;

    if (![7, 14, 30].includes(Number(days))) {
      return res.status(400).json({ error: "Invalid duration. Choose 7, 14, or 30 days." });
    }

    // Verify property belongs to this agent
    const prop = await pool.query(
      "SELECT id, created_by FROM properties WHERE id = $1 AND deleted_at IS NULL",
      [property_id]
    );
    if (prop.rows.length === 0) return res.status(404).json({ error: "Property not found" });
    if (Number(req.user.role) !== 1 && prop.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: "Not authorised" });
    }

    const amountKey = `featured_${days}days`;
    const amount = PRICES[amountKey];

    const payment = await pool.query(
      `INSERT INTO payments
        (user_id, property_id, type, amount, days, phone_number, provider, status, created_at)
       VALUES ($1, $2, 'featured', $3, $4, $5, $6, 'pending', NOW())
       RETURNING *`,
      [req.user.id, property_id, amount, days, phone_number, provider]
    );

    // TODO Phase 3: trigger actual mobile money request here
    if (process.env.NODE_ENV === 'development') {
      await activateFeatured(property_id, Number(days));
      return res.json({
        message: "Property featured (development mode)",
        payment: payment.rows[0],
      });
    }

    res.json({
      message: "Payment initiated. Complete the prompt on your phone.",
      payment_id: payment.rows[0].id,
      amount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
});

// POST /payments/callback — payment provider calls this when payment completes
// MTN, Airtel, M-Pesa will all call this endpoint
router.post("/callback", async (req, res) => {
  try {
    const { payment_id, status, provider_reference } = req.body;

    const payment = await pool.query(
      "SELECT * FROM payments WHERE id = $1",
      [payment_id]
    );
    if (payment.rows.length === 0) return res.status(404).json({ error: "Payment not found" });

    const p = payment.rows[0];

    if (status === 'success') {
      await pool.query(
        `UPDATE payments SET status = 'completed', provider_reference = $1, updated_at = NOW()
         WHERE id = $2`,
        [provider_reference, payment_id]
      );

      if (p.type === 'premium') {
        await activatePremium(p.user_id, p.plan);
      } else if (p.type === 'featured') {
        await activateFeatured(p.property_id, p.days);
      }
    } else {
      await pool.query(
        "UPDATE payments SET status = 'failed', updated_at = NOW() WHERE id = $1",
        [payment_id]
      );
    }

    res.json({ message: "Callback processed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Callback failed" });
  }
});

// ── HELPER FUNCTIONS ──────────────────────────────

async function activatePremium(userId, plan) {
  const months = plan === 'yearly' ? 12 : 1;
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);

  await pool.query(
    `UPDATE users
     SET is_premium = true,
         premium_expires_at = $1,
         updated_at = NOW()
     WHERE id = $2`,
    [expiresAt, userId]
  );
}

async function activateFeatured(propertyId, days) {
  const featuredUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await pool.query(
    `UPDATE properties
     SET is_featured = true,
         featured_until = $1,
         updated_at = NOW()
     WHERE id = $2`,
    [featuredUntil, propertyId]
  );
}

export default router;