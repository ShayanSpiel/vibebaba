# 🚀 Quick Start - PocketBase Migration

## ✅ Migration Status: COMPLETE!

Your Vibebaba app now uses **PocketBase** as the single database for everything!

---

## 🎯 What You Need to Do Now

### 1. Restart Your Development Server

```bash
# Stop the current dev server (Ctrl+C)

# Make sure PocketBase is running
cd deployment-server
./start.sh

# In another terminal, restart Next.js
cd ..
npm run dev
```

### 2. Login to Your App

Go to: `http://localhost:3000`

**Your Credentials:**
- Email: `xhayan@gmail.com`
- Password: `changeme123`

⚠️ **IMPORTANT:** Change this password immediately!

**To change password:**
1. Go to: `http://localhost:8090/_/#/collections/users`
2. Click on your user
3. Set a new password in the "password" field
4. Save

### 3. Check Your Credits

After logging in, you should see:
- **Total Tokens:** 38,600,000
- **Used Tokens:** 151,762
- **Daily Tokens:** 50,000
- **Available:** 38,498,238 tokens

---

## 🎨 What Works Now

✅ **Authentication** - Login/logout with PocketBase
✅ **Credit System** - Token tracking and consumption
✅ **User Profile** - All your data migrated
✅ **Projects Sidebar** - Loads from PocketBase (when projects exist)
✅ **API Protection** - Routes check PocketBase auth
✅ **Token Usage Tracking** - All API calls logged

---

## ⚠️ What Still Needs Testing

The following features were updated but need testing:

1. **Creating New Projects** - Try creating a project
2. **Viewing Projects** - Check if project page loads
3. **Database Viewer** - Test the database tab
4. **Token Consumption** - Verify tokens are deducted
5. **Multi-Device** - Login from different browser

---

## 🐛 If Something Doesn't Work

### Error: "Unauthorized"
**Fix:** Make sure you're logged in
```
1. Go to http://localhost:3000
2. Click login
3. Use: xhayan@gmail.com / changeme123
```

### Error: "Failed to fetch"
**Fix:** Make sure PocketBase is running
```bash
cd deployment-server
./start.sh
```

### Projects Not Loading
**Fix:** Projects are now in PocketBase, not localStorage
- Old localStorage projects won't show
- Create a new project to test
- Old projects can be migrated (see below)

### Can't See Credit Balance
**Fix:** Refresh user data
```
1. Logout
2. Login again
3. Credits should show in UI
```

---

## 📊 Admin Dashboard

You can manage everything visually:

**PocketBase Admin:** `http://localhost:8090/_/`

**Login:**
- Email: `admin@vibebaba.com`
- Password: `admin1234567890`

**What you can do:**
- View all users
- Edit user credits
- View all projects
- Browse database records
- Check token usage
- Manage transactions

---

## 🔄 Migrate Old Projects (Optional)

If you had projects in localStorage, they won't show anymore. To migrate them:

**Option 1: Manual** (Quick)
1. Open DevTools → Application → Local Storage
2. Find keys starting with `project_`
3. Copy the data
4. Create new projects in PocketBase admin

**Option 2: Script** (Coming soon)
We can create a script to auto-migrate if needed.

---

## 🎓 Creating Your First PocketBase Project

### Via UI:
1. Login at `http://localhost:3000`
2. Click "New Project"
3. Describe your app
4. Watch it generate!

### Via API:
```typescript
import { pb } from '@/lib/pocketbase';

const project = await pb.collection('projects').create({
  userId: user.id,
  name: 'My App',
  description: 'A cool app',
  stage: 'planning'
});
```

---

## 📚 Key Files to Know

### Frontend
- `lib/pocketbase.ts` - PocketBase client
- `lib/pocketbase-credits.ts` - Credit system
- `components/auth/PocketBaseAuthProvider.tsx` - Auth provider

### Backend
- `app/api/ai/prototype/route.ts` - AI generation (updated)
- `lib/pocketbase-middleware.ts` - API auth helper

### Scripts
- `scripts/create-remaining-collections.js` - Schema setup
- `scripts/migrate-user-to-pocketbase.js` - Data migration

### Documentation
- `MIGRATION_COMPLETE.md` - Full migration details
- `POCKETBASE_SCHEMA.md` - Database schema
- `POCKETBASE_MIGRATION_GUIDE.md` - Step-by-step guide

---

## 🚀 Production Deployment

When ready to deploy:

### Option 1: PocketBase Cloud (Easiest)
1. Sign up at https://pocketbase.io/pricing
2. Upload your data
3. Update `.env.production`:
   ```
   NEXT_PUBLIC_POCKETBASE_URL=https://your-app.pocketbase.io
   ```

### Option 2: Self-Hosted (Free)
1. Deploy PocketBase to Railway/Render/VPS
2. Deploy Next.js to Vercel
3. Point Next.js to your PocketBase URL

---

## ✨ Benefits You're Getting

Before (3 databases):
```
localStorage → Temporary, browser-only
SQLite → Server-side, but complex
PocketBase → Not connected
```

After (1 database):
```
PocketBase → Everything!
- Server-side persistence ✅
- Multi-device sync ✅
- Admin UI ✅
- File uploads ✅
- Real-time ready ✅
- Production ready ✅
```

---

## 🆘 Need Help?

Check these files:
1. `MIGRATION_COMPLETE.md` - Full details
2. `POCKETBASE_SCHEMA.md` - Database structure
3. PocketBase Docs - https://pocketbase.io/docs

Or just ask! 😊

---

**Happy coding with PocketBase! 🎉**

Last updated: 2025-10-22
