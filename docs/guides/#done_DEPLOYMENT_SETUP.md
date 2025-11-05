# 🚀 Real Deployment Setup Guide

Your Vibebaba now uses **real deployment** instead of fake iframe preview!

## What's New

✅ **Real server deployment** - Every project gets a real URL
✅ **Real database** - PocketBase instead of localStorage
✅ **Auto-deploy** - Changes deploy automatically
✅ **Page navigation** - Visual sidebar for multi-page apps
✅ **Production-ready** - Same architecture works for production

## Installation (2 minutes)

### Step 1: Install Deployment Server Dependencies

```bash
cd deployment-server
npm install
```

### Step 2: Start Deployment Infrastructure

```bash
./start.sh
```

You'll see:
```
✅ All services running!
🗄️  PocketBase Admin: http://localhost:8090/_/
🚀 Deployment Server: http://localhost:4000
```

### Step 3: Start Main App (new terminal)

```bash
cd ..
npm run dev
```

Your app runs on `localhost:3000` as before.

## First Time Setup - Create PocketBase Admin

1. Open `http://localhost:8090/_/` in your browser
2. Create admin account:
   - Email: `admin@vibebaba.com`
   - Password: `admin1234567890` (or your choice)

**That's it!** You're ready to go.

## Test It Out

1. Go to `localhost:3000`
2. Create a new project
3. Watch it auto-deploy to `localhost:4000/apps/project-{id}/`
4. Check the database at `localhost:8090/_/`

## How It Works Now

### Before (Old System):
```
AI generates code
    ↓
VFS wraps files in base64
    ↓
Iframe shows fake preview
    ↓
localStorage stores "database"
```

### Now (New System):
```
AI generates code
    ↓
Auto-deploys to Express server
    ↓
Real URL: localhost:4000/apps/project-{id}/
    ↓
Real database: PocketBase
```

## Key Changes

### 1. Preview Section
- **Before**: Fake iframe with VFS
- **Now**: Real deployment URL + page navigation sidebar

### 2. Database
- **Before**: localStorage (browser-only, temporary)
- **Now**: PocketBase (real database, persistent)

### 3. Generated Apps
- **Before**: `window.db.get()` → localStorage
- **Now**: `await window.db.get()` → API calls to PocketBase

### 4. Code Editing
- **Before**: Edit → Instant iframe update
- **Now**: Edit → Auto-deploy (1 second debounce) → Real server update

## What Changed in Your Code

### Modified Files:
1. `components/project/BrowserPreview.tsx` - Uses real URLs now
2. `components/project/PreviewTabs.tsx` - Auto-deployment logic
3. `components/project/DatabaseViewerPro.tsx` - Calls real API
4. `app/api/ai/prototype/route.ts` - Injects real DB API

### New Files:
1. `deployment-server/server.js` - Express deployment server
2. `deployment-server/pocketbase.js` - Database integration
3. `deployment-server/db-routes.js` - Database API
4. `lib/hooks/useDeployment.ts` - React deployment hook

## Stopping Services

Press `Ctrl+C` in the terminal running `start.sh`

Or manually:
```bash
# Kill deployment server
lsof -ti:4000 | xargs kill -9

# Kill PocketBase
lsof -ti:8090 | xargs kill -9
```

## Troubleshooting

### "Port already in use"
```bash
# Kill processes on port 4000
lsof -ti:4000 | xargs kill -9

# Kill processes on port 8090
lsof -ti:8090 | xargs kill -9
```

### "Permission denied: ./pocketbase"
```bash
cd deployment-server
chmod +x pocketbase
```

### "Cannot connect to deployment server"
Make sure `start.sh` is running in deployment-server directory.

### "Database not updating"
Check PocketBase is running at `localhost:8090`

## Development Workflow

1. **Create project** in main app
2. **AI generates** code automatically
3. **Auto-deploys** to real server
4. **Preview shows** actual deployed app
5. **Edit code** → Auto-redeploys
6. **Add database records** → Stored in PocketBase
7. **View in database tab** → Real data from PocketBase

## Production Deployment (Later)

When ready for production:

1. Deploy deployment server to Railway/Render
2. Use hosted PocketBase or migrate to PostgreSQL
3. Update API URLs in code
4. Set up custom domains

Details in `deployment-server/README.md`

## Questions?

Check `deployment-server/README.md` for detailed docs.

**Happy deploying! 🚀**
