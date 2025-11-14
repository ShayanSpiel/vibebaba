# PM Node Phasing Fix - Complete

## Summary
Fixed the PM node to properly phase features and merge infrastructure features into the main dataset.

## Issues Fixed

### 1. **Wrong Phasing Logic**
- **Before**: Used AI's `priority` field (all features marked as high → all built at once)
- **After**: Smart phasing based on "Homepage + 1 Main Business Feature = Phase 1"

### 2. **Infrastructure Features Separated**
- **Before**: Infrastructure features in separate `infrastructureFeatures[]` array
- **After**: All features (regular + infrastructure) merged into `allRequestedFeatures[]`

### 3. **Infrastructure Features Invisible**
- **Before**: Generated but never shown to user (useless)
- **After**: Visible in `allRequestedFeatures` with `classification='infrastructure'`

## Changes Made

### File: `lib/langgraph/prompts/feature-plan.ts`

**Updated `FEATURE_EXTRACTION_RULES`:**
- Changed from "extract 1-3 features" → "extract ALL features"
- Removed MVP limit instructions
- Added note: "Phasing will be done automatically by the system"
- Updated examples to show all features being extracted

### File: `lib/langgraph/nodes/pm/index.ts`

**1. Removed Infrastructure Separation (Lines 190-215)**
```typescript
// Before: Separated features and infrastructure into different arrays
// After: All features go into single array with classification field
```

**2. Updated Infrastructure Suggestions (Lines 217-291)**
```typescript
// Before: Created minimal objects in separate array
// After: Created full feature objects and added to main features array
```

**3. Implemented Smart Phasing (Lines 336-388)**
```typescript
// Before: phase = f.priority === 'high' ? 1 : 2
// After: Smart detection:
//   - Find homepage feature (has route "/")
//   - Find main business feature (first high-priority regular with backend)
//   - Only those 2 = Phase 1, everything else = Phase 2
```

**4. Enhanced Logging (Lines 390-421)**
```typescript
// Before: Simple list of features
// After: Detailed breakdown:
//   - Phase 1: Building Now (with routes)
//   - Phase 2: Queued for Later
//     - Regular Features
//     - Infrastructure Features (with "suggested" tag)
```

**5. Removed Redundant Prompt Rules (Lines 143-154)**
```typescript
// Before: Long MVP rules trying to force AI to limit features
// After: Simple reminder to extract all features
```

**6. Updated Return Statement (Line 587)**
```typescript
// Before: Returned both allRequestedFeatures and infrastructureFeatures
// After: Only allRequestedFeatures (includes infrastructure with classification tag)
```

## Data Structure Changes

### Before:
```typescript
{
  allRequestedFeatures: [
    { name: "Products", classification: "regular", ... },
    { name: "Cart", classification: "regular", ... }
  ],
  infrastructureFeatures: [
    { name: "Auth", suggested: true },
    { name: "Payments", suggested: true }
  ]
}
```

### After:
```typescript
{
  allRequestedFeatures: [
    { name: "Products", classification: "regular", phase: 1, included_in_mvp: true, ... },
    { name: "Cart", classification: "regular", phase: 1, included_in_mvp: true, ... },
    { name: "Checkout", classification: "regular", phase: 2, included_in_mvp: false, ... },
    { name: "Auth", classification: "infrastructure", phase: 2, included_in_mvp: false, suggested: true, ... },
    { name: "Payments", classification: "infrastructure", phase: 2, included_in_mvp: false, suggested: true, ... }
  ]
}
```

## How It Works Now

### Example: "E-commerce site with products, cart, checkout, and search"

**1. AI Extraction:**
```
- Product Catalog (regular, high, backend)
- Shopping Cart (regular, high, backend)
- Checkout Flow (regular, medium, backend)
- Product Search (regular, low, no backend)
+ User Authentication (infrastructure, medium, backend) [suggested]
+ Payment Integration (infrastructure, medium, backend) [suggested]
```

**2. Smart Phasing:**
```
Homepage Feature: Product Catalog (has route "/")
Primary Feature: Shopping Cart (first high-priority regular with backend)

Phase 1 (Building Now):
  ✅ Product Catalog
  ✅ Shopping Cart

Phase 2 (Queued for Later):
  Regular:
    ⏳ Checkout Flow
    ⏳ Product Search
  Infrastructure:
    ⏳ User Authentication (suggested)
    ⏳ Payment Integration (suggested)
```

**3. Backend Generation:**
```
Collections generated: 2
  → products (from Product Catalog)
  → cart (from Shopping Cart)
```

**4. Frontend Generation:**
```
Routes generated: 3
  → / (Product Catalog homepage)
  → /products/[id] (Product details)
  → /cart (Shopping cart)
```

**5. UI Display:**
```
Built Features:
  - Product Catalog ✅
  - Shopping Cart ✅

Queued Features:
  - Checkout Flow ⏳
  - Product Search ⏳
  - User Authentication ⏳ (suggested)
  - Payment Integration ⏳ (suggested)
```

## Benefits

1. **Proper MVP Phasing**: Only Homepage + 1 main feature built initially (1-2 pages max)
2. **All Features Tracked**: Infrastructure and regular features both in `allRequestedFeatures`
3. **Infrastructure Visible**: Users can see suggested features and add them later
4. **Clear Phase 2**: Users know exactly what's queued for future development
5. **Smart Detection**: Automatically identifies homepage and main business feature
6. **Better UX**: Phase 2 features shown with tags (regular vs infrastructure, suggested vs requested)

## Test Results

Test case: E-commerce with products, cart, checkout + suggested auth & payments

✅ Phase 1: 2 features (Product Catalog, Shopping Cart)
✅ Phase 2: 3 features (Checkout, Auth, Payments)
✅ Backend: 2 collections generated
✅ Frontend: 3 routes generated
✅ All infrastructure features visible in dataset
✅ Suggested features properly tagged

## Next Steps for UI

The backend now properly returns all features with phasing. To display them in the UI:

1. **Project Page** (`app/project/[id]/page.tsx`):
   - Show Phase 1 features as "Built"
   - Show Phase 2 features as "Queued"
   - Tag infrastructure features
   - Show "suggested" badge

2. **Chat Panel** (`components/project/ChatPanelClaude.tsx`):
   - Add buttons to build Phase 2 features
   - Allow users to accept/reject suggested infrastructure
   - Show feature dependencies

3. **Feature List Component** (new):
   - Display all features from `allRequestedFeatures`
   - Filter by `phase`, `classification`, `suggested`
   - Allow reordering and custom phasing
