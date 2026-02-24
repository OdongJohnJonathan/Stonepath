#!/bin/bash

# Seed the database
echo "Seeding the database..."
sudo -u postgres psql -d stonepath_estates -f ./db/seeds.sql

# Start the Node server
echo "Starting the server..."
node src/server.js
