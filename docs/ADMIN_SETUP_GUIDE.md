# Admin Setup Guide

## Prerequisites

Before using the admin features, you need to:

1. **Set up PocketBase Admin Credentials**
2. **Create Required Collections**
3. **Set Admin User Role**

---

## 1. Configure PocketBase Admin Credentials

Add these to your `.env` file:

```bash
# PocketBase Admin Credentials
POCKETBASE_ADMIN_EMAIL=admin@yourdomain.com
POCKETBASE_ADMIN_PASSWORD=your-secure-password
```

These credentials are used by the server to authenticate with PocketBase for admin operations.

### How to Get Admin Credentials

1. Open PocketBase admin panel: `http://localhost:8090/_/`
2. Go to **Settings** → **Admins**
3. Create a new admin account or use existing one
4. Copy the email and password to your `.env` file

---

## 2. Create Required Collections

### Settings Collection

The pricing management system needs a `settings` collection to store configuration.

#### Option A: Create via PocketBase UI

1. Go to `http://localhost:8090/_/`
2. Click **Collections** → **New Collection**
3. Set **Name:** `settings`
4. Set **Type:** Base
5. Add fields:
   - **key** (Text, Required, Unique)
   - **value** (JSON, Required)
   - **description** (Text, Optional)
6. Click **Create**

⚠️ **Important:** Don't add `id`, `created`, or `updated` fields - PocketBase adds these automatically!

#### Option B: Import Schema

Create a file `pb_schema_settings.json`:

```json
{
  "name": "settings",
  "type": "base",
  "schema": [
    {
      "name": "key",
      "type": "text",
      "required": true,
      "options": {
        "min": 1,
        "max": 255
      }
    },
    {
      "name": "value",
      "type": "json",
      "required": true
    },
    {
      "name": "description",
      "type": "text",
      "required": false,
      "options": {
        "max": 500
      }
    },
    {
      "name": "updated",
      "type": "date",
      "required": false
    }
  ],
  "indexes": [
    "CREATE UNIQUE INDEX idx_settings_key ON settings (key)"
  ]
}
```

Then import via PocketBase admin panel: **Collections** → **Import collections**

---

## 3. Set Admin User Role

### Update Your User to Admin

1. Go to `http://localhost:8090/_/`
2. Click **Collections** → **users**
3. Find your user account
4. Click **Edit**
5. Ensure there's a `role` field:
   - If it doesn't exist, add it: **Add field** → **Text** → Name: `role`
6. Set `role` value to: `admin`
7. Click **Save**

### If Role Field Doesn't Exist

You need to add the `role` field to the users collection:

1. Go to **Collections** → **users**
2. Click the **⚙️ Settings** icon
3. Go to **Fields** tab
4. Click **Add field**
5. Select **Text**
6. Set:
   - **Name:** `role`
   - **Default value:** `user`
   - **Required:** No
7. Click **Create**
8. Now edit your user and set `role` to `admin`

---

## 4. Verify Setup

### Test Admin Authentication

```bash
curl -X GET http://localhost:3000/api/admin/check-access \
  -H "Cookie: pb_auth=YOUR_POCKETBASE_AUTH_COOKIE"
```

Should return:
```json
{
  "authorized": true,
  "user": {
    "id": "...",
    "email": "...",
    "name": "..."
  }
}
```

### Test Add Credits by Email

```bash
curl -X POST http://localhost:3000/api/admin/credits/add-by-email \
  -H "Content-Type: application/json" \
  -H "Cookie: pb_auth=YOUR_POCKETBASE_AUTH_COOKIE" \
  -d '{
    "email": "user@example.com",
    "tokens": 10000
  }'
```

Should return:
```json
{
  "success": true,
  "message": "Successfully added 10000 tokens to user@example.com",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "previousTokens": 0,
    "newTokens": 10000
  }
}
```

### Test Pricing Management

1. Go to `http://localhost:3000/admin/pricing`
2. Try editing a package price
3. Click **Save Configuration**
4. Check for success message

---

## Common Issues

### Issue: "Unauthorized" when accessing admin endpoints

**Causes:**
- User `role` is not set to `admin`
- Not logged into PocketBase
- `pb_auth` cookie missing

**Solutions:**
1. Verify user role in PocketBase: `http://localhost:8090/_/`
2. Log in to your app first
3. Check browser DevTools → Application → Cookies → `pb_auth` exists

### Issue: "User not found" when adding credits by email

**Causes:**
- Email doesn't match exactly (case-sensitive)
- User doesn't exist in database
- Admin credentials not configured (now FIXED)

**Solutions:**
1. Check exact email in PocketBase users collection
2. Verify `POCKETBASE_ADMIN_EMAIL` and `POCKETBASE_ADMIN_PASSWORD` in `.env`
3. Restart server after adding credentials

### Issue: Pricing changes don't save

**Causes:**
- `settings` collection doesn't exist
- Admin credentials not configured
- PocketBase admin account doesn't have permissions

**Solutions:**
1. Create `settings` collection (see Section 2)
2. Add admin credentials to `.env`
3. Restart server
4. Check browser console for error details (now shows error messages)

### Issue: "Failed to authenticate admin PocketBase client"

**Cause:** Admin credentials in `.env` are incorrect

**Solutions:**
1. Verify credentials in PocketBase: `http://localhost:8090/_/` → **Settings** → **Admins**
2. Update `.env` with correct credentials
3. Restart server

---

## Environment Variables Checklist

Your `.env` file should have:

```bash
# PocketBase
NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090

# PocketBase Admin Credentials (REQUIRED for admin features)
POCKETBASE_ADMIN_EMAIL=admin@yourdomain.com
POCKETBASE_ADMIN_PASSWORD=your-secure-password

# Payment Gateway
ZARINPAL_MERCHANT_ID=your-merchant-id

# AI Providers
GEMINI_API_KEY=your-gemini-key

# Optional: Override Pricing Configuration
# PRICING_CONFIG_JSON='{"packages":{"pro":{"prices":{"USD":19.99}}}}'
```

---

## Security Notes

### Admin Credentials

⚠️ **IMPORTANT:** Never commit admin credentials to version control!

- Add `.env` to `.gitignore`
- Use different credentials for production
- Rotate credentials regularly

### Admin User Role

- Only trusted users should have `role: "admin"`
- Regular users should have `role: "user"` (or no role field)
- Admin role grants access to:
  - User credit management
  - Pricing configuration
  - Payment analytics
  - System statistics

---

## Next Steps

After setup:

1. ✅ Visit `/admin/pricing` to manage pricing
2. ✅ Test adding credits by email
3. ✅ Review credit statistics at `/api/admin/credits/stats`
4. ✅ Configure pricing as needed

For more information:
- [Quick Start Guide](./QUICK_START_CREDIT_SYSTEM.md)
- [Endpoint Verification](./plans/#done_ENDPOINT_VERIFICATION_AND_FIXES.md)
