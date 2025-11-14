/**
 * BACKEND INTEGRATION RULES
 * Schema-driven API contract enforcement
 * CRITICAL: Backend exports complete function signatures with parameters
 */

export const BACKEND_API_RULES = `
BACKEND API INTEGRATION (SCHEMA-DRIVEN):

OBJECTIVE: Use backend-provided function schemas for perfect alignment

✅ NEW: SCHEMA-DRIVEN APPROACH:
Backend now exports COMPLETE function signatures including:
- Exact parameter names and types
- Whether parameters are required or optional
- Return types for type safety
- Parameter locations (path, query, body)

Contract Requirements:
- Import from @/lib/api exclusively (see shared-constraints.ts IMPORT_RULES for complete import organization)
- Use EXACT function signatures shown in EXACT FUNCTION SIGNATURES section
- NEVER modify parameter names, types, or order
- NEVER add/remove parameters from signatures
- NEVER change parameter labels (e.g., 'params:', 'data:', 'id:')

Signature Examples:
✅ CORRECT: search{Collection}(params: { query?: string, category?: string })
✅ CORRECT: get{Collection}ById(id: string)
✅ CORRECT: create{Collection}(data: any)
❌ WRONG: search{Collection}({ query }) - missing 'params:' label
❌ WRONG: search{Collection}() - missing required parameters
❌ WRONG: get{Collection}ById() - missing 'id' parameter

Validation Process:
1. Find function in EXACT FUNCTION SIGNATURES section
2. Copy signature EXACTLY including parameter labels
3. Use exact function name, parameter names, and types
4. Never assume or guess parameters

REASONING:
Backend provides COMPLETE function schemas with full type information.
Frontend must use EXACT signatures to match generated API client.
Any deviation causes TypeScript errors and runtime failures.
Schema-driven approach eliminates guesswork and mismatches.
`;

export const REACT_QUERY_RULES = `
DATA FETCHING STRATEGY:

OBJECTIVE: Select appropriate data fetching approach

Option 1 - Direct API Calls (Default):
- When: Standard async/await pattern needed
- Implementation: useEffect with async wrapper + API import from @/lib/api
- Pattern: See SHARED_CONSTRAINTS.CODE_STRUCTURE for async useEffect pattern
- Safety: Always available if backend exists

Option 2 - React Query Hooks (Conditional):
- When: Hooks explicitly provided in API configuration
- Implementation: Import specific useX hook if available
- Constraint: Only use hooks that actually exist in configuration

Decision Process:
1. Check if React Query hooks provided in API config
2. If hook exists: Use it (better caching, loading states)
3. If no hook: Use direct API call in useEffect (see SHARED_CONSTRAINTS)
4. Never invent hook names not in configuration

REASONING:
React Query provides better UX but requires explicit configuration.
Direct API calls are simpler and always work.
Assuming hooks exist causes import errors.
For async useEffect details, refer to SHARED_CONSTRAINTS.CODE_STRUCTURE.
`;

export const API_CONTRACT_SCHEMA = `
API CONTRACT SCHEMA (SCHEMA-DRIVEN):

OBJECTIVE: Backend exports complete endpoint schemas with full type information

✅ NEW: ENDPOINT SCHEMA STRUCTURE:

Every backend endpoint now includes:
{
  "handler": "searchItems",
  "method": "GET",
  "path": "/api/items/search",
  "parameters": [
    { "name": "query", "type": "string", "required": false, "location": "query" },
    { "name": "category", "type": "string", "required": false, "location": "query" }
  ],
  "returns": "Items[]"
}

PARAMETER LOCATIONS:
- "path": From URL path (/api/items/:id → id is path param)
- "query": From URL query string (?query=keyword → query is query param)
- "body": From request body (POST/PUT/PATCH data)

STANDARD PATTERNS WITH SCHEMAS:

List with filters:
{
  "handler": "get{Collection}",
  "parameters": [
    { "name": "category", "type": "string", "required": false, "location": "query" },
    { "name": "limit", "type": "number", "required": false, "location": "query" }
  ],
  "returns": "{Collection}[]"
}
Frontend signature: get{Collection}(params?: { category?: string, limit?: number }): Promise<{Collection}[]>

Search endpoint:
{
  "handler": "search{Collection}",
  "parameters": [
    { "name": "query", "type": "string", "required": false, "location": "query" }
  ],
  "returns": "{Collection}[]"
}
Frontend signature: search{Collection}(params?: { query?: string }): Promise<{Collection}[]>

Get by ID:
{
  "handler": "get{Collection}ById",
  "parameters": [
    { "name": "id", "type": "string", "required": true, "location": "path" }
  ],
  "returns": "{Collection}"
}
Frontend signature: get{Collection}ById(id: string): Promise<{Collection}>

Create:
{
  "handler": "create{Collection}",
  "parameters": [
    { "name": "data", "type": "object", "required": true, "location": "body" }
  ],
  "returns": "{Collection}"
}
Frontend signature: create{Collection}(data: any): Promise<{Collection}>

FRONTEND INTEGRATION WITH SCHEMA:

Import Requirements:
- Functions from @/lib/api with EXACT signatures from schema
- Never modify parameter structure shown in EXACT FUNCTION SIGNATURES

Call Pattern:
1. Find function signature in EXACT FUNCTION SIGNATURES section
2. Import function from @/lib/api
3. Call with EXACT parameter structure (labels, names, types)
4. Handle Promise<ReturnType> response
5. Show loading states during async operations
6. Display error messages on failures

VALIDATION CHECKLIST:

Backend Schema Completeness:
- Every endpoint has "parameters" array (even if empty)
- Every endpoint has "returns" field
- Parameter locations correctly specified
- Required/optional flags set appropriately

Frontend Integration:
- Imports match backend handler names
- Function calls use EXACT signatures from schema
- Parameter labels match (params:, data:, id:)
- Type safety maintained with return types
- Error handling implemented

REASONING:
Schema-driven approach provides complete type information.
Frontend can generate perfect function signatures from schema.
No guesswork, no heuristics, no mismatches.
TypeScript ensures type safety end-to-end.
`;

export const FRONTEND_API_GUIDELINES = `
FRONTEND API INTEGRATION PROCESS:

OBJECTIVE: Implement reliable API consumption

API CLIENT STRUCTURE:

Principle: One-to-one mapping of frontend functions to backend endpoints
- Backend endpoint: GET /api/{collection}
- Backend handler: get{Collection}()
- Frontend import: import { get{Collection} } from '@/lib/api'
- Frontend usage: const data = await get{Collection}()

ERROR HANDLING PATTERN:

For async API calls in useEffect, refer to SHARED_CONSTRAINTS.CODE_STRUCTURE.
The complete try-catch-finally pattern with type guards is documented there.

State Management Requirements:
- Loading state: Boolean indicating operation in progress
- Error state: String or null containing error message
- Data state: Response data or initial state

LOADING STATES:

Purpose: Provide user feedback during async operations

Implementation by Context:
- Lists: Skeleton screens showing structure
- Buttons/Forms: Spinner icon with disabled state
- Inputs: Disabled attribute during submission

Timing:
- Start: Immediately before API call
- End: After response or error

PROJECT ID USAGE:

Purpose: Multi-tenancy and debugging support

Implementation:
- Display: Show in footer or settings
- Error messages: Include for debugging context
- Collections: Use via helper, never hardcode

VALIDATION BEFORE API CALLS:

Prerequisites Check:
- Authentication: Verify user logged in if required
- Form validation: Ensure data meets requirements
- Permissions: Confirm user can perform action

Data Validation:
- POST/PATCH: Validate payload structure
- DELETE: Confirm destructive action
- Parameters: Ensure required fields present

UI State:
- Disable submission buttons during processing
- Prevent duplicate submissions
- Clear error states before retry

REASONING:
Consistent patterns improve code maintainability.
Error handling prevents silent failures.
Loading states communicate system status.
Validation prevents invalid API calls.
`;
