import express from "express";
import { authenticate } from "../../middleware/auth.js";
import pool from "../db.js";

const router = express.Router();
const isAdmin = (role) => [3, 4].includes(Number(role)); // Moderator or Super Admin

// ─────────────────────────────────────────────
// GET /service-providers/categories
// Public — list all service categories grouped by tier
// ─────────────────────────────────────────────
router.get("/categories", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, tier, name, slug FROM service_categories ORDER BY tier, name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// ─────────────────────────────────────────────
// GET /service-providers
// Public — approved providers only, with optional filters
// ?category_id=&district=&country=&q=
// ─────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { category_id, district, country, q, all } = req.query;

    let filters = [];
    let values = [];

    if (!all) filters.push(`sp.status = 'approved'`);
    filters.push(`sp.deleted_at IS NULL`);

    if (district) {
      values.push(district);
      filters.push(`sp.district = $${values.length}`);
    }
    if (country) {
      values.push(country);
      filters.push(`sp.country = $${values.length}`);
    }
    if (q) {
      values.push(`%${q}%`);
      filters.push(`(sp.business_name ILIKE $${values.length} OR sp.description ILIKE $${values.length})`);
    }

    let categoryJoin = "";
    if (category_id) {
      values.push(category_id);
      categoryJoin = `JOIN service_provider_categories spc ON spc.provider_id = sp.id AND spc.category_id = $${values.length}`;
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT sp.*,
              COALESCE(
                json_agg(
                  json_build_object('id', sc.id, 'name', sc.name, 'tier', sc.tier)
                ) FILTER (WHERE sc.id IS NOT NULL), '[]'
              ) AS categories
       FROM service_providers sp
       ${categoryJoin}
       LEFT JOIN service_provider_categories all_spc ON all_spc.provider_id = sp.id
       LEFT JOIN service_categories sc ON sc.id = all_spc.category_id
       ${whereClause}
       GROUP BY sp.id
       ORDER BY sp.is_verified DESC, sp.created_at DESC`,
      values
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch service providers" });
  }
});

// ─────────────────────────────────────────────
// GET /service-providers/mine
// Authenticated — provider sees their own listing (any status)
// ─────────────────────────────────────────────
router.get("/mine", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sp.*,
              COALESCE(
                json_agg(
                  json_build_object('id', sc.id, 'name', sc.name, 'tier', sc.tier)
                ) FILTER (WHERE sc.id IS NOT NULL), '[]'
              ) AS categories
       FROM service_providers sp
       LEFT JOIN service_provider_categories spc ON spc.provider_id = sp.id
       LEFT JOIN service_categories sc ON sc.id = spc.category_id
       WHERE sp.user_id = $1 AND sp.deleted_at IS NULL
       GROUP BY sp.id`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "No service provider profile found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch your provider profile" });
  }
});

// ─────────────────────────────────────────────
// GET /service-providers/:id
// Public — single provider detail (approved only, unless admin)
// ─────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sp.*,
              COALESCE(
                json_agg(
                  json_build_object('id', sc.id, 'name', sc.name, 'tier', sc.tier)
                ) FILTER (WHERE sc.id IS NOT NULL), '[]'
              ) AS categories
       FROM service_providers sp
       LEFT JOIN service_provider_categories spc ON spc.provider_id = sp.id
       LEFT JOIN service_categories sc ON sc.id = spc.category_id
       WHERE sp.id = $1 AND sp.deleted_at IS NULL
       GROUP BY sp.id`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Service provider not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch service provider" });
  }
});

// ─────────────────────────────────────────────
// PUT /service-providers/mine
// Authenticated — provider edits their own listing
// (status resets to 'pending' if business details change, requiring re-approval)
// ─────────────────────────────────────────────
router.put("/mine", authenticate, async (req, res) => {
  const {
    business_name, description, phone_number, email, whatsapp,
    country, district, location, years_experience, images, logo_url, category_ids,
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT id FROM service_providers WHERE user_id = $1 AND deleted_at IS NULL`,
      [req.user.id]
    );
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "No service provider profile found" });
    }
    const providerId = existing.rows[0].id;

    const result = await client.query(
      `UPDATE service_providers
       SET business_name = COALESCE($1, business_name),
           description = COALESCE($2, description),
           phone_number = COALESCE($3, phone_number),
           email = COALESCE($4, email),
           whatsapp = COALESCE($5, whatsapp),
           country = COALESCE($6, country),
           district = COALESCE($7, district),
           location = COALESCE($8, location),
           years_experience = COALESCE($9, years_experience),
           images = COALESCE($10, images),
           logo_url = COALESCE($11, logo_url),
           status = 'pending',
           updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [business_name, description, phone_number, email, whatsapp,
       country, district, location, years_experience, images, logo_url, providerId]
    );

    if (Array.isArray(category_ids)) {
      await client.query(`DELETE FROM service_provider_categories WHERE provider_id = $1`, [providerId]);
      for (const categoryId of category_ids) {
        await client.query(
          `INSERT INTO service_provider_categories (provider_id, category_id) VALUES ($1, $2)`,
          [providerId, categoryId]
        );
      }
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: "Failed to update service provider profile" });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// GET /service-providers/admin/all
// Admin — see all providers regardless of status
// ─────────────────────────────────────────────
router.get("/admin/all", authenticate, async (req, res) => {
  if (!isAdmin(req.user.role)) return res.status(403).json({ error: "Admin access required" });
  try {
    const result = await pool.query(
      `SELECT sp.*, u.email AS account_email,
              COALESCE(
                json_agg(
                  json_build_object('id', sc.id, 'name', sc.name, 'tier', sc.tier)
                ) FILTER (WHERE sc.id IS NOT NULL), '[]'
              ) AS categories
       FROM service_providers sp
       JOIN users u ON u.id = sp.user_id
       LEFT JOIN service_provider_categories spc ON spc.provider_id = sp.id
       LEFT JOIN service_categories sc ON sc.id = spc.category_id
       WHERE sp.deleted_at IS NULL
       GROUP BY sp.id, u.email
       ORDER BY sp.status = 'pending' DESC, sp.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch providers" });
  }
});

// ─────────────────────────────────────────────
// PUT /service-providers/:id/approve  (admin only)
// ─────────────────────────────────────────────
router.put("/:id/approve", authenticate, async (req, res) => {
  if (!isAdmin(req.user.role)) return res.status(403).json({ error: "Admin access required" });
  try {
    const result = await pool.query(
      `UPDATE service_providers SET status = 'approved', updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Provider not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to approve provider" });
  }
});

// ─────────────────────────────────────────────
// PUT /service-providers/:id/reject  (admin only)
// ─────────────────────────────────────────────
router.put("/:id/reject", authenticate, async (req, res) => {
  if (!isAdmin(req.user.role)) return res.status(403).json({ error: "Admin access required" });
  try {
    const result = await pool.query(
      `UPDATE service_providers SET status = 'rejected', updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Provider not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reject provider" });
  }
});

// PUT /service-providers/:id/tier (admin only)
router.put("/:id/tier", authenticate, async (req, res) => {
  if (!isAdmin(req.user.role)) return res.status(403).json({ error: "Admin access required" });
  const { tier } = req.body;
  if (!["free", "standard", "featured"].includes(tier)) {
    return res.status(400).json({ error: "Invalid tier" });
  }
  try {
    const result = await pool.query(
      `UPDATE service_providers SET tier = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [tier, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Provider not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update tier" });
  }
});

// ─────────────────────────────────────────────
// PUT /service-providers/:id/verify  (admin only — "trusted" badge)
// ─────────────────────────────────────────────
router.put("/:id/verify", authenticate, async (req, res) => {
  if (!isAdmin(req.user.role)) return res.status(403).json({ error: "Admin access required" });
  try {
    const result = await pool.query(
      `UPDATE service_providers SET is_verified = NOT is_verified, updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Provider not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update verification" });
  }
});

// ─────────────────────────────────────────────
// DELETE /service-providers/:id  (owner or admin — soft delete)
// ─────────────────────────────────────────────
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const existing = await pool.query(
      `SELECT user_id FROM service_providers WHERE id = $1 AND deleted_at IS NULL`,
      [req.params.id]
    );
    if (existing.rows.length === 0) return res.status(404).json({ error: "Provider not found" });
    if (existing.rows[0].user_id !== req.user.id && !isAdmin(req.user.role)) {
      return res.status(403).json({ error: "Not authorised" });
    }
    await pool.query(`UPDATE service_providers SET deleted_at = NOW() WHERE id = $1`, [req.params.id]);
    res.json({ message: "Service provider listing deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete provider" });
  }
});

// ─────────────────────────────────────────────
// POST /service-providers/:id/enquiry
// Public (or authenticated) — send enquiry to a provider
// ─────────────────────────────────────────────
router.post("/:id/enquiry", async (req, res) => {
  const { sender_name, sender_email, sender_phone, message } = req.body;

  if (!sender_name || !sender_email || !message) {
    return res.status(400).json({ error: "Name, email and message are required" });
  }

  try {
    // Verify provider exists and is approved
    const provResult = await pool.query(
      `SELECT sp.*, u.email AS owner_email, u.first_name AS owner_first_name
       FROM service_providers sp
       JOIN users u ON u.id = sp.user_id
       WHERE sp.id = $1 AND sp.status = 'approved' AND sp.deleted_at IS NULL`,
      [req.params.id]
    );
    if (provResult.rows.length === 0) {
      return res.status(404).json({ error: "Service provider not found" });
    }
    const provider = provResult.rows[0];

    // Save enquiry to database
    const enquiry = await pool.query(
      `INSERT INTO service_provider_enquiries
         (provider_id, sender_name, sender_email, sender_phone, message)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.id, sender_name, sender_email, sender_phone || null, message]
    );

    // Email notification to the provider
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

    try {
      await resend.emails.send({
        from: FROM,
        to: provider.owner_email,
        subject: `New enquiry for "${provider.business_name}"`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#0a0a0b;color:#fff;">
            <h1 style="font-size:22px;color:#c9a84c;margin-bottom:24px;">Stonepath™</h1>
            <h2 style="font-size:20px;font-weight:400;margin-bottom:4px;">New Service Enquiry</h2>
            <p style="color:#8892a4;font-size:13px;margin-bottom:28px;">Someone is interested in your services.</p>

            <div style="background:#1a1a1a;border-left:3px solid #c9a84c;padding:16px;margin-bottom:16px;">
              <div style="font-size:11px;color:#c9a84c;text-transform:uppercase;margin-bottom:6px;">Your Business</div>
              <div style="font-size:16px;">${provider.business_name}</div>
            </div>

            <div style="background:#1a1a1a;padding:16px;margin-bottom:16px;">
              <div style="font-size:11px;color:#8892a4;text-transform:uppercase;margin-bottom:12px;">From</div>
              <div style="margin-bottom:6px;"><span style="color:#8892a4;">Name:</span> ${sender_name}</div>
              <div style="margin-bottom:6px;"><span style="color:#8892a4;">Email:</span> <a href="mailto:${sender_email}" style="color:#c9a84c;">${sender_email}</a></div>
              ${sender_phone ? `<div><span style="color:#8892a4;">Phone:</span> ${sender_phone}</div>` : ""}
            </div>

            <div style="background:#1a1a1a;border-left:3px solid #22c55e;padding:16px;margin-bottom:28px;">
              <div style="font-size:11px;color:#22c55e;text-transform:uppercase;margin-bottom:8px;">Message</div>
              <p style="color:#fff;line-height:1.6;margin:0;">${message}</p>
            </div>

            <a href="${FRONTEND_URL}" style="background:#c9a84c;color:#000;padding:14px 32px;text-decoration:none;font-weight:600;font-size:13px;text-transform:uppercase;display:inline-block;">
              View on Stonepath
            </a>
            <p style="color:#555;font-size:12px;margin-top:32px;">
              Hi ${provider.owner_first_name}, log in to your Stonepath dashboard to manage this enquiry.
            </p>
          </div>`,
      });
    } catch (emailErr) {
      console.error("Enquiry email failed:", emailErr.message);
      // Don't fail the request if email fails
    }

    return res.status(201).json({ message: "Enquiry sent successfully", id: enquiry.rows[0].id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to send enquiry" });
  }
});

// ─────────────────────────────────────────────
// GET /service-providers/mine/enquiries
// Provider — see all enquiries sent to their business
// ─────────────────────────────────────────────
router.get("/mine/enquiries", authenticate, async (req, res) => {
  try {
    const providerResult = await pool.query(
      "SELECT id FROM service_providers WHERE user_id = $1 AND deleted_at IS NULL",
      [req.user.id]
    );
    if (providerResult.rows.length === 0) {
      return res.status(404).json({ error: "No provider profile found" });
    }
    const providerId = providerResult.rows[0].id;

    const result = await pool.query(
      `SELECT * FROM service_provider_enquiries
       WHERE provider_id = $1
       ORDER BY created_at DESC`,
      [providerId]
    );

    // Mark all as read
    await pool.query(
      "UPDATE service_provider_enquiries SET status = 'read' WHERE provider_id = $1 AND status = 'unread'",
      [providerId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch enquiries" });
  }
});

export default router;