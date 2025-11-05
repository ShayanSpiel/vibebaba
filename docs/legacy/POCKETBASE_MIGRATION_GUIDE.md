# PocketBase Migration Guide

## Step-by-Step Migration Process

### Phase 1: Setup PocketBase Admin (DO THIS FIRST!)

1. **Open PocketBase Admin UI**
   ```
   Open in browser: http://localhost:8090/_/
   ```

2. **Create Admin Account** (First time setup)
   - Email: `admin@vibebaba.com`
   - Password: `admin1234567890`
   - Click "Create and login"

3. **Verify Admin Access**
   - You should see the PocketBase dashboard
   - Note: There's already a `users` collection (default auth collection)

---

### Phase 2: Create Database Schema

Run the automated schema setup script:

```bash
node scripts/setup-pocketbase-schema.js
```

This will create:
- ✅ users (updated with credit fields)
- ✅ transactions
- ✅ token_usage
- ✅ projects
- ✅ project_files
- ✅ project_messages

**Expected Output:**
```
🚀 Starting PocketBase Schema Setup...
🔐 Authenticating as admin...
✅ Authenticated successfully

👤 Updating users collection...
✅ Users collection updated

💳 Creating transactions collection...
✅ Transactions collection created

📊 Creating token_usage collection...
✅ Token usage collection created

📁 Creating projects collection...
✅ Projects collection created

📄 Creating project_files collection...
✅ Project files collection created

💬 Creating project_messages collection...
✅ Project messages collection created

✨ PocketBase schema setup completed successfully!
```

---

### Phase 3: Migrate Existing Data

#### 3.1 Migrate User from SQLite to PocketBase

Current user in SQLite:
```
ID: YzNtOGKmLRQcINZj05R6DDRNzcfYSwkE
Email: xhayan@gmail.com
Name: Shayan
Credits:
  - totalTokens: 38,600,000
  - usedTokens: 151,762
  - dailyTokens: 50,000
```

**Manual Migration (via Admin UI):**

1. Go to: http://localhost:8090/_/collections/users
2. Click "New record"
3. Fill in:
   - Email: `xhayan@gmail.com`
   - Password: (set a new password)
   - name: `Shayan`
   - totalTokens: `38600000`
   - usedTokens: `151762`
   - dailyTokens: `50000`
   - lastDailyReset: (today's date)
4. Click "Create"

**OR Automated Migration (script coming next):**

#### 3.2 Migrate Projects from localStorage

I'll create an automated script for this...

---

### Phase 4: Update Application Code

#### 4.1 Install Dependencies

Already done ✅:
```bash
npm install pocketbase
```

#### 4.2 Create PocketBase Client

Create `lib/pocketbase.ts`:
```typescript
import PocketBase from 'pocketbase';

export const pb = new PocketBase('http://localhost:8090');

// Enable auto-cancellation of duplicate requests
pb.autoCancellation(false);

// TypeScript types for our collections
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  totalTokens: number;
  usedTokens: number;
  dailyTokens: number;
  lastDailyReset?: string;
  packageId?: string;
  packageExpiry?: string;
  created: string;
  updated: string;
}

export interface Project {
  id: string;
  userId: string;
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

export interface ProjectFile {
  id: string;
  projectId: string;
  path: string;
  content: string;
  encoding: 'utf-8' | 'base64';
  size?: number;
  created: string;
  updated: string;
}

export interface ProjectMessage {
  id: string;
  projectId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?: number;
  created: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'purchase' | 'subscription' | 'refund';
  amount: number;
  tokens: number;
  currency?: string;
  packageId?: string;
  paymentProvider?: 'stripe' | 'paypal' | 'zibal';
  paymentId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created: string;
  updated: string;
}

export interface TokenUsage {
  id: string;
  userId: string;
  tokensUsed: number;
  endpoint?: string;
  projectId?: string;
  created: string;
}
```

#### 4.3 Create Auth Context

Create `components/auth/PocketBaseAuthProvider.tsx`:
```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { pb, User } from '@/lib/pocketbase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function PocketBaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    setUser(pb.authStore.model as User);
    setLoading(false);

    // Listen to auth changes
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setUser(model as User);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const authData = await pb.collection('users').authWithPassword(email, password);
    setUser(authData.record as User);
  };

  const signup = async (email: string, password: string, name: string) => {
    const user = await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      name,
      totalTokens: 0,
      usedTokens: 0,
      dailyTokens: 0
    });

    // Auto-login after signup
    await login(email, password);
  };

  const logout = () => {
    pb.authStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within PocketBaseAuthProvider');
  }
  return context;
}
```

#### 4.4 Update Projects Sidebar

Modify `components/ProjectsSidebar.tsx` to use PocketBase instead of localStorage:

```typescript
// Replace localStorage code with:
const loadProjects = async () => {
  if (!session.data?.user?.id) return;

  try {
    const records = await pb.collection('projects').getFullList<Project>({
      filter: `userId = "${session.data.user.id}"`,
      sort: '-created'
    });
    setProjects(records);
  } catch (error) {
    console.error('Failed to load projects:', error);
  }
};

const deleteProject = async (projectId: string, e: React.MouseEvent) => {
  e.stopPropagation();
  if (!confirm(t("deleteConfirm"))) return;

  try {
    await pb.collection('projects').delete(projectId);
    loadProjects();
  } catch (error) {
    console.error('Failed to delete project:', error);
  }
};
```

#### 4.5 Update Project Page

Modify `app/project/[id]/page.tsx`:

```typescript
const loadProject = async () => {
  try {
    const project = await pb.collection('projects').getOne<Project>(projectId, {
      expand: 'userId' // Can expand relations if needed
    });
    setProject(project);

    // Load files
    const files = await pb.collection('project_files').getFullList<ProjectFile>({
      filter: `projectId = "${projectId}"`
    });
    setFiles(files);

    // Load messages
    const messages = await pb.collection('project_messages').getFullList<ProjectMessage>({
      filter: `projectId = "${projectId}"`,
      sort: 'created'
    });
    setMessages(messages);
  } catch (error) {
    console.error('Failed to load project:', error);
  }
};
```

#### 4.6 Update Database Viewer

Modify `components/project/DatabaseViewerPro.tsx`:

```typescript
// Instead of localStorage, create/read from PocketBase dynamic collections
const loadCollectionData = async (collectionName: string) => {
  try {
    const fullCollectionName = `proj_${projectId}_${collectionName}`;
    const records = await pb.collection(fullCollectionName).getFullList({
      sort: '-created'
    });
    setCollectionData(records);
  } catch (error) {
    console.error('Collection not found, creating...', error);
    // Collection doesn't exist yet, will be created on first insert
    setCollectionData([]);
  }
};

const handleAddRow = async () => {
  const fullCollectionName = `proj_${projectId}_${selectedCollection}`;
  try {
    await pb.collection(fullCollectionName).create(newRowData);
    loadCollectionData(selectedCollection);
  } catch (error) {
    console.error('Failed to add record:', error);
  }
};
```

---

### Phase 5: Update Backend API

#### 5.1 Remove better-auth

```bash
npm uninstall better-auth @better-auth/core
npm uninstall better-sqlite3
```

#### 5.2 Update API Routes

All API routes should now use PocketBase SDK instead of better-auth.

Example `app/api/projects/route.ts`:
```typescript
import { pb } from '@/lib/pocketbase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify token with PocketBase
  pb.authStore.loadFromCookie(authHeader);
  const user = pb.authStore.model;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch projects
  const projects = await pb.collection('projects').getFullList({
    filter: `userId = "${user.id}"`,
    sort: '-created'
  });

  return NextResponse.json(projects);
}
```

---

### Phase 6: Testing

1. **Test Auth**
   - Login with migrated user
   - Create new user
   - Logout and login again

2. **Test Projects**
   - Create new project
   - View project list
   - Edit project
   - Delete project

3. **Test Database Viewer**
   - View collections
   - Add records
   - Edit records
   - Delete records

4. **Test Credits System**
   - Check token balance
   - Consume tokens
   - Purchase credits

---

### Phase 7: Cleanup

1. **Remove Old Files**
   ```bash
   rm -rf data/auth.db*
   rm -rf lib/auth.ts
   rm -rf lib/credits.ts
   rm -rf lib/auth-client.ts
   rm -rf components/auth/AuthProvider.tsx
   ```

2. **Update Package.json**
   - Remove better-auth dependencies
   - Remove better-sqlite3 dependency

3. **Update Environment Variables**
   ```env
   # Add to .env
   NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090

   # For production:
   NEXT_PUBLIC_POCKETBASE_URL=https://your-pocketbase-server.com
   ```

---

### Phase 8: Production Deployment

#### Option 1: PocketBase Cloud
- Sign up at https://pocketbase.io/pricing
- Upload your schema
- Update NEXT_PUBLIC_POCKETBASE_URL

#### Option 2: Self-Hosted
1. **Deploy PocketBase on VPS**
   ```bash
   # On server
   wget https://github.com/pocketbase/pocketbase/releases/download/v0.21.0/pocketbase_0.21.0_linux_amd64.zip
   unzip pocketbase_0.21.0_linux_amd64.zip
   ./pocketbase serve --http="0.0.0.0:8090"
   ```

2. **Setup Nginx Reverse Proxy**
   ```nginx
   server {
       listen 443 ssl;
       server_name api.vibebaba.com;

       location / {
           proxy_pass http://localhost:8090;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
       }
   }
   ```

3. **Setup Systemd Service**
   ```ini
   [Unit]
   Description=PocketBase
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/var/www/pocketbase
   ExecStart=/var/www/pocketbase/pocketbase serve
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

---

## Quick Start

**TL;DR - Start Here:**

1. Open http://localhost:8090/_/ and create admin account
2. Run: `node scripts/setup-pocketbase-schema.js`
3. Manually migrate user via admin UI
4. Update code to use PocketBase (scripts coming next)
5. Test everything
6. Deploy to production

---

## Troubleshooting

### Error: "Admin not found"
- Go to http://localhost:8090/_/ and create admin account first

### Error: "Collection not found"
- Run the schema setup script again
- Check admin UI to verify collections exist

### Error: "Unauthorized"
- Check if user is logged in via PocketBase
- Verify auth token in localStorage/cookies

### Error: "Failed to fetch"
- Ensure PocketBase is running on port 8090
- Check CORS settings in PocketBase

---

## Benefits of This Migration

✅ **One Database System** - PocketBase for everything
✅ **Built-in Admin UI** - Manage data visually
✅ **Real-time Support** - WebSocket subscriptions ready
✅ **File Storage** - Upload images/files built-in
✅ **Auto-generated API** - REST + Realtime APIs
✅ **Better Security** - Database-level auth rules
✅ **Easier Scaling** - Cloud or self-hosted options
✅ **Lower Complexity** - Less code to maintain

---

Ready to begin? Start with Phase 1! 🚀
