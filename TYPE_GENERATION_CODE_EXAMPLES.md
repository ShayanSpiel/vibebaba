# TypeScript Type Generation - Code Examples & Solutions

## Example 1: JSON Field Type Error

### The Problem

**PocketBase Schema**:
```typescript
{
  name: "products",
  fields: [
    { name: "id", type: "text", required: true },
    { name: "settings", type: "json", required: false }
  ]
}
```

**What Actually Gets Stored**:
```typescript
const product = {
  id: "abc123",
  settings: {
    darkMode: true,
    language: "en",
    notifications: ["email", "push"]
  }
};
```

**Current (WRONG) Type Generation**:
```typescript
// File: lib/langgraph/nodes/frontend/generators/api-client-generator.ts:37-41

case 'json':
  tsType = 'any[]';  // ❌ ASSUMES ALWAYS ARRAY
  break;

// Generated interface:
export interface Products {
  id: string;
  settings?: any[];  // ❌ WRONG TYPE
}
```

**Frontend Code Breaks**:
```typescript
import { Products } from '@/lib/api';

const product: Products = await getProduct('abc123');

// Line 1: TypeScript Error
if (product.settings) {
  // Cannot assign { darkMode: true, ... } to type any[]
  const mode = product.settings.darkMode;  // ❌ Property doesn't exist on any[]
}

// Line 2: Runtime Error
product.settings?.forEach(s => {  // ❌ Cannot call forEach on object
  console.log(s);
});
```

### The Solution

**Step 1: Fix Type Mapping** (in `api-client-generator.ts`)
```typescript
// BEFORE (WRONG):
case 'json':
  tsType = 'any[]';
  break;

// AFTER (CORRECT):
case 'json':
  tsType = 'any';  // ✓ Works for BOTH objects and arrays
  break;
```

**Step 2: Generated Interface** (now correct)
```typescript
export interface Products {
  id: string;
  settings?: any;  // ✓ CORRECT - accepts anything
}
```

**Step 3: Frontend Code Works**
```typescript
const product: Products = await getProduct('abc123');

// Now works correctly
const mode = (product.settings as any).darkMode;  // ✓ OK
// OR with proper typing:
interface Settings {
  darkMode: boolean;
  language: string;
  notifications: string[];
}
const settings = product.settings as Settings;
const mode = settings.darkMode;  // ✓ OK
```

---

## Example 2: Relation Field Type Error

### The Problem

**PocketBase Schema**:
```typescript
{
  name: "cartItems",
  fields: [
    { name: "product", type: "relation", required: true, 
      options: { maxSelect: 1 } },  // ONE product per cart item
    { name: "relatedItems", type: "relation", required: false,
      options: { maxSelect: 10 } }  // MANY related items
  ]
}
```

**What Actually Gets Stored**:
```typescript
const cartItem = {
  product: "product_id_123",          // Single string
  relatedItems: ["id1", "id2", "id3"]  // Array of strings
};
```

**Current (WRONG) Type Generation**:
```typescript
// File: lib/langgraph/nodes/frontend/generators/api-client-generator.ts:45-47

case 'relation':
  tsType = 'string';  // ❌ ALWAYS MAPS TO STRING
  break;

// Generated interface:
export interface CartItems {
  product?: string;         // ✓ Happens to be right by accident
  relatedItems?: string;    // ❌ WRONG - should be string[]
}
```

**Frontend Code Breaks**:
```typescript
import { CartItems } from '@/lib/api';

const item: CartItems = await getCartItem('xyz');

// Accessing product works (happens to be string)
console.log(item.product);  // ✓ Works

// Accessing relatedItems breaks
item.relatedItems?.forEach(id => {  // ❌ Cannot iterate string
  console.log(id);
});

// Or alternatively:
const ids = item.relatedItems?.split(',');  // ❌ Wrong - trying to split array value
```

### The Solution

**Step 1: Check field.options in Type Mapping** (in `api-client-generator.ts`)
```typescript
// BEFORE (WRONG):
case 'relation':
  tsType = 'string';
  break;

// AFTER (CORRECT):
case 'relation': {
  // Check if one-to-many or one-to-one
  const isArray = field.options?.maxSelect !== 1;
  tsType = isArray ? 'string[]' : 'string';
  break;
}
```

**Step 2: Generated Interface** (now correct)
```typescript
export interface CartItems {
  product?: string;          // ✓ CORRECT - single ID
  relatedItems?: string[];   // ✓ CORRECT - array of IDs
}
```

**Step 3: Frontend Code Works**
```typescript
const item: CartItems = await getCartItem('xyz');

// Both now work correctly
console.log(item.product);  // ✓ string

item.relatedItems?.forEach(id => {  // ✓ Works - string[]
  console.log(id);
});
```

---

## Example 3: File Field Type Error

### The Problem

**PocketBase Schema**:
```typescript
{
  name: "posts",
  fields: [
    { name: "thumbnail", type: "file", required: true,
      options: { maxFiles: 1 } },  // SINGLE file
    { name: "attachments", type: "file", required: false,
      options: { maxFiles: 5 } }   // MULTIPLE files
  ]
}
```

**What Actually Gets Stored**:
```typescript
const post = {
  thumbnail: "image_2024.jpg",                      // Single string (filename)
  attachments: ["file1.pdf", "file2.doc", "file3.zip"]  // Array of strings
};
```

**Current (WRONG) Type Generation**:
```typescript
// File: lib/langgraph/nodes/frontend/generators/api-client-generator.ts:42-44

case 'file':
  tsType = 'string';  // ❌ ALWAYS MAPS TO STRING
  break;

// Generated interface:
export interface Posts {
  thumbnail?: string;     // ✓ Happens to be right
  attachments?: string;   // ❌ WRONG - should be string[]
}
```

**Frontend Code Breaks**:
```typescript
import { Posts } from '@/lib/api';

const post: Posts = await getPost('post123');

// Getting thumbnail works
const thumbUrl = `/uploads/${post.thumbnail}`;  // ✓ OK

// Getting attachments breaks
post.attachments?.forEach(file => {  // ❌ Cannot iterate string
  console.log(file);
});

// Trying to iterate single file URL
const files = post.attachments?.split('');  // ❌ Wrong - creates array of chars
```

### The Solution

**Step 1: Check field.options in Type Mapping** (in `api-client-generator.ts`)
```typescript
// BEFORE (WRONG):
case 'file':
  tsType = 'string';
  break;

// AFTER (CORRECT):
case 'file': {
  // Check if multiple files allowed
  const isArray = field.options?.maxFiles !== 1;
  tsType = isArray ? 'string[]' : 'string';
  break;
}
```

**Step 2: Generated Interface** (now correct)
```typescript
export interface Posts {
  thumbnail?: string;      // ✓ CORRECT - single filename
  attachments?: string[];  // ✓ CORRECT - array of filenames
}
```

**Step 3: Frontend Code Works**
```typescript
const post: Posts = await getPost('post123');

// Both now work correctly
const thumbUrl = `/uploads/${post.thumbnail}`;  // ✓ string

post.attachments?.forEach(file => {  // ✓ Works - string[]
  console.log(`/uploads/${file}`);
});
```

---

## Example 4: Missing Parameter Schema

### The Problem

**Backend Node Output**:
```typescript
{
  handler: "searchProducts",
  method: "GET",
  path: "/api/products/search",
  // ❌ MISSING: parameters: [...]
  // ❌ MISSING: returns: "Products[]"
}
```

**Current (WRONG) Type Generation** (Falls back to heuristics):
```typescript
// File: lib/langgraph/nodes/frontend/generators/api-client-generator.ts:162-178

if (ep.parameters && Array.isArray(ep.parameters) && ep.parameters.length > 0) {
  // Use schema
} else {
  // ❌ FALLBACK TO HEURISTICS
  console.log(`[Frontend] ⚠️ ${ep.handler}: No schema, using heuristic detection`);
  
  if (path.includes('/search')) {
    params.push('params?: Record<string, any>');  // ❌ GENERIC - LOSES TYPES
  }
}

// Generated function:
export async function searchProducts(
  params?: Record<string, any>
): Promise<any> {  // ❌ No type safety
  // ...
}
```

**Frontend Code Breaks**:
```typescript
import { searchProducts } from '@/lib/api';

// Cannot get type hints
const results = await searchProducts({ 
  category: 'electronics',
  minPrice: 100
});

// Results typed as 'any' - no autocomplete
results[0].title  // ❌ No type checking
results.forEach(r => r.invalid)  // ❌ Typo not caught

// What you wanted:
// searchProducts(params: { category?: string, minPrice?: number }): Promise<Products[]>
```

### The Solution

**Step 1: Validate Backend Schema** (in `backend/index.ts`)
```typescript
// AFTER line 650: Add validation

for (const endpoint of apiEndpoints) {
  if (!endpoint.parameters || endpoint.parameters.length === 0) {
    throw new Error(
      `Endpoint ${endpoint.handler} (${endpoint.method} ${endpoint.path}) ` +
      `has no parameters schema. Backend MUST generate complete schemas. ` +
      `This is required for type safety.`
    );
  }
  if (!endpoint.returns) {
    throw new Error(
      `Endpoint ${endpoint.handler} has no return type. ` +
      `Backend MUST specify returns type.`
    );
  }
}
```

**Step 2: Require Backends to Generate Complete Schemas**
```typescript
// In backend/index.ts buildBackendPrompt():
// Add to prompt:

\`\`\`
🚨 CRITICAL: Every endpoint MUST have:
1. Complete parameters schema with:
   - "name": parameter name
   - "type": TypeScript type
   - "required": boolean
   - "location": "path" | "query" | "body"
2. Returns type that matches collection types

❌ WRONG: handler: "searchProducts"
✅ CORRECT: 
{
  "handler": "searchProducts",
  "method": "GET",
  "path": "/api/products/search",
  "parameters": [
    { "name": "category", "type": "string", "required": false, "location": "query" },
    { "name": "minPrice", "type": "number", "required": false, "location": "query" }
  ],
  "returns": "Products[]"
}
\`\`\`
```

**Step 3: Generated Function** (with proper schema)
```typescript
// Backend provides complete schema:
const endpoint = {
  handler: "searchProducts",
  method: "GET",
  path: "/api/products/search",
  parameters: [
    { name: "category", type: "string", required: false, location: "query" },
    { name: "minPrice", type: "number", required: false, location: "query" }
  ],
  returns: "Products[]"
};

// api-client-generator generates:
export async function searchProducts(
  params?: { category?: string, minPrice?: number }
): Promise<Products[]> {  // ✓ FULL TYPE SAFETY
  // ...
}
```

**Step 4: Frontend Code Works**
```typescript
import { searchProducts, Products } from '@/lib/api';

// Now has autocomplete and type checking
const results = await searchProducts({ 
  category: 'electronics',
  minPrice: 100
});

// Type is Products[] - full autocomplete
results[0].title  // ✓ Type checked
results.forEach(r => r.invalid)  // ✓ Typo caught by TypeScript
```

---

## Example 5: Silent Error Handling

### The Problem

**Type Extraction** (in `type-extractor.ts`):
```typescript
export function extractTypeDefinitions(code: string): TypeDefinition[] {
  const definitions: TypeDefinition[] = [];

  try {
    // Regex extraction
    const interfacePattern = /export\s+interface\s+(\w+)\s*\{([^}]+)\}/g;
    
    let match;
    while ((match = interfacePattern.exec(code)) !== null) {
      // Extract...
      definitions.push({ ... });
    }

    console.log(`[TypeExtractor] Extracted ${definitions.length} type definitions`);
  } catch (error) {
    console.error('[TypeExtractor] Error extracting types:', error);
    return [];  // ❌ SILENT FAILURE - empty array returned!
  }

  return definitions;
}
```

**What Happens When Extraction Fails**:
```typescript
// Frontend code:
const types = extractTypeDefinitions(apiClientCode);
console.log(types.length);  // 0 (silently failed)

if (types.length > 0) {
  // Never entered because extraction failed silently
  console.log('Schema constraints enforced');
} else {
  // Silently skips - type safety lost
  console.log('No types extracted');
}

// Later: Deployment fails with confusing errors
```

### The Solution

**Step 1: Make Errors Loud** (in `type-extractor.ts`)
```typescript
// BEFORE (WRONG):
catch (error) {
  console.error('[TypeExtractor] Error extracting types:', error);
  return [];  // Silent - returns empty
}

// AFTER (CORRECT):
catch (error) {
  console.error('[TypeExtractor] ❌ CRITICAL ERROR extracting types:', error);
  console.error('[TypeExtractor] This will cause deployment failure!');
  throw error;  // Fail loudly
}
```

**Step 2: Handle at Call Site** (in `frontend/index.ts`)
```typescript
// BEFORE (WRONG):
const types = extractTypeDefinitions(apiClientCode);
if (types.length > 0) {
  // Never happens if extraction fails
}

// AFTER (CORRECT):
let types: TypeDefinition[] = [];
try {
  types = extractTypeDefinitions(apiClientCode);
  console.log(`[Frontend] ✅ Extracted ${types.length} types`);
} catch (error) {
  console.error('[Frontend] ❌ CRITICAL: Could not extract types');
  console.error('[Frontend] API client generation may have failed');
  throw error;  // Stop generation - don't continue with 0 types
}
```

---

## Example 6: Complete Type Flow With Fixes

### Before (BROKEN)

```typescript
// Step 1: Backend generates incomplete schema
{
  collections: [
    {
      name: "orders",
      fields: [
        { name: "items", type: "json" },           // ❌ Type will be any[]
        { name: "customer", type: "relation" },    // ❌ Type will be string
        { name: "receipt", type: "file" }          // ❌ Type will be string
      ]
    }
  ],
  apiEndpoints: [
    {
      handler: "getOrders",
      // ❌ Missing: parameters
      // ❌ Missing: returns
    }
  ]
}

// Step 2: Frontend generates wrong types
export interface Orders {
  items?: any[];        // ❌ WRONG - could be object
  customer?: string;    // ❌ WRONG - could be array
  receipt?: string;     // ❌ WRONG - could be array
}

export async function getOrders(): Promise<any> {  // ❌ WRONG
  // ...
}

// Step 3: Frontend code written against wrong types
const orders = await getOrders();
orders[0].items.forEach(item => {});  // ❌ items might not be array
orders[0].customer.forEach(id => {}); // ❌ customer might not be array

// Step 4: Build fails
// TS2345: Argument of type 'any[]' is not assignable to parameter of type 'never'
```

### After (FIXED)

```typescript
// Step 1: Backend validates and generates complete schema
if (!endpoint.parameters) {
  throw new Error(`Endpoint ${endpoint.handler} missing parameters schema`);
}
if (!endpoint.returns) {
  throw new Error(`Endpoint ${endpoint.handler} missing returns type`);
}

{
  collections: [
    {
      name: "orders",
      fields: [
        { name: "items", type: "json" },
        { name: "customer", type: "relation", options: { maxSelect: 1 } },
        { name: "receipt", type: "file", options: { maxFiles: 1 } }
      ]
    }
  ],
  apiEndpoints: [
    {
      handler: "getOrders",
      method: "GET",
      path: "/api/orders",
      parameters: [
        { name: "limit", type: "number", required: false, location: "query" }
      ],
      returns: "Orders[]"
    }
  ]
}

// Step 2: Frontend generates correct types
export interface Orders {
  items?: any;          // ✓ CORRECT - works for both
  customer?: string;    // ✓ CORRECT - one-to-one
  receipt?: string;     // ✓ CORRECT - single file
}

export async function getOrders(
  params?: { limit?: number }
): Promise<Orders[]> {  // ✓ CORRECT
  // ...
}

// Step 3: Frontend code works correctly
const orders = await getOrders({ limit: 10 });
orders.forEach(order => {
  const items = order.items;  // ✓ Any type - can use either way
  const customerId = order.customer;  // ✓ String - ID
  const receiptUrl = order.receipt;  // ✓ String - filename
});

// Step 4: Build succeeds
// ✓ No TypeScript errors
```

---

## TESTING CODE

### Unit Test: Type Mapping
```typescript
// File: lib/__tests__/type-mapping.test.ts

import { mapPocketBaseTypeToTS } from '../generation/type-mapper';

describe('PocketBase Type Mapping', () => {
  
  it('maps json field to any (not any[])', () => {
    const field = { type: 'json' };
    expect(mapPocketBaseTypeToTS(field)).toBe('any');
  });

  it('maps relation with maxSelect 1 to string', () => {
    const field = { 
      type: 'relation', 
      options: { maxSelect: 1 } 
    };
    expect(mapPocketBaseTypeToTS(field)).toBe('string');
  });

  it('maps relation with maxSelect > 1 to string[]', () => {
    const field = { 
      type: 'relation', 
      options: { maxSelect: 10 } 
    };
    expect(mapPocketBaseTypeToTS(field)).toBe('string[]');
  });

  it('maps file with maxFiles 1 to string', () => {
    const field = { 
      type: 'file', 
      options: { maxFiles: 1 } 
    };
    expect(mapPocketBaseTypeToTS(field)).toBe('string');
  });

  it('maps file with maxFiles > 1 to string[]', () => {
    const field = { 
      type: 'file', 
      options: { maxFiles: 5 } 
    };
    expect(mapPocketBaseTypeToTS(field)).toBe('string[]');
  });

  it('throws on unknown field type', () => {
    const field = { type: 'unknown_type' };
    expect(() => mapPocketBaseTypeToTS(field)).toThrow(
      'Unknown field type: unknown_type'
    );
  });
});
```

### Integration Test: Full Type Generation
```typescript
// File: lib/__tests__/api-generation.integration.test.ts

import { generateApiClient } from '../generation/api-client-generator';

describe('API Client Generation', () => {
  
  it('generates correct types for complex collections', () => {
    const collections = [
      {
        name: 'cartItems',
        fields: [
          { name: 'id', type: 'text', required: true },
          { name: 'product', type: 'relation', options: { maxSelect: 1 } },
          { name: 'tags', type: 'relation', options: { maxSelect: 10 } },
          { name: 'settings', type: 'json' },
          { name: 'image', type: 'file', options: { maxFiles: 1 } },
          { name: 'attachments', type: 'file', options: { maxFiles: 5 } }
        ]
      }
    ];

    const api = generateApiClient([], 'test-project', collections);

    // Verify correct type mappings
    expect(api).toContain('product?: string;');
    expect(api).toContain('tags?: string[];');
    expect(api).toContain('settings?: any;');
    expect(api).toContain('image?: string;');
    expect(api).toContain('attachments?: string[];');
  });

  it('validates schema before generation', () => {
    const endpoints = [
      {
        handler: 'getItems',
        method: 'GET',
        path: '/api/items'
        // Missing: parameters, returns
      }
    ];

    expect(() => {
      generateApiClient(endpoints, 'test-project', []);
    }).toThrow('missing parameters schema');
  });
});
```

---

## Deployment Checklist Script

```typescript
// File: scripts/validate-types-before-deploy.ts

import { validateBackendSchema } from '@/lib/validation/schema-validator';
import { mapPocketBaseTypeToTS } from '@/lib/generation/type-mapper';

async function validateTypesBeforeDeploy(projectId: string) {
  console.log('🔍 Validating type generation for deployment...\n');

  const errors: string[] = [];

  try {
    // 1. Get backend config
    const backendConfig = await getBackendConfig(projectId);
    
    // 2. Validate schema
    console.log('1️⃣  Validating backend schema...');
    const schemaErrors = validateBackendSchema(backendConfig);
    if (!schemaErrors.valid) {
      errors.push(...schemaErrors.errors.map(e => `❌ ${e}`));
    } else {
      console.log('   ✓ Schema valid\n');
    }

    // 3. Validate type mappings
    console.log('2️⃣  Validating type mappings...');
    for (const collection of backendConfig.collections || []) {
      for (const field of collection.fields || []) {
        try {
          const tsType = mapPocketBaseTypeToTS(field);
          console.log(`   ✓ ${field.name}: ${field.type} → ${tsType}`);
        } catch (e) {
          errors.push(`❌ ${collection.name}.${field.name}: ${(e as Error).message}`);
        }
      }
    }

    // 4. Generate and validate API client
    console.log('\n3️⃣  Generating API client...');
    const apiClient = generateApiClient(
      backendConfig.apiEndpoints,
      projectId,
      backendConfig.collections
    );
    
    // 5. Extract types
    console.log('4️⃣  Extracting types...');
    const types = extractTypeDefinitions(apiClient);
    console.log(`   ✓ Extracted ${types.length} types`);

    // 6. Validate extraction
    const expectedTypeCount = backendConfig.collections?.length || 0;
    if (types.length !== expectedTypeCount) {
      errors.push(
        `❌ Type count mismatch: expected ${expectedTypeCount}, got ${types.length}`
      );
    }

  } catch (e) {
    errors.push(`❌ CRITICAL ERROR: ${(e as Error).message}`);
  }

  // Report results
  console.log('\n' + '='.repeat(50));
  if (errors.length === 0) {
    console.log('✅ All validations passed - safe to deploy\n');
    return true;
  } else {
    console.log(`❌ ${errors.length} validation error(s):\n`);
    errors.forEach(e => console.log(`  ${e}`));
    console.log('\nDeploy is NOT safe. Fix errors above.\n');
    return false;
  }
}
```

