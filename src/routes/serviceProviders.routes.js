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

export default router;