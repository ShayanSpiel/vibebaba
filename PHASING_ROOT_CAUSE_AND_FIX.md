# PM Node Phasing - Root Cause Analysis & Fix Plan

## Current Problems

### 1. **Weak MVP Phasing Logic** (lib/langgraph/nodes/pm/index.ts:328-376)

**Current Logic (Lines 334-376):**
```typescript
// Find homepage feature (has route "/")
const homepageFeature = allFeaturesList.find(f =>
  f.routes?.some((r: any) => r.path === '/')
);

// Find main business feature (first regular feature with backend, excluding homepage)
const mainBusinessFeature = allFeaturesList.find(f =>
  f.classification === 'regular' &&
  f.backend_required &&
  f.id !== homepageFeature?.id &&
  f.userRequested // User explicitly requested (not suggested)
);
```

**Problem:** This blindly picks:
- Landing page (because it has route "/")
- Registration page (first backend feature)

**For CultStack Example:**
- ✅ Landing Page → Phase 1
- ✅ Registration Page → Phase 1
- ❌ Dashboard → Phase 2 (WRONG! User can't do anything after registering)
- ❌ Profile Page → Phase 2 (User data management)
- ❌ Collaboration Requests → Phase 2 (Core functionality)

**What Should Happen:**
- Phase 1: Landing → Register → Dashboard (with basic collab cards) → Profile basics
- Phase 2: Advanced features (Sticky Notes, Social Media, Donation, Admin)

### 2. **No Context-Aware Prioritization**

The phasing system doesn't understand:
- **User flow**: Landing → Action → Result
- **Core value proposition**: What makes the app useful?
- **Feature dependencies**: Can't use Profile without Dashboard

**CultStack Core Value:**
> "Find writers to collaborate with"

This means:
- Users MUST see collaboration requests (Dashboard)
- Users MUST be able to create their own request
- Therefore: Dashboard is CORE, not secondary

### 3. **Backend Dependency Detection is Incomplete**

**Current Code (Lines 191, 196, 203):**
```typescript
dependencies: [], // Will be assigned by backend node based on collection relationships
backend_required: item.backend_required || false,
```

**Problems:**
1. Dependencies are NEVER populated (comment says "Will be assigned by backend node" but backend node doesn't do this)
2. Backend dependencies are not used for phasing
3. No UI shows which features depend on backend

### 4. **Infrastructure Features Incorrectly Suggested**

**Lines 213-281:** Auto-suggests Auth, Payments, Admin Panel

For CultStack:
- ✅ User Authentication: YES (has user accounts)
- ❌ Payment Integration: NO (donation is crypto wallets, not Stripe)
- ❌ Admin Panel: NO (not mentioned by user)

**Problem:** Keyword matching is too aggressive

## Fixes Required

### Fix 1: Smart MVP Phasing Algorithm

**New Algorithm:**
1. **Analyze user flow** from user description
2. **Identify core value proposition**
3. **Build minimum viable flow**: Entry → Core Action → Result
4. **Phase 1** = Minimum flow to deliver value
5. **Phase 2** = Enhancements and infrastructure

**For CultStack:**
```
Core Flow:
1. See landing page explaining the value
2. Register account
3. View collaboration requests (CORE VALUE)
4. Create own collaboration request
5. Edit profile to add details

Phase 1: Landing, Register, Dashboard (with collab), Profile (basic)
Phase 2: Sticky Notes, Social Media Links, Donation, Advanced features
```

### Fix 2: Backend Dependency Tracking

**Add to PM Node after feature extraction:**
```typescript
// After all features extracted, detect dependencies
features.forEach(feature => {
  feature.dependencies = detectDependencies(feature, allFeatures);
});

function detectDependencies(feature, allFeatures) {
  const deps = [];

  // If feature needs user data, depends on auth
  if (feature.backend_required && needsUserContext(feature)) {
    const auth = allFeatures.find(f => f.id.includes('auth'));
    if (auth) deps.push(auth.id);
  }

  // If feature references other collections
  // E.g., "Orders" depends on "Products" and "Users"
  // This will be populated by backend node after schema generation

  return deps;
}
```

### Fix 3: Context-Aware Feature Classification

**Improve infrastructure detection (Lines 213-281):**

```typescript
// Suggest Auth ONLY if explicit user management mentioned
const needsAuth = features.some(f =>
  /login|signup|register|account|profile|dashboard/i.test(f.name)
) && !features.some(f => /auth/i.test(f.name));

// Suggest Payments ONLY if payment processing mentioned
const needsPayments = features.some(f =>
  /stripe|paypal|checkout|payment processing|subscription/i.test(f.description)
) && !features.some(f => /payment/i.test(f.name));

// Suggest Admin ONLY if content management + user roles mentioned
const needsAdmin = (
  features.some(f => /admin|moderate|manage users|cms/i.test(f.description)) ||
  (features.some(f => /post|product|content/i.test(f.name)) &&
   features.some(f => /user role|permission|moderation/i.test(f.description)))
) && !features.some(f => /admin/i.test(f.name));
```

### Fix 4: UI to Show Dependencies

**Add to ChatPanelClaude.tsx or create FeaturePhaseView component:**

```tsx
<div className="feature-phases">
  <h3>Phase 1 (Building Now)</h3>
  {phase1Features.map(feature => (
    <FeatureCard
      key={feature.id}
      feature={feature}
      showDependencies={true}
    />
  ))}

  <h3>Phase 2 (Queued)</h3>
  {phase2Features.map(feature => (
    <FeatureCard
      key={feature.id}
      feature={feature}
      showDependencies={true}
      disabled={hasUnmetDependencies(feature)}
    />
  ))}
</div>

function FeatureCard({ feature, showDependencies, disabled }) {
  return (
    <div className={`feature-card ${disabled ? 'disabled' : ''}`}>
      <h4>{feature.name}</h4>
      <p>{feature.description}</p>

      {feature.backend_required && (
        <Badge>Requires Backend</Badge>
      )}

      {showDependencies && feature.dependencies?.length > 0 && (
        <div className="dependencies">
          <span>Depends on:</span>
          {feature.dependencies.map(depId => {
            const dep = allFeatures.find(f => f.id === depId);
            return <Badge key={depId}>{dep?.name}</Badge>
          })}
        </div>
      )}

      <Button disabled={disabled}>
        {disabled ? 'Build Dependencies First' : 'Add to Build'}
      </Button>
    </div>
  );
}
```

## Implementation Steps

1. ✅ [COMPLETED] Investigate PM node phasing logic
2. 🔄 [IN PROGRESS] Fix feature prioritization algorithm
3. ⏳ [PENDING] Implement backend dependency detection
4. ⏳ [PENDING] Fix infrastructure feature suggestions
5. ⏳ [PENDING] Add dependency UI
6. ⏳ [PENDING] Test with CultStack example
