import pool from "./src/db.js";

const properties = [
  {
    title: "Luxury Villa",
    description: "A luxury villa in Kampala",
    location: "Kampala",
    address: "Plot 1, Luxury Street",
    bedrooms: 5,
    bathrooms: 4,
    square_footage: 3500,
    property_type_id: 1,
    transaction_type_id: 1
  },
  {
    title: "Modern Apartment",
    description: "Modern apartment in city center",
    location: "Kampala",
    address: "Plot 2, Central Ave",
    bedrooms: 3,
    bathrooms: 2,
    square_footage: 1200,
    property_type_id: 2,
    transaction_type_id: 2
  }
];

const seed = async () => {
  try {
    for (const prop of properties) {
      await pool.query(
        `INSERT INTO properties
         (title, description, location, address, bedrooms, bathrooms, square_footage, property_type_id, transaction_type_id, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())`,
        [prop.title, prop.description, prop.location, prop.address, prop.bedrooms, prop.bathrooms, prop.square_footage, prop.property_type_id, prop.transaction_type_id]
      );
    }
    console.log("Seed data inserted!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
