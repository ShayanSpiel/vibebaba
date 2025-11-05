# VibeBaba Authentication - Quick Reference Guide

## Files to Understand

| File | Purpose | Key Code |
|------|---------|----------|
| `/lib/templates/auth-template.ts` | Master auth template | All auth templates (routes, pages, middleware) |
| `/lib/langgraph/nodes/backend-node.ts` | Generates backend API | Lines 236-243: API endpoint generation |
| `/lib/langgraph/nodes/frontend-node.ts` | Generates frontend | Lines 236-251: Auth detection & page filtering |
| `/lib/langgraph/nodes/ux-node.ts` | Maps auth features to pages | Lines 48-64: Login/register page creation |
| `/lib/langgraph/nodes/pm-node.ts` | Detects auth features | Lines 426: Auth keywords detection |
| `/lib/sdk-generator.ts` | Creates API client | Lines 369-371: Auth endpoint recognition |
| `/deployment-server/nextjs-scaffold.js` | Backend server generation | Lines 339-395: Express server setup |
| `/pb_migrations/1761200930_updated_users.js` | User collection schema | Auth field definitions |

---

## How Auth Gets Generated

### 1. Detection Phase (PM/UX Nodes)
```
User Request: "blog with user auth"
    ↓
PM Node detects 'auth' keyword (lines 426)
    ↓
Marks "User Authentication" as feature
    ↓
UX Node maps to pages (lines 48-64)
    ↓
Creates /login and /register in feature files
```

### 2. Backend Generation Phase (Backend Node)
```
User Request + Features
    ↓
Backend Node builds AI prompt (lines 130-209)
    ↓
AI generates apiEndpoints array:
  - {method: "POST", path: "/api/auth/register", handler: "register", ...}
  - {method: "POST", path: "/api/auth/login", handler: "login", ...}
  - {method: "POST", path: "/api/auth/refresh", handler: "refresh", ...}
    ↓
Stores in state.backendConfig.apiEndpoints
```

### 3. Frontend Generation Phase (Frontend Node)
```
Frontend Node checks for auth endpoints (line 236)
    ↓
if (hasAuth):
  - Generates login/register pages
  - Creates API client with auth functions
  - Sets up token refresh mechanism
    ↓
else:
  - Removes auth-dependent pages
  - No auth setup needed
```

### 4. Backend Scaffold Phase (DevOps Node)
```
Scaffold generator creates:
  - api/server.js (Express setup with CORS)
  - api/db.js (PocketBase operations)
  - api/routes/${collection}.js (CRUD endpoints)
  - .env variables (JWT_SECRET, POCKETBASE_URL)
```

---

## Generated File Structure

For an app requesting auth:

```
src/
├── app/
│   ├── login/page.tsx          ← from auth-template
│   ├── register/page.tsx        ← from auth-template
│   └── dashboard/page.tsx       ← if auth detected
└── lib/
    └── api.ts                  ← Auto-generated from apiEndpoints

api/
├── server.js                   ← Express app.use('/api/auth', authRouter)
├── db.js                       ← PocketBase operations
└── routes/
    ├── auth.js                 ← Auth endpoints
    └── ${collection}.js        ← Other CRUD endpoints
```

---

## Auth Endpoints Auto-Generated

When auth is detected, these endpoints are in state.backendConfig.apiEndpoints:

```typescript
// Auth endpoints (from ai-generated prompt)
{
  method: "POST",
  path: "/api/auth/register",
  handler: "register",
  collection: "users"
}

{
  method: "POST",
  path: "/api/auth/login",
  handler: "login",
  collection: "users"
}

{
  method: "POST",
  path: "/api/auth/refresh",
  handler: "refresh",
  collection: "users"
}

// ... plus other business endpoints
```

---

## Token Flow

```
1. Register/Login
   POST /api/auth/register → {accessToken, refreshToken}
   
2. Store Tokens
   localStorage.setItem('accessToken', token)
   localStorage.setItem('refreshToken', token)
   
3. Make Request
   Authorization: Bearer ${accessToken}
   
4. On 401 Response
   POST /api/auth/refresh → {accessToken: newToken}
   localStorage.setItem('accessToken', newToken)
   Retry original request
   
5. On Persistent 401
   Clear localStorage
   Redirect to /login
```

---

## Detection Keywords

### Auth Keywords (triggers auth template)
- 'user accounts'
- 'login'
- 'signup'
- 'authentication'
- 'auth'
- 'register'

### Auth-Related Pages (filtered if hasAuth == false)
- `/login`
- `/register`
- `/dashboard`
- `/settings`
- `/profile`

---

## Environment Variables

Generated .env.local contains:

```env
# Backend
POCKETBASE_URL=http://127.0.0.1:8090
JWT_SECRET=your-super-secret-jwt-key...

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000  # From calculateApiPort()
```

---

## Key Functions to Trace

1. **Auth Detection:**
   - `frontendNode.ts:236` - hasAuth check
   - `uxNode.ts:48` - Page mapping
   - `pmNode.ts:426` - Keyword detection

2. **Auth Generation:**
   - `backendNode.ts:130` - buildBackendPrompt()
   - `backendNode.ts:211` - parseBackendResponse()
   - `frontend-node.ts:3270` - generateApiClient()

3. **Auth Routes:**
   - `auth-template.ts:92` - authRoutesTemplate
   - `auth-template.ts:439` - authMiddlewareTemplate

4. **Backend Scaffold:**
   - `nextjs-scaffold.js:339` - generateExpressServer()
   - `nextjs-scaffold.js:484` - generateRouteFile()

---

## Testing Auth Detection

To verify auth is being generated:

1. Check `state.backendConfig.apiEndpoints` for `/auth/` paths
2. Check `state.files` for `/login` and `/register` pages
3. Look for `src/lib/api.ts` in generated files
4. Verify `.env.local` has NEXT_PUBLIC_API_URL

---

## Common Issues & Solutions

| Issue | Cause | Fix |
|-------|-------|-----|
| No login page generated | Auth not detected in features | Explicitly mention "login" or "auth" in request |
| API client has no auth methods | apiEndpoints missing /auth/ paths | Backend node didn't generate auth endpoints |
| Token not stored | API client not called after registration | Check if login/register pages use API client |
| 401 errors on protected routes | Frontend not sending Authorization header | Verify API client includes Bearer token |

---

## Extension Points

To add features, modify:

1. **New Auth Methods** → `auth-template.ts`
2. **New Auth Fields** → Update `userCollectionSchema`
3. **New Auth Pages** → Add to generated pages logic
4. **OAuth/MFA** → Extend `authRoutesTemplate`

All changes flow through the template system automatically.
