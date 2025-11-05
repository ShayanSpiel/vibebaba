# Vibebaba Deployment Server

Real deployment infrastructure with PocketBase database for Vibebaba projects.

## What Changed

### ❌ Removed
- **VFS (Virtual File System)** - No more iframe-only fake preview
- **localStorage database** - No more browser-only data storage
- **CustomEvent messaging** - No more iframe parent communication hacks
- **base64 encoding** - Files served normally

### ✅ Added
- **Real deployment server** - Express server on `localhost:4000`
- **Real database** - PocketBase on `localhost:8090`
- **Real URLs** - Each project gets `http://localhost:4000/apps/project-{id}/`
- **Auto-deploy** - Code changes deploy automatically
- **Page navigation sidebar** - Visual page tree for multi-page apps

## Quick Start

### 1. Install Dependencies

```bash
cd deployment-server
npm install
```

### 2. Start Everything

```bash
./start.sh
```

This will:
- Download PocketBase (if not already downloaded)
- Start PocketBase on `localhost:8090`
- Start deployment server on `localhost:4000`

### 3. Start Main App (in another terminal)

```bash
cd ..
npm run dev
```

Your main Vibebaba app runs on `localhost:3000` as before.

## How It Works

```
User creates app
    ↓
AI generates code
    ↓
Auto-deploys to localhost:4000/apps/project-{id}/
    ↓
Preview shows REAL deployed app
    ↓
User edits code
    ↓
Auto-redeploys (1 second debounce)
    ↓
Database operations → PocketBase
```

## Architecture

### Main App (localhost:3000)
- User interface
- AI code generation
- Project management

### Deployment Server (localhost:4000)
- Serves deployed apps at `/apps/project-{id}/`
- Database API at `/api/db/:projectId/:collection`
- Auto-creates PocketBase collections
- Generates sample data

### PocketBase (localhost:8090)
- Real database backend
- Admin UI at `http://localhost:8090/_/`
- Collections: `{projectId}_{collectionName}`

## Database API

Generated apps get this API injected:

```javascript
// Get all records
const users = await db.get('users');

// Add a record
const newUser = await db.add('users', {
  name: 'Alice',
  email: 'alice@example.com'
});

// Update a record
await db.update('users', userId, {
  name: 'Alice Updated'
});

// Delete a record
await db.delete('users', userId);

// Find records
const admins = await db.find('users', user => user.role === 'admin');
```

## PocketBase Admin

Access admin panel: `http://localhost:8090/_/`

**Default credentials:**
- Email: `admin@vibebaba.com`
- Password: `admin1234567890`

You'll be prompted to create an admin account on first run.

## File Structure

```
deployment-server/
├── server.js           # Main Express server
├── pocketbase.js       # PocketBase integration
├── db-routes.js        # Database API routes
├── start.sh            # Startup script
├── deployments/        # Deployed project files
│   ├── project-abc123/
│   │   ├── index.html
│   │   └── about.html
│   └── project-xyz789/
│       └── index.html
└── pb_data/            # PocketBase database (auto-created)
```

## Troubleshooting

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::4000`

**Solution:**
```bash
# Find process using port 4000
lsof -ti:4000

# Kill it
kill -9 <PID>
```

### PocketBase Won't Start

**Error:** `permission denied: ./pocketbase`

**Solution:**
```bash
chmod +x pocketbase
```

### CORS Errors

The deployment server has CORS enabled for `localhost:3000`. If you're running the main app on a different port, update `server.js`:

```javascript
app.use(cors({
  origin: 'http://localhost:YOUR_PORT'
}));
```

## Development Workflow

1. **User creates project** → Vibebaba frontend (`localhost:3000`)
2. **AI generates code** → Files sent to `/deploy/:projectId`
3. **Server deploys** → Files written to `deployments/project-{id}/`
4. **PocketBase creates collections** → Database schema auto-created
5. **Sample data generated** → Collections populated
6. **Preview loads** → Iframe shows `localhost:4000/apps/project-{id}/`
7. **User edits code** → Auto-redeploy triggered
8. **Database operations** → App calls `localhost:4000/api/db/...`

## Production Deployment

For production, you'll need to:

1. **Replace URLs** in:
   - `lib/hooks/useDeployment.ts` → Change `localhost:4000` to production URL
   - `app/api/ai/prototype/route.ts` → Change DB_API_URL
   - `components/project/DatabaseViewerPro.tsx` → Change DB_API_URL

2. **Use real hosting**:
   - Deploy to Vercel/Netlify/Railway
   - Use hosted PocketBase or PostgreSQL
   - Update DNS records

3. **Environment variables**:
   ```env
   DEPLOYMENT_SERVER_URL=https://deploy.vibebaba.com
   DATABASE_URL=https://db.vibebaba.com
   POCKETBASE_URL=https://pb.vibebaba.com
   ```

## Next Steps

- [ ] Custom domains support
- [ ] Production deployment pipeline
- [ ] Database export (CSV/JSON)
- [ ] Deployment history/rollback
- [ ] Environment variables per project
- [ ] Rate limiting
- [ ] Authentication for deployed apps

## Support

Issues? Check:
- Deployment server logs
- PocketBase logs: `deployment-server/pocketbase.log`
- Browser console
- Network tab (check API calls)
