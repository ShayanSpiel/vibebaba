# Security Implementation Guide

## Overview

This document details the security measures implemented in the Vibebaba application to protect user data and prevent unauthorized access.

## Authentication System

### Technology Stack
- **Backend**: PocketBase (handles password hashing, token generation)
- **Frontend**: React Context API with custom hooks
- **Session Management**: Cookie-based with localStorage backup
- **Token Type**: JWT (JSON Web Tokens)

### Security Features

#### 1. **Server-Side Route Protection** ✅
- **File**: [middleware.ts](../middleware.ts)
- **Purpose**: Prevents unauthorized access BEFORE page renders
- **Protected Routes**:
  - `/settings` - User settings page
  - `/projects` - Projects list
  - `/project/*` - Individual project pages

**How it works:**
```typescript
// Checks authentication on every request
if (isProtectedRoute && !isAuthenticated) {
  // Redirect to home with auth modal
  redirect('/?auth=signin&redirect=/protected-page')
}
```

#### 2. **Client-Side Route Guards** ✅
- **Component**: [ProtectedRoute.tsx](../components/auth/ProtectedRoute.tsx)
- **Purpose**: Provides loading states and prevents flash of content
- **Features**:
  - Loading spinner while checking auth
  - Automatic redirect to login
  - Preserves intended destination

**Usage:**
```tsx
<ProtectedRoute>
  <YourProtectedPage />
</ProtectedRoute>
```

#### 3. **Secure Cookie Configuration** ✅
- **File**: [PocketBaseAuthProvider.tsx](../components/auth/PocketBaseAuthProvider.tsx:29-33)

**Cookie Flags:**
- `SameSite=Strict` - Prevents CSRF attacks
- `Secure` - Only sent over HTTPS (production)
- `path=/` - Available across entire site
- `max-age=2592000` - 30-day expiration

**⚠️ Note:** While cookies are set from client-side, they use `Strict` SameSite policy for maximum protection.

#### 4. **CSRF Protection** ✅
- **File**: [csrf-protection.ts](../lib/csrf-protection.ts)
- **Method**: Double Submit Cookie pattern
- **Protected Methods**: POST, PUT, PATCH, DELETE

**How to use:**
```typescript
import { secureFetch } from '@/lib/csrf-protection';

// Automatically adds CSRF token
const response = await secureFetch('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

#### 5. **API Route Protection** ✅
- **Middleware**: [pocketbase-middleware.ts](../lib/pocketbase-middleware.ts)
- **Functions**:
  - `getAuthenticatedUser(req)` - Validates token from cookie or header
  - `requireAuth(req, handler)` - Enforces authentication

**Example:**
```typescript
import { requireAuth } from '@/lib/pocketbase-middleware';

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req, user) => {
    // Only authenticated users reach here
    return NextResponse.json({ data: 'protected' });
  });
}
```

## Security Headers

Applied to all responses via [middleware.ts](../middleware.ts:72-93):

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | Enables XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Protects referrer info |
| `Content-Security-Policy` | See middleware | Restricts resource loading |

## Access Control Matrix

| Page/Route | Unauthenticated | Authenticated |
|------------|----------------|---------------|
| `/` (Homepage) | ✅ Full Access | ✅ Full Access |
| `/pricing` | ✅ Full Access | ✅ Full Access |
| `/settings` | ❌ Redirect to `/` | ✅ Full Access |
| `/projects` | ❌ Redirect to `/` | ✅ Full Access |
| `/project/*` | ❌ Redirect to `/` | ✅ Full Access |
| `/api/auth/*` | ✅ Public | ✅ Public |
| `/api/ai/*` | ❌ 401 Unauthorized | ✅ Authorized |
| `/api/payment/*` | ❌ 401 Unauthorized | ✅ Authorized |
| `/api/credits/*` | ❌ 401 Unauthorized | ✅ Authorized |
| `/api/admin/*` | ❌ 403 Forbidden | ⚠️ Admin Only |

## Authentication Flow

### 1. **Sign Up**
```
User → AuthModal → PocketBase → Create User → Auto Login → Set Cookie → Redirect
```

### 2. **Sign In**
```
User → AuthModal → PocketBase → Validate → Get Token → Set Cookie → Update Context
```

### 3. **Access Protected Page**
```
User → Request /settings → Middleware → Check Cookie →
  ✅ Valid → Render Page
  ❌ Invalid → Redirect to /?auth=signin&redirect=/settings
```

### 4. **API Request**
```
Client → API Request → Check Cookie/Header → Validate Token →
  ✅ Valid → Execute Handler
  ❌ Invalid → Return 401
```

### 5. **Logout**
```
User → Click Logout → Clear AuthStore → Delete Cookie → Update Context → Redirect Home
```

## Security Best Practices

### ✅ **Implemented**
1. Server-side route protection (middleware)
2. Client-side route guards (ProtectedRoute component)
3. Secure cookie configuration (Strict SameSite, Secure flag)
4. CSRF protection (Double Submit Cookie pattern)
5. API authentication middleware
6. Security headers (XSS, Clickjacking, etc.)
7. Token validation on every request
8. Automatic redirect with return URL
9. Admin-only route protection
10. Loading states to prevent flash of content

### 🔒 **Additional Recommendations**

1. **Rate Limiting**
   - Add rate limiting to login endpoints
   - Implement exponential backoff
   - Consider using Upstash Rate Limit

2. **Session Management**
   - Implement session refresh mechanism
   - Add "Remember Me" option
   - Automatic logout after inactivity

3. **Password Security**
   - Enforce password complexity (handled by PocketBase)
   - Add password strength indicator
   - Implement password reset flow

4. **Two-Factor Authentication**
   - Add 2FA option for enhanced security
   - Support TOTP authenticator apps

5. **Audit Logging**
   - Log authentication events
   - Track failed login attempts
   - Monitor suspicious activity

## Common Vulnerabilities Addressed

### ✅ **CSRF (Cross-Site Request Forgery)**
- **Protection**: Double Submit Cookie pattern
- **Implementation**: [csrf-protection.ts](../lib/csrf-protection.ts)

### ✅ **XSS (Cross-Site Scripting)**
- **Protection**: Content Security Policy headers
- **Implementation**: [middleware.ts](../middleware.ts:85-91)

### ✅ **Session Fixation**
- **Protection**: New token on each login
- **Implementation**: PocketBase handles token rotation

### ✅ **Clickjacking**
- **Protection**: X-Frame-Options: DENY
- **Implementation**: [middleware.ts](../middleware.ts:74)

### ✅ **Unauthorized Access**
- **Protection**: Multi-layer route protection
- **Implementation**: Middleware + ProtectedRoute component

## Testing Authentication

### Manual Testing Checklist

- [ ] Try accessing `/settings` without login → Should redirect to homepage with auth modal
- [ ] Try accessing `/projects` without login → Should redirect to homepage with auth modal
- [ ] Sign in and access `/settings` → Should load settings page
- [ ] Sign out and try to access `/settings` → Should redirect
- [ ] Check cookies in DevTools → Should see `pb_auth` with Secure and SameSite flags
- [ ] Try making API request without auth → Should return 401
- [ ] Check Network tab for security headers → Should see X-Frame-Options, CSP, etc.

### Automated Testing

```typescript
// Example test for protected route
describe('Protected Routes', () => {
  it('should redirect unauthenticated users to home', async () => {
    const { redirect } = await middleware(
      new NextRequest('https://app.com/settings')
    );
    expect(redirect).toBe('/?auth=signin&redirect=/settings');
  });
});
```

## Reporting Security Issues

If you discover a security vulnerability, please email: security@vibebaba.com

**Please do not:**
- Open public GitHub issues for security vulnerabilities
- Share vulnerability details publicly before patch

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [PocketBase Security](https://pocketbase.io/docs/security/)

## Changelog

### 2025-10-24
- ✅ Added server-side route protection middleware
- ✅ Implemented secure cookie configuration (SameSite=Strict, Secure)
- ✅ Created CSRF protection utilities
- ✅ Added ProtectedRoute component for client-side guards
- ✅ Updated settings and projects pages to use ProtectedRoute
- ✅ Added security headers to all responses
- ✅ Implemented auto-redirect with return URL
- ✅ Created comprehensive security documentation
