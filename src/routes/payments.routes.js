import express from "express";
import pool from "../db.js";
import { authenticate } from "../../middleware/auth.js";
import { submitOrderRequest, getTransactionStatus } from "../utils/pesapal.js";

const router = express.Router();
const isAdmin = (role) => [3, 4].includes(Number(role)); // Moderator or Super Admin

export const PRICES = {
  premium_monthly: 50000,
  premium_yearly: 480000,
  featured_7days: 20000,
  featured_14days: 35000,
  featured_30days: 60000,
};

router.get("/prices", (req, res) => {
  res.json(PRICES);
});

router.post("/premium", authenticate, async (req, res) => {
  try {
    const { plan, phone_number, provider } = req.body;

    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan. Choose monthly or yearly." });
    }

    if (!phone_number) {
      return res.status(400).json({ error: "Phone number is required." });
    }

    const amount = plan === 'yearly' ? PRICES.premium_yearly : PRICES.premium_monthly;

    const payment = await pool.query(
      `INSERT INTO payments
        (user_id, type, amount, plan, phone_number, provider, status, created_at)
       VALUES ($1, 'premium', $2, $3, $4, $5, 'pending', NOW())
       RETURNING *`,
      [req.user.id, amount, plan, phone_number, provider || 'mtn']
    );

    if (process.env.NODE_ENV !== 'production') {
      await activatePremium(req.user.id, plan);
      await pool.query(
        "UPDATE payments SET status = 'completed', updated_at = NOW() WHERE id = $1",
        [payment.rows[0].id]
      );
      return res.json({
        message: "Premium activated successfully.",
        activated: true,
      });
    }

    const userRes = await pool.query(
      "SELECT email, first_name, last_name FROM users WHERE id = $1",
      [req.user.id]
    );
    const u = userRes.rows[0];

    const order = await submitOrderRequest({
      amount,
      currency: "UGX",
      description: `Stonepath Estates - Premium (${plan})`,
      merchantReference: payment.rows[0].id,
      callbackUrl: `${process.env.FRONTEND_URL}/payments/callback`,
      email: u.email,
      phoneNumber: phone_number,
      firstName: u.first_name,
      lastName: u.last_name,
    });

    await pool.query(
      "UPDATE payments SET provider_reference = $1, updated_at = NOW() WHERE id = $2",
      [order.order_tracking_id, payment.rows[0].id]
    );

    res.json({
      message: "Payment initiated. Complete payment to activate Premium.",
      payment_id: payment.rows[0].id,
      redirect_url: order.redirect_url,
      order_tracking_id: order.order_tracking_id,
      amount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
});

router.post("/feature", authenticate, async (req, res) => {
  try {
    const { property_id, days, phone_number, provider } = req.body;

    if (![7, 14, 30].includes(Number(days))) {
      return res.status(400).json({ error: "Invalid duration. Choose 7, 14, or 30 days." });
    }

    const prop = await pool.query(
      "SELECT id, created_by FROM properties WHERE id = $1 AND deleted_at IS NULL",
      [property_id]
    );
    if (prop.rows.length === 0) return res.status(404).json({ error: "Property not found" });
    if (!isAdmin(req.user.role) && prop.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: "Not authorised" });
    }

    const amount = PRICES[`featured_${days}days`];

    const payment = await pool.query(
      `INSERT INTO payments
        (user_id, property_id, type, amount, days, phone_number, provider, status, created_at)
       VALUES ($1, $2, 'featured', $3, $4, $5, $6, 'pending', NOW())
       RETURNING *`,
      [req.user.id, property_id, amount, days, phone_number, provider || 'mtn']
    );

    if (process.env.NODE_ENV !== 'production') {
      await activateFeatured(property_id, Number(days));
      await pool.query(
        "UPDATE payments SET status = 'completed', updated_at = NOW() WHERE id = $1",
        [payment.rows[0].id]
      );
      return res.json({
        message: "Property featured successfully.",
        activated: true,
      });
    }

    const userRes = await pool.query(
      "SELECT email, first_name, last_name FROM users WHERE id = $1",
      [req.user.id]
    );
    const u = userRes.rows[0];

    const order = await submitOrderRequest({
      amount,
      currency: "UGX",
      description: `Stonepath Estates - Featured Listing (${days} days)`,
      merchantReference: payment.rows[0].id,
      callbackUrl: `${process.env.FRONTEND_URL}/payments/callback`,
      email: u.email,
      phoneNumber: phone_number,
      firstName: u.first_name,
      lastName: u.last_name,
    });

    await pool.query(
      "UPDATE payments SET provider_reference = $1, updated_at = NOW() WHERE id = $2",
      [order.order_tracking_id, payment.rows[0].id]
    );

    res.json({
      message: "Payment initiated. Complete payment to feature your listing.",
      payment_id: payment.rows[0].id,
      redirect_url: order.redirect_url,
      order_tracking_id: order.order_tracking_id,
      amount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
});

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

      if (p.type === 'premium') await activatePremium(p.user_id, p.plan);
      if (p.type === 'featured') await activateFeatured(p.property_id, p.days);
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

router.get("/ipn", async (req, res) => {
  try {
    const { OrderTrackingId, OrderMerchantReference } = req.query;
    if (!OrderTrackingId) {
      return res.status(400).json({ error: "Missing OrderTrackingId" });
    }

    await syncPaymentStatus(OrderMerchantReference, OrderTrackingId);

    res.json({
      orderNotificationType: "IPNCHANGE",
      orderTrackingId: OrderTrackingId,
      orderMerchantReference: OrderMerchantReference,
      status: 200,
    });
  } catch (err) {
    console.error("IPN handling error:", err);
    res.status(500).json({ error: "IPN processing failed" });
  }
});

router.get("/status/:paymentId", authenticate, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const result = await pool.query(
      "SELECT * FROM payments WHERE (id::text = $1 OR provider_reference = $1) AND user_id = $2",
      [paymentId, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Payment not found" });
    }

    let payment = result.rows[0];
    if (payment.status === "pending" && payment.provider_reference) {
      await syncPaymentStatus(payment.id, payment.provider_reference);
      const refreshed = await pool.query("SELECT * FROM payments WHERE id = $1", [payment.id]);
      payment = refreshed.rows[0];
    }

    res.json(payment);
  } catch (err) {
    console.error("Payment status check error:", err);
    res.status(500).json({ error: "Failed to check payment status" });
  }
});

function mapPesapalStatus(pesapalStatus) {
  const code = pesapalStatus?.status_code;
  if (code === 1) return "completed";
  if (code === 2) return "failed";
  if (code === 3) return "reversed";
  return "pending";
}

async function syncPaymentStatus(merchantReference, orderTrackingId) {
  const pesapalStatus = await getTransactionStatus(orderTrackingId);
  const newStatus = mapPesapalStatus(pesapalStatus);

  const result = await pool.query(
    `UPDATE payments SET status = $1, updated_at = NOW()
     WHERE id = $2 OR provider_reference = $3
     RETURNING *`,
    [newStatus, merchantReference, orderTrackingId]
  );

  if (result.rows.length === 0) return;
  const p = result.rows[0];

  if (newStatus === "completed") {
    if (p.type === "premium") await activatePremium(p.user_id, p.plan);
    if (p.type === "featured") await activateFeatured(p.property_id, p.days);
  }
}

async function activatePremium(userId, plan) {
  const months = plan === 'yearly' ? 12 : 1;
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);

  await pool.query(
    `UPDATE users SET is_premium = true, premium_expires_at = $1, updated_at = NOW()
     WHERE id = $2`,
    [expiresAt, userId]
  );
}

async function activateFeatured(propertyId, days) {
  const featuredUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await pool.query(
    `UPDATE properties SET is_featured = true, featured_until = $1, updated_at = NOW()
     WHERE id = $2`,
    [featuredUntil, propertyId]
  );
}

export default router;