# Relational Data & Foreign Key Documentation - Complete Reference

This document summarizes all existing prompts, documentation, and guidance about handling relational data in the codebase. This covers how the system handles CartItems.product (a string ID) vs direct Product access.

---

## Executive Summary

The codebase has **comprehensive documentation and prompts for handling relational data**, but it is **distributed across multiple files**. The system explicitly explains:

1. **Default approach:** Use relation fields (normalized data)
2. **Frontend responsibility:** Fetch and join multiple collections
3. **PocketBase expand parameter:** Used in API routes to automatically populate related data
4. **Type safety:** Relations are typed as `string` (the ID), not the full object

---

## 1. Backend Prompt Documentation (Where Relations Are Defined)

**File:** `/Users/shayan/Desktop/Projects/VB/lib/langgraph/nodes/backend/index.ts` (Lines 330-360)

### Two Options for Relational Data

The backend node explicitly documents TWO approaches when a feature needs data from multiple collections:

#### Option 1: USE RELATION FIELDS (Default - Recommended)

```markdown
🔗 USE RELATION FIELDS (Default approach):
Create a "relation" type field that references another collection:
Example: cartItems collection with relation to products

{
  "name": "cartItems",
  "fields": [
    { "name": "product", "type": "relation", "required": true },  ← Points to products collection
    { "name": "quantity", "type": "number", "required": true },
    { "name": "userId", "type": "text", "required": true }
  ]
}

✅ Pros: Clean normalized schema, no data duplication
⚠️ Note: Frontend must fetch both collections and join in code
```

**When to use:** Standard case, when you want normalized data structure.

#### Option 2: DENORMALIZATION (Only When Explicitly Requested)

```markdown
📋 OPTIONAL DENORMALIZATION (Only when explicitly mentioned):
If user specifically asks to "store price with cart item" or "avoid extra lookups":

{
  "name": "cartItems",
  "fields": [
    { "name": "product", "type": "relation", "required": true },
    { "name": "productName", "type": "text" },     ← Denormalized from products
    { "name": "productPrice", "type": "number" },  ← Denormalized from products
    { "name": "quantity", "type": "number" }
  ]
}

✅ Pros: Simpler frontend queries, no joins needed
❌ Cons: Data duplication, must sync updates
```

**When to use:** Only when user explicitly requests it.

#### The Default Rule

```markdown
🎯 DEFAULT RULE: Use relation fields (first option) unless explicitly told otherwise.
```

---

## 2. Frontend Type Safety Documentation

**File:** `/Users/shayan/Desktop/Projects/VB/lib/langgraph/nodes/frontend/index.ts` (Lines 830-836)

The frontend prompt explicitly warns about the relational data issue with concrete examples:

### CartItems Type Structure

```markdown
❌ WRONG: getCartItems().map(item => item.price)
   → Type shows CartItems: { id: string, productId: string, quantity: number }
   → "price" property does NOT exist - TypeScript error!

✅ CORRECT: getCartItems().map(item => item.quantity * getProductPrice(item.productId))
```

This shows that:
1. CartItems has `productId` field (a string, the relation ID)
2. Price is NOT on CartItems - it's in Products collection
3. Frontend must either fetch both or access only what exists on the type

---

## 3. API Client Type Generation

**File:** `/Users/shayan/Desktop/Projects/VB/lib/langgraph/nodes/frontend/generators/api-client-generator.ts` (Lines 45-46)

How relation fields are converted to TypeScript types:

```typescript
case 'relation':
  tsType = 'string'; // Relation ID
  break;
```

**Key point:** The relation field is typed as `string`, not as the target collection type.

This means:
```typescript
export interface CartItems {
  id?: string;
  product?: string;      // ← This is just an ID string!
  quantity?: number;
  userId?: string;
}

export interface Products {
  id?: string;
  name?: string;
  price?: number;        // ← Price exists HERE, not in CartItems
  image?: string;
}
```

---

## 4. Real-World Usage: PocketBase expand Parameter

**File:** `/Users/shayan/Desktop/Projects/VB/app/api/admin/payments/route.ts` (Lines 11-19)

The codebase DOES use PocketBase's `expand` parameter in real API routes:

```typescript
// Get all transactions with user email
const transactionsResult = await pb.collection('transactions').getList(1, 500, {
  sort: '-created',
  expand: 'userId',  // ← PocketBase automatically populates the related user data
});

// Then access the expanded data:
const transactions = transactionsResult.items.map((tx: any) => ({
  id: tx.id,
  userId: tx.userId,
  email: tx.expand?.userId?.email || '',  // ← Access related data through expand
  type: tx.type,
  amount: tx.amount,
  // ...
}));
```

### What This Shows

1. **PocketBase has an `expand` parameter** that automatically populates relations
2. **Expanded data is accessed via `expand?.relationName?.field`**
3. **The relation ID still exists** in the main object (userId)
4. **Optional chaining is needed** (`expand?.`) in case expand fails

---

## 5. Backend Integration Rules

**File:** `/Users/shayan/Desktop/Projects/VB/lib/langgraph/prompts/backend-integration.ts` (Lines 76-177)

### API Contract Schema

The backend integration rules define how endpoints work:

```typescript
export const API_CONTRACT_SCHEMA = `
OBJECTIVE: Backend exports complete endpoint schemas with full type information

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
```

**Current Status:** The schema does NOT include metadata about which parameters relate to other collections. This is a known gap.

---

## 6. Comprehensive Problem Analysis

**File:** `/Users/shayan/Desktop/Projects/VB/INVESTIGATION_RELATIONAL_DATA_PROBLEM.md`

A complete investigation document exists that covers:

### The Issue
```markdown
The "price does not exist on CartItems" error is caused by a fundamental 
schema/type mismatch between how the backend defines collections and how 
the frontend AI understands data access patterns.

System generates:
- CartItems { product: string (relation ID) }
- Products { id: string, name: string, price: number }

But AI code tries to access:
- cartItem.price ← This doesn't exist!
```

### Root Causes (4 identified)

1. **No Relation Type Interpretation**
   - File: `api-client-generator.ts` Line 46
   - Issue: Converts `type: "relation"` to `string` without tracking what it relates to

2. **No Dependency Chain Detection**
   - File: `frontend/index.ts` Lines 1165-1167
   - Issue: Frontend lists required collections but doesn't detect which OTHER collections they depend on through relations

3. **No Relation Documentation in Prompt**
   - File: `frontend/index.ts` Lines 1546-1558
   - Issue: AI prompt doesn't explain how to handle relations or that it needs to fetch/join multiple collections

4. **No Denormalization Rules in Backend Prompt**
   - File: `backend/index.ts` Lines 318-329
   - Issue: Backend doesn't have clear rules for when to create relations vs. when to denormalize fields

### Proposed Fixes

The document provides detailed fixes for each file:
1. Add relation metadata to backend schema
2. Track relation metadata in API client generator
3. Auto-detect dependent collections in frontend
4. Add relation documentation to frontend prompt

---

## 7. Complete Data Flow (How It Should Work)

### Current Broken Flow
```
1. Backend AI generates schema:
   CartItems { product: string (relation), quantity: number }
   Products { id: string, name: string, price: number }

2. API client generator sees "relation" type → creates "string" type:
   interface CartItems { product: string; quantity: number; }
   interface Products { price: number; ... }

3. Frontend AI reads collection mapping:
   "Cart page needs: cartItems"
   (Doesn't know about products dependency!)
   
4. Frontend AI generates code:
   const items = await getCartItems();
   items.map(item => (
     <div>{item.quantity} × ${item.price}</div>  ❌ FAIL: price doesn't exist!
   ))
```

### The Correct Flow (What Should Happen)

**Option A: Manual Fetch & Join**
```typescript
const items = await getCartItems();
const products = await getProducts();
const itemsWithProducts = items.map(item => ({
  ...item,
  product: products.find(p => p.id === item.product)
}));

itemsWithProducts.map(item => (
  <div>{item.quantity} × ${item.product.price}</div>  ✅ CORRECT!
))
```

**Option B: API Expansion (PocketBase)**
```typescript
// Backend API uses expand parameter:
const items = await pb.collection('cartItems').getList(1, 50, {
  expand: 'product'  // ← Automatically fetch related products
});

// Frontend receives already expanded data:
items.map(item => (
  <div>
    {item.quantity} × ${item.expand?.product?.price}  ✅ CORRECT!
  </div>
))
```

---

## 8. When to Use Which Approach

### Use Option 1 (Relation Fields - Current Default)

```markdown
✅ Use when:
- Data is normalized (no duplication)
- You have control over both collections
- Frontend can handle fetching/joining
- Consistency is more important than convenience

Example: CartItems.product → Products
- Don't duplicate product data
- Frontend fetches both collections
- Maintains single source of truth
```

### Use Option 2 (Denormalized Fields)

```markdown
✅ Use when:
- User explicitly requests it
- Performance is critical
- Related data rarely changes (e.g., capture price at purchase time)
- You want simpler frontend code

Example: CartItems.productPrice (denormalized copy)
- Frontend code is simpler: item.productPrice works directly
- But risks data inconsistency if product price changes
```

### Use Option 3 (API Expansion with PocketBase)

```markdown
✅ Use when:
- PocketBase native features can do the work
- You control the API layer
- Want to avoid frontend complexity
- N+1 queries aren't a concern

Implementation:
- Add expand parameter to PocketBase API call
- Backend returns expanded relations
- Frontend accesses via expand?.relationName?.field
```

---

## 9. Implementation Guidance for Each Scenario

### Scenario 1: CartItems + Products (E-Commerce)

**Current Code (Relation Field):**
```typescript
// Backend schema:
cartItems { product: "relation→products", quantity: number }
products { id, name, price, image }

// Frontend must:
const items = await getCartItems();
const products = await getProducts();
const displayData = items.map(item => ({
  ...item,
  productDetails: products.find(p => p.id === item.product)
}));

// Then use:
displayData.map(item => (
  <CartItemRow
    name={item.productDetails.name}
    price={item.productDetails.price}
    quantity={item.quantity}
    total={item.quantity * item.productDetails.price}
  />
))
```

**Better Approach (Denormalized):**
```typescript
// Backend schema (if denormalized):
cartItems {
  product: "relation→products",
  productName: string,
  productPrice: number,
  quantity: number
}

// Frontend becomes simpler:
const items = await getCartItems();
items.map(item => (
  <CartItemRow
    name={item.productName}
    price={item.productPrice}
    quantity={item.quantity}
    total={item.quantity * item.productPrice}
  />
))
```

---

## 10. Summary of Existing Documentation

| Aspect | Location | Key Point |
|--------|----------|-----------|
| **Backend Relations** | `backend/index.ts` lines 330-360 | Defines Option 1 (relations) vs Option 2 (denormalization); recommends Option 1 by default |
| **Type Safety Warning** | `frontend/index.ts` lines 830-836 | Shows that `cartItem.price` is wrong because CartItems type doesn't have price field |
| **Type Generation** | `api-client-generator.ts` line 46 | Relations are typed as `string`, not the full object type |
| **Real-World PocketBase Usage** | `admin/payments/route.ts` lines 11-19 | Shows how to use `expand: 'userId'` to populate relations |
| **API Contract** | `backend-integration.ts` lines 76-177 | Defines endpoint schemas but doesn't include relation metadata |
| **Detailed Analysis** | `INVESTIGATION_RELATIONAL_DATA_PROBLEM.md` | Complete root cause analysis and proposed fixes |

---

## 11. What's Missing (Opportunities)

### Not Documented
1. **Automatic expand parameter generation** - Backend could generate endpoints with expand built-in
2. **Relation metadata in schemas** - Backend could specify relationTo fields explicitly
3. **Frontend dependency detection** - Frontend could auto-detect and include dependent collections
4. **Query hints in prompts** - AI prompts could include relation joining examples

### Recommendations for Improvement

1. **Add to Backend Prompt:**
```markdown
WHEN YOU CREATE RELATION FIELDS:
- Specify relationTo: "targetCollection" in field metadata
- Consider if expand should be automatic or optional
- Document which fields from related collection will be accessed
```

2. **Add to Frontend Prompt:**
```markdown
HANDLING RELATIONS:
When a collection has relation fields (e.g., product: string):
1. Identify all relation fields in the collection type
2. Fetch both primary and related collections
3. Join them by ID in code using .map() and .find()
4. Or: Pass relation IDs to separate lookup functions

Example: 
const items = getCartItems();
const products = getProducts();
items.forEach(item => {
  const product = products.find(p => p.id === item.product);
  console.log(item.quantity, 'x', product.price);
});
```

3. **Add Relation Metadata to API Client Generator:**
```typescript
case 'relation':
  // Track the target collection for better type hints
  const relationTarget = field.relationTarget || 'unknown';
  tsType = `string`; // Always string for the ID
  // Could also generate: string | ${relationTarget} for expanded
  break;
```

---

## 12. Concrete Example: Products in Cart

### What Currently Happens

**Backend generates:**
```json
{
  "name": "cartItems",
  "fields": [
    { "name": "id", "type": "text", "required": true },
    { "name": "product", "type": "relation", "required": true },
    { "name": "quantity", "type": "number", "required": true },
    { "name": "userId", "type": "text", "required": true }
  ]
},
{
  "name": "products",
  "fields": [
    { "name": "id", "type": "text", "required": true },
    { "name": "name", "type": "text", "required": true },
    { "name": "price", "type": "number", "required": true },
    { "name": "image", "type": "text", "required": false }
  ]
}
```

**Frontend type generator creates:**
```typescript
export interface CartItems {
  id?: string;
  product?: string;      // ← String ID, not Product object
  quantity?: number;
  userId?: string;
}

export interface Products {
  id?: string;
  name?: string;
  price?: number;
  image?: string;
}
```

**Frontend AI reads this and might generate (WRONG):**
```typescript
const items = await getCartItems();
return items.map(item => (
  <div>
    {item.quantity} x ${item.price}  {/* ERROR: price doesn't exist on CartItems! */}
  </div>
))
```

**Correct Frontend Should Be:**
```typescript
const items = await getCartItems();
const products = await getProducts();

return items.map(item => {
  const product = products.find(p => p.id === item.product);
  return (
    <div>
      {item.quantity} x ${product?.price}  {/* Correct: price from Products */}
    </div>
  )
})
```

### Why This Documentation Matters

The system **ALREADY HAS**:
- Clear rules about when to use relations vs denormalization
- Examples of the correct and incorrect approach
- Real-world code showing how to use PocketBase expand
- Type definitions that correctly show relations as strings

What's needed:
- Frontend AI needs to understand these rules
- Frontend AI needs examples of the correct pattern
- System needs to auto-detect relation dependencies
- Prompts need to emphasize this in critical sections

---

## Files to Reference When Building Features

1. **For Backend Relation Rules:** `/lib/langgraph/nodes/backend/index.ts` lines 330-360
2. **For Frontend Type Safety:** `/lib/langgraph/nodes/frontend/index.ts` lines 830-836
3. **For PocketBase Examples:** `/app/api/admin/payments/route.ts`
4. **For Complete Analysis:** `/INVESTIGATION_RELATIONAL_DATA_PROBLEM.md`
5. **For API Contract:** `/lib/langgraph/prompts/backend-integration.ts`

---

## Key Takeaways

1. **Default:** Use relation fields (normalized) unless user asks for denormalization
2. **Type Safety:** Relation fields are `string`, not the full object type
3. **Frontend Responsibility:** Must fetch and join multiple collections OR use API expand
4. **PocketBase Support:** `expand` parameter automatically populates relations
5. **Documentation Exists:** Rules are documented in prompts but scattered across files
6. **Gap:** System doesn't auto-detect relation dependencies yet

