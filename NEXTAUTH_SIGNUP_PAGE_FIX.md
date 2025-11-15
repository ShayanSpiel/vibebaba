# NextAuth signUp Page Configuration Fix

## Issue
Deployment failing with TypeScript error:

```
Type error: Object literal may only specify known properties, and 'signUp' does not exist in type 'Partial<PagesOptions>'.

  54 |   pages: {
  55 |     signIn: '/login',
> 56 |     signUp: '/signup',
     |     ^
  57 |     error: '/login'
  58 |   }
```

## Root Cause
NextAuth's `PagesOptions` type does NOT include a `signUp` property. The available page options are:
- `signIn` - Custom sign-in page
- `signOut` - Custom sign-out page
- `error` - Custom error page
- `verifyRequest` - Custom email verification page
- `newUser` - Custom new user page (redirects after first sign-in)

The `signUp` property is not a valid NextAuth configuration option.

## Solution
Removed the invalid `signUp` property from the `pages` configuration in `lib/templates/nextauth-templates.ts:57-60`.

**Before:**
```typescript
pages: {
  signIn: '/login',
  signUp: '/signup',  // ❌ Invalid - not part of NextAuth PagesOptions
  error: '/login'
}
```

**After:**
```typescript
pages: {
  signIn: '/login',
  error: '/login'
}
```

## How Signup Still Works
The signup page (`/signup`) still functions correctly because:

1. **Custom signup route** exists at `/signup` (created by `signupPageTemplate`)
2. **Signup API route** exists at `/api/auth/signup` (created by `signupApiRouteTemplate`)
3. Users access signup directly via navigation link in login page
4. After signup, users are auto-signed in via `signIn('credentials')` call
5. NextAuth doesn't need to know about the signup page - it only handles authentication, not registration

## NextAuth Page Configuration
NextAuth only needs to know about pages it **redirects to**:
- `signIn`: Where to redirect when authentication is required
- `error`: Where to show authentication errors
- `signOut`: Where to redirect after sign-out (optional)
- `verifyRequest`: Email verification page (optional)
- `newUser`: First-time user redirect (optional)

Since signup is a **custom registration flow** (not part of NextAuth's auth flow), it doesn't belong in the `pages` config.

## Files Modified
- `lib/templates/nextauth-templates.ts:57-60` - Removed invalid `signUp` property

## Testing
Generated apps with NextAuth will now:
1. Build successfully without TypeScript errors
2. Have working signup at `/signup` (accessed via link from login page)
3. Have working signin at `/login` (configured in NextAuth)
4. Auto-redirect to `/login` for errors
5. Preserve user session with `session.user.id` accessible

## Related Fixes
This completes the NextAuth template fixes:
1. ✅ Session callback token parameter (from previous fix)
2. ✅ Removed invalid signUp page configuration (this fix)
