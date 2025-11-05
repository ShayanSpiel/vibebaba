# Authentication Implementation - Search Index

## Search Results Summary

This directory contains a complete analysis of VibeBaba's authentication implementation for generated apps.

### Documents Created
1. **AUTH_IMPLEMENTATION_ANALYSIS.md** (14KB)
   - Complete detailed analysis with code examples
   - 12 sections covering all aspects of auth
   - Architecture diagrams and flow charts

2. **AUTH_QUICK_REFERENCE.md**
   - Quick lookup guide for developers
   - File locations and line numbers
   - Common issues and solutions
   - Extension points for customization

3. **AUTH_SEARCH_INDEX.md** (this file)
   - Navigation guide and summary

---

## What Was Found

### Master Template: `/lib/templates/auth-template.ts` (1057 lines)

This single file contains ALL authentication boilerplate code:

```
userCollectionSchema           (lines 19-87)   - PocketBase schema
authRoutesTemplate             (lines 92-434)  - 8 REST endpoints
authMiddlewareTemplate         (lines 439-512) - JWT middleware
loginPageTemplate              (lines 517-630) - Login page component
registerPageTemplate           (lines 635-813) - Register page component
apiClientTemplate              (lines 818-931) - API client with token refresh
envTemplate                    (lines 936-945) - Environment variables
authDependencies               (lines 950-962) - Package dependencies
generateAuthFiles()            (lines 967-1007)- File generator function
getPocketBaseInitScript()      (lines 1012-1022) - Init script
getExpressServerIntegration()  (lines 1027-1042) - Server integration code
```

### Auth Endpoints Generated

```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login with email/password
POST   /api/auth/refresh           - Refresh access token
POST   /api/auth/logout            - Logout (client-side)
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password with token
GET    /api/auth/verify-email      - Verify email address
GET    /api/auth/me                - Get current user profile
```

### Detection & Generation Pipeline

```
1. PM Node (/lib/langgraph/nodes/pm-node.ts:426)
   ↓ Detects auth keywords in user request
   ↓ Marks "User Authentication" as feature

2. UX Node (/lib/langgraph/nodes/ux-node.ts:48)
   ↓ Maps feature to pages (/login, /register)
   ↓ Adds to feature file list

3. Backend Node (/lib/langgraph/nodes/backend-node.ts:130)
   ↓ AI generates API endpoints (apiEndpoints array)
   ↓ Includes /api/auth/* routes if auth detected

4. Frontend Node (/lib/langgraph/nodes/frontend-node.ts:236)
   ↓ Checks if auth endpoints exist
   ↓ If yes: generates login/register pages + API client
   ↓ If no: removes auth-dependent pages

5. DevOps Node (/lib/langgraph/nodes/devops-node.ts:71)
   ↓ Authenticates to PocketBase
   ↓ Stores project with backendConfig

6. Scaffold Generator (/deployment-server/nextjs-scaffold.js:339)
   ↓ Creates Express server with auth routes
   ↓ Creates api/routes for each collection
   ↓ Adds environment variables
```

---

## Key Code Locations

### Feature Detection
- **PM Node:** `/lib/langgraph/nodes/pm-node.ts:426`
  - Keywords: 'user accounts', 'login', 'signup', 'authentication', 'auth', 'register'

- **UX Node:** `/lib/langgraph/nodes/ux-node.ts:48-64`
  - Maps auth features to /login and /register pages

### Backend Generation
- **Backend Node:** `/lib/langgraph/nodes/backend-node.ts:130-209`
  - buildBackendPrompt() - Generates AI prompt for API endpoints
  - Includes /api/auth/* routes when auth is needed

- **Response Parsing:** `/lib/langgraph/nodes/backend-node.ts:211-244`
  - parseBackendResponse() - Extracts apiEndpoints from AI response

### Frontend Integration
- **Auth Detection:** `/lib/langgraph/nodes/frontend-node.ts:236-251`
  - hasAuth = checks if apiEndpoints contains '/auth/' paths
  - Conditionally generates login/register pages

- **API Client Generation:** `/lib/langgraph/nodes/frontend-node.ts:3270-3376`
  - generateApiClient() - Creates src/lib/api.ts
  - Adds bearer token injection and auto-refresh

### Backend Scaffolding
- **Express Server:** `/deployment-server/nextjs-scaffold.js:339-395`
  - generateExpressServer() - Creates api/server.js with CORS

- **Route Files:** `/deployment-server/nextjs-scaffold.js:484-520`
  - generateRouteFile() - Creates api/routes/${collection}.js

### SDK Generator
- **Auth Endpoints:** `/lib/sdk-generator.ts:369-371`
  - Detects auth endpoints automatically
  - Skips auth requirement for login/register
  - Adds bearer tokens to protected endpoints

### Database
- **Users Collection:** `/pb_migrations/1761200930_updated_users.js`
  - Adds role, token tracking, subscription fields

- **Projects Collection:** `/pb_migrations/1761200740_created_projects.js`
  - Auth rules: @request.auth.id != "" && userId = @request.auth.id

### DevOps
- **Deployment:** `/lib/langgraph/nodes/devops-node.ts:71-82`
  - Admin authentication to PocketBase
  - Stores project with backendConfig

---

## Generated File Structure

When auth is detected, this structure is created:

```
PROJECT/
├── src/
│   ├── app/
│   │   ├── login/page.tsx           ← From auth-template
│   │   ├── register/page.tsx         ← From auth-template
│   │   ├── dashboard/page.tsx        ← If auth detected
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── lib/
│       └── api.ts                   ← Auto-generated API client
│
├── api/
│   ├── server.js                    ← Express setup
│   ├── db.js                        ← PocketBase operations
│   ├── package.json
│   └── routes/
│       ├── auth.js                  ← Auth endpoints
│       └── ${collection}.js         ← Other CRUD endpoints
│
├── package.json
├── next.config.js
├── tsconfig.json
├── .env.local                       ← Auto-generated env vars
└── [other config files]
```

---

## Environment Variables

```env
# Backend
POCKETBASE_URL=http://127.0.0.1:8090
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
PORT=5000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Authentication Flow

### Registration
```
User fills form
  ↓
POST /api/auth/register
  ↓
bcryptjs hashes password
  ↓
PocketBase creates user
  ↓
JWT tokens generated (access + refresh)
  ↓
Tokens stored in localStorage
  ↓
Redirect to /dashboard
```

### Login
```
User enters email + password
  ↓
POST /api/auth/login
  ↓
PocketBase authenticates
  ↓
JWT tokens generated
  ↓
Tokens stored in localStorage
  ↓
Redirect to /dashboard
```

### Protected Requests
```
Frontend reads accessToken from localStorage
  ↓
Adds "Authorization: Bearer ${accessToken}" header
  ↓
Backend middleware validates JWT
  ↓
If valid: process request
If expired: POST /api/auth/refresh
  ↓
Get new accessToken
  ↓
Retry original request
  ↓
If still 401: clear tokens, redirect to /login
```

---

## Implementation Checklist

What's Included:
- ✅ User registration with email/password
- ✅ User login
- ✅ JWT access + refresh tokens
- ✅ Token automatic refresh on expiry
- ✅ Password reset flow
- ✅ Email verification flow
- ✅ User profile retrieval
- ✅ Role field (user/admin)
- ✅ bcryptjs password hashing
- ✅ Express-validator input validation
- ✅ PocketBase integration
- ✅ API client with auto token refresh
- ✅ Frontend pages (login/register)
- ✅ Backend middleware

What's NOT Included:
- ✗ OAuth/Social login
- ✗ Multi-factor authentication
- ✗ Email sending automation
- ✗ RBAC middleware implementation
- ✗ React auth hooks/context
- ✗ Protected route components
- ✗ Refresh token rotation
- ✗ Token blacklist
- ✗ Session management

---

## How to Use This Documentation

1. **For Overview:** Read AUTH_IMPLEMENTATION_ANALYSIS.md sections 1-5
2. **For Quick Lookup:** Check AUTH_QUICK_REFERENCE.md
3. **To Trace Auth Generation:** Follow the "Detection & Generation Pipeline" above
4. **To Add Features:** Look at "Extension Points" in AUTH_QUICK_REFERENCE.md
5. **For Specific Line Numbers:** Refer to "Key Code Locations" above

---

## Files Referenced

| File | Purpose | Auth-Related Lines |
|------|---------|-------------------|
| `/lib/templates/auth-template.ts` | Master auth template | 19-1057 (entire file) |
| `/lib/langgraph/nodes/pm-node.ts` | Feature detection | 426 |
| `/lib/langgraph/nodes/ux-node.ts` | Page mapping | 48-64 |
| `/lib/langgraph/nodes/backend-node.ts` | API generation | 31-244 |
| `/lib/langgraph/nodes/frontend-node.ts` | Auth detection + API client | 236-251, 3270-3376 |
| `/lib/sdk-generator.ts` | SDK with auth | 369-371 |
| `/deployment-server/nextjs-scaffold.js` | Backend scaffold | 339-520 |
| `/pb_migrations/1761200930_updated_users.js` | Auth fields | entire file |
| `/pb_migrations/1761200740_created_projects.js` | Auth rules | 72-76 |
| `/lib/langgraph/nodes/devops-node.ts` | Deployment auth | 71-82 |

---

## Search Terms Used

This analysis covers searches for:
- "auth template"
- "signup", "login", "logout"
- "authentication boilerplate"
- "/api/auth"
- "authEndpoints", "apiEndpoints"
- "loginPageTemplate", "registerPageTemplate"
- "authRoutesTemplate", "authMiddlewareTemplate"
- "JWT", "token", "refresh"
- "bcryptjs", "jsonwebtoken"
- "PocketBase auth"
- And more...

All authentication implementation locations have been identified and documented.
