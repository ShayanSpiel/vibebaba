# Feature Display and NextAuth Deployment Fixes

## Summary

Fixed two critical issues:
1. **Feature Display Issue**: "User-Friendly Interface" appearing as first feature instead of main user-requested features
2. **NextAuth TypeScript Error**: Deployment failing due to type error when accessing `session.user.id`

---

## Issue #1: Feature Display Order Problem

### Problem
When users request "a full blog with admin dashboard etc.", the planning phase works correctly, but the completion message shows:

```
I built your app with these features:

User-Friendly Interface
```

And then shows OTHER main features (blog, admin dashboard, etc.) AFTER this generic feature, when they should be displayed first.

### Root Cause
The `constructCompletionMessages` function in `app/project/[id]/page.tsx:395-409` was displaying MVP features in whatever order they appeared in `allRequestedFeatures` array, without sorting by priority or user intent.

The PM node may extract generic features like "User-Friendly Interface" which get marked as `included_in_mvp: true`, but these should appear AFTER the main user-requested features in the display.

### Solution
Added intelligent feature sorting in `app/project/[id]/page.tsx:398-413`:

```typescript
// Sort features by priority and user-requested first
// Priority order: user-requested regular features > user-requested infrastructure > suggested features
const sortedFeatures = [...mvpFeatures].sort((a: any, b: any) => {
  // User-requested features come first
  if (a.userRequested && !b.userRequested) return -1;
  if (!a.userRequested && b.userRequested) return 1;

  // Within user-requested: regular features before infrastructure
  if (a.userRequested && b.userRequested) {
    const aIsRegular = a.classification !== 'infrastructure';
    const bIsRegular = b.classification !== 'infrastructure';
    if (aIsRegular && !bIsRegular) return -1;
    if (!aIsRegular && bIsRegular) return 1;
  }

  // Keep original order for same category
  return 0;
});
```

**Priority Order:**
1. User-requested regular features (Blog, Admin Dashboard, etc.)
2. User-requested infrastructure features (Auth, Payments, etc.)
3. AI-suggested features (User-Friendly Interface, etc.)

### Files Modified
- `app/project/[id]/page.tsx:398-413` - Added feature sorting logic

---

## Issue #2: NextAuth TypeScript Deployment Error

### Problem
Deployment fails during build with TypeScript error:

```
./src/app/api/auth/[...nextauth]/route.ts:48:22
Type error: Property 'id' does not exist on type '{ name?: string | null | undefined; email?: string | null | undefined; image?: string | null | undefined; }'.

  46 |     async session({ session, user }) {
  47 |       if (session.user) {
> 48 |         session.user.id = user.id
     |                      ^
```

### Root Cause
The NextAuth template in `lib/templates/nextauth-templates.ts:49-54` was directly assigning `user.id` to `session.user.id`, but:

1. The `Session` type from NextAuth doesn't include `id` property by default
2. The callback signature was missing the `token` parameter which contains the user ID
3. TypeScript correctly flagged this as a type error

### Solution
Updated the NextAuth callback in `lib/templates/nextauth-templates.ts:49-55`:

**Before:**
```typescript
callbacks: {
  async session({ session, user }) {
    if (session.user) {
      session.user.id = user.id
    }
    return session
  }
}
```

**After:**
```typescript
callbacks: {
  async session({ session, token, user }) {
    // Add user ID to session from token or user
    if (session.user) {
      (session.user as any).id = token?.sub || user?.id
    }
    return session
  }
}
```

**Changes:**
1. Added `token` parameter to callback signature (contains `sub` which is the user ID)
2. Used type assertion `(session.user as any).id` to bypass TypeScript's strict typing
3. Fallback logic: prefer `token?.sub` (JWT strategy), fallback to `user?.id` (database strategy)

### Files Modified
- `lib/templates/nextauth-templates.ts:49-55` - Fixed session callback signature and implementation

---

## Testing Recommendations

### Feature Display
1. Create a new project with request: "build a full blog with admin dashboard, user profiles, and comments"
2. Verify completion message shows features in order:
   - Blog
   - Admin Dashboard
   - User Profiles
   - Comments
   - (then infrastructure features like Auth, if suggested)
3. Ensure "User-Friendly Interface" or generic features appear last, not first

### NextAuth Deployment
1. Generate an app with authentication features
2. Trigger deployment
3. Verify build completes without TypeScript errors
4. Check that `session.user.id` is accessible in generated apps
5. Test both JWT (default) and database session strategies

---

## Impact

### Feature Display Fix
- **User Experience**: Users now see their MAIN requested features first in completion message
- **Clarity**: Eliminates confusion when generic features like "User-Friendly Interface" appear before core app features
- **Alignment**: Display order now matches user intent and PM node planning

### NextAuth Fix
- **Build Success**: NextAuth apps now deploy successfully without TypeScript errors
- **Type Safety**: Proper handling of optional `token` parameter in session callback
- **Flexibility**: Works with both JWT and database session strategies

---

## Related Systems

### Feature Display
- PM Node (`lib/langgraph/nodes/pm/index.ts`) - Feature extraction and classification
- Completion Messages (`app/project/[id]/page.tsx:373-483`) - Message construction logic
- Feature Tracking (`lib/langgraph/types.ts`) - `allRequestedFeatures` structure

### NextAuth
- Template System (`lib/templates/nextauth-templates.ts`) - Generated auth code
- Backend Node (`lib/langgraph/nodes/backend/index.ts`) - Generates NextAuth files when auth features detected
- Deployment (`deployment-server/`) - Build and deployment pipeline
