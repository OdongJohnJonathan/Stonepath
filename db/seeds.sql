-- Seed property_types
INSERT INTO property_types (id, name) VALUES
(1, 'Apartment'),
(2, 'House'),
(3, 'Commercial')
ON CONFLICT DO NOTHING;

-- Seed transaction_types
INSERT INTO transaction_types (id, name) VALUES
(1, 'Sale'),
(2, 'Rent')
ON CONFLICT DO NOTHING;

-- Seed a user (optional, for created_by)
INSERT INTO users (id, name, email) VALUES
(gen_random_uuid(), 'Admin User', 'admin@stonepath.com')
ON CONFLICT DO NOTHING;

-- Seed a property
INSERT INTO properties
(title, description, location, address, bedrooms, bathrooms, square_footage, property_type_id, transaction_type_id, created_by)
VALUES
('Luxury Apartment', 'Beautiful apartment in the city center', 'Kampala, Uganda', 'Plot 123, Main Street', 3, 2, 1200, 1, 1, NULL)
ON CONFLICT DO NOTHING;
