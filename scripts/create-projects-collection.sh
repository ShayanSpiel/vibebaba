#!/bin/bash

ADMIN_EMAIL="admin@vibebaba.com"
ADMIN_PASSWORD="admin1234567890"

echo "Getting admin token..."
TOKEN=$(curl -s -X POST "http://localhost:8090/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "Failed to get admin token"
  exit 1
fi

echo "Checking existing collections..."
curl -s -H "Authorization: $TOKEN" "http://localhost:8090/api/collections" | python3 -m json.tool

echo ""
echo "Creating projects collection..."
curl -s -X POST "http://localhost:8090/api/collections" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF' | python3 -m json.tool
{
  "name": "projects",
  "type": "base",
  "system": false,
  "schema": [
    {
      "name": "userId",
      "type": "text",
      "required": true,
      "options": {
        "min": 1,
        "max": 100
      }
    },
    {
      "name": "name",
      "type": "text",
      "required": true,
      "options": {
        "min": 1,
        "max": 200
      }
    },
    {
      "name": "description",
      "type": "text",
      "required": false,
      "options": {
        "min": 0,
        "max": 1000
      }
    },
    {
      "name": "status",
      "type": "select",
      "required": false,
      "options": {
        "maxSelect": 1,
        "values": ["active", "archived", "completed"]
      }
    }
  ],
  "listRule": "@request.auth.id != \"\" && userId = @request.auth.id",
  "viewRule": "@request.auth.id != \"\" && userId = @request.auth.id",
  "createRule": "@request.auth.id != \"\" && @request.data.userId = @request.auth.id",
  "updateRule": "@request.auth.id != \"\" && userId = @request.auth.id",
  "deleteRule": "@request.auth.id != \"\" && userId = @request.auth.id"
}
EOF
