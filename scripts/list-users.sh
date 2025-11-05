#!/bin/bash

ADMIN_EMAIL="admin@vibebaba.com"
ADMIN_PASSWORD="admin1234567890"

TOKEN=$(curl -s -X POST "http://localhost:8090/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

# List all users
curl -s -H "Authorization: $TOKEN" "http://localhost:8090/api/collections/users/records" | python3 << 'PYTHON'
import sys, json
data = json.load(sys.stdin)
for user in data['items']:
    print(f"{user['id']} - {user['email']} - role: {user.get('role', 'None')}")
PYTHON
