# Quick Setup: Settings Collection

## The Easy Way (One Click) 🚀

1. Go to the pricing admin page: `http://localhost:3000/admin/pricing`
2. Click the **"🔧 Setup Settings Collection"** button in the top-right corner
3. Wait for confirmation message
4. Done! Try saving pricing changes now

---

## Alternative Methods

### Method 1: Run Script

```bash
npx ts-node scripts/create-settings-collection.ts
```

Make sure you have admin credentials in `.env`:
```bash
POCKETBASE_ADMIN_EMAIL=admin@yourdomain.com
POCKETBASE_ADMIN_PASSWORD=your-password
```

### Method 2: Manual Creation in PocketBase UI

1. Go to `http://localhost:8090/_/`
2. Click **Collections** → **New Collection**
3. Fill in:
   - **Name:** `settings`
   - **Type:** Base collection
4. Add fields:
   - `key` - Text, Required, Unique
   - `value` - JSON, Required
   - `description` - Text, Optional
5. Click **Create**

**Note:** Don't add `id`, `created`, or `updated` fields - PocketBase manages these automatically!

### Method 3: SQL (Advanced)

If you have direct database access:

```sql
CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated DATETIME,
  created DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_settings_key ON settings (key);
```

---

## Verification

After creating the collection, verify it works:

1. Go to `/admin/pricing`
2. Try changing a package price
3. Click "Save Configuration"
4. You should see: **"✅ Package starter saved successfully!"**

---

## Troubleshooting

### Button says "Creating..." forever

**Check:**
- Server logs for errors
- Admin credentials are configured
- PocketBase is running

### Still get "Settings collection does not exist"

**Try:**
1. Refresh the page
2. Check PocketBase UI that collection was actually created
3. Check collection name is exactly `settings` (lowercase)
4. Try manual creation method

### Error: "Failed to create collection"

**Check:**
- Admin credentials in `.env` are correct
- PocketBase is running on the correct URL
- You have permission to create collections

---

## What This Collection Does

The `settings` collection stores:
- Pricing configuration overrides
- Admin panel settings
- Other system configuration

**Fields:**
- `key` - Unique identifier (e.g., "pricing_config")
- `value` - JSON data stored as configuration
- `description` - Human-readable description
- `updated` - Last update timestamp

**Access Rules:**
- Admin-only (no public access)
- Secure by default

---

## Next Steps

Once collection is created:

1. ✅ Save pricing changes
2. ✅ Copy generated environment variable
3. ✅ Add to `.env` or production config
4. ✅ Restart server to activate changes

See [ADMIN_SETUP_GUIDE.md](./ADMIN_SETUP_GUIDE.md) for complete admin setup.
