# RTL Infrastructure Documentation

## Overview

The Vibebaba app now has complete RTL (Right-to-Left) infrastructure ready for Arabic and other RTL languages. The system is fully set up but not actively translating yet - you can easily enable RTL support when ready.

---

## 🎯 What's Included

### 1. Language Context Provider

**File**: `lib/language-context.tsx`

- Manages current locale: `"en"` | `"fa"` | `"ar"`
- Provides `dir` state: `"ltr"` | `"rtl"`
- Auto-updates HTML `dir` and `lang` attributes
- Stores user preference in localStorage
- URL-based locale routing ready

**Usage**:
```tsx
import { useLanguage } from "@/lib/language-context";

function MyComponent() {
  const { locale, setLocale, dir } = useLanguage();
  const isRTL = dir === "rtl";

  return <div>{isRTL ? "RTL Mode" : "LTR Mode"}</div>;
}
```

---

### 2. RTL Utility Functions

**File**: `lib/rtl-utils.ts`

Helper functions for RTL-aware styling:

#### Class Utilities
```tsx
import { rtlClass } from "@/lib/rtl-utils";

// Positioning
rtlClass.left(isRTL); // Returns "right" if RTL, "left" if LTR
rtlClass.right(isRTL); // Returns "left" if RTL, "right" if LTR

// Padding
rtlClass.pl(isRTL, "4"); // Returns "pr-4" if RTL, "pl-4" if LTR
rtlClass.pr(isRTL, "6"); // Returns "pl-6" if RTL, "pr-6" if LTR

// Margin
rtlClass.ml(isRTL, "auto"); // Returns "mr-auto" if RTL, "ml-auto" if LTR
rtlClass.mr(isRTL, "2"); // Returns "ml-2" if RTL, "mr-2" if LTR

// Borders
rtlClass.borderL(isRTL); // Returns "border-r" if RTL, "border-l" if LTR
rtlClass.borderR(isRTL); // Returns "border-l" if RTL, "border-r" if LTR

// Rounded corners
rtlClass.roundedL(isRTL, "lg"); // Returns "rounded-r-lg" if RTL
rtlClass.roundedR(isRTL); // Returns "rounded-l" if RTL

// Text alignment
rtlClass.textLeft(isRTL); // Returns "text-right" if RTL
rtlClass.textRight(isRTL); // Returns "text-left" if RTL
```

#### Style Object Utilities
```tsx
import { rtlStyle } from "@/lib/rtl-utils";

// For inline styles
const styles = {
  ...rtlStyle.left(isRTL, "20px"), // { right: "20px" } if RTL
  ...rtlStyle.paddingLeft(isRTL, 16), // { paddingRight: 16 } if RTL
};
```

#### Transform Utilities
```tsx
import { flipTransform, rtlRotate } from "@/lib/rtl-utils";

flipTransform(isRTL, "translateX(10px)"); // "translateX(-10px)" if RTL
rtlRotate(isRTL, "arrow"); // "rotate-180" if RTL for arrow icons
```

---

### 3. Global CSS Support

**File**: `app/globals.css`

RTL-specific CSS classes already defined:

```css
/* Direction attributes */
[dir="rtl"] {
  direction: rtl;
}

[dir="ltr"] {
  direction: ltr;
}

/* Mirror utility for icons */
[dir="rtl"] .rtl\:mirror {
  transform: scaleX(-1);
}

/* Text alignment */
[dir="rtl"] .rtl\:text-right {
  text-align: right;
}

[dir="ltr"] .ltr\:text-left {
  text-align: left;
}
```

**Usage in HTML**:
```html
<div class="rtl:mirror">←</div> <!-- Arrow flips in RTL -->
<p class="rtl:text-right">Text</p> <!-- Right-aligned in RTL -->
```

---

### 4. RTL-Ready Components

#### ProjectsSidebar
- Automatically switches sides (left ↔ right)
- Icon position adjusts for RTL
- Border direction switches

**Implementation**:
```tsx
// Icon position
className={`fixed ${isRTL ? 'right-4' : 'left-4'} top-4`}

// Sidebar position
className={`fixed ${isRTL ? 'right-0 border-l' : 'left-0 border-r'}`}
```

#### AuthModal
- Imports `useLanguage` hook
- Ready for RTL text direction
- Can be extended with RTL styles

#### Root Layout
- `LanguageProvider` wraps entire app
- HTML attributes set: `lang` and `dir`
- Direction auto-updates on locale change

---

## 📋 Components Updated

### ✅ RTL-Ready Components

1. **ProjectsSidebar** (`components/ProjectsSidebar.tsx`)
   - Position switches (left/right)
   - Border direction adjusts
   - Icon position mirrors

2. **AuthModal** (`components/auth/AuthModal.tsx`)
   - Has `useLanguage` hook imported
   - Ready for direction-aware styling

3. **Root Layout** (`app/layout.tsx`)
   - LanguageProvider wrapping
   - HTML `dir` attribute set

---

## 🚀 How to Enable RTL (When Ready)

### Step 1: Create Translation Files

Create message files for each locale:

```
messages/
  ├── en.json  (Already exists)
  ├── ar.json  (Create for Arabic)
  └── fa.json  (Create for Farsi)
```

Example `ar.json`:
```json
{
  "homepage": {
    "title": "فيببابا",
    "subtitle": "حول أفكارك إلى تطبيقات كاملة",
    "signIn": "تسجيل الدخول",
    "getStarted": "ابدأ الآن"
  },
  "auth": {
    "signIn": "تسجيل الدخول",
    "signUp": "إنشاء حساب",
    "email": "البريد الإلكتروني",
    "password": "كلمة المرور",
    "name": "الاسم"
  },
  "sidebar": {
    "projects": "المشاريع",
    "noProjects": "لا توجد مشاريع بعد",
    "startCreating": "ابدأ بإنشاء التطبيقات مع الذكاء الاصطناعي!"
  }
}
```

### Step 2: Add Language Switcher

Create a component to switch languages:

```tsx
// components/LanguageSwitcher.tsx
"use client";

import { useLanguage } from "@/lib/language-context";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as any)}
      className="px-3 py-2 border border-black rounded-lg"
    >
      <option value="en">English</option>
      <option value="ar">العربية</option>
      <option value="fa">فارسی</option>
    </select>
  );
}
```

### Step 3: Use Translations in Components

```tsx
import { useTranslations } from "next-intl";

function HomePage() {
  const t = useTranslations("homepage");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("subtitle")}</p>
    </div>
  );
}
```

### Step 4: Test RTL Mode

Temporarily force RTL to test:

```tsx
// In LanguageProvider or any component
useEffect(() => {
  setLocale("ar"); // Force Arabic
}, []);
```

---

## 🎨 Design Considerations for RTL

### Text Alignment
- Auto-adjusts with `dir` attribute
- Use utility classes when needed

### Icons
- Directional icons (arrows, chevrons) should mirror
- Use `rtl:mirror` class or `rtlRotate()` function

### Layouts
- Sidebar: left ↔ right
- Navigation: menu order may need reversal
- Forms: labels typically stay above inputs

### Spacing
- `padding-left` ↔ `padding-right`
- `margin-left` ↔ `margin-right`
- Use `rtlClass` utilities

---

## 📝 Component RTL Checklist

When making a component RTL-ready:

1. **Import the hook**:
   ```tsx
   import { useLanguage } from "@/lib/language-context";
   const { dir } = useLanguage();
   const isRTL = dir === "rtl";
   ```

2. **Position classes**:
   ```tsx
   // Before
   className="fixed left-0"

   // After
   className={`fixed ${isRTL ? 'right-0' : 'left-0'}`}
   ```

3. **Padding/Margin**:
   ```tsx
   // Before
   className="pl-4 mr-2"

   // After
   import { rtlClass } from "@/lib/rtl-utils";
   className={`${rtlClass.pl(isRTL, "4")} ${rtlClass.mr(isRTL, "2")}`}
   ```

4. **Borders**:
   ```tsx
   // Before
   className="border-l"

   // After
   className={rtlClass.borderL(isRTL)}
   ```

5. **Icons** (directional):
   ```tsx
   // Add mirror class
   className={`icon ${dir === "rtl" ? "rtl:mirror" : ""}`}
   ```

6. **Text Alignment** (if needed):
   ```tsx
   className={rtlClass.textLeft(isRTL)}
   ```

---

## 🔧 Current Status

### ✅ Infrastructure Complete
- [x] Language context provider
- [x] RTL utility functions
- [x] Global CSS support
- [x] HTML dir attribute switching
- [x] Sidebar RTL support
- [x] Auth components prepared

### ⏳ Not Yet Implemented
- [ ] Translation files (en.json, ar.json, fa.json)
- [ ] Language switcher UI
- [ ] Translated content in components
- [ ] All components made RTL-aware

---

## 🧪 Testing RTL

### Quick Test (Without Translations)

1. **Manually set direction**:
   ```tsx
   // In any component
   useEffect(() => {
     document.documentElement.dir = "rtl";
   }, []);
   ```

2. **Check sidebar**: Should move to right
3. **Check text**: Should align right
4. **Check icons**: Directional ones should flip

### Full Test (With Translations)

1. Add Arabic translation files
2. Create language switcher
3. Switch to Arabic
4. Verify all UI elements mirror correctly

---

## 📦 Files Modified/Created

### New Files
- `lib/rtl-utils.ts` - RTL utility functions

### Modified Files
- `app/layout.tsx` - Added LanguageProvider
- `components/ProjectsSidebar.tsx` - RTL-aware positioning
- `components/auth/AuthModal.tsx` - Added useLanguage hook
- `app/globals.css` - Already had RTL support

### Existing Files (Ready to Use)
- `lib/language-context.tsx` - Language context provider
- `lib/i18n.ts` - i18n configuration
- `i18n.config.ts` - i18n setup

---

## 🌍 Supported Languages

Currently configured for:
- **English** (`en`) - LTR
- **Persian/Farsi** (`fa`) - RTL
- **Arabic** (`ar`) - RTL

Add more in `lib/language-context.tsx`:
```tsx
type Locale = "en" | "fa" | "ar" | "he" | "ur"; // Add more RTL languages
```

---

## 💡 Best Practices

### 1. Always Use Utilities
```tsx
// ❌ Don't hardcode
<div className="ml-4 text-left">

// ✅ Do use utilities
<div className={`${rtlClass.ml(isRTL, "4")} ${rtlClass.textLeft(isRTL)}`}>
```

### 2. Test Both Directions
Always test in both LTR and RTL modes

### 3. Mirror Directional Icons
Arrows, chevrons, and navigation icons should flip

### 4. Avoid Fixed Positioning
Use logical properties or RTL utilities

### 5. Test with Real Content
Arabic text is longer than English - test overflow

---

## 🔄 Migration Path

When ready to fully implement RTL:

1. **Phase 1**: Create translation files (1-2 hours)
2. **Phase 2**: Add language switcher UI (30 mins)
3. **Phase 3**: Convert components to use translations (2-3 hours)
4. **Phase 4**: Test and fix RTL layouts (1-2 hours)
5. **Phase 5**: Add RTL-specific styling tweaks (1 hour)

**Total Estimated Time**: 5-8 hours

---

## 📚 Resources

- **Next-intl docs**: https://next-intl-docs.vercel.app/
- **Tailwind RTL**: https://tailwindcss.com/docs/text-align#rtl-support
- **RTL Styling Guide**: https://rtlstyling.com/

---

## ✅ Summary

Your app now has **complete RTL infrastructure** ready to go:

1. ✅ Language context managing locale and direction
2. ✅ RTL utility functions for easy styling
3. ✅ Global CSS with RTL support
4. ✅ Components updated with RTL hooks
5. ✅ Sidebar auto-switches sides
6. ✅ HTML dir attribute auto-updates

**To activate**: Just add translation files and enable the language switcher!

---

**Status**: 🟢 Infrastructure Complete, Ready for Translations
**Date**: October 20, 2025
**Version**: 1.0.0
