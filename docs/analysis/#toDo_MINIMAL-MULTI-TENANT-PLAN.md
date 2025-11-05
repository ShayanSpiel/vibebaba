# 🚀 VibeCoding: Minimal Multi-Tenant Foundation (REVISED)

**Date:** January 2025
**Status:** 🟢 Ready for Implementation
**Estimated Time:** **8-12 hours** (down from 87-118 hours)
**Breaking Changes:** ❌ **NONE** - Fully backwards compatible

---

## 📋 Executive Summary

This is a **MINIMAL multi-tenant foundation** that:

1. ✅ **Auto-creates organization** on user signup (invisible to user)
2. ✅ **Zero UI complexity** - Users see nothing different
3. ✅ **One setting added** - Org ID shown in settings (read-only)
4. ✅ **Backwards compatible** - Existing users/projects continue working
5. ✅ **Foundation for future** - Enables org-based features later
6. ✅ **No breaking changes** - Migration script handles everything

**What's Included:**
- Organizations table (auto-created per user)
- Org members table (user is auto-owner)
- Updated projects table (with organizationId)
- Migration script (converts existing data)
- Backwards-compatible API routes

**What's EXCLUDED (Future):**
- ❌ Workspaces (not needed yet)
- ❌ Marketing/Analytics engines (future)
- ❌ Integrations (future)
- ❌ Custom nodes (future)
- ❌ Dynamic workflows (future)
- ❌ Team invitations (future)

---

## 🎯 Why This Approach?

### Current Problem
```typescript
// CURRENT: Flat structure
User → Projects
  └─ Hard to add teams later
  └─ Hard to add org-level features
  └─ Hard to scale per-organization
```

### After This Plan
```typescript
// AFTER: Hierarchical (but invisible to user)
User → Organization (auto-created) → Projects
  └─ Ready for teams (future)
  └─ Ready for org settings (future)
  └─ Ready for org-level credits (future)
  └─ Same UX for user!
```

**User Experience:**
- **Before:** User signs up → Creates projects
- **After:** User signs up → Org auto-created → Creates projects (same UX!)

---

## 📊 Database Schema Changes

### 1. `organizations` Collection

**Purpose:** Auto-created container per user (invisible to user for now)

```javascript
// PocketBase Admin UI → New Collection
{
  "name": "organizations",
  "type": "base",
  "schema": [
    {
      "name": "name",
      "type": "text",
      "required": true,
      "options": { "min": 1, "max": 200 }
    },
    {
      "name": "slug",
      "type": "text",
      "required": true,
      "unique": true,
      "options": { "min": 1, "max": 100, "pattern": "^[a-z0-9-]+$" }
    },
    {
      "name": "ownerId",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "users",
        "cascadeDelete": false,
        "minSelect": null,
        "maxSelect": 1,
        "displayFields": ["email"]
      }
    },
    {
      "name": "totalCredits",
      "type": "number",
      "required": true,
      "options": { "min": 0 }
    },
    {
      "name": "usedCredits",
      "type": "number",
      "required": true,
      "options": { "min": 0 }
    },
    {
      "name": "monthlyCredits",
      "type": "number",
      "required": true,
      "options": { "min": 0 }
    }
  ],
  "indexes": [
    "CREATE UNIQUE INDEX idx_organizations_slug ON organizations (slug)",
    "CREATE INDEX idx_organizations_owner ON organizations (ownerId)"
  ],
  "listRule": "@request.auth.id != \"\" && ownerId = @request.auth.id",
  "viewRule": "@request.auth.id != \"\" && ownerId = @request.auth.id",
  "createRule": "@request.auth.id != \"\"",
  "updateRule": "@request.auth.id != \"\" && ownerId = @request.auth.id",
  "deleteRule": null
}
```

**TypeScript Interface:**
```typescript
// lib/pocketbase.ts - ADD THIS
export interface Organization {
  id: string;
  collectionId: string;
  collectionName: string;
  name: string;
  slug: string;
  ownerId: string;
  totalCredits: number;
  usedCredits: number;
  monthlyCredits: number;
  created: string;
  updated: string;
}
```

---

### 2. `org_members` Collection

**Purpose:** Track user membership (for future team features)

```javascript
// PocketBase Admin UI → New Collection
{
  "name": "org_members",
  "type": "base",
  "schema": [
    {
      "name": "organizationId",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "organizations",
        "cascadeDelete": true,
        "minSelect": null,
        "maxSelect": 1,
        "displayFields": ["name"]
      }
    },
    {
      "name": "userId",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "users",
        "cascadeDelete": false,
        "minSelect": null,
        "maxSelect": 1,
        "displayFields": ["email"]
      }
    },
    {
      "name": "role",
      "type": "select",
      "required": true,
      "options": {
        "maxSelect": 1,
        "values": ["owner", "admin", "member", "viewer"]
      }
    }
  ],
  "indexes": [
    "CREATE UNIQUE INDEX idx_org_members_unique ON org_members (organizationId, userId)",
    "CREATE INDEX idx_org_members_user ON org_members (userId)"
  ],
  "listRule": "userId = @request.auth.id || organizationId.ownerId = @request.auth.id",
  "viewRule": "userId = @request.auth.id || organizationId.ownerId = @request.auth.id",
  "createRule": "organizationId.ownerId = @request.auth.id",
  "updateRule": "organizationId.ownerId = @request.auth.id",
  "deleteRule": "organizationId.ownerId = @request.auth.id"
}
```

**TypeScript Interface:**
```typescript
// lib/pocketbase.ts - ADD THIS
export interface OrgMember {
  id: string;
  collectionId: string;
  collectionName: string;
  organizationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  created: string;
  updated: string;
}
```

---

### 3. Update `projects` Collection

**Add organizationId field** (backwards compatible - nullable at first)

```javascript
// PocketBase Admin UI → Edit "projects" collection → Add field
{
  "name": "organizationId",
  "type": "relation",
  "required": false, // ⚠️ Start as optional for backwards compatibility
  "options": {
    "collectionId": "organizations",
    "cascadeDelete": true,
    "minSelect": null,
    "maxSelect": 1,
    "displayFields": ["name"]
  }
}
```

**Updated TypeScript Interface:**
```typescript
// lib/pocketbase.ts - UPDATE THIS
export interface Project {
  id: string;
  collectionId: string;
  collectionName: string;
  userId: string;
  organizationId?: string; // ← NEW (optional for backwards compatibility)
  name: string;
  description: string;
  stage: 'planning' | 'building' | 'completed' | 'error';
  plan?: string;
  backendConfig?: any;
  context?: any;
  thumbnail?: string;
  deployUrl?: string;
  created: string;
  updated: string;
}
```

---

## 🔧 Implementation Code (Copy-Paste Ready)

### Step 1: Auto-Create Organization on Signup

**File:** `lib/services/org-auto-create.ts` (NEW FILE)

```typescript
// lib/services/org-auto-create.ts

import { pb } from '../pocketbase';

/**
 * Auto-create organization for new user
 * Called automatically after user signup
 *
 * IMPORTANT: This is INVISIBLE to the user
 * They don't know it's happening, they just start using the app
 */
export async function autoCreateOrganization(userId: string, userEmail: string, userName?: string) {
  try {
    console.log(`[OrgAutoCreate] Creating organization for user: ${userEmail}`);

    // Check if user already has an organization
    const existingMembers = await pb.collection('org_members').getFullList({
      filter: `userId = "${userId}"`,
      expand: 'organizationId'
    });

    if (existingMembers.length > 0) {
      console.log(`[OrgAutoCreate] ✅ User already has organization: ${existingMembers[0].expand?.organizationId?.name}`);
      return existingMembers[0].expand?.organizationId;
    }

    // Generate unique slug from email
    const baseSlug = userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
    const uniqueSlug = `${baseSlug}-${Date.now()}`;

    // Get user's current credits (for migration)
    const user = await pb.collection('users').getOne(userId);

    // Create organization
    const orgName = userName ? `${userName}'s Organization` : `${userEmail}'s Organization`;
    const organization = await pb.collection('organizations').create({
      name: orgName,
      slug: uniqueSlug,
      ownerId: userId,
      totalCredits: user.totalTokens || 0,
      usedCredits: user.usedTokens || 0,
      monthlyCredits: user.dailyTokens || 0
    });

    console.log(`[OrgAutoCreate] ✅ Created organization: ${organization.id}`);

    // Add user as owner
    await pb.collection('org_members').create({
      organizationId: organization.id,
      userId: userId,
      role: 'owner'
    });

    console.log(`[OrgAutoCreate] ✅ Added user as owner`);

    return organization;

  } catch (error) {
    console.error('[OrgAutoCreate] ❌ Failed to create organization:', error);
    // Don't throw - user can still use app without org for now
    return null;
  }
}

/**
 * Get user's organization (or create if missing)
 */
export async function getUserOrganization(userId: string): Promise<any | null> {
  try {
    // Get user's org membership
    const members = await pb.collection('org_members').getFullList({
      filter: `userId = "${userId}"`,
      expand: 'organizationId'
    });

    if (members.length > 0) {
      return members[0].expand?.organizationId;
    }

    // No org found - this shouldn't happen, but handle gracefully
    console.warn(`[OrgAutoCreate] ⚠️ User ${userId} has no organization - this is unexpected`);
    return null;

  } catch (error) {
    console.error('[OrgAutoCreate] Error getting user organization:', error);
    return null;
  }
}
```

---

### Step 2: Hook into Signup Flow

**File:** `app/api/auth/signup/route.ts` (UPDATE EXISTING OR CREATE)

```typescript
// app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { pb } from '@/lib/pocketbase';
import { autoCreateOrganization } from '@/lib/services/org-auto-create';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    // Create user account (existing signup logic)
    const user = await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      name: name || '',
      emailVisibility: true
    });

    // ✨ NEW: Auto-create organization (invisible to user)
    await autoCreateOrganization(user.id, email, name);

    // Authenticate user
    await pb.collection('users').authWithPassword(email, password);

    return NextResponse.json({
      success: true,
      user: pb.authStore.model
    });

  } catch (error: any) {
    console.error('[Signup] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Signup failed' },
      { status: 400 }
    );
  }
}
```

---

### Step 3: Migration Script (Convert Existing Users)

**File:** `scripts/migrate-to-organizations.ts` (NEW FILE)

```typescript
// scripts/migrate-to-organizations.ts

import { pb } from '../lib/pocketbase';

/**
 * Migration script: Add organizations for all existing users
 *
 * RUN THIS ONCE after creating the new collections
 *
 * Usage:
 *   npx tsx scripts/migrate-to-organizations.ts
 *
 * SAFE TO RUN MULTIPLE TIMES (idempotent)
 */

async function migrate() {
  console.log('🚀 Starting organization migration...\\n');

  try {
    // Get all users
    const users = await pb.collection('users').getFullList();
    console.log(`Found ${users.length} users\\n`);

    let created = 0;
    let skipped = 0;
    let updated = 0;

    for (const user of users) {
      console.log(`\\n📍 Processing user: ${user.email}`);

      try {
        // Check if user already has organization
        const existingMembers = await pb.collection('org_members').getFullList({
          filter: `userId = "${user.id}"`,
          expand: 'organizationId'
        });

        let organization;

        if (existingMembers.length > 0) {
          // User already has org
          organization = existingMembers[0].expand?.organizationId;
          console.log(`  ✅ Already has organization: ${organization.name}`);
          skipped++;
        } else {
          // Create organization
          const slug = `${user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
          const orgName = user.name ? `${user.name}'s Organization` : `${user.email}'s Organization`;

          organization = await pb.collection('organizations').create({
            name: orgName,
            slug: slug,
            ownerId: user.id,
            totalCredits: user.totalTokens || 0,
            usedCredits: user.usedTokens || 0,
            monthlyCredits: user.dailyTokens || 0
          });

          console.log(`  ✅ Created organization: ${organization.id}`);

          // Add user as owner
          await pb.collection('org_members').create({
            organizationId: organization.id,
            userId: user.id,
            role: 'owner'
          });

          console.log(`  ✅ Added user as owner`);
          created++;
        }

        // Migrate user's projects to organization
        const projects = await pb.collection('projects').getFullList({
          filter: `userId = "${user.id}"`
        });

        console.log(`  📦 Found ${projects.length} projects`);

        let projectsUpdated = 0;
        for (const project of projects) {
          // Check if project already has organizationId
          if (!project.organizationId) {
            await pb.collection('projects').update(project.id, {
              organizationId: organization.id
            });
            projectsUpdated++;
          }
        }

        if (projectsUpdated > 0) {
          console.log(`  ✅ Updated ${projectsUpdated} projects`);
          updated += projectsUpdated;
        }

      } catch (error: any) {
        console.error(`  ❌ Error migrating user ${user.email}:`, error.message);
        // Continue with next user
      }
    }

    console.log('\\n🎉 Migration complete!');
    console.log(`\\nSummary:`);
    console.log(`  Organizations created: ${created}`);
    console.log(`  Users skipped (already had org): ${skipped}`);
    console.log(`  Projects updated: ${updated}`);

  } catch (error: any) {
    console.error('\\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

---

### Step 4: Update Project Creation (Backwards Compatible)

**File:** `app/api/projects/create/route.ts` (UPDATE EXISTING)

```typescript
// app/api/projects/create/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { pb } from '@/lib/pocketbase';
import { getUserOrganization } from '@/lib/services/org-auto-create';

export async function POST(req: NextRequest) {
  try {
    const user = pb.authStore.model;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description } = await req.json();

    // ✨ NEW: Get user's organization
    const organization = await getUserOrganization(user.id);

    // Create project with organizationId (if available)
    const project = await pb.collection('projects').create({
      name,
      description,
      userId: user.id,
      organizationId: organization?.id || null, // ← Backwards compatible
      stage: 'planning'
    });

    return NextResponse.json({ success: true, project });

  } catch (error: any) {
    console.error('[CreateProject] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    );
  }
}
```

---

### Step 5: Add Org ID to Settings UI (ONLY UI CHANGE)

**File:** `app/(dashboard)/settings/page.tsx` (UPDATE EXISTING)

```typescript
// app/(dashboard)/settings/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { getUserOrganization } from '@/lib/services/org-auto-create';

export default function SettingsPage() {
  const [organization, setOrganization] = useState<any>(null);

  useEffect(() => {
    loadOrganization();
  }, []);

  async function loadOrganization() {
    const user = pb.authStore.model;
    if (!user) return;

    const org = await getUserOrganization(user.id);
    setOrganization(org);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* ✨ NEW: Organization ID (read-only, for reference only) */}
      {organization && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Organization
          </h2>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-gray-500">Name:</span>
              <p className="text-sm font-mono">{organization.name}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">ID:</span>
              <p className="text-sm font-mono text-gray-600">{organization.id}</p>
            </div>
          </div>
        </div>
      )}

      {/* ... rest of existing settings ... */}
    </div>
  );
}
```

---

## 🧪 Testing Checklist

### Test 1: New User Signup
```bash
# 1. Sign up new user via UI
# 2. Check PocketBase admin:
#    - organizations collection has new record
#    - org_members has owner record
#    - user can create projects
```

### Test 2: Existing User Migration
```bash
# 1. Run migration script
npx tsx scripts/migrate-to-organizations.ts

# 2. Check PocketBase admin:
#    - All users have organizations
#    - All projects have organizationId
#    - App still works normally
```

### Test 3: Project Creation
```bash
# 1. Create new project via UI
# 2. Check PocketBase admin:
#    - Project has organizationId set
#    - Project belongs to user's org
```

### Test 4: Settings UI
```bash
# 1. Go to Settings page
# 2. Verify:
#    - Organization name shown
#    - Organization ID shown
#    - Everything else works
```

---

## ⚠️ Backwards Compatibility Guarantees

### Will NOT Break:
✅ Existing user accounts
✅ Existing projects
✅ Existing API routes
✅ Existing UI (except settings)
✅ Credit system
✅ Payment system

### Migration Safety:
✅ Script is idempotent (safe to run multiple times)
✅ Projects work without organizationId (optional field)
✅ Old code continues working (graceful fallback)

### Rollback Plan:
If something goes wrong:
```bash
# 1. Stop using new organization logic (remove imports)
# 2. Keep collections (data safe)
# 3. Projects still work (organizationId is optional)
```

---

## 📋 Implementation Steps (In Order)

### Phase 1: Database Setup (30 mins)
1. ✅ Create `organizations` collection (copy schema above)
2. ✅ Create `org_members` collection (copy schema above)
3. ✅ Add `organizationId` field to `projects` (optional!)

### Phase 2: Auto-Create Logic (1 hour)
4. ✅ Create `lib/services/org-auto-create.ts` (copy code above)
5. ✅ Update signup route (copy code above)
6. ✅ Test: Sign up new user → Check PocketBase

### Phase 3: Migration (1 hour)
7. ✅ Create `scripts/migrate-to-organizations.ts` (copy code above)
8. ✅ **BACKUP DATABASE FIRST!**
9. ✅ Run migration: `npx tsx scripts/migrate-to-organizations.ts`
10. ✅ Verify: All users have orgs, all projects have organizationId

### Phase 4: Update Project Creation (30 mins)
11. ✅ Update project creation route (copy code above)
12. ✅ Test: Create new project → Check organizationId

### Phase 5: Settings UI (30 mins)
13. ✅ Update settings page (copy code above)
14. ✅ Test: View settings → See org ID

### Phase 6: Testing (1 hour)
15. ✅ Run all test checklist items above
16. ✅ Test existing projects still work
17. ✅ Test new projects have organizationId
18. ✅ Test signup creates org automatically

**Total Time: 4-5 hours** (vs original 87-118 hours!)

---

## 🚀 Next Steps (After This Is Done)

### Immediate: Memory Management
Implement Phase 2 from `docs/plans/#ToDo_OBSERVABILITY_AND_ENHANCEMENT_ROADMAP.md`:
- Conversation memory across editing sessions
- Entity tracking (components, features, design decisions)
- Context-aware multi-turn edits

**Estimated Time:** 2-3 days
**Status:** Ready to implement after org foundation

### Future (When Needed):
- Team invitations (add members to org)
- Workspace concept (Product, Marketing, Analytics)
- Org-level integrations
- Custom node registry
- Dynamic workflows

---

## ✅ Success Criteria

### Must Work:
- ✅ New users auto-get organization (invisible)
- ✅ Existing users migrated to organizations
- ✅ All projects have organizationId
- ✅ Settings shows org ID (read-only)
- ✅ No breaking changes to existing functionality
- ✅ Credits still work (copied to org during migration)

### Should Work:
- ✅ Multiple users can have orgs (for future team features)
- ✅ Projects scoped to organizations (foundation for access control)
- ✅ Database ready for org-level features (workspaces, integrations, etc.)

---

## 📊 Before vs After

### Database Structure

**BEFORE:**
```
users
  ├─ id
  ├─ email
  ├─ totalTokens
  └─ usedTokens

projects
  ├─ id
  ├─ userId
  └─ name
```

**AFTER:**
```
users
  ├─ id
  ├─ email
  ├─ totalTokens  (still here for backwards compatibility)
  └─ usedTokens

organizations  ← NEW
  ├─ id
  ├─ ownerId → users
  ├─ totalCredits  (copied from user)
  └─ usedCredits

org_members  ← NEW
  ├─ id
  ├─ organizationId → organizations
  ├─ userId → users
  └─ role

projects
  ├─ id
  ├─ userId
  ├─ organizationId → organizations  ← NEW (optional)
  └─ name
```

### User Experience

**BEFORE:**
1. Sign up
2. Create projects
3. Use app

**AFTER:**
1. Sign up → **[ORG AUTO-CREATED SILENTLY]**
2. Create projects → **[AUTO-ASSIGNED TO ORG]**
3. Use app **[SAME EXPERIENCE!]**
4. *Optional:* Check settings → See org ID

---

**Last Updated:** January 2025
**Status:** ✅ **READY TO IMPLEMENT**
**Estimated Time:** **4-5 hours**
**Breaking Changes:** ❌ **NONE**

---

## 🎯 Quick Start

```bash
# 1. Create PocketBase collections (via Admin UI)
#    - organizations
#    - org_members
#    - Update projects (add organizationId field)

# 2. Add auto-create service
#    Copy: lib/services/org-auto-create.ts

# 3. Update signup route
#    Update: app/api/auth/signup/route.ts

# 4. BACKUP DATABASE!
cp pocketbase/data.db pocketbase/data.db.backup

# 5. Run migration
npx tsx scripts/migrate-to-organizations.ts

# 6. Update project creation
#    Update: app/api/projects/create/route.ts

# 7. Update settings UI
#    Update: app/(dashboard)/settings/page.tsx

# 8. Test everything!
```

---

**That's it! Simple, backwards-compatible, foundation for future scaling.** 🚀
