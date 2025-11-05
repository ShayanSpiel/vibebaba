// @ts-nocheck
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UNIFIED FRONTEND NODE - Next.js AI Autonomy Architecture
// Always generates Next.js + TypeScript + Tailwind
// AI decides file structure, count, and complexity
// SCHEMA-FIRST: Generates types first, then other files with type contract
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { generateWithLogging, estimateTokens } from '@/lib/langgraph/ai-with-logging';
import { getComponentCatalog, getCatalogTokenEstimate } from '@/lib/component-catalog';
import { getPagePatternsPrompt, getMinimalPatternReference } from '@/lib/page-patterns';
import { getNextJSScaffold, getRoutingConventions } from '@/lib/file-structure-scaffold';
import type { AppGenState } from '../types';
import { colord } from 'colord';
import { selectExamplesForCategory } from '@/lib/example-selector';
import { getConversationContext, addAssistantMessage, conversationMemoryStore } from '@/lib/memory/conversation-memory';
import {
  zustandStoreTemplate,
  queryClientTemplate,
  pocketbaseClientTemplate,
  generateApiHooks,
  formUtilsTemplate,
  radixModalComponent,
  radixDropdownComponent,
  radixSelectComponent,
  radixToastComponent,
  generateUpdatedPackageJson
} from '@/lib/infrastructure-templates';
import {
  emitNodeStart,
  emitNodeComplete,
  emitNodeError,
  emitProgress,
  emitFilePlanningStart,
  emitFilePlanningComplete,
  emitFileCreating,
  emitFileCreated
} from '../events';
import { getMCPManager } from '@/lib/mcp-client';
import { extractTypeDefinitions, formatTypeDefinitionsForContext, type TypeDefinition } from '../utils/type-extractor';
import { buildEnhancedContext } from '../utils/export-extractor';
import { validateGeneratedUI, applyAutoFixes, getValidationSummary, hasQualityIssues } from '@/lib/utils/ui-validator';

/**
 * Convert hex color to HSL format for Tailwind CSS variables
 * @param hex - Hex color code (e.g., "#3B82F6")
 * @returns HSL string (e.g., "221.2 83.2% 53.3%")
 */
function hexToHslString(hex: string): string {
  try {
    const color = colord(hex);
    const hsl = color.toHsl();
    return `${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`;
  } catch (error) {
    console.warn(`[Frontend] ⚠️ Failed to convert ${hex} to HSL, using fallback`);
    return '221.2 83.2% 53.3%'; // Fallback to blue
  }
}

/**
 * Format background context (MCP research data) for frontend prompts
 * @param context - Background context object from UX node
 * @returns Formatted string for injection into prompts
 */
function formatBackgroundContextForFrontend(context: any): string {
  if (!context?.results || context.results.length === 0) return '';

  const results = context.results.slice(0, 3); // Limit to top 3 results
  const formattedResults = results.map((r: any) => {
    const title = r.title || 'Research Result';
    const summary = r.summary || r.content?.substring(0, 200) || 'No summary available';
    return `• ${title}\n  ${summary}`;
  }).join('\n\n');

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESEARCH CONTEXT (API docs, design inspiration)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${formattedResults}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

/**
 * PHASE 1: AI Plans File Structure
 * Returns JSON array of files to generate
 */
async function planFileStructure(state: AppGenState, conversationContext?: string): Promise<Array<{path: string; purpose: string; dependencies?: string[]}>> {
  console.log('[Frontend] 📋 Phase 1: Planning file structure...');

  const hasBackend = !!(state.backendConfig?.collections && state.backendConfig.collections.length > 0);
  const collections = hasBackend
    ? state.backendConfig!.collections!.map(c => ({ name: c.name, fields: c.fields.map(f => f.name).join(', ') }))
    : [];
  const pages = hasBackend && state.backendConfig?.pages
    ? state.backendConfig.pages
    : [];

  // Skip memory calls - minimal value for token cost
  let userPreferences = '';

  // Get structural guidance (NOT rigid file lists)
  const scaffold = getNextJSScaffold();
  const routing = getRoutingConventions('nextjs');

  // Get file budget from complexity
  const targetFileCount = state.context?.complexity === 'simple' ? 3 : state.context?.complexity === 'complex' ? 9 : 6;
  const fileBreakdown = {
    base: 4,
    pages: pages.length || 1,
    api: collections.length || 0,
    remaining: 3
  };

  const mvpFeaturesList = state.allRequestedFeatures
    ?.filter((f: any) => f.included_in_mvp)
    .map((f: any) => f.name)
    .join(', ') || 'Core features only';

  const prompt = `${conversationContext || ''}

Plan Next.js file structure for: "${state.userDescription}"

Context:
- Complexity: ${state.context?.complexity || 'moderate'}
- Design: ${state.context?.designStyle || 'modern'}
- Backend: ${hasBackend ? `Yes - Collections: ${JSON.stringify(collections)}` : 'No backend'}
${pages.length > 0 ? `- Required Pages: ${JSON.stringify(pages)}` : ''}
${userPreferences ? `- User preferences: ${userPreferences}` : ''}

🎯 MVP SCOPE - ONLY BUILD THESE FEATURES:
${mvpFeaturesList}

🚨 CRITICAL: ONLY generate files for MVP features above!
Do NOT generate dashboard/admin/settings pages unless they're in the MVP list.

🚨 REQUIRED NEXT.JS FILES (MUST INCLUDE):
1. src/app/layout.tsx - Root layout component (MANDATORY)
2. src/app/page.tsx - Home page component (MANDATORY)
3. src/app/globals.css - Global styles with custom colors (MANDATORY)

TYPES:
- Define types inline in components where needed
- DO NOT create a separate types.ts file
- DO NOT define component prop types

All code goes in src/ folder:
- src/app/ (pages, layouts, globals.css)
- src/lib/ (ONLY for backend API client if backend exists, NO types.ts, NO utils.ts)

Styling: Use Tailwind CSS classes directly (no separate component files needed)

Auto-provided (do not create):
- package.json, next.config.js, tsconfig.json, tailwind.config.js

🎯 MVP RULES (CRITICAL):
${state.allRequestedFeatures && state.allRequestedFeatures.length > 1 ? `
- ONLY build pages for MVP features: ${state.allRequestedFeatures.filter((f: any) => f.included_in_mvp).map((f: any) => f.name).join(', ')}
- DO NOT build pages for queued features: ${state.allRequestedFeatures.filter((f: any) => !f.included_in_mvp).map((f: any) => f.name).join(', ')}
- Keep it MINIMAL - ${state.allRequestedFeatures.filter((f: any) => f.included_in_mvp).length} feature(s) only!
` : '- Keep it simple/minimum - ONE main feature only'}
- Each MVP feature should have 1 page maximum
- All UI inline (no helper components)
- DO NOT create navigation links to pages you're not building!

${scaffold}

${routing}

File Structure Rules:
${hasBackend ? `- Use API functions for data (database is pre-populated)
- Import from '@/lib/api' and use provided functions (NEVER use '@/src/lib/api' - the @ already points to root)
- NO sample data arrays - fetch from backend` : `- Use client-side state (useState) with sample data arrays
- NO API calls`}
- NO API routes, NO db.ts file
- NO component library imports (@/components/ui) - build UI with native HTML + Tailwind
- CRITICAL: All imports use '@/' prefix (e.g., '@/lib/api', '@/app/layout') - NEVER '@/src/'

IMPORTANT:
- Return ONLY a JSON array
- Keep it minimal - generate ONLY files that are absolutely necessary
- For simple landing pages: typically 3-4 files (layout, page, globals.css, optionally lib/api.ts if backend)
- DO NOT create separate component files - inline everything in page.tsx

Return format:
[
  {"path": "src/app/layout.tsx", "purpose": "Root layout"},
  {"path": "src/app/page.tsx", "purpose": "Home page"},
  {"path": "src/app/globals.css", "purpose": "Global styles"}
]

No explanations, just the JSON array.`;

  const estimatedTokens = estimateTokens(prompt);
  console.log(`[Frontend] 🤖 AI Call: File Structure Planning (~${estimatedTokens} tokens)`);

  const resultText = await generateWithLogging({
    prompt,
    projectId: state.projectId,
    nodeName: 'frontend',
    callType: 'planning',
    estimatedTokens,
    attempt: 1
  });

  // Parse JSON response
  let fileStructure: Array<{path: string; purpose: string; dependencies?: string[]}> = [];
  try {
    // Clean up response (remove markdown fences if present)
    let cleanedResult = resultText.trim();
    if (cleanedResult.startsWith('```json')) {
      cleanedResult = cleanedResult.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedResult.startsWith('```')) {
      cleanedResult = cleanedResult.replace(/```\n?/g, '');
    }

    fileStructure = JSON.parse(cleanedResult);
    console.log(`[Frontend] ✅ File structure planned: ${fileStructure.length} files`);
    console.log('[Frontend] Files:', fileStructure.map(f => f.path).join(', '));

    // 🚨 MVP ENFORCEMENT: Hard limit on page count
    const mvpFeatureCount = state.allRequestedFeatures
      ? state.allRequestedFeatures.filter((f: any) => f.included_in_mvp).length
      : 1;

    // Maximum pages = 3 core files + (3-4 pages per MVP feature) - more generous limit
    const maxPages = 3 + (mvpFeatureCount * 4); // Allow more pages per feature for detail routes

    if (fileStructure.length > maxPages) {
      console.log(`[Frontend] ⚠️  Too many files planned (${fileStructure.length}), enforcing MVP limit of ${maxPages}`);

      // Keep core files + limit feature pages
      const coreFiles = fileStructure.filter((f: any) =>
        f.path.includes('layout.tsx') ||
        f.path.includes('globals.css') ||
        f.path === 'src/app/page.tsx' ||
        f.path.includes('lib/api.ts') ||
        f.path.includes('.env.local')
      );

      const featureFiles = fileStructure.filter((f: any) =>
        !f.path.includes('layout.tsx') &&
        !f.path.includes('globals.css') &&
        f.path !== 'src/app/page.tsx' &&
        !f.path.includes('lib/api.ts') &&
        !f.path.includes('.env.local')
      );

      // Filter out auth-dependent pages if no auth endpoints exist
      const hasAuth = state.backendConfig?.apiEndpoints?.some((ep: any) =>
        ep.path.includes('/auth/') || ep.handler.includes('login') || ep.handler.includes('register') || ep.handler.includes('getCurrentUser')
      );

      let filteredFeatureFiles = featureFiles;
      if (!hasAuth) {
        console.log('[Frontend] ⚠️  No auth endpoints detected, removing auth-dependent pages');
        // Remove dashboard/settings/profile pages that require getCurrentUser
        filteredFeatureFiles = featureFiles.filter((f: any) =>
          !f.path.includes('/dashboard/') &&
          !f.path.includes('/settings') &&
          !f.path.includes('/profile') &&
          !f.path.includes('/login') &&
          !f.path.includes('/register')
        );
      }

      // 🚨 SMART PRIORITIZATION: Keep dynamic routes like [slug], [id] as they're essential
      const dynamicRoutes = filteredFeatureFiles.filter((f: any) =>
        f.path.includes('[') && f.path.includes(']')
      );
      const staticPages = filteredFeatureFiles.filter((f: any) =>
        !f.path.includes('[') && !f.path.includes(']')
      );

      // Prioritize dynamic routes (detail pages), then static pages
      const remainingSlots = maxPages - coreFiles.length;
      const limitedFeatureFiles = [
        ...dynamicRoutes, // Keep ALL dynamic routes first (critical for links)
        ...staticPages.slice(0, Math.max(0, remainingSlots - dynamicRoutes.length))
      ];

      fileStructure = [...coreFiles, ...limitedFeatureFiles];

      console.log(`[Frontend] ✅ Reduced to ${fileStructure.length} files for MVP`);
      console.log(`[Frontend] 📄 Kept ${dynamicRoutes.length} dynamic routes, ${staticPages.slice(0, Math.max(0, remainingSlots - dynamicRoutes.length)).length} static pages`);
      console.log('[Frontend] Final files:', fileStructure.map(f => f.path).join(', '));
    }
  } catch (error) {
    console.error('[Frontend] ❌ Failed to parse file structure JSON:', error);
    console.error('[Frontend] Raw response:', resultText);

    // Fallback: minimal Next.js structure
    console.log('[Frontend] Using fallback minimal structure');
    fileStructure = [
      { path: 'src/app/layout.tsx', purpose: 'Root layout' },
      { path: 'src/app/page.tsx', purpose: 'Home page' }
    ];

    // Add backend integration if needed
    if (hasBackend) {
      // NOTE: Backend handled by Express (api/server.js, api/db.js)
      // Frontend calls Express via src/lib/api.ts (auto-generated after loop)
      // NO Next.js API routes needed (static export mode)
      // Add pages from backend
      for (const page of pages) {
        if (page.route !== '/') {
          fileStructure.push({
            path: `src/app${page.route}/page.tsx`,
            purpose: `${page.name} page`
          });
        }
      }
    }
  }

  return fileStructure;
}

/**
 * PHASE 2: AI Generates Individual File
 * Returns file content for a single file
 * NEW: Accepts optional type definitions for Schema-First approach
 */
async function generateFile(
  state: AppGenState,
  filePlan: { path: string; purpose: string; dependencies?: string[] },
  previousFiles: Array<{ path: string; content: string; purpose: string }>,
  componentCatalog: string,
  pagePatterns: string,
  typeDefinitions?: TypeDefinition[],  // NEW: Optional type contract
  conversationContext?: string,  // NEW: Conversation memory for multi-turn editing
  exampleContext?: string  // NEW: Component examples from database
): Promise<string> {
  console.log(`[Frontend] 📝 Generating: ${filePlan.path}`);
  console.log(`[Frontend] 🔍 Path check: "${filePlan.path}" === "src/app/globals.css" ? ${filePlan.path === 'src/app/globals.css'}`);
  console.log(`[Frontend] 🔍 Path includes check: filePlan.path.includes('globals.css') ? ${filePlan.path.includes('globals.css')}`);
  console.log(`[Frontend] 🔍 Path type: ${typeof filePlan.path}, value: "${filePlan.path}"`);

  const hasBackend = !!(state.backendConfig?.collections && state.backendConfig.collections.length > 0);
  const collections = hasBackend ? state.backendConfig!.collections! : [];

  // NEW: Build enhanced context with type definitions and export signatures
  const typeDefinitionsContext = typeDefinitions && typeDefinitions.length > 0
    ? formatTypeDefinitionsForContext(typeDefinitions)
    : '';

  const enhancedContext = buildEnhancedContext(previousFiles, typeDefinitionsContext);

  // Skip memory calls for first-time users (no context exists)
  let memoryContext = '';

  // Backend integration instructions - ULTRA CONCISE
  const backendInstructions = hasBackend
    ? `\n🔗 API: Import from '@/lib/api' (NOT '@/src/lib/api')

🚨 EXACT FUNCTION SIGNATURES (DO NOT MODIFY):
${state.backendConfig?.apiEndpoints?.map(ep => {
  const pathParams = (ep.path.match(/:[a-zA-Z_][a-zA-Z0-9_]*/g) || []).map((p: string) => p.slice(1));
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(ep.method);
  let params = [];
  pathParams.forEach((param: string) => params.push(`${param}`));
  if (hasBody) params.push('{ key: value }');
  return `${ep.handler}(${params.join(', ')})`;
}).join('\n')}

⚠️ Use EXACT signatures above - DO NOT add/remove parameters!
⚠️ NO params shown? Call with NO params: functionName()
⚠️ DO NOT invent params based on function name!

Import example:
import { ${state.backendConfig?.apiEndpoints?.[0]?.handler || 'submitData'} } from '@/lib/api'
`
    : '';

  // Special handling for layout and page components
  let specialInstructions = '';
  if (filePlan.path === 'src/app/layout.tsx') {
    // Map font family to valid Google Font (handle 'system' edge case)
    const rawFont = state.stylingConfig?.typography?.fontFamily || 'Inter';
    const font = rawFont === 'system' ? 'Inter' : rawFont;  // 'system' doesn't exist in Google Fonts

    const headingWeight = state.stylingConfig?.typography?.headingWeight || 700;
    const bodyWeight = state.stylingConfig?.typography?.bodyWeight || 400;
    const scale = state.stylingConfig?.typography?.scale || 'normal';
    const mode = state.stylingConfig?.colorTheme?.mode || 'light';
    const fontWeights = state.stylingConfig?.typography?.weights || [bodyWeight, headingWeight];

    // ✅ Font weight validation - each Google Font has different available weights
    const fontWeightLimits: Record<string, number[]> = {
      'Inter': [100, 200, 300, 400, 500, 600, 700, 800, 900],
      'Roboto': [100, 300, 400, 500, 700, 900],
      'Poppins': [100, 200, 300, 400, 500, 600, 700, 800, 900],
      'Montserrat': [100, 200, 300, 400, 500, 600, 700, 800, 900],
      'Open Sans': [300, 400, 500, 600, 700, 800],
      'Lato': [100, 300, 400, 700, 900],
      'Playfair Display': [400, 500, 600, 700, 800, 900],
      'Space Grotesk': [300, 400, 500, 600, 700]
    };

    // ✅ COMPREHENSIVE STYLING CONFIG LOGGING FOR LAYOUT
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Frontend] 🎨 STYLING CONFIG FOR layout.tsx:');
    console.log('[Frontend] 📋 Font Config:', {
      fontFamily: font,
      headingWeight: headingWeight,
      bodyWeight: bodyWeight,
      weights: fontWeights,
      scale: scale
    });
    console.log('[Frontend] 📋 Theme Mode:', mode);

    // Filter weights to only include those supported by the font
    const availableWeights = fontWeightLimits[font] || [300, 400, 500, 600, 700];
    const validWeights = fontWeights.filter((w: number) => availableWeights.includes(w));

    // If no valid weights, use font defaults
    const finalWeights = validWeights.length > 0 ? validWeights : [bodyWeight, headingWeight].filter((w: number) => availableWeights.includes(w));

    // If still no valid weights (edge case), use closest available
    const safeWeights = finalWeights.length > 0 ? finalWeights : [availableWeights.includes(400) ? 400 : availableWeights[Math.floor(availableWeights.length / 2)]];

    console.log('[Frontend] 📋 Font Weight Validation:', {
      requested: fontWeights,
      available: availableWeights,
      filtered: safeWeights
    });

    // Font weight array for Next.js font import (deduplicated and sorted)
    const uniqueWeights = Array.from(new Set(safeWeights as number[])).sort((a, b) => a - b);
    const weightsArray = uniqueWeights.map(w => w.toString());

    const weights = { body: bodyWeight, heading: headingWeight };
    console.log('[Frontend] 🎨 Calculated Font Weights:', {
      body: weights.body,
      heading: weights.heading,
      forScale: scale
    });
    const htmlClass = mode === 'dark' ? ' className="dark"' : '';
    console.log('[Frontend] 🌗 HTML Class:', htmlClass || 'none (light mode)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Convert font name to import-safe format (replace spaces with underscores)
    const fontImportName = font.replace(/\s+/g, '_');
    const fontVarName = font.replace(/\s+/g, '').toLowerCase();

    // ✨ NEW: Include React Query provider if backend exists
    const hasBackendForLayout = !!(state.backendConfig?.collections && state.backendConfig.collections.length > 0);

    if (hasBackendForLayout) {
      specialInstructions = `
LAYOUT WITH PROVIDERS - Use this EXACT structure:
'use client';

import { ${fontImportName} } from 'next/font/google'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ToastProvider } from '@/components/ui/Toast'
import { useState } from 'react'
import './globals.css'

const ${fontVarName} = ${fontImportName}({
  subsets: ['latin'],
  weight: [${weightsArray.map(w => `'${w}'`).join(', ')}]
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        retry: 3,
        refetchOnWindowFocus: true
      }
    }
  }))

  return (
    <html lang="en"${htmlClass} suppressHydrationWarning>
      <body className={${fontVarName}.className}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            {children}
          </ToastProvider>
          {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </body>
    </html>
  )
}

CRITICAL RULES:
- layout.tsx MUST be minimal - ONLY font + providers + {children}
- DO NOT add <header>, <nav>, <footer>, or any UI elements
- DO NOT use any icons - navigation/logos go in page.tsx
- DO NOT import cn() or other utilities - they don't exist
- Keep the exact structure above - just wrap {children} with providers
`;
    } else {
      specialInstructions = `
LAYOUT - Use this EXACT structure (DO NOT add navigation/header/footer - those go in page.tsx):
import { ${fontImportName} } from 'next/font/google'
import './globals.css'

const ${fontVarName} = ${fontImportName}({
  subsets: ['latin'],
  weight: [${weightsArray.map(w => `'${w}'`).join(', ')}]
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"${htmlClass} suppressHydrationWarning>
      <body className={${fontVarName}.className}>{children}</body>
    </html>
  )
}

CRITICAL RULES:
- layout.tsx MUST be minimal - ONLY font + {children}
- DO NOT add <header>, <nav>, <footer>, or any UI elements
- DO NOT use any icons - navigation/logos go in page.tsx
- DO NOT import cn() or other utilities - they don't exist
- Keep the exact structure above - just wrap {children}
`;
    }
  } else if (filePlan.path.includes('/page.tsx')) {
    const vibe = state.context?.designStyle || 'modern';
    const animations = state.stylingConfig?.animations || {
      enabled: true,
      intensity: 'subtle',
      transitions: true,
      hoverEffects: true,
      pageTransitions: false
    };
    const iconStyle = state.stylingConfig?.iconography?.style || 'outlined';
    const iconSize = (state.stylingConfig?.iconography?.size || 'medium') as 'small' | 'medium' | 'large';
    const iconSource = (state.stylingConfig?.iconography?.source || 'lucide') as 'lucide' | 'heroicons' | 'material-icons';

    // Extract color theme for design context
    const colors = state.stylingConfig?.colorTheme;
    const mode = colors?.mode || 'light';

    // Map icon size to Tailwind classes
    const iconSizeClass = {
      small: 'h-4 w-4',
      medium: 'h-5 w-5',
      large: 'h-6 w-6'
    }[iconSize];

    // Map icon library to import path
    const iconLibrary = {
      'lucide': {
        import: 'lucide-react',
        instructions: 'import { IconName } from "lucide-react"',
        examples: 'Icons from lucide-react. Use sparingly - only 1-2 icons for simple forms!'
      },
      'heroicons': {
        import: '@heroicons/react/24/outline',
        instructions: 'import { IconName } from "@heroicons/react/24/outline"',
        examples: 'Icons from heroicons. Use sparingly - only 1-2 icons for simple forms!'
      },
      'material-icons': {
        import: '@mui/icons-material',
        instructions: 'import IconName from "@mui/icons-material/IconName"',
        examples: 'Icons from MUI. Use sparingly - only 1-2 icons for simple forms!'
      }
    }[iconSource] || {
      import: 'lucide-react',
      instructions: 'import { IconName } from "lucide-react"',
      examples: 'Icons from lucide-react. Use sparingly - only 1-2 icons for simple forms!'
    };

    // Map layout spacing to Tailwind classes
    const spacing = (state.stylingConfig?.layout?.spacing || 'normal') as 'compact' | 'normal' | 'spacious';
    const spacingClasses = {
      compact: { sections: 'py-8 md:py-12', container: 'px-3 md:px-4' },
      normal: { sections: 'py-16 md:py-24', container: 'px-4 md:px-6' },
      spacious: { sections: 'py-24 md:py-32', container: 'px-6 md:px-8' }
    }[spacing];

    // Map layout maxWidth to Tailwind classes
    const maxWidth = state.stylingConfig?.layout?.maxWidth || '1400px';
    const maxWidthClass = {
      '1200px': 'max-w-6xl',
      '1400px': 'max-w-7xl',
      '1600px': 'max-w-[1600px]',
      'full': 'max-w-full'
    }[maxWidth] || 'max-w-7xl';

    specialInstructions = `
SPECIAL INSTRUCTIONS FOR PAGE COMPONENT:

🚨 CRITICAL - JSX STRUCTURE (MUST BE VALID HTML):
1. Every <tag> MUST have matching </tag> - NO EXCEPTIONS!
2. Single root element must wrap ALL content
3. Check your opening/closing tags MATCH EXACTLY

🚨 CRITICAL - TYPESCRIPT (BUILD WILL FAIL):
1. IMPORTS: Import EVERYTHING you use (icons, components)
   ❌ Using <Loader2 /> without import → FAILS
   ✅ import { Loader2 } from 'lucide-react'

2. ERROR HANDLING: Type catch errors
   ❌ catch (error) { error.message } → FAILS
   ✅ catch (error) { error instanceof Error ? error.message : 'Error' }

3. ARRAY METHODS: Type parameters
   ❌ array.filter(item => ...) → FAILS
   ✅ array.filter((item: string) => ...)

VIBE & STYLE: ${vibe} design with ${animations.intensity} animations, ${spacing} spacing

🎨 COLOR SYSTEM (${mode} mode):
The design uses these colors - Primary: ${colors?.primary || '#3B82F6'}, Accent: ${colors?.accent || '#F59E0B'}
These are already configured in globals.css as CSS variables.

🚨 CRITICAL - YOU MUST USE SEMANTIC TOKENS (NOT hex colors):
❌ FORBIDDEN: bg-[#4DC7C7], bg-neutral-900, bg-gray-800, text-blue-500
✅ REQUIRED: bg-primary, bg-background, bg-secondary, text-foreground

AVAILABLE SEMANTIC TOKENS:
Backgrounds: bg-background (page), bg-secondary (cards), bg-muted (subtle areas)
Text: text-foreground (main text), text-muted-foreground (secondary text)
Interactive: bg-primary, bg-accent, border (borders)
States: bg-success, bg-destructive, bg-warning

LAYOUT & SPACING:
- Sections: Use ${spacingClasses.sections} for vertical spacing
- Container: ${spacingClasses.container} for horizontal padding
- Max width: ${maxWidthClass} mx-auto for content centering
- Responsive: Use md: and lg: breakpoints for mobile-first design

DESIGN QUALITY:
Use Tailwind + utility classes from globals.css (.btn, .card, etc.).

ICONS (USE SPARINGLY): ${iconLibrary.examples} ${iconLibrary.instructions}. Use ${iconSizeClass} sizing. ONLY import icons you actually use!

LOGO GENERATION - ALWAYS CREATE A PROFESSIONAL LOGO:

ALWAYS create a logo for the app using icon + text combinations from the catalog.
Extract brand name from user description or use descriptive name.

Choose logo style based on vibe:
- Modern/Tech: Icon in gradient box + text (Pattern #2)
- Minimal/Clean: Circular icon + text (Pattern #4)
- Bold/Startup: Gradient text logo (Pattern #5)
- Professional: Icon + text + tagline (Pattern #2 with tagline)
- Playful: Stacked logo with colorful icon (Pattern #6)

Logo placement:
- Navbar (top-left): Full logo (icon + text)
- Mobile navbar: Icon only or smaller full logo
- Footer: Full logo or wordmark
- Hero section: Can use larger decorative version

Icon selection:
Choose icon that represents core value (not just industry).
Examples: Zap (speed/energy), Rocket (growth), Sparkles (magic), Shield (security),
         Heart (wellness), TrendingUp (growth), Code (tech), BookOpen (education)

Logo must work in both light and dark modes:
- Use bg-primary for icon backgrounds (consistent color)
- Use text-foreground for text (adapts to mode)
- Or use gradient for premium feel (works in both modes)

${state.images ? `
🖼️ HERO & FEATURE IMAGES - USE THESE PROFESSIONAL PHOTOS:

You have access to curated, high-quality Unsplash images. USE THEM to create a professional look!

Available images:
- Hero Image: ${state.images.hero}
- Feature Image 1: ${state.images.feature1}
- Feature Image 2: ${state.images.feature2}
- Feature Image 3: ${state.images.feature3}
- Background Image: ${state.images.background}

HOW TO USE IMAGES:

1. HERO SECTION (landing page):
   <div className="relative h-[600px] overflow-hidden rounded-2xl">
     <img
       src="${state.images.hero}"
       alt="Hero"
       className="absolute inset-0 w-full h-full object-cover"
     />
     <div className="absolute inset-0 bg-black/40" />
     <div className="relative z-10 flex items-center justify-center h-full text-white">
       {/* Your hero content */}
     </div>
   </div>

2. FEATURE SECTIONS (use feature images):
   <div className="grid md:grid-cols-2 gap-8">
     <img
       src="${state.images.feature1}"
       alt="Feature"
       className="rounded-lg shadow-lg w-full h-64 object-cover"
     />
     <div>{/* Feature text */}</div>
   </div>

3. BACKGROUND IMAGES (optional, for sections):
   <section
     style={{ backgroundImage: 'url(${state.images.background})' }}
     className="bg-cover bg-center py-20"
   >
     <div className="bg-black/50 py-20">{/* Content */}</div>
   </section>

4. PRODUCT CARDS (for e-commerce):
   <div className="card">
     <img
       src="${state.images.feature1}"
       alt="Product"
       className="w-full h-48 object-cover rounded-t-lg"
     />
     <div className="p-4">{/* Product details */}</div>
   </div>

IMAGE BEST PRACTICES:
- ✅ USE hero image for main landing page hero section
- ✅ USE feature images for product cards, feature sections, about sections
- ✅ ADD object-cover class to maintain aspect ratio
- ✅ ADD rounded-lg or rounded-xl for modern look
- ✅ ADD shadow-lg for depth
- ✅ For hero sections, add dark overlay (bg-black/40) for text readability
- ❌ DON'T use placeholder URLs - use the provided Unsplash URLs
- ❌ DON'T use gradient backgrounds where a real image would look better
` : ''}


🚨 NAVIGATION/HEADER RULES (CRITICAL - PREVENTS 404 ERRORS):
${state.allRequestedFeatures && state.allRequestedFeatures.length > 1 ? `
ONLY create navigation links for pages you're actually building!
Pages being built: ${['Home (/)'].concat(state.allRequestedFeatures.filter((f: any) => f.included_in_mvp).map((f: any) => f.name)).join(', ')}
❌ DO NOT link to pages you're NOT building: ${state.allRequestedFeatures.filter((f: any) => !f.included_in_mvp).map((f: any) => f.name).join(', ')}
` : ''}
- DO NOT create links to /blog, /about, /contact, /services, etc. unless those pages actually exist
- ONLY link to routes that exist: typically just "/" (home) and maybe "/dashboard" if backend exists
- ❌ WRONG: <Link href="/blog">Blog</Link> when /blog doesn't exist → 404 error!
- ✅ CORRECT: Only show navigation links for actual routes you're building

BUILD RULES:
- Use native HTML elements (button, input, div, section, etc.)
- Style with Tailwind + utility classes from globals.css
- NO imports from @/components/ui/* - these do not exist
- NO cn() or utility functions - build inline with classes only
- CRITICAL: Import paths use '@/' NOT '@/src/' (e.g., '@/lib/api', '@/app/layout')

🚨 ALLOWED NPM PACKAGES (DO NOT USE ANY OTHER PACKAGES):
You can ONLY import from these packages (from package.json):
  ✅ 'react' - Core React (useState, useEffect, etc.)
  ✅ 'react-dom' - React DOM utilities
  ✅ 'next' - Next.js (Link, Image, useRouter, etc.)
  ✅ '${iconLibrary.import}' - Icons ONLY (${iconLibrary.instructions})
  ✅ 'pocketbase' - Backend client (if backend exists)
  ✅ 'zod' - Type validation (if needed)
  ✅ '@/lib/api' - Your API functions (if backend exists)
  ✅ '@/app/*' - Your own app files

❌ FORBIDDEN: DO NOT import ANY other external packages including:
  ❌ react-markdown, react-markdown-editor-lite (NOT available)
  ❌ @/components/ui/* (does not exist)
  ❌ Any other third-party libraries not listed above

🔧 For markdown/rich text editing: Use native HTML <textarea> instead of external editors!
   Example: <textarea className="w-full border rounded-lg p-3" rows={10} />

EXAMPLE OF PERFECT CODE:
\`\`\`typescript
'use client'

import { useState, useEffect } from 'react'
import { Calendar, Plus, Shield, Sparkles, X, Zap } from 'lucide-react'
import { getTasks, createTask } from '@/lib/api'

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTasks().then(setTasks).finally(() => setLoading(false))
  }, [])

  return <div className="p-6">...</div>
}
\`\`\`

KEY POINTS:
- ONE import from 'react' per file
- Commas between ALL imported items: { A, B, C }
- 'use client' when using hooks/events

🚨 DYNAMIC ROUTES: Choose ONE of these TWO valid patterns:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPTION A: CLIENT COMPONENT (Recommended for interactive pages)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Use when page needs: useState, useEffect, onClick, form interactions
✅ Include 'use client' directive
✅ NO generateStaticParams() needed
✅ Fetch data client-side in useEffect

Example - /posts/[id]/page.tsx:
'use client';

import { useState, useEffect } from 'react';
import { getPost } from '@/lib/api';  // ✅ Direct API functions from @/lib/api

export default function PostPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState(null);

  useEffect(() => {
    getPost(params.id).then(setPost);  // Call API function
  }, [params.id]);

  return <div>{post?.title}</div>;
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPTION B: SERVER COMPONENT (Only for static, non-interactive pages)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Use when page is purely static with NO hooks/interactivity
✅ NO 'use client' directive
✅ MUST export generateStaticParams()
✅ Fetch data at build time

Example - /posts/[id]/page.tsx:
// NO 'use client'!

import { getPosts, getPost } from '@/lib/api';  // ✅ Direct API functions from @/lib/api

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map(post => ({ id: post.id }));
}

export default async function PostPage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);
  return <div>{post.title}</div>;
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 CRITICAL RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ NEVER combine 'use client' + generateStaticParams() → Build FAILS!
❌ NEVER use hooks (useState, useEffect) without 'use client' → Build FAILS!
❌ NEVER use useForm() without generic type → TypeScript error!
   ✅ CORRECT: useForm<FormData>({ resolver: zodResolver(schema) })
   ❌ WRONG: useForm({ resolver: zodResolver(schema) })
✅ DEFAULT CHOICE: Use OPTION A (Client Component) for most dynamic routes
✅ Only use OPTION B if page has ZERO interactivity

${hasBackend ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 API IMPORTS - TWO FILES, DIFFERENT PURPOSES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ @/lib/api - Direct API function calls
   ✅ Use when calling APIs in useEffect or event handlers
   ✅ Example: import { getPost, createPost } from '@/lib/api';
   ✅ Functions return promises: getPost(id).then(...)

2️⃣ @/lib/api-hooks - React Query hooks
   ✅ Use for automatic caching/refetching
   ✅ Example: import { usePost, useCreatePost } from '@/lib/api-hooks';
   ✅ Hooks return query objects: const { data, isLoading } = usePost();

🚨 CRITICAL: For OPTION A and OPTION B examples above, ALWAYS use '@/lib/api'
   The examples show direct function calls (getPost), NOT hooks!

BACKEND INTEGRATION - CRITICAL UI PATTERNS:

🚨 EXACT FUNCTION SIGNATURES FROM '@/lib/api' (DO NOT MODIFY):
${state.backendConfig?.apiEndpoints?.map(ep => {
  const pathParams = (ep.path.match(/:[a-zA-Z_][a-zA-Z0-9_]*/g) || []).map((p: string) => p.slice(1));
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(ep.method);
  let params = [];
  pathParams.forEach((param: string) => params.push(`${param}`));
  if (hasBody) params.push('{ key: value }');
  return `await ${ep.handler}(${params.join(', ')})`;
}).join('\n')}

⚠️ Use EXACT signatures - DO NOT add/remove/change parameters!
⚠️ If no params shown, call with NO params!
⚠️ DO NOT guess parameters based on function name!

🚨 CRITICAL - IMPORTS (BUILD WILL FAIL WITHOUT THIS):
You MUST import EVERY function you use from '@/lib/api'!

Example import (import ALL functions used in the file):
import { ${state.backendConfig?.apiEndpoints?.slice(0, 3).map((ep: any) => ep.handler).join(', ')} } from '@/lib/api'

❌ WRONG: Using getCurrentUser() without importing it → Build fails!
✅ CORRECT: import { getCurrentUser, updateUserProfile } from '@/lib/api'

Available functions to import:
${state.backendConfig?.apiEndpoints?.map((ep: any) => `- ${ep.handler}`).join('\n')}

🎨 BACKEND UI REQUIREMENTS (CRITICAL):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 CRITICAL: Backend components MUST use the SAME styling system as non-backend components!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BACKEND COMPONENTS INHERIT ALL STYLING RULES:
✅ Use semantic tokens (bg-primary, bg-background, text-foreground, etc.) - NOT hex colors
✅ Use layout spacing (${spacingClasses.sections} for sections, ${spacingClasses.container} for containers)
✅ Use utility classes from globals.css (.btn, .card, .badge, etc.)
✅ Apply animations (${animations.intensity} intensity: animate-fade-in, animate-slide-up, etc.)
✅ Follow max-width guidelines (${maxWidthClass} mx-auto for content)
✅ Maintain consistent border-radius (configured in globals.css)
✅ Apply proper typography (text-foreground, text-muted-foreground, font weights)

🚨 CONTRAST & SPACING REQUIREMENTS (APPLY TO ALL BACKEND COMPONENTS):
- ALL interactive elements (buttons, inputs, cards) MUST have visible borders with sufficient contrast
- Use border-border or border-muted for default borders (NEVER invisible borders)
- Apply configured spacing: p-4 for cards, p-3 for buttons, py-2.5 px-4 for inputs
- Gap between elements: gap-4 (vertical), gap-3 (horizontal) - use space-y-4 for stacked forms
- Database components (forms, tables, lists) MUST have clear visual separation
- Cards with database data MUST use: bg-secondary or bg-muted with border-border
- Form sections: space-y-6 (between sections), space-y-4 (between fields)

🎨 BACKEND SECTIONS MUST MATCH VISUAL QUALITY OF NON-BACKEND SECTIONS:
- Same background colors (bg-background, bg-secondary for cards)
- Same text colors (text-foreground, text-muted-foreground)
- Same button styling (bg-primary with hover:bg-primary/90)
- Same card styling (border border-border rounded-lg with utility classes)
- Same animations (animate-fade-in, animate-slide-up, hover effects)
- Same padding/spacing (section py-16 md:py-24, container px-4 md:px-6)

1. FORMS with API calls MUST have loading states AND match non-backend button styling:
   const [loading, setLoading] = useState(false)

   // Primary submit button (matches hero CTA buttons):
   <button
     disabled={loading}
     className="px-4 py-3 rounded-lg bg-primary text-primary-foreground border border-primary hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
   >
     {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
     {loading ? 'Submitting...' : 'Submit'}
   </button>

   // Can also use utility classes: className="btn btn-primary btn-lg"

2. INPUT FIELDS MUST match non-backend input styling with icons:
   <div className="relative">
     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 ${iconSizeClass} text-muted-foreground" />
     <input
       type="email"
       className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
       placeholder="Enter your email"
     />
   </div>

   Common icon patterns:
   - Email: <Mail /> on left
   - Search: <Search /> on left
   - Password: <Eye /> on right for toggle
   - Date: <Calendar /> on right
   - All icons: ${iconSizeClass} text-muted-foreground

3. BUTTONS with backend actions MUST match design system:
   ✅ Use .btn utility classes OR manual Tailwind classes
   ✅ Show loading spinner (Loader2 icon) when processing
   ✅ Disable during processing (disabled={loading})
   ✅ Include icons for visual clarity

   Primary action buttons (create/submit):
   className="btn btn-primary btn-lg" OR
   className="px-4 py-3 rounded-lg bg-primary text-primary-foreground border border-primary hover:bg-primary/90 font-medium transition-colors"

   Secondary action buttons (cancel/view):
   className="btn btn-secondary btn-md" OR
   className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 font-medium transition-colors"

   Icon buttons in tables:
   className="p-2 rounded-lg hover:bg-muted transition-colors"

4. ERROR/SUCCESS states MUST use semantic colors WITH proper contrast:
   - Error: border-destructive bg-destructive/10 text-destructive with <AlertCircle /> icon
   - Success: border-success bg-success/10 text-success with <CheckCircle /> icon
   - Warning: border-warning bg-warning/10 text-warning with <AlertTriangle /> icon

5. SEARCH BOXES MUST use proper pattern with visible borders:
   <div className="relative">
     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
     <input className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary" />
   </div>

5.1 DATABASE TABLES/LISTS MUST have clear structure (CRITICAL):
   - Container: className="border border-border rounded-lg overflow-hidden bg-secondary"
   - Header row: className="bg-muted border-b border-border px-4 py-3"
   - Data rows: className="border-b border-border px-4 py-3 hover:bg-muted/50 transition-colors"
   - Action buttons in rows: className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-background"
   - Empty states: className="p-12 text-center text-muted-foreground"

5.2 DATABASE FORMS MUST have proper layout (CRITICAL):
   - Form container: className="space-y-6 max-w-2xl"
   - Field groups: className="space-y-4"
   - Label + Input group: className="space-y-2"
   - Labels: className="block text-sm font-medium text-foreground"
   - Input containers: className="relative" (for icon positioning)
   - Multi-column layouts: use grid with gap-4 (e.g., className="grid grid-cols-1 md:grid-cols-2 gap-4")
   - Form actions: className="flex items-center gap-3 pt-4 border-t border-border"

5.3 DATABASE CARDS/ITEMS MUST have clear visual hierarchy:
   - Card wrapper: className="border border-border rounded-lg p-4 bg-secondary hover:shadow-md transition-shadow"
   - Card header: className="flex items-center justify-between mb-3 pb-3 border-b border-border"
   - Card content: className="space-y-2"
   - Card actions: className="flex items-center gap-2 pt-3 mt-3 border-t border-border"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXAMPLE: Complete backend form section with FULL styling (use as reference):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<section className="${spacingClasses.sections} bg-background">
  <div className="container ${maxWidthClass} mx-auto ${spacingClasses.container}">
    <h2 className="text-3xl font-bold mb-2 text-foreground">Add New Item</h2>
    <p className="text-muted-foreground mb-8">Fill in the details below</p>

    <div className="card card-padding max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Email field with icon */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 ${iconSizeClass} text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* Text field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Success message */}
        {success && (
          <div className="bg-success/10 border border-success rounded-lg p-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle className="${iconSizeClass} text-success" />
              <p className="text-sm font-medium text-success">Successfully submitted!</p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertCircle className="${iconSizeClass} text-destructive" />
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-3 rounded-lg bg-primary text-primary-foreground border border-primary hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />}
            {loading ? 'Submitting...' : 'Submit'}
          </button>
          <button
            type="button"
            className="px-4 py-3 rounded-lg bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</section>

NOTICE: This backend form uses IDENTICAL styling to non-backend sections:
- Same section spacing (${spacingClasses.sections})
- Same container (${maxWidthClass} mx-auto ${spacingClasses.container})
- Same card styling (card card-padding)
- Same semantic colors (bg-primary, text-foreground, border-border)
- Same animations (animate-fade-in)
- Same typography (text-3xl font-bold, text-muted-foreground)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6. NOTIFICATIONS & SUCCESS MESSAGES (CRITICAL for UX):
   After successful API calls:
   const [success, setSuccess] = useState(false)

   // Show success message
   {success && (
     <div className="mb-6 bg-success/10 border border-success rounded-lg p-4 animate-fade-in">
       <div className="flex items-center gap-3">
         <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center">
           <Check className="h-5 w-5 text-white" />
         </div>
         <div>
           <p className="font-medium text-success">Successfully submitted!</p>
           <p className="text-sm text-muted-foreground">Details here</p>
         </div>
       </div>
     </div>
   )}

   After errors:
   {error && (
     <div className="bg-destructive/10 border border-destructive rounded-lg p-4 flex items-start gap-3">
       <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
       <div>
         <p className="font-medium text-destructive">Error</p>
         <p className="text-sm text-destructive/80">{error}</p>
       </div>
     </div>
   )}

   Toast for quick feedback (use for create/update/delete):
   <div className="fixed bottom-4 right-4 max-w-sm animate-slide-up">
     <div className="card card-padding flex items-start gap-3 shadow-lg">
       <CheckCircle className="h-5 w-5 text-success" />
       <div className="flex-1">
         <p className="font-medium">Item created!</p>
       </div>
       <button onClick={dismiss}><X className="h-4 w-4" /></button>
     </div>
   </div>
` : `
NO BACKEND: Use useState for data, no API calls.
`}
`;  }

  // ✅ FIX 29: Check for globals.css using flexible path matching (in case path format varies)
  if (filePlan.path === 'src/app/globals.css' || filePlan.path.endsWith('/globals.css') || filePlan.path === 'globals.css' || filePlan.path.includes('globals.css')) {
    console.log('[Frontend] 🎯 MATCHED globals.css (path check passed) - using direct generation (RETURNING IMMEDIATELY)');
    const colors = state.stylingConfig?.colorTheme;
    const mode = colors?.mode || 'light';
    const typography = state.stylingConfig?.typography;
    const headingWeight = typography?.headingWeight || 700;
    const fontFamily = typography?.fontFamily || 'Inter';
    const animations = state.stylingConfig?.animations || { enabled: true, intensity: 'subtle' };
    const layout = state.stylingConfig?.layout || {};
    const borderRadius = layout?.borderRadius || 'medium';

    // Border radius mapping
    const radiusMap: Record<string, string> = {
      none: '0',
      small: '0.25rem',
      medium: '0.5rem',
      large: '1rem',
      full: '9999px'
    };
    const radiusValue = radiusMap[borderRadius] || '0.5rem';

    // Convert hex colors to HSL strings for Tailwind
    const primaryHSL = colors?.primary ? hexToHslString(colors.primary) : '221.2 83.2% 53.3%';
    const secondaryHSL = colors?.secondary ? hexToHslString(colors.secondary) : '210 40% 96.1%';
    const accentHSL = colors?.accent ? hexToHslString(colors.accent) : '217.2 91.2% 59.8%';
    const backgroundHSL = colors?.background ? hexToHslString(colors.background) : (mode === 'dark' ? '222.2 84% 4.9%' : '0 0% 100%');
    const backgroundSecondaryHSL = colors?.backgroundSecondary ? hexToHslString(colors.backgroundSecondary) : (mode === 'dark' ? '222.2 84% 8%' : '0 0% 98%');
    const backgroundTertiaryHSL = colors?.backgroundTertiary ? hexToHslString(colors.backgroundTertiary) : (mode === 'dark' ? '222.2 84% 11%' : '0 0% 96%');
    const borderHSL = colors?.border ? hexToHslString(colors.border) : (mode === 'dark' ? '240 3.7% 15.9%' : '240 5.9% 90%');
    const mutedHSL = colors?.muted ? hexToHslString(colors.muted) : (mode === 'dark' ? '240 3.7% 15.9%' : '240 4.8% 95.9%');
    const destructiveHSL = colors?.destructive ? hexToHslString(colors.destructive) : '0 84.2% 60.2%';
    const successHSL = colors?.success ? hexToHslString(colors.success) : '142.1 76.2% 36.3%';
    const warningHSL = colors?.warning ? hexToHslString(colors.warning) : '32.1 94.6% 43.7%';
    const infoHSL = colors?.info ? hexToHslString(colors.info) : '221.2 83.2% 53.3%';

    console.log('[Frontend] 🎨 DIRECT GENERATION - globals.css with colors:', {
      primary: colors?.primary ? `${colors.primary} → ${primaryHSL}` : 'default',
      secondary: colors?.secondary ? `${colors.secondary} → ${secondaryHSL}` : 'default',
      accent: colors?.accent ? `${colors.accent} → ${accentHSL}` : 'default',
      border: colors?.border ? `${colors.border} → ${borderHSL}` : 'default',
      muted: colors?.muted ? `${colors.muted} → ${mutedHSL}` : 'default',
      destructive: colors?.destructive ? `${colors.destructive} → ${destructiveHSL}` : 'default',
      success: colors?.success ? `${colors.success} → ${successHSL}` : 'default',
      warning: colors?.warning ? `${colors.warning} → ${warningHSL}` : 'default',
      info: colors?.info ? `${colors.info} → ${infoHSL}` : 'default',
      mode,
      hasColorTheme: !!state.stylingConfig?.colorTheme,
      hasPrimary: !!colors?.primary,
      fontFamily,
      borderRadius,
      animationIntensity: animations.intensity
    });

    // Generate globals.css directly - NO AI, RETURN IMMEDIATELY
    const globalsCss = `/**
 * ⚠️ DO NOT EDIT THIS FILE MANUALLY
 * This file is auto-generated by the VB platform based on your theme settings.
 * Any manual changes will be overwritten when you update your project's styling.
 * To modify styles, use Tailwind utility classes in your components.
 */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ========== BASE COLORS ========== */
    --background: ${backgroundHSL};
    --background-secondary: ${backgroundSecondaryHSL};
    --background-tertiary: ${backgroundTertiaryHSL};
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: ${primaryHSL};
    --primary-foreground: 210 40% 98%;
    --secondary: ${secondaryHSL};
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: ${mutedHSL};
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: ${accentHSL};
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: ${destructiveHSL};
    --destructive-foreground: 210 40% 98%;
    --success: ${successHSL};
    --success-foreground: 210 40% 98%;
    --warning: ${warningHSL};
    --warning-foreground: 222.2 84% 4.9%;
    --info: ${infoHSL};
    --info-foreground: 210 40% 98%;
    --border: ${borderHSL};
    --input: ${borderHSL};
    --ring: ${primaryHSL};
    --radius: ${radiusValue};${state.stylingConfig?.enhancedColors?.semantic ? `

    /* ========== SEMANTIC COLORS (ENRICHED) ========== */
    --text-default: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.textDefault)};
    --text-secondary: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.textSecondary)};
    --text-disabled: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.textDisabled)};
    --text-on-color: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.textOnColor)};
    --bg-default: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.bgDefault)};
    --bg-surface: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.bgSurface)};
    --bg-elevated: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.bgElevated)};
    --bg-overlay: ${state.stylingConfig.enhancedColors.semantic.bgOverlay};
    --border-default: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.borderDefault)};
    --border-subtle: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.borderSubtle)};
    --border-strong: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.borderStrong)};
    --interactive: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.interactive)};
    --interactive-hover: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.interactiveHover)};
    --interactive-active: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.interactiveActive)};` : ''}${state.stylingConfig?.enhancedColors?.shadows ? `

    /* ========== SHADOWS (ENRICHED) ========== */
    --shadow-sm: ${state.stylingConfig.enhancedColors.shadows.sm};
    --shadow-md: ${state.stylingConfig.enhancedColors.shadows.md};
    --shadow-lg: ${state.stylingConfig.enhancedColors.shadows.lg};
    --shadow-xl: ${state.stylingConfig.enhancedColors.shadows.xl};
    --shadow-2xl: ${state.stylingConfig.enhancedColors.shadows['2xl']};
    --shadow-inner: ${state.stylingConfig.enhancedColors.shadows.inner};` : ''}${state.stylingConfig?.spacing ? `

    /* ========== SPACING (ENRICHED) ========== */
    --spacing-0: ${state.stylingConfig.spacing.scale['0']};
    --spacing-1: ${state.stylingConfig.spacing.scale['1']};
    --spacing-2: ${state.stylingConfig.spacing.scale['2']};
    --spacing-3: ${state.stylingConfig.spacing.scale['3']};
    --spacing-4: ${state.stylingConfig.spacing.scale['4']};
    --spacing-6: ${state.stylingConfig.spacing.scale['6']};
    --spacing-8: ${state.stylingConfig.spacing.scale['8']};
    --spacing-12: ${state.stylingConfig.spacing.scale['12']};
    --spacing-16: ${state.stylingConfig.spacing.scale['16']};
    --spacing-24: ${state.stylingConfig.spacing.scale['24']};
    --container-max: ${state.stylingConfig.spacing.layout.containerMax};
    --section-padding: ${state.stylingConfig.spacing.layout.sectionPadding};
    --component-gap: ${state.stylingConfig.spacing.layout.componentGap};` : ''}${state.stylingConfig?.bordering ? `

    /* ========== BORDER RADIUS (ENRICHED) ========== */
    --radius-sm: ${state.stylingConfig.bordering.radiusScale.sm};
    --radius-md: ${state.stylingConfig.bordering.radiusScale.md};
    --radius-lg: ${state.stylingConfig.bordering.radiusScale.lg};
    --radius-xl: ${state.stylingConfig.bordering.radiusScale.xl};
    --radius-2xl: ${state.stylingConfig.bordering.radiusScale['2xl']};
    --radius-full: ${state.stylingConfig.bordering.radiusScale.full};` : ''}${state.stylingConfig?.transitions ? `

    /* ========== TRANSITIONS (ENRICHED) ========== */
    --duration-fast: ${state.stylingConfig.transitions.durations.fast};
    --duration-normal: ${state.stylingConfig.transitions.durations.normal};
    --duration-slow: ${state.stylingConfig.transitions.durations.slow};
    --ease-default: ${state.stylingConfig.transitions.easings.default};
    --ease-spring: ${state.stylingConfig.transitions.easings.spring};
    --z-modal: ${state.stylingConfig.transitions.zIndices.modal};
    --z-popover: ${state.stylingConfig.transitions.zIndices.popover};
    --z-toast: ${state.stylingConfig.transitions.zIndices.toast};` : ''}
  }

  .dark {
    --background: ${mode === 'dark' ? backgroundHSL : '222.2 84% 4.9%'};
    --background-secondary: ${mode === 'dark' ? backgroundSecondaryHSL : '222.2 84% 8%'};
    --background-tertiary: ${mode === 'dark' ? backgroundTertiaryHSL : '222.2 84% 11%'};
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: ${primaryHSL};
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: ${secondaryHSL};
    --secondary-foreground: 210 40% 98%;
    --muted: ${mutedHSL};
    --muted-foreground: 215 20.2% 65.1%;
    --accent: ${accentHSL};
    --accent-foreground: 210 40% 98%;
    --destructive: ${destructiveHSL};
    --destructive-foreground: 210 40% 98%;
    --success: ${successHSL};
    --success-foreground: 210 40% 98%;
    --warning: ${warningHSL};
    --warning-foreground: 222.2 84% 4.9%;
    --info: ${infoHSL};
    --info-foreground: 210 40% 98%;
    --border: ${borderHSL};
    --input: ${borderHSL};
    --ring: ${primaryHSL};
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-family: ${fontFamily}, system-ui, -apple-system, sans-serif;
  }

  h1 {
    @apply text-4xl md:text-5xl font-[${headingWeight}] tracking-tight;
  }

  h2 {
    @apply text-3xl md:text-4xl font-[${headingWeight}] tracking-tight;
  }

  h3 {
    @apply text-2xl md:text-3xl font-[${headingWeight}];
  }

  h4 {
    @apply text-xl md:text-2xl font-semibold;
  }

  h5 {
    @apply text-lg md:text-xl font-semibold;
  }

  h6 {
    @apply text-base md:text-lg font-semibold;
  }

  p {
    @apply text-base leading-relaxed;
  }

  small {
    @apply text-sm;
  }
}

@layer components {
  /* Button Components */
  .btn {
    @apply inline-flex items-center justify-center text-sm font-medium transition-all;
    @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2;
    @apply disabled:opacity-50 disabled:pointer-events-none;
    border-radius: ${radiusValue};
  }

  .btn-primary {
    @apply bg-primary text-primary-foreground hover:bg-primary/90;
  }

  .btn-secondary {
    @apply bg-secondary text-secondary-foreground hover:bg-secondary/80;
  }

  .btn-outline {
    @apply border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground;
  }

  .btn-ghost {
    @apply bg-transparent hover:bg-muted text-foreground;
  }

  .btn-sm {
    @apply h-8 px-3 text-xs;
  }

  .btn-md {
    @apply h-10 px-4 py-2;
  }

  .btn-lg {
    @apply h-12 px-6 text-base;
  }

  .btn-xl {
    @apply h-14 px-8 text-lg;
  }

  /* Card Components */
  .card {
    @apply border bg-card text-card-foreground shadow-sm;
    border-radius: ${radiusValue};
  }

  .card-hover {
    @apply transition-all duration-200 hover:shadow-md;
  }

  .card-interactive {
    @apply cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5;
  }

  .card-gradient {
    @apply bg-gradient-to-br from-card to-muted;
  }

  .card-padding {
    @apply p-6;
  }

  .card-padding-lg {
    @apply p-8;
  }

  /* Spacing Containers */
  .container {
    @apply max-w-7xl mx-auto px-4 md:px-6 lg:px-8;
  }

  .container-sm {
    @apply max-w-4xl mx-auto px-4 md:px-6;
  }

  .container-lg {
    @apply max-w-[1400px] mx-auto px-4 md:px-8;
  }

  .section {
    @apply py-16 md:py-24;
  }

  .section-sm {
    @apply py-12 md:py-16;
  }

  .section-lg {
    @apply py-24 md:py-32;
  }

  /* Grid Layouts */
  .grid-2 {
    @apply grid grid-cols-1 md:grid-cols-2 gap-6;
  }

  .grid-3 {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
  }

  .grid-4 {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
  }

  .grid-auto-fit {
    @apply grid gap-6;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }

  /* Flexbox Utilities */
  .flex-between {
    @apply flex items-center justify-between;
  }

  .flex-center {
    @apply flex items-center justify-center;
  }

  .flex-start {
    @apply flex items-center justify-start;
  }

  .flex-end {
    @apply flex items-center justify-end;
  }

  .flex-col-center {
    @apply flex flex-col items-center justify-center;
  }

  /* Form Components */
  .form-group {
    @apply space-y-2;
  }

  .form-grid {
    @apply grid gap-4;
  }

  .form-grid-2 {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4;
  }

  .form-grid-3 {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    @apply w-full px-3 py-2 border border-border bg-background;
    @apply focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent;
    @apply transition-all;
    border-radius: ${radiusValue};
  }

  /* Badge Components */
  .badge {
    @apply inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors;
  }

  .badge-primary {
    @apply bg-primary text-primary-foreground;
  }

  .badge-success {
    @apply bg-success text-success-foreground;
  }

  .badge-destructive {
    @apply bg-destructive text-destructive-foreground;
  }

  .badge-sm {
    @apply px-2 py-0.5 text-[10px];
  }

  .badge-md {
    @apply px-2.5 py-0.5 text-xs;
  }

  .badge-lg {
    @apply px-3 py-1 text-sm;
  }

  /* Typography Utilities */
  .text-hero {
    @apply text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight;
  }

  .text-display {
    @apply text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight;
  }

  .text-heading {
    @apply text-2xl md:text-3xl font-semibold tracking-tight;
  }

  .text-subheading {
    @apply text-lg md:text-xl font-medium text-muted-foreground;
  }

  .text-gradient {
    @apply bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent;
  }

  /* Shadow Utilities */
  .shadow-soft {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .shadow-medium {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  .shadow-strong {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
  }
}${animations.intensity !== 'none' ? `

@layer utilities {
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slide-up {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes scale-in {
    from {
      transform: scale(0.95);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fade-in-down {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse-ring {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }${animations.intensity === 'heavy' ? `

  @keyframes slide-in-left {
    from {
      transform: translateX(-30px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slide-in-right {
    from {
      transform: translateX(30px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }` : ''}

  .animate-fade-in {
    animation: fade-in 0.5s ease-in;
  }

  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }

  .animate-scale-in {
    animation: scale-in 0.2s ease-out;
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out;
  }

  .animate-fade-in-down {
    animation: fade-in-down 0.6s ease-out;
  }

  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }${animations.intensity === 'heavy' ? `

  .animate-slide-in-left {
    animation: slide-in-left 0.4s ease-out;
  }

  .animate-slide-in-right {
    animation: slide-in-right 0.4s ease-out;
  }

  .delay-75 {
    animation-delay: 75ms;
  }

  .delay-100 {
    animation-delay: 100ms;
  }

  .delay-150 {
    animation-delay: 150ms;
  }

  .delay-200 {
    animation-delay: 200ms;
  }

  .delay-300 {
    animation-delay: 300ms;
  }

  /* Advanced animations for heavy mode */
  @keyframes bounce-in {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.05); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes wiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-3deg); }
    75% { transform: rotate(3deg); }
  }

  .animate-bounce-in {
    animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  .animate-wiggle {
    animation: wiggle 0.5s ease-in-out;
  }` : ''}

  /* Gradient utilities */
  .bg-gradient-primary {
    background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%);
  }

  .bg-gradient-secondary {
    background: linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--muted)) 100%);
  }

  .text-gradient {
    background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Micro-interactions */
  .btn-press:active {
    transform: scale(0.98);
    transition: transform 0.1s;
  }

  .card-lift {
    transition: all 0.2s ease-out;
  }

  .card-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
  }

  input:focus, textarea:focus, select:focus {
    outline: none;
    box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
    transition: box-shadow 0.2s;
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     COMPREHENSIVE UTILITY SYSTEM
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

  /* Button System */
  .btn {
    @apply inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-sm { @apply px-3 py-1.5 text-sm; }
  .btn-md { @apply px-4 py-2 text-base; }
  .btn-lg { @apply px-6 py-3 text-lg; }
  .btn-xl { @apply px-8 py-4 text-xl; }

  .btn-primary {
    @apply bg-primary text-primary-foreground hover:opacity-90 active:scale-95;
  }

  .btn-secondary {
    @apply bg-secondary text-secondary-foreground hover:bg-secondary/80;
  }

  .btn-accent {
    @apply bg-accent text-accent-foreground hover:opacity-90;
  }

  .btn-success {
    @apply bg-success text-success-foreground hover:opacity-90;
  }

  .btn-destructive {
    @apply bg-destructive text-destructive-foreground hover:opacity-90;
  }

  .btn-outline {
    @apply border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground;
  }

  .btn-ghost {
    @apply bg-transparent hover:bg-accent hover:text-accent-foreground;
  }

  .btn-icon {
    @apply p-2 aspect-square;
  }

  /* Spacing System */
  .section-sm { @apply py-8 md:py-12; }
  .section { @apply py-16 md:py-24; }
  .section-lg { @apply py-24 md:py-32; }
  .section-xl { @apply py-32 md:py-40; }

  .container-sm { @apply max-w-4xl mx-auto px-4 md:px-6; }
  .container { @apply max-w-7xl mx-auto px-4 md:px-6 lg:px-8; }
  .container-lg { @apply max-w-[1600px] mx-auto px-6 md:px-8 lg:px-12; }

  .card-padding-sm { @apply p-4; }
  .card-padding { @apply p-6; }
  .card-padding-lg { @apply p-8; }
  .card-padding-xl { @apply p-10 md:p-12; }

  /* Card System */
  .card {
    @apply bg-card border border-border rounded-xl;
  }

  .card-hover {
    @apply card transition-all duration-200 hover:shadow-lg hover:-translate-y-1;
  }

  .card-interactive {
    @apply card-hover cursor-pointer active:scale-[0.98];
  }

  .card-gradient {
    @apply card bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20;
  }

  /* Form System */
  .form-group {
    @apply space-y-2;
  }

  .form-grid {
    @apply grid gap-4 md:gap-6;
  }

  .form-grid-2 {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6;
  }

  .form-grid-3 {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6;
  }

  input[type="text"],
  input[type="email"],
  input[type="password"],
  input[type="search"],
  input[type="number"],
  input[type="tel"],
  input[type="url"],
  input[type="date"],
  textarea,
  select {
    @apply w-full px-3 py-2 border border-border rounded-xl;
    @apply bg-background text-foreground;
    @apply focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent;
    @apply transition-all duration-200;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }

  textarea {
    @apply min-h-[100px] resize-y;
  }

  /* Badge System */
  .badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
  }

  .badge-sm { @apply px-2 py-0.5 text-xs; }
  .badge-md { @apply px-2.5 py-0.5 text-sm; }
  .badge-lg { @apply px-3 py-1 text-base; }

  .badge-primary {
    @apply bg-primary/10 text-primary border border-primary/20;
  }

  .badge-secondary {
    @apply bg-secondary/10 text-secondary-foreground border border-secondary/20;
  }

  .badge-success {
    @apply bg-success/10 text-success border border-success/20;
  }

  .badge-destructive {
    @apply bg-destructive/10 text-destructive border border-destructive/20;
  }

  .badge-warning {
    @apply bg-warning/10 text-warning border border-warning/20;
  }

  .badge-info {
    @apply bg-info/10 text-info border border-info/20;
  }

  /* Grid Patterns */
  .grid-auto-fit {
    @apply grid gap-6;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }

  .grid-auto-fill {
    @apply grid gap-6;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }

  .grid-2 {
    @apply grid grid-cols-1 md:grid-cols-2 gap-6;
  }

  .grid-3 {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
  }

  .grid-4 {
    @apply grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6;
  }

  /* Flex Patterns */
  .flex-between {
    @apply flex items-center justify-between;
  }

  .flex-center {
    @apply flex items-center justify-center;
  }

  .flex-start {
    @apply flex items-center justify-start;
  }

  .flex-end {
    @apply flex items-center justify-end;
  }

  .flex-col-center {
    @apply flex flex-col items-center justify-center;
  }

  /* Typography */
  .text-hero {
    @apply text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight;
  }

  .text-display {
    @apply text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight;
  }

  .text-heading {
    @apply text-3xl md:text-4xl font-bold tracking-tight;
  }

  .text-subheading {
    @apply text-2xl md:text-3xl font-semibold;
  }

  .text-section {
    @apply text-xl md:text-2xl font-semibold;
  }

  .text-body-lg {
    @apply text-lg leading-relaxed;
  }

  .text-body {
    @apply text-base leading-relaxed;
  }

  .text-small {
    @apply text-sm text-muted-foreground;
  }

  .text-gradient {
    @apply bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent;
  }

  /* Shadows */
  .shadow-soft {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  }

  .shadow-medium {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .shadow-strong {
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  }

  .shadow-xl-colored {
    box-shadow: 0 20px 25px -5px rgba(var(--primary), 0.15), 0 10px 10px -5px rgba(var(--primary), 0.04);
  }

  /* Animation Utilities */
  .stagger-item {
    @apply opacity-0;
    animation: fade-in 0.5s ease-out forwards;
  }

  .stagger-item:nth-child(1) { animation-delay: 0.05s; }
  .stagger-item:nth-child(2) { animation-delay: 0.1s; }
  .stagger-item:nth-child(3) { animation-delay: 0.15s; }
  .stagger-item:nth-child(4) { animation-delay: 0.2s; }
  .stagger-item:nth-child(5) { animation-delay: 0.25s; }
  .stagger-item:nth-child(6) { animation-delay: 0.3s; }
  .stagger-item:nth-child(7) { animation-delay: 0.35s; }
  .stagger-item:nth-child(8) { animation-delay: 0.4s; }

  .hover-lift {
    @apply transition-all duration-200;
  }

  .hover-lift:hover {
    @apply -translate-y-1 shadow-lg;
  }

  .hover-glow:hover {
    box-shadow: 0 0 20px rgba(var(--primary), 0.3);
  }

  .hover-scale {
    @apply transition-transform duration-200;
  }

  .hover-scale:hover {
    @apply scale-105;
  }

  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }

  .shimmer {
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
    background-size: 1000px 100%;
    animation: shimmer 2s infinite;
  }

  @keyframes pulse-slow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .pulse-slow {
    animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
}` : ''}
`;
    console.log('[Frontend] ✅ globals.css directly generated - skipping AI');
    console.log(`[Frontend] 🎯 Template length: ${globalsCss.length} characters`);
    console.log(`[Frontend] 🎯 Has @layer components: ${globalsCss.includes('@layer components')}`);
    console.log(`[Frontend] 🎯 Has .btn class: ${globalsCss.includes('.btn {')}`);
    console.log(`[Frontend] 🎯 Has .card class: ${globalsCss.includes('.card {')}`);
    console.log(`[Frontend] 🎯 Animation intensity: ${animations.intensity}`);
    console.log(`[Frontend] 🎯 First 1000 chars:\n${globalsCss.substring(0, 1000)}`);
    return globalsCss;
  } else if (filePlan.path === '.env.local') {
    specialInstructions = `
SPECIAL INSTRUCTIONS FOR .ENV.LOCAL:
Only include ESSENTIAL environment variables:
- NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090 (required for PocketBase)
DO NOT add: analytics, feature flags, JWT secrets, app metadata, or other unnecessary vars.
`;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎯 FEATURE FILTERING: Only include features for this specific file
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // This prevents "posts loading in subscription form" and similar issues
  const featureMapping = state.featureRouteMapping || [];
  const relevantFeatureIds = new Set<string>();

  // Find features assigned to this file
  for (const mapping of featureMapping) {
    if (mapping.file === filePlan.path) {
      relevantFeatureIds.add(mapping.featureId);
    }
  }

  // Filter allRequestedFeatures to only include relevant ones
  const relevantFeatures = state.allRequestedFeatures?.filter(f =>
    f.included_in_mvp && relevantFeatureIds.has(f.id)
  ) || [];

  // Build feature context for this specific file
  const featureContext = relevantFeatures.length > 0
    ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 FEATURES FOR THIS FILE (${filePlan.path})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT: This file should ONLY implement these features:
${relevantFeatures.map(f => `- ${f.name}: ${f.description}`).join('\n')}

DO NOT include features from other pages!
${state.allRequestedFeatures
  ?.filter(f => f.included_in_mvp && !relevantFeatureIds.has(f.id))
  .map(f => f.name)
  .length > 0 ? `
Other features (NOT for this file):
${state.allRequestedFeatures
  ?.filter(f => f.included_in_mvp && !relevantFeatureIds.has(f.id))
  .map(f => `- ${f.name} (goes in a different file)`)
  .join('\n')}
` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
    : '';

  console.log(`[Frontend] 🎯 Feature filtering for ${filePlan.path}:`);
  console.log(`[Frontend]    Total features: ${state.allRequestedFeatures?.length || 0}`);
  console.log(`[Frontend]    Relevant for this file: ${relevantFeatures.length}`);
  if (relevantFeatures.length > 0) {
    console.log(`[Frontend]    Features: ${relevantFeatures.map(f => f.name).join(', ')}`);
  }
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const prompt = `${conversationContext || ''}

Generate ${filePlan.path} - ${filePlan.purpose}

USER REQUEST: "${state.userDescription}"

App Requirements from PM:
${state.context?.pmPlan?.overview || 'Build the app based on user request'}

# TECH STACK
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS with semantic design tokens
- State Management:
  • Zustand (client state: theme, UI, auth) - import from '@/lib/store'
  • React Query (server state: API calls, caching)${hasBackend ? ' - OPTIONAL hooks in @/lib/api-hooks' : ' (not needed - no backend)'}
- Forms: React Hook Form + Zod validation - utilities in '@/lib/form-utils'
- UI Components: Radix UI primitives (Modal, Dropdown, Select, Toast) in '@/components/ui'
- Icons: lucide-react
${hasBackend ? '- Backend: PocketBase API with TWO files:\n  • @/lib/api - Direct API functions (getPost, createPost, etc.)\n  • @/lib/api-hooks - OPTIONAL React Query hooks (usePost, useCreatePost, etc.)' : '- No backend (client-side only)'}

${hasBackend ? `
# STATE MANAGEMENT PATTERNS (FOLLOW THESE)

## Client State (Zustand)
\`\`\`typescript
import { useStore } from '@/lib/store';

// In component
const user = useStore((state) => state.user);
const setTheme = useStore((state) => state.setTheme);
const logout = useStore((state) => state.logout);
\`\`\`

## Server State - TWO OPTIONS:

### OPTION 1: Direct API calls (RECOMMENDED for dynamic routes)
\`\`\`typescript
import { get${collections[0]?.name ? collections[0].name.charAt(0).toUpperCase() + collections[0].name.slice(1) : 'Items'} } from '@/lib/api';  // ✅ Direct functions

// In useEffect
useEffect(() => {
  get${collections[0]?.name ? collections[0].name.charAt(0).toUpperCase() + collections[0].name.slice(1) : 'Items'}().then(setItems);
}, []);
\`\`\`

### OPTION 2: React Query hooks (OPTIONAL, for advanced caching)
\`\`\`typescript
import { use${collections[0]?.name ? collections[0].name.charAt(0).toUpperCase() + collections[0].name.slice(1) : 'Items'} } from '@/lib/api-hooks';  // ✅ React Query hooks

// Automatic caching/refetching
const { data, isLoading, error } = use${collections[0]?.name ? collections[0].name.charAt(0).toUpperCase() + collections[0].name.slice(1) : 'Items'}();

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;
\`\`\`

## Forms (React Hook Form + Zod) - CORRECT TYPING
\`\`\`typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Define schema
const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters')
});

// 2. Infer type from schema
type FormData = z.infer<typeof schema>;

// 3. Use typed form - CRITICAL: useForm<FormData> with generic type
const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema)
});

// 4. Submit handler - CRITICAL: Must accept FormData type
const onSubmit = async (data: FormData) => {
  // Form submission logic
};

// 5. In JSX
<form onSubmit={handleSubmit(onSubmit)}>
\`\`\`

# COMPONENT PATTERNS

✅ Use Radix UI for accessible components:
- Dialog/Modal: import { Modal } from '@/components/ui/Modal'
- Dropdown: import { Dropdown } from '@/components/ui/Dropdown'
- Select: import { Select } from '@/components/ui/Select'
- Toast: import { useToast } from '@/components/ui/Toast'

✅ Use React Query for ALL API calls:
- NO manual fetch() or useEffect for data fetching
- Use generated hooks from '@/lib/api-hooks'

✅ Use Zustand for client state:
- Theme, auth, UI state (sidebar, modals)
- NOT for server data (use React Query)

✅ Use React Hook Form for ALL forms:
- Define Zod schema first
- Use register() for inputs
- Show validation errors with {errors.fieldName?.message}

# QUALITY CHECKLIST
- [ ] All API calls use React Query hooks from '@/lib/api-hooks'
- [ ] All forms use React Hook Form + Zod validation
- [ ] Client state uses Zustand store from '@/lib/store'
- [ ] Accessible components from '@/components/ui' (Radix UI)
- [ ] Loading states for async operations
- [ ] Error handling with error boundaries or toast notifications
- [ ] Mobile responsive (use responsive Tailwind classes)
- [ ] TypeScript types for all data structures
` : ''}

${featureContext}

${specialInstructions}

${enhancedContext}
${state.backgroundContext ? formatBackgroundContextForFrontend(state.backgroundContext) : ''}
${state.designInspiration ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 DESIGN INSPIRATION (extracted from screenshot)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Primary Color: ${state.designInspiration.colors.primary}
Secondary Color: ${state.designInspiration.colors.secondary}
Accent Color: ${state.designInspiration.colors.accent}
Typography: ${state.designInspiration.typography.headingFont} / ${state.designInspiration.typography.bodyFont}
Patterns: ${state.designInspiration.patterns.join(', ')}
Border Radius: ${state.designInspiration.borderRadius}
Spacing: ${state.designInspiration.spacing.join('px, ')}px

Use these as inspiration for your design decisions. The styling config already includes these.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : ''}${(() => {
  const assetFiles = state.uploadedFiles?.filter(f => f.purpose === 'asset' || f.purpose === 'both') || [];
  if (assetFiles.length === 0) return '';

  const assetContext = assetFiles.map(f => `• ${f.fileName}: ${f.fileUrl}`).join('\n');
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 UPLOADED ASSETS (use these in your code)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${assetContext}

Reference these assets in your code where appropriate:
- Images: <img src="${assetFiles[0].fileUrl}" alt="..." />
- Next.js Image: <Image src="${assetFiles[0].fileUrl}" alt="..." width={...} height={...} />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
})()}

${(() => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎨 STYLING CONFIG - Pass premium design system to AI
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (!state.stylingConfig) return '';

  const colors = state.stylingConfig.colorTheme || {};
  const typo = state.stylingConfig.typography || {};
  const layout = state.stylingConfig.layout || {};
  const anims = state.stylingConfig.animations || {};
  const icons = state.stylingConfig.iconography || {};

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 YOUR PREMIUM DESIGN SYSTEM (APPLY THESE STYLES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎨 Color Palette
Primary: ${colors.primary || '#136e35'} → Use: bg-primary, text-primary, border-primary, hover:bg-primary/90
Secondary: ${colors.secondary || '#59687c'} → Use: bg-secondary, text-secondary
Accent: ${colors.accent || '#945f06'} → Use: bg-accent, text-accent (for CTAs, highlights)
Mode: ${colors.mode || 'light'}

## ✍️ Typography
Font: ${typo.fontFamily || 'Inter'} (already loaded)
Headings: font-${typo.headingWeight >= 700 ? 'bold' : typo.headingWeight >= 600 ? 'semibold' : 'medium'} (weight: ${typo.headingWeight || 700})
Body: font-${typo.bodyWeight >= 500 ? 'medium' : 'normal'} (weight: ${typo.bodyWeight || 400})
Scale: ${typo.scale || 'normal'} → ${
  typo.scale === 'compact' ? 'Headings: text-xl/2xl/3xl, Body: text-sm' :
  typo.scale === 'generous' ? 'Headings: text-3xl/4xl/5xl, Body: text-lg' :
  'Headings: text-2xl/3xl/4xl, Body: text-base'
}

## 📐 Layout
Container: max-w-${layout.containerWidth || '7xl'} mx-auto px-4 md:px-6
Spacing: ${layout.spacing || 'normal'} → ${
  layout.spacing === 'compact' ? 'Sections: py-8 md:py-12, Gaps: gap-4' :
  layout.spacing === 'spacious' ? 'Sections: py-20 md:py-32, Gaps: gap-12' :
  'Sections: py-16 md:py-24, Gaps: gap-8'
}
Corners: ${layout.corners || 'rounded'} → ${
  layout.corners === 'sharp' ? 'rounded-none' :
  layout.corners === 'pill' ? 'rounded-full (buttons), rounded-2xl (cards)' :
  'rounded-lg (default)'
}

## ✨ Animations (${anims.enabled ? 'ENABLED - USE THESE' : 'DISABLED'})
${anims.enabled ? `Intensity: ${anims.intensity || 'moderate'}
- Transitions: transition-all duration-${anims.intensity === 'subtle' ? '200' : anims.intensity === 'dramatic' ? '500' : '300'}
- Hover Effects: hover:scale-${anims.intensity === 'subtle' ? '102' : anims.intensity === 'dramatic' ? '110' : '105'} hover:shadow-lg
- Buttons: active:scale-95
- Page Load: ${anims.pageTransitions ? 'Add fade-in: animate-fade-in' : 'No page transitions'}` : '- Use instant changes, NO transitions or animations'}

## 🎯 Icons
Style: ${icons.style || 'outlined'} (use lucide-react, don't over-use)
Size: ${icons.size || 'medium'} → h-${icons.size === 'small' ? '4' : icons.size === 'large' ? '6' : '5'} w-${icons.size === 'small' ? '4' : icons.size === 'large' ? '6' : '5'}
Placement: Icons BEFORE text in buttons/links

🚨 MANDATORY: Apply ALL these values in your generated code!
- Use bg-primary for primary actions (CTAs, submit buttons)
- Use bg-secondary for secondary containers/cards
- Use bg-accent sparingly for highlights/badges
- Match spacing scale exactly (don't use random py-4 if scale is spacious)
- Apply animation classes if enabled
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
})()}

${componentCatalog}

${exampleContext || ''}

${filePlan.path.endsWith('.tsx') ? pagePatterns : ''}

Exports: Use default for .tsx, named for types.ts
Add 'use client' for hooks/events.

✅ EXAMPLE OF GOOD UI (USE THIS AS REFERENCE):

<section className="section bg-background">
  <div className="container">
    <h2 className="text-3xl font-bold mb-8">Features</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="card card-padding card-hover">
        <Zap className="h-8 w-8 text-primary mb-4" />
        <h3 className="text-xl font-semibold mb-2">Fast</h3>
        <p className="text-muted-foreground">Lightning quick performance</p>
      </div>
    </div>
  </div>
</section>

NOTICE: bg-background, text-primary, text-muted-foreground, card utilities

RULES:
- Build UI with native HTML + Tailwind
- Icons: lucide-react ONLY - USE THESE VALID ICONS:
  Common: Square, Circle, X, Plus, Check, ChevronRight, ChevronLeft, ChevronDown, ChevronUp
  Navigation: Menu, Search, Settings, User, Home, ArrowRight, ArrowLeft, ArrowUp, ArrowDown
  Actions: Edit, Edit2, Trash, Trash2, Save, Download, Upload, Send, Share, Copy
  UI: Star, Heart, Bell, Calendar, Clock, Mail, Lock, Eye, EyeOff, Filter, Grid, List
  Status: AlertCircle, CheckCircle, XCircle, AlertTriangle, Info, HelpCircle
  Media: Image, File, Folder, Camera, Video, Phone, Mic, MapPin
  Loading: Loader, Loader2, RefreshCw, RotateCw
  ❌ INVALID (don't use): Bot, Sparkles, Robot, Zap, Lightning, Magic
- Colors: ONLY semantic tokens (bg-primary, text-foreground, etc.)
- Import paths: Use '@/lib/api' NOT '@/src/lib/api' (@ maps to root)

🚨 INTERACTIVE ELEMENTS - CRITICAL FOR FUNCTIONALITY:
- Input fields: MUST have value={state} onChange={(e) => setState(e.target.value)}
  ✅ CORRECT: <input value={text} onChange={(e) => setText(e.target.value)} />
  ❌ WRONG: <input /> (no state binding)
- Buttons: MUST have onClick={handleFunction} or type="submit" in forms
  ✅ CORRECT: <button onClick={handleClick}>Click</button>
  ❌ WRONG: <button>Click</button> (no handler)
- Forms: MUST have onSubmit={handleSubmit} and preventDefault
  ✅ CORRECT: <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
- Textareas: Same as inputs - MUST bind value and onChange
- Selects/Dropdowns: MUST have value and onChange handlers

🎨 DESIGN QUALITY & POLISH - MANDATORY STANDARDS:

1. CONTRAST REQUIREMENTS (WCAG AA Minimum):
   ✅ Text on backgrounds: MUST have 4.5:1 contrast ratio minimum
   ✅ Large text (18px+): MUST have 3:1 contrast ratio minimum
   ✅ Use text-foreground for body text (high contrast with bg)
   ✅ Use text-muted-foreground for secondary text (still readable)
   ❌ NEVER use text-gray-400 on white - too low contrast
   ❌ NEVER use light text on light backgrounds or dark on dark

   EXAMPLES:
   ✅ <p className="text-foreground">High contrast body text</p>
   ✅ <p className="text-muted-foreground">Secondary text, still readable</p>
   ✅ <button className="bg-primary text-primary-foreground">Clear contrast</button>
   ❌ <p className="text-gray-400">Too light on white background</p>

2. COMPONENT POLISH - PROFESSIONAL QUALITY:
   ✅ Consistent spacing: Use spacing scale (p-4, p-6, p-8, gap-4, gap-6)
   ✅ Proper hover states: ALL interactive elements need hover:bg-*/hover:scale-*/hover:shadow-*
   ✅ Smooth transitions: Add transition-all or transition-colors to interactive elements
   ✅ Focus states: Add focus:ring-2 focus:ring-primary focus:outline-none to inputs/buttons
   ✅ Loading states: Show spinners/skeletons during data fetching
   ✅ Error states: Show clear error messages with text-destructive
   ✅ Rounded corners: Consistent border radius (rounded-lg for cards, rounded-md for inputs)
   ✅ Shadows: Use shadow-sm, shadow-md, shadow-lg appropriately
   ✅ Active states: Add active:scale-95 to buttons for click feedback

   BUTTON EXAMPLE:
   ✅ <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 active:scale-95 transition-all focus:ring-2 focus:ring-primary focus:outline-none">

   INPUT EXAMPLE:
   ✅ <input className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all" />

3. SPACING & LAYOUT CONSISTENCY:
   ✅ Sections: py-16 md:py-24 (generous vertical padding)
   ✅ Cards: p-6 md:p-8 (comfortable padding)
   ✅ Grids: gap-6 md:gap-8 (consistent gaps)
   ✅ Text: mb-2 for headings, mb-6 for paragraphs
   ❌ NEVER use inconsistent spacing (don't mix p-2 and p-20 randomly)

4. TYPOGRAPHY POLISH:
   ✅ Headings: font-bold or font-semibold, proper scale (text-3xl, text-4xl, text-5xl)
   ✅ Body: font-normal or font-medium, text-base or text-lg
   ✅ Labels: text-sm font-medium mb-2
   ✅ Line height: leading-relaxed for body text
   ❌ NEVER use all caps (text-uppercase) unless specified in design

5. COLOR USAGE BEST PRACTICES:
   ✅ Primary color: CTAs, links, focus states
   ✅ Secondary color: Supporting elements, badges
   ✅ Accent color: Highlights, special elements
   ✅ Muted: Borders, dividers, disabled states
   ✅ Destructive: Errors, delete actions
   ❌ NEVER use arbitrary colors like bg-blue-500 - ONLY semantic tokens
${hasBackend ? `
🚨 CRITICAL - API FUNCTION SIGNATURES (DO NOT MODIFY):
${state.backendConfig?.apiEndpoints?.map(ep => {
  const pathParams = (ep.path.match(/:[a-zA-Z_][a-zA-Z0-9_]*/g) || []).map((p: string) => p.slice(1));
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(ep.method);
  let params = [];
  pathParams.forEach((param: string) => params.push(`${param}`));
  if (hasBody) params.push('{ key: value }');
  return `  await ${ep.handler}(${params.join(', ')})`;
}).join('\n')}

⚠️ Use these EXACT signatures - DO NOT add/remove/change parameters!
⚠️ If function shows no params, call it with no params: functionName()
⚠️ DO NOT invent parameters based on function name!
` : '- Data: useState + mock arrays'}

CODE ONLY. NO markdown, explanations, or comments outside the code.`;

  const estimatedTokens = estimateTokens(prompt);

  // ✅ DEBUG LOGGING: Show the FULL prompt being sent to AI
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[Frontend] 📤 PROMPT SENT TO AI for ${filePlan.path}:`);
  console.log(`[Frontend] 📊 Prompt length: ${prompt.length} chars (~${estimatedTokens} tokens)`);
  console.log(`[Frontend] 📊 Has backend: ${hasBackend}`);
  console.log(`[Frontend] 📊 Component catalog length: ${componentCatalog.length} chars`);
  console.log(`[Frontend] 📊 Page patterns length: ${filePlan.path.endsWith('.tsx') ? pagePatterns.length : 0} chars`);
  // Full prompt logging disabled to reduce console clutter
  // console.log(`[Frontend] 📄 FULL PROMPT:`);
  // console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  // console.log(prompt);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  const resultText = await generateWithLogging({
    prompt,
    projectId: state.projectId,
    nodeName: 'frontend',
    callType: 'generation',
    estimatedTokens,
    attempt: 1
  });

  // Clean up response (remove markdown fences if AI added them)
  let cleanedContent = resultText.trim();
  if (cleanedContent.startsWith('```')) {
    // Remove language identifier and fences
    cleanedContent = cleanedContent
      .replace(/^```[a-z]*\n?/i, '')
      .replace(/\n?```$/,'');
  }

  // ✅ DEBUG LOGGING: Show what AI generated
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[Frontend] 🔍 AI GENERATED CODE for ${filePlan.path}:`);
  console.log(`[Frontend] 📊 Length: ${cleanedContent.length} chars`);
  console.log(`[Frontend] 📊 Lines: ${cleanedContent.split('\n').length}`);

  // Extract imports to see what's being imported
  const imports = cleanedContent.match(/^import .+ from .+$/gm) || [];
  console.log(`[Frontend] 📦 Imports (${imports.length}):`);
  imports.forEach(imp => console.log(`[Frontend]    ${imp}`));

  // ✅ AUTO-FIX: Validate and fix Lucide React icons
  const lucideImports = imports.filter(imp => imp.includes('lucide-react'));
  if (lucideImports.length > 0) {
    console.log(`[Frontend] 🔍 Validating Lucide icons...`);

    // Common valid Lucide icons (subset - most frequently used)
    const validLucideIcons = [
      'Plus', 'X', 'Check', 'ChevronRight', 'ChevronLeft', 'ChevronDown', 'ChevronUp',
      'Menu', 'Search', 'Settings', 'User', 'Mail', 'Lock', 'Eye', 'EyeOff',
      'Edit', 'Edit2', 'Edit3', 'Trash', 'Trash2', 'Save', 'Download', 'Upload',
      'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'Star', 'Heart',
      'Bell', 'Calendar', 'Clock', 'File', 'Folder', 'Image', 'AlertCircle',
      'Info', 'CheckCircle', 'XCircle', 'AlertTriangle', 'HelpCircle',
      'Loader', 'Loader2', 'RefreshCw', 'RotateCw', 'Copy', 'Share', 'Share2',
      'ExternalLink', 'Link', 'Paperclip', 'Send', 'MessageCircle', 'MessageSquare',
      'Phone', 'Video', 'Mic', 'Camera', 'MapPin', 'Navigation', 'Compass',
      'Filter', 'Grid', 'List', 'LayoutGrid', 'Columns', 'Square', 'Circle',
      'MoreVertical', 'MoreHorizontal', 'Maximize', 'Minimize', 'ZoomIn', 'ZoomOut',
      'Move', 'GripVertical', 'GripHorizontal'
    ];

    // Icon replacements for common AI hallucinations
    const iconReplacements: Record<string, string> = {
      'DragHandleDots2': 'GripVertical',
      'DragHandle': 'GripVertical',
      'Drag': 'Move',
      'DragDots': 'GripVertical',
      'DotsVertical': 'MoreVertical',
      'DotsHorizontal': 'MoreHorizontal',
      'TrashCan': 'Trash2',
      'DeleteIcon': 'Trash2',
      'PencilIcon': 'Edit2',
      'CheckIcon': 'Check',
      'CrossIcon': 'X',
      'CloseIcon': 'X',
      'AddIcon': 'Plus',
      'PlusIcon': 'Plus'
    };

    lucideImports.forEach(importLine => {
      // Extract icon names from import { Icon1, Icon2 } from 'lucide-react'
      const match = importLine.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/);
      if (match) {
        const iconList = match[1].split(',').map(icon => icon.trim());
        const invalidIcons = iconList.filter(icon =>
          !validLucideIcons.includes(icon) && !iconReplacements[icon]
        );

        if (invalidIcons.length > 0) {
          console.log(`[Frontend] ⚠️  Invalid Lucide icons detected: ${invalidIcons.join(', ')}`);

          // Replace invalid icons
          let fixedContent = cleanedContent;
          invalidIcons.forEach(invalidIcon => {
            // Try to find a replacement
            const replacement = iconReplacements[invalidIcon] || 'Square'; // Default fallback
            console.log(`[Frontend] 🔧 Replacing ${invalidIcon} → ${replacement}`);

            // Replace in import statement
            fixedContent = fixedContent.replace(
              new RegExp(`\\b${invalidIcon}\\b`, 'g'),
              replacement
            );
          });

          // Also apply known replacements
          Object.entries(iconReplacements).forEach(([invalid, valid]) => {
            if (iconList.includes(invalid)) {
              console.log(`[Frontend] 🔧 Replacing ${invalid} → ${valid}`);
              fixedContent = fixedContent.replace(
                new RegExp(`\\b${invalid}\\b`, 'g'),
                valid
              );
            }
          });

          cleanedContent = fixedContent;
          console.log(`[Frontend] ✅ Icon fixes applied`);
        } else {
          console.log(`[Frontend] ✅ All Lucide icons are valid`);
        }
      }
    });
  }

  // Show FULL content if file has errors or is a page file
  if (filePlan.path.includes('page.tsx') || cleanedContent.length > 4000) {
    console.log(`[Frontend] 📄 FULL GENERATED CONTENT (${cleanedContent.length} chars):`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(cleanedContent);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  } else {
    // Show first 1500 chars to see structure
    console.log(`[Frontend] 📄 First 1500 chars:`);
    console.log(cleanedContent.substring(0, 1500));
    console.log(`\n[Frontend] 📄 Last 500 chars:`);
    console.log(cleanedContent.substring(Math.max(0, cleanedContent.length - 500)));
  }
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // CRITICAL FIX: If AI returned JSON format instead of raw code, extract the content
  // Sometimes AI returns: [{"path": "...", "content": "actual code here"}]
  // We need to extract just the "content" value
  if (cleanedContent.trim().startsWith('[') || cleanedContent.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(cleanedContent);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].content) {
        console.log(`[Frontend] ⚠️  AI returned JSON format, extracting content for ${filePlan.path}`);
        cleanedContent = parsed[0].content;
      } else if (parsed.content) {
        console.log(`[Frontend] ⚠️  AI returned JSON object, extracting content for ${filePlan.path}`);
        cleanedContent = parsed.content;
      }
    } catch (e) {
      // Not JSON, continue with original content
    }
  }

  // Auto-fix: Add 'use client' if React hooks or browser APIs are detected
  // This ensures Next.js build doesn't fail even if AI forgets the directive
  if (filePlan.path.endsWith('.tsx') || filePlan.path.endsWith('.jsx')) {
    console.log(`[Frontend] 🔍 AUTO-FIX CHECK for ${filePlan.path}`);
    console.log(`[Frontend] 🔍   File type: ${filePlan.path.endsWith('.tsx') ? 'TSX' : 'JSX'}`);

    const needsUseClient =
      // Check for React hooks
      /import\s+{[^}]*(?:useState|useEffect|useContext|useReducer|useCallback|useMemo|useRef|useLayoutEffect)[^}]*}\s+from\s+['"]react['"]/.test(cleanedContent) ||
      // Check for event handlers
      /(?:onClick|onChange|onSubmit|onInput|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave)\s*=/.test(cleanedContent) ||
      // Check for browser APIs
      /(?:window\.|document\.|localStorage\.|sessionStorage\.)/.test(cleanedContent);

    const hasUseClient = /^['"]use client['"]/.test(cleanedContent);

    console.log(`[Frontend] 🔍   Needs 'use client': ${needsUseClient}`);
    console.log(`[Frontend] 🔍   Has 'use client': ${hasUseClient}`);
    console.log(`[Frontend] 🔍   Content starts with: "${cleanedContent.substring(0, 100)}"`);

    if (needsUseClient && !hasUseClient) {
      console.log(`[Frontend] ✅ AUTO-ADDING 'use client' to ${filePlan.path}`);
      cleanedContent = `'use client'\n\n${cleanedContent}`;
    } else if (needsUseClient && hasUseClient) {
      console.log(`[Frontend] ✅ 'use client' already present in ${filePlan.path}`);
    } else {
      console.log(`[Frontend] ℹ️  'use client' not needed for ${filePlan.path}`);
    }

    // 🚨 STEP 1: ALWAYS fix malformed lucide-react imports FIRST (UNCONDITIONAL)
    // This must run BEFORE checking for icon usage, because malformed imports exist regardless of usage
    console.log(`[Frontend] 🔍 AUTO-FIX STEP 1: Checking for malformed lucide-react imports...`);
    const malformedImportMatch = cleanedContent.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/);
    if (malformedImportMatch) {
      const importString = malformedImportMatch[1];

      // Detect if imports have missing commas (multiple capitalized words without commas between them)
      // Pattern: Capital letter followed by any letters/digits, then space, then another capital letter
      // FIXED: Use [a-zA-Z0-9] to handle PascalCase like "AlertCircle"
      const hasMissingCommas = /[A-Z][a-zA-Z0-9]*\s+[A-Z]/.test(importString);

      if (hasMissingCommas) {
        console.log(`[Frontend] 🔍 DETECTED MALFORMED IMPORT:`, importString);

        // Fix: Add commas between capitalized icon names
        // Replace pattern: "IconName OtherIcon" → "IconName, OtherIcon"
        let fixedImportString = importString;

        // Split by commas first to preserve any existing commas
        const segments = fixedImportString.split(',');
        const fixedSegments = segments.map(segment => {
          // In each segment, find sequences of capitalized words and add commas between them
          // FIXED: Use [a-zA-Z0-9]* to properly handle PascalCase component names like "AlertCircle"
          // Previous bug: [a-z0-9]* would match "Alert" and stop at "C" in "AlertCircle"
          let fixedSegment = segment;
          while (/\b([A-Z][a-zA-Z0-9]*)\s+([A-Z][a-zA-Z0-9]*)\b/.test(fixedSegment)) {
            fixedSegment = fixedSegment.replace(/\b([A-Z][a-zA-Z0-9]*)\s+([A-Z][a-zA-Z0-9]*)\b/, '$1, $2');
          }
          return fixedSegment;
        });

        fixedImportString = fixedSegments.join(',');

        // Clean up any double commas or extra spaces
        fixedImportString = fixedImportString.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();

        // Replace in content
        const newImport = `import { ${fixedImportString} } from 'lucide-react'`;
        cleanedContent = cleanedContent.replace(/import\s+{[^}]+}\s+from\s+['"]lucide-react['"]/, newImport);

        console.log(`[Frontend] ✅ AUTO-FIXED MALFORMED IMPORT:`, fixedImportString);
        console.log(`[Frontend] 📝 New import statement:`, newImport);
      } else {
        console.log(`[Frontend] ✅ Lucide-react import syntax is correct`);
      }
    }

    // 🚨 STEP 2: Check for missing icon imports by scanning JSX usage
    console.log(`[Frontend] 🔍 AUTO-FIX STEP 2: Checking for missing icon imports...`);

    // Find all icon components used in JSX (e.g., <Zap />, <Mail className="..." />)
    const iconUsagePattern = /<([A-Z][a-zA-Z0-9]*)\s*(?:className|\/)/g;
    const usedIcons = new Set<string>();
    let match;
    while ((match = iconUsagePattern.exec(cleanedContent)) !== null) {
      const componentName = match[1];
      // Exclude common React/Next.js components and HTML-like components
      if (!['Fragment', 'Suspense', 'ErrorBoundary', 'Head', 'Script', 'Image', 'Link'].includes(componentName)) {
        usedIcons.add(componentName);
      }
    }

    if (usedIcons.size > 0) {
      console.log(`[Frontend] 🔍   Found ${usedIcons.size} potential icon components:`, Array.from(usedIcons));

      // Check which icons are already imported from lucide-react
      const lucideImportMatch = cleanedContent.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/);
      const importedIcons = new Set<string>();

      if (lucideImportMatch) {
        const imports = lucideImportMatch[1].split(',').map(i => i.trim());
        imports.forEach(imp => {
          // Handle both "IconName" and "Icon as IconAlias" formats
          const aliasMatch = imp.match(/(\w+)\s+as\s+(\w+)/);
          if (aliasMatch) {
            // If aliased (e.g., "Calendar as CalendarIcon"), add both names
            importedIcons.add(aliasMatch[1]); // Original name (Calendar)
            importedIcons.add(aliasMatch[2]); // Alias (CalendarIcon)
          } else {
            // Simple import (e.g., "Calendar")
            importedIcons.add(imp);
          }
        });
        console.log(`[Frontend] 🔍   Already imported from lucide-react:`, Array.from(importedIcons));
      }

      // Find icons that are used but not imported
      const missingIcons = Array.from(usedIcons).filter(icon => !importedIcons.has(icon));

      if (missingIcons.length > 0) {
        console.log(`[Frontend] ⚠️  MISSING ICON IMPORTS:`, missingIcons);

        // Add missing icons to the import statement
        if (lucideImportMatch) {
          // Update existing import
          const allIcons = [...importedIcons, ...missingIcons].sort();
          const newImport = `import { ${allIcons.join(', ')} } from 'lucide-react'`;
          cleanedContent = cleanedContent.replace(/import\s+{[^}]+}\s+from\s+['"]lucide-react['"]/, newImport);
          console.log(`[Frontend] ✅ AUTO-FIXED: Updated lucide-react import with missing icons`);
        } else {
          // Add new import after other imports
          const importSection = cleanedContent.match(/^((?:['"]use (?:client|server)['"][\r\n]+)?(?:import\s+.+[\r\n]+)*)/m);
          if (importSection) {
            const newImport = `import { ${missingIcons.sort().join(', ')} } from 'lucide-react'\n`;
            cleanedContent = cleanedContent.replace(importSection[0], importSection[0] + newImport);
            console.log(`[Frontend] ✅ AUTO-FIXED: Added new lucide-react import with icons`);
          } else {
            // No imports section found, add at the beginning (after 'use client' if present)
            const useClientMatch = cleanedContent.match(/^['"]use client['"][\r\n]+/);
            if (useClientMatch) {
              const newImport = `import { ${missingIcons.sort().join(', ')} } from 'lucide-react'\n\n`;
              cleanedContent = cleanedContent.replace(useClientMatch[0], useClientMatch[0] + newImport);
            } else {
              const newImport = `import { ${missingIcons.sort().join(', ')} } from 'lucide-react'\n\n`;
              cleanedContent = newImport + cleanedContent;
            }
            console.log(`[Frontend] ✅ AUTO-FIXED: Added lucide-react import at the beginning`);
          }
        }
      } else {
        console.log(`[Frontend] ✅ All icons are properly imported`);
      }
    }

    // 🚨 STEP 3: Detect and fix duplicate React imports (UNCONDITIONAL)
    // Common AI error: import { useState } from 'react' + import React, { useState } from 'react'
    console.log(`[Frontend] 🔍 AUTO-FIX STEP 3: Checking for duplicate React imports...`);

    const allReactImports = cleanedContent.match(/import\s+(?:[^'"]*)\s+from\s+['"]react['"]/g) || [];

    if (allReactImports.length > 1) {
      console.log(`[Frontend] 🔍 DETECTED MULTIPLE REACT IMPORTS (${allReactImports.length}):`);
      allReactImports.forEach(imp => console.log(`[Frontend]    ${imp}`));

      // Extract all imports and merge them
      let defaultImport: string | null = null;
      const allNamedImports = new Set<string>();

      allReactImports.forEach(importStatement => {
        // Match: import React from 'react'  OR  import { useState } from 'react'  OR  import React, { useState } from 'react'
        const match = importStatement.match(/import\s+(?:(\w+)(?:\s*,\s*{([^}]+)})?|{([^}]+)})\s+from\s+['"]react['"]/);
        if (match) {
          // Group 1: default import (e.g., "React")
          if (match[1]) {
            defaultImport = match[1];
          }

          // Group 2: named imports after default (e.g., "useState, useEffect" in "import React, { useState, useEffect }")
          if (match[2]) {
            match[2].split(',').forEach(imp => {
              const cleaned = imp.trim();
              if (cleaned) allNamedImports.add(cleaned);
            });
          }

          // Group 3: named imports only (e.g., "useState, useEffect" in "import { useState, useEffect }")
          if (match[3]) {
            match[3].split(',').forEach(imp => {
              const cleaned = imp.trim();
              if (cleaned) allNamedImports.add(cleaned);
            });
          }
        }
      });

      // Build merged import statement
      let mergedImport = 'import ';
      if (defaultImport && allNamedImports.size > 0) {
        mergedImport += `${defaultImport}, { ${Array.from(allNamedImports).sort().join(', ')} } from 'react'`;
      } else if (defaultImport) {
        mergedImport += `${defaultImport} from 'react'`;
      } else if (allNamedImports.size > 0) {
        mergedImport += `{ ${Array.from(allNamedImports).sort().join(', ')} } from 'react'`;
      }

      console.log(`[Frontend] ✅ MERGED REACT IMPORT:`, mergedImport);

      // Remove all React imports and add the merged one after 'use client' if present
      cleanedContent = cleanedContent.replace(/import\s+(?:[^'"]*)\s+from\s+['"]react['"]\n?/g, '');

      const useClientMatch = cleanedContent.match(/^['"]use client['"][\r\n]+/);
      if (useClientMatch) {
        cleanedContent = cleanedContent.replace(useClientMatch[0], useClientMatch[0] + mergedImport + '\n');
      } else {
        cleanedContent = mergedImport + '\n' + cleanedContent;
      }

      console.log(`[Frontend] ✅ AUTO-FIXED: Merged ${allReactImports.length} duplicate React imports into one`);
    } else if (allReactImports.length === 1) {
      console.log(`[Frontend] ✅ Only one React import found, no duplicates`);
    }

    // 🚨 STEP 4: Add missing React hooks imports
    // This prevents "Cannot find name 'useState'" and "Cannot find name 'useEffect'" errors
    console.log(`[Frontend] 🔍 AUTO-FIX STEP 4: Checking for missing React hooks imports...`);

    // Find all React hooks used in the code
    const hookPattern = /\b(useState|useEffect|useContext|useReducer|useCallback|useMemo|useRef|useLayoutEffect|useImperativeHandle|use)\s*\(/g;
    const usedHooks = new Set<string>();
    let hookMatch;
    while ((hookMatch = hookPattern.exec(cleanedContent)) !== null) {
      usedHooks.add(hookMatch[1]);
    }

    if (usedHooks.size > 0) {
      console.log(`[Frontend] 🔍   Found ${usedHooks.size} React hooks used:`, Array.from(usedHooks));

      // Check which hooks are already imported from 'react'
      const reactImportMatch = cleanedContent.match(/import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]react['"]/);
      const importedHooks = new Set<string>();

      if (reactImportMatch) {
        const namedImports = reactImportMatch[1];
        if (namedImports) {
          const imports = namedImports.split(',').map(i => i.trim());
          imports.forEach(imp => {
            // Handle "useState as useStateAlias" format
            const aliasMatch = imp.match(/(\w+)\s+as\s+(\w+)/);
            if (aliasMatch) {
              importedHooks.add(aliasMatch[1]);
              importedHooks.add(aliasMatch[2]);
            } else {
              importedHooks.add(imp);
            }
          });
        }
        console.log(`[Frontend] 🔍   Already imported from react:`, Array.from(importedHooks));
      }

      // Find hooks that are used but not imported
      const missingHooks = Array.from(usedHooks).filter(hook => !importedHooks.has(hook));

      if (missingHooks.length > 0) {
        console.log(`[Frontend] ⚠️  MISSING REACT HOOKS:`, missingHooks);

        // Add missing hooks to the import statement
        if (reactImportMatch) {
          // Update existing import - handle both named and default imports
          const allHooks = [...importedHooks, ...missingHooks].sort();
          const defaultImport = reactImportMatch[2]; // e.g., "React" in "import React from 'react'"

          if (defaultImport) {
            // Has default import: import React from 'react' → import React, { useState, useEffect } from 'react'
            const newImport = `import ${defaultImport}, { ${allHooks.join(', ')} } from 'react'`;
            cleanedContent = cleanedContent.replace(/import\s+(?:{[^}]+}|\w+)\s+from\s+['"]react['"]/, newImport);
          } else {
            // Only named imports: import { ... } from 'react'
            const newImport = `import { ${allHooks.join(', ')} } from 'react'`;
            cleanedContent = cleanedContent.replace(/import\s+{[^}]+}\s+from\s+['"]react['"]/, newImport);
          }
          console.log(`[Frontend] ✅ AUTO-FIXED: Updated react import with missing hooks`);
        } else {
          // Add new react import after 'use client' if present, or at the very beginning
          const useClientMatch = cleanedContent.match(/^['"]use client['"][\r\n]+/);
          const newImport = `import { ${missingHooks.sort().join(', ')} } from 'react'\n`;

          if (useClientMatch) {
            cleanedContent = cleanedContent.replace(useClientMatch[0], useClientMatch[0] + newImport);
          } else {
            cleanedContent = newImport + cleanedContent;
          }
          console.log(`[Frontend] ✅ AUTO-FIXED: Added new react import with hooks`);
        }
      } else {
        console.log(`[Frontend] ✅ All React hooks are properly imported`);
      }
    }

    // 🚨 AUTO-FIX: Fix malformed import statements (missing commas)
    // This prevents "Expected ',', got 'Identifier'" syntax errors
    console.log(`[Frontend] 🔍 AUTO-FIX: Checking for malformed import statements...`);

    // Find all import statements and check for missing commas
    const importPattern = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
    let importMatch;
    let hasFixedImports = false;

    while ((importMatch = importPattern.exec(cleanedContent)) !== null) {
      const fullImport = importMatch[0];
      const importsSection = importMatch[1];
      const moduleName = importMatch[2];

      // Check if imports have missing commas (e.g., "Zap Sparkles" instead of "Zap, Sparkles")
      // Pattern: PascalCase word followed by space and another PascalCase word without comma
      const missingCommaPattern = /([A-Z][a-zA-Z0-9]*)\s+([A-Z][a-zA-Z0-9]*)/;

      if (missingCommaPattern.test(importsSection)) {
        console.log(`[Frontend] ⚠️  MALFORMED IMPORT: ${moduleName}`);
        console.log(`[Frontend]     Before: import { ${importsSection} } from "${moduleName}"`);

        // Fix: Add commas between all consecutive PascalCase words
        let fixedImports = importsSection;
        // Keep applying the fix until no more matches (handles multiple missing commas)
        while (missingCommaPattern.test(fixedImports)) {
          fixedImports = fixedImports.replace(missingCommaPattern, '$1, $2');
        }

        console.log(`[Frontend]     After:  import { ${fixedImports} } from "${moduleName}"`);

        // Replace the malformed import with the fixed version
        const fixedImport = `import { ${fixedImports} } from "${moduleName}"`;
        cleanedContent = cleanedContent.replace(fullImport, fixedImport);
        hasFixedImports = true;
      }
    }

    if (hasFixedImports) {
      console.log(`[Frontend] ✅ AUTO-FIXED: Corrected malformed import statements`);
    } else {
      console.log(`[Frontend] ✅ All import statements are properly formatted`);
    }

    // 🚨 AUTO-FIX: Add generateStaticParams() to dynamic routes if missing
    // This prevents build failures from "missing generateStaticParams()" error
    // IMPORTANT: Skip if component uses client-side features (useState, useEffect, etc.)
    const isDynamicRoute = filePlan.path.includes('[') && filePlan.path.includes(']') && filePlan.path.endsWith('page.tsx');
    if (isDynamicRoute) {
      console.log(`[Frontend] 🔍 AUTO-FIX: Checking dynamic route ${filePlan.path} for generateStaticParams()`);

      const hasGenerateStaticParams = /export\s+(?:async\s+)?function\s+generateStaticParams/.test(cleanedContent);
      const hasUseClient = /^['"]use client['"]/.test(cleanedContent);

      // Check if component uses client-side features
      const usesClientFeatures =
        cleanedContent.includes('useState') ||
        cleanedContent.includes('useEffect') ||
        cleanedContent.includes('useRef') ||
        cleanedContent.includes('useCallback') ||
        cleanedContent.includes('useMemo') ||
        cleanedContent.includes('useContext') ||
        cleanedContent.includes('useReducer') ||
        cleanedContent.includes('useRouter') || // next/navigation
        cleanedContent.includes('useParams') ||
        cleanedContent.includes('useSearchParams');

      if (!hasGenerateStaticParams && !usesClientFeatures) {
        console.log(`[Frontend] 🚨 Server Component missing generateStaticParams() - AUTO-FIXING!`);

        // Remove 'use client' if present (incompatible with generateStaticParams)
        if (hasUseClient) {
          console.log(`[Frontend] 🔧 Removing 'use client' directive (incompatible with generateStaticParams)`);
          // More robust regex: handles both single/double quotes, optional whitespace, and any line ending
          cleanedContent = cleanedContent.replace(/^['"]use client['"];?\s*[\r\n]+/m, '');
          // Also remove if there's whitespace before it
          cleanedContent = cleanedContent.replace(/^\s*['"]use client['"];?\s*[\r\n]+/m, '');
          console.log(`[Frontend] 🔍 After removing 'use client', content starts with: "${cleanedContent.substring(0, 50)}..."`);
        }

        // Extract param name from path (e.g., [slug] → slug, [id] → id)
        const paramMatch = filePlan.path.match(/\[([^\]]+)\]/);
        const paramName = paramMatch ? paramMatch[1] : 'id';

        // Inject generateStaticParams() before the default export
        const generateStaticParamsCode = `
// 🚨 AUTO-GENERATED: Required for static export with dynamic routes
export async function generateStaticParams() {
  // Return hardcoded params for static generation
  // TODO: Replace with actual data fetching if needed
  return [
    { ${paramName}: 'sample-1' },
    { ${paramName}: 'sample-2' },
    { ${paramName}: 'sample-3' }
  ];
}

`;

        // Find where to inject (before default export)
        const exportDefaultMatch = cleanedContent.match(/export\s+default\s+function/);
        if (exportDefaultMatch && exportDefaultMatch.index !== undefined) {
          cleanedContent =
            cleanedContent.slice(0, exportDefaultMatch.index) +
            generateStaticParamsCode +
            cleanedContent.slice(exportDefaultMatch.index);

          console.log(`[Frontend] ✅ AUTO-FIXED: Added generateStaticParams() to ${filePlan.path}`);

          // VERIFICATION: Check that 'use client' was actually removed
          const stillHasUseClient = /^['"]use client['"]/.test(cleanedContent) || /^\s*['"]use client['"]/.test(cleanedContent);
          if (stillHasUseClient) {
            console.error(`[Frontend] ❌ CRITICAL: Failed to remove 'use client' from ${filePlan.path}!`);
            console.error(`[Frontend] 🔍 Content preview: "${cleanedContent.substring(0, 100)}..."`);
          } else {
            console.log(`[Frontend] ✅ VERIFIED: 'use client' successfully removed from ${filePlan.path}`);
          }
        } else {
          console.log(`[Frontend] ⚠️  Could not find default export to inject generateStaticParams()`);
        }
      } else if (!hasGenerateStaticParams && usesClientFeatures) {
        // Client component - ensure it has 'use client' directive
        if (!hasUseClient) {
          console.log(`[Frontend] 🔧 Client component missing 'use client' - adding it!`);
          cleanedContent = `'use client';\n\n${cleanedContent}`;
          console.log(`[Frontend] ✅ Added 'use client' to client component ${filePlan.path}`);
        } else {
          console.log(`[Frontend] ✅ Client component has 'use client' directive - no generateStaticParams() needed`);
        }
      } else {
        console.log(`[Frontend] ✅ generateStaticParams() already present in ${filePlan.path}`);
      }
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔍 PHASE 2: UI VALIDATION - Check for quality issues
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (filePlan.path.endsWith('.tsx') || filePlan.path.endsWith('.jsx')) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[Frontend] 🔍 VALIDATING UI QUALITY for ${filePlan.path}...`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    const validationResult = await validateGeneratedUI(cleanedContent, state.uxConfig);
    const summary = getValidationSummary(validationResult);

    console.log(`[Frontend] 📊 Validation Summary: ${summary}`);

    // Log contrast issues
    if (validationResult.contrastIssues.length > 0) {
      console.warn(`[Frontend] ⚠️  CONTRAST ISSUES (${validationResult.contrastIssues.length}):`);
      validationResult.contrastIssues.forEach(issue => {
        console.warn(`[Frontend]    Line ${issue.line}: ${issue.background} + ${issue.foreground} (${issue.wcagLevel})`);
        console.warn(`[Frontend]    💡 ${issue.suggestion}`);
      });

      // Apply auto-fixes for critical contrast issues
      const criticalIssues = validationResult.contrastIssues.filter(i => i.wcagLevel === 'fail');
      if (criticalIssues.length > 0) {
        console.log(`[Frontend] 🔧 AUTO-FIXING ${criticalIssues.length} critical contrast issue(s)...`);
        cleanedContent = applyAutoFixes(cleanedContent, criticalIssues);
        console.log(`[Frontend] ✅ Contrast issues fixed!`);
      }
    } else {
      console.log(`[Frontend] ✅ No contrast issues detected`);
    }

    // Log animation warnings
    if (validationResult.animationWarnings.length > 0) {
      console.log(`[Frontend] ℹ️  ANIMATION SUGGESTIONS (${validationResult.animationWarnings.length}):`);
      validationResult.animationWarnings.forEach(warning => {
        console.log(`[Frontend]    💡 ${warning}`);
      });
    }

    // Log alignment warnings
    if (validationResult.alignmentWarnings.length > 0) {
      console.log(`[Frontend] ℹ️  ALIGNMENT SUGGESTIONS (${validationResult.alignmentWarnings.length}):`);
      validationResult.alignmentWarnings.forEach(warning => {
        console.log(`[Frontend]    💡 ${warning}`);
      });
    }

    // Overall quality check
    if (hasQualityIssues(validationResult)) {
      console.log(`[Frontend] ⚠️  Some quality issues remain. Review suggestions above.`);
    } else {
      console.log(`[Frontend] ✅ UI quality validation passed!`);
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  }
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return cleanedContent;
}

/**
 * Store file in Memory MCP for context in next iterations
 */
async function storeFileInMemory(
  projectId: string,
  filePath: string,
  content: string,
  purpose: string
): Promise<void> {
  try {
    const mcpManager = getMCPManager();

    // Memory storage disabled - provides minimal value for token cost
    console.log(`[Frontend] 💾 Stored ${filePath} in memory`);
  } catch (error) {
    // Silently skip
  }
}

/**
 * MAIN FRONTEND NODE - Unified Next.js Generator
 * Always generates Next.js + TypeScript + Tailwind
 * AI decides file structure and complexity
 */
export async function frontendNode(state: AppGenState): Promise<Partial<AppGenState>> {
  const startTime = Date.now();

  try {
    console.log('[Frontend] 🚀 Starting unified frontend node (Next.js AI Autonomy)');
    console.log('[Frontend] 🔍 State:', { hasStylingConfig: !!state.stylingConfig, primary: state.stylingConfig?.colorTheme?.primary });
    console.log('[Frontend] 📊 Framework: Next.js + TypeScript + Tailwind (always)');
    console.log(`[Frontend] 📊 Complexity: ${state.context?.complexity || 'auto'}`);
    console.log(`[Frontend] 🗄️ Backend: ${state.backendConfig ? 'YES' : 'NO'}`);

    // CONVERSATION MEMORY: Get conversation context for multi-turn editing
    console.log('[Frontend] 💬 Loading conversation memory...');
    const conversationContext = getConversationContext(state.projectId);
    if (conversationContext) {
      console.log('[Frontend] 💬 Conversation context loaded - enabling multi-turn editing');
    }

    // Set tech stack (hardcoded)
    const techStack = {
      framework: 'nextjs' as const,
      language: 'typescript' as const,
      styling: 'tailwind' as const
    };

    emitNodeStart('frontend', state, {
      userInput: state.userDescription,
      interpretation: `Generating Next.js application with ${state.backendConfig ? 'backend integration' : 'no backend'}`,
      plan: `Phase 1: AI plans file structure. Phase 2: Generate files with inline types.`
    });

    // Load component catalog (NOT full library) - 98% token reduction
    console.log('[Frontend] 📚 Loading component catalog...');
    const designSystem = state.designSystem || 'tailwind-shadcn'; // Default to shadcn/ui
    const componentCatalog = getComponentCatalog(designSystem);
    const catalogTokens = getCatalogTokenEstimate(designSystem);
    console.log(`[Frontend] ✅ Component catalog loaded: ${componentCatalog.length} chars (~${catalogTokens} tokens vs ~4000 for full library)`);

    // Load page patterns for UI guidance
    const pagePatterns = getMinimalPatternReference(); // Use minimal version for tight token budget
    console.log('[Frontend] 📐 Page patterns loaded');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 1: AI PLANS FILE STRUCTURE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    emitFilePlanningStart(state.projectId, 'frontend');
    emitProgress('frontend', state.projectId, '🎯 Planning your app structure...');
    let fileStructure = await planFileStructure(state, conversationContext);

    // ✅ SAFETY FILTER: Remove API routes if no backend
    const hasBackend = !!(state.backendConfig?.collections && state.backendConfig.collections.length > 0);
    if (!hasBackend) {
      fileStructure = fileStructure.filter(f => !f.path.includes('/api/') && !f.path.includes('db.ts'));
    }

    emitFilePlanningComplete(state.projectId, 'frontend', fileStructure);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 2: GENERATE FILES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log('[Frontend] 🔄 Phase 2: Generating files...');

    const files: Array<{ path: string; content: string }> = [];
    const previousFiles: Array<{ path: string; content: string; purpose: string }> = [];

    // ✅ FIX 41: PRE-GENERATE globals.css with template BEFORE AI loop
    // This ensures AI NEVER touches globals.css
    const globalsIndex = fileStructure.findIndex(f => f.path.includes('globals.css'));
    let globalsFileAdded = false;
    if (globalsIndex !== -1) {
      console.log('[Frontend] 🎯 PRE-GENERATING globals.css with template (NEVER using AI)');
      const colors = state.stylingConfig?.colorTheme;
      const typography = state.stylingConfig?.typography;
      const headingWeight = typography?.headingWeight || 700;

      // ✅ COMPREHENSIVE STYLING CONFIG LOGGING
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[Frontend] 🎨 STYLING CONFIG FOR globals.css:');
      console.log('[Frontend] 📋 Color Theme:', {
        mode: colors?.mode || 'light',
        primary: colors?.primary || 'default',
        secondary: colors?.secondary || 'default',
        accent: colors?.accent || 'default'
      });
      console.log('[Frontend] 📋 Typography:', {
        fontFamily: typography?.fontFamily || 'Inter',
        headingWeight: headingWeight,
        scale: typography?.scale || 'normal'
      });

      const mode = colors?.mode || 'light';
      const fontFamily = typography?.fontFamily || 'Inter';
      const animations = state.stylingConfig?.animations || { enabled: true, intensity: 'subtle' };
      const layout = state.stylingConfig?.layout || {};
      const borderRadius = layout?.borderRadius || 'medium';

      const radiusMap: Record<string, string> = {
        none: '0',
        small: '0.25rem',
        medium: '0.5rem',
        large: '1rem',
        full: '9999px'
      };
      const radiusValue = radiusMap[borderRadius] || '0.5rem';

      const primaryHSL = colors?.primary ? hexToHslString(colors.primary) : '221.2 83.2% 53.3%';
      const secondaryHSL = colors?.secondary ? hexToHslString(colors.secondary) : '210 40% 96.1%';
      const accentHSL = colors?.accent ? hexToHslString(colors.accent) : '217.2 91.2% 59.8%';
      const backgroundHSL = colors?.background ? hexToHslString(colors.background) : (mode === 'dark' ? '222.2 84% 4.9%' : '0 0% 100%');
      const backgroundSecondaryHSL = colors?.backgroundSecondary ? hexToHslString(colors.backgroundSecondary) : (mode === 'dark' ? '222.2 84% 8%' : '0 0% 98%');
      const backgroundTertiaryHSL = colors?.backgroundTertiary ? hexToHslString(colors.backgroundTertiary) : (mode === 'dark' ? '222.2 84% 11%' : '0 0% 96%');
      const borderHSL = colors?.border ? hexToHslString(colors.border) : (mode === 'dark' ? '240 3.7% 15.9%' : '240 5.9% 90%');
      const mutedHSL = colors?.muted ? hexToHslString(colors.muted) : (mode === 'dark' ? '240 3.7% 15.9%' : '240 4.8% 95.9%');
      const destructiveHSL = colors?.destructive ? hexToHslString(colors.destructive) : '0 84.2% 60.2%';
      const successHSL = colors?.success ? hexToHslString(colors.success) : '142.1 76.2% 36.3%';
      const warningHSL = colors?.warning ? hexToHslString(colors.warning) : '32.1 94.6% 43.7%';
      const infoHSL = colors?.info ? hexToHslString(colors.info) : '221.2 83.2% 53.3%';

      console.log('[Frontend] 🎨 Converted HSL Values:', {
        primary: primaryHSL,
        secondary: secondaryHSL,
        accent: accentHSL,
        background: backgroundHSL,
        backgroundSecondary: backgroundSecondaryHSL,
        backgroundTertiary: backgroundTertiaryHSL,
        border: borderHSL,
        muted: mutedHSL,
        destructive: destructiveHSL,
        success: successHSL,
        warning: warningHSL,
        info: infoHSL
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const globalsCss = `/**
 * ⚠️ DO NOT EDIT THIS FILE MANUALLY
 * This file is auto-generated by the VB platform based on your theme settings.
 * Any manual changes will be overwritten when you update your project's styling.
 * To modify styles, use Tailwind utility classes in your components.
 */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ========== BASE COLORS ========== */
    --background: ${backgroundHSL};
    --background-secondary: ${backgroundSecondaryHSL};
    --background-tertiary: ${backgroundTertiaryHSL};
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: ${primaryHSL};
    --primary-foreground: 210 40% 98%;
    --secondary: ${secondaryHSL};
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: ${mutedHSL};
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: ${accentHSL};
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: ${destructiveHSL};
    --destructive-foreground: 210 40% 98%;
    --success: ${successHSL};
    --success-foreground: 210 40% 98%;
    --warning: ${warningHSL};
    --warning-foreground: 222.2 84% 4.9%;
    --info: ${infoHSL};
    --info-foreground: 210 40% 98%;
    --border: ${borderHSL};
    --input: ${borderHSL};
    --ring: ${primaryHSL};
    --radius: ${radiusValue};${state.stylingConfig?.enhancedColors?.semantic ? `

    /* ========== SEMANTIC COLORS (ENRICHED) ========== */
    --text-default: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.textDefault)};
    --text-secondary: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.textSecondary)};
    --text-disabled: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.textDisabled)};
    --text-on-color: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.textOnColor)};
    --bg-default: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.bgDefault)};
    --bg-surface: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.bgSurface)};
    --bg-elevated: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.bgElevated)};
    --bg-overlay: ${state.stylingConfig.enhancedColors.semantic.bgOverlay};
    --border-default: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.borderDefault)};
    --border-subtle: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.borderSubtle)};
    --border-strong: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.borderStrong)};
    --interactive: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.interactive)};
    --interactive-hover: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.interactiveHover)};
    --interactive-active: ${hexToHslString(state.stylingConfig.enhancedColors.semantic.interactiveActive)};` : ''}${state.stylingConfig?.enhancedColors?.shadows ? `

    /* ========== SHADOWS (ENRICHED) ========== */
    --shadow-sm: ${state.stylingConfig.enhancedColors.shadows.sm};
    --shadow-md: ${state.stylingConfig.enhancedColors.shadows.md};
    --shadow-lg: ${state.stylingConfig.enhancedColors.shadows.lg};
    --shadow-xl: ${state.stylingConfig.enhancedColors.shadows.xl};
    --shadow-2xl: ${state.stylingConfig.enhancedColors.shadows['2xl']};
    --shadow-inner: ${state.stylingConfig.enhancedColors.shadows.inner};` : ''}${state.stylingConfig?.spacing ? `

    /* ========== SPACING (ENRICHED) ========== */
    --spacing-0: ${state.stylingConfig.spacing.scale['0']};
    --spacing-1: ${state.stylingConfig.spacing.scale['1']};
    --spacing-2: ${state.stylingConfig.spacing.scale['2']};
    --spacing-3: ${state.stylingConfig.spacing.scale['3']};
    --spacing-4: ${state.stylingConfig.spacing.scale['4']};
    --spacing-6: ${state.stylingConfig.spacing.scale['6']};
    --spacing-8: ${state.stylingConfig.spacing.scale['8']};
    --spacing-12: ${state.stylingConfig.spacing.scale['12']};
    --spacing-16: ${state.stylingConfig.spacing.scale['16']};
    --spacing-24: ${state.stylingConfig.spacing.scale['24']};
    --container-max: ${state.stylingConfig.spacing.layout.containerMax};
    --section-padding: ${state.stylingConfig.spacing.layout.sectionPadding};
    --component-gap: ${state.stylingConfig.spacing.layout.componentGap};` : ''}${state.stylingConfig?.bordering ? `

    /* ========== BORDER RADIUS (ENRICHED) ========== */
    --radius-sm: ${state.stylingConfig.bordering.radiusScale.sm};
    --radius-md: ${state.stylingConfig.bordering.radiusScale.md};
    --radius-lg: ${state.stylingConfig.bordering.radiusScale.lg};
    --radius-xl: ${state.stylingConfig.bordering.radiusScale.xl};
    --radius-2xl: ${state.stylingConfig.bordering.radiusScale['2xl']};
    --radius-full: ${state.stylingConfig.bordering.radiusScale.full};` : ''}${state.stylingConfig?.transitions ? `

    /* ========== TRANSITIONS (ENRICHED) ========== */
    --duration-fast: ${state.stylingConfig.transitions.durations.fast};
    --duration-normal: ${state.stylingConfig.transitions.durations.normal};
    --duration-slow: ${state.stylingConfig.transitions.durations.slow};
    --ease-default: ${state.stylingConfig.transitions.easings.default};
    --ease-spring: ${state.stylingConfig.transitions.easings.spring};
    --z-modal: ${state.stylingConfig.transitions.zIndices.modal};
    --z-popover: ${state.stylingConfig.transitions.zIndices.popover};
    --z-toast: ${state.stylingConfig.transitions.zIndices.toast};` : ''}
  }

  .dark {
    --background: ${mode === 'dark' ? backgroundHSL : '222.2 84% 4.9%'};
    --background-secondary: ${mode === 'dark' ? backgroundSecondaryHSL : '222.2 84% 8%'};
    --background-tertiary: ${mode === 'dark' ? backgroundTertiaryHSL : '222.2 84% 11%'};
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: ${primaryHSL};
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: ${secondaryHSL};
    --secondary-foreground: 210 40% 98%;
    --muted: ${mutedHSL};
    --muted-foreground: 215 20.2% 65.1%;
    --accent: ${accentHSL};
    --accent-foreground: 210 40% 98%;
    --destructive: ${destructiveHSL};
    --destructive-foreground: 210 40% 98%;
    --success: ${successHSL};
    --success-foreground: 210 40% 98%;
    --warning: ${warningHSL};
    --warning-foreground: 222.2 84% 4.9%;
    --info: ${infoHSL};
    --info-foreground: 210 40% 98%;
    --border: ${borderHSL};
    --input: ${borderHSL};
    --ring: ${primaryHSL};
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
  }

  h1 {
    @apply text-4xl md:text-5xl font-[${headingWeight}] tracking-tight;
  }

  h2 {
    @apply text-3xl md:text-4xl font-[${headingWeight}] tracking-tight;
  }

  h3 {
    @apply text-2xl md:text-3xl font-[${headingWeight}];
  }

  h4 {
    @apply text-xl md:text-2xl font-semibold;
  }

  h5 {
    @apply text-lg md:text-xl font-semibold;
  }

  h6 {
    @apply text-base md:text-lg font-semibold;
  }

  p {
    @apply text-base leading-relaxed;
  }

  small {
    @apply text-sm;
  }
}

@layer components {
  /* Button Components */
  .btn {
    @apply inline-flex items-center justify-center text-sm font-medium transition-all;
    @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2;
    @apply disabled:opacity-50 disabled:pointer-events-none;
    border-radius: ${radiusValue};
  }

  .btn-primary {
    @apply bg-primary text-primary-foreground hover:bg-primary/90;
  }

  .btn-secondary {
    @apply bg-secondary text-secondary-foreground hover:bg-secondary/80;
  }

  .btn-outline {
    @apply border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground;
  }

  .btn-ghost {
    @apply bg-transparent hover:bg-muted text-foreground;
  }

  .btn-sm {
    @apply h-8 px-3 text-xs;
  }

  .btn-md {
    @apply h-10 px-4 py-2;
  }

  .btn-lg {
    @apply h-12 px-6 text-base;
  }

  .btn-xl {
    @apply h-14 px-8 text-lg;
  }

  /* Card Components */
  .card {
    @apply border bg-card text-card-foreground shadow-sm;
    border-radius: ${radiusValue};
  }

  .card-hover {
    @apply transition-all duration-200 hover:shadow-md;
  }

  .card-interactive {
    @apply cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5;
  }

  .card-gradient {
    @apply bg-gradient-to-br from-card to-muted;
  }

  .card-padding {
    @apply p-6;
  }

  .card-padding-lg {
    @apply p-8;
  }

  /* Spacing Containers */
  .container {
    @apply max-w-7xl mx-auto px-4 md:px-6 lg:px-8;
  }

  .container-sm {
    @apply max-w-4xl mx-auto px-4 md:px-6;
  }

  .container-lg {
    @apply max-w-[1400px] mx-auto px-4 md:px-8;
  }

  .section {
    @apply py-16 md:py-24;
  }

  .section-sm {
    @apply py-12 md:py-16;
  }

  .section-lg {
    @apply py-24 md:py-32;
  }

  /* Grid Layouts */
  .grid-2 {
    @apply grid grid-cols-1 md:grid-cols-2 gap-6;
  }

  .grid-3 {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
  }

  .grid-4 {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
  }

  .grid-auto-fit {
    @apply grid gap-6;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }

  /* Flexbox Utilities */
  .flex-between {
    @apply flex items-center justify-between;
  }

  .flex-center {
    @apply flex items-center justify-center;
  }

  .flex-start {
    @apply flex items-center justify-start;
  }

  .flex-end {
    @apply flex items-center justify-end;
  }

  .flex-col-center {
    @apply flex flex-col items-center justify-center;
  }

  /* Form Components */
  .form-group {
    @apply space-y-2;
  }

  .form-grid {
    @apply grid gap-4;
  }

  .form-grid-2 {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4;
  }

  .form-grid-3 {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    @apply w-full px-3 py-2 border border-border bg-background;
    @apply focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent;
    @apply transition-all;
    border-radius: ${radiusValue};
  }

  /* Badge Components */
  .badge {
    @apply inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors;
  }

  .badge-primary {
    @apply bg-primary text-primary-foreground;
  }

  .badge-success {
    @apply bg-success text-success-foreground;
  }

  .badge-destructive {
    @apply bg-destructive text-destructive-foreground;
  }

  .badge-sm {
    @apply px-2 py-0.5 text-[10px];
  }

  .badge-md {
    @apply px-2.5 py-0.5 text-xs;
  }

  .badge-lg {
    @apply px-3 py-1 text-sm;
  }

  /* Typography Utilities */
  .text-hero {
    @apply text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight;
  }

  .text-display {
    @apply text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight;
  }

  .text-heading {
    @apply text-2xl md:text-3xl font-semibold tracking-tight;
  }

  .text-subheading {
    @apply text-lg md:text-xl font-medium text-muted-foreground;
  }

  .text-body {
    @apply text-base text-foreground;
  }

  .text-gradient {
    @apply bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent;
  }

  /* Shadow Utilities */
  .shadow-soft {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .shadow-medium {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  .shadow-strong {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
  }
}
`;

      files.push({ path: 'src/app/globals.css', content: globalsCss });
      previousFiles.push({ path: 'src/app/globals.css', content: globalsCss, purpose: 'Global styles' });
      await storeFileInMemory(state.projectId, 'src/app/globals.css', globalsCss, 'Global styles');

      // Emit events for globals.css creation
      const globalsActualTotal = fileStructure.length; // Total before removing globals.css
      emitFileCreating(state.projectId, 'frontend', 'src/app/globals.css', 1, globalsActualTotal);
      emitFileCreated(state.projectId, 'frontend', 'src/app/globals.css', 1, globalsActualTotal, globalsCss.length);

      // Mark that we added globals.css
      globalsFileAdded = true;

      // REMOVE globals.css from fileStructure so AI never generates it
      fileStructure.splice(globalsIndex, 1);
      console.log('[Frontend] ✅ globals.css pre-generated with template, removed from AI queue');
    }

    // ✨ NEW: Fetch component examples based on app type
    console.log('[Frontend] 📚 Fetching component examples...');
    const appType = state.context?.appType || 'general';
    const visualTone = state.context?.visualTone || 'modern';
    const industry = getIndustryFromDescription(state.userDescription);

    const componentExamples = await selectExamplesForCategory(
      getCategoryFromAppType(appType),
      {
        industry,
        style: visualTone,
        limit: 8 // Get top 8 examples
      }
    );

    const exampleContext = componentExamples.length > 0
      ? `\n\n## 🎨 COMPONENT EXAMPLES (PROVEN PATTERNS)\n\nUse these real-world examples as reference. Adapt patterns, layouts, and interactions to match the user's requirements:\n\n${componentExamples.map((ex, idx) => `
### Example ${idx + 1}: ${ex.title}
**Description:** ${ex.description}
**Quality Score:** ${ex.qualityScore}/100
**Usage Count:** ${ex.usageCount}

\`\`\`${ex.codeLanguage || 'tsx'}
${ex.code}
\`\`\`

**Key Patterns:**
${ex.patterns?.map((p: string) => `- ${p}`).join('\n') || '- Modern component structure\n- Responsive design\n- Accessible interactions'}
`).join('\n---\n')}\n`
      : '';

    console.log(`[Frontend] ✅ Loaded ${componentExamples.length} component examples`);

    // Track example usage (for analytics)
    if (componentExamples.length > 0) {
      const { pb } = await import('@/lib/pocketbase');
      for (const example of componentExamples) {
        try {
          await pb.collection('design_examples').update(example.id, {
            usageCount: (example.usageCount || 0) + 1,
            lastUsed: new Date().toISOString()
          });
        } catch (error) {
          console.warn(`[Frontend] Failed to track example usage: ${example.id}`);
        }
      }
    }

    // ✨ PHASE 7: Generate infrastructure files (state management, forms, Radix UI)
    console.log('[Frontend] 📦 Generating infrastructure files...');

    // Use existing hasBackend variable (already declared at line 2996)

    // 1. Zustand Store (always generated for auth & UI state)
    files.push({
      path: 'src/lib/store.ts',
      content: zustandStoreTemplate
    });
    console.log('[Frontend] ✅ Generated src/lib/store.ts (Zustand)');

    // 2. React Query Client (only if backend exists)
    if (hasBackend) {
      files.push({
        path: 'src/lib/query-client.ts',
        content: queryClientTemplate
      });
      console.log('[Frontend] ✅ Generated src/lib/query-client.ts (React Query)');

      // 2.5. PocketBase Client (required for API hooks)
      files.push({
        path: 'src/lib/pocketbase.ts',
        content: pocketbaseClientTemplate
      });
      console.log('[Frontend] ✅ Generated src/lib/pocketbase.ts (PocketBase client)');

      // 3. API Hooks (generated based on backend collections)
      const apiHooksContent = generateApiHooks(state.backendConfig?.collections || []);
      files.push({
        path: 'src/lib/api-hooks.ts',
        content: apiHooksContent
      });
      console.log(`[Frontend] ✅ Generated src/lib/api-hooks.ts (${state.backendConfig?.collections?.length || 0} collections)`);
    }

    // 4. Form Utilities (React Hook Form + Zod)
    files.push({
      path: 'src/lib/form-utils.ts',
      content: formUtilsTemplate
    });
    console.log('[Frontend] ✅ Generated src/lib/form-utils.ts (RHF + Zod)');

    // 5. Radix UI Components
    files.push({
      path: 'src/components/ui/Modal.tsx',
      content: radixModalComponent
    });
    files.push({
      path: 'src/components/ui/Dropdown.tsx',
      content: radixDropdownComponent
    });
    files.push({
      path: 'src/components/ui/Select.tsx',
      content: radixSelectComponent
    });
    files.push({
      path: 'src/components/ui/Toast.tsx',
      content: radixToastComponent
    });
    console.log('[Frontend] ✅ Generated 4 Radix UI components (Modal, Dropdown, Select, Toast)');

    // 6. Package.json with all dependencies
    const iconSource = state.stylingConfig?.iconography?.source || 'lucide';
    const iconLibraryForPackageJson = {
      'lucide': { package: 'lucide-react', version: '^0.454.0' },
      'heroicons': { package: '@heroicons/react', version: '^2.1.1' },
      'material-icons': { package: '@mui/icons-material', version: '^6.1.6' }
    }[iconSource] || { package: 'lucide-react', version: '^0.454.0' };

    const packageJsonContent = generateUpdatedPackageJson(state.projectId, iconLibraryForPackageJson);
    files.push({
      path: 'package.json',
      content: JSON.stringify(packageJsonContent, null, 2)
    });
    console.log('[Frontend] ✅ Generated package.json with infrastructure dependencies');

    const infraFilesCount = hasBackend ? 11 : 9; // With or without React Query files
    console.log(`[Frontend] 🎉 Infrastructure setup complete (${infraFilesCount} files)`);

    const otherFiles = fileStructure;
    // Total includes globals.css that was already created
    const actualTotalFiles = globalsFileAdded ? otherFiles.length + 1 : otherFiles.length;

    for (let i = 0; i < otherFiles.length; i++) {
      const filePlan = otherFiles[i];
      const progress = Math.round(((i + 2) / actualTotalFiles) * 100); // +2 because globals.css is file #1
      const totalFileNumber = globalsFileAdded ? i + 2 : i + 1; // Adjust numbering if globals.css was added
      const totalFilesCount = actualTotalFiles;

      // Emit file creating event
      emitFileCreating(state.projectId, 'frontend', filePlan.path, totalFileNumber, totalFilesCount);
      emitProgress('frontend', state.projectId, `📝 Creating ${filePlan.path}...`, {
        fileName: filePlan.path,
        fileNumber: totalFileNumber,
        totalFiles: totalFilesCount,
        progress
      });

      // Generate single file with catalog, patterns, conversation context, and component examples
      const content = await generateFile(state, filePlan, previousFiles, componentCatalog, pagePatterns, undefined, conversationContext, exampleContext);

      // Add to files array
      files.push({ path: filePlan.path, content });

      // Add to context for next iteration
      previousFiles.push({ path: filePlan.path, content, purpose: filePlan.purpose });

      // Store in memory for cross-file awareness
      await storeFileInMemory(state.projectId, filePlan.path, content, filePlan.purpose);

      // Emit file created event
      emitFileCreated(state.projectId, 'frontend', filePlan.path, totalFileNumber, totalFilesCount, content.length);

      console.log(`[Frontend] ✅ Generated ${filePlan.path} (${content.length} chars) [${progress}%]`);

      // ✅ FIX: Validate backend integration for page files
      if (hasBackend && filePlan.path.includes('/page.tsx')) {
        const hasApiImport = content.includes("from '@/lib/api'");
        const hasSampleData = content.match(/const \w+ = \[\s*\{/);

        if (!hasApiImport) {
          console.log(`⚠️  WARNING: ${filePlan.path} has NO API import but backend exists!`);
        }
        if (hasSampleData) {
          console.log(`⚠️  WARNING: ${filePlan.path} uses sample data array but backend exists!`);
        }
        if (hasApiImport && !hasSampleData) {
          console.log(`✅ ${filePlan.path} correctly uses backend API`);
        }
      }
    }

    const duration = Date.now() - startTime;
    const totalCodeSize = files.reduce((sum, f) => sum + f.content.length, 0);

    console.log(`[Frontend] ✅ Completed in ${duration}ms`);
    console.log(`[Frontend] 📊 Files Generated: ${files.length}`);
    console.log(`[Frontend] 📊 Total Code Size: ${totalCodeSize} chars`);
    console.log(`[Frontend] 📊 Average per file: ${Math.round(totalCodeSize / files.length)} chars`);

    // Log token savings from using catalog vs full library
    const oldLibraryTokensPerFile = 4000; // Full component library
    const newCatalogTokensPerFile = catalogTokens; // Component catalog (~75)
    const tokenSavingsPerFile = oldLibraryTokensPerFile - newCatalogTokensPerFile;
    const totalTokenSavings = tokenSavingsPerFile * files.length;
    const savingsPercentage = Math.round((tokenSavingsPerFile / oldLibraryTokensPerFile) * 100);

    console.log(`[Frontend] 💰 Token Optimization:`);
    console.log(`[Frontend]    Old approach: ~${oldLibraryTokensPerFile * files.length} tokens (full library per file)`);
    console.log(`[Frontend]    New approach: ~${newCatalogTokensPerFile * files.length} tokens (catalog per file)`);
    console.log(`[Frontend]    Savings: ~${totalTokenSavings} tokens (${savingsPercentage}% reduction)`);
    console.log(`[Frontend]    Per-file savings: ${tokenSavingsPerFile} tokens`);

    // RULE 3: Generate API client if backend exists
    if (state.backendConfig?.apiEndpoints && state.backendConfig.apiEndpoints.length > 0) {
      console.log('[Frontend] 🔗 Backend detected - generating API client...');
      console.log(`[Frontend] 📊 Endpoints: ${state.backendConfig.apiEndpoints.length}`);

      const apiClientCode = generateApiClient(state.backendConfig.apiEndpoints, state.projectId);

      files.push({
        path: 'src/lib/api.ts',
        content: apiClientCode
      });

      console.log('[Frontend] ✅ API client generated: src/lib/api.ts');

      // Also generate .env.local for API URL configuration
      const envContent = generateEnvFile(state.projectId);
      files.push({
        path: '.env.local',
        content: envContent
      });

      console.log('[Frontend] ✅ Environment file generated: .env.local\n');
    }

    // CONVERSATION MEMORY: Track Frontend's response
    const frontendResponse = `Generated ${files.length} Next.js files with TypeScript and Tailwind CSS. Main pages: ${files.filter(f => f.path.includes('/page.tsx')).map(f => f.path).join(', ')}`;
    addAssistantMessage(state.projectId, frontendResponse, 'frontend');
    console.log('[Frontend] 💬 Tracked assistant response in conversation memory');

    // 💾 Save memory checkpoint after frontend file generation
    await conversationMemoryStore.saveMemory(state.projectId);
    console.log('[Frontend] 💾 Checkpoint saved after frontend file generation');

    // Emit completion
    const filesList = files.map(f => f.path).join(', ');
    emitNodeComplete('frontend', state, duration, {
      taskDescription: 'Generated Next.js application with AI-planned file structure',
      success: true,
      output: {
        filesGenerated: files.length,
        fileNames: files.map(f => f.path),
        techStack,
        totalCodeSize,
        hasApiClient: !!(state.backendConfig?.apiEndpoints && state.backendConfig.apiEndpoints.length > 0)
      },
      summary: `Generated ${files.length} Next.js files: ${filesList}. ${state.backendConfig ? `Integrated with backend (${state.backendConfig.collections?.length || 0} collections, ${state.backendConfig.apiEndpoints?.length || 0} endpoints).` : 'No backend integration.'}`
    });

    // ✅ AUTO-FIX: Create missing component files if AI imported them but didn't generate them
    const missingComponents = new Set<string>();
    files.forEach(file => {
      if (file.content.match(/import.*from ['"]@\/components\/button['"]/)) missingComponents.add('button');
      if (file.content.match(/import.*from ['"]@\/components\/card['"]/)) missingComponents.add('card');
    });

    if (missingComponents.size > 0) {
      console.log(`[Frontend] 🔧 Auto-creating ${missingComponents.size} missing components: ${Array.from(missingComponents).join(', ')}`);

      if (missingComponents.has('button')) {
        files.push({
          path: 'src/components/button.tsx',
          content: `import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ variant = 'default', size = 'md', className = '', children, ...props }: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    default: 'bg-background-raised text-text-primary border border-border-light hover:bg-background-subtle',
    primary: 'bg-gradient-brand text-white hover:opacity-90',
    secondary: 'bg-background-subtle text-text-primary hover:bg-background-overlay',
    outline: 'border-2 border-border-light text-text-primary hover:bg-background-subtle',
    ghost: 'text-text-primary hover:bg-background-subtle',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-base', lg: 'px-6 py-3 text-lg' };
  return <button className={\`\${baseStyles} \${variants[variant]} \${sizes[size]} \${className}\`} {...props}>{children}</button>;
}`
        });
      }

      if (missingComponents.has('card')) {
        files.push({
          path: 'src/components/card.tsx',
          content: `import React from 'react';

interface CardProps { children: React.ReactNode; className?: string; }

export function Card({ children, className = '' }: CardProps) {
  return <div className={\`bg-background-raised border border-border-light rounded-xl p-6 shadow-sm \${className}\`}>{children}</div>;
}

export function CardHeader({ children, className = '' }: CardProps) {
  return <div className={\`mb-4 \${className}\`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: CardProps) {
  return <h3 className={\`text-xl font-semibold text-text-primary \${className}\`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }: CardProps) {
  return <p className={\`text-sm text-text-secondary \${className}\`}>{children}</p>;
}

export function CardContent({ children, className = '' }: CardProps) {
  return <div className={\`\${className}\`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: CardProps) {
  return <div className={\`mt-4 pt-4 border-t border-border-light \${className}\`}>{children}</div>;
}`
        });
      }
    }

    return {
      files,
      fileStructurePlan: fileStructure,
      techStack,
      isMultiPage: files.some(f => f.path.includes('src/app/') && f.path !== 'src/app/page.tsx' && f.path !== 'src/app/layout.tsx'),
      completedNodes: ['frontend'] // Reducer auto-appends
    };

  } catch (error) {
    emitNodeError('frontend', error as Error, state);
    console.error('[Frontend] Error:', error);

    return {
      files: [{
        path: 'src/app/page.tsx',
        content: '// Error generating code\nexport default function Page() { return <div>Error</div>; }'
      }],
      completedNodes: ['frontend'], // Reducer auto-appends
      errors: [{ node: 'frontend', message: (error as Error).message }] // Reducer auto-appends
    };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API CLIENT GENERATION (Week 3)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateApiClient(endpoints: any[], projectId: string): string {
  const apiPort = calculateApiPort(projectId);

  // RULE 2: TypeScript quality standards - proper types for API client
  return `/**
 * AUTO-GENERATED API CLIENT
 *
 * Generated by Frontend Node based on backend configuration.
 * Uses fetch API with proper TypeScript types.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:${apiPort}';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(res.status, error.message || \`HTTP \${res.status}\`);
  }
  return res.json();
}

${endpoints.map(ep => {
  // Extract ALL path parameters (e.g., :id, :name, :tld, :userId)
  const pathParams = (ep.path.match(/:[a-zA-Z_][a-zA-Z0-9_]*/g) || []).map((p: string) => p.slice(1));
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(ep.method);

  // Generate function signature with proper parameters
  let params = [];

  // Add path parameters as individual arguments
  pathParams.forEach((param: string) => {
    params.push(`${param}: string`);
  });

  // Add body parameter for POST/PUT/PATCH
  if (hasBody) params.push('data: any');

  // Build URL with all path parameters replaced
  let urlTemplate = ep.path;
  pathParams.forEach((param: string) => {
    urlTemplate = urlTemplate.replace(`:${param}`, `\${${param}}`);
  });

  return `/**
 * ${ep.description}
 * ${ep.method} ${ep.path}
 */
export async function ${ep.handler}(${params.join(', ')}): Promise<any> {
  const url = \`\${API_BASE}${urlTemplate}\`;

  const res = await fetch(url, {
    method: '${ep.method}',
    ${hasBody ? `headers: { 'Content-Type': 'application/json' },` : ''}
    ${hasBody ? 'body: JSON.stringify(data),' : ''}
    credentials: 'include'
  });

  return handleResponse(res);
}`;
}).join('\n\n')}

// Health check
export async function healthCheck(): Promise<{ status: string; timestamp: number }> {
  const res = await fetch(\`\${API_BASE}/health\`);
  return handleResponse(res);
}
`;
}

/**
 * Calculate deterministic port from projectId (matches deployment-server logic)
 * This ensures the frontend always knows the correct API port
 */
function calculateApiPort(projectId: string): number {
  const PORT_RANGE = { min: 5000, max: 6000 };

  // Same hash algorithm as deployment server
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = ((hash << 5) - hash) + projectId.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Map hash to port range (5000-6000)
  const portOffset = Math.abs(hash) % (PORT_RANGE.max - PORT_RANGE.min + 1);
  const port = PORT_RANGE.min + portOffset;

  return port;
}

function generateEnvFile(projectId: string): string {
  const apiPort = calculateApiPort(projectId);

  return `# Auto-generated environment variables
# These are injected at build time

NEXT_PUBLIC_API_URL=http://localhost:${apiPort}
NEXT_PUBLIC_PROJECT_ID=${projectId}
`;
}

/**
 * Extract industry from user description
 */
function getIndustryFromDescription(description: string): string {
  const lower = description.toLowerCase();

  const industries: Record<string, string[]> = {
    'ecommerce': ['shop', 'store', 'buy', 'sell', 'product', 'cart', 'checkout', 'ecommerce', 'e-commerce'],
    'saas': ['saas', 'software', 'platform', 'dashboard', 'analytics', 'tool', 'service'],
    'fintech': ['finance', 'bank', 'payment', 'wallet', 'crypto', 'trading', 'investment'],
    'healthcare': ['health', 'medical', 'doctor', 'patient', 'clinic', 'hospital', 'appointment'],
    'education': ['education', 'learn', 'course', 'student', 'teacher', 'school', 'university', 'training'],
    'social': ['social', 'network', 'community', 'chat', 'message', 'friend', 'post', 'feed'],
    'travel': ['travel', 'hotel', 'flight', 'booking', 'trip', 'vacation', 'tour'],
    'food': ['food', 'restaurant', 'delivery', 'recipe', 'meal', 'kitchen', 'dining'],
    'real-estate': ['property', 'real estate', 'apartment', 'house', 'rent', 'lease'],
    'entertainment': ['music', 'movie', 'video', 'stream', 'watch', 'listen', 'play', 'game']
  };

  for (const [industry, keywords] of Object.entries(industries)) {
    if (keywords.some(keyword => lower.includes(keyword))) {
      return industry;
    }
  }

  return 'general';
}

/**
 * Map app type to example category
 */
function getCategoryFromAppType(appType: string): string {
  const mapping: Record<string, string> = {
    'landing-page': 'landing-page',
    'saas-dashboard': 'dashboard',
    'e-commerce': 'ecommerce',
    'blog': 'blog',
    'portfolio': 'portfolio',
    'social-media': 'social',
    'marketplace': 'marketplace',
    'admin-panel': 'admin',
    'crm': 'crm',
    'analytics': 'analytics'
  };

  return mapping[appType] || 'landing-page';
}
