# COMPREHENSIVE IMPLEMENTATION PLAN #notDone

**Document Version:** 1.1
**Created:** 2025-01-23
**Last Updated:** 2025-10-23
**Status:** 🟢 50% COMPLETE - Phases 1 & 2 DONE
**Risk Level:** MEDIUM
**Estimated Time:** 15-20 hours (8-10 hours remaining)

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Initiative 1: Ant Design Only](#initiative-1-ant-design-only)
3. [Initiative 2: Next.js/TypeScript Support](#initiative-2-nextjs-typescript-support)
4. [Initiative 3: Enhanced UX Styling Configuration](#initiative-3-enhanced-ux-styling-configuration)
5. [Initiative 4: File Creation/Deletion System](#initiative-4-file-creation-deletion-system)
6. [Implementation Order](#implementation-order)
7. [Testing Strategy](#testing-strategy)
8. [Rollback Plan](#rollback-plan)
9. [Pre-Implementation Checklist](#pre-implementation-checklist)

---

## 📊 EXECUTIVE SUMMARY

### Goals
Transform the app generation system to:
1. ✅ **DONE - Phase 1:** Use **Ant Design exclusively** for consistent, professional UI
2. 🟡 **TODO - Phase 4:** Generate **Next.js/TypeScript** applications (not just HTML/CSS)
3. ✅ **DONE - Phase 2:** Capture **comprehensive styling configuration** from user input
4. 🟡 **TODO - Phase 3:** Enable **file creation/deletion** during validation and debugging

### Impact Analysis
- **User Experience:** +80% (Professional UI, production-ready code, better customization)
- **Code Quality:** +60% (TypeScript safety, component-based architecture)
- **System Reliability:** +40% (Self-healing file operations)
- **Breaking Changes:** MINIMAL (Backward compatible with existing HTML generation)

### Key Metrics
| Metric | Before | After (Target) |
|--------|--------|----------------|
| Design Systems Active | 3 (V0, Database, Enhanced2025) | 1 (Ant Design) |
| Generation Targets | HTML/CSS only | HTML + Next.js/TypeScript |
| Styling Configuration | 5 parameters | 20+ parameters |
| File Operations | Modify only | Create, Modify, Delete, Rename |
| Production Readiness | 40% | 85% |

---

## 🎯 INITIATIVE 1: ANT DESIGN ONLY

### 🎯 Objective
Disable all design systems except Ant Design for consistent, enterprise-grade UI.

### 📍 Current State
```typescript
// lib/component-library-config.ts
ACTIVE LIBRARIES:
  ✅ V0 Accessible Components (Priority 100)
  ✅ Database Examples (Priority 90)
  ✅ Enhanced 2025 (Priority 80)
  ❌ DaisyUI (Priority 70) - Disabled
  ❌ Ant Design (Priority 60) - Disabled
  ❌ shadcn/ui (Priority 50) - Disabled
```

### 🎯 Target State
```typescript
ACTIVE LIBRARIES:
  ❌ V0 Accessible Components
  ❌ Database Examples
  ❌ Enhanced 2025
  ❌ DaisyUI
  ✅ Ant Design (Priority 100) - ONLY ACTIVE
  ❌ shadcn/ui
```

### 🔧 Implementation Steps

#### **Step 1.1: Update Library Configuration**
**File:** `lib/component-library-config.ts`

**Change Location:** Lines 37-150

```typescript
// BEFORE:
v0accessible: {
  enabled: true,
  priority: 100,
  // ...
},
databaseExamples: {
  enabled: true,
  priority: 90,
  // ...
},
enhanced2025: {
  enabled: true,
  priority: 80,
  // ...
},
antDesign: {
  enabled: false,  // ❌ DISABLED
  priority: 60,    // ⚠️ LOW PRIORITY
  // ...
}

// AFTER:
v0accessible: {
  enabled: false,  // ✅ CHANGE: Disable V0
  priority: 100,
  // ...
},
databaseExamples: {
  enabled: false,  // ✅ CHANGE: Disable Database Examples
  priority: 90,
  // ...
},
enhanced2025: {
  enabled: false,  // ✅ CHANGE: Disable Enhanced 2025
  priority: 80,
  // ...
},
antDesign: {
  enabled: true,   // ✅ CHANGE: Enable Ant Design
  priority: 100,   // ✅ CHANGE: Raise to highest priority
  // ...
}
```

#### **Step 1.2: Update Default Preset**
**File:** `lib/component-library-config.ts`

**Change Location:** Lines 243-250

```typescript
// BEFORE:
default: () => {
  toggleLibrary('v0accessible', true);      // ❌ Was enabled
  toggleLibrary('databaseExamples', true);  // ❌ Was enabled
  toggleLibrary('enhanced2025', true);      // ❌ Was enabled
  toggleLibrary('daisyui', false);
  toggleLibrary('antDesign', false);        // ❌ Was disabled
  toggleLibrary('shadcn', false);
},

// AFTER:
default: () => {
  toggleLibrary('v0accessible', false);     // ✅ CHANGE: Disable
  toggleLibrary('databaseExamples', false); // ✅ CHANGE: Disable
  toggleLibrary('enhanced2025', false);     // ✅ CHANGE: Disable
  toggleLibrary('daisyui', false);
  toggleLibrary('antDesign', true);         // ✅ CHANGE: Enable
  toggleLibrary('shadcn', false);
},
```

#### **Step 1.3: Add Ant Design Preset (Optional)**
**File:** `lib/component-library-config.ts`

**Add Location:** After line 250, before closing brace

```typescript
// NEW: Ant Design Only preset
antDesignOnly: () => {
  toggleLibrary('v0accessible', false);
  toggleLibrary('databaseExamples', false);
  toggleLibrary('enhanced2025', false);
  toggleLibrary('daisyui', false);
  toggleLibrary('antDesign', true);
  toggleLibrary('shadcn', false);
},
```

#### **Step 1.4: Verify Component Availability**
**File:** `lib/antd-components.ts`

**Verification Checklist:**
- ✅ Navigation components (main, sidebar) - **Lines 10-48**
- ✅ Hero sections (main, withImage) - **Lines 51-91**
- ✅ Feature grids - **Lines 95-123**
- ✅ Forms (contact, login) - **Lines 127-177**
- ✅ Pricing cards (three-tier) - **Lines 181-236**
- ✅ Footer - **Lines 240-282**
- ✅ Buttons (primary, secondary, danger) - **Lines 286-297**

**Missing Components to Add:**
```typescript
// TODO: Add to lib/antd-components.ts

export const ANTD_COMPONENTS = {
  // ... existing components ...

  // NEW: Email Capture Components
  emailCapture: {
    waitlist: `<!-- Ant Design Waitlist Form -->
    <section style="padding: 80px 20px; background: #f0f2f5;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="text-align: center; font-size: 28px; font-weight: bold; margin-bottom: 16px;">
          Join the Waitlist
        </h2>
        <p style="text-align: center; color: #595959; margin-bottom: 32px;">
          Be the first to know when we launch
        </p>
        <form>
          <div style="margin-bottom: 16px;">
            <input type="email" placeholder="Enter your email" style="width: 100%; padding: 12px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 14px;">
          </div>
          <button type="submit" style="width: 100%; background: #1890ff; color: white; border: none; padding: 12px; border-radius: 4px; font-size: 16px; cursor: pointer; font-weight: 500;">
            Join Waitlist
          </button>
        </form>
      </div>
    </section>`,

    newsletter: `<!-- Similar structure for newsletter signup -->`,
    contactFull: `<!-- Similar structure for full contact form -->`
  },

  // NEW: CTA Components
  cta: {
    main: `<!-- Ant Design CTA Section -->
    <section style="background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%); padding: 80px 20px; text-align: center; color: white;">
      <div style="max-width: 800px; margin: 0 auto;">
        <h2 style="font-size: 42px; font-weight: bold; margin-bottom: 24px;">
          Ready to Get Started?
        </h2>
        <p style="font-size: 20px; margin-bottom: 32px; opacity: 0.9;">
          Join thousands of teams already building with Ant Design
        </p>
        <button style="background: white; color: #1890ff; border: none; padding: 16px 48px; border-radius: 4px; font-size: 18px; cursor: pointer; font-weight: 600;">
          Get Started Free
        </button>
      </div>
    </section>`,

    gradient: `<!-- Gradient variant -->`
  },

  // NEW: Modal Components
  modal: {
    main: `<!-- Ant Design Modal Structure -->
    <div id="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.45); z-index: 1000; align-items: center; justify-content: center;">
      <div style="background: white; border-radius: 8px; padding: 24px; max-width: 520px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Modal Title</h3>
        <p style="color: #595959; margin-bottom: 24px;">Modal content goes here</p>
        <div style="text-align: right;">
          <button onclick="document.getElementById('modal').style.display='none'" style="background: white; color: #000; border: 1px solid #d9d9d9; padding: 8px 16px; border-radius: 4px; margin-right: 8px; cursor: pointer;">
            Cancel
          </button>
          <button style="background: #1890ff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
            OK
          </button>
        </div>
      </div>
    </div>`
  }
};
```

### ✅ Validation Steps

**After Implementation:**

```bash
# 1. Verify active libraries
node -e "
  const { getActiveLibraries } = require('./lib/component-library-config');
  const active = getActiveLibraries();
  console.log('Active Libraries:', active.map(l => l.name));
  console.assert(active.length === 1, 'Should have exactly 1 active library');
  console.assert(active[0].id === 'antDesign', 'Should be Ant Design');
"

# 2. Verify priority
node -e "
  const { COMPONENT_LIBRARIES } = require('./lib/component-library-config');
  console.assert(COMPONENT_LIBRARIES.antDesign.priority === 100, 'Ant Design should have priority 100');
  console.assert(COMPONENT_LIBRARIES.antDesign.enabled === true, 'Ant Design should be enabled');
"

# 3. Test generation
# Generate a test app and verify it uses Ant Design components
```

**Visual Verification:**
- ✅ Generated code contains `#1890ff` (Ant Design primary blue)
- ✅ Generated code contains `border-radius: 4px` (Ant Design default)
- ✅ Generated code uses Ant Design spacing (padding: 8px, 12px, 16px, 24px)
- ✅ No references to V0, Enhanced2025, or other design systems

### ⚠️ Breaking Changes
**NONE** - This is a configuration change only. Existing HTML generation continues to work.

### 🔄 Rollback Instructions
If issues occur:
```typescript
// Revert lib/component-library-config.ts changes:
toggleLibrary('v0accessible', true);
toggleLibrary('databaseExamples', true);
toggleLibrary('enhanced2025', true);
toggleLibrary('antDesign', false);
```

---

## 🎯 INITIATIVE 2: NEXT.JS / TYPESCRIPT SUPPORT

### 🎯 Objective
Generate production-ready Next.js/TypeScript applications instead of just HTML/CSS.

### 📍 Current State
```
OUTPUT: Single .html file or multi-file HTML
TECH STACK: HTML + CSS + Vanilla JavaScript
FRAMEWORK: None
TYPE SAFETY: None
BUILD PROCESS: None required
DEPLOYMENT: Static file hosting
```

### 🎯 Target State
```
OUTPUT: Next.js application with TypeScript
TECH STACK: React + TypeScript + Next.js 14+ + Tailwind CSS
FRAMEWORK: Next.js (App Router)
TYPE SAFETY: Full TypeScript support
BUILD PROCESS: npm run build
DEPLOYMENT: Vercel, AWS Amplify, or any Node.js host
```

### 🏗️ Architecture: Two-Mode System

**Design Decision:** Keep both modes to support different use cases.

```
┌─────────────────────────────────────────────┐
│         USER REQUEST                        │
│  "Build a landing page for my startup"     │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │   PM NODE      │
         │  (Analyzes)    │
         └────────┬───────┘
                  │
                  ├─── Simple landing page → mode: 'html'
                  │
                  └─── SaaS dashboard → mode: 'nextjs'
                  │
                  ▼
      ┌───────────────────────┐
      │  ROUTING DECISION     │
      └───────────┬───────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
   ┌─────────┐      ┌─────────────┐
   │  HTML   │      │   NEXT.JS   │
   │  Mode   │      │    Mode     │
   └─────────┘      └─────────────┘
        │                  │
        ▼                  ▼
   index.html        app/page.tsx
                     app/layout.tsx
                     components/*.tsx
                     package.json
```

### 🔧 Implementation Steps

#### **Step 2.1: Create Generation Mode Config**

**New File:** `lib/generation-mode-config.ts`

```typescript
// lib/generation-mode-config.ts

export type GenerationMode = 'html' | 'nextjs';

export interface GenerationModeConfig {
  mode: GenerationMode;
  framework: 'vanilla' | 'react';
  language: 'javascript' | 'typescript';
  styling: 'inline' | 'tailwind' | 'css-modules';
  buildRequired: boolean;
  fileExtensions: string[];
}

export const GENERATION_MODES: Record<GenerationMode, GenerationModeConfig> = {
  html: {
    mode: 'html',
    framework: 'vanilla',
    language: 'javascript',
    styling: 'inline',
    buildRequired: false,
    fileExtensions: ['.html', '.css', '.js']
  },

  nextjs: {
    mode: 'nextjs',
    framework: 'react',
    language: 'typescript',
    styling: 'tailwind',
    buildRequired: true,
    fileExtensions: ['.tsx', '.ts', '.css', '.json', '.mjs']
  }
};

/**
 * Auto-detect generation mode based on app context
 */
export function selectGenerationMode(context: any): GenerationMode {
  // Force Next.js for specific app types
  const nextjsTypes = ['dashboard', 'saas-app', 'tool', 'admin-panel'];
  if (nextjsTypes.includes(context.appType)) {
    return 'nextjs';
  }

  // Force Next.js for complex apps
  if (context.complexity === 'complex') {
    return 'nextjs';
  }

  // Force Next.js if backend config exists (database-driven apps)
  if (context.hasDatabase) {
    return 'nextjs';
  }

  // Default to HTML for simple landing pages
  return 'html';
}

/**
 * Get mode configuration
 */
export function getModeConfig(mode: GenerationMode): GenerationModeConfig {
  return GENERATION_MODES[mode];
}
```

#### **Step 2.2: Update PM Node to Detect Mode**

**File:** `lib/langgraph/nodes/pm-node.ts`

**Change Location:** After line 34 (after context detection)

```typescript
// ADD IMPORT at top:
import { selectGenerationMode } from '@/lib/generation-mode-config';

// ADD after line 34 (after context is created):
const hasDatabase = !!state.backendConfig?.collections;
const generationMode = selectGenerationMode({
  appType: context.appType,
  complexity: context.complexity,
  hasDatabase
});

console.log(`[PM] Selected generation mode: ${generationMode}`);

// UPDATE return statement (line 67):
return {
  plan,
  context: {
    appType: context.appType || 'other',
    complexity: context.complexity || 'moderate',
    designStyle: context.designStyle || 'modern',
    visualTone: context.visualTone || 'light',
    animationLevel: context.animationLevel || 'subtle',
    targetAudience: context.targetAudience || state.businessContext?.targetAudience || 'General users',
    generationMode // ✅ ADD THIS
  },
  stage: 'designing',
  completedNodes: [...state.completedNodes, 'pm']
};
```

#### **Step 2.3: Create Next.js Frontend Node**

**New File:** `lib/langgraph/nodes/frontend-node-nextjs.ts`

```typescript
// lib/langgraph/nodes/frontend-node-nextjs.ts

import { generateWithFallback } from '@/lib/ai';
import { buildComponentLibraryFromNeeds } from '@/lib/component-builder';
import type { AppGenState } from '../types';
import { emitNodeStart, emitNodeComplete, emitNodeError } from '../events';

export async function frontendNodeNextjs(state: AppGenState): Promise<Partial<AppGenState>> {
  const startTime = Date.now();

  try {
    emitNodeStart('frontend', state, {
      userInput: `${state.userDescription}\n\nComponents: ${JSON.stringify(state.componentNeeds)}`,
      interpretation: `Generating Next.js/TypeScript application with Ant Design components and ${state.backendConfig ? 'integrated database' : 'no database'}.`,
      plan: `I will generate a complete Next.js 14+ application using TypeScript, React components, and Ant Design. The app will include proper routing, API routes for database access, and production-ready configuration files.`
    });

    const files: Array<{path: string; content: string}> = [];

    // 1. Generate package.json
    files.push({
      path: 'package.json',
      content: generatePackageJson(state)
    });

    // 2. Generate tsconfig.json
    files.push({
      path: 'tsconfig.json',
      content: generateTsConfig()
    });

    // 3. Generate next.config.mjs
    files.push({
      path: 'next.config.mjs',
      content: generateNextConfig()
    });

    // 4. Generate tailwind.config.ts
    files.push({
      path: 'tailwind.config.ts',
      content: generateTailwindConfig(state)
    });

    // 5. Generate .env.local
    files.push({
      path: '.env.local',
      content: `NEXT_PUBLIC_PROJECT_ID=${state.projectId}\nNEXT_PUBLIC_API_URL=http://localhost:3000/api`
    });

    // 6. Generate app/layout.tsx (root layout with Ant Design provider)
    files.push({
      path: 'app/layout.tsx',
      content: await generateRootLayout(state)
    });

    // 7. Generate app/page.tsx (main page)
    files.push({
      path: 'app/page.tsx',
      content: await generateMainPage(state)
    });

    // 8. Generate components
    if (state.componentNeeds?.navigation !== 'none') {
      files.push({
        path: 'components/Navigation.tsx',
        content: await generateNavigationComponent(state)
      });
    }

    if (state.componentNeeds?.hero !== 'none') {
      files.push({
        path: 'components/Hero.tsx',
        content: await generateHeroComponent(state)
      });
    }

    if (state.componentNeeds?.features !== 'none') {
      files.push({
        path: 'components/Features.tsx',
        content: await generateFeaturesComponent(state)
      });
    }

    if (state.componentNeeds?.footer !== 'none') {
      files.push({
        path: 'components/Footer.tsx',
        content: await generateFooterComponent(state)
      });
    }

    // 9. Generate database integration if backend exists
    if (state.backendConfig?.collections) {
      // Generate database client
      files.push({
        path: 'lib/db.ts',
        content: generateDatabaseClient(state.projectId, state.backendConfig)
      });

      // Generate API routes for each collection
      for (const collection of state.backendConfig.collections) {
        files.push({
          path: `app/api/${collection.name}/route.ts`,
          content: generateAPIRoute(collection, state.projectId)
        });
      }
    }

    // 10. Generate globals.css
    files.push({
      path: 'app/globals.css',
      content: generateGlobalCSS(state)
    });

    // 11. Generate .gitignore
    files.push({
      path: '.gitignore',
      content: generateGitignore()
    });

    // 12. Generate README.md
    files.push({
      path: 'README.md',
      content: generateReadme(state)
    });

    const duration = Date.now() - startTime;

    emitNodeComplete('frontend', state, duration, {
      taskDescription: 'Generated complete Next.js/TypeScript application',
      success: true,
      output: {
        filesGenerated: files.length,
        fileNames: files.map(f => f.path),
        framework: 'Next.js 14+',
        language: 'TypeScript',
        hasDatabase: !!(state.backendConfig?.collections)
      },
      summary: `Generated ${files.length} file(s) for Next.js application. ${state.backendConfig?.collections ? `Database API configured for "${state.backendConfig.collections[0].name}".` : 'No database integration.'}`
    });

    return {
      files,
      isMultiPage: false, // Next.js handles routing internally
      generationMode: 'nextjs',
      completedNodes: [...state.completedNodes, 'frontend']
    };

  } catch (error) {
    emitNodeError('frontend', error as Error, state);
    console.error('[Frontend Next.js] Error:', error);

    return {
      files: [],
      isMultiPage: false,
      generationMode: 'nextjs',
      completedNodes: [...state.completedNodes, 'frontend'],
      errors: [...state.errors, { node: 'frontend', message: (error as Error).message }]
    };
  }
}

// ==================== GENERATOR FUNCTIONS ====================

function generatePackageJson(state: AppGenState): string {
  return JSON.stringify({
    name: state.projectId,
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint"
    },
    dependencies: {
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "next": "^14.2.0",
      "antd": "^5.20.0",
      "@ant-design/nextjs-registry": "^1.0.0",
      "pocketbase": "^0.21.0"
    },
    devDependencies: {
      "@types/node": "^20",
      "@types/react": "^18",
      "@types/react-dom": "^18",
      "typescript": "^5",
      "tailwindcss": "^3.4.0",
      "postcss": "^8",
      "autoprefixer": "^10"
    }
  }, null, 2);
}

function generateTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [{ name: "next" }],
      paths: {
        "@/*": ["./*"]
      }
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"]
  }, null, 2);
}

function generateNextConfig(): string {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['antd'],
};

export default nextConfig;
`;
}

function generateTailwindConfig(state: AppGenState): string {
  const primaryColor = state.stylingConfig?.colorTheme?.primary || '#1890ff';

  return `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "${primaryColor}",
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Disable Tailwind's reset to avoid conflicts with Ant Design
  },
};

export default config;
`;
}

async function generateRootLayout(state: AppGenState): Promise<string> {
  const primaryColor = state.stylingConfig?.colorTheme?.primary || '#1890ff';
  const isDarkMode = state.context?.visualTone === 'dark';
  const fontFamily = state.stylingConfig?.typography?.fontFamily || 'Inter';

  return `import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, theme } from 'antd';
import type { Metadata } from 'next';
import { ${fontFamily} } from 'next/font/google';
import './globals.css';

const inter = ${fontFamily}({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '${state.userDescription.substring(0, 50)}',
  description: '${state.plan?.substring(0, 150) || state.userDescription}',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '${primaryColor}',
                fontFamily: '${fontFamily}, -apple-system, BlinkMacSystemFont, sans-serif',
              },
              algorithm: ${isDarkMode ? 'theme.darkAlgorithm' : 'theme.defaultAlgorithm'},
            }}
          >
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
`;
}

async function generateMainPage(state: AppGenState): Promise<string> {
  const hasNav = state.componentNeeds?.navigation !== 'none';
  const hasHero = state.componentNeeds?.hero !== 'none';
  const hasFeatures = state.componentNeeds?.features !== 'none';
  const hasFooter = state.componentNeeds?.footer !== 'none';

  return `import React from 'react';
${hasNav ? "import Navigation from '@/components/Navigation';" : ''}
${hasHero ? "import Hero from '@/components/Hero';" : ''}
${hasFeatures ? "import Features from '@/components/Features';" : ''}
${hasFooter ? "import Footer from '@/components/Footer';" : ''}

export default function Home() {
  return (
    <main>
      ${hasNav ? '<Navigation />' : ''}
      ${hasHero ? '<Hero />' : ''}
      ${hasFeatures ? '<Features />' : ''}
      ${hasFooter ? '<Footer />' : ''}
    </main>
  );
}
`;
}

async function generateNavigationComponent(state: AppGenState): Promise<string> {
  // Use AI to generate Navigation component based on Ant Design patterns
  const prompt = `Generate a React TypeScript component for Navigation using Ant Design.

USER REQUEST: ${state.userDescription}
DESIGN STYLE: ${state.context?.designStyle}

Requirements:
- Use Ant Design Menu component
- TypeScript with proper types
- Responsive design
- Modern, clean code
- Export as default

Generate ONLY the component code:`;

  const result = await generateWithFallback(prompt, true);
  return cleanGeneratedCode(result.text);
}

async function generateHeroComponent(state: AppGenState): Promise<string> {
  const prompt = `Generate a React TypeScript Hero component using Ant Design.

USER REQUEST: ${state.userDescription}
HERO STYLE: ${state.componentNeeds?.hero}
DESIGN STYLE: ${state.context?.designStyle}

Requirements:
- Use Ant Design Typography, Button components
- TypeScript with proper types
- Engaging hero section with CTA
- Export as default

Generate ONLY the component code:`;

  const result = await generateWithFallback(prompt, true);
  return cleanGeneratedCode(result.text);
}

async function generateFeaturesComponent(state: AppGenState): Promise<string> {
  const prompt = `Generate a React TypeScript Features component using Ant Design.

USER REQUEST: ${state.userDescription}
FEATURES LAYOUT: ${state.componentNeeds?.features}
DESIGN STYLE: ${state.context?.designStyle}

Requirements:
- Use Ant Design Card, Row, Col components
- TypeScript with proper types
- Grid layout for features
- Export as default

Generate ONLY the component code:`;

  const result = await generateWithFallback(prompt, true);
  return cleanGeneratedCode(result.text);
}

async function generateFooterComponent(state: AppGenState): Promise<string> {
  const prompt = `Generate a React TypeScript Footer component using Ant Design.

USER REQUEST: ${state.userDescription}
FOOTER STYLE: ${state.componentNeeds?.footer}

Requirements:
- Use Ant Design Layout.Footer
- TypeScript with proper types
- Links and copyright info
- Export as default

Generate ONLY the component code:`;

  const result = await generateWithFallback(prompt, true);
  return cleanGeneratedCode(result.text);
}

function generateDatabaseClient(projectId: string, backendConfig: any): string {
  return `import PocketBase from 'pocketbase';

const pb = new PocketBase('YOUR_POCKETBASE_URL');

export interface Collection {
  id: string;
  created: string;
  updated: string;
  [key: string]: any;
}

${backendConfig.collections.map((col: any) => `
export interface ${capitalize(col.name)} extends Collection {
${col.fields.map((f: any) => `  ${f.name}: ${mapTypeToTS(f.type)};`).join('\n')}
}
`).join('\n')}

export const db = {
  // Get all records from a collection
  async get<T extends Collection>(collection: string): Promise<T[]> {
    try {
      const records = await pb.collection(collection).getFullList();
      return records as T[];
    } catch (error) {
      console.error('Database get error:', error);
      throw error;
    }
  },

  // Add a new record
  async add<T extends Collection>(collection: string, data: Partial<T>): Promise<T> {
    try {
      const record = await pb.collection(collection).create(data);
      return record as T;
    } catch (error) {
      console.error('Database add error:', error);
      throw error;
    }
  },

  // Update a record
  async update<T extends Collection>(collection: string, id: string, data: Partial<T>): Promise<T> {
    try {
      const record = await pb.collection(collection).update(id, data);
      return record as T;
    } catch (error) {
      console.error('Database update error:', error);
      throw error;
    }
  },

  // Delete a record
  async delete(collection: string, id: string): Promise<void> {
    try {
      await pb.collection(collection).delete(id);
    } catch (error) {
      console.error('Database delete error:', error);
      throw error;
    }
  },

  // Subscribe to real-time updates
  subscribe<T extends Collection>(collection: string, callback: (data: T[]) => void): () => void {
    pb.collection(collection).subscribe('*', async () => {
      const records = await this.get<T>(collection);
      callback(records);
    });

    return () => pb.collection(collection).unsubscribe();
  }
};

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
`;
}

function generateAPIRoute(collection: any, projectId: string): string {
  return `import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/${collection.name}
export async function GET(request: NextRequest) {
  try {
    const data = await db.get('${collection.name}');
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/${collection.name}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await db.add('${collection.name}', body);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/${collection.name}
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const data = await db.update('${collection.name}', id, updates);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/${collection.name}
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }
    await db.delete('${collection.name}', id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`;
}

function generateGlobalCSS(state: AppGenState): string {
  const isDark = state.context?.visualTone === 'dark';

  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: ${isDark ? '255, 255, 255' : '0, 0, 0'};
  --background-start-rgb: ${isDark ? '10, 10, 10' : '255, 255, 255'};
  --background-end-rgb: ${isDark ? '0, 0, 0' : '255, 255, 255'};
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
`;
}

function generateGitignore(): string {
  return `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`;
}

function generateReadme(state: AppGenState): string {
  return `# ${state.userDescription.substring(0, 50)}

Generated by AI App Builder

## Getting Started

First, install dependencies:

\`\`\`bash
npm install
\`\`\`

Then, run the development server:

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- \`app/\` - Next.js App Router pages and layouts
- \`components/\` - React components
- \`lib/\` - Utility functions and database client
- \`public/\` - Static assets

## Tech Stack

- **Framework:** Next.js 14+
- **Language:** TypeScript
- **UI Library:** Ant Design
- **Styling:** Tailwind CSS
${state.backendConfig ? '- **Database:** PocketBase' : ''}

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Ant Design Documentation](https://ant.design/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
`;
}

// Helper functions
function cleanGeneratedCode(code: string): string {
  // Remove markdown code fences
  code = code.replace(/^```(?:typescript|tsx|ts)?\s*/gim, '');
  code = code.replace(/```\s*$/gim, '');

  // Remove explanatory text before code
  const tsxMatch = code.match(/(import\s+.*[\s\S]*export\s+default\s+.*)/);
  if (tsxMatch) {
    code = tsxMatch[1];
  }

  return code.trim();
}

function mapTypeToTS(dbType: string): string {
  const typeMap: Record<string, string> = {
    'text': 'string',
    'number': 'number',
    'bool': 'boolean',
    'email': 'string',
    'url': 'string',
    'date': 'string',
    'select': 'string',
    'relation': 'string',
    'file': 'string',
    'json': 'any'
  };
  return typeMap[dbType] || 'any';
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
```

#### **Step 2.4: Rename Current Frontend Node**

**File:** `lib/langgraph/nodes/frontend-node.ts`

**Change:** Rename function to make it clear it's HTML mode

```typescript
// BEFORE:
export async function frontendNode(state: AppGenState): Promise<Partial<AppGenState>> {

// AFTER:
export async function frontendNodeHTML(state: AppGenState): Promise<Partial<AppGenState>> {
  // ... existing implementation stays the same
}
```

#### **Step 2.5: Create Frontend Router**

**New File:** `lib/langgraph/nodes/frontend-node.ts` (replace original)

```typescript
// lib/langgraph/nodes/frontend-node.ts

import type { AppGenState } from '../types';
import { frontendNodeHTML } from './frontend-node-html';
import { frontendNodeNextjs } from './frontend-node-nextjs';

/**
 * Frontend Node Router
 * Routes to HTML or Next.js generator based on generation mode
 */
export async function frontendNode(state: AppGenState): Promise<Partial<AppGenState>> {
  const mode = state.context?.generationMode || 'html';

  console.log(`[Frontend Router] Routing to ${mode} generator`);

  if (mode === 'nextjs') {
    return frontendNodeNextjs(state);
  }

  return frontendNodeHTML(state);
}
```

#### **Step 2.6: Update Validation for TypeScript**

**File:** `lib/validation.ts` (needs to be created or found)

Add TypeScript/TSX validation:

```typescript
// Add to validation logic

function validateTypeScriptFile(content: string, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for JSX in .ts files (should be .tsx)
  if (path.endsWith('.ts') && (content.includes('<') || content.includes('JSX'))) {
    errors.push({
      file: path,
      line: 1,
      column: 1,
      message: 'File contains JSX but has .ts extension. Should be .tsx',
      severity: 'error',
      rule: 'typescript-jsx-extension'
    });
  }

  // Check for missing imports
  if (content.includes('React') && !content.includes("import React")) {
    errors.push({
      file: path,
      line: 1,
      column: 1,
      message: 'Missing React import',
      severity: 'error',
      rule: 'missing-import'
    });
  }

  // Check for improper export
  if (!content.includes('export default') && !content.includes('export {')) {
    errors.push({
      file: path,
      line: 1,
      column: 1,
      message: 'Missing export statement',
      severity: 'warning',
      rule: 'missing-export'
    });
  }

  return errors;
}
```

### ✅ Validation Steps

**After Implementation:**

```bash
# 1. Test HTML mode (should still work)
curl -X POST http://localhost:3000/api/ai/prototype \
  -H "Content-Type: application/json" \
  -d '{"description": "Simple landing page"}'
# Expect: HTML files generated

# 2. Test Next.js mode
curl -X POST http://localhost:3000/api/ai/prototype \
  -H "Content-Type: application/json" \
  -d '{"description": "SaaS dashboard with user management"}'
# Expect: TypeScript files generated

# 3. Verify Next.js app runs
cd generated-app
npm install
npm run dev
# Expect: App runs on localhost:3000

# 4. Check file structure
ls -R generated-app
# Expect: app/, components/, lib/, package.json, etc.
```

### ⚠️ Breaking Changes
**NONE** - HTML mode is preserved, Next.js is additive.

### 🔄 Rollback Instructions
```typescript
// Force HTML mode globally:
// In lib/generation-mode-config.ts
export function selectGenerationMode(context: any): GenerationMode {
  return 'html'; // Force HTML mode
}
```

---

## 🎯 INITIATIVE 3: ENHANCED UX STYLING CONFIGURATION

### 🎯 Objective
Capture comprehensive styling preferences from user input: color themes, layout direction (RTL/LTR), typography, iconography, and animations.

### 📍 Current State
```typescript
// Limited styling detection
isDarkMode = context.visualTone === 'dark'
fontScheme = 'modern' // Hardcoded based on app type
```

**Missing:**
- ❌ User-specified color themes
- ❌ Layout direction (RTL/LTR) detection
- ❌ Custom font selection
- ❌ Iconography style preferences
- ❌ Animation intensity control

### 🎯 Target State
```typescript
stylingConfig = {
  colorTheme: { primary: '#1890ff', mode: 'dark' },
  layout: { direction: 'rtl', spacing: 'normal' },
  typography: { fontFamily: 'Poppins', scale: 'large' },
  iconography: { style: 'filled', source: 'ant-design' },
  animations: { enabled: true, intensity: 'subtle' }
}
```

### 🔧 Implementation Steps

#### **Step 3.1: Create Styling Config Types**

**New File:** `lib/types/styling-config.ts`

```typescript
// lib/types/styling-config.ts

export interface ColorTheme {
  primary: string;      // Hex color (e.g., '#1890ff')
  secondary?: string;   // Optional secondary color
  accent?: string;      // Optional accent color
  mode: 'light' | 'dark' | 'auto';
}

export interface LayoutConfig {
  direction: 'ltr' | 'rtl';
  maxWidth: '1200px' | '1400px' | '1600px' | 'full';
  spacing: 'compact' | 'normal' | 'spacious';
}

export interface TypographyConfig {
  fontFamily: 'Inter' | 'Roboto' | 'Poppins' | 'Montserrat' | 'Open Sans' | 'Lato' | 'custom';
  customFont?: string;  // If fontFamily === 'custom'
  scale: 'small' | 'normal' | 'large';
  headingWeight: 400 | 500 | 600 | 700 | 800 | 900;
}

export interface IconographyConfig {
  style: 'outlined' | 'filled' | 'two-tone' | 'rounded';
  source: 'ant-design' | 'heroicons' | 'lucide' | 'material' | 'custom';
  size: 'small' | 'medium' | 'large';
}

export interface AnimationsConfig {
  enabled: boolean;
  intensity: 'none' | 'subtle' | 'moderate' | 'heavy';
  transitions: boolean;
  pageTransitions: boolean;
  hoverEffects: boolean;
}

export interface StylingConfig {
  colorTheme: ColorTheme;
  layout: LayoutConfig;
  typography: TypographyConfig;
  iconography: IconographyConfig;
  animations: AnimationsConfig;
}

// Default configurations
export const DEFAULT_STYLING_CONFIG: StylingConfig = {
  colorTheme: {
    primary: '#1890ff',
    mode: 'light'
  },
  layout: {
    direction: 'ltr',
    maxWidth: '1200px',
    spacing: 'normal'
  },
  typography: {
    fontFamily: 'Inter',
    scale: 'normal',
    headingWeight: 700
  },
  iconography: {
    style: 'outlined',
    source: 'ant-design',
    size: 'medium'
  },
  animations: {
    enabled: true,
    intensity: 'subtle',
    transitions: true,
    pageTransitions: false,
    hoverEffects: true
  }
};
```

#### **Step 3.2: Create Context-Aware Defaults**

**New File:** `lib/styling-defaults.ts`

```typescript
// lib/styling-defaults.ts

import type { StylingConfig } from './types/styling-config';

/**
 * Generate contextual styling defaults based on app type and user description
 */
export function getContextualStylingDefaults(
  appContext: any,
  userDescription: string
): Partial<StylingConfig> {
  const defaults: Partial<StylingConfig> = {};

  // ========== LAYOUT DIRECTION ==========
  // Detect RTL languages (Arabic, Hebrew, Urdu, Farsi)
  const rtlPatterns = [
    /[\u0600-\u06FF]/,  // Arabic
    /[\u0590-\u05FF]/,  // Hebrew
    /[\u0750-\u077F]/,  // Arabic Supplement
  ];

  const isRTL = rtlPatterns.some(pattern => pattern.test(userDescription));

  if (isRTL) {
    defaults.layout = {
      direction: 'rtl',
      maxWidth: '1200px',
      spacing: 'normal'
    };
  }

  // ========== COLOR THEME ==========
  // Detect color preferences from keywords
  const colorKeywords: Record<string, string> = {
    'blue': '#1890ff',
    'green': '#52c41a',
    'red': '#f5222d',
    'orange': '#fa8c16',
    'purple': '#722ed1',
    'pink': '#eb2f96',
    'yellow': '#fadb14',
    'cyan': '#13c2c2',
    'geekblue': '#2f54eb',
    'lime': '#a0d911',
    'gold': '#faad14',
    'magenta': '#eb2f96'
  };

  for (const [keyword, color] of Object.entries(colorKeywords)) {
    if (userDescription.toLowerCase().includes(keyword)) {
      defaults.colorTheme = {
        primary: color,
        mode: 'light'
      };
      break;
    }
  }

  // Dark mode detection
  const darkKeywords = ['dark', 'night', 'black', 'midnight'];
  const hasDarkKeyword = darkKeywords.some(kw => userDescription.toLowerCase().includes(kw));

  if (hasDarkKeyword || appContext.visualTone === 'dark') {
    defaults.colorTheme = {
      ...defaults.colorTheme,
      primary: defaults.colorTheme?.primary || '#1890ff',
      mode: 'dark'
    };
  }

  // ========== TYPOGRAPHY ==========
  // Detect font preferences from keywords
  const fontKeywords: Record<string, string> = {
    'modern': 'Inter',
    'elegant': 'Montserrat',
    'playful': 'Poppins',
    'professional': 'Roboto',
    'clean': 'Inter',
    'corporate': 'Open Sans'
  };

  for (const [keyword, font] of Object.entries(fontKeywords)) {
    if (userDescription.toLowerCase().includes(keyword)) {
      defaults.typography = {
        fontFamily: font as any,
        scale: 'normal',
        headingWeight: 700
      };
      break;
    }
  }

  // ========== ANIMATIONS ==========
  // App type-based animation defaults
  const minimalAnimationTypes = ['dashboard', 'admin-panel', 'tool', 'saas-app'];
  const heavyAnimationTypes = ['portfolio', 'creative', 'agency', 'game'];

  if (minimalAnimationTypes.includes(appContext.appType)) {
    defaults.animations = {
      enabled: true,
      intensity: 'none',
      transitions: true,
      pageTransitions: false,
      hoverEffects: false
    };
  } else if (heavyAnimationTypes.includes(appContext.appType)) {
    defaults.animations = {
      enabled: true,
      intensity: 'heavy',
      transitions: true,
      pageTransitions: true,
      hoverEffects: true
    };
  }

  // Detect animation preferences from keywords
  const animationKeywords = {
    'minimal': 'none',
    'no animation': 'none',
    'subtle': 'subtle',
    'smooth': 'moderate',
    'animated': 'moderate',
    'dynamic': 'heavy'
  };

  for (const [keyword, intensity] of Object.entries(animationKeywords)) {
    if (userDescription.toLowerCase().includes(keyword)) {
      defaults.animations = {
        enabled: intensity !== 'none',
        intensity: intensity as any,
        transitions: true,
        pageTransitions: intensity === 'heavy',
        hoverEffects: intensity !== 'none'
      };
      break;
    }
  }

  // ========== ICONOGRAPHY ==========
  // App type-based icon style defaults
  if (appContext.appType === 'dashboard' || appContext.appType === 'tool') {
    defaults.iconography = {
      style: 'outlined',
      source: 'ant-design',
      size: 'medium'
    };
  } else if (appContext.appType === 'creative' || appContext.appType === 'portfolio') {
    defaults.iconography = {
      style: 'filled',
      source: 'ant-design',
      size: 'large'
    };
  }

  // ========== LAYOUT SPACING ==========
  // Compact for dashboards, spacious for marketing sites
  if (appContext.appType === 'dashboard' || appContext.appType === 'tool') {
    defaults.layout = {
      ...defaults.layout,
      direction: defaults.layout?.direction || 'ltr',
      maxWidth: defaults.layout?.maxWidth || '1400px',
      spacing: 'compact'
    };
  } else if (appContext.appType === 'landing-page' || appContext.appType === 'portfolio') {
    defaults.layout = {
      ...defaults.layout,
      direction: defaults.layout?.direction || 'ltr',
      maxWidth: defaults.layout?.maxWidth || '1200px',
      spacing: 'spacious'
    };
  }

  return defaults;
}

/**
 * Merge user preferences with contextual defaults
 */
export function mergeWithDefaults(
  extracted: Partial<StylingConfig>,
  contextual: Partial<StylingConfig>
): StylingConfig {
  return {
    colorTheme: {
      ...contextual.colorTheme,
      ...extracted.colorTheme
    },
    layout: {
      ...contextual.layout,
      ...extracted.layout
    } as any,
    typography: {
      ...contextual.typography,
      ...extracted.typography
    } as any,
    iconography: {
      ...contextual.iconography,
      ...extracted.iconography
    } as any,
    animations: {
      ...contextual.animations,
      ...extracted.animations
    } as any
  };
}
```

#### **Step 3.3: Update UX Node to Extract Styling**

**File:** `lib/langgraph/nodes/ux-node.ts`

**Change Location:** After line 51 (after component selection)

```typescript
// ADD IMPORTS at top:
import { getContextualStylingDefaults, mergeWithDefaults } from '@/lib/styling-defaults';
import type { StylingConfig } from '@/lib/types/styling-config';

// ADD after line 51 (after componentNeeds extraction):

// ========== STEP 2.5: STYLING CONFIGURATION EXTRACTION ==========
console.log('[UX] Extracting styling preferences...');

const stylingPrompt = `Analyze user request for styling preferences: "${state.userDescription}"

Extract styling configuration as JSON:
{
  "colorTheme": {
    "primary": "#1890ff",  // Use exact color if user specified (e.g., "blue" → "#1890ff")
    "secondary": null,      // Optional
    "accent": null,         // Optional
    "mode": "light|dark|auto"  // Detect from keywords: dark, night, light, bright
  },
  "layout": {
    "direction": "ltr|rtl",  // RTL if Arabic/Hebrew text detected, otherwise LTR
    "maxWidth": "1200px|1400px|1600px|full",
    "spacing": "compact|normal|spacious"  // Compact for dashboards, spacious for marketing
  },
  "typography": {
    "fontFamily": "Inter|Roboto|Poppins|Montserrat|Open Sans|Lato|custom",
    "customFont": null,  // If fontFamily is "custom", specify here
    "scale": "small|normal|large",
    "headingWeight": 400|500|600|700|800|900
  },
  "iconography": {
    "style": "outlined|filled|two-tone|rounded",
    "source": "ant-design",  // Use ant-design for now
    "size": "small|medium|large"
  },
  "animations": {
    "enabled": true|false,
    "intensity": "none|subtle|moderate|heavy",
    "transitions": true|false,
    "pageTransitions": true|false,
    "hoverEffects": true|false
  }
}

RULES:
- If user doesn't specify a value, return null for that field
- Detect colors from keywords: blue, green, red, purple, pink, etc.
- Detect RTL from Arabic/Hebrew characters in description
- Default to "Inter" font if not specified
- Default to "subtle" animations if not specified
- Default to "outlined" icon style if not specified

Return ONLY valid JSON:`;

let stylingConfig: Partial<StylingConfig> | null = null;

try {
  const stylingResult = await generateWithFallback(stylingPrompt);
  const stylingMatch = stylingResult.match(/\{[\s\S]*\}/)?.[0];
  const extractedStyling = JSON.parse(stylingMatch || '{}');

  // Get contextual defaults
  const contextualDefaults = getContextualStylingDefaults(
    state.context,
    state.userDescription
  );

  // Merge extracted with contextual defaults
  stylingConfig = mergeWithDefaults(extractedStyling, contextualDefaults);

  console.log('[UX] Styling config extracted:', JSON.stringify(stylingConfig, null, 2));
} catch (error) {
  console.warn('[UX] Failed to extract styling config, using defaults:', error);
  stylingConfig = getContextualStylingDefaults(state.context, state.userDescription) as StylingConfig;
}

// UPDATE return statement (around line 108):
return {
  componentNeeds: componentNeeds || { /* ... existing defaults ... */ },
  backgroundContext,
  designSystemPrompt,
  stylingConfig, // ✅ ADD THIS
  stage: 'building',
  completedNodes: [...state.completedNodes, 'ux']
};
```

#### **Step 3.4: Update Design System Prompt**

**File:** `lib/enhanced-design-prompt.ts`

**Change Location:** Line 16 (function signature)

```typescript
// BEFORE:
export function getEnhancedDesignSystemPrompt(appType: string, isDarkMode = false) {

// AFTER:
export function getEnhancedDesignSystemPrompt(
  appType: string,
  isDarkMode = false,
  stylingConfig?: StylingConfig  // ✅ ADD THIS PARAMETER
) {
  // Extract values from stylingConfig or use defaults
  const primaryColor = stylingConfig?.colorTheme?.primary || '#1890ff';
  const colorMode = stylingConfig?.colorTheme?.mode || (isDarkMode ? 'dark' : 'light');
  const fontFamily = stylingConfig?.typography?.fontFamily || 'Inter';
  const layoutDirection = stylingConfig?.layout?.direction || 'ltr';
  const layoutSpacing = stylingConfig?.layout?.spacing || 'normal';
  const animationIntensity = stylingConfig?.animations?.intensity || 'subtle';
  const iconStyle = stylingConfig?.iconography?.style || 'outlined';

  // Rest of function...

  // UPDATE prompt to include styling configuration:
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 USER-SPECIFIED STYLING CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ CRITICAL: Apply these exact styling preferences from the user:

🎨 COLOR THEME:
• Primary Color: ${primaryColor}
• Mode: ${colorMode}
${stylingConfig?.colorTheme?.secondary ? `• Secondary Color: ${stylingConfig.colorTheme.secondary}` : ''}
${stylingConfig?.colorTheme?.accent ? `• Accent Color: ${stylingConfig.colorTheme.accent}` : ''}

📐 LAYOUT:
• Direction: ${layoutDirection.toUpperCase()}
${layoutDirection === 'rtl' ? `
⚠️ RTL LAYOUT REQUIREMENTS:
- Add dir="rtl" to <html> tag
- Reverse all flex-direction (row → row-reverse)
- Reverse all grid layouts
- Text alignment: right instead of left
- Padding/margin: Use logical properties (padding-inline-start instead of padding-left)
` : ''}
• Max Width: ${stylingConfig?.layout?.maxWidth || '1200px'}
• Spacing: ${layoutSpacing.toUpperCase()}
${layoutSpacing === 'compact' ? '  → Use smaller padding/margins (16px instead of 24px)' : ''}
${layoutSpacing === 'spacious' ? '  → Use larger padding/margins (48px instead of 24px)' : ''}

✍️ TYPOGRAPHY:
• Font Family: ${fontFamily}
• Scale: ${stylingConfig?.typography?.scale || 'normal'}
${stylingConfig?.typography?.scale === 'large' ? '  → Increase all font sizes by 20%' : ''}
${stylingConfig?.typography?.scale === 'small' ? '  → Decrease all font sizes by 10%' : ''}
• Heading Weight: ${stylingConfig?.typography?.headingWeight || 700}

🎭 ICONOGRAPHY:
• Style: ${iconStyle.toUpperCase()} (use Ant Design ${iconStyle} icons)
• Size: ${stylingConfig?.iconography?.size || 'medium'}

✨ ANIMATIONS:
• Enabled: ${stylingConfig?.animations?.enabled ? 'YES' : 'NO'}
• Intensity: ${animationIntensity.toUpperCase()}
${animationIntensity === 'none' ? '⚠️ NO ANIMATIONS - Use instant transitions only (transition: none)' : ''}
${animationIntensity === 'subtle' ? '  → Gentle transitions (0.2s ease)' : ''}
${animationIntensity === 'moderate' ? '  → Smooth transitions (0.3s ease) with hover effects' : ''}
${animationIntensity === 'heavy' ? '  → Dramatic transitions (0.5s cubic-bezier) with scale/rotate/bounce' : ''}
• Hover Effects: ${stylingConfig?.animations?.hoverEffects ? 'ENABLED' : 'DISABLED'}

// ... rest of design system prompt ...
`;
}
```

#### **Step 3.5: Update Frontend Nodes**

**File:** `lib/langgraph/nodes/frontend-node-html.ts` (and `frontend-node-nextjs.ts`)

**Change Location:** When calling `getEnhancedDesignSystemPrompt`

```typescript
// BEFORE:
const designSystemPrompt = getEnhancedDesignSystemPrompt(
  state.context?.appType || 'general',
  isDarkMode
);

// AFTER:
const designSystemPrompt = getEnhancedDesignSystemPrompt(
  state.context?.appType || 'general',
  isDarkMode,
  state.stylingConfig  // ✅ PASS STYLING CONFIG
);
```

**Also update HTML generation to apply RTL:**

```typescript
// If RTL layout
if (state.stylingConfig?.layout?.direction === 'rtl') {
  // Ensure all HTML files have dir="rtl"
  files = files.map(file => {
    if (file.path.endsWith('.html')) {
      let content = file.content;

      // Add dir="rtl" to <html> tag
      content = content.replace(/<html([^>]*)>/, '<html$1 dir="rtl">');

      // Add RTL styles
      const rtlStyles = `
      <style>
        * { direction: rtl; }
        body { text-align: right; }
      </style>
      `;
      content = content.replace('</head>', `${rtlStyles}</head>`);

      return { ...file, content };
    }
    return file;
  });
}
```

#### **Step 3.6: Update AppGenState Type**

**File:** `lib/langgraph/types.ts`

**Change Location:** Add `stylingConfig` to interface

```typescript
import type { StylingConfig } from '@/lib/types/styling-config';

export interface AppGenState {
  // ... existing fields ...

  // UX Designer Output
  componentNeeds?: { /* ... */ };
  designSystemPrompt?: string;
  backgroundContext?: any;
  stylingConfig?: StylingConfig;  // ✅ ADD THIS

  // ... rest of interface ...
}
```

### ✅ Validation Steps

**Test Cases:**

```bash
# Test 1: RTL Detection
Input: "موقع إلكتروني لشركتي" (Arabic text)
Expected: layout.direction = 'rtl'

# Test 2: Color Detection
Input: "landing page with blue color scheme"
Expected: colorTheme.primary = '#1890ff'

# Test 3: Dark Mode Detection
Input: "dark mode dashboard"
Expected: colorTheme.mode = 'dark'

# Test 4: Animation Detection
Input: "minimal animations"
Expected: animations.intensity = 'none'

# Test 5: Font Detection
Input: "modern design with Poppins font"
Expected: typography.fontFamily = 'Poppins'

# Test 6: Context Defaults
Input: "dashboard for analytics" (no styling specified)
Expected: Compact spacing, minimal animations, outlined icons
```

### ⚠️ Breaking Changes
**NONE** - Existing generation falls back to defaults.

---

## 🎯 INITIATIVE 4: FILE CREATION/DELETION SYSTEM

### 🎯 Objective
Enable AutoGen debugger to create new files, delete problematic files, and rename files during validation.

### 📍 Current State
**AutoGen Debugger Can:**
- ✅ Modify existing files
- ✅ Fix code errors
- ✅ Validate code

**AutoGen Debugger CANNOT:**
- ❌ Create missing files (e.g., missing page in multi-page app)
- ❌ Delete duplicate/incorrect files
- ❌ Rename files (e.g., .ts → .tsx)
- ❌ Restructure file organization

### 🎯 Target State
**AutoGen Debugger Can:**
- ✅ Modify existing files
- ✅ Create missing files
- ✅ Delete problematic files
- ✅ Rename files with wrong extensions
- ✅ Restructure file organization

### 🔧 Implementation Steps

#### **Step 4.1: Define File Operation Types**

**Update File:** `lib/langgraph/subgraphs/autogen-debugger.ts`

**Add Location:** Top of file (after imports)

```typescript
// ADD after imports:

export type FileOperationType = 'create' | 'modify' | 'delete' | 'rename';

export interface FileOperation {
  type: FileOperationType;
  path: string;
  newPath?: string;     // For rename operations
  content?: string;     // For create/modify operations
  reason: string;       // Why this operation is needed
}

export interface DebugResult {
  success: boolean;
  files: Array<{ path: string; content: string }>;
  fileOperations: FileOperation[];  // ✅ ADD THIS
  validationResult: any;
  attempts: number;
  collaborationLog: string[];
}
```

#### **Step 4.2: Create File Operations Agent**

**Add Location:** After line 100 in `autogen-debugger.ts`

```typescript
// NEW FUNCTION: File Operations Agent

async function fileOperationsAgent(
  currentFiles: Array<{path: string; content: string}>,
  validation: any,
  context: any
): Promise<FileOperation[]> {
  console.log('[FileOps Agent] Analyzing required file operations...');

  const prompt = `You are a File Operations Agent. Analyze validation errors and determine file operations needed.

CURRENT FILES (${currentFiles.length}):
${currentFiles.map(f => `- ${f.path} (${f.content.length} chars)`).join('\n')}

VALIDATION ERRORS (${validation.report.errors.length}):
${JSON.stringify(validation.report.errors.slice(0, 5), null, 2)}
${validation.report.errors.length > 5 ? `... and ${validation.report.errors.length - 5} more errors` : ''}

PROJECT CONTEXT:
- Is Multi-Page: ${context.isMultiPage}
- Expected Pages: ${context.expectedPages?.join(', ') || 'Not specified'}
- Generation Mode: ${context.generationMode || 'html'}

TASK: Determine file operations needed to fix these errors.

Common scenarios:
1. Missing file: CREATE new file with basic structure
2. Duplicate file: DELETE the duplicate
3. Wrong extension (.ts should be .tsx): RENAME file
4. File too large (>1000 lines): CREATE new component files, MODIFY main file to import them

Return JSON array of operations:
{
  "operations": [
    {
      "type": "create|modify|delete|rename",
      "path": "filename.html",
      "newPath": "new-filename.html",  // Only for rename
      "content": "<!DOCTYPE html>...",  // Only for create (basic structure)
      "reason": "Clear explanation of why this operation is needed"
    }
  ]
}

IMPORTANT:
- Do NOT create operations for files that already exist
- Do NOT delete critical files (e.g., the only HTML file)
- Do NOT rename files unless extension is actually wrong
- Keep operations minimal - only what's needed to fix errors

Return ONLY valid JSON:`;

  try {
    const response = await generateWithFallback(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/)?.[0];
    const parsed = JSON.parse(jsonMatch || '{"operations":[]}');

    const operations = parsed.operations || [];
    console.log(`[FileOps Agent] Proposed ${operations.length} operations`);

    return operations;
  } catch (error) {
    console.error('[FileOps Agent] Failed to parse operations:', error);
    return [];
  }
}
```

#### **Step 4.3: Create File Operations Executor**

**Add Location:** After fileOperationsAgent function

```typescript
// NEW FUNCTION: Execute File Operations

function executeFileOperations(
  currentFiles: Array<{path: string; content: string}>,
  operations: FileOperation[],
  safety: boolean = true
): Array<{path: string; content: string}> {
  let files = [...currentFiles];
  const executedOps: string[] = [];

  for (const op of operations) {
    // Safety validation
    if (safety) {
      const validation = validateFileOperation(op, files);
      if (!validation.valid) {
        console.warn(`[FileOps] Rejected ${op.type} on ${op.path}: ${validation.reason}`);
        continue;
      }
    }

    switch (op.type) {
      case 'create':
        // Add new file if it doesn't exist
        if (!files.find(f => f.path === op.path)) {
          files.push({
            path: op.path,
            content: op.content || generateDefaultFileContent(op.path)
          });
          executedOps.push(`CREATE ${op.path}`);
          console.log(`[FileOps] ✅ Created ${op.path}: ${op.reason}`);
        } else {
          console.warn(`[FileOps] ⚠️ Cannot create ${op.path}: File already exists`);
        }
        break;

      case 'delete':
        // Remove file
        const beforeCount = files.length;
        files = files.filter(f => f.path !== op.path);
        if (files.length < beforeCount) {
          executedOps.push(`DELETE ${op.path}`);
          console.log(`[FileOps] ✅ Deleted ${op.path}: ${op.reason}`);
        } else {
          console.warn(`[FileOps] ⚠️ Cannot delete ${op.path}: File not found`);
        }
        break;

      case 'rename':
        // Rename file
        const fileToRename = files.find(f => f.path === op.path);
        if (fileToRename && op.newPath) {
          fileToRename.path = op.newPath;
          executedOps.push(`RENAME ${op.path} → ${op.newPath}`);
          console.log(`[FileOps] ✅ Renamed ${op.path} → ${op.newPath}: ${op.reason}`);
        } else {
          console.warn(`[FileOps] ⚠️ Cannot rename ${op.path}: File not found or no new path`);
        }
        break;

      case 'modify':
        // This is handled by the fix agent, just log
        console.log(`[FileOps] 📝 Marked ${op.path} for modification: ${op.reason}`);
        break;
    }
  }

  if (executedOps.length > 0) {
    console.log(`[FileOps] Executed ${executedOps.length} operations:`, executedOps);
  }

  return files;
}

// Helper: Generate default file content based on extension
function generateDefaultFileContent(path: string): string {
  if (path.endsWith('.html')) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page</title>
</head>
<body>
  <h1>Welcome</h1>
</body>
</html>`;
  }

  if (path.endsWith('.tsx')) {
    return `import React from 'react';

export default function Component() {
  return (
    <div>
      <h1>Component</h1>
    </div>
  );
}
`;
  }

  if (path.endsWith('.ts')) {
    return `// TypeScript file
export {};
`;
  }

  return '';
}
```

#### **Step 4.4: Create Safety Validation**

**New File:** `lib/file-operation-guards.ts`

```typescript
// lib/file-operation-guards.ts

import type { FileOperation } from './langgraph/subgraphs/autogen-debugger';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate file operation for safety
 */
export function validateFileOperation(
  op: FileOperation,
  currentFiles: Array<{path: string; content: string}>
): ValidationResult {
  switch (op.type) {
    case 'delete':
      return validateDeleteOperation(op, currentFiles);

    case 'create':
      return validateCreateOperation(op, currentFiles);

    case 'rename':
      return validateRenameOperation(op, currentFiles);

    case 'modify':
      return { valid: true }; // Always allow modifications

    default:
      return { valid: false, reason: 'Unknown operation type' };
  }
}

function validateDeleteOperation(
  op: FileOperation,
  currentFiles: Array<{path: string; content: string}>
): ValidationResult {
  // Don't delete if it's the only HTML file
  const htmlFiles = currentFiles.filter(f => f.path.endsWith('.html'));
  if (htmlFiles.length === 1 && op.path.endsWith('.html')) {
    return {
      valid: false,
      reason: 'Cannot delete the only HTML file in the project'
    };
  }

  // Don't delete if it's the only page.tsx file (Next.js)
  const pageFiles = currentFiles.filter(f => f.path.includes('page.tsx'));
  if (pageFiles.length === 1 && op.path.includes('page.tsx')) {
    return {
      valid: false,
      reason: 'Cannot delete the only page.tsx file in Next.js app'
    };
  }

  // Don't delete critical config files
  const criticalFiles = ['package.json', 'tsconfig.json', 'next.config.mjs'];
  if (criticalFiles.some(cf => op.path.endsWith(cf))) {
    return {
      valid: false,
      reason: 'Cannot delete critical configuration file'
    };
  }

  // Check if file exists
  if (!currentFiles.find(f => f.path === op.path)) {
    return {
      valid: false,
      reason: 'File does not exist'
    };
  }

  return { valid: true };
}

function validateCreateOperation(
  op: FileOperation,
  currentFiles: Array<{path: string; content: string}>
): ValidationResult {
  // Don't create if file already exists
  if (currentFiles.find(f => f.path === op.path)) {
    return {
      valid: false,
      reason: 'File already exists'
    };
  }

  // Validate filename (alphanumeric, dash, underscore, dot, slash only)
  if (!op.path.match(/^[a-zA-Z0-9-_./]+$/)) {
    return {
      valid: false,
      reason: 'Invalid filename characters'
    };
  }

  // Validate file extension
  const validExtensions = ['.html', '.css', '.js', '.ts', '.tsx', '.jsx', '.json', '.md', '.mjs'];
  const hasValidExt = validExtensions.some(ext => op.path.endsWith(ext));
  if (!hasValidExt) {
    return {
      valid: false,
      reason: 'Invalid file extension'
    };
  }

  // Don't create files in parent directories (no ../)
  if (op.path.includes('../')) {
    return {
      valid: false,
      reason: 'Cannot create files outside project directory'
    };
  }

  return { valid: true };
}

function validateRenameOperation(
  op: FileOperation,
  currentFiles: Array<{path: string; content: string}>
): ValidationResult {
  // Source must exist
  if (!currentFiles.find(f => f.path === op.path)) {
    return {
      valid: false,
      reason: 'Source file does not exist'
    };
  }

  // Destination must not exist
  if (currentFiles.find(f => f.path === op.newPath)) {
    return {
      valid: false,
      reason: 'Destination file already exists'
    };
  }

  // Must have newPath
  if (!op.newPath) {
    return {
      valid: false,
      reason: 'No destination path specified'
    };
  }

  // Validate new filename
  if (!op.newPath.match(/^[a-zA-Z0-9-_./]+$/)) {
    return {
      valid: false,
      reason: 'Invalid destination filename characters'
    };
  }

  return { valid: true };
}

/**
 * Get operation summary for logging
 */
export function getOperationSummary(operations: FileOperation[]): {
  created: number;
  deleted: number;
  renamed: number;
  modified: number;
} {
  return {
    created: operations.filter(op => op.type === 'create').length,
    deleted: operations.filter(op => op.type === 'delete').length,
    renamed: operations.filter(op => op.type === 'rename').length,
    modified: operations.filter(op => op.type === 'modify').length
  };
}
```

#### **Step 4.5: Update AutoGen Debugger Main Loop**

**File:** `lib/langgraph/subgraphs/autogen-debugger.ts`

**Change Location:** Lines 29-99 (main workflow function)

```typescript
// UPDATE: autoGenDebugWorkflow function

export async function autoGenDebugWorkflow(context: DebugContext): Promise<DebugResult> {
  console.log('[AutoGen Debugger] Initializing multi-agent debugging workflow...');

  const MAX_ATTEMPTS = 3;
  const collaborationLog: string[] = [];
  const allFileOperations: FileOperation[] = [];  // ✅ ADD THIS
  let currentFiles = context.files;
  let currentValidation = context.validationResult;
  let attempt = 0;

  for (attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[AutoGen Debugger] === Attempt ${attempt}/${MAX_ATTEMPTS} ===`);

    // Step 1: Code Analyst Agent analyzes errors (EXISTING)
    const analysisPrompt = buildAnalysisPrompt(currentFiles, currentValidation, context.projectContext);
    const analysis = await generateWithFallback(analysisPrompt);
    collaborationLog.push(`[Attempt ${attempt}] Analyst: ${analysis.substring(0, 200)}...`);

    // ========== NEW: Step 2 - File Operations Agent ==========
    const fileOps = await fileOperationsAgent(
      currentFiles,
      currentValidation,
      context.projectContext
    );

    if (fileOps.length > 0) {
      console.log(`[AutoGen Debugger] FileOps Agent proposed ${fileOps.length} operations`);
      collaborationLog.push(`[Attempt ${attempt}] FileOps: Proposed ${fileOps.length} operations`);

      // Execute file operations with safety checks
      currentFiles = executeFileOperations(currentFiles, fileOps, true);
      allFileOperations.push(...fileOps);

      const opSummary = getOperationSummary(fileOps);
      console.log(`[AutoGen Debugger] Executed: ${opSummary.created} created, ${opSummary.deleted} deleted, ${opSummary.renamed} renamed`);
    } else {
      console.log('[AutoGen Debugger] No file operations needed');
    }

    // Step 3: Code Fixer Agent generates fixes (EXISTING)
    const fixPrompt = buildFixPrompt(currentFiles, analysis, context.projectContext);
    const fixedCode = await generateWithFallback(fixPrompt, true);

    // Step 4: Parse fixed files (EXISTING)
    const fixedFiles = parseFixedFiles(fixedCode.text, currentFiles);
    collaborationLog.push(`[Attempt ${attempt}] Fixer: Generated ${fixedFiles.length} fixed files`);

    // Step 5: Reviewer Agent reviews fixes (EXISTING)
    const reviewPrompt = buildReviewPrompt(currentFiles, fixedFiles, analysis);
    const review = await generateWithFallback(reviewPrompt);
    collaborationLog.push(`[Attempt ${attempt}] Reviewer: ${review.substring(0, 200)}...`);

    // Step 6: Validate fixed code (EXISTING)
    const newValidation = await validateCode(fixedFiles, {
      autoFix: true,
      strict: false,
      isMultiPage: context.projectContext.isMultiPage
    });

    console.log(`[AutoGen Debugger] Validation: ${newValidation.report.errors.length} errors remaining`);

    // Update state
    currentFiles = newValidation.files;
    currentValidation = newValidation;

    // Check if debugging succeeded
    if (newValidation.report.errors.length === 0) {
      console.log(`[AutoGen Debugger] ✅ SUCCESS after ${attempt} attempts`);
      return {
        success: true,
        files: currentFiles,
        fileOperations: allFileOperations,  // ✅ RETURN FILE OPERATIONS
        validationResult: newValidation,
        attempts: attempt,
        collaborationLog
      };
    }

    // If errors reduced significantly, log progress
    const errorReduction = context.validationResult.report.errors.length - newValidation.report.errors.length;
    if (errorReduction > 0) {
      console.log(`[AutoGen Debugger] Progress: Reduced errors by ${errorReduction}`);
    }
  }

  // Max attempts reached
  console.log(`[AutoGen Debugger] ❌ FAILED after ${MAX_ATTEMPTS} attempts`);
  return {
    success: false,
    files: currentFiles,
    fileOperations: allFileOperations,  // ✅ RETURN FILE OPERATIONS
    validationResult: currentValidation,
    attempts: MAX_ATTEMPTS,
    collaborationLog
  };
}
```

#### **Step 4.6: Update QA Node to Handle File Operations**

**File:** `lib/langgraph/nodes/qa-node.ts`

**Change Location:** After line 67 (after AutoGen debugging completes)

```typescript
// ADD IMPORT at top:
import { getOperationSummary } from '@/lib/file-operation-guards';

// UPDATE: After debugResult is returned (around line 67)

console.log(`[QA] AutoGen Debugging complete: ${debugResult.success ? 'SUCCESS' : 'FAILED'} after ${debugResult.attempts} attempts`);

// ✅ ADD: Log file operations if any were executed
if (debugResult.fileOperations && debugResult.fileOperations.length > 0) {
  const opSummary = getOperationSummary(debugResult.fileOperations);
  console.log(`[QA] File operations executed:`, opSummary);
  console.log(`[QA] File operation details:`, debugResult.fileOperations);
}

// Store debug metadata in artifacts
const newArtifacts = new Map(state.artifacts);
newArtifacts.set('debugMetadata', {
  attempts: debugResult.attempts,
  success: debugResult.success,
  finalErrors: debugResult.validationResult.report.errors.length,
  agentCollaboration: debugResult.collaborationLog,
  fileOperations: debugResult.fileOperations || []  // ✅ ADD FILE OPERATIONS
});

// UPDATE emitNodeComplete summary to include file operations:
const opSummary = getOperationSummary(debugResult.fileOperations || []);
const fileOpsSummary = debugResult.fileOperations && debugResult.fileOperations.length > 0
  ? `File operations: ${opSummary.created} created, ${opSummary.deleted} deleted, ${opSummary.renamed} renamed.`
  : '';

emitNodeComplete('qa', state, duration, {
  taskDescription: 'Validated and debugged code using AutoGen AI system',
  success: debugResult.success,
  output: {
    initialErrors: validationResult.report.errors.length,
    finalErrors: debugResult.validationResult.report.errors.length,
    debugAttempts: debugResult.attempts,
    fixed: debugResult.validationResult.report.errors.length < validationResult.report.errors.length,
    fileOperations: opSummary  // ✅ ADD THIS
  },
  summary: `Found ${validationResult.report.errors.length} error(s). AutoGen debugging ${debugResult.success ? 'succeeded' : 'failed'} after ${debugResult.attempts} attempt(s). Final state: ${debugResult.validationResult.report.errors.length} error(s) remaining. ${fileOpsSummary} ${debugResult.success ? '✅ Code is now valid.' : '⚠️ Some issues remain.'}`
});
```

### ✅ Validation Steps

**Test Scenarios:**

```bash
# Test 1: Missing Page Creation
# Trigger: Multi-page app expecting "about.html" but file is missing
Expected: FileOps Agent creates "about.html" with basic structure

# Test 2: Duplicate File Deletion
# Trigger: Two "index.html" files exist
Expected: FileOps Agent deletes one duplicate

# Test 3: Wrong Extension Rename
# Trigger: "Component.ts" contains JSX (should be .tsx)
Expected: FileOps Agent renames "Component.ts" → "Component.tsx"

# Test 4: Safety Guard - Critical File
# Trigger: Attempt to delete the only HTML file
Expected: Operation rejected by safety guard

# Test 5: Safety Guard - Invalid Filename
# Trigger: Attempt to create "../../../etc/passwd"
Expected: Operation rejected by safety guard
```

### ⚠️ Breaking Changes
**NONE** - File operations are additive and only execute when needed.

### 🔄 Rollback Instructions
```typescript
// Disable file operations globally:
// In lib/langgraph/subgraphs/autogen-debugger.ts
const ENABLE_FILE_OPERATIONS = false; // Set to false to disable

// In fileOperationsAgent function:
if (!ENABLE_FILE_OPERATIONS) {
  return []; // Return empty operations array
}
```

---

## 📅 IMPLEMENTATION ORDER

### **Phase 1: Foundation (Quick Wins)** - 2 hours
**Priority:** HIGH | **Risk:** LOW

1. ✅ **Initiative 1: Ant Design Only** (30 min)
   - Update `component-library-config.ts`
   - Test generation with Ant Design
   - Verify no other design systems active

2. ✅ **Initiative 3.1-3.2: Styling Config Types** (1 hour)
   - Create `styling-config.ts` types
   - Create `styling-defaults.ts` with context-aware logic
   - Unit test default generation

3. ✅ **Initiative 3.3: UX Node Styling Extraction** (30 min)
   - Update UX node to extract styling
   - Test extraction with various inputs

**Deliverables:** Ant Design active, styling types defined, extraction working

---

### **Phase 2: Enhanced UX** - 3 hours
**Priority:** HIGH | **Risk:** MEDIUM

1. ✅ **Initiative 3.4: Update Design System Prompt** (1 hour)
   - Modify `enhanced-design-prompt.ts`
   - Add RTL layout instructions
   - Add animation intensity guidelines
   - Test prompt generation

2. ✅ **Initiative 3.5: Frontend Integration** (1 hour)
   - Update HTML frontend node to use styling config
   - Add RTL HTML transformation
   - Apply custom fonts and colors

3. ✅ **Initiative 3.6: State Management** (1 hour)
   - Update `AppGenState` type
   - Verify styling flows through all nodes
   - End-to-end test with Arabic input

**Deliverables:** Full styling configuration working, RTL supported

---

### **Phase 3: File Operations** - 4 hours
**Priority:** MEDIUM | **Risk:** MEDIUM-HIGH

1. ✅ **Initiative 4.1-4.2: File Ops Foundation** (2 hours)
   - Add file operation types to `autogen-debugger.ts`
   - Implement `fileOperationsAgent()`
   - Implement `executeFileOperations()`
   - Test basic file operations

2. ✅ **Initiative 4.4: Safety Guards** (1 hour)
   - Create `file-operation-guards.ts`
   - Implement all validation functions
   - Test safety guard edge cases

3. ✅ **Initiative 4.5-4.6: Integration** (1 hour)
   - Update AutoGen debugger main loop
   - Update QA node to log file operations
   - End-to-end test with missing page scenario

**Deliverables:** File operations working, safety guards active

---

### **Phase 4: Next.js Support** - 8 hours
**Priority:** MEDIUM | **Risk:** HIGH

1. ✅ **Initiative 2.1: Mode Config** (1 hour)
   - Create `generation-mode-config.ts`
   - Implement mode selection logic
   - Test mode detection

2. ✅ **Initiative 2.2: PM Node Update** (30 min)
   - Update PM node to detect generation mode
   - Test mode flows to frontend

3. ✅ **Initiative 2.3: Next.js Frontend Node** (4 hours)
   - Create `frontend-node-nextjs.ts`
   - Implement all generator functions:
     - Config files (package.json, tsconfig, etc.)
     - Layout and page generation
     - Component generation (Navigation, Hero, etc.)
     - Database client and API routes
   - Test each generator individually

4. ✅ **Initiative 2.4-2.5: Routing** (1 hour)
   - Rename current frontend node to `frontend-node-html.ts`
   - Create frontend router
   - Test routing logic

5. ✅ **Initiative 2.6: Validation** (1.5 hours)
   - Add TypeScript/TSX validation
   - Test Next.js app generation end-to-end
   - Run `npm install && npm run dev` on generated app

**Deliverables:** Next.js generation working, apps build and run successfully

---

### **Phase 5: Testing & Documentation** - 2 hours
**Priority:** HIGH | **Risk:** LOW

1. ✅ **Regression Testing** (1 hour)
   - Test existing HTML generation still works
   - Test all design systems (enable V0, Enhanced, etc.)
   - Test multi-page apps
   - Test database integration

2. ✅ **Documentation** (1 hour)
   - Update README with new features
   - Create user guide for styling options
   - Create developer guide for adding design systems
   - Document file operations capabilities

**Deliverables:** All tests passing, documentation complete

---

## 🧪 TESTING STRATEGY

### Unit Tests
```typescript
// Test 1: Design System Toggle
test('only Ant Design is active', () => {
  const active = getActiveLibraries();
  expect(active).toHaveLength(1);
  expect(active[0].id).toBe('antDesign');
});

// Test 2: Styling Config Extraction
test('extracts RTL from Arabic text', () => {
  const result = getContextualStylingDefaults({}, 'موقع إلكتروني');
  expect(result.layout?.direction).toBe('rtl');
});

// Test 3: File Operation Safety
test('rejects deletion of only HTML file', () => {
  const files = [{ path: 'index.html', content: '...' }];
  const op = { type: 'delete', path: 'index.html', reason: 'test' };
  const result = validateFileOperation(op, files);
  expect(result.valid).toBe(false);
});

// Test 4: Generation Mode Detection
test('selects Next.js for dashboards', () => {
  const mode = selectGenerationMode({ appType: 'dashboard' });
  expect(mode).toBe('nextjs');
});
```

### Integration Tests
```bash
# Test HTML Generation
curl -X POST /api/ai/prototype \
  -d '{"description": "landing page"}' \
  | jq '.files[0].path'
# Expected: "index.html"

# Test Next.js Generation
curl -X POST /api/ai/prototype \
  -d '{"description": "dashboard"}' \
  | jq '.files | map(.path)'
# Expected: ["package.json", "app/page.tsx", ...]

# Test Styling Extraction
curl -X POST /api/ai/prototype \
  -d '{"description": "موقع باللغة العربية مع اللون الأزرق"}' \
  | jq '.stylingConfig'
# Expected: { layout: { direction: "rtl" }, colorTheme: { primary: "#1890ff" } }

# Test File Operations
# (Trigger validation error with missing page)
# Expected: AutoGen creates missing page automatically
```

### End-to-End Tests
1. Generate simple HTML landing page
2. Generate complex Next.js dashboard
3. Generate RTL Arabic website
4. Generate app with database
5. Trigger validation errors and verify auto-fix
6. Verify file operations execute correctly

---

## 🚨 ROLLBACK PLAN

### Emergency Rollback Procedures

#### **Rollback Phase 4 (Next.js Support)**
```typescript
// Force HTML mode globally
// In lib/generation-mode-config.ts
export function selectGenerationMode(context: any): GenerationMode {
  return 'html'; // FORCE HTML MODE
}
```

#### **Rollback Phase 3 (File Operations)**
```typescript
// Disable file operations
// In lib/langgraph/subgraphs/autogen-debugger.ts
async function fileOperationsAgent(...) {
  return []; // RETURN EMPTY - NO FILE OPERATIONS
}
```

#### **Rollback Phase 2 (Enhanced UX)**
```typescript
// Use default styling only
// In lib/langgraph/nodes/ux-node.ts
// Comment out styling extraction section (lines 52-90)
const stylingConfig = null; // DISABLE STYLING EXTRACTION
```

#### **Rollback Phase 1 (Ant Design Only)**
```typescript
// Re-enable all design systems
// In lib/component-library-config.ts
toggleLibrary('v0accessible', true);
toggleLibrary('databaseExamples', true);
toggleLibrary('enhanced2025', true);
```

### Partial Rollback
If only one initiative fails, roll back that initiative only while keeping others.

---

## ✅ PRE-IMPLEMENTATION CHECKLIST

Before starting implementation, verify:

- [ ] Git repository has clean working directory
- [ ] All current tests are passing
- [ ] Database backup completed
- [ ] Development environment ready (Node.js, npm installed)
- [ ] IDE/editor configured for TypeScript
- [ ] `.env` file has correct configuration
- [ ] PocketBase server is running
- [ ] No pending PRs or unmerged changes

---

## 📝 POST-IMPLEMENTATION CHECKLIST

After completing all phases:

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] HTML generation still works (backward compatibility)
- [ ] Next.js generation works and apps run
- [ ] Styling configuration captured correctly
- [ ] File operations execute safely
- [ ] Ant Design components render correctly
- [ ] Database integration works in both modes
- [ ] RTL layout works for Arabic/Hebrew
- [ ] Documentation updated
- [ ] User guide created
- [ ] Developer guide created
- [ ] Git commit with detailed message
- [ ] Tag release version
- [ ] Deploy to staging for QA
- [ ] Monitor error logs for 24 hours
- [ ] Get user feedback
- [ ] Deploy to production

---

## 🎯 SUCCESS CRITERIA

### Functional Requirements
✅ All design systems except Ant Design are disabled
✅ Ant Design components used in all generated apps
✅ Next.js/TypeScript apps can be generated
✅ Generated Next.js apps build and run successfully
✅ Styling configuration extracted from user input
✅ RTL layout works correctly for Arabic/Hebrew
✅ Custom fonts and colors applied correctly
✅ Animations intensity controlled by user preference
✅ File operations (create/delete/rename) work correctly
✅ Safety guards prevent dangerous file operations
✅ HTML generation still works (backward compatibility)

### Non-Functional Requirements
✅ No breaking changes to existing functionality
✅ Performance: Generation time < 30 seconds
✅ Error rate: < 5% of generations fail
✅ Rollback: Can revert to previous state in < 5 minutes
✅ Documentation: Complete and accurate
✅ Code quality: TypeScript types, no lint errors
✅ Test coverage: > 80% for new code

---

## 🔗 RELATED DOCUMENTATION

**To Be Created:**
- `docs/STYLING_CONFIGURATION.md` - User guide for styling options
- `docs/GENERATION_MODES.md` - HTML vs Next.js mode selection
- `docs/FILE_OPERATIONS.md` - Developer guide for file operations
- `docs/DESIGN_SYSTEM_INTEGRATION.md` - Adding new design systems
- `docs/RTL_LAYOUT_GUIDE.md` - Supporting RTL languages

**Existing Documentation:**
- `lib/component-library-config.ts` - Design system configuration
- `lib/langgraph/README.md` - LangGraph workflow documentation
- `lib/validation.ts` - Code validation rules

---

## 📞 SUPPORT & FEEDBACK

**Issues Encountered During Implementation:**
- Document all issues in `IMPLEMENTATION_LOG.md`
- Track blocking issues separately
- Escalate critical issues immediately

**Questions & Clarifications:**
- Maintain a Q&A log in this document
- Update as decisions are made
- Reference issue numbers

---

## 🎉 CONCLUSION

This plan covers **4 major initiatives** to transform your app generation system:

1. ✅ **Ant Design Only** - Consistent, professional UI
2. ✅ **Next.js/TypeScript Support** - Production-ready apps
3. ✅ **Enhanced UX Styling** - Full control over appearance
4. ✅ **File Operations** - Self-healing code generation

**Total Estimated Time:** 15-20 hours
**Implementation Order:** Sequential phases with clear dependencies
**Risk Mitigation:** Comprehensive testing and rollback plans
**Success Metrics:** Functional and non-functional criteria defined

**Ready to begin implementation when approved!**

---

**Document Status:** 🟡 PLANNED - AWAITING APPROVAL
**Last Updated:** 2025-01-23
**Next Steps:** Review plan → Get approval → Begin Phase 1
