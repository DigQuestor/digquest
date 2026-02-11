#!/bin/bash
set -e

# Set these before running or in your Render dashboard!
: "${VITE_GOOGLE_MAPS_API_KEY:?Missing VITE_GOOGLE_MAPS_API_KEY}"
: "${DATABASE_URL:?Missing DATABASE_URL}"
: "${SESSION_SECRET:?Missing SESSION_SECRET}"

echo "Installing dependencies..."
npm install

echo "Building app with Google Maps API key..."
VITE_GOOGLE_MAPS_API_KEY="$VITE_GOOGLE_MAPS_API_KEY" npm run build

echo "Starting server..."
DATABASE_URL="$DATABASE_URL" SESSION_SECRET="$SESSION_SECRET" node dist/index.js
