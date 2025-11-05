# Design System Guide for App Generation

## Overview
This guide explains how to safely add, modify, and maintain components in the design system catalog for AI-generated applications. Follow these guidelines to ensure deployment compatibility and maintain quality.

---

## 1. Understanding the Architecture

### Core Files
- **`lib/component-catalog.ts`**: Main catalog (~2,140 tokens) - AI reads this to generate components
- **`lib/langgraph/nodes/frontend-node.ts`**: Frontend generation logic, globals.css template, prompts
- **`lib/langgraph/nodes/ux-node.ts`**: Color extraction, validation, and theme logic

### Token Budget Management
- **Target per file**: 1000-1200 tokens for generated app files
- **Current catalog size**: ~2,140 tokens (optimal balance)
- **Rule of thumb**: Add new patterns only if they provide high impact for ≤100 tokens

---

## 2. How to Add Components to the Catalog

### Step-by-Step Process

#### Step 1: Read the Current Catalog
```bash
# Always read the file first to understand the structure
Read lib/component-catalog.ts
```

#### Step 2: Choose the Right Section
Add your component to the appropriate category:
- **TYPOGRAPHY**: h1-h6, text utilities
- **BUTTONS**: btn variants, sizes, states
- **SPACING**: margins, padding, gaps
- **ICONS**: Icon library, sizes, colors
- **FORMS**: inputs, labels, validation, backend integration
- **CARDS**: layouts, hover effects, gradients
- **LOGO**: logo variations and sizes
- **ANIMATIONS**: keyframes, delays, hover effects
- **LOADING**: spinners, skeletons, button states
- **DRAG & DROP**: sortable lists, file uploads
- **NOTIFICATIONS**: toasts, alerts, badges
- **EMPTY STATES**: no results, onboarding
- **AVATARS**: initials, images, groups
- **TABS**: navigation, content switching
- **PAGINATION**: page navigation
- **DASHBOARD CHARTS**: data visualization

#### Step 3: Follow the Pattern Structure

**Good Example** (concise, clear, practical):
```typescript
// STAT CARD (metrics, dashboards):
// <div className="card card-padding">
//   <div className="flex items-center justify-between mb-2">
//     <p className="text-sm text-muted-foreground">Total Users</p>
//     <TrendingUp className="h-4 w-4 text-success" />
//   </div>
//   <p className="text-3xl font-bold mb-1">12,543</p>
//   <p className="text-xs text-success flex items-center gap-1">
//     <ArrowUp className="h-3 w-3" />
//     12% from last month
//   </p>
// </div>
```

**Bad Example** (too verbose, redundant):
```typescript
// STAT CARD
// This is a card component that shows statistics
// You can use it for dashboards and metrics
// It includes an icon and trending indicator
// Here's how to use it:
// <div>...</div>
```

#### Step 4: Use Edit Tool for Safe Updates
```typescript
// Find a unique section to insert after
Edit lib/component-catalog.ts

// Example insertion point
old_string: "// === PAGINATION PATTERNS ===\n\n// Your existing code..."
new_string: "// === PAGINATION PATTERNS ===\n\n// SIMPLE PAGINATION:\n// Your new pattern...\n\n// Your existing code..."
```

#### Step 5: Test Token Impact
- Read the file after changes
- Estimate token count (rough guide: 4 characters ≈ 1 token)
- Keep catalog under 2,500 tokens total

---

## 3. Component Pattern Best Practices

### ✅ DO:
1. **Use semantic color tokens**:
   ```jsx
   className="bg-primary text-primary-foreground"
   className="text-muted-foreground"
   className="border-border"
   ```

2. **Include state management for backend components**:
   ```jsx
   const [loading, setLoading] = useState(false)
   const [error, setError] = useState('')
   ```

3. **Show loading states for API calls**:
   ```jsx
   <button disabled={loading}>
     {loading ? (
       <><Loader2 className="h-4 w-4 animate-spin mr-2" />Loading...</>
     ) : 'Submit'}
   </button>
   ```

4. **Use lucide-react icons consistently**:
   ```jsx
   import { Mail, Search, Check, X } from 'lucide-react'
   ```

5. **Provide complete, copy-paste ready examples**:
   - Include all necessary state hooks
   - Show proper icon imports
   - Include className utilities

### ❌ DON'T:
1. **Don't use arbitrary values** unless absolutely necessary:
   ```jsx
   // Bad
   className="w-[342px] h-[89px]"

   // Good
   className="w-80 h-20"
   ```

2. **Don't add patterns without state management** for backend:
   ```jsx
   // Bad - no loading state
   <button onClick={handleSubmit}>Submit</button>

   // Good - with loading state
   <button onClick={handleSubmit} disabled={loading}>
     {loading ? <Loader2 className="animate-spin" /> : 'Submit'}
   </button>
   ```

3. **Don't break existing utility classes**:
   - Never modify `btn`, `card`, `input` base classes
   - Only add new variants: `btn-gradient`, `card-stat`

4. **Don't add framework-specific code**:
   ```jsx
   // Bad - Next.js specific
   import Image from 'next/image'

   // Good - standard HTML
   <img src="..." className="..." />
   ```

---

## 4. Color System Guidelines

### Background Layers (Critical!)
```css
background           → Main page background (#ffffff / #0a0a0a)
backgroundSecondary  → Cards, panels (#f9fafb / #1a1a1a)
backgroundTertiary   → Nested cards, hover states (#f3f4f6 / #2a2a2a)
```

### Semantic Colors
```css
primary              → Brand color, CTAs, links
secondary            → Supporting brand color
accent               → Highlights, badges
success              → Confirmations, positive states
destructive          → Errors, warnings, delete actions
muted                → Disabled states, secondary text
muted-foreground     → Helper text, descriptions
border               → Dividers, card borders
```

### Usage Examples
```jsx
// ✅ Correct - semantic usage
<div className="bg-background text-foreground">
  <div className="card bg-backgroundSecondary">
    <p className="text-muted-foreground">Helper text</p>
    <button className="bg-primary text-primary-foreground">CTA</button>
  </div>
</div>

// ❌ Wrong - using primary as background
<div className="bg-primary">Content</div>
```

---

## 5. Testing Checklist Before Deployment

### Pre-commit Checks
- [ ] Read `lib/component-catalog.ts` to verify changes
- [ ] Check token count (keep under 2,500 tokens)
- [ ] Verify no TypeScript errors: `npx tsc --noEmit`
- [ ] Test build: `npm run build`
- [ ] Check git status for unintended changes

### Component Quality Checks
- [ ] Uses semantic color tokens (not hardcoded colors)
- [ ] Includes state management for backend interactions
- [ ] Has loading states for async operations
- [ ] Uses lucide-react icons consistently
- [ ] Follows responsive design (mobile-first)
- [ ] Includes accessibility attributes (aria-*)
- [ ] Has proper TypeScript types

### Pattern Completeness
- [ ] Includes all necessary imports
- [ ] Shows complete state hooks
- [ ] Has error handling example
- [ ] Demonstrates proper icon usage
- [ ] Includes responsive utilities

---

## 6. Common Pitfalls to Avoid

### Pitfall 1: Breaking Existing Classes
**Problem**: Modifying base utility classes
```jsx
// ❌ Don't change existing classes
.btn { padding: 1rem; } // This breaks all existing buttons
```

**Solution**: Add new variants instead
```jsx
// ✅ Add new variants
.btn-lg { padding: 1rem; }
```

### Pitfall 2: Missing Loading States
**Problem**: Forms without loading feedback
```jsx
// ❌ No loading state
<button onClick={submitForm}>Submit</button>
```

**Solution**: Always include loading state for API calls
```jsx
// ✅ With loading state
const [loading, setLoading] = useState(false)
<button disabled={loading}>
  {loading ? <Loader2 className="animate-spin" /> : 'Submit'}
</button>
```

### Pitfall 3: Ignoring Dark Mode
**Problem**: Hardcoded colors that don't adapt
```jsx
// ❌ Hardcoded colors
<div className="bg-white text-black">
```

**Solution**: Use semantic tokens
```jsx
// ✅ Semantic tokens
<div className="bg-background text-foreground">
```

### Pitfall 4: Token Bloat
**Problem**: Adding verbose examples
```jsx
// ❌ Too verbose (wastes tokens)
// This is a button component
// You can use it for forms
// It has multiple variants
// Here's how to use it:
// Step 1: Import React
// Step 2: Add the component
```

**Solution**: Concise, practical examples
```jsx
// ✅ Concise
// PRIMARY BUTTON:
// <button className="btn btn-primary">Click me</button>
```

---

## 7. Modifying Frontend Generation Logic

### When to Modify `frontend-node.ts`
- Adding new animation keyframes
- Updating globals.css template
- Changing component generation prompts
- Adding new CSS utility classes

### Safe Update Process
1. **Read the file first**:
   ```bash
   Read lib/langgraph/nodes/frontend-node.ts
   ```

2. **Locate the section** (common sections):
   - `keyframes` section (~line 180-250)
   - `animation classes` (~line 260-280)
   - `hover utilities` (~line 290-300)
   - Component prompts (~line 400-600)

3. **Use Edit tool** with unique strings:
   ```typescript
   Edit lib/langgraph/nodes/frontend-node.ts

   old_string: "@keyframes fade-in {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}"
   new_string: "@keyframes fade-in {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}\n\n@keyframes slide-in {\n  from { transform: translateX(-100%); }\n  to { transform: translateX(0); }\n}"
   ```

4. **Test the build**:
   ```bash
   npm run build
   ```

### Critical Sections (DO NOT MODIFY)
- Template literal delimiters
- CSS variable names (used in ux-node.ts)
- Base utility class names (btn, card, input)

---

## 8. Modifying Color/Theme Logic

### When to Modify `ux-node.ts`
- Changing color extraction logic
- Updating contrast validation
- Adding new color tokens
- Modifying theme generation

### ⚠️ DANGER ZONE ⚠️
This file handles critical color logic. Changes here can break all generated apps.

### Safe Update Process
1. **Always backup before changes**:
   ```bash
   cp lib/langgraph/nodes/ux-node.ts lib/langgraph/nodes/ux-node.ts.backup
   ```

2. **Read and understand current logic**:
   ```bash
   Read lib/langgraph/nodes/ux-node.ts
   ```

3. **Test thoroughly**:
   - Generate test app
   - Check both light and dark modes
   - Verify color contrast
   - Test with different color inputs

### Common Color Issues
**Issue**: Primary color too light in dark mode
**Solution**: Adjust contrast validation thresholds

**Issue**: Background colors conflicting
**Solution**: Use background layering (background → backgroundSecondary → backgroundTertiary)

---

## 9. Quick Reference: Token Costs

### High Impact, Low Cost (✅ Add These)
- Empty states: ~60 tokens
- Avatar patterns: ~50 tokens
- Tabs: ~80 tokens
- Pagination: ~70 tokens
- Basic charts: ~100 tokens
- Notification badges: ~40 tokens

### High Impact, High Cost (⚠️ Consider Carefully)
- Complex animations: ~150 tokens
- Data tables: ~200 tokens
- Advanced charts: ~180 tokens
- File upload UI: ~120 tokens

### Low Impact, Any Cost (❌ Avoid)
- Decorative patterns
- Redundant variants
- Overly specific use cases

---

## 10. Examples: Adding New Patterns

### Example 1: Adding a Simple Badge Pattern

```typescript
// 1. Read the catalog
Read lib/component-catalog.ts

// 2. Find the right section (after NOTIFICATIONS)
Edit lib/component-catalog.ts

old_string: "// === EMPTY STATES PATTERNS ==="
new_string: "// === BADGES PATTERNS ===\n\n// STATUS BADGE:\n// <span className=\"inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success\">\n//   <div className=\"w-1.5 h-1.5 rounded-full bg-success\" />\n//   Active\n// </span>\n\n// === EMPTY STATES PATTERNS ==="

// 3. Test build
npm run build
```

**Token cost**: ~25 tokens
**Impact**: High (status indicators are common)
**Result**: ✅ Good addition

### Example 2: Adding Dashboard Chart Patterns

```typescript
// 1. Read the catalog
Read lib/component-catalog.ts

// 2. Add after PAGINATION
Edit lib/component-catalog.ts

old_string: "export const COMPONENT_CATALOG ="
new_string: "// === DASHBOARD CHARTS ===\n// BAR CHART (simple vertical bars):\n// const data = [65, 45, 72, 88, 50]\n// <div className=\"flex items-end gap-2 h-40\">\n//   {data.map((value, i) => (\n//     <div key={i} className=\"flex-1 bg-primary rounded-t\" style={{ height: `${value}%` }} />\n//   ))}\n// </div>\n\nexport const COMPONENT_CATALOG ="
```

**Token cost**: ~80 tokens
**Impact**: High (dashboards are common)
**Result**: ✅ Good addition

---

## 11. Debugging Failed Generations

### Common Issues and Solutions

#### Issue: Component not rendering
**Check**:
1. Are all lucide-react icons imported?
2. Is state properly initialized?
3. Are className utilities correct?

#### Issue: Colors not working
**Check**:
1. Using semantic tokens? (bg-primary not bg-blue-500)
2. Dark mode supported? (check .dark variants)
3. Background layers correct?

#### Issue: Backend features broken
**Check**:
1. Loading state present?
2. Error handling included?
3. Success feedback shown?

---

## 12. Maintenance Schedule

### Weekly
- Review generated apps for pattern usage
- Identify missing patterns (high frequency, low cost)
- Check token count (keep under 2,500)

### Monthly
- Review and consolidate redundant patterns
- Update examples with better practices
- Test all critical generation paths

### Before Major Updates
- Backup all catalog files
- Test generation with sample apps
- Verify deployment compatibility

---

## Summary Checklist

Before adding any component to the catalog:

- [ ] Token cost is justified by usage frequency
- [ ] Pattern is complete and copy-paste ready
- [ ] Uses semantic color tokens
- [ ] Includes state management if backend-related
- [ ] Has loading states for async operations
- [ ] Uses lucide-react icons
- [ ] Supports dark mode
- [ ] Follows mobile-first responsive design
- [ ] No framework-specific code
- [ ] No breaking changes to existing utilities
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)

---

**Last Updated**: 2025-11-02
**Catalog Version**: 2.1 (~2,140 tokens)
**Status**: Production Ready ✅
