# Design System Documentation

## Overview

The Vibebaba design system is built for **instant theme switching** and **comprehensive i18n/RTL support**. You can change the entire color palette or translate the app to Farsi/Arabic with just a few simple changes.

---

## 🎨 Dynamic Theme System

### Quick Theme Change

**To change the entire app theme:**

1. Open [`lib/theme/theme-config.ts`](lib/theme/theme-config.ts)
2. Change the `activeTheme` export:

```typescript
// Change this line:
export const activeTheme = warmOrangeTheme;

// To one of these:
export const activeTheme = coolBlueTheme;
export const activeTheme = purpleDreamTheme;
export const activeTheme = greenNatureTheme;
```

3. Save the file - the entire app updates instantly!

### Available Themes

#### 1. Warm Orange (Default)
- Primary: `#BC6C25` (Warm orange)
- Accent: `#3A7D8E` (Subtle teal)
- Vibe: Professional, warm, approachable

#### 2. Cool Blue
- Primary: `#2563EB` (Modern blue)
- Accent: `#7C3AED` (Purple)
- Vibe: Professional, tech-forward, trustworthy

#### 3. Purple Dream
- Primary: `#9333EA` (Vibrant purple)
- Accent: `#EC4899` (Pink)
- Vibe: Creative, modern, energetic

#### 4. Green Nature
- Primary: `#059669` (Fresh green)
- Accent: `#65A30D` (Lime)
- Vibe: Natural, eco-friendly, calm

### Creating a Custom Theme

Add your own theme to [`lib/theme/theme-config.ts`](lib/theme/theme-config.ts):

```typescript
export const myCustomTheme: ColorPalette = {
  name: "My Theme",
  colors: {
    // Brand colors
    brandPrimary: "#FF6B35",        // Your primary color
    brandPrimaryHover: "#E5552C",   // Darker shade for hover
    brandPrimaryLight: "#FF8C61",   // Lighter shade
    brandPrimaryPale: "#FFE4D9",    // Very light
    brandPrimarySubtle: "#FFF4EF",  // Almost white

    // Accent colors
    accentDefault: "#4ECDC4",
    accentLight: "#7FD9D2",
    accentPale: "#E0F7F5",
    accentHover: "#3DB5AD",

    // Background (usually neutral)
    backgroundBase: "#FAFAFA",
    backgroundRaised: "#FFFFFF",
    backgroundOverlay: "#FFFFFF",
    backgroundSunken: "#F5F5F5",
    backgroundSubtle: "#EEEEEE",

    // Text (usually dark to light)
    textPrimary: "#1A1A1A",
    textSecondary: "#4A4A4A",
    textTertiary: "#6A6A6A",
    textSubtle: "#9A9A9A",
    textInverse: "#FFFFFF",

    // Borders (usually subtle)
    borderSubtle: "#F0F0F0",
    borderLight: "#E0E0E0",
    borderDefault: "#D0D0D0",
    borderStrong: "#B0B0B0",
    borderFocus: "#FF6B35",      // Usually same as primary
    borderFocusLight: "#FF8C61",

    // Semantic colors
    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
    info: "#3B82F6",
  },
};

// Then set it as active:
export const activeTheme = myCustomTheme;
```

### Using Theme Colors in Components

The theme system uses CSS variables connected to Tailwind:

```tsx
// ✅ CORRECT - Use semantic color names
<button className="bg-brand-primary hover:bg-brand-primary-hover text-text-inverse">
  Click me
</button>

<div className="bg-background-raised border border-border-default">
  <p className="text-text-primary">Primary text</p>
  <p className="text-text-secondary">Secondary text</p>
</div>

// ❌ WRONG - Don't use hardcoded colors
<button className="bg-orange-500 hover:bg-orange-600">
  Click me
</button>
```

### Color Palette Reference

All available color classes:

**Brand Colors:**
- `bg-brand-primary` / `text-brand-primary` / `border-brand-primary`
- `bg-brand-primary-hover`
- `bg-brand-primary-light`
- `bg-brand-primary-pale`
- `bg-brand-primary-subtle`

**Accent Colors:**
- `bg-accent` / `text-accent` / `border-accent`
- `bg-accent-light`
- `bg-accent-pale`
- `bg-accent-hover`

**Background Colors:**
- `bg-background` (same as `bg-background-base`)
- `bg-background-raised`
- `bg-background-overlay`
- `bg-background-sunken`
- `bg-background-subtle`

**Text Colors:**
- `text-text-primary`
- `text-text-secondary`
- `text-text-tertiary`
- `text-text-subtle`
- `text-text-inverse`

**Border Colors:**
- `border-border-subtle`
- `border-border-light`
- `border-border` (same as `border-border-default`)
- `border-border-strong`
- `border-border-focus`
- `border-border-focus-light`

**Semantic Colors:**
- `bg-success` / `text-success` / `border-success`
- `bg-error` / `text-error` / `border-error`
- `bg-warning` / `text-warning` / `border-warning`
- `bg-info` / `text-info` / `border-info`

---

## 🌍 Internationalization (i18n)

### Quick Translation to Farsi

**The app is already 90% ready for Farsi!** Here's how to complete it:

#### Step 1: Translation Files Already Created

Full translation files exist at:
- [`messages/en.json`](messages/en.json) - English ✅
- [`messages/fa.json`](messages/fa.json) - Farsi ✅ (Complete!)
- [`messages/ar.json`](messages/ar.json) - Arabic (partial)

#### Step 2: Add Language Switcher to UI

Create a language switcher component (already exists at [`components/LanguageSwitcher.tsx`](components/LanguageSwitcher.tsx)):

```tsx
import { useLanguage } from "@/lib/language-context";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as "en" | "fa" | "ar")}
      className="px-3 py-2 border border-border rounded-lg"
    >
      <option value="en">English</option>
      <option value="fa">فارسی</option>
      <option value="ar">العربية</option>
    </select>
  );
}
```

Add it to your header/navbar.

#### Step 3: Use Translations in Components

```tsx
"use client";

import { useTranslations } from "next-intl";

export function MyComponent() {
  const t = useTranslations("landing");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("subtitle")}</p>
      <button>{t("button")}</button>
    </div>
  );
}
```

### Translation Structure

All translations follow this structure in [`messages/`](messages/):

```json
{
  "landing": { ... },      // Landing page text
  "project": { ... },      // Project pages
  "chat": { ... },         // Chat interface
  "auth": { ... },         // Authentication
  "sidebar": { ... },      // Sidebar
  "settings": { ... },     // Settings page
  "pricing": { ... },      // Pricing page
  "errors": { ... },       // Error messages
  "success": { ... },      // Success messages
  "common": { ... },       // Common UI text
  "prompts": { ... }       // AI prompt translations
}
```

### Adding New Translations

To add a new translatable string:

1. Add it to [`messages/en.json`](messages/en.json):
```json
{
  "mySection": {
    "newString": "Hello World"
  }
}
```

2. Add the same key to [`messages/fa.json`](messages/fa.json):
```json
{
  "mySection": {
    "newString": "سلام دنیا"
  }
}
```

3. Use it in your component:
```tsx
const t = useTranslations("mySection");
<p>{t("newString")}</p>
```

---

## 🔄 RTL (Right-to-Left) Support

### Automatic RTL Switching

The app automatically switches to RTL when the locale is set to Farsi (`fa`) or Arabic (`ar`).

**How it works:**
1. User selects Farsi/Arabic from language switcher
2. `LanguageProvider` detects RTL language
3. HTML `dir` attribute changes to `"rtl"`
4. All RTL-aware components flip automatically

### RTL Utility Functions

Use these helpers from [`lib/rtl-utils.ts`](lib/rtl-utils.ts):

```tsx
import { useLanguage } from "@/lib/language-context";
import { rtlClass } from "@/lib/rtl-utils";

function MyComponent() {
  const { dir } = useLanguage();
  const isRTL = dir === "rtl";

  return (
    <div className={`
      ${rtlClass.pl(isRTL, "4")}    // Becomes pr-4 in RTL
      ${rtlClass.ml(isRTL, "auto")} // Becomes mr-auto in RTL
      ${rtlClass.textLeft(isRTL)}   // Becomes text-right in RTL
    `}>
      Content
    </div>
  );
}
```

### Making Components RTL-Ready

#### Positioning (left/right)

```tsx
// ❌ Before (hardcoded)
<div className="fixed left-0">

// ✅ After (RTL-aware)
<div className={`fixed ${isRTL ? 'right-0' : 'left-0'}`}>
```

#### Padding/Margin

```tsx
// ❌ Before
<div className="pl-4 mr-2">

// ✅ After
<div className={`${rtlClass.pl(isRTL, "4")} ${rtlClass.mr(isRTL, "2")}`}>
```

#### Borders

```tsx
// ❌ Before
<div className="border-l">

// ✅ After
<div className={rtlClass.borderL(isRTL)}>
```

#### Icons (directional)

```tsx
// ❌ Before
<ChevronRight />

// ✅ After
<ChevronRight className={isRTL ? "rotate-180" : ""} />
```

### Tailwind RTL Variants

You can also use Tailwind's built-in RTL variants:

```tsx
<div className="
  rtl:mr-4 ltr:ml-4
  rtl:border-r ltr:border-l
  rtl:text-right ltr:text-left
">
  Content
</div>
```

---

## 🤖 AI Prompts Translation

### How It Works

AI prompts are now fully translatable! The system automatically uses the correct language for AI generation.

**Files:**
- [`lib/prompts/prompts-i18n.ts`](lib/prompts/prompts-i18n.ts) - Prompt translations
- [`lib/ai.ts`](lib/ai.ts) - Updated to use i18n prompts

### Adding Translated Prompts

Edit [`lib/prompts/prompts-i18n.ts`](lib/prompts/prompts-i18n.ts):

```typescript
export const PROMPTS = {
  myNewPrompt: {
    en: `You are an expert. Do this task: {taskDescription}`,
    fa: `شما یک متخصص هستید. این کار را انجام دهید: {taskDescription}`,
    ar: `أنت خبير. قم بهذه المهمة: {taskDescription}`,
  },
};
```

### Using Translated Prompts

```typescript
import { buildPrompt } from "@/lib/prompts/prompts-i18n";

// Get prompt in user's language
const prompt = buildPrompt(
  "myNewPrompt",
  locale,  // "en" | "fa" | "ar"
  { taskDescription: "Build a todo app" }
);

// Use with AI
const result = await generateWithFallback(prompt);
```

### Current Translated Prompts

All major prompts are translated:
- ✅ `generatePlan` - Plan generation
- ✅ `generatePrototype` - Frontend generation
- ✅ `refinePlan` - Plan refinement
- ✅ `generateBackend` - Backend generation

---

## 🎯 Design Principles

### 1. Consistency
- Always use semantic color names (`brand-primary`, not `orange-500`)
- Always use translation keys, never hardcode text
- Always use RTL utilities for positioning

### 2. Accessibility
- All text meets WCAG AA contrast ratios
- All interactive elements have proper focus states
- All UI elements are keyboard navigable

### 3. Responsiveness
- Mobile-first approach
- Works on all screen sizes
- Touch-friendly on mobile

### 4. Performance
- CSS variables for instant theme switching
- Lazy loading for translations
- Optimized bundle size

---

## 🎨 Current Design Patterns

### Color Scheme (Amber & Green System)

The app uses a warm, professional color scheme with amber as the primary brand color and green as accent:

**Brand Colors (Amber/Gold):**
- Primary actions: `from-amber-400 to-yellow-600`
- Hover states: `from-amber-500 to-yellow-700`
- Popular/Pro tier badges: `bg-amber-500/20 text-amber-600`
- Icons and accents: `text-amber-500` or `text-amber-600`

**Accent Colors (Green):**
- Unlimited tier: `from-green-500 to-emerald-500`
- Success states: `bg-green-600`
- Daily bonus highlights: `bg-gradient-to-r from-green-500/10 to-emerald-500/10`

**Neutral Backgrounds:**
- Base: `bg-background-base` (light cream)
- Raised cards: `bg-background-raised` (white)
- Subtle elements: `bg-background-subtle` (very light gray)

### Component Patterns

#### 1. Cards with Gradient Headers
Modern card design with subtle gradient headers for visual hierarchy:

```tsx
<div className="bg-background-raised rounded-2xl border border-border-light overflow-hidden shadow-lg">
  {/* Gradient Header */}
  <div className="bg-gradient-to-r from-amber-400/10 to-yellow-600/10 p-6 border-b border-border-light">
    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-md">
        <Icon className="w-5 h-5 text-white" />
      </div>
      Title
    </h3>
    <p className="text-text-secondary text-sm mt-2">Description</p>
  </div>

  {/* Content */}
  <div className="p-8">
    {/* Content here */}
  </div>
</div>
```

#### 2. Package/Tier Badges
Consistent badge design for showing subscription tiers:

```tsx
{/* Pro Package */}
<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-600 border border-amber-500/30 text-sm font-semibold">
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
  Pro Plan
</div>

{/* Unlimited Package */}
<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-600 border border-green-500/30 text-sm font-semibold">
  {/* Same structure */}
</div>

{/* Free Tier */}
<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-500/20 text-gray-600 border border-gray-500/30 text-sm font-semibold">
  {/* Info icon for free tier */}
</div>
```

#### 3. Stats Grid
Clean stat display with subtle backgrounds:

```tsx
<div className="grid grid-cols-2 gap-4">
  <div className="p-4 bg-background-subtle rounded-xl border border-border-light">
    <div className="text-text-tertiary text-xs font-medium mb-1.5">Available</div>
    <div className="font-bold text-2xl text-text-primary">150K</div>
  </div>
  <div className="p-4 bg-background-subtle rounded-xl border border-border-light">
    <div className="text-text-tertiary text-xs font-medium mb-1.5">Used</div>
    <div className="font-bold text-2xl text-text-secondary">50K</div>
  </div>
</div>
```

#### 4. Gradient Progress Bars
Dynamic progress bars with color-coded states:

```tsx
{/* Container with inner shadow */}
<div className="relative h-3 bg-background-subtle rounded-full overflow-hidden shadow-inner">
  <div
    className="h-full transition-all duration-700 ease-out bg-gradient-to-r from-green-500 to-emerald-500 shadow-sm"
    style={{ width: `${percentage}%` }}
  />
</div>
```

Color states:
- `> 50%`: `from-green-500 to-emerald-500` (healthy)
- `20-50%`: `from-yellow-500 to-amber-500` (warning)
- `< 20%`: `from-red-500 to-rose-500` (critical)

#### 5. Icon Containers
Consistent icon button/container styling:

```tsx
{/* Small icons (profile, badges) */}
<div className="w-8 h-8 rounded-lg bg-background-subtle group-hover:bg-brand-primary/10 flex items-center justify-center transition-colors">
  <svg className="w-4 h-4 text-text-secondary group-hover:text-brand-primary transition-colors">
    {/* Icon path */}
  </svg>
</div>

{/* Medium icons (headers, sections) */}
<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400/20 to-yellow-600/20 flex items-center justify-center">
  <svg className="w-5 h-5 text-amber-600">
    {/* Icon path */}
  </svg>
</div>

{/* Large icons (gradient, prominent) */}
<div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg">
  <svg className="w-6 h-6 text-white">
    {/* Icon path */}
  </svg>
</div>
```

#### 6. Call-to-Action Buttons
Primary action buttons with gradients and icons:

```tsx
{/* Primary CTA */}
<button className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-500 hover:to-yellow-700 text-white text-sm font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2">
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
  Get More Tokens
</button>

{/* Secondary/Green CTA */}
<button className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md">
  {/* Content */}
</button>
```

#### 7. Alert/Warning Boxes
Contextual feedback with consistent styling:

```tsx
{/* Low balance warning */}
<div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
  <div className="flex items-center gap-3">
    <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      {/* Warning icon */}
    </svg>
    <div className="flex-1">
      <p className="text-red-700 dark:text-red-600 font-semibold text-sm">Running low on tokens</p>
      <p className="text-red-600 dark:text-red-500 text-xs">Top up to keep building amazing apps</p>
    </div>
  </div>
</div>

{/* Success/Bonus highlight */}
<div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
        {/* Plus icon */}
      </svg>
    </div>
    <div className="flex-1">
      <div className="text-text-secondary text-sm font-medium">Daily Bonus</div>
      <div className="font-bold text-green-600">+5K</div>
    </div>
  </div>
</div>
```

### Typography Scale

**Headings:**
- Page title: `text-5xl md:text-6xl font-bold`
- Section header: `text-4xl font-bold`
- Card title: `text-2xl font-bold`
- Subsection: `text-lg font-bold`

**Body:**
- Primary: `text-base text-text-primary`
- Secondary: `text-sm text-text-secondary`
- Tertiary: `text-xs text-text-tertiary`

**Stats/Numbers:**
- Large: `text-2xl font-bold text-text-primary`
- Medium: `text-lg font-bold`
- Small: `text-base font-semibold`

### Spacing System

Consistent use of Tailwind spacing:
- Card padding: `p-6` or `p-8`
- Section gaps: `gap-6` or `gap-8`
- Element margins: `mb-4`, `mb-6`, `mt-2`, `mt-3`
- Grid gaps: `gap-4` (stats), `gap-8` (cards)

### Border Radius

- Cards: `rounded-2xl`
- Buttons: `rounded-lg`
- Badges: `rounded-full` or `rounded-lg`
- Icons: `rounded-lg` or `rounded-full`
- Progress bars: `rounded-full`

### Shadows

- Cards: `shadow-lg`
- Buttons: `shadow-md hover:shadow-lg`
- Icons (prominent): `shadow-md`
- Progress bars: `shadow-inner` (container), `shadow-sm` (bar)
- Dropdowns: `shadow-xl`

---

## 📁 File Structure

```
/lib
  /theme
    theme-config.ts      ← Define and switch themes here
    ThemeProvider.tsx    ← Theme provider component
  /prompts
    prompts-i18n.ts      ← AI prompts in all languages
  language-context.tsx   ← Language/RTL context
  rtl-utils.ts          ← RTL utility functions
  i18n.ts               ← i18n configuration

/messages
  en.json               ← English translations
  fa.json               ← Farsi translations (complete!)
  ar.json               ← Arabic translations

/app
  layout.tsx            ← Root layout with providers

tailwind.config.js      ← Tailwind config with theme
```

---

## 🚀 Quick Start Checklist

### To Change Theme:
- [ ] Open [`lib/theme/theme-config.ts`](lib/theme/theme-config.ts)
- [ ] Change `activeTheme` to desired theme
- [ ] Save - done!

### To Enable Farsi:
- [ ] Add `<LanguageSwitcher />` to your header
- [ ] Update components to use `useTranslations()`
- [ ] Test RTL layout
- [ ] Done!

### To Create New Theme:
- [ ] Copy an existing theme in [`lib/theme/theme-config.ts`](lib/theme/theme-config.ts)
- [ ] Change all color values
- [ ] Set as `activeTheme`
- [ ] Test with components

### To Add Translation:
- [ ] Add key to [`messages/en.json`](messages/en.json)
- [ ] Add translation to [`messages/fa.json`](messages/fa.json)
- [ ] Use in component with `useTranslations()`
- [ ] Done!

---

## 💡 Pro Tips

1. **Theme Switching is Instant**: No rebuild needed, just change `activeTheme` and save.

2. **Farsi is 90% Ready**: Just add the language switcher to start using it!

3. **RTL Auto-Detects**: When locale is `fa` or `ar`, RTL activates automatically.

4. **AI Speaks Farsi**: The AI will respond in the user's selected language automatically.

5. **Use Semantic Names**: Always use `brand-primary` instead of hardcoded colors for theme consistency.

6. **Test Both Directions**: Always test your components in both LTR and RTL modes.

---

## 🐛 Common Issues

### Theme not changing?
- Make sure you're using semantic color names (`bg-brand-primary`)
- Check that `ThemeProvider` is in the root layout
- Clear browser cache

### RTL not working?
- Check that `LanguageProvider` wraps your app
- Use RTL utilities (`rtlClass.*`) for directional styles
- Test with `locale="fa"` in the language switcher

### Translations not showing?
- Make sure component is marked with `"use client"`
- Check that the key exists in the JSON file
- Verify the translation namespace matches

---

## 📞 Support

For issues or questions:
- Check this documentation first
- Review example components in `/components`
- See RTL infrastructure docs in [`RTL_INFRASTRUCTURE.md`](RTL_INFRASTRUCTURE.md)

---

**Last Updated:** October 22, 2025
**Version:** 2.1.0 - Dynamic Theme + Full i18n + Modern Design Patterns
