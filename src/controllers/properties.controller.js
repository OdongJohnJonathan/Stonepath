import pool from "../db.js";

// GET all properties with filtering & pagination
export const getProperties = async (req, res) => {
  try {
    const { location, status, property_type_id, transaction_type_id, page = 1, limit = 10 } = req.query;

    let filters = [];
    let values = [];

    if (location) { values.push(location); filters.push(`location = $${values.length}`); }
    if (status) { values.push(status); filters.push(`status = $${values.length}`); }
    if (property_type_id) { values.push(property_type_id); filters.push(`property_type_id = $${values.length}`); }
    if (transaction_type_id) { values.push(transaction_type_id); filters.push(`transaction_type_id = $${values.length}`); }

    filters.push("deleted_at IS NULL"); // exclude soft-deleted

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT * FROM properties ${whereClause} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
};

// CREATE a new property
export const createProperty = async (req, res) => {
  try {
    const { title, description, location, address, bedrooms, bathrooms, square_footage, property_type_id, transaction_type_id } = req.body;

    const result = await pool.query(
      `INSERT INTO properties
      (title, description, location, address, bedrooms, bathrooms, square_footage, property_type_id, transaction_type_id, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
      RETURNING *`,
      [title, description, location, address, bedrooms, bathrooms, square_footage, property_type_id, transaction_type_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to insert property" });
  }
};

// UPDATE a property
export const updateProperty = async (req, res) => {
  const { id } = req.params;
  const { title, description, location, address, bedrooms, bathrooms, square_footage } = req.body;

  try {
    const result = await pool.query(
      `UPDATE properties
       SET title=$1,
           description=$2,
           location=$3,
           address=$4,
           bedrooms=$5,
           bathrooms=$6,
           square_footage=$7,
           updated_at=NOW()
       WHERE id=$8 AND deleted_at IS NULL
       RETURNING *`,
      [title, description, location, address, bedrooms, bathrooms, square_footage, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Property not found or deleted" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update property" });
  }
};

// SOFT DELETE a property
export const deleteProperty = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE properties
       SET deleted_at = NOW()
       WHERE id=$1 AND deleted_at IS NULL
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Property not found or already deleted" });
    }

    res.json({ message: "Property deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete property" });
  }
};
