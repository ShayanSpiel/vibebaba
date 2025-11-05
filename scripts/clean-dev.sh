#!/bin/bash

# Clean up any orphaned Next.js and nodemon processes
echo "🧹 Cleaning up orphaned processes..."

# Kill nodemon processes first
pkill -9 -f nodemon 2>/dev/null || true

# Kill all Next.js dev server processes
pkill -9 -f "next dev|next-server|node.*\.next" 2>/dev/null || true

# Wait a moment to ensure processes are fully terminated
sleep 1

echo "✅ Cleanup complete"

# Start Next.js dev server
echo "🚀 Starting Next.js development server..."
exec next dev
