# Authentication Quick Reference

## For Developers

### Protecting a Page

#### Method 1: Using ProtectedRoute Component (Recommended)
```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function MyProtectedPage() {
  return (
    <ProtectedRoute>
      <div>Your protected content</div>
    </ProtectedRoute>
  );
}
```

#### Method 2: Using useRequireAuth Hook
```tsx
import { useRequireAuth } from '@/components/auth/ProtectedRoute';

export default function MyPage() {
  const { user, loading, isAuthenticated } = useRequireAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return null; // Will auto-redirect

  return <div>Protected content for {user?.name}</div>;
}
```

### Protecting an API Route

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/pocketbase-middleware';

export async function POST(req: NextRequest) {
  return requireAuth(req, async (req, user) => {
    // User is authenticated here
    // Access user data via the 'user' parameter

    return NextResponse.json({
      message: `Hello ${user.name}!`,
      userId: user.id
    });
  });
}
```

### Making Authenticated API Calls

#### With CSRF Protection (Recommended)
```typescript
import { secureFetch } from '@/lib/csrf-protection';

const response = await secureFetch('/api/my-endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ data: 'value' })
});
```

#### Standard Fetch (for GET requests)
```typescript
const response = await fetch('/api/my-endpoint');
```

### Accessing Current User

```tsx
import { useAuth } from '@/components/auth/PocketBaseAuthProvider';

function MyComponent() {
  const { user, loading, login, logout, refreshUser } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;

  return (
    <div>
      <p>Hello {user.name}!</p>
      <p>Email: {user.email}</p>
      <p>Tokens: {user.totalTokens}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Checking Admin Access

```typescript
import { requireAdmin } from '@/lib/admin-middleware';

export async function GET(req: NextRequest) {
  return requireAdmin(req, async (req, user) => {
    // Only admins reach here
    return NextResponse.json({ adminData: 'secret' });
  });
}
```

## Route Configuration

### Protected Routes (in middleware.ts)
```typescript
const protectedRoutes = ['/settings', '/projects', '/project'];
```

### Public Routes (accessible to all)
```typescript
const publicRoutes = ['/', '/pricing'];
```

### To Add a New Protected Route
1. Add route to `protectedRoutes` array in [middleware.ts](../middleware.ts:21)
2. Wrap page component with `<ProtectedRoute>` component
3. Test by accessing without login

## Security Checklist

When creating new features:

- [ ] Is this a protected page? → Use `<ProtectedRoute>`
- [ ] Is this an API route? → Use `requireAuth()` or `requireAdmin()`
- [ ] Making POST/PUT/DELETE requests? → Use `secureFetch()` for CSRF protection
- [ ] Handling sensitive data? → Verify user authorization
- [ ] Creating new API endpoint? → Add authentication middleware
- [ ] Adding admin features? → Use `requireAdmin()` middleware

## Common Patterns

### Conditional Rendering Based on Auth
```tsx
const { user } = useAuth();

return (
  <>
    {user ? (
      <ProfileButton />
    ) : (
      <SignInButton />
    )}
  </>
);
```

### Redirecting After Action
```tsx
const router = useRouter();
const { logout } = useAuth();

const handleLogout = () => {
  logout();
  router.push('/');
};
```

### Loading States
```tsx
const { user, loading } = useAuth();

if (loading) {
  return <LoadingSpinner />;
}

return <div>Content for {user?.name}</div>;
```

## Troubleshooting

### User keeps getting redirected even when logged in
- Check browser cookies (should see `pb_auth`)
- Check localStorage for `pocketbase_auth`
- Verify PocketBase connection
- Check console for errors

### 401 Unauthorized on API calls
- Ensure cookie is being sent with request
- Check if auth token is expired
- Verify API route has `requireAuth()` middleware
- Check CORS settings if calling from different domain

### CSRF token errors
- Use `secureFetch()` instead of plain `fetch()`
- Check if CSRF cookie is being set
- Verify headers are being sent correctly

### Can't access protected page after login
- Check if route is in `protectedRoutes` array
- Verify `<ProtectedRoute>` component is wrapping page
- Check middleware configuration
- Clear browser cache and cookies

## Environment Variables

```env
# PocketBase Configuration
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
```

## Quick Commands

```bash
# Test authentication flow
npm run dev

# Check security headers
curl -I http://localhost:3000

# Clear all cookies (DevTools Console)
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/,
    "=;expires=" + new Date().toUTCString() + ";path=/");
});
```

## Need Help?

- 📖 Full Documentation: [SECURITY.md](./SECURITY.md)
- 🏗️ Architecture: [AUTHENTICATION_SYSTEM.md](./architecture/AUTHENTICATION_SYSTEM.md)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
