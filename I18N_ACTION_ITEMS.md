# I18n Action Items - Priority & Implementation Guide

**Current Status:** 89/100 | Target: 95/100
**Time to 95:** ~1 hour total
**Time to 99:** ~6 hours total

---

## Priority 1: FIX HARDCODED STRINGS (30 minutes)

### Task 1.1: Fix `/components/chat/AIChat.tsx`

**Current Issues:**
```typescript
// Line 101 - Hardcoded placeholder
placeholder="Describe your app idea..."

// Line 161 - Hardcoded tooltip
"Plan First"

// Line 186 - Hardcoded alert message
alert('File upload is available in project chat!...')

// Line 207 - Hardcoded disclaimer
"Vibebaba can make mistakes. Please double-check responses."
```

**Fix:**
```typescript
"use client";

import { useTranslations } from "next-intl";  // ADD THIS

export default function AIChat() {
  const t = useTranslations("landing");        // ADD THIS
  
  // ... existing code ...
  
  return (
    <textarea
      placeholder={t("placeholder")}          // CHANGE LINE 101
      // ... rest of props ...
    />
  );
  
  // Line 161 - Change hardcoded tooltip:
  <span className="absolute -top-8 left-1/2 -translate-x-1/2 ...">
    {t("planToggle")}                         // ADD TO messages/*/en.json
  </span>
  
  // Line 186 - Change hardcoded alert:
  onClick={() => alert(t("fileUploadMessage"))}
  
  // Line 207 - Change hardcoded disclaimer:
  <p className="text-center text-xs mt-3 text-text-primary">
    {t("disclaimer")}
  </p>
}
```

**Files to modify:**
- [ ] `/components/chat/AIChat.tsx`
- [ ] `/messages/en.json` - Add keys:
  ```json
  {
    "landing": {
      "planToggle": "Plan First",
      "fileUploadMessage": "File upload is available in project chat!...",
      "disclaimer": "Vibebaba can make mistakes. Please double-check responses."
    }
  }
  ```
- [ ] `/messages/fa.json` - Add Persian translations

**Time:** 10 minutes

---

### Task 1.2: Fix `/app/projects/page.tsx`

**Current Issues:**
```typescript
// Line 136 - Hardcoded subtitle
<p className="text-xs text-text-tertiary">My Projects</p>

// Line 170 - Hardcoded title
<h1 className="text-3xl font-bold text-text-primary mb-2">My Projects</h1>

// Line 172 - Hardcoded delete message
if (confirm("Are you sure you want to delete this project?"))

// Line 249 - Hardcoded button text
"Create Your First Project"

// Line 255 - Hardcoded empty state text
"Start creating your first AI-powered application"
```

**Fix:**
```typescript
"use client";

import { useTranslations } from "next-intl";  // ADD THIS

export default function ProjectsPage() {
  const t = useTranslations("projects");      // ADD THIS
  const tCommon = useTranslations("common");
  
  // ... existing code ...
  
  // Line 136
  <p className="text-xs text-text-tertiary">
    {t("subtitle")}  {/* Uses existing key */}
  </p>
  
  // Line 170
  <h1 className="text-3xl font-bold text-text-primary mb-2">
    {t("title")}  {/* Uses existing key */}
  </h1>
  
  // Line 172
  if (confirm(t("deleteConfirm")))  {/* Already exists in translation */}
  
  // Line 249
  <span>{t("createFirst")}</span>
  
  // Line 255
  <p>{t("startCreating")}</p>
}
```

**Files to modify:**
- [ ] `/app/projects/page.tsx`
- [ ] Verify `/messages/en.json` has all keys (they likely already exist!)
  ```json
  {
    "projects": {
      "title": "My Projects",
      "subtitle": "Manage your AI-powered applications",
      "deleteConfirm": "Are you sure you want to delete this project?",
      "createFirst": "Create Your First Project",
      "startCreating": "Start creating your first AI-powered application"
    }
  }
  ```

**Check:** These keys might already exist in en.json, just need to use them instead of hardcoding!

**Time:** 10 minutes

---

### Task 1.3: Fix `/app/page.tsx`

**Current Issues:**
```typescript
// Line 135 - Hardcoded brand name (appears 2+ times)
<h1 className="text-lg font-bold text-text-primary">Vibebaba</h1>

// Line 136 - Hardcoded tagline
<p className="text-xs text-text-tertiary">AI App Builder</p>
```

**Decision Point:**
These could either:
1. Stay hardcoded (brand name) ✅ RECOMMENDED
2. Be moved to translations (for consistency) ⚠️ Unnecessary

**Recommendation:** Keep hardcoded since "Vibebaba" is a brand name that doesn't translate, but make tagline translatable:

```typescript
export default function Home() {
  const t = useTranslations("landing");
  
  return (
    <>
      {/* Logo - keep brand name hardcoded */}
      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 ...">
        <span className="text-white font-bold text-xl">V</span>
      </div>
      <div>
        <h1 className="text-lg font-bold text-text-primary">Vibebaba</h1>
        <p className="text-xs text-text-tertiary">{t("tagline")}</p>
      </div>
    </>
  );
}
```

**Files to modify:**
- [ ] `/app/page.tsx` - Use `t("tagline")`
- [ ] `/messages/en.json` - Add:
  ```json
  {
    "landing": {
      "tagline": "AI App Builder"
    }
  }
  ```
- [ ] `/messages/fa.json` - Add Persian translation

**Time:** 5 minutes

---

## Priority 2: COMPLETE ARABIC SUPPORT (2 hours)

### Task 2.1: Complete Arabic Translation (90 minutes)

**Current Status:** ar.json only 35% complete

**Files to translate:**
Check which keys are missing in ar.json by comparing with en.json:

```bash
# Count keys in each file
# en.json: 247 keys
# ar.json: 63 keys
# Missing: ~184 keys (75%)
```

**Sections to add to ar.json:**
- [ ] auth (17 keys) - MISSING
- [ ] chat (7 keys) - Partial
- [ ] common (32 keys) - MISSING
- [ ] errors (8 keys) - MISSING
- [ ] pricing (24 keys) - MISSING
- [ ] settings (10 keys) - MISSING
- [ ] sidebar (13 keys) - MISSING
- [ ] success (6 keys) - MISSING

**Options:**
1. Manual translation (2 hours)
2. Use translation service (Google Translate as base, then review)
3. Contact Arabic speaker for review

**Approach:**
```bash
# Option A: Copy en.json structure, use Google Translate
cp en.json ar.json.temp
# Then manually translate or use translation service

# Option B: Use ChatGPT
# "Translate this JSON to Arabic (ar):" [paste en.json]
```

**Time:** 90 minutes

---

### Task 2.2: Add Arabic to Language Switcher (15 minutes)

**Current file:** `/components/LanguageSwitcher.tsx`

```typescript
const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "fa", name: "فارسی", flag: "🇮🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },  // ADD THIS
];
```

**Also update:**
- [ ] `/i18n.config.ts` - Add 'ar' to locales array:
  ```typescript
  export const i18n = {
    defaultLocale: 'en',
    locales: ['en', 'fa', 'ar'],  // ADD 'ar'
  } as const;
  ```

**Time:** 10 minutes

---

### Task 2.3: Test Arabic Rendering (15 minutes)

**Checklist:**
- [ ] Switch to Arabic language
- [ ] Verify all text appears in Arabic
- [ ] Check RTL layout (should be RTL for Arabic)
- [ ] Verify Arabic font (IRANSansX)
- [ ] Test sidebar, modals, buttons
- [ ] Test form inputs with Arabic text

**Time:** 15 minutes

---

## Priority 3: URL-BASED LOCALE ROUTING (4 hours) - OPTIONAL

### Would Improve SEO & Link Sharing

**Current:** `/projects` with locale from context
**Goal:** `/en/projects` and `/fa/projects` with locale from URL

**Implementation Steps:**
1. Update middleware to detect locale from URL
2. Create locale prefix routes
3. Update language switcher to change URL
4. Update metadata with hreflang links

**Impact:**
- ✅ Better SEO (separate language indexing)
- ✅ Shareable links preserve language
- ✅ Server-side language detection
- ✅ Accept-Language header support

**This is Optional** - Current implementation works fine!

---

## Priority 4: ENHANCED NUMBER/DATE FORMATTING (2 hours)

### Add Utility Functions

**Location:** Create `/lib/i18n-utils.ts`

```typescript
/**
 * Format number with Persian numerals
 */
export function formatPersianNumber(num: number | string): string {
  const persianNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, (digit) => persianNumerals[parseInt(digit)]);
}

/**
 * Format date in locale-aware format
 */
export function formatLocalizedDate(
  date: Date,
  locale: string,
  format: 'short' | 'long' = 'short'
): string {
  const options: Intl.DateTimeFormatOptions = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
  }[format];

  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : locale, options).format(date);
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : locale, {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}
```

**Usage in components:**
```typescript
import { formatPersianNumber, formatLocalizedDate } from '@/lib/i18n-utils';

<p>{formatPersianNumber(1234)}</p>  // "۱۲۳۴"
<p>{formatLocalizedDate(new Date(), locale)}</p>
```

**Time:** 2 hours (implementation + testing)

---

## Quick Implementation Order

### Session 1: 30 minutes (Get to 91/100)
1. Fix AIChat.tsx hardcoded strings ✅
2. Fix projects/page.tsx hardcoded strings ✅
3. Fix page.tsx tagline ✅

### Session 2: 2 hours (Get to 95/100)
4. Complete Arabic translations ✅
5. Add Arabic to language switcher ✅
6. Test Arabic rendering ✅

### Session 3: Optional (Get to 98/100)
7. Add i18n utility functions (numbers, dates)
8. Update date formatting to use utilities
9. Add currency formatting

### Session 4: Advanced (Get to 99/100)
10. Implement URL-based locale routing
11. Add hreflang metadata
12. Set up automated translation validation

---

## Testing Commands

```bash
# After making changes, verify translations load:
npm run dev

# Test language switching:
# 1. Go to landing page
# 2. Click language switcher
# 3. Switch to Persian
# 4. Verify all text updates
# 5. Reload page - verify language persists

# Build and test:
npm run build
npm run start
```

---

## Files Checklist

**Modify (Priority 1):**
- [ ] `/components/chat/AIChat.tsx`
- [ ] `/app/projects/page.tsx`
- [ ] `/app/page.tsx`
- [ ] `/messages/en.json` (add new keys)
- [ ] `/messages/fa.json` (add Persian translations)

**Modify (Priority 2):**
- [ ] `/messages/ar.json` (complete translation)
- [ ] `/components/LanguageSwitcher.tsx` (add Arabic)
- [ ] `/i18n.config.ts` (add 'ar' to locales)

**Create (Priority 4):**
- [ ] `/lib/i18n-utils.ts` (new utility functions)

**Modify (Priority 3 - Optional):**
- [ ] `/middleware.ts` (add locale detection)
- [ ] `/app/layout.tsx` (update metadata)

---

## Estimated Time Summary

| Priority | Task | Time | Impact |
|----------|------|------|--------|
| 1 | Fix 4 hardcoded strings | 30 min | +2% (to 91/100) |
| 2 | Complete Arabic & switcher | 2 hrs | +4% (to 95/100) |
| 4 | i18n utilities | 2 hrs | +2% (to 97/100) |
| 3 | URL-based routing | 4 hrs | +2% (to 99/100) |
| - | Automation & tests | 2 hrs | +1% (to 100/100) |

**Total to 95/100:** ~2.5 hours
**Total to 99/100:** ~8.5 hours

---

## Success Criteria

### Priority 1 ✅ (30 min)
- [ ] No hardcoded strings in AIChat.tsx
- [ ] No hardcoded strings in projects/page.tsx
- [ ] All new translation keys added
- [ ] Persian translations added
- [ ] All pages render correctly in both languages

### Priority 2 ✅ (2 hours)
- [ ] ar.json 100% complete
- [ ] Arabic in language switcher
- [ ] Can switch to Arabic and see translations
- [ ] RTL layout works for Arabic
- [ ] Arabic fonts render correctly

### Priority 4 ✅ (2 hours)
- [ ] Number formatting utility created
- [ ] Date formatting utility created
- [ ] Currency formatting utility created
- [ ] Used in at least 2 components
- [ ] Tests passing

---

**Next Step:** Start with Priority 1 (30 minutes) to quickly reach 91/100!
