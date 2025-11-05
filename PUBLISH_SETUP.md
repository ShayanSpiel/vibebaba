# Publish Button Setup Guide

This guide explains how the publish button works in both **development (localhost)** and **production (vibebaba.com)** environments.

## 🎯 How It Works

The publish system automatically detects your environment and adapts:

### Development Mode (localhost)
- ✅ **Works immediately** - no DNS or SSL setup needed
- Projects are published to: `http://localhost:4000/apps/project-{id}`
- Uses path-based routing instead of subdomains
- Perfect for testing the publish flow

### Production Mode (vibebaba.com)
- Uses real subdomains: `https://my-app.vibebaba.com`
- Requires DNS and SSL configuration (see below)
- Custom domains supported

---

## 🚀 Quick Start (Localhost)

### 1. Start Your Servers

```bash
# Terminal 1: Start PocketBase
cd pocketbase
./pocketbase serve

# Terminal 2: Start Deployment Server
cd deployment-server
node server.js

# Terminal 3: Start Next.js App
npm run dev
```

### 2. Test the Publish Flow

1. Create a new project
2. Wait for it to build
3. Click the **"Publish"** button in the header
4. You'll see a modal with:
   - **Development Mode** badge (amber)
   - Auto-generated project identifier (e.g., `todo-app-2k3f`)
   - Blue info box showing the localhost URL
5. Click **"Publish Now"**
6. You'll get a toast notification with the URL
7. The app is now accessible at `http://localhost:4000/apps/project-{id}`

### 3. What Happens Under the Hood

```
┌─────────────────────────────────────────────────────┐
│ 1. Click "Publish"                                  │
│    └─> Opens PublishModal with AI-generated name   │
├─────────────────────────────────────────────────────┤
│ 2. Enter subdomain (or keep generated name)         │
│    └─> Real-time availability check                │
├─────────────────────────────────────────────────────┤
│ 3. Click "Publish Now"                              │
│    ├─> POST /api/subdomains/publish                │
│    ├─> Updates PocketBase (isPublished=true)       │
│    ├─> Notifies deployment server                  │
│    └─> Returns localhost URL                       │
├─────────────────────────────────────────────────────┤
│ 4. Toast notification shows success                 │
│    └─> URL: http://localhost:4000/apps/project-... │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Environment Detection

The system uses `lib/domain-config.ts` to detect the environment:

```typescript
// Development if:
- process.env.NODE_ENV === 'development'
- process.env.NEXT_PUBLIC_ENV === 'development'
- window.location.hostname === 'localhost'

// Production otherwise
```

You can force production mode for testing by setting:
```bash
export NEXT_PUBLIC_ENV=production
```

---

## 📦 Database Schema

The following fields were added to the `projects` collection:

| Field | Type | Description |
|-------|------|-------------|
| `defaultName` | text | AI-generated URL-friendly name |
| `subdomain` | text | Current subdomain (initially same as defaultName) |
| `customDomain` | text | Optional custom domain |
| `isPublished` | boolean | Publication status |
| `publishedAt` | datetime | Publication timestamp |

Migration file: `deployment-server/pb_migrations/1761600000_add_publish_fields.js`

---

## 🎨 Features

### ✅ Already Working on Localhost

1. **AI-Generated Names**
   - Automatically creates URL-friendly names from project descriptions
   - Format: `{description-words}-{random-4-chars}`
   - Example: `todo-app-2k3f`, `blog-platform-8x9m`

2. **Real-time Availability Check**
   - Checks if subdomain is available as you type
   - 500ms debounce to avoid excessive API calls
   - Visual indicators: ✓ Available, ✗ Taken, ⏳ Checking

3. **Toast Notifications**
   - Success: "Published to {url}"
   - Error: Shows specific error message
   - Loading state during publish

4. **Publish/Unpublish**
   - Toggle publication status
   - Maintains subdomain mapping
   - Updates database automatically

### 🚀 Production-Only Features

1. **Real Subdomains**
   - `my-app.vibebaba.com` instead of `/apps/project-{id}`
   - Wildcard SSL certificate
   - Subdomain routing middleware

2. **Custom Domains**
   - Users can add their own domains
   - DNS instructions provided in modal
   - A and CNAME record setup

---

## 🔐 Reserved Subdomains

The following subdomains cannot be used (configured in `lib/generate-project-name.ts`):

```
www, api, admin, app, mail, ftp, smtp, pop, imap, blog,
shop, store, cdn, static, assets, files, media, images,
uploads, download, downloads, login, signin, signup,
register, auth, account, accounts, user, users, dashboard,
console, control, panel, cpanel, webmail, mysql, pgsql,
database, db, ns1, ns2, ns3, dns, mx, localhost, test,
dev, development, staging, production, prod
```

---

## 🌐 Production Deployment

When you're ready to deploy to production:

### 1. Database Migration

```bash
cd deployment-server
# Restart PocketBase to run migration
./pocketbase serve
```

### 2. DNS Configuration

Add these records to your DNS provider:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | [YOUR_SERVER_IP] | 3600 |
| A | * | [YOUR_SERVER_IP] | 3600 |
| CNAME | www | vibebaba.com | 3600 |

### 3. SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get wildcard certificate
sudo certbot certonly --manual --preferred-challenges dns \
  -d vibebaba.com -d *.vibebaba.com

# Follow prompts to add TXT record:
# Name: _acme-challenge.vibebaba.com
# Type: TXT
# Value: [provided by certbot]
```

### 4. Nginx Setup

```bash
# Copy config
sudo cp deployment-server/nginx/vibebaba.conf /etc/nginx/sites-available/vibebaba
sudo ln -s /etc/nginx/sites-available/vibebaba /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Environment Variables

```bash
# In your .env or server config
export NODE_ENV=production
export DEPLOYMENT_SERVER_URL=http://localhost:4000
```

### 6. Start Services

```bash
# Start deployment server
cd deployment-server
NODE_ENV=production node server.js

# Start Next.js app
npm run build
npm start
```

---

## 🧪 Testing Checklist

### Localhost Testing

- [ ] Create a new project
- [ ] Wait for build to complete
- [ ] Click "Publish" button
- [ ] Verify modal shows "Development Mode" badge
- [ ] Check that auto-generated name appears
- [ ] Try changing the subdomain
- [ ] Verify availability checking works
- [ ] Click "Publish Now"
- [ ] Verify toast notification appears
- [ ] Open the published URL
- [ ] Verify app loads correctly
- [ ] Test unpublish functionality

### Production Testing

- [ ] DNS records are configured
- [ ] SSL certificate is installed
- [ ] Nginx is configured and running
- [ ] Environment is set to production
- [ ] Publish a project
- [ ] Verify subdomain works (e.g., my-app.vibebaba.com)
- [ ] Test custom domain
- [ ] Verify DNS instructions are shown
- [ ] Test unpublish

---

## 🐛 Troubleshooting

### "Subdomain already taken" but I just deleted the project

The subdomain mapping persists in `deployment-server/subdomain-map.json`. Delete the file or restart the deployment server.

### Published URL shows 404

1. Check deployment server is running
2. Verify project is deployed: `http://localhost:4000/apps/project-{id}`
3. Check deployment server logs

### Toast notifications not showing

1. Verify Toaster is added to `app/layout.tsx`
2. Check browser console for errors
3. Ensure `sonner` package is installed: `npm install sonner`

### Modal doesn't detect environment correctly

Check these in order:
1. `process.env.NODE_ENV` value
2. `process.env.NEXT_PUBLIC_ENV` value
3. Window hostname (should be 'localhost')

### Subdomain availability check not working

1. Verify API endpoint exists: `/api/subdomains/check/route.ts`
2. Check browser network tab for API calls
3. Check PocketBase is running and accessible

---

## 📁 Files Modified/Created

### New Files (11)

1. `deployment-server/pb_migrations/1761600000_add_publish_fields.js`
2. `lib/generate-project-name.ts`
3. `lib/domain-config.ts`
4. `app/api/subdomains/check/route.ts`
5. `app/api/subdomains/publish/route.ts`
6. `deployment-server/nginx/vibebaba.conf`
7. `deployment-server/nginx/README.md`
8. `deployment-server/subdomain-map.json` (auto-generated)
9. `PUBLISH_SETUP.md` (this file)

### Modified Files (5)

1. `lib/project-helpers.ts` - Added publish fields and AI name generation
2. `components/project/PublishModal.tsx` - Complete rewrite with real functionality
3. `deployment-server/server.js` - Added publish endpoints and routing
4. `app/layout.tsx` - Added Toaster component
5. `package.json` - Added `sonner` dependency

---

## 🎯 Summary

The publish button is **fully functional on localhost** and ready for testing!

- No DNS or SSL setup needed for local development
- Automatic environment detection
- AI-generated project names
- Real-time subdomain checking
- Toast notifications for feedback
- Ready to switch to production with minimal config changes

**Start testing now by following the Quick Start section above!** 🚀
