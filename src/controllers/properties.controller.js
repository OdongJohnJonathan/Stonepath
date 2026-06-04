export const createProperty = async (req, res) => {
  try {
    const {
      title, description, location, address,
      bedrooms, bathrooms, square_footage,
      property_type_id, transaction_type_id,
      images, amenities
    } = req.body;

    const created_by = req.user?.id;

    const result = await pool.query(
      `INSERT INTO properties
      (title, description, location, address, bedrooms, bathrooms, square_footage,
       property_type_id, transaction_type_id, created_by, images, amenities,
       status, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending',NOW(),NOW())
      RETURNING *`,
      [
        title, description, location, address,
        bedrooms, bathrooms, square_footage,
        property_type_id, transaction_type_id,
        created_by,
        JSON.stringify(images || []),
        JSON.stringify(amenities || {})
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to insert property" });
  }
};