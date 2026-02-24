#!/bin/bash

echo "💡 Starting fresh setup for Stonepath Estates..."

# Drop old data (adjust table names if needed)
echo "🗑️  Clearing old data..."
sudo -u postgres psql -d stonepath_estates -c "TRUNCATE TABLE properties RESTART IDENTITY CASCADE;"

# Seed the database
echo "🌱 Seeding the database..."
sudo -u postgres psql -d stonepath_estates -f ./db/seeds.sql

# Start the Node server
echo "🚀 Starting the server..."
node src/server.js
