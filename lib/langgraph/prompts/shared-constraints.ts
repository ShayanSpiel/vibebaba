/**
 * SHARED CONSTRAINTS
 * Enterprise-level coding standards
 * NO EXAMPLES - Process-based guidance only
 */

export const TYPESCRIPT_RULES = `
TYPESCRIPT STRICT MODE REQUIREMENTS:

OBJECTIVE: Prevent implicit 'any' type errors that fail builds

MANDATORY TYPE ANNOTATIONS:

Array Callbacks:
- Problem: Implicit 'any' on iteration parameters causes build failure
- Solution: Explicitly type all map/filter/forEach parameters
- Pattern: .map((item: any) => ...), .filter((item: any) => ...)

Catch Blocks and .catch() Callbacks:
- Problem: Error parameter needs explicit type in strict mode
- Solution: Type catch parameter as 'any' or 'unknown'
- Patterns:
  ✅ catch (error: any) { ... }
  ✅ .catch((error: any) => { ... })
  ❌ catch (error) { ... } → BUILD FAILURE
  ❌ .catch((error) => { ... }) → BUILD FAILURE

Nullable State:
- Problem: Initial null value needs type context
- Solution: Provide union type with null
- Pattern: useState<Type | null>(null)

Event Handlers:
- Problem: Event object needs specific React types
- Solution: Use React event types
- Patterns: React.FormEvent, React.ChangeEvent<HTMLInputElement>

Type Narrowing After Null Checks:
- Problem: TypeScript doesn't always narrow types after null checks in async contexts
- Error: "Type 'string | undefined' is not assignable to type 'string'"
- Solution: Use non-null assertion (!) after explicit null checks
- Pattern: if (!obj) return; obj!.property // Safe after check

🚨 CRITICAL: Relation Fields Are STRING IDs, NOT Objects:
- Problem: Relation fields (type: "relation") are STRING IDs that reference another collection
- Error: "Property 'price' does not exist on type 'string'" when accessing item.product.price
- Root Cause: item.product is a string ID, not a Products object
- Solution: Fetch BOTH collections and join them manually with .find()
- Pattern:
  ❌ WRONG: item.product.price or item.product?.price (product is string!)
  ✅ CORRECT: const product = products.find(p => p.id === item.product); product?.price
  ✅ CORRECT: Fetch both collections, then join:
     const items = await getCartItems();
     const products = await getProducts();
     items.map(item => {
       const product = products.find(p => p.id === item.product);
       return item.quantity * (product?.price || 0);
     });

🚨 CRITICAL: Backend Collection Types - Single Source of Truth:
- ALWAYS import backend types from @/lib/api
- NEVER define backend collection types locally (type CollectionName = {...})
- Error: "Type 'import(...).Type' is not assignable to type 'Type'" = duplicate definition
- Exception: Next.js built-in types ({ params: { id: string } }) are acceptable

🚨 CRITICAL: Literal Union Types and Type Inference:
- Problem: TypeScript infers string literals as 'string' type, not literal union ('car' | 'motorcycle')
- Error: "Type 'string' is not assignable to type '"car" | "motorcycle"'"
- Root Cause: Array literals with union type fields need explicit type annotation
- Solutions:
  ✅ SOLUTION 1 (Preferred): Type annotate the array
     const posts: Post[] = [
       { id: '1', type: 'car', ... }  // TypeScript now knows 'car' is the literal type
     ];
  ✅ SOLUTION 2: Use 'as const' assertion on literal values
     const posts = [
       { id: '1', type: 'car' as const, ... }  // Tells TypeScript this is literal 'car', not string
     ];
  ✅ SOLUTION 3: Inline type assertion
     setState([
       { id: '1', type: 'car' as 'car', ... }
     ]);
  ❌ WRONG: No type annotation when array has union literal fields
     const posts = [
       { id: '1', type: 'car', ... }  // TypeScript infers type: string (BREAKS!)
     ];
     setState(posts);  // ERROR: Type 'string' not assignable to '"car" | "motorcycle"'
- Pattern: When creating arrays with union literal types, ALWAYS add explicit type annotation
- Context: Happens with useState<Type[]>, function parameters expecting specific literal values
- Why: TypeScript's type inference widens 'car' to string for flexibility, but union types need literals

REASONING:
TypeScript strict mode requires explicit types to ensure type safety.
Build fails with "implicitly has an 'any' type" without proper annotations.
Literal types need explicit annotation or 'as const' to prevent widening to string.
`;

export const IMPORT_RULES = `
IMPORT ORGANIZATION REQUIREMENTS:

OBJECTIVE: Prevent duplicate identifier errors and ensure all dependencies available

CRITICAL CONSTRAINT - ONE IMPORT PER LIBRARY:
- Problem: Multiple import statements from same source cause "Duplicate identifier" errors
- Solution: Combine all imports from a library into single statement
- Check: Each library/module should appear only once in imports

Import Sources by Purpose:
- Icons: lucide-react library exclusively
- Hooks: react library (useState, useEffect, etc.)
- Backend Functions: @/lib/api with exact function signatures
- Backend Types: @/lib/api (all backend collection types) - NEVER define locally!
- Components: Never from @/components/ - icons come from lucide-react
- Next.js: Image from next/image, Link from next/link

Verification Process:
1. List all functions, components, icons used in file
2. Group by source library
3. Create single import statement per library
4. Verify no library appears multiple times

REASONING:
ES modules require single import declaration per source.
Duplicate imports cause compilation errors.
Missing imports cause runtime failures.
`;

export const CODE_STRUCTURE = `
CODE ORGANIZATION PRINCIPLES:

OBJECTIVE: Maintain clean architecture with appropriate file placement

File Structure Standards:
- UI Code: Inline in page.tsx files
- Utilities: src/lib/*.ts files
- Separation: Logic separate from presentation

Server vs Client Components:

Server Components (Default):
- Render on server
- Can fetch data directly
- No useState, useEffect, or browser APIs
- Better performance, smaller bundle size
- NO 'use client' directive needed (default behavior)

Client Component Requirements:
- Trigger: Interactive features (useState, useEffect, event handlers, browser APIs)
- Declaration: 'use client' directive MUST be first line (before all imports)
- Pattern: All page.tsx files with interactivity need client directive
- Required for: useState, useEffect, event handlers, browser APIs, window, localStorage
- Syntax example:
  'use client'; // First line!

  import { useState } from 'react';

Hydration Safety:
- Problem: Server/client mismatch causes hydration errors
- Solution: Avoid conditional rendering based on browser-only state during initial render
- Pattern: Load browser-dependent data in useEffect, not during render
- Constraints: No window, localStorage, or browser APIs in component body

Async Operations in useEffect:
- Problem: useEffect cannot be async directly, API calls return Promises
- Error: "This expression is not callable. Type 'Promise<any>' has no call signatures"
- Solution: Create async function inside useEffect, then call it
- Pattern: Define async function inside useEffect → Call it → Optional cleanup

🚨 COMMON MISTAKES WITH API CALLS:
❌ WRONG: const data = apiFunction(id);  // data is Promise, not the value!
❌ WRONG: apiFunction(id)();  // Cannot call Promise as a function!
❌ WRONG: const result = apiFunction(id); setData(result);  // result is Promise!
✅ CORRECT: apiFunction(id).then(data => setData(data));
✅ CORRECT: const data = await apiFunction(id);  // Inside async function only!

CRITICAL PATTERN - Try-Catch-Finally Structure:
1. Create async function inside useEffect
2. Try block: Set loading true, call API with await, update data state
3. Catch block: Use type guard (error instanceof Error), set error message
4. Finally block: Set loading false
5. Call async function immediately
6. Optional: Return cleanup function if needed

Example Structure (NO code, just pattern):
- Declare loading, error, data states before useEffect
- Inside useEffect: define async function
- Try: setLoading(true), data = await apiCall(), setData(data)
- Catch: const msg = error instanceof Error ? error.message : 'Error'; setError(msg)
- Finally: setLoading(false)
- Call async function
- Cleanup dependencies if needed

REASONING:
Next.js requires explicit client/server separation.
Hydration errors occur when server and client render differently.
useEffect cannot return Promise - requires wrapper function for async operations.
Try-catch-finally ensures proper state management and error handling.
Type guard prevents TypeScript errors when accessing error properties.
`;

export const STATE_MANAGEMENT = `
STATE MANAGEMENT ARCHITECTURE:

OBJECTIVE: Connect features through appropriate state patterns

DECISION FRAMEWORK:

Use Context (Shared State Across Pages):
- Trigger: Multiple pages need same state
- Examples: Cart system, user authentication, theme settings
- Implementation: Create context file in lib/, provide in layout, consume via hook
- Pattern: Provider wraps children, custom hook accesses state

🔐 NextAuth Authentication Integration:
- If authentication is enabled, NextAuth provides pre-built auth pages at /login and /signup
- Your pages should link to these routes for authentication actions
- Login/Signup buttons: Use <Link href="/login"> and <Link href="/signup">
- Logout buttons: Use useAuth() hook's logout() function (from @/hooks/useAuth)
- User session: Access via useAuth() hook (user, isAuthenticated, isLoading)
- Protected actions: Check isAuthenticated before allowing user-specific operations
- Example: "Sign In" button → <Link href="/login" className="...">Sign In</Link>
- Example: "Get Started" button → <Link href="/signup" className="...">Get Started</Link>
- DO NOT create custom login/signup forms in other pages - use the dedicated routes

Context File Structure (src/lib/[name]-context.tsx):
1. Define interface for context type
2. Create context with createContext<Type | undefined>(undefined)
3. Create Provider component with useState and state operations
4. Create custom hook (e.g., useCart) that calls useContext and checks if undefined
5. Export Provider and custom hook

Layout Integration (src/app/layout.tsx):
- Import Provider from lib/[name]-context
- Wrap children with Provider in layout.tsx body

Page Usage (pages that need the state):
- Import custom hook: import { useCart } from '@/lib/cart-context'
- Call hook in component: const { state, actions } = useCart()

CRITICAL RULES:
- Context file MUST export: Provider component + custom hook
- Context file MUST NOT: Import from itself, export naked Context object
- Pages MUST: Import and use the custom hook (e.g., useCart)
- Pages MUST NOT: Import CartContext directly or create providers

Use localStorage (Persistence):
- Trigger: Data must survive page refresh
- Examples: Cart contents, user preferences, form drafts
- Implementation: Save on state change, load on mount
- Pattern: useEffect for save/load operations

Use useState (Local Page State):
- Trigger: State only used within single component
- Examples: Form inputs, loading flags, modal state, filters
- Implementation: Within component scope
- Pattern: Simple useState hook

FEATURE CONNECTIVITY PATTERNS:

E-commerce Flow:
- Products page: Display + add-to-cart action
- Cart page: Show items from shared state
- Checkout page: Access cart state + submit
- Integration: Context provides shared cart across all pages

Blog Flow:
- Posts list: Display + link to details
- Single post: Load by ID from route params
- Comments: Filter by post ID
- Integration: Routing connects list to detail

Dashboard Flow:
- Overview: Summary metrics
- Details: Drill-down views
- Reports: Data visualization
- Integration: Navigation + data loading by section

CRITICAL REQUIREMENTS:

Functional Actions:
- Every button must have onClick handler
- Handler must perform actual operation
- Operations connect to data or state layer

Authentication Navigation:
- Login buttons must link to /login route (use Next.js Link component)
- Signup/Register buttons must link to /signup route (use Next.js Link component)
- Never create inline auth forms - use the dedicated auth pages
- Use useAuth() hook to access user session and logout functionality

Visual Feedback:
- Loading states during async operations
- Success confirmation after actions
- Error messages on failures

Type Safety:
- Nullable states: Type union with null
- Array states: Type with array notation
- Event handlers: React event types

REASONING:
Appropriate state management prevents prop drilling and enables feature integration.
Persistence ensures good user experience across sessions.
Visual feedback communicates system status to users.
`;

export const OUTPUT_FORMAT = `
🚨 [FRONTEND NODE OUTPUT FORMAT]
OUTPUT REQUIREMENTS:

CRITICAL - PURE CODE ONLY:
- NO conversational text (no "Certainly", "Here's", "Below is", etc.)
- NO explanations before or after code
- NO markdown code fences (\`\`\`tsx, \`\`\`, etc.)
- NO comments explaining what you're doing
- ONLY executable TypeScript/React code
⚠️ NOTE: This TypeScript format is ONLY for frontend code generation. Backend nodes use JSON format.

VALID START:
- 'use client' directive (if needed)
- import statements
- type definitions
- component code

INVALID START (WILL CAUSE BUILD FAILURE):
- "Certainly! Below is..."
- "Here's the implementation..."
- "This file includes..."
- Any conversational text

ENFORCEMENT:
First character MUST be either:
1. Single quote (start of 'use client')
2. Letter 'i' (start of 'import')
3. Letter 't' (start of 'type' or 'const')
4. Letter 'e' (start of 'export')
5. Forward slash (start of comment)

Any other first character = INVALID OUTPUT
`;

export const DATABASE_PRESERVATION_RULES = `
DATABASE PRESERVATION:

OBJECTIVE: Maintain existing functionality unless explicitly requested to change

Preservation Rules:
- Database code: Preserve window.db unless user requests change
- Navigation: Preserve links unless user requests change
- Features: Preserve existing features unless user requests removal
- Methods: window.db operations (get, add, update, delete, subscribe) are all async

Modification Trigger:
Only modify database sections when explicitly requested by user.

REASONING:
Unnecessary changes risk breaking existing functionality.
Preserve working code unless change is required.
`;
