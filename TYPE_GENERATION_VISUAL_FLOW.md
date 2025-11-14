# TypeScript Type Generation - Visual Flow Diagrams

## 1. COMPLETE SYSTEM FLOW

```
USER REQUEST
    ↓
    "Create an e-commerce app with products, cart, orders"
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: PM NODE - Feature Analysis                            │
├─────────────────────────────────────────────────────────────────┤
│ Features to build:                                              │
│  • Browse Products (needs Products collection)                  │
│  • Add to Cart (needs CartItems collection)                     │
│  • Checkout (needs Orders collection)                           │
│ Output: allRequestedFeatures with backend_required flags        │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: BACKEND NODE - Schema Generation [ISSUE #1]          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Step A: Collections → PocketBase Fields                        │
│ ─────────────────────────────────────────────                  │
│   Collections: [                                               │
│     {                                                           │
│       name: "products",                                         │
│       fields: [                                                │
│         { name: "title", type: "text", required: true },       │
│         { name: "price", type: "number", required: true },     │
│         { name: "image", type: "file", required: false },      │
│         { name: "tags", type: "json", required: false }        │
│       ]                                                        │
│     },                                                          │
│     ...                                                         │
│   ]                                                            │
│                                                                 │
│ Step B: Features → API Endpoints [WITH/WITHOUT Parameters]    │
│ ──────────────────────────────────────────────────────────     │
│   API Endpoints: [                                             │
│     {                                                           │
│       handler: "getProducts",                                  │
│       method: "GET",                                           │
│       path: "/api/products",                                   │
│       parameters: [✓ COMPLETE] or [✗ HEURISTIC?]            │
│         {                                                       │
│           name: "limit",                                       │
│           type: "number",                                      │
│           required: false,                                     │
│           location: "query"                                    │
│         }                                                       │
│       ],                                                        │
│       returns: "Products[]"  or [✗ INFERRED?]                │
│     },                                                          │
│     ...                                                         │
│   ]                                                            │
│                                                                 │
│ ⚠️  ISSUE #1: Parameters/returns might be missing or          │
│    auto-generated heuristically instead of from requirements   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: FRONTEND NODE - API Client Generation [ISSUE #2]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Input: state.backendConfig.collections                        │
│                                                                 │
│ ┌─ Collection Schema ─────────────────────────────────────┐   │
│ │ {                                                        │   │
│ │   name: "products",                                      │   │
│ │   fields: [                                              │   │
│ │     { name: "price", type: "number", required: true },  │   │
│ │     { name: "tags", type: "json", required: false },    │   │
│ │     { name: "category", type: "relation", ... }         │   │
│ │   ]                                                       │   │
│ │ }                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                ↓                                               │
│    generateApiClient() [LINES 1-229]                         │
│                ↓                                               │
│ ┌─ TYPE MAPPING [ISSUE #2] ──────────────────────────────┐   │
│ │                                                         │   │
│ │ switch (field.type?.toLowerCase()) {                  │   │
│ │   case 'text': tsType = 'string'; ✓                   │   │
│ │   case 'number': tsType = 'number'; ✓                 │   │
│ │   case 'json': tsType = 'any[]'; ✗ WRONG!             │   │
│ │     └─ What if JSON is object { key: value }?         │   │
│ │     └─ This assumes ALWAYS array                      │   │
│ │   case 'relation': tsType = 'string'; ✗ INCOMPLETE!   │   │
│ │     └─ What if one-to-many? Should be string[]        │   │
│ │   case 'file': tsType = 'string'; ✗ INCOMPLETE!       │   │
│ │     └─ What if maxFiles > 1? Should be string[]       │   │
│ │   default: tsType = 'any'; ✗ SILENT LOSS OF SAFETY   │   │
│ │ }                                                       │   │
│ │                                                         │   │
│ └─────────────────────────────────────────────────────────┘   │
│                ↓                                               │
│         Output Interface:                                      │
│                ↓                                               │
│ ┌─ Generated TypeScript [WRONG TYPES] ─────────────────┐     │
│ │                                                        │     │
│ │ export interface Products {                           │     │
│ │   id?: string;                                         │     │
│ │   created?: string;                                    │     │
│ │   updated?: string;                                    │     │
│ │   price?: number;          ✓ CORRECT                 │     │
│ │   tags?: any[];            ✗ SHOULD BE: any          │     │
│ │   category?: string;       ✗ SHOULD BE: string[] ???  │     │
│ │ }                                                        │     │
│ │                                                        │     │
│ └────────────────────────────────────────────────────────┘    │
│                                                                 │
│ ⚠️  ISSUE #2: Type mapping oversimplifies field types        │
│    JSON always → any[]  (wrong for objects)                   │
│    Relation always → string  (wrong for one-to-many)          │
│    File always → string  (wrong for multiple files)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: Endpoint → Function Generation [ISSUE #3]            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Input: Endpoint Definition                                    │
│ ─────────────────────────────                                 │
│ {                                                              │
│   handler: "searchProducts",                                   │
│   method: "GET",                                               │
│   path: "/api/products/search",                                │
│   parameters: ??? [COMPLETE or MISSING?]                       │
│   returns: ??? [PROVIDED or INFERRED?]                         │
│ }                                                              │
│                ↓                                               │
│    Check: Does parameters array exist?                        │
│                ↓                                               │
│          YES / NO                                             │
│          /          \                                          │
│     ✓ YES          ✗ NO                                        │
│      |              |                                          │
│      ↓              ↓                                          │
│  Use Schema    Use HEURISTICS [ISSUE #3]                      │
│               ───────────────────────────                      │
│               if (path.includes('/search')) →                 │
│                 params.push('params?: Record<string, any>')    │
│               if (hasIdParam) →                                │
│                 params.push('id: string')                      │
│               if (hasBody) →                                   │
│                 params.push('data: any')                       │
│                                                                 │
│ Result: Function Signature                                    │
│ ────────────────────────                                      │
│                                                                 │
│ WITH SCHEMA (✓):                                              │
│ export async function searchProducts(                         │
│   params: { category?: string, minPrice?: number }           │
│ ): Promise<Products[]> { ... }                               │
│                                                                 │
│ WITHOUT SCHEMA (✗):                                           │
│ export async function searchProducts(                         │
│   params?: Record<string, any>                                │
│ ): Promise<any> { ... }                                       │
│     ↑ LOSES ALL TYPE SAFETY!                                 │
│                                                                 │
│ ⚠️  ISSUE #3: Fallback to heuristics loses type information  │
│    Missing parameter schemas cause generic Record<string,any> │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 5: API Client File Created [ISSUE #4]                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ File: src/lib/api.ts (Generated by frontend node)             │
│ ──────────────────────────────────────────────────            │
│                                                                 │
│ export interface Products { ... }   ← WRONG TYPES            │
│ export interface CartItems { ... }                            │
│ export interface Orders { ... }                               │
│                                                                 │
│ export async function getProducts(): Promise<Products[]> {...}│
│ export async function createOrder(data: any): Promise<any> {...}
│                             ↑ GENERIC - WRONG TYPE           │
│                                                                 │
│ ⚠️  ISSUE #4: Generated AFTER file planning                   │
│    But AI needs this to plan file structure                    │
│    Causes: "I planned pages/products.tsx before knowing       │
│             what type Products[] is"                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 6: Type Extraction [ISSUE #5]                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Function: extractTypeDefinitions(api_ts_content)              │
│                                                                 │
│ Read back the api.ts file and extract interfaces:            │
│   ✓ export interface Products { ... }                        │
│   ✓ export interface CartItems { ... }                       │
│                                                                 │
│ Error handling:                                                │
│ ─────────────────                                              │
│   try {                                                        │
│     // Regex extraction                                        │
│     return definitions;  ✓                                     │
│   } catch (error) {                                            │
│     console.error(error);                                      │
│     return [];          ✗ SILENT FAILURE!                     │
│   }                                                            │
│                                                                 │
│ ⚠️  ISSUE #5: Silent error returns empty array                │
│    No indication that types failed to extract                 │
│    Downstream code gets empty type list and continues anyway  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 7: Frontend Code Generation [ISSUE #6]                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ For each page/component, AI generates TypeScript code:        │
│                                                                 │
│ pages/products.tsx:                                            │
│ ───────────────────                                            │
│ import { Products } from '@/lib/api';  ✓ Type imported       │
│ import { getProducts } from '@/lib/api'; ✓ Function imported  │
│                                                                 │
│ export default function ProductsPage() {                      │
│   const [products, setProducts] = useState<Products[]>([]);  │
│                                                                 │
│   useEffect(() => {                                            │
│     getProducts().then(res => {                                │
│       if (res[0]?.tags) {     ✗ WRONG if tags: any[]         │
│         res[0].tags.forEach(tag => {  ← TYPE ERROR!          │
│           // Cannot iterate union type (any[] | any)         │
│         });                                                     │
│       }                                                        │
│     });                                                        │
│   }, []);                                                      │
│ }                                                              │
│                                                                 │
│ ⚠️  ISSUE #6: Frontend code written against wrong types       │
│    Because types were wrong from generation                   │
│    Causes cascading type errors in components                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 8: DevOps/Build [ISSUE #7]                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Deployment Server: deployment-server/build-manager.js         │
│                                                                 │
│ Step 1: npm install                                            │
│ Step 2: npm run build                                          │
│         └─ Runs: next build                                    │
│            └─ Runs: tsc (TypeScript compiler)                 │
│               └─ CATCHES TYPE ERRORS ← TOO LATE!             │
│                                                                 │
│ Build Error Output:                                            │
│ ──────────────────                                             │
│ error TS2345: Argument of type 'any[]' is not                │
│   assignable to parameter of type 'string[]'                 │
│   at pages/products.tsx:42:18                                │
│                                                                 │
│ Parsing (Lines 321-330):                                      │
│ ──────────────────────────                                     │
│ if (errorMessage.includes('TypeScript')) {                    │
│   userFriendlyError = 'TypeScript compilation errors detected';│
│ }                                                              │
│ return { success: false, error: userFriendlyError };          │
│ └─ GENERIC MESSAGE - no line numbers or details              │
│ └─ NO RECOVERY - build just fails                            │
│                                                                 │
│ ⚠️  ISSUE #7: Errors only caught at build time                │
│    Too late to fix programmatically                           │
│    Generic error messages don't indicate what went wrong       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
    ↓
BUILD FAILS ❌
```

---

## 2. TYPE MAPPING DECISION TREE

```
Collection Field from PocketBase
        ↓
 What is field.type?
        ↓
    ┌───┴───┬─────┬─────┬──────┬────────┬────┐
    │       │     │     │      │        │    │
  text    number bool  date   json   relation file
    │       │     │     │      │        │    │
    ↓       ↓     ↓     ↓      ↓        ↓    ↓
 string  number bool  string  any[]   string string
                                │      │      │
                        ❌ WRONG!  ❌ INCOMPLETE!  ❌ INCOMPLETE!
                                │      │      │
                        ✓ What if    Check:    Check:
                        ✓ not array? maxSelect maxFiles
                        ✓ What if    │         │
                        ✓ object?    ↓         ↓
                                  1 only?   1 only?
                                  │         │
                              NO  │  YES   NO  │  YES
                              ↓   ↓    ↓      ↓    ↓
                          string[] string string[] string
```

**Current Implementation** (Wrong):
```
'relation' always → 'string'
```

**Correct Implementation** (Needed):
```
'relation' → field.options?.maxSelect !== 1 ? 'string[]' : 'string'
```

---

## 3. PARAMETER SCHEMA FLOW

```
Endpoint Definition
        ↓
  Does it have parameters schema?
        ↓
    YES / NO
    /       \
  ✓/        \✗
  /          \
 ↓            ↓
Use Schema   Heuristics [ISSUE #3]
│            │
│            ├─ Is it /search? → add query params
│            │
│            ├─ Has :id? → add id: string
│            │
│            └─ POST/PUT? → add data: any
│                           ↑ LOSES TYPES!
│
├─ Filter path params     Example:
│ (location: 'path')       ✓ SCHEMA: searchProducts(params: { category: string })
│                          ✗ HEURISTIC: searchProducts(params?: Record<string, any>)
├─ Filter query params
│ (location: 'query')
│
└─ Filter body params
  (location: 'body')
        ↓
  Build Signature
        ↓
export async function handler(
  pathParams,
  queryParams?: { ... },
  bodyParams
): Promise<ReturnType> { ... }
```

---

## 4. ERROR CASCADE

```
ISSUE #1: Backend Schema
│
├─ Missing parameters for endpoint
│
└─→ ISSUE #3: Fallback to heuristics
   │
   └─→ ISSUE #2: Type mapping oversimplifies remaining fields
      │
      └─→ ISSUE #5: Error handling silently fails
         │
         └─→ ISSUE #6: Type constraints too late
            │
            └─→ ISSUE #4: API client generated after planning
               │
               └─→ Frontend code written against wrong types
                  │
                  └─→ ISSUE #7: Build fails with generic error
                     │
                     └─→ Manual debugging required
                        │
                        └─→ User frustrated ❌
```

---

## 5. TIMING ISSUE

```
Timeline of Frontend Node:

Start ─────────────────────────────────────────────────────────── End
  │                                                               │
  ├─ Step 1: PLAN FILES                                         │
  │  (AI decides: pages/products.tsx, components/ProductCard.tsx│
  │  ⚠️  But types don't exist yet!)                            │
  │                                                              │
  ├─ Step 2: GENERATE API CLIENT                               │
  │  (Calls generateApiClient() - NOW types exist)              │
  │                                                              │
  ├─ Step 3: EXTRACT TYPES                                     │
  │  (Calls extractTypeDefinitions())                           │
  │                                                              │
  ├─ Step 4: GENERATE FILES [ISSUE #4]                         │
  │  (AI generates pages/products.tsx)                          │
  │  ⚠️  AI planned page before knowing types!)                 │
  │                                                              │
  └─ Step 5: GENERATE CONFIG                                    │
     (tailwind, next.config, etc.)                             │

PROBLEM: AI plans files BEFORE API types exist
SOLUTION: Generate API client BEFORE file planning

Better Timeline:

Start ─────────────────────────────────────────────────────────── End
  │                                                               │
  ├─ Step 0: GENERATE API CLIENT FIRST ✓                        │
  │  (Types immediately available)                              │
  │                                                              │
  ├─ Step 1: PLAN FILES                                         │
  │  (AI can now use actual types in planning)                  │
  │                                                              │
  ├─ Step 2: GENERATE FILES                                     │
  │  (AI generates against real types)                          │
  │                                                              │
  └─ Step 3: GENERATE CONFIG                                    │
     (tailwind, next.config, etc.)                             │
```

---

## 6. TYPE MAPPING ISSUE EXAMPLES

### Example 1: JSON Field Problem

```
PocketBase Collection:
┌────────────────────────────┐
│ products                    │
├────────────────────────────┤
│ id: string                  │
│ title: string               │
│ settings: json              │
│   └─ Actual value:         │
│      {                      │
│        darkMode: true,     │
│        language: 'en'      │
│      }                      │
└────────────────────────────┘
         ↓
mapType(settings: 'json')
         ↓
Switch statement:
case 'json':
  tsType = 'any[]'  ❌ WRONG!
         ↓
Generated Interface:
interface Products {
  settings?: any[]  ❌ EXPECTS ARRAY
}
         ↓
Frontend Code:
const product = products[0];
product.settings.forEach(s => {});  ← RUNTIME ERROR!
                     ↑
        Cannot call forEach on object


SHOULD BE:
case 'json':
  tsType = 'any'  ✓ WORKS FOR BOTH ARRAYS AND OBJECTS
```

### Example 2: Relation Field Problem

```
PocketBase Collection:
┌────────────────────────────┐
│ cartItems                   │
├────────────────────────────┤
│ id: string                  │
│ product: relation           │
│   └─ field.options:        │
│      maxSelect: 1           │ (one-to-one)
│ tags: relation              │
│   └─ field.options:        │
│      maxSelect: 10          │ (one-to-many)
└────────────────────────────┘
         ↓
mapType(product: 'relation')      mapType(tags: 'relation')
         ↓                                 ↓
case 'relation':                  case 'relation':
  tsType = 'string'  ❌             tsType = 'string'  ❌
                                           ↓
Generated Interfaces:              WRONG! Should be 'string[]'
interface CartItems {
  product?: string  ✓ CORRECT
  tags?: string     ✗ WRONG!
}
                                           ↓
Frontend Code:
const item = cartItems[0];
item.product.id  ✓ Works
item.tags.forEach(t => {})  ← TYPE ERROR!
          ↑
   Cannot iterate string


SHOULD BE:
case 'relation':
  tsType = field.options?.maxSelect !== 1 ? 'string[]' : 'string'
```

### Example 3: File Field Problem

```
PocketBase Collection:
┌────────────────────────────┐
│ products                    │
├────────────────────────────┤
│ id: string                  │
│ image: file                 │
│   └─ field.options:        │
│      maxFiles: 1            │ (single file)
│ images: file                │
│   └─ field.options:        │
│      maxFiles: 5            │ (multiple files)
└────────────────────────────┘
         ↓
mapType(image: 'file')         mapType(images: 'file')
         ↓                              ↓
case 'file':                   case 'file':
  tsType = 'string'  ✓           tsType = 'string'  ✗
                                        ↓
Generated Interfaces:          WRONG! Should be 'string[]'
interface Products {
  image?: string   ✓ CORRECT
  images?: string  ✗ WRONG!
}
                                        ↓
Frontend Code:
const product = products[0];
product.image.startsWith('/')  ✓ Works
product.images.forEach(img => {})  ← TYPE ERROR!
           ↑
   Cannot iterate string


SHOULD BE:
case 'file':
  tsType = field.options?.maxFiles !== 1 ? 'string[]' : 'string'
```

---

## 7. SOLUTION ARCHITECTURE

```
CURRENT (Wrong):
┌─────────────────────────────────────┐
│ Generate Code                       │
│ └─ Extract Types (reactive)        │
│    └─ Validate at build time       │
│       └─ FAIL ❌                    │
└─────────────────────────────────────┘

PROPOSED (Correct):
┌─────────────────────────────────────┐
│ Validate Schema (proactive)         │
│ ├─ Ensure complete parameters      │
│ ├─ Ensure returns types            │
│ └─ Ensure field mappings known    │
│    ↓                                │
│ Generate Correct Types              │
│ ├─ Use schema-driven mapping       │
│ ├─ No heuristics                   │
│ └─ Register all types              │
│    ↓                                │
│ Plan Files (with types available)   │
│ ├─ AI knows exact types            │
│ └─ Better decisions                │
│    ↓                                │
│ Generate Code (against known types) │
│ ├─ Imports will work               │
│ ├─ Type annotations correct        │
│ └─ Build succeeds ✓                │
└─────────────────────────────────────┘
```

---

## 8. VALIDATION PIPELINE

```
Backend Output → Validation Layer → Frontend Input
                        ↓
                Check Each Endpoint:
                        ↓
        ┌───────────────┴───────────────┐
        │ Has parameters schema?        │
        ├────────────────────────────── │
        YES → Validate parameter structure
        │     ├─ location in ['path', 'query', 'body']
        │     ├─ type valid TypeScript
        │     └─ required is boolean
        │
        NO → Throw Error:
        │    "Endpoint X missing complete schema"
        │
        └─────────────────────────────┘
        ↓
        ├─ Has returns type?
        │  YES → Use it
        │  NO → Throw Error: "Endpoint X missing returns type"
        │
        └─────────────────────────────┘
        ↓
ONLY IF ALL VALID: Pass to Frontend
```

---

## 9. TYPE REGISTRY CONCEPT

```
┌────────────────────────────────────────┐
│ Type Registry                          │
├────────────────────────────────────────┤
│                                        │
│ register(typeName, definition)         │
│   └─ Products → {                     │
│        interface: "interface Products"│
│        fields: [...],                 │
│        source: "@/lib/api"            │
│      }                                 │
│                                        │
│ getType(typeName) → definition        │
│   └─ Get exact structure              │
│                                        │
│ validateImport(typeName, file)         │
│   └─ Check if import would work       │
│   └─ Return ValidationError if not    │
│                                        │
│ validateUsage(typeName, expr, file)   │
│   └─ Check if usage is type-safe      │
│   └─ "Cannot call .map() on string"   │
│                                        │
└────────────────────────────────────────┘
```

