# Design System Implementation Checklist #notDone

**Status**: #notDone
**Related**: [UI/UX Design System Audit Plan](./ui-ux-design-system-audit-plan.md)
**Created**: 2025-10-25
**Updated**: 2025-10-26

This checklist provides a step-by-step implementation guide for the design system improvements outlined in the audit plan.

**⚠️ CRITICAL REQUIREMENTS**:
- ✅ **NO visual changes** - preserve exact current appearance
- ✅ **Backward compatible** - keep old code until full migration
- ✅ **Semantic and scalable** - enable multi-product architecture
- ✅ **Rollback plans** - each change can be reverted independently

---

## 📋 PHASE 1: CRITICAL FIXES (Week 1 - 10 hours)

### Day 1: Border System Standardization (1 hour) - BACKWARD COMPATIBLE

**User Requirement**: "I want all borders to be 1px, not more. But make sure all are consistent."

#### Border Width Updates
- [ ] Open [tailwind.config.js](../../tailwind.config.js)
- [ ] Update `borderWidth` configuration:
  ```javascript
  borderWidth: {
    none: '0',
    DEFAULT: '1px',   // Keep 1px, eliminate redundant naming
    '2': '2px',       // For emphasized borders (outline buttons)
    '4': '4px',       // For very strong emphasis
  }
  ```
- [ ] Save and test build: `npm run build`
- [ ] Verify no build errors
- [ ] **Expected Result**: NO visual changes, just cleaner naming

#### Remove Redundant Border Classes
- [ ] Search for `border-thin` usage:
  ```bash
  cd /Users/shayan/Desktop/Projects/VB
  rg "border-thin" --type tsx
  ```
- [ ] Replace all `border-thin` with `border` (same 1px value)
- [ ] Search for `border-thick` usage:
  ```bash
  rg "border-thick" --type tsx
  ```
- [ ] Replace all `border-thick` with `border` (was already 1px anyway)
- [ ] Search for `border-resize` usage and standardize

#### Verification
- [ ] Test all components to ensure NO visual breakage
- [ ] Verify borders still appear at 1px
- [ ] Check cards, inputs, buttons, modals

#### Rollback Plan
- [ ] If issues arise, revert `tailwind.config.js` changes
- [ ] Restore `border-thin`, `border-thick`, `border-resize` definitions

---

### Day 2: Shadow System Consistency (2 hours) - BACKWARD COMPATIBLE

**User Requirement**: "No glow shadows! Just make sure shadowing is consistent where they need to be"

#### Shadow System Updates
- [ ] Open [tailwind.config.js](../../tailwind.config.js)
- [ ] Replace `boxShadow` configuration with **standard shadows** (NO glow):
  ```javascript
  boxShadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',    // Slightly stronger than before
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',      // NOW different from DEFAULT
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',    // Clear hierarchy
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',    // Maximum depth
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)', // Modal/overlay
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
  }
  ```
- [ ] Save and test build
- [ ] **Expected Result**: Distinct shadow hierarchy, NO visual changes to existing shadows

#### Documentation
- [ ] Create shadow usage guidelines in COMPONENT_STANDARDS.md:
  - Cards: `shadow-md` for elevated cards, `shadow-sm` for subtle
  - Modals: `shadow-2xl` for clear separation
  - Buttons: `shadow-sm` on hover
  - Dropdowns: `shadow-lg` for floating menus

#### Component Testing
- [ ] Test Button component - verify existing shadows work
- [ ] Test Card components - verify depth perception maintained
- [ ] Test Modal/Dialog - verify overlay shadows
- [ ] Test Dropdown menus - verify floating shadows
- [ ] **NO visual changes expected**

#### Rollback Plan
- [ ] If issues arise, revert `tailwind.config.js` shadow changes
- [ ] Restore original shadow definitions

---

### Day 3-4: Color Migration to Semantic Tokens (5 hours) - BACKWARD COMPATIBLE

**User Requirement**: "Make them semantic but don't change any coloring for now just make them semantic and scalable"

**⚠️ CRITICAL**: ZERO visual changes - preserve exact colors, only make semantic

#### Step 1: Add Multi-Product Color Tokens (ADDITIVE ONLY)
- [ ] Open [lib/theme/theme-config.ts](../../lib/theme/theme-config.ts)
- [ ] Add product color system:
  ```typescript
  export const productColors = {
    // Base brand (Dark + Gold) - Used everywhere
    base: {
      background: '#262624',  // Dark
      gold: '#AE851B',        // Gold
      goldHover: '#957216',
      goldLight: '#C19A3A',
    },

    // Product-specific accents (pair with base)
    product: {
      primary: '#22C55E',      // Green (from green-500)
      primaryLight: '#10B981', // Emerald (from emerald-500)
    },

    marketing: {
      primary: '#3B82F6',      // Blue
      primaryLight: '#60A5FA',
    },

    analytics: {
      primary: '#EF4444',      // Red
      primaryLight: '#F87171',
    },

    founder: {
      primary: '#1F2937',      // Dark gray/black
      primaryLight: '#374151',
    },
  };
  ```
- [ ] Save and test build

#### Step 2: Add Gradient Tokens (ADDITIVE ONLY)
- [ ] Open [tailwind.config.js](../../tailwind.config.js)
- [ ] Add to `theme.extend.backgroundImage`:
  ```javascript
  backgroundImage: {
    // Base brand gradients (EXACT current colors)
    'gradient-brand-gold': 'linear-gradient(to right, #FCD34D, #D97706)',  // amber-400 to yellow-600
    'gradient-brand-gold-br': 'linear-gradient(to bottom right, #FCD34D, #D97706)',

    // Product-specific gradients (EXACT current colors)
    'gradient-product-accent': 'linear-gradient(to right, #22C55E, #10B981)',  // green-500 to emerald-500
    'gradient-marketing-accent': 'linear-gradient(to right, #3B82F6, #60A5FA)',
    'gradient-analytics-accent': 'linear-gradient(to right, #EF4444, #F87171)',
    'gradient-founder-accent': 'linear-gradient(to right, #1F2937, #374151)',
  }
  ```
- [ ] Save and test build
- [ ] **Expected Result**: New utilities available, existing code unchanged

#### Step 3: Audit Hardcoded Colors
- [ ] Run search commands:
  ```bash
  cd /Users/shayan/Desktop/Projects/VB
  rg "from-(amber|yellow|orange)-\d+" --type tsx > color_audit_gradients.txt
  rg "from-(green|emerald)-\d+" --type tsx >> color_audit_gradients.txt
  rg "bg-(amber|yellow|orange|green|red|blue)-\d+" --type tsx > color_audit_bg.txt
  rg "text-(amber|yellow|orange|green|red|blue)-\d+" --type tsx > color_audit_text.txt
  ```
- [ ] Review audit files and prioritize top 10 components

#### Step 4: Migrate Top 10 Components (ONE AT A TIME)
- [ ] **app/page.tsx**
  - Find: `from-amber-400 to-yellow-600`
  - Replace: `bg-gradient-brand-gold`
  - Test: Verify EXACT same appearance
  - Rollback if any visual difference

- [ ] **app/pricing/page.tsx**
  - Find: `from-amber-400 to-yellow-600`
  - Replace: `bg-gradient-brand-gold`
  - Test: Verify EXACT same appearance

- [ ] **components/credits/TokenBar.tsx**
  - Find: `from-green-500 to-emerald-500`
  - Replace: `bg-gradient-product-accent`
  - Find: `bg-amber-500/20 text-amber-600 border-amber-500/30`
  - Create semantic tokens for these if needed
  - Test: Verify EXACT same appearance

- [ ] **components/ui/button.tsx**
  - Audit current usage
  - Only replace if hardcoded (may already be semantic)
  - Test all button variants

- [ ] **components/auth/ProfileButton.tsx**
  - Audit for hardcoded colors
  - Replace if found
  - Test appearance

- [ ] **components/auth/AuthModal.tsx**
  - Audit for hardcoded colors
  - Replace if found
  - Test appearance

- [ ] **components/payment/CreditPurchaseModal.tsx**
  - Audit for hardcoded colors
  - Replace if found
  - Test appearance

- [ ] **[Add 3 more high-priority components]**
  - Identify during audit
  - Follow same process

#### Step 5: Verification (CRITICAL)
- [ ] Visual comparison: Before vs After screenshots
- [ ] Verify ZERO visual differences
- [ ] Test theme switching still works
- [ ] Test all migrated components
- [ ] If ANY visual difference found, investigate and fix

#### Step 6: Keep Old Code Until Phase 2
- [ ] DO NOT remove hardcoded Tailwind color classes yet
- [ ] Keep old code as fallback
- [ ] Mark components as "migrated" in tracking doc

#### Rollback Plan
- [ ] Each component can be rolled back independently
- [ ] Simply revert to hardcoded classes
- [ ] Remove gradient tokens if causing issues

---

### Day 5: Typography Alignment & Scaling (2 hours) - BACKWARD COMPATIBLE

**User Requirement**: "Align it, and make sure we use proper and scalable typography for titles, subtitles, text and any other components"

#### Step 1: Align Documentation with Implementation
- [ ] Open [docs/architecture/COMPONENT_STANDARDS.md](../../docs/architecture/COMPONENT_STANDARDS.md)
- [ ] Find line ~252 (Body Text section)
- [ ] Update from "weight 200 (UltraLight)" to "weight 300 (Light)"
- [ ] Update all references to body text weight
- [ ] Add note: "Weight 300 chosen for optimal readability in Proxima Nova"
- [ ] **Expected Result**: Docs now match code (weight 300)

#### Step 2: Create Comprehensive Typography Scale (ADDITIVE)
- [ ] Open [app/globals.css](../../app/globals.css)
- [ ] Add typography utility classes:
  ```css
  /* Typography Scale - Titles */
  .text-title-xl {
    font-size: 3rem;      /* 48px */
    font-weight: 900;
    line-height: 1.2;
  }

  .text-title-lg {
    font-size: 2.25rem;   /* 36px */
    font-weight: 900;
    line-height: 1.25;
  }

  .text-title-md {
    font-size: 1.875rem;  /* 30px */
    font-weight: 900;
    line-height: 1.3;
  }

  /* Typography Scale - Subtitles */
  .text-subtitle-lg {
    font-size: 1.5rem;    /* 24px */
    font-weight: 600;
    line-height: 1.35;
  }

  .text-subtitle-md {
    font-size: 1.25rem;   /* 20px */
    font-weight: 600;
    line-height: 1.4;
  }

  .text-subtitle-sm {
    font-size: 1.125rem;  /* 18px */
    font-weight: 600;
    line-height: 1.45;
  }

  /* Typography Scale - Body Text */
  .text-body-lg {
    font-size: 1.125rem;  /* 18px */
    font-weight: 300;
    line-height: 1.6;
  }

  .text-body-md {
    font-size: 1rem;      /* 16px - DEFAULT */
    font-weight: 300;
    line-height: 1.6;
  }

  .text-body-sm {
    font-size: 0.875rem;  /* 14px */
    font-weight: 300;
    line-height: 1.5;
  }

  /* Typography Scale - Captions/Labels */
  .text-caption {
    font-size: 0.75rem;   /* 12px */
    font-weight: 300;
    line-height: 1.4;
  }

  .text-overline {
    font-size: 0.75rem;   /* 12px */
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    line-height: 1.4;
  }
  ```
- [ ] Save and test build
- [ ] **Expected Result**: New typography utilities available

#### Step 3: Document Typography Usage Guidelines
- [ ] Update COMPONENT_STANDARDS.md with new section:
  - **Titles** (xl/lg/md): Page headings, section headers
  - **Subtitles** (lg/md/sm): Subsection headings, card titles
  - **Body** (lg/md/sm): Paragraph text, descriptions, content
  - **Caption**: Small annotations, timestamps, helper text
  - **Overline**: Labels, categories, tags, section markers

#### Step 4: Test Typography Scale
- [ ] Test each class on sample content
- [ ] Verify readability on different screens
- [ ] Check Farsi language support
- [ ] Ensure line heights prevent text overlap

#### Rollback Plan
- [ ] New classes are additive - can simply stop using them
- [ ] Existing typography remains unchanged
- [ ] No breaking changes

---

## 📋 PHASE 2: COMPLETE MIGRATION & DOCUMENTATION (Week 2 - 12 hours)

**Focus**: Complete color migration for ALL components, document multi-product brand architecture

### Day 1-3: Complete Color Migration (6 hours) - BACKWARD COMPATIBLE

**Goal**: Migrate remaining ~45 components to semantic tokens

#### Step 1: Identify Remaining Components
- [ ] Review color audit files from Phase 1 Day 3-4
- [ ] Create list of all components needing migration (~45 remaining)
- [ ] Prioritize by usage frequency
- [ ] Create tracking spreadsheet

#### Step 2: Migrate Components (Batch Processing)
- [ ] **Batch 1: Layout Components** (~8 components)
  - [ ] Header/Navigation
  - [ ] Footer
  - [ ] Sidebar
  - [ ] Layout wrappers
  - Test each after migration, verify EXACT same colors

- [ ] **Batch 2: Form Components** (~10 components)
  - [ ] Input fields
  - [ ] Select dropdowns
  - [ ] Checkboxes/radios
  - [ ] Form buttons
  - Test each, verify EXACT same colors

- [ ] **Batch 3: Display Components** (~12 components)
  - [ ] Cards
  - [ ] Tables
  - [ ] Lists
  - [ ] Badges/Tags
  - Test each, verify EXACT same colors

- [ ] **Batch 4: Feedback Components** (~8 components)
  - [ ] Alerts
  - [ ] Toasts
  - [ ] Modals
  - [ ] Tooltips
  - Test each, verify EXACT same colors

- [ ] **Batch 5: Remaining Pages** (~7 components)
  - [ ] Remaining page-level components
  - [ ] Any missed components
  - Test all, verify EXACT same colors

#### Step 3: Create COLOR_MIGRATION_GUIDE.md
- [ ] Create file: `docs/plans/COLOR_MIGRATION_GUIDE.md`
- [ ] Document all color mappings with exact values
- [ ] Include before/after code examples
- [ ] Add search & replace commands
- [ ] List all migrated components

#### Step 4: Final Verification
- [ ] Visual regression test all pages
- [ ] Take screenshots before/after for comparison
- [ ] Verify ZERO visual differences
- [ ] Test theme switching across all components
- [ ] Get user approval on visual appearance

#### Step 5: Clean Up (After Verification)
- [ ] Can now remove old hardcoded color classes
- [ ] Update Tailwind config to remove unused utilities (optional)
- [ ] Mark migration as complete

#### Rollback Plan
- [ ] Keep hardcoded classes until 100% verified
- [ ] Batch rollback by component type if needed
- [ ] Full rollback: revert all color token changes

---

### Day 4-5: Multi-Product Brand Guidelines (6 hours) - DOCUMENTATION ONLY

**User Requirement**: Document Dark + Gold base paired with Product/Marketing/Analytics/Founder colors

#### Step 1: Create Brand Directory Structure
- [ ] Create `docs/brand/` directory
- [ ] Create file structure:
  - BRAND_GUIDELINES.md (main document)
  - MULTI_PRODUCT_COLORS.md (NEW - product color architecture)
  - COLOR_SYSTEM.md (base + product palettes)
  - LOGO_USAGE.md (base + product logo variants)
  - ACCESSIBILITY.md (per-product palette contrast)

#### Step 2: Write BRAND_GUIDELINES.md
- [ ] **Section 1: Multi-Product Brand Architecture** (PRIMARY FOCUS)
  - [ ] Document base brand: Dark (#262624) + Gold (#AE851B)
  - [ ] Document product color pairings:
    - Product/Builder: Dark + Gold + Green single gradient
    - Marketing: Dark + Gold + Blue single gradient
    - Analytics: Dark + Gold + Red single gradient
    - Founder: Dark + Gold + Black single gradient
  - [ ] Explain color pairing rules
  - [ ] Show when to use base vs. product-specific
  - [ ] Add visual examples for each product

- [ ] **Section 2: Brand Identity**
  - [ ] Brand story
  - [ ] Brand values
  - [ ] Voice & tone
  - [ ] Product color meanings (why green for Product, blue for Marketing, etc.)

- [ ] **Section 2: Visual Language**
  - [ ] Color system overview
  - [ ] Typography overview
  - [ ] Iconography principles
  - [ ] Grid & layout system

- [ ] **Section 3: Design Principles**
  - [ ] Clarity
  - [ ] Consistency
  - [ ] Feedback
  - [ ] Efficiency

- [ ] **Section 4: Motion & Animation**
  - [ ] Animation principles
  - [ ] Duration guidelines
  - [ ] Easing curves

- [ ] **Section 5: Components**
  - [ ] Component overview
  - [ ] Usage guidelines
  - [ ] Do's and Don'ts

#### Step 3: Write MULTI_PRODUCT_COLORS.md (NEW - CRITICAL)
- [ ] Create detailed product color combination guide
- [ ] For each product, document:
  - **Product/Builder**:
    - Base: Dark + Gold
    - Accent: Green gradient (#22C55E to #10B981)
    - Usage examples in code
    - Visual mockups if available
  - **Marketing**:
    - Base: Dark + Gold
    - Accent: Blue gradient (#3B82F6 to #60A5FA)
    - Usage examples
  - **Analytics**:
    - Base: Dark + Gold
    - Accent: Red gradient (#EF4444 to #F87171)
    - Usage examples
  - **Founder**:
    - Base: Dark + Gold
    - Accent: Black gradient (#1F2937 to #374151)
    - Usage examples
- [ ] Add color pairing rules and best practices

#### Step 4: Write Supporting Documents
- [ ] **COLOR_SYSTEM.md**
  - [ ] Base palette documentation (Dark + Gold)
  - [ ] Product-specific palettes (Green/Blue/Red/Black)
  - [ ] Color usage rules per product
  - [ ] Contrast ratios for each palette
  - [ ] Accessibility notes per product

- [ ] **LOGO_USAGE.md**
  - [ ] Base logo usage rules
  - [ ] Product-specific logo variants (if any)
  - [ ] Spacing requirements
  - [ ] Minimum sizes
  - [ ] Misuse examples

- [ ] **TYPOGRAPHY.md**
  - [ ] Font selection rationale
  - [ ] Font pairing rules
  - [ ] Typography scale (from Phase 1)
  - [ ] Line height standards

- [ ] **ACCESSIBILITY.md**
  - [ ] WCAG compliance level
  - [ ] Color contrast requirements per product palette
  - [ ] Keyboard navigation standards
  - [ ] Screen reader support guidelines

#### Step 5: Add Visual Examples
- [ ] Create code examples for each product color combination
- [ ] Add typography scale examples
- [ ] Show component examples with each product palette
- [ ] Include before/after migration examples

#### Step 6: Link Documentation
- [ ] Update main README.md with brand guidelines link
- [ ] Add links in DESIGN_SYSTEM.md
- [ ] Update plans/README.md with brand docs
- [ ] Cross-reference color migration guide

---

## 📋 PHASE 3: POLISH & OPTIMIZATION (Week 3 - 8 hours)

### Day 1-2: Dark Theme Fine-tuning (3 hours)

#### Step 1: Contrast Testing
- [ ] Use WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- [ ] Test all text/background combinations
- [ ] Test button states
- [ ] Test border visibility
- [ ] Document all contrast ratios

#### Step 2: Visual Testing
- [ ] Test on multiple monitors (if available)
- [ ] Test at different brightness levels
- [ ] Compare with GitHub Dark, VS Code Dark themes
- [ ] Get user feedback on readability

#### Step 3: Color Adjustments (if needed)
- [ ] Open [lib/theme/theme-config.ts](../../lib/theme/theme-config.ts)
- [ ] Adjust background levels if needed
- [ ] Adjust text colors if needed
- [ ] Document rationale for changes

#### Step 4: Focus State Glow
- [ ] Add glow effects to focus states
- [ ] Test keyboard navigation
- [ ] Ensure focus visible on all interactive elements

#### Step 5: Documentation
- [ ] Document final color values
- [ ] Add contrast ratio table to COLOR_SYSTEM.md
- [ ] Note any deviations from initial design

---

### Day 3: Component Variants (2 hours)

#### Button Component
- [ ] Open [components/ui/button.tsx](../../components/ui/button.tsx)
- [ ] Add `link` variant:
  ```typescript
  link: "bg-transparent text-brand-primary hover:text-brand-primary-hover underline-offset-4 hover:underline"
  ```
- [ ] Test link variant appearance
- [ ] Update documentation

#### Input Component
- [ ] Create or open Input component
- [ ] Add `state` prop (error, success, warning, default)
- [ ] Add state styling:
  ```typescript
  error: "border-2 border-error focus:ring-error"
  success: "border-2 border-success focus:ring-success"
  warning: "border-2 border-warning focus:ring-warning"
  ```
- [ ] Add `message` prop for helper text
- [ ] Test all states

#### Card Component
- [ ] Create or enhance Card component
- [ ] Add `variant` prop (elevated, bordered, flat)
- [ ] Add `padding` prop (compact, comfortable, spacious)
- [ ] Implement variants
- [ ] Test all combinations

#### Alert Component
- [ ] Create or enhance Alert component
- [ ] Add `severity` prop (info, success, warning, error)
- [ ] Add `dismissible` prop
- [ ] Add severity icons and colors
- [ ] Test all severities

#### Documentation
- [ ] Update COMPONENT_STANDARDS.md with new variants
- [ ] Add usage examples for each variant

---

### Day 4-5: Accessibility Audit (3 hours)

#### Step 1: Focus Indicators
- [ ] Open [app/globals.css](../../app/globals.css)
- [ ] Add focus-visible styles:
  ```css
  *:focus-visible {
    outline: 2px solid var(--color-brand-primary);
    outline-offset: 2px;
    border-radius: 0.25rem;
  }

  *:focus:not(:focus-visible) {
    outline: none;
  }

  button:focus-visible {
    box-shadow: 0 0 0 3px rgba(174, 133, 27, 0.3);
  }
  ```
- [ ] Test focus indicators on all interactive elements

#### Step 2: Color Contrast Audit
- [ ] Create spreadsheet of all color combinations
- [ ] Test each with contrast checker
- [ ] Document results in ACCESSIBILITY.md
- [ ] Fix any combinations failing WCAG AA

#### Step 3: ARIA Labels Audit
- [ ] Search for icon-only buttons
- [ ] Add `aria-label` where missing
- [ ] Search for decorative icons
- [ ] Add `aria-hidden="true"` where appropriate
- [ ] Add example patterns to documentation

#### Step 4: Keyboard Navigation Testing
- [ ] Test tab order on all pages
- [ ] Test modal focus trapping
- [ ] Test dropdown keyboard navigation
- [ ] Test form submission with Enter key
- [ ] Document keyboard shortcuts

#### Step 5: Documentation
- [ ] Update COMPONENT_STANDARDS.md with accessibility section
- [ ] Create accessibility checklist
- [ ] Add ARIA label examples
- [ ] Document keyboard navigation patterns

---

## 📊 FINAL VERIFICATION

### Visual Quality Checks
- [ ] **CRITICAL**: ZERO visual changes - UI looks exactly the same as before
- [ ] All borders consistent at 1px (no visual change)
- [ ] All shadows have distinct hierarchy (no visual change)
- [ ] All colors are semantic (preserving exact current colors)
- [ ] Typography hierarchy is clear and scalable
- [ ] Multi-product color system ready for future products

### Functional Checks
- [ ] Theme switching works across all 4 themes
- [ ] No console errors or warnings
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are clearly visible
- [ ] All text is readable (meets contrast requirements)
- [ ] All migrated components maintain exact visual appearance

### Documentation Checks
- [ ] All code changes are documented
- [ ] Multi-product brand guidelines complete
- [ ] Color migration guide shows exact mappings
- [ ] Component standards updated
- [ ] Typography scale documented
- [ ] Examples show before/after with ZERO visual difference

### Performance Checks
- [ ] Bundle size hasn't increased significantly
- [ ] No performance degradation from semantic tokens
- [ ] No layout shifts or jank
- [ ] Fast theme switching (< 100ms)

### Backward Compatibility Checks
- [ ] All changes can be rolled back independently
- [ ] Old code kept until full verification
- [ ] Each component tested after migration
- [ ] Rollback plans documented and tested

---

## 🎯 SUCCESS CRITERIA

Mark this checklist as DONE when:
- [ ] All Phase 1 tasks completed (10 hours - semantic fixes, NO visual changes)
- [ ] All Phase 2 tasks completed (12 hours - complete migration + brand docs)
- [ ] All Phase 3 tasks completed (8 hours - polish)
- [ ] **CRITICAL**: Visual regression test shows ZERO differences
- [ ] All verification checks passed
- [ ] Multi-product architecture ready for Marketing/Analytics/Founder
- [ ] Code reviewed and approved
- [ ] User approves visual appearance (should look identical)
- [ ] Deployed to production
- [ ] Old hardcoded code removed after verification

---

## 📝 NOTES & DECISIONS

### Key Decisions (Updated 2025-10-26)
- [ ] Typography weight: **Weight 300** (aligned docs with implementation)
- [ ] Border width: **Keep 1px** (not 1.5px - per user requirement)
- [ ] Shadow system: **Standard shadows** (no glow - per user requirement)
- [ ] Color migration: **Semantic tokens preserving exact colors** (ZERO visual changes)
- [ ] Multi-product architecture: **Dark + Gold base + product-specific accents**

### User Requirements Summary
- Borders: "I want all borders to be 1px, not more. But make sure all are consistent."
- Shadows: "No glow shadows! Just make sure shadowing is consistent where they need to be"
- Colors: "Make them semantic but don't change any coloring for now just make them semantic and scalable"
- Typography: "Align it, and make sure we use proper and scalable typography"
- Brand: "Dark + Golden Single Gradient paired with Product/Marketing/Analytics/Founder colors"
- Implementation: "Make sure you implement these in such a way that they are first backward compatible"

### Deviations from Original Plan
- Changed from 1.5px borders → 1px borders (per user feedback)
- Removed glow shadow system → standard shadows only (per user feedback)
- Changed focus from visual changes → semantic without visual changes (per user feedback)
- Added multi-product color architecture (per user feedback)

### Issues Encountered
- [ ] [Document any blockers or problems during implementation]

---

**Last Updated**: 2025-10-26
**Status**: #notDone (Ready for implementation)
**Next Review**: After Phase 1 completion
**Version**: 2.0 (Revised based on user requirements)
