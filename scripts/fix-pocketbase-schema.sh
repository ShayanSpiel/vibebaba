#!/bin/bash

ADMIN_EMAIL="admin@vibebaba.com"
ADMIN_PASSWORD="admin1234567890"

# Login
TOKEN=$(curl -s -X POST "http://localhost:8090/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

# Restore full schema
curl -s -X PATCH "http://localhost:8090/api/collections/users" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF' | python3 -m json.tool
{
  "schema": [
    {
      "system": false,
      "id": "users_name",
      "name": "name",
      "type": "text",
      "required": false,
      "options": {"min": null, "max": null, "pattern": ""}
    },
    {
      "system": false,
      "id": "users_avatar",
      "name": "avatar",
      "type": "file",
      "required": false,
      "options": {
        "mimeTypes": ["image/jpeg", "image/png", "image/svg+xml", "image/gif", "image/webp"],
        "maxSelect": 1,
        "maxSize": 5242880
      }
    },
    {
      "system": false,
      "id": "orjnkhh7",
      "name": "totalTokens",
      "type": "number",
      "required": false,
      "options": {"min": 0, "max": null}
    },
    {
      "system": false,
      "id": "lfkf2esa",
      "name": "usedTokens",
      "type": "number",
      "required": false,
      "options": {"min": 0, "max": null}
    },
    {
      "system": false,
      "id": "nrfz7b5g",
      "name": "dailyTokens",
      "type": "number",
      "required": false,
      "options": {"min": 0, "max": null}
    },
    {
      "system": false,
      "id": "fwemovbu",
      "name": "lastDailyReset",
      "type": "date",
      "required": false,
      "options": {"min": "", "max": ""}
    },
    {
      "system": false,
      "id": "cwfxdphl",
      "name": "packageId",
      "type": "text",
      "required": false,
      "options": {"min": null, "max": null, "pattern": ""}
    },
    {
      "system": false,
      "id": "1ygt7blf",
      "name": "packageExpiry",
      "type": "date",
      "required": false,
      "options": {"min": "", "max": ""}
    },
    {
      "system": false,
      "id": "tvrhg0ex",
      "name": "role",
      "type": "select",
      "required": false,
      "options": {
        "maxSelect": 1,
        "values": ["user", "admin"]
      }
    }
  ]
}
EOF
