# i18n Quick Fixes - Copy & Paste Solutions

**Estimated Time: 30 minutes to implement all fixes**

---

## Fix #1: AIChat.tsx Hardcoded Strings

### Current Code (Has Issues)
```typescript
// /components/chat/AIChat.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/PocketBaseAuthProvider";
import { createProject } from "@/lib/project-helpers";

export default function AIChat() {
  // ... existing code ...
  
  return (
    <textarea
      placeholder="Describe your app idea..."  // ❌ HARDCODED
      // ...
    />
  );
}
```

### Fixed Code
```typescript
// /components/chat/AIChat.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/PocketBaseAuthProvider";
import { useTranslations } from "next-intl";  // ✅ ADD THIS
import { createProject } from "@/lib/project-helpers";

export default function AIChat() {
  const t = useTranslations("landing");  // ✅ ADD THIS
  const [description, setDescription] = useState("");
  // ... rest of state ...

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative bg-background-raised border border-light rounded-xl focus-within:border-brand-primary transition-colors">
        {/* Textarea */}
        <textarea
          id="app-idea"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder={t("placeholder")}  // ✅ FIXED
          className="w-full h-36 px-4 py-4 pr-20 text-base bg-transparent resize-none focus:outline-none text-left text-text-primary"
          disabled={isLoading}
        />

        {/* Cofounder Button - Bottom Left */}
        <div className="absolute left-3 bottom-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleCofounderClick}
            className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
              showCofounderTags
                ? 'bg-background-subtle text-text-primary'
                : 'bg-background-subtle text-text-secondary hover:bg-background-overlay hover:text-text-primary'
            }`}
            title={t("planToggle")}  // ✅ FIXED (uses new key)
          >
            {/* SVG unchanged */}
          </button>
          {/* Tags unchanged */}
        </div>

        {/* Plan Toggle, File Upload (Design), and Send Button */}
        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          {/* Plan Toggle */}
          <button
            type="button"
            onClick={() => setPlanningEnabled(!planningEnabled)}
            className={`p-2.5 rounded-lg flex items-center justify-center transition-all group relative ${
              planningEnabled
                ? 'bg-yellow-400/20 text-yellow-600 dark:text-yellow-400'
                : 'bg-background-subtle text-text-tertiary hover:bg-background-overlay hover:text-text-secondary'
            }`}
          >
            {/* Fast Tooltip */}
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap">
              {t("planToggle")}  {/* ✅ FIXED */}
            </span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </button>

          {/* File Upload Button (Design Inspiration Only) */}
          <button
            type="button"
            onClick={() => alert(t("fileUploadMessage"))}  // ✅ FIXED
            className="p-2.5 rounded-lg flex items-center justify-center transition-all group relative bg-background-subtle text-text-tertiary hover:bg-background-overlay hover:text-amber-400"
          >
            {/* Fast Tooltip */}
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap">
              Upload Files
            </span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!description.trim() || isLoading}
            className="p-2.5 bg-gradient-to-r from-amber-400 to-yellow-600 text-text-inverse rounded-lg hover:from-amber-500 hover:to-yellow-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title={isLoading ? t("common.loading") : "Submit"}
            aria-label="Submit"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Bottom disclaimer */}
      <p className="text-center text-xs mt-3 text-text-primary">
        {t("disclaimer")}  {/* ✅ FIXED */}
      </p>
    </form>
  );
}
```

### Update Translation Files

#### `/messages/en.json` - Add these keys:
```json
{
  "landing": {
    // ... existing keys ...
    "planToggle": "Plan First",
    "fileUploadMessage": "File upload is available in project chat! Create a project to upload design references and assets.",
    "disclaimer": "Vibebaba can make mistakes. Please double-check responses."
  }
}
```

#### `/messages/fa.json` - Add these keys:
```json
{
  "landing": {
    // ... existing keys ...
    "planToggle": "برنامه‌ریزی ابتدا",
    "fileUploadMessage": "بارگذاری فایل در چت پروژه در دسترس است! برای بارگذاری مراجع طراحی و دارایی‌ها یک پروژه ایجاد کنید.",
    "disclaimer": "وایب‌بابا می‌تواند اشتباه کند. لطفاً پاسخ‌ها را دوبار بررسی کنید."
  }
}
```

---

## Fix #2: projects/page.tsx Hardcoded Strings

### Current Code (Lines to Fix)
```typescript
// Line 136 - In header
<p className="text-xs text-text-tertiary">My Projects</p>

// Line 170 - Page title
<h1 className="text-3xl font-bold text-text-primary mb-2">My Projects</h1>

// Line 172 - Delete confirmation
if (confirm("Are you sure you want to delete this project?"))

// Line 249 - Empty state button
"Create Your First Project"

// Line 255 - Empty state text
"Start creating your first AI-powered application"
```

### Fixed Code (Minimal Changes)
```typescript
// /app/projects/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/PocketBaseAuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useLanguage } from "@/lib/language-context";
import { useTranslations } from "next-intl";  // ✅ ADD THIS
import { ProfileButton } from "@/components/auth/ProfileButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Footer } from "@/components/Footer";
import { listUserProjects } from "@/lib/project-helpers";
import type { ProjectData } from "@/lib/project-helpers";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();
  const { dir } = useLanguage();
  const isRTL = dir === "rtl";
  const t = useTranslations("projects");      // ✅ ADD THIS
  const tCommon = useTranslations("common");  // ✅ ADD THIS

  // ... existing code up to JSX ...

  return (
    <ProtectedRoute>
    <main className="min-h-screen bg-background-base flex flex-col">
      {/* Header */}
      <header className="h-16 sticky top-0 z-30 bg-background-base border-b border-light shadow-sm">
        <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary">Vibebaba</h1>
                <p className="text-xs text-text-tertiary">{t("title")}</p>  {/* ✅ FIXED */}
              </div>
            </button>
          </div>

          {/* Right Navigation */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Pricing Button */}
            <a
              href="/pricing"
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 text-white text-sm font-semibold rounded-xl hover:from-amber-500 hover:to-yellow-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pricing
            </a>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Profile */}
            <ProfileButton variant="compact" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  {t("title")}  {/* ✅ FIXED */}
                </h1>
                <p className="text-text-secondary">
                  {projects.length} {projects.length === 1 ? t("projectCount") : t("projectCount")}
                </p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-500 hover:to-yellow-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all group"
              >
                <svg
                  className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>{t("newProject")}</span>
              </button>
            </div>
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-6 bg-background-raised border border-light rounded-xl animate-pulse"
                >
                  <div className="h-4 bg-background-subtle rounded mb-3"></div>
                  <div className="h-3 bg-background-subtle rounded w-2/3 mb-4"></div>
                  <div className="h-3 bg-background-subtle rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-background-subtle flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-text-tertiary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">
                {t("noProjects")}
              </h2>
              <p className="text-text-secondary mb-6">
                {t("startCreating")}  {/* ✅ FIXED */}
              </p>
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-500 hover:to-yellow-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {t("createFirst")}  {/* ✅ FIXED */}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleProjectClick(project.id)}
                  className="group p-6 bg-background-raised hover:bg-background-subtle border border-light hover:border-brand-primary/30 rounded-xl cursor-pointer transition-all hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-2">
                        {project.description}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border ${getStageColor(project.stage)}`}>
                          {getStageBadge(project.stage)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteProject(project.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 text-text-secondary hover:text-red-500 rounded-lg transition-all"
                      aria-label={tCommon("delete")}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-text-tertiary">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDate(project.createdAt)}
                    </div>
                    {project.deployUrl && (
                      <div className="flex items-center gap-1 text-green-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {t("deployed") || "Deployed"}
                      </div>
                    )}
                  </div>

                  {project.plan && (
                    <div className="mt-4 pt-4 border-t border-light">
                      <p className="text-sm text-text-secondary line-clamp-2">
                        {truncateText(project.plan, 100)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </main>
    </ProtectedRoute>
  );
  
  // Update deleteProject function:
  const deleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t("deleteConfirm"))) {  // ✅ FIXED
      // ... rest of function
    }
  };
}
```

### Translation Files Already Have These Keys!
Check `/messages/en.json` and `/messages/fa.json` - these keys already exist:
- `projects.title` ✅
- `projects.newProject` ✅
- `projects.noProjects` ✅
- `projects.startCreating` ✅
- `projects.createFirst` ✅
- `projects.deleteConfirm` ✅

**No new translation keys needed!** Just reference the existing ones.

---

## Fix #3: page.tsx "AI App Builder" Tagline

### Current Code
```typescript
// /app/page.tsx - Multiple locations
<h1 className="text-lg font-bold text-text-primary">Vibebaba</h1>
<p className="text-xs text-text-tertiary">AI App Builder</p>
```

### Fixed Code
```typescript
// /app/page.tsx
"use client";

import dynamic from 'next/dynamic';
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/auth/PocketBaseAuthProvider";
import { useTranslations } from "next-intl";  // ✅ ADD THIS (if not there)
import { useLanguage } from "@/lib/language-context";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui";

// ... lazy load imports ...

export default function Home() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isAuthenticated = !!user;
  const t = useTranslations("landing");
  const { dir } = useLanguage();
  const isRTL = dir === "rtl";

  // ... rest of component ...

  return (
    <>
      <main className="min-h-screen bg-background-base flex flex-col">
        {/* Projects Sidebar - only show when authenticated */}
        {isAuthenticated && <ProjectsSidebar />}

        {/* Top menu - Enhanced Header matching Project Page */}
        <header className="h-16 fixed top-0 left-0 right-0 z-30 bg-background-base border-b border-border-light shadow-sm">
          <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary">Vibebaba</h1>
                <p className="text-xs text-text-tertiary">{t("tagline")}</p>  {/* ✅ FIXED */}
              </div>
            </div>

            {/* Right Navigation - rest unchanged */}
            {/* ... */}
          </div>
        </header>

        {/* ... rest of page ... */}
      </main>
    </>
  );
}
```

### Add Translation Key

#### `/messages/en.json`
```json
{
  "landing": {
    // ... existing keys ...
    "tagline": "AI App Builder"
  }
}
```

#### `/messages/fa.json`
```json
{
  "landing": {
    // ... existing keys ...
    "tagline": "سازنده برنامه هوش مصنوعی"
  }
}
```

---

## Fix #4: Add Arabic Support (Optional - 2 hours)

### Step 1: Update `/i18n.config.ts`
```typescript
export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'fa', 'ar'],  // ✅ ADD 'ar'
} as const;

export type Locale = (typeof i18n)['locales'][number];
```

### Step 2: Update Language Switcher

```typescript
// /components/LanguageSwitcher.tsx
export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "fa", name: "فارسی", flag: "🇮🇷" },
    { code: "ar", name: "العربية", flag: "🇸🇦" },  // ✅ ADD THIS
  ];

  // ... rest unchanged ...
}
```

### Step 3: Complete `/messages/ar.json`
Copy structure from en.json and translate or use:
```bash
# Option A: Use ChatGPT/Claude
# Paste en.json content and ask for Arabic translation

# Option B: Use translation service
# Google Translate, DeepL, etc.
```

---

## Verification Checklist

After applying all fixes:

- [ ] AIChat.tsx imports useTranslations
- [ ] AIChat.tsx uses t() for all 4 strings
- [ ] projects/page.tsx imports useTranslations
- [ ] projects/page.tsx uses t() for all hardcoded strings
- [ ] page.tsx uses t("tagline") for "AI App Builder"
- [ ] All new translation keys added to en.json
- [ ] All new keys translated in fa.json
- [ ] ar.json completed (if doing Priority 2)
- [ ] LanguageSwitcher updated with Arabic (if doing Priority 2)
- [ ] i18n.config.ts updated to include 'ar' (if doing Priority 2)

---

## Testing

```bash
# 1. Development server
npm run dev

# 2. Test fixes
- Go to home page
- Click language switcher
- Switch to Persian (فارسی)
- Verify all text updates
- Check AIChat placeholder
- Check projects page
- Click back to English
- Reload page - verify language persists

# 3. Build for production
npm run build

# 4. Start production build
npm run start

# 5. Repeat tests in production build
```

---

## Time Estimates

| Fix | Time | Difficulty |
|-----|------|-----------|
| Fix #1 (AIChat) | 5 min | Easy |
| Fix #2 (projects) | 10 min | Easy |
| Fix #3 (page tagline) | 3 min | Easy |
| Fix #4 (Arabic) | 120 min | Medium |
| **TOTAL** | **138 min** | - |
| **TOTAL (1-3)** | **18 min** | - |

---

**Start with Fix #1, #2, #3 (18 minutes) to reach 92/100**
**Then proceed to Fix #4 (120 minutes) to reach 95/100**
