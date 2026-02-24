import pool from '../db.js';

const seed = async () => {
  try {
    await pool.query(`
      INSERT INTO properties (title, description, location, address, bedrooms, bathrooms, square_footage, property_type_id, transaction_type_id)
      VALUES
      ('Test Apartment', 'Nice apartment for testing', 'Kampala', 'Plot 1', 2, 1, 800, 1, 1),
      ('Test House', 'Lovely house for testing', 'Entebbe', 'Plot 2', 3, 2, 1200, 2, 1)
      ON CONFLICT DO NOTHING;
    `);
    console.log('Seed data inserted successfully!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
