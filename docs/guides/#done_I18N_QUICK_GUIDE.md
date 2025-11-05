# 🌍 Quick Farsi Translation Guide

## Enable Farsi in 3 Steps

### Step 1: Add Language Switcher (1 minute)

The `LanguageSwitcher` component already exists at [`components/LanguageSwitcher.tsx`](components/LanguageSwitcher.tsx).

**Add it to your header/navbar:**

```tsx
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Header() {
  return (
    <header>
      <nav>
        {/* Your existing nav items */}
        <LanguageSwitcher /> {/* Add this */}
      </nav>
    </header>
  );
}
```

### Step 2: Use Translations in Components (2 minutes)

**Before (hardcoded):**
```tsx
export function MyPage() {
  return (
    <div>
      <h1>Welcome</h1>
      <p>Get started now</p>
      <button>Sign In</button>
    </div>
  );
}
```

**After (translatable):**
```tsx
"use client"; // Add this!

import { useTranslations } from "next-intl";

export function MyPage() {
  const t = useTranslations("landing");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("subtitle")}</p>
      <button>{t("signIn")}</button>
    </div>
  );
}
```

### Step 3: Test It! (30 seconds)

1. Click the language switcher
2. Select "فارسی" (Farsi)
3. Watch the magic! ✨

The entire app:
- Switches to Farsi text
- Switches to RTL layout
- AI responds in Farsi
- Everything mirrors automatically

---

## Available Translations

All text is already translated in [`messages/fa.json`](messages/fa.json):

- ✅ Landing page
- ✅ Project pages
- ✅ Chat interface
- ✅ Authentication
- ✅ Sidebar
- ✅ Settings
- ✅ Pricing
- ✅ Error messages
- ✅ Success messages
- ✅ Common UI elements
- ✅ AI prompts

---

## Translation Reference

### Common Sections

```tsx
const t = useTranslations("landing");
t("title")       // "Vibebaba" → "وایب‌بابا"
t("subtitle")    // "Turn your ideas..." → "ایده‌هایتان را..."
t("signIn")      // "Sign In" → "ورود"
```

```tsx
const t = useTranslations("project");
t("planning")         // "Planning Stage" → "مرحله برنامه‌ریزی"
t("generatingPlan")   // "Generating plan..." → "در حال تولید طرح..."
```

```tsx
const t = useTranslations("auth");
t("email")       // "Email" → "ایمیل"
t("password")    // "Password" → "رمز عبور"
```

```tsx
const t = useTranslations("common");
t("loading")     // "Loading..." → "در حال بارگذاری..."
t("save")        // "Save" → "ذخیره"
```

### Full Translation Structure

See [`messages/fa.json`](messages/fa.json) for all available translations:

```json
{
  "landing": { ... },    // Landing page
  "project": { ... },    // Project pages
  "chat": { ... },       // Chat
  "auth": { ... },       // Authentication
  "sidebar": { ... },    // Sidebar
  "settings": { ... },   // Settings
  "pricing": { ... },    // Pricing
  "errors": { ... },     // Errors
  "success": { ... },    // Success messages
  "common": { ... },     // Common UI
  "prompts": { ... }     // AI prompts
}
```

---

## Adding New Translations

### 1. Add to English ([`messages/en.json`](messages/en.json))

```json
{
  "mySection": {
    "greeting": "Hello",
    "farewell": "Goodbye"
  }
}
```

### 2. Add Farsi Translation ([`messages/fa.json`](messages/fa.json))

```json
{
  "mySection": {
    "greeting": "سلام",
    "farewell": "خداحافظ"
  }
}
```

### 3. Use in Component

```tsx
const t = useTranslations("mySection");
<p>{t("greeting")}</p>  // Shows "Hello" or "سلام"
```

---

## RTL Support (Automatic!)

When user selects Farsi or Arabic:
- ✅ Text direction switches to RTL
- ✅ Layout mirrors (left becomes right)
- ✅ Icons flip correctly
- ✅ All components adapt

**No extra work needed!** Components using RTL utilities automatically adjust.

---

## AI in Farsi

AI prompts are automatically translated! When a user:
1. Selects Farsi language
2. Generates an app plan
3. AI responds in Farsi ✨

**The AI understands Farsi context and generates plans in Farsi!**

This is powered by [`lib/prompts/prompts-i18n.ts`](lib/prompts/prompts-i18n.ts).

---

## Testing Farsi Mode

### Quick Test Checklist

- [ ] Add language switcher to header
- [ ] Switch to Farsi
- [ ] Check text is in Farsi
- [ ] Check layout is RTL (sidebar on right)
- [ ] Check buttons and forms work
- [ ] Try generating an app plan (should be in Farsi)
- [ ] Check all pages translate

---

## Component Patterns

### Server Components (Page-level)

```tsx
import { getTranslations } from "next-intl/server";

export default async function MyPage() {
  const t = await getTranslations("landing");

  return <h1>{t("title")}</h1>;
}
```

### Client Components (Interactive)

```tsx
"use client";

import { useTranslations } from "next-intl";

export function MyComponent() {
  const t = useTranslations("landing");

  return <button>{t("button")}</button>;
}
```

### With Dynamic Values

```tsx
const t = useTranslations("errors");

// In messages/en.json:
// "welcome": "Welcome, {name}!"

t("welcome", { name: "John" })  // "Welcome, John!"
```

---

## Pro Tips

✅ **Always use `"use client"`** for components using `useTranslations()`

✅ **Test both languages** - Make sure nothing breaks in Farsi

✅ **Keep keys in English** - Translation keys should always be in English

✅ **Namespace wisely** - Group related translations together

✅ **RTL is automatic** - No special code needed for RTL layout

---

## Common Issues

### Translations not showing?
- Add `"use client"` to component
- Check key exists in JSON file
- Verify namespace matches (e.g., `"landing"`)

### RTL not working?
- Check language switcher is working
- Verify `LanguageProvider` wraps app
- Test with `locale="fa"`

### AI not in Farsi?
- Check locale is being passed to API
- Verify [`lib/prompts/prompts-i18n.ts`](lib/prompts/prompts-i18n.ts) has Farsi prompts

---

## What's Already Done

✅ All translation files created and complete
✅ Language context provider set up
✅ RTL utilities implemented
✅ AI prompts translated
✅ Theme system supports RTL
✅ Components ready for i18n

**You just need to add the language switcher and use `useTranslations()` in components!**

---

## Next Steps

1. **Add `<LanguageSwitcher />`** to your header
2. **Update main pages** to use `useTranslations()`
3. **Test Farsi mode** end-to-end
4. **Deploy** and enjoy multilingual support! 🎉

---

For more details, see:
- [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) - Full design system docs
- [`RTL_INFRASTRUCTURE.md`](RTL_INFRASTRUCTURE.md) - RTL implementation details
- [`messages/fa.json`](messages/fa.json) - All Farsi translations

**Last Updated:** October 20, 2025
**Status:** 🟢 Ready to use!
