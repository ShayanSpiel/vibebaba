#!/bin/bash

# Kill any existing Next.js dev servers
echo "Cleaning up existing Next.js processes..."
pkill -9 -f "next dev" 2>/dev/null || true
pkill -9 -f "next-server" 2>/dev/null || true

# Wait a moment for cleanup
sleep 1

# Start fresh dev server
echo "Starting Next.js dev server..."
npm run dev
