-- ===============================================
-- Phase 2 Seed Data for Stonepath Estates
-- Run with: sudo -u postgres psql -d stonepath_estates -f ./db/seeds_phase2.sql
-- ===============================================

-- ------------------------------
-- Users
-- ------------------------------
INSERT INTO users (first_name, last_name, email, password_hash, role, is_verified, is_active)
VALUES
('Jonathan', 'Odong', 'jonathan@example.com', '$2b$10$examplehash1', 1, true, true),
('Alice', 'Achieng', 'alice@example.com', '$2b$10$examplehash2', 2, false, true),
('Bob', 'Okello', 'bob@example.com', '$2b$10$examplehash3', 3, true, true);

-- ------------------------------
-- Roles
-- ------------------------------
INSERT INTO roles (id, name)
VALUES
(1, 'Admin'),
(2, 'Agent'),
(3, 'Customer');

-- ------------------------------
-- Agent Profiles
-- ------------------------------
-- Assumes user IDs already exist and role = 2
INSERT INTO agent_profiles (user_id, agency_name, license_number, created_at)
SELECT id, 'Top Realty', 'LIC123456', CURRENT_TIMESTAMP
FROM users
WHERE role = 2;

-- ------------------------------
-- Properties
-- ------------------------------
INSERT INTO properties (title, description, price, created_by, created_at)
VALUES
('Cozy 2BR Apartment', 'A lovely apartment in Kampala.', 50000, 
  (SELECT id FROM users WHERE first_name='Alice' AND last_name='Achieng'), CURRENT_TIMESTAMP),
('Luxury 3BR House', 'Spacious house with garden.', 150000, 
  (SELECT id FROM users WHERE first_name='Bob' AND last_name='Okello'), CURRENT_TIMESTAMP);

-- ------------------------------
-- Properties_Old (Archive)
-- ------------------------------
INSERT INTO properties_old (title, description, price, owner_id, created_at)
VALUES
('Old 1BR Apartment', 'Previously listed small apartment.', 30000, 
  (SELECT id FROM users WHERE first_name='Alice' AND last_name='Achieng'), CURRENT_TIMESTAMP);

-- ------------------------------
-- Add any additional tables for Phase 2 below
-- ------------------------------

