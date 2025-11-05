# Component Library System - Usage Guide

**Last Updated:** 2025-01-22
**Status:** ✅ FULLY IMPLEMENTED

---

## 🎯 Overview

The VB app has a **dynamic, configurable component library system** that allows you to:
- ✅ Enable/disable entire component libraries
- ✅ Control which component categories are available
- ✅ Set priority for component selection
- ✅ Use presets for common configurations

---

## 📚 Available Component Libraries

### 1. **Enhanced 2025 Component Library** (`enhanced2025`)
- **Description:** Modern UI patterns with glassmorphism, gradients, dark mode
- **Components:** Navigation, Hero, Features, Pricing, CTA, Footer, Buttons
- **Priority:** 80 (high)
- **Status:** ✅ Enabled by default

### 2. **V0 Accessible Components** (`v0accessible`)
- **Description:** Production-ready accessible components with full ARIA support
- **Components:** Navigation, Forms, Email Capture (waitlist/newsletter/login), Features, Buttons, Modal, Footer
- **Priority:** 100 (highest - preferred when available)
- **Status:** ✅ Enabled by default

### 3. **Database Examples** (`databaseExamples`)
- **Description:** Real-world implementation examples from database (via PocketBase)
- **Components:** All categories supported
- **Priority:** 90 (high)
- **Status:** ✅ Enabled by default

---

## 🔧 How to Configure Libraries

### Configuration File: `lib/component-library-config.ts`

```typescript
import { toggleLibrary, toggleLibraryCategory, applyPreset } from '@/lib/component-library-config';

// Enable/disable an entire library
toggleLibrary('enhanced2025', false); // Disable enhanced 2025 library
toggleLibrary('v0accessible', true);  // Enable v0 accessible library

// Enable/disable specific categories within a library
toggleLibraryCategory('v0accessible', 'forms', false); // Disable forms from v0
toggleLibraryCategory('enhanced2025', 'hero', true);   // Enable hero from enhanced2025
```

---

## 🎨 Using Presets

Quick presets for common configurations:

```typescript
import { applyPreset } from '@/lib/component-library-config';

// Only accessible components (best for production)
applyPreset('accessibleOnly');

// Only modern 2025 components (best for design-focused apps)
applyPreset('modernOnly');

// Database examples only (best for learning from real code)
applyPreset('examplesOnly');

// All libraries (maximum variety)
applyPreset('all');

// Balanced (accessible + modern, no database) - DEFAULT
applyPreset('balanced');
```

---

## 📋 Component Selection Process

### Step 1: User Request Analysis
```
User: "Create a simple waitlist landing page for my shoe brand"
```

### Step 2: AI Component Selection (Granular)
AI analyzes the request and selects specific component variants:

```json
{
  "navigation": "none",              // User didn't mention it
  "hero": "minimal-cta",             // Simple headline + CTA
  "features": "none",                // User didn't mention it
  "emailCapture": "waitlist-only",   // Just email input!
  "pricing": "none",
  "cta": "none",                     // Already in hero
  "footer": "minimal",
  "buttons": "standard",
  "justification": "User said 'simple waitlist' so providing ONLY email capture and minimal hero"
}
```

### Step 3: Intent Validation
AI validates the selection to ensure it matches user intent:

```json
{
  "isValid": true,
  "issues": [],
  "reasoning": "All selections match user's explicit request for 'simple waitlist'"
}
```

### Step 4: Component Building
System picks **ONE component** from available libraries based on:
- Priority (higher priority libraries preferred)
- Component availability
- Dark mode setting

Example for `emailCapture: "waitlist-only"`:
```typescript
// System selects from V0 Accessible Components (highest priority)
emailCaptureSection = V0_ACCESSIBLE_COMPONENTS.forms.waitlistOnly;
// Result: Just email input, no name/message fields!
```

---

## 🆕 New Email Capture Components

### `waitlistOnly`
**Use when:** User wants simple email collection
```html
<!-- Just email + submit button -->
<form>
  <input type="email" name="email" required />
  <button type="submit">Join Waitlist</button>
</form>
```

### `newsletter`
**Use when:** User wants newsletter signup (email + optional name)
```html
<!-- Email + optional name -->
<form>
  <input type="text" name="name" placeholder="Name (optional)" />
  <input type="email" name="email" required />
  <button type="submit">Subscribe</button>
</form>
```

### `contact-full`
**Use when:** User explicitly wants contact form
```html
<!-- Full contact form -->
<form>
  <input type="text" name="name" required />
  <input type="email" name="email" required />
  <textarea name="message" required></textarea>
  <button type="submit">Send Message</button>
</form>
```

### `loginForm`
**Use when:** User wants login page
```html
<!-- Email + password -->
<form>
  <input type="email" name="email" required />
  <input type="password" name="password" required />
  <input type="checkbox" name="remember" />
  <button type="submit">Sign In</button>
</form>
```

---

## 🎨 Semantic Color System

All components now use **semantic color classes** for easy theming:

### Available Classes

**Backgrounds:**
- `.bg-primary` - Primary brand color
- `.bg-secondary` - Secondary color
- `.bg-accent` - Accent/highlight color
- `.bg-surface` - Card/surface backgrounds
- `.bg-background` - Page background
- `.bg-muted` - Subtle backgrounds

**Text:**
- `.text-foreground` - Primary text
- `.text-light` - Secondary/light text
- `.text-primary-foreground` - Text on primary backgrounds
- `.text-destructive` - Error text
- `.text-success` - Success text
- `.text-warning` - Warning text

**State Colors:**
- `.bg-destructive` - Error states
- `.bg-success` - Success states
- `.bg-warning` - Warning states

**Borders:**
- `.border` - Standard border color
- `.border-input` - Input border color
- `.border-primary` - Primary border color

**Effects:**
- `.shadow` - Standard shadow
- `.shadow-hover` - Hover shadow
- `.ring` - Focus ring

### Example Usage

```html
<!-- Before (hardcoded colors) -->
<button class="bg-blue-600 text-white hover:bg-blue-700">
  Click Me
</button>

<!-- After (semantic colors) -->
<button class="bg-primary text-primary-foreground hover:bg-primary-hover">
  Click Me
</button>
```

---

## 📊 Configuration Examples

### Example 1: Minimal Setup (Only Accessible Components)
```typescript
import componentLibraryConfig from '@/lib/component-library-config';

// Disable all except v0accessible
componentLibraryConfig.toggleLibrary('enhanced2025', false);
componentLibraryConfig.toggleLibrary('databaseExamples', false);
componentLibraryConfig.toggleLibrary('v0accessible', true);

console.log(componentLibraryConfig.getConfigSummary());
// Output:
// 📚 Active Component Libraries (1):
//   100. V0 Accessible Components
//      Categories: navigation, forms, emailCapture, features, buttons, modal, footer
```

### Example 2: Custom Configuration
```typescript
import { COMPONENT_LIBRARIES } from '@/lib/component-library-config';

// Enable enhanced2025 but only for specific categories
COMPONENT_LIBRARIES.enhanced2025.enabled = true;
COMPONENT_LIBRARIES.enhanced2025.categories = {
  navigation: false,
  hero: true,        // Only hero
  features: false,
  pricing: false,
  cta: true,         // And CTA
  footer: false,
  buttons: true,     // And buttons
};

// Use v0accessible for everything else
COMPONENT_LIBRARIES.v0accessible.enabled = true;
COMPONENT_LIBRARIES.v0accessible.priority = 100; // Higher priority
```

### Example 3: Add New Library
```typescript
import { COMPONENT_LIBRARIES } from '@/lib/component-library-config';

// Add your custom library
COMPONENT_LIBRARIES.myCustomLibrary = {
  id: 'myCustomLibrary',
  name: 'My Custom Components',
  description: 'Custom components for my brand',
  enabled: true,
  priority: 85,
  categories: {
    navigation: true,
    hero: true,
    footer: true,
  },
};
```

---

## 🧪 Testing Component Selection

### Test Case 1: Simple Waitlist
```bash
# User Request
"Create a simple waitlist landing page"

# Expected Components Selected
{
  "navigation": "none",
  "hero": "minimal-cta",
  "emailCapture": "waitlist-only",
  "features": "none",
  "pricing": "none",
  "cta": "none",
  "footer": "minimal"
}

# Expected Output
- Minimal hero section
- Waitlist email form (email only!)
- Minimal footer
- Total sections: 3
```

### Test Case 2: Full Landing Page
```bash
# User Request
"Landing page with pricing, features, and contact form"

# Expected Components Selected
{
  "navigation": "simple",
  "hero": "centered",
  "features": "6-items",
  "emailCapture": "contact-full",
  "pricing": "3-tier",
  "cta": "gradient",
  "footer": "full"
}

# Expected Output
- Navigation bar
- Centered hero
- 6 feature cards
- Full contact form (name + email + message)
- 3-tier pricing
- Gradient CTA
- Full footer
- Total sections: 7
```

### Test Case 3: Newsletter Signup
```bash
# User Request
"Newsletter signup page"

# Expected Components Selected
{
  "navigation": "none",
  "hero": "minimal-cta",
  "emailCapture": "newsletter",
  "features": "none",
  "pricing": "none",
  "cta": "none",
  "footer": "minimal"
}

# Expected Output
- Minimal hero
- Newsletter form (email + optional name)
- Minimal footer
- Total sections: 3
```

---

## 📝 Logging and Debugging

Check the console logs during generation:

```
[Prototype] 📚 Component Library Configuration:
📚 Active Component Libraries (2):
  100. V0 Accessible Components
     Categories: navigation, forms, emailCapture, features, buttons, modal, footer
  80. Enhanced 2025 Component Library
     Categories: navigation, hero, features, pricing, cta, footer, buttons

[Prototype] Determining which components are needed...
[Prototype] Component needs determined: {
  navigation: "none",
  hero: "minimal-cta",
  emailCapture: "waitlist-only",
  ...
}
[Prototype] Justification: User said 'simple waitlist' so providing ONLY email capture...

[Prototype] Running intent validation...
[Prototype] ✅ Intent validation passed: All selections match user intent

[Prototype] 🎨 OPTIMIZED COMPONENT SYSTEM (2025)
[Prototype] Components Selected (Intent-Based):
  - Navigation: none
  - Hero: minimal-cta
  - Email Capture: waitlist-only
  - Features: none
  - Pricing: none
[Prototype] Component count: 2 sections
```

---

## 🚀 Quick Start

1. **Use default configuration** (recommended):
   ```typescript
   // No configuration needed - balanced preset is default
   ```

2. **Apply a preset**:
   ```typescript
   import { applyPreset } from '@/lib/component-library-config';
   applyPreset('accessibleOnly');
   ```

3. **Custom configuration**:
   ```typescript
   import { toggleLibrary } from '@/lib/component-library-config';
   toggleLibrary('enhanced2025', false);
   toggleLibrary('v0accessible', true);
   ```

4. **Test with user request**:
   ```
   POST /api/ai/prototype
   {
     "description": "simple waitlist landing page",
     "appType": "landing-page"
   }
   ```

5. **Check logs** to see which libraries and components were used

---

## ✅ Checklist for New Components

When adding new components to a library:

1. ✅ Add component to library file (e.g., `v0-components.ts`)
2. ✅ Update component selection variants (e.g., `emailCapture: "new-variant"`)
3. ✅ Add component building logic in `prototype/route.ts`
4. ✅ Update component selection prompt with new variant
5. ✅ Test with real user requests
6. ✅ Update this documentation

---

## 🎓 Advanced Usage

### Dynamic Library Loading
```typescript
// Load libraries based on user tier
if (user.tier === 'premium') {
  applyPreset('all'); // All libraries
} else {
  applyPreset('accessibleOnly'); // Basic tier
}
```

### A/B Testing
```typescript
// 50% get enhanced2025, 50% get v0accessible
if (Math.random() > 0.5) {
  applyPreset('modernOnly');
} else {
  applyPreset('accessibleOnly');
}
```

### Custom Priority
```typescript
import { COMPONENT_LIBRARIES } from '@/lib/component-library-config';

// Make your library highest priority
COMPONENT_LIBRARIES.myCustomLibrary.priority = 150;

// Now it will be preferred over v0accessible (priority 100)
```

---

## 📞 Support

- **Issues:** Check console logs for component selection details
- **Configuration:** See `lib/component-library-config.ts`
- **Examples:** See test cases above
- **Components:** See `lib/v0-components.ts` and `lib/design-components.ts`

---

**End of Guide**
