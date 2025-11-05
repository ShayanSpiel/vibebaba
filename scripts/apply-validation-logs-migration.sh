#!/bin/bash

# Apply validation logs migration to PocketBase

echo "Applying validation logs migration to PocketBase..."

# Check if PocketBase is running
if ! lsof -ti:8090 > /dev/null 2>&1; then
  echo "Error: PocketBase is not running on port 8090"
  echo "Please start PocketBase first with: ./pocketbase serve"
  exit 1
fi

echo "PocketBase is running. Migration will be applied automatically on next restart."
echo ""
echo "To apply the migration:"
echo "1. Stop PocketBase (if running in foreground: Ctrl+C)"
echo "2. Restart PocketBase: ./pocketbase serve"
echo ""
echo "The migration file is located at:"
echo "  pocketbase/pb_migrations/1748000000_validation_logs.js"
echo ""
echo "This will create the following collections:"
echo "  - validation_errors: Stores individual validation errors"
echo "  - validation_sessions: Stores validation session summaries with full logs"
echo "  - system_logs: Stores general system logs"
echo ""
echo "All collections include timing information (timestamp, duration_ms)"
