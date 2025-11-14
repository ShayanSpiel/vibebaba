# Profile Page Type Error - Fix

## The Error

```
TypeScript compilation failed in src/app/profile/page.tsx:
Property 'website' does not exist on type 'any[]'
```

## Root Cause

The frontend is treating a **user profile** (single object) as an **array**, then trying to access properties on the array instead of the object.

### What's Happening

```typescript
// WRONG - Calling list function for single item page
const profile = await getUsers();  // Returns Users[] (array)
console.log(profile.website);      // ❌ Arrays don't have 'website' property!
```

```typescript
// CORRECT - Should call getById function
const profile = await getUsersById(userId);  // Returns Users (single object)
console.log(profile.website);                // ✅ Works!
```

## Why This Happens

### API Function Naming Convention

From the backend schema:

```typescript
// List all (returns array)
getUsers(): Promise<Users[]>

// Get single by ID (returns object)
getUsersById(id: string): Promise<Users>
```

**The pattern:**
- `get{Collection}()` → Returns **array** (`Users[]`)
- `get{Collection}ById(id)` → Returns **single object** (`Users`)

### Frontend AI Confusion

The AI sometimes doesn't understand which function to use:

1. **Detail/Profile Pages** → Should use `get{Collection}ById(id)`
2. **List/Browse Pages** → Should use `get{Collection}()`

When generating a `/profile` page, the AI might incorrectly call `getUsers()` instead of `getUsersById()`.

## The Fix

### Option 1: Add Explicit Guidance to Frontend Prompts

Add this rule to frontend generation prompts:

```markdown
ROUTE-TO-FUNCTION MAPPING RULES:

1. Detail/Profile/Single Item Pages:
   - Routes like: /profile, /product/[id], /user/[id], /post/[slug]
   - Use: get{Collection}ById(id: string) → Returns single object
   - Example: const user = await getUsersById(userId);

2. List/Browse/Index Pages:
   - Routes like: /products, /users, /posts, /
   - Use: get{Collection}() → Returns array
   - Example: const users = await getUsers();

3. Array Access Rule:
   - If function returns array but you need single item:
     const items = await getItems();
     const item = items[0];  // Get first item
     console.log(item.property);  // ✅ Access properties on item, not array
```

### Option 2: Fix in Type Mismatch Detector

The type mismatch detector should catch this:

```typescript
// In lib/langgraph/validation/post-gen/typescript-compiler.ts

// Detect: Accessing object properties on arrays
if (code.includes('.website') || code.includes('.email') || code.includes('.name')) {
  // Check if variable is array type
  const arrayVarPattern = /const\s+(\w+)\s*=\s*await\s+get\w+\(\)/;
  const match = code.match(arrayVarPattern);

  if (match) {
    const varName = match[1];
    // Check if this variable is used with property access
    const propertyAccessPattern = new RegExp(`${varName}\\.(\\w+)`);
    if (propertyAccessPattern.test(code)) {
      errors.push({
        line: lineNumber,
        message: `Variable '${varName}' is an array. Access properties on array elements instead: ${varName}[0].property or use get{Collection}ById() for single items`
      });
    }
  }
}
```

### Option 3: Add Route Pattern Detection

Update frontend node to detect route patterns:

```typescript
// In lib/langgraph/nodes/frontend/index.ts

function detectPageType(route: string): 'list' | 'detail' | 'form' {
  // Detail pages: /profile, /[id], /edit/[id]
  if (route.includes('[id]') || route.includes('[slug]') || route === '/profile') {
    return 'detail';
  }

  // Form pages: /create, /new, /edit (without [id])
  if (route.includes('/create') || route.includes('/new')) {
    return 'form';
  }

  // List pages: everything else
  return 'list';
}

// Then in the prompt:
const pageType = detectPageType(route);
const apiGuidance = pageType === 'detail'
  ? `Use get{Collection}ById(id) to fetch single item. Extract id from URL params.`
  : `Use get{Collection}() to fetch list of items.`;
```

## Recommended Solution

**Combine Option 1 + Option 3:**

1. **Add route pattern detection** to automatically identify detail vs list pages
2. **Add explicit API guidance** in the prompt based on page type
3. **Enhance validation** to catch array property access errors

## Implementation

### Step 1: Update Frontend Node Prompt Generation

```typescript
// lib/langgraph/nodes/frontend/index.ts (around line 2000-2500)

// Detect page type based on route
const isDetailPage = filePlan.path.includes('[id]') ||
                      filePlan.path.includes('[slug]') ||
                      filePlan.path.endsWith('/profile/page.tsx');

const isListPage = !isDetailPage && !filePlan.path.includes('/create') && !filePlan.path.includes('/new');

// Add to prompt
const apiGuidanceSection = isDetailPage ? `
🚨 CRITICAL: This is a DETAIL/SINGLE ITEM page.

API Usage Rules:
1. Extract ID from route params: const { id } = params;
2. Use get{Collection}ById(id) function (returns single object)
3. Store in singular variable: const item = await get{Collection}ById(id);
4. Access properties directly: item.name, item.website, etc.

❌ WRONG:
  const items = await getItems();  // Returns array
  console.log(items.name);         // Error: arrays don't have 'name'

✅ CORRECT:
  const item = await getItemsById(params.id);  // Returns single object
  console.log(item.name);                      // Works!
` : isListPage ? `
📋 This is a LIST/BROWSE page.

API Usage Rules:
1. Use get{Collection}() function (returns array)
2. Store in plural variable: const items = await get{Collection}();
3. Map over array: items.map(item => <div>{item.name}</div>)
4. Access properties on array elements, not the array itself

✅ CORRECT:
  const items = await getItems();       // Returns array
  items.map(item => item.name)          // Access properties on elements
` : '';

// Add apiGuidanceSection to the main prompt
```

### Step 2: Update Shared Constraints

Add to `lib/langgraph/prompts/shared-constraints.ts`:

```typescript
export const API_USAGE_PATTERNS = `
API FUNCTION RETURN TYPES:

1. List Functions (plural):
   - Pattern: get{Collection}()
   - Returns: {Collection}[] (array)
   - Usage: const items = await getItems();
   - Access: items.map(item => item.property)

2. Detail Functions (singular):
   - Pattern: get{Collection}ById(id: string)
   - Returns: {Collection} (single object)
   - Usage: const item = await getItemsById(id);
   - Access: item.property

COMMON MISTAKE:
❌ const items = await getItems();
❌ console.log(items.name);  // Error: Property 'name' does not exist on type 'Items[]'

FIX:
✅ const item = await getItemsById(id);  // For detail pages
✅ console.log(item.name);

OR:
✅ const items = await getItems();  // For list pages
✅ items.map(item => console.log(item.name));
`;
```

## Testing

After implementing the fix, test with:

### Test 1: Profile Page (Detail)
```
Route: /profile/page.tsx
Expected: Uses getUsersById(currentUserId)
Validates: Access user.website, user.email directly
```

### Test 2: Users List Page
```
Route: /users/page.tsx
Expected: Uses getUsers()
Validates: Maps over users array: users.map(user => user.name)
```

### Test 3: Product Detail Page
```
Route: /products/[id]/page.tsx
Expected: Uses getProductsById(params.id)
Validates: Access product.name, product.price directly
```

## Quick Fix for Current Error

If you need to fix the current profile page immediately, manually edit it:

```typescript
// Find this pattern:
const profile = await getUsers();
console.log(profile.website);

// Replace with:
const profiles = await getUsers();
const profile = profiles[0];  // Get first user
console.log(profile.website);

// Or better (if user ID available):
const profile = await getUsersById(currentUserId);
console.log(profile.website);
```

## Summary

**Root Cause:** AI called `getUsers()` (returns array) instead of `getUsersById()` (returns object) for profile page

**Impact:** TypeScript error when accessing object properties on array

**Fix:** Add route pattern detection + explicit API guidance in prompts

**Status:** Requires implementation in frontend node (Option 3)