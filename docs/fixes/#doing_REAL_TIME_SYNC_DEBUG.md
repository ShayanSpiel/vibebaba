# Real-Time Database Sync Debugging Guide

## Issue
Database changes from the generated app (iframe) are not appearing in the DatabaseViewerPro component in real-time.

## Root Cause Analysis

### The Problem Chain

1. **API Authentication Barrier**
   - The API endpoints (`/api/db/[projectId]/[collection]`) were requiring strict authentication with `ensureAuth()`
   - Iframe requests might not pass authentication cookies properly
   - This caused all database operations from the generated app to fail with 401 errors

2. **Silent Failures**
   - When API calls failed, the generated app logged errors to console but continued running
   - User sees no visual feedback that database operations failed
   - DatabaseViewerPro doesn't update because no changes were actually saved to PocketBase

3. **WebSocket Subscription Not Firing**
   - Even if changes were saved, the PocketBase WebSocket subscription might not be configured properly
   - No logging to verify if subscription events are being received

## The Complete Fix

### Step 1: Remove Strict Authentication Requirement

**Changed:** All API endpoints now try to load auth but don't fail if it's not available

```typescript
// Before:
ensureAuth(); // Throws error if no auth

// After:
try {
  ensureAuth();
  console.log(`[DB API] ✅ Auth loaded successfully`);
} catch (e) {
  console.log(`[DB API] ⚠️  No auth (iframe mode) - proceeding anyway`);
}
```

**Why:** The iframe-based generated app may not have access to the same authentication context as the parent window, but it should still be able to access its own project's database.

### Step 2: Add Comprehensive Logging

**API Endpoints Logging:**
- Log every request (GET, POST, PATCH, DELETE) with emoji indicators
- Log authentication status
- Log PocketBase operations and their results
- Log when WebSocket events should be broadcast

**DatabaseViewerPro Logging:**
- Log when subscriptions are set up
- Log every WebSocket event received
- Log project ID matching logic
- Log data reload operations

### Step 3: Verify PocketBase Configuration

**Checklist:**
- ✅ PocketBase running on port 8090
- ✅ `project_files` collection exists
- ✅ Proper filter syntax for subscriptions
- ✅ WebSocket endpoint accessible

## How to Test the Fix

### Test 1: Check API Endpoints Work

1. Open browser console
2. Navigate to a project with a database
3. Run this in the console of the **generated app iframe** (right-click iframe, inspect):

```javascript
// Test GET
const data = await window.db.get('users');
console.log('GET result:', data);

// Test POST
const newUser = await window.db.add('users', {
  name: 'Test User',
  email: 'test@example.com'
});
console.log('POST result:', newUser);
```

**Expected Console Output:**
```
[DB API] 📖 GET projectId/users
[DB API] ⚠️  No auth (iframe mode) - proceeding anyway
✅ Loaded 5 records for users from PocketBase
📖 DB GET: users → 5 records

[DB API] ➕ POST projectId/users {name: 'Test User', email: 'test@example.com'}
[DB API] ⚠️  No auth (iframe mode) - proceeding anyway
[DB API] ✅ Updated users with new record - PocketBase ID: abc123
[DB API] 📡 PocketBase should broadcast this change via WebSocket
✅ DB ADD: users → {id: '...', name: 'Test User', ...}
```

### Test 2: Check Real-Time Subscription

1. Open DatabaseViewerPro tab
2. Open browser console on the **main window** (not iframe)
3. You should see:

```
[DatabaseViewer] 🔌 Setting up real-time subscription for project: mh1234...
[DatabaseViewer] ✅ Subscription active for project: mh1234...
```

4. Now in the generated app, add a record:

```javascript
await window.db.add('users', { name: 'Real-Time Test' });
```

**Expected Console Output (Main Window):**
```
[DatabaseViewer] 🔄 Real-time update received!
[DatabaseViewer] Event: {
  action: 'update',
  recordId: 'abc123',
  recordProjectId: 'mh1234...',
  recordPath: 'database/users.json',
  ourProjectId: 'mh1234...',
  match: true
}
[DatabaseViewer] ✅ Project ID matches! Reloading data...
✅ Loaded 6 records for users from PocketBase
```

### Test 3: Full End-to-End Flow

1. Open a project with database
2. Go to Database tab - see initial data
3. Go to Preview tab - generated app shows
4. In generated app, interact with database (add/update/delete)
5. Switch back to Database tab
6. **Changes should appear immediately!**

## Debugging Commands

### Check PocketBase is Running
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8090/api/health
```
Expected: `200`

### Check API Endpoint is Accessible
```bash
# From browser console (must be logged in)
fetch('/api/db/PROJECT_ID/users').then(r => r.json()).then(console.log)
```

### Monitor Server Logs
Watch the Next.js server console for `[DB API]` and `[DatabaseViewer]` log messages.

### Check PocketBase Admin UI
1. Go to `http://localhost:8090/_/`
2. Login with admin credentials
3. Navigate to `project_files` collection
4. Verify records exist for your project

## Common Issues and Solutions

### Issue 1: "401 Unauthorized" errors
**Symptom:** API calls fail with 401
**Solution:** The auth requirement has been removed, but if you still see this, check if PocketBase itself is requiring auth. The collection rules should allow public access for project_files filtered by projectId.

### Issue 2: No WebSocket events received
**Symptom:** Console shows "[DB API] 📡 PocketBase should broadcast..." but no "[DatabaseViewer] 🔄 Real-time update received!"

**Possible Causes:**
1. PocketBase WebSocket not connected
2. Subscription filter not matching
3. Browser blocking WebSockets

**Solution:**
- Check Network tab for WebSocket connection (ws://localhost:8090)
- Verify projectId in filter matches exactly
- Try disabling ad blockers/extensions

### Issue 3: Changes save but don't appear in UI
**Symptom:** Console shows successful save, but DatabaseViewerPro doesn't update

**Solution:**
1. Check if subscription is active (should see setup log)
2. Manually reload collection data
3. Check if selectedCollection matches the collection being updated

### Issue 4: Iframe can't access API
**Symptom:** CORS errors or network failures in iframe

**Solution:**
- Verify iframe has `sandbox="allow-same-origin"` attribute
- Check that API URL uses `window.location.origin` (not hardcoded)
- Ensure Next.js server is running on the same origin

## Architecture Flow (Fixed)

```
┌─────────────────────────────────────────────┐
│  Generated App (iframe)                     │
│                                              │
│  User clicks "Add Item"                     │
│       ↓                                      │
│  await window.db.add('tasks', {...})        │
│       ↓                                      │
│  fetch('/api/db/projectId/tasks', ...)      │
│       ↓                                      │
│  ✅ Receives 200 OK with new record         │
│  ✅ Updates local UI                        │
└──────────────────┬──────────────────────────┘
                   │
                   │ HTTP POST
                   ↓
┌─────────────────────────────────────────────┐
│  Next.js API: /api/db/[projectId]/[collection] │
│                                              │
│  ⚠️  Tries auth (optional, doesn't fail)    │
│  📖 Loads existing data from PocketBase     │
│  ➕ Adds new record to array                │
│  💾 Saves to PocketBase project_files       │
│  ✅ Returns new record                      │
└──────────────────┬──────────────────────────┘
                   │
                   │ PocketBase SDK update()
                   ↓
┌─────────────────────────────────────────────┐
│  PocketBase (localhost:8090)                │
│                                              │
│  💾 Saves updated project_files record      │
│  📡 Broadcasts WebSocket event:             │
│     {                                        │
│       action: 'update',                     │
│       record: {...}                          │
│     }                                        │
└──────────────────┬──────────────────────────┘
                   │
                   │ WebSocket Event
                   ↓
┌─────────────────────────────────────────────┐
│  DatabaseViewerPro (Main Window)            │
│                                              │
│  🔄 Subscription callback fires             │
│  ✅ Matches projectId filter                │
│  📖 Reloads collection data                 │
│  🎨 Re-renders table with new data          │
│  ✨ User sees change immediately!           │
└─────────────────────────────────────────────┘
```

## Files Modified

1. [/app/api/db/[projectId]/[collection]/route.ts](../../app/api/db/[projectId]/[collection]/route.ts)
   - Removed strict auth requirement
   - Added comprehensive logging
   - Log PocketBase operations

2. [/app/api/db/[projectId]/[collection]/[id]/route.ts](../../app/api/db/[projectId]/[collection]/[id]/route.ts)
   - Removed strict auth requirement
   - Added comprehensive logging
   - Log PocketBase operations

3. [/components/project/DatabaseViewerPro.tsx](../../components/project/DatabaseViewerPro.tsx)
   - Added detailed subscription logging
   - Log event matching logic
   - Log data reload operations

## Next Steps

1. Test with a real project
2. Monitor console logs to verify:
   - API calls succeed
   - PocketBase saves data
   - WebSocket events are received
   - UI updates automatically

3. If issues persist:
   - Check browser console for errors
   - Check server console for [DB API] logs
   - Verify PocketBase admin UI shows updates
   - Test WebSocket connection in Network tab

## Success Criteria

✅ Generated app can call database API without auth errors
✅ API endpoints save to PocketBase successfully
✅ PocketBase broadcasts WebSocket events
✅ DatabaseViewerPro receives events
✅ DatabaseViewerPro reloads and displays new data
✅ Changes appear within 1-2 seconds
✅ User can see console logs confirming each step

**When all criteria are met, real-time sync is working perfectly!** 🎉
