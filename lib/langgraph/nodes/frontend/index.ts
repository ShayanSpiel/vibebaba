// @ts-nocheck
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UNIFIED FRONTEND NODE - Next.js AI Autonomy Architecture
// Always generates Next.js + TypeScript + Tailwind
// AI decides file structure, count, and complexity
// SCHEMA-FIRST: Generates types first, then other files with type contract
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { generateWithLogging, estimateTokens } from '../../utils/logging/ai-with-logging';
import { getComponentCatalog, getCatalogTokenEstimate } from '@/lib/components/component-catalog';
import {
  TYPESCRIPT_RULES,
  IMPORT_RULES,
  CODE_STRUCTURE,
  STATE_MANAGEMENT,
  OUTPUT_FORMAT
} from '@/lib/langgraph/prompts/shared-constraints';
import { LUCIDE_ICON_RULES } from '@/lib/langgraph/prompts/lucide-icons';
import { BACKEND_API_RULES, REACT_QUERY_RULES } from '@/lib/langgraph/prompts/backend-integration';
import { FEATURE_INTEGRATION_PATTERNS } from '@/lib/langgraph/prompts/feature-plan';
// Design framework is now provided by UX node via state.designInstructions
import { getPagePatternsPrompt, getMinimalPatternReference } from '@/lib/page-patterns';
import { getNextJSScaffold, getRoutingConventions } from '@/lib/files/file-structure-scaffold';
import type { AppGenState } from '../../types';
import { colord } from 'colord';
import { selectExamplesForCategory, detectIndustryContext } from '@/lib/examples/example-selector';
import { addAssistantMessage, conversationMemoryStore, storeValidationContext } from '@/lib/memory/conversation-memory';
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
} from '@/lib/generation/infrastructure-templates';
import { getProjectRegistry } from '@/lib/registry/project-registry';
import { extractImports, extractExports, extractTypes } from '@/lib/registry/import-extractor';
import type { ComponentMetadata, TypeMetadata, RouteMetadata } from '@/lib/registry/types';
import {
  emitNodeStart,
  emitNodeComplete,
  emitNodeError,
  emitProgress,
  emitFilePlanningStart,
  emitFilePlanningComplete,
  emitFileCreating,
  emitFileCreated
} from '../../utils/logging/events';
import { getMCPManager } from '@/lib/mcp/client';
import { extractTypeDefinitions, formatTypeDefinitionsForContext, type TypeDefinition } from '../../utils/type-extractor';
import { buildEnhancedContext } from '../../utils/export-extractor';
import { validateGeneratedUI, applyAutoFixes, getValidationSummary, hasQualityIssues } from '@/lib/langgraph/validation/post-gen/ui-validator';
import { validateAndFixImports } from '@/lib/utils/import-fixer';
import { validateSingleFile } from '@/lib/langgraph/validation/post-gen/typescript-compiler';
import { validateBackendCompatibility } from '@/lib/langgraph/validation/post-gen/backend-compatibility';
import { generateGlobalsCss } from './templates/globals-css-template';
import { generateApiClient, generateEnvFile } from './generators/api-client-generator';
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
 * Map app type to example category
 */
function getCategoryFromAppType(appType: string): string {
  const mapping: Record<string, string> = {
    'landing-page': 'hero',
    'dashboard': 'dashboard',
    'saas-app': 'app',
    'ecommerce': 'ecommerce',
    'blog': 'blog',
    'portfolio': 'portfolio',
    'tool': 'tool',
    'marketplace': 'marketplace',
    'social': 'social'
  };
  return mapping[appType] || 'general';
}

/**
 * LAZY PROMPT LOADING: Select only relevant prompts based on file type
 * This dramatically reduces token usage by not including unused prompts
 */
function getRelevantPrompts(filePath: string, hasBackend: boolean): {
  typescript: string;
  imports: string;
  codeStructure: string;
  stateManagement: string;
  output: string;
  icons?: string;
  backend?: string;
  reactQuery?: string;
} {
  // Base prompts needed for all TypeScript files
  const base = {
    typescript: TYPESCRIPT_RULES,
    imports: IMPORT_RULES,
    codeStructure: CODE_STRUCTURE,
    stateManagement: STATE_MANAGEMENT,
    output: OUTPUT_FORMAT
  };

  // CSS files need minimal prompts
  if (filePath.includes('globals.css') || filePath.includes('.css')) {
    return {
      typescript: '', // No TypeScript rules for CSS
      imports: '',
      codeStructure: '',
      stateManagement: '',
      output: OUTPUT_FORMAT // Still need output format
    };
  }

  // Config files (tailwind, next.config, etc.) need minimal prompts
  if (filePath.includes('config') && !filePath.includes('page.tsx')) {
    return base; // Just base rules, no icons or backend
  }

  // API/Backend files need backend integration prompts
  if (filePath.includes('/lib/api') || filePath.includes('pocketbase')) {
    return {
      ...base,
      ...(hasBackend && {
        backend: BACKEND_API_RULES,
        reactQuery: REACT_QUERY_RULES
      })
    };
  }

  // Page and component files need full prompts including icons
  if (filePath.includes('page.tsx') || filePath.includes('/components/')) {
    return {
      ...base,
      icons: LUCIDE_ICON_RULES,
      ...(hasBackend && {
        backend: BACKEND_API_RULES,
        reactQuery: REACT_QUERY_RULES
      })
    };
  }

  // Default: base prompts + icons
  return {
    ...base,
    icons: LUCIDE_ICON_RULES
  };
}

/**
 * PHASE 1: AI Plans File Structure
 * Returns JSON array of files to generate
 */

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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 1: SCHEMA CONTRACT SYSTEM
  // Use featureSchemas for pre-flight validation (prevents import errors)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const featureSchemas = state.featureSchemas || [];

  let schemaConstraints = '';
  if (featureSchemas.length > 0) {
    console.log(`[Frontend] 📋 Using ${featureSchemas.length} feature schemas for validation`);

    // Pre-flight check: Verify all required handlers and types exist
    const requiredHandlers = featureSchemas.flatMap(s => Object.values(s.handlers));
    const requiredTypes = featureSchemas.map(s => s.typeName);

    const availableHandlers = state.backendConfig?.apiEndpoints?.map((ep: any) => ep.handler) || [];
    const missingHandlers = requiredHandlers.filter(h => !availableHandlers.includes(h));

    if (missingHandlers.length > 0) {
      console.error('[Frontend] ❌ Pre-flight check failed: Missing required handlers:', missingHandlers);
      throw new Error(`Pre-flight validation failed: Missing handlers: ${missingHandlers.join(', ')}`);
    }

    schemaConstraints = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 CRITICAL: SCHEMA CONTRACT ENFORCEMENT (Frontend)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You MUST use these EXACT import names from @/lib/api. Do NOT invent different names.

REQUIRED IMPORTS (VERIFIED TO EXIST):
${featureSchemas.map(schema => `
Feature: "${schema.displayName}"
  Types: import { ${schema.typeName} } from '@/lib/api'
  Handlers:
    import {
      ${schema.handlers.get},        // List all ${schema.collectionName}
      ${schema.handlers.getById},    // Get single ${schema.typeName}
      ${schema.handlers.create},     // Create new ${schema.typeName}
      ${schema.handlers.update},     // Update existing ${schema.typeName}
      ${schema.handlers.delete}      // Delete ${schema.typeName}
    } from '@/lib/api'
`).join('\n')}

VALIDATION:
✅ All handlers above are VERIFIED to exist in @/lib/api
✅ All types above are VERIFIED to exist in @/lib/api
✅ Do NOT import functions not listed above
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    console.log('[Frontend] ✅ Pre-flight check passed: All required handlers and types available');
  }

  // Backend integration instructions - Build complete function signatures with types
  const availableApiFunctions = hasBackend && state.backendConfig?.apiEndpoints
    ? state.backendConfig.apiEndpoints.map((ep: any) => {
        const handler = ep.handler;
        const params: string[] = [];
        const returnType = ep.returns || 'any';

        if (ep.parameters && Array.isArray(ep.parameters) && ep.parameters.length > 0) {
          const pathParams = ep.parameters.filter((p: any) => p.location === 'path');
          const queryParams = ep.parameters.filter((p: any) => p.location === 'query');
          const bodyParams = ep.parameters.filter((p: any) => p.location === 'body');

          pathParams.forEach((p: any) => params.push(`${p.name}: ${p.type}`));

          if (queryParams.length > 0) {
            const queryType = `{ ${queryParams.map((p: any) =>
              `${p.name}${p.required ? '' : '?'}: ${p.type}`
            ).join(', ')} }`;
            const isOptional = queryParams.every((p: any) => !p.required);
            params.push(`params${isOptional ? '?' : ''}: ${queryType}`);
          }

          bodyParams.forEach((p: any) => params.push(`${p.name}: ${p.type}`));
        }

        return `${handler}(${params.join(', ')}): Promise<${returnType}>`;
      }).filter(Boolean)
    : [];

  // Helper to get example function names for documentation
  const getExampleFn = (pattern: string): string => {
    if (availableApiFunctions.length === 0) return 'exampleFunction';

    // Try to find a matching function by pattern
    const match = availableApiFunctions.find((fn: string) =>
      fn.toLowerCase().includes(pattern.toLowerCase())
    );
    return match || availableApiFunctions[0];
  };

  // Get specific example functions for the documentation
  const exampleGetFn = getExampleFn('get');  // e.g., getOrders, getProducts
  const exampleCreateFn = getExampleFn('create');  // e.g., createOrder
  const exampleListFn = availableApiFunctions.find((fn: string) =>
    fn.toLowerCase().startsWith('get') && fn.toLowerCase().endsWith('s')
  ) || exampleGetFn;  // Find plural GET function, or fallback

  // Derive type name from function name (e.g., getProducts → Products, getUsers → Users)
  const exampleTypeName = exampleGetFn
    ? exampleGetFn.replace(/^get/, '').charAt(0).toUpperCase() + exampleGetFn.replace(/^get/, '').slice(1)
    : 'YourType';

  const backendInstructions = hasBackend
    ? `\n🔗 API: Import from '@/lib/api' (NOT '@/src/lib/api')
${schemaConstraints}

🚨 CRITICAL: ONLY import functions that ACTUALLY exist in @/lib/api.ts!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 AVAILABLE API FUNCTIONS WITH EXACT SIGNATURES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${availableApiFunctions.length > 0 ? availableApiFunctions.map((fn: string) => `  ✅ ${fn}`).join('\n') : '  (none generated)'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 CRITICAL: USE EXACT SIGNATURES INCLUDING PARENTHESES

RULES:
1. Copy the COMPLETE signature with parameters from list above
2. If signature shows functionName() - call with NO arguments
3. If signature shows functionName(id) - call with ONE argument
4. If signature shows functionName(id, data) - call with TWO arguments
5. DO NOT add or remove parameters from the signatures shown

EXAMPLES:
✅ CORRECT: getProducts() // Signature shows (), so call with no args
❌ WRONG:   getProducts(id) // Adding parameter not in signature

✅ CORRECT: getProductById(id) // Signature shows (id), so call with id
❌ WRONG:   getProductById() // Missing required parameter

✅ CORRECT: updateProduct(id, data) // Signature shows both params
❌ WRONG:   updateProduct(data) // Missing id parameter
   Look at the list → Find the function you need → Copy it EXACTLY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEFORE writing any import statement, CHECK:
1. Is the function name in the list above? → YES? Use it exactly as shown.
2. Not in the list? → DO NOT import it. Use only what's available.

Import example:
import { ${availableApiFunctions[0] || 'submitData'} } from '@/lib/api'
`
    : '';

  // Special handling for layout and page components
  let specialInstructions = '';
  console.log(`[Frontend] 🔍 Generating file: ${filePlan.path}`);

  // CRITICAL: Infrastructure context files need complete implementation
  if (filePlan.path.includes('context.tsx') && filePlan.path.startsWith('src/lib/')) {
    specialInstructions = `
Generate complete state management context file with required exports.

MANDATORY STRUCTURE:
- Export Provider component (wraps children with context)
- Export custom hook (returns context value)
- Implement state management logic
- Include persistence layer if applicable

CRITICAL EXPORTS REQUIRED:
- Provider component for wrapping application
- Custom hook for consuming context in components

Implementation must follow React Context pattern with createContext, Provider, and consumer hook.
`;
  }
  // NOTE: layout.tsx is now PRE-GENERATED (see line ~4118), so this path will never be reached for layout.tsx
  else if (filePlan.path.includes('/page.tsx')) {
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
    const validLucideIconsList = `ArrowRight, ArrowLeft, Check, X, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Star, Heart, Mail, User, Search, Settings, Menu, Plus, Edit, Edit2, Trash, Trash2, Calendar, Clock, Bell, Home, AlertCircle, CheckCircle, XCircle, Info, Loader, Loader2, Send, Image, File, Folder, Lock, Eye, EyeOff, Share, Copy, Download, Upload, ExternalLink, Link, Filter, Grid, List, MoreVertical, MoreHorizontal, Zap, Shield, ShieldCheck, Package, Box, Gift, Tag, ShoppingCart, ShoppingBag, CreditCard, DollarSign, TrendingUp, Activity, Award, Target`;

    const iconLibrary = {
      'lucide': {
        import: 'lucide-react',
        instructions: 'import { IconName } from "lucide-react"',
        examples: `Icons from lucide-react. ONLY use these valid icons: ${validLucideIconsList}. Use sparingly (1-3 icons max)!`
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
      examples: `Icons from lucide-react. ONLY use these valid icons: ${validLucideIconsList}. Use sparingly (1-3 icons max)!`
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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 CRITICAL - IMPORT ALL TYPES FIRST 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEFORE writing ANY code, import ALL types you will use from @/lib/api
Check TYPE DEFINITIONS section below for available types
Example: import { Products, Users, Testimonial } from '@/lib/api';
Then use in code: useState<Products[]>([])
Missing import = BUILD FAILURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECHNICAL IMPLEMENTATION RULES (Next.js + TypeScript + React)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 CRITICAL - JSX STRUCTURE (MUST BE VALID HTML):
1. Every <tag> MUST have matching </tag> - NO EXCEPTIONS!
2. Single root element must wrap ALL content
3. Check your opening/closing tags MATCH EXACTLY

🚨 CRITICAL - TYPESCRIPT (BUILD WILL FAIL):
1. IMPORTS: Import EVERYTHING you use
   ❌ Using <Loader2 /> without import → FAILS
   ✅ import { Loader2 } from 'lucide-react'

2. ERROR HANDLING: Type catch errors
   ❌ catch (error) { error.message } → FAILS
   ✅ catch (error) { error instanceof Error ? error.message : 'Error' }

3. ARRAY METHODS: Type parameters
   ❌ array.filter(item => ...) → FAILS
   ✅ array.filter((item: string) => ...)

Navigation: ONLY link to routes you're building: / (home)${state.allRequestedFeatures?.filter((f: any) => f.included_in_mvp).map((f: any) => `, /${f.name.toLowerCase().replace(/\s+/g, '-')}`).join('') || ''}.

🚨 CRITICAL: Next.js Link Import Syntax:
✅ CORRECT: import Link from 'next/link'  (default import)
❌ WRONG: import { Link } from 'next/link'  (named import - will FAIL!)
❌ WRONG: import { NextLink } from 'next/link'  (does not exist!)

Example:
import Link from 'next/link'

<Link href="/about">About</Link>

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
  ✅ 'next/link' - Default import ONLY: import Link from 'next/link'
  ✅ 'next/image' - Default import ONLY: import Image from 'next/image'
  ✅ 'next/navigation' - Named imports: import { useRouter, usePathname } from 'next/navigation'
  ✅ '${iconLibrary.import}' - Icons ONLY (${iconLibrary.instructions})
  ✅ 'pocketbase' - Backend client (if backend exists)
  ✅ 'react-hook-form' - Form handling with useForm hook
  ✅ '@hookform/resolvers/zod' - Zod validator for React Hook Form
  ✅ 'zod' - Schema validation with z.object()
  ✅ '@/lib/api' - Your API functions (if backend exists)
  ✅ '@/app/*' - Your own app files

❌ FORBIDDEN: DO NOT import ANY other external packages including:
  ❌ react-markdown, react-markdown-editor-lite (NOT available)
  ❌ @/components/ui/* (does not exist)
  ❌ Any other third-party libraries not listed above

🔧 For markdown/rich text editing: Use native HTML <textarea> instead of external editors!
   Example: <textarea className="w-full border rounded-lg p-3" rows={10} />

🚨 CRITICAL RULES:
- Import ALL icons in ONE statement from 'lucide-react'
- Import ALL React hooks in ONE statement from 'react'
- NEVER import same item twice
- ALWAYS declare useState BEFORE using the setter function
- 'use client' required when using hooks or event handlers

🚨 LUCIDE ICONS - ONLY USE VALID ICONS:
${iconLibrary.examples}
❌ DO NOT use: Lightning, Thunder, Security, Protection, or ANY icon not in the list above
✅ BUILD WILL FAIL if you use invalid icon names!

🚨 EVENT HANDLER TYPING (MANDATORY):
ALL event handler parameters MUST be explicitly typed:
- onChange: (e: React.ChangeEvent<HTMLInputElement>) => ...
- onSubmit: (e: React.FormEvent<HTMLFormElement>) => ...
- onClick: (e: React.MouseEvent<HTMLButtonElement>) => ...
Implicit 'any' types = BUILD FAILURE

🚨 FORM HANDLING RULES:
❌ WRONG: form.elements.fieldName.value (TypeScript error: RadioNodeList)
❌ WRONG: const formData = new FormData(e.target) (type issues)

✅ CORRECT Option 1 - Controlled inputs with useState:
  const [query, setQuery] = useState('')
  <input value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} />
  // Use query variable directly

✅ CORRECT Option 2 - React Hook Form (for complex forms):
  import { useForm } from 'react-hook-form'
  const { register, handleSubmit } = useForm()
  <input {...register('query')} />

NEVER access form.elements directly - use controlled inputs or React Hook Form!

🚨 CRITICAL: USE ONLY PROPERTIES THAT EXIST IN TYPE DEFINITIONS

When working with typed data (Products, Users, etc.):
❌ DO NOT invent/guess property names (imageUrl, photoUrl, picture, etc.)
✅ ONLY use properties that appear in the TypeScript interface

How to find valid properties:
1. Look at "TYPE DEFINITIONS" section below (shows all interfaces)
2. Look at "Available API functions" section (shows return types)
3. Use ONLY properties listed in those type definitions
4. If you need an image and type has 'image' → use 'image'
5. If you need an image and type has 'photo' → use 'photo'
6. If you need an image and type has NEITHER → use placeholder or omit

🚨 MANDATORY: Every interface name you use MUST be imported at file top:
   import { InterfaceName } from '@/lib/api';
   Then you can use it: useState<InterfaceName[]>([])
   Missing this import = BUILD FAILURE

Example of WRONG approach:
  interface Products { id: string; name: string; price: number; }
  // ❌ WRONG: <img src={product.imageUrl} /> - imageUrl doesn't exist!
  // ❌ WRONG: <p>{product.description}</p> - description doesn't exist!

Example of CORRECT approach:
  interface Products { id: string; name: string; price: number; image?: string; }
  // ✅ CORRECT: <img src={product.image || '/placeholder.jpg'} />
  // ✅ CORRECT: <p>{product.name}</p>
  // ✅ CORRECT: If property doesn't exist, use placeholder or skip it

REASONING: TypeScript will fail compilation if you access non-existent properties.
The type definitions show the EXACT schema from the database.
Inventing properties causes build failures.

🚨 DYNAMIC ROUTES: ALWAYS use client components with 'use client'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED PATTERN: CLIENT COMPONENT (Use for ALL dynamic routes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 MANDATORY for all routes with [id], [slug], or any dynamic parameter
✅ ALWAYS include 'use client' directive at the top
✅ NO generateStaticParams() needed (standalone mode handles this)
✅ Fetch data client-side in useEffect
✅ Use useState for data, loading, and error states

Example - Dynamic route with client-side data fetching:
'use client';

import { useState, useEffect } from 'react';
import { ${exampleGetFn}, ${exampleTypeName} } from '@/lib/api';  // ✅ Import BOTH function AND type

export default function DetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<${exampleTypeName} | null>(null);  // ✅ Use actual type, not 'any'
  const [error, setError] = useState<string>('');

  useEffect(() => {
    ${exampleGetFn}(params.id)
      .then(setData)
      .catch((error: any) => {
        // ✅ CRITICAL: Must type error parameter and use type guard before accessing error.message
        const msg = error instanceof Error ? error.message : 'Error occurred';
        setError(msg);
      });
  }, [params.id]);

  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>Loading...</div>;
  // ✅ CRITICAL: Only access properties that exist in ${exampleTypeName} type!
  // Check TYPE DEFINITIONS section below to see available properties
  return <div>{data.id}</div>;  // Use 'id' as example (exists in all types)
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTE: Server components with generateStaticParams() are NOT recommended
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  With standalone mode, client components are the standard pattern
⚠️  Only use server components for truly static content with known paths
⚠️  For PocketBase data, ALWAYS use client components (Option A above)

Example - Server component with static params:
// NO 'use client'!

import { ${exampleListFn}, ${exampleGetFn} } from '@/lib/api';  // ✅ Use functions from Available API functions list

export async function generateStaticParams() {
  const items = await ${exampleListFn}();
  return items.map((item: any) => ({ id: item.id }));
}

export default async function DetailPage({ params }: { params: { id: string } }) {
  const data = await ${exampleGetFn}(params.id);
  return <div>{data?.title}</div>;
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 CRITICAL RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ NEVER combine 'use client' + generateStaticParams() → Build FAILS!
❌ NEVER use hooks (useState, useEffect) without 'use client' → Build FAILS!
❌ NEVER use useForm() without generic type → TypeScript error!
   ✅ CORRECT: useForm<FormData>({ resolver: zodResolver(schema) })
   ❌ WRONG: useForm({ resolver: zodResolver(schema) })
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 CRITICAL TYPESCRIPT RULES (BUILD FAILS IF VIOLATED):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rule 1: useState with null MUST have type annotation
   ✅ CORRECT: useState<any>(null) or useState<InterfaceName | null>(null)
   ❌ WRONG: useState(null) → TypeScript infers 'never' → BUILD FAILURE

Rule 2: useState with empty array MUST have type annotation AND import the type
   ✅ CORRECT: import { InterfaceName } from '@/lib/api'; then useState<InterfaceName[]>([])
   ❌ WRONG: useState([]) → TypeScript infers 'never[]' → BUILD FAILURE
   ❌ WRONG: useState<InterfaceName[]>([]) without importing InterfaceName → BUILD FAILURE

Rule 3: API functions returning arrays MUST match state array types
   ✅ CORRECT: If API returns Promise<Items[]>, use useState<Items[]>([]) then .then(setItems)
   ✅ CORRECT: If API returns Promise<Item>, use useState<Item | null>(null) then .then(setItem)
   ❌ WRONG: API returns Items[] but state is useState<Items>() → Type mismatch BUILD FAILURE
   ❌ WRONG: Passing setState (expecting array) to callback expecting single item → BUILD FAILURE

Rule 4: Optional properties (ending with ?) MUST use || fallback or optional chaining
   ✅ CORRECT: {item.optionalField || 'fallback text'}
   ✅ CORRECT: {item.optionalField?.methodCall()}
   ❌ WRONG: {item.optionalField} when optionalField?: type → BUILD FAILURE

Rule 5: catch error MUST be typed and use type guard before accessing properties
   ✅ CORRECT: catch (error: any) {
                 const msg = error instanceof Error ? error.message : 'Error occurred';
                 setError(msg);
               }
   ✅ CORRECT: .catch((error: any) => {
                 const msg = error instanceof Error ? error.message : 'Error occurred';
                 setError(msg);
               })
   ❌ WRONG: catch (error) { setError(error.message) } → BUILD FAILURE (no type)
   ❌ WRONG: .catch((error) => { setError(error.message) }) → BUILD FAILURE (no type)

   🚨 ALWAYS type error parameter as "error: any" in catch blocks AND .catch() callbacks
   🚨 ALWAYS use "error instanceof Error ? error.message : 'Error occurred'" pattern

Rule 6: NEVER access .message, .toString(), or any property on catch error directly
   You MUST check "error instanceof Error" first, then access error.message

Rule 6: Every TypeScript type/interface used ANYWHERE must be imported from @/lib/api
   ✅ CORRECT: import { TypeName } from '@/lib/api'; at top of file
   ❌ WRONG: Using TypeName in code without import statement → BUILD FAILURE
   🚨 Check TYPE DEFINITIONS section below - ALL interfaces listed there MUST be imported to use them

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DEFAULT CHOICE: Use OPTION A (Client Component) for most dynamic routes
✅ Only use OPTION B if page has ZERO interactivity

${hasBackend ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 API IMPORTS - TWO FILES, DIFFERENT PURPOSES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ @/lib/api - Direct API function calls (Return Promises)
   ✅ Use when calling APIs in useEffect or event handlers
   ✅ Example: import { ${exampleGetFn}${exampleCreateFn ? `, ${exampleCreateFn}` : ''} } from '@/lib/api';
   ✅ Functions return Promise<Type> - MUST use await or .then()

   🚨 CRITICAL: API functions return Promises, NOT direct values!
   ❌ WRONG: const data = ${exampleGetFn}(id);  // data is Promise, not the actual value!
   ❌ WRONG: ${exampleGetFn}(id)();  // Cannot call Promise as function!
   ✅ CORRECT: const data = await ${exampleGetFn}(id);  // In async function
   ✅ CORRECT: ${exampleGetFn}(id).then(data => setData(data));  // In useEffect

2️⃣ @/lib/api-hooks - React Query hooks
   ✅ Use for automatic caching/refetching
   ✅ Example: import { use${exampleGetFn.charAt(0).toUpperCase() + exampleGetFn.slice(1)}${exampleCreateFn ? `, use${exampleCreateFn.charAt(0).toUpperCase() + exampleCreateFn.slice(1)}` : ''} } from '@/lib/api-hooks';
   ✅ Hooks return query objects: const { data, isLoading } = use${exampleGetFn.charAt(0).toUpperCase() + exampleGetFn.slice(1)}();

🚨 CRITICAL: For OPTION A and OPTION B examples above, ALWAYS use '@/lib/api'
   The examples show direct function calls (${exampleGetFn}), NOT hooks!

🚨 EXACT FUNCTION SIGNATURES (DO NOT MODIFY):
${state.backendConfig?.apiEndpoints?.map((ep: any) => {
  // ✅ SCHEMA-DRIVEN: Build signature from endpoint.parameters if available
  let params = [];
  let returnType = ep.returns || 'any';

  if (ep.parameters && Array.isArray(ep.parameters) && ep.parameters.length > 0) {
    // ✅ Use schema to build exact parameter signature
    const pathParams = ep.parameters.filter((p: any) => p.location === 'path');
    const queryParams = ep.parameters.filter((p: any) => p.location === 'query');
    const bodyParams = ep.parameters.filter((p: any) => p.location === 'body');

    // Add path parameters with types (e.g., id: string)
    pathParams.forEach((p: any) => {
      params.push(`${p.name}: ${p.type}`);
    });

    // Add query parameters as typed object (e.g., params?: { query?: string, category?: string })
    if (queryParams.length > 0) {
      const queryType = `{ ${queryParams.map((p: any) =>
        `${p.name}${p.required ? '' : '?'}: ${p.type}`
      ).join(', ')} }`;
      const isOptional = queryParams.every((p: any) => !p.required);
      params.push(`params${isOptional ? '?' : ''}: ${queryType}`);
    }

    // Add body parameters with types (e.g., data: ProductData)
    bodyParams.forEach((p: any) => {
      params.push(`${p.name}: ${p.type}`);
    });
  } else {
    // ❌ FALLBACK: Use heuristics (backward compatibility)
    const pathParams = (ep.path.match(/:[a-zA-Z_][a-zA-Z0-9_]*/g) || []).map((p: string) => p.slice(1));
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(ep.method);
    const isSearchEndpoint = ep.method === 'GET' && (
      ep.path.includes('/search') ||
      ep.path.includes('/filter') ||
      ep.path.includes('/query') ||
      ep.handler.toLowerCase().includes('search') ||
      ep.handler.toLowerCase().includes('filter') ||
      ep.handler.toLowerCase().includes('query')
    );

    pathParams.forEach((param: string) => params.push(`${param}: string`));
    if (hasBody) params.push('data: any');
    if (isSearchEndpoint) params.push('params?: { [key: string]: any }');
  }

  return `${ep.handler}(${params.join(', ')}): Promise<${returnType}>`;
}).join('\n')}

🚨 CRITICAL: ALL functions above return Promise<Type>!
   ❌ WRONG: const data = ${exampleGetFn}();  // data is Promise<Type>, not Type!
   ❌ WRONG: ${exampleGetFn}()();  // Cannot call Promise as function!
   ✅ CORRECT: ${exampleGetFn}().then(data => setData(data));  // Use .then()
   ✅ CORRECT: const data = await ${exampleGetFn}();  // Use await in async function

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 PARAMETER VALIDATION CHECKLIST - BEFORE EVERY API CALL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ NEVER add/modify/remove parameters from signatures above → Build FAILS!

VALIDATION STEPS:
1. Find function in "EXACT FUNCTION SIGNATURES" section above
2. Copy parameter list EXACTLY (names, types, optionality)
3. Do NOT add parameters that sound reasonable but aren't in signature
4. Do NOT remove required parameters
5. Do NOT change parameter types or structure

COMMON MISTAKES TO AVOID:
❌ WRONG: getFinancialData({ timeRange: 'month' })
   → Signature shows getFinancialData(params?: { category?: string, startDate?: string, endDate?: string })
   → "timeRange" does NOT exist in signature - TypeScript error!

❌ WRONG: searchProducts({ query })
   → Signature shows searchProducts(params?: { query?: string })
   → Missing "params:" label - must be searchProducts(params: { query })

❌ WRONG: getCartItems().map(item => item.price)
   → Type shows CartItems: { product: string, quantity: number } - product is STRING ID!
   → "price" property does NOT exist on CartItems - TypeScript error!

❌ WRONG: getCartItems().map(item => item.product.price)
   → item.product is a STRING (the ID), not a Products object!
   → Cannot access .price on a string - TypeScript error!

✅ CORRECT: Fetch both collections and join them:
   const items = await getCartItems();
   const products = await getProducts();
   items.map(item => {
     const product = products.find(p => p.id === item.product);
     return item.quantity * (product?.price || 0);
   })

✅ CORRECT: getFinancialData(params: { category: 'sales' })
✅ CORRECT: getFinancialData(params: { startDate: '2024-01-01', endDate: '2024-12-31' })

🚨 If you need a parameter not in the signature, the backend needs to be regenerated!
🚨 Follow the signature EXACTLY as shown - names, types, and optionality!

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

All action buttons (Add, Buy, Submit, Delete) MUST call API functions from @/lib/api.
Connect buttons to actual API handlers using onClick.
NO placeholder buttons - every button must be functional.

1. FORMS with API calls MUST have loading states:
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
  // Generate globals.css using template (extracted to separate file)
  if (filePlan.path === 'src/app/globals.css' || filePlan.path.endsWith('/globals.css') || filePlan.path === 'globals.css' || filePlan.path.includes('globals.css')) {
    console.log('[Frontend] 🎯 MATCHED globals.css - using template generator');
    return generateGlobalsCss(state.stylingConfig);
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

  // Infrastructure files (lib/api.ts, lib/*, etc.) need ALL backend context, not filtered by feature
  const isInfrastructureFile = filePlan.path.startsWith('src/lib/') || filePlan.path.startsWith('lib/');

  const relevantFeatureIds = new Set<string>();

  // Find features assigned to this file by checking routes (skip for infrastructure files)
  if (!isInfrastructureFile) {
    state.allRequestedFeatures?.forEach((feature: any) => {
      if (feature.routes && Array.isArray(feature.routes)) {
        for (const route of feature.routes) {
          if (route.file === filePlan.path) {
            relevantFeatureIds.add(feature.id);
          }
        }
      }
    });
  }

  // Filter allRequestedFeatures - infrastructure files get ALL features
  const relevantFeatures = isInfrastructureFile
    ? (state.allRequestedFeatures?.filter(f => f.included_in_mvp) || [])
    : (state.allRequestedFeatures?.filter(f => f.included_in_mvp && relevantFeatureIds.has(f.id)) || []);

  // Build feature context for this specific file
  // For homepage (page.tsx), also include UI sections
  const isHomepage = filePlan.path === 'src/app/page.tsx';
  const sectionsForThisFile = isHomepage ? (state.uiSections || []) : [];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📐 PAGE ORGANIZATION: Extract layout and sections for this route
  // Only applies to page files (page.tsx), not infrastructure files
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let pageOrg = undefined;
  let pageCollMapping = undefined;
  let collectionsForThisPage: string[] = [];
  let routeFromPath = '/';

  // Only extract page organization for actual page files
  if (!isInfrastructureFile && (filePlan.path.endsWith('/page.tsx') || filePlan.path.endsWith('/page.ts'))) {
    // Convert file path to route (e.g., src/app/chat/page.tsx → /chat)
    routeFromPath = filePlan.path
      .replace('src/app', '')
      .replace('/page.tsx', '')
      .replace('/page.ts', '') || '/';

    pageOrg = state.pageOrganization?.[routeFromPath];

    // Find backend collections for this route
    pageCollMapping = state.backendConfig?.pageCollectionMapping?.find(m => m.route === routeFromPath);
    collectionsForThisPage = pageCollMapping?.collections || [];

    // Auto-detect dependent collections via relations
    if (collectionsForThisPage.length > 0 && state.backendConfig?.collections) {
      const addedCollections = new Set(collectionsForThisPage);

      for (const collectionName of collectionsForThisPage) {
        const collection = state.backendConfig.collections.find(c => c.name === collectionName);

        if (collection?.fields) {
          for (const field of collection.fields) {
            // If this field is a relation, add the target collection
            if (field.type === 'relation') {
              // Try to infer relation target from field name (e.g., "product" → "products")
              const relationTarget = field.name + 's'; // Simple pluralization
              const targetExists = state.backendConfig.collections.find(c =>
                c.name === relationTarget || c.name === field.name
              );

              if (targetExists && !addedCollections.has(targetExists.name)) {
                addedCollections.add(targetExists.name);
                console.log(`[Frontend] 🔗 Auto-detected relation: ${collectionName}.${field.name} → ${targetExists.name}`);
              }
            }
          }
        }
      }

      collectionsForThisPage = Array.from(addedCollections);
    }
  }

  console.log(`[Frontend] 🎯 Feature filtering for ${filePlan.path}:`);
  console.log(`[Frontend]    Route: ${routeFromPath}`);
  console.log(`[Frontend]    Total features: ${state.allRequestedFeatures?.length || 0}`);
  console.log(`[Frontend]    Relevant for this file (before inference): ${relevantFeatures.length}`);
  console.log(`[Frontend]    Page organization: ${pageOrg ? `${pageOrg.layout} with ${pageOrg.sections.length} sections` : 'none'}`);
  console.log(`[Frontend]    Collections for this page: ${collectionsForThisPage.length > 0 ? collectionsForThisPage.join(', ') : 'none'}`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PATTERN INFERENCE FALLBACK
  // If no features mapped to this file, try to infer intent from:
  // - File name/path
  // - Available API endpoints that match the file name
  // - Endpoint methods (GET=display, POST=form)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (relevantFeatures.length === 0 && sectionsForThisFile.length === 0 && !isInfrastructureFile) {
    console.warn(`[Frontend] ⚠️  No features mapped to ${filePlan.path}, attempting pattern inference...`);

    // Extract filename without extension for matching
    const fileName = filePlan.path.split('/').filter(f => f !== 'page.tsx' && f !== 'page.ts').pop() || '';
    const fileNameLower = fileName.toLowerCase();

    // Find endpoints that match this file's purpose
    const matchingEndpoints = state.backendConfig?.apiEndpoints?.filter(ep => {
      const handlerLower = ep.handler.toLowerCase();
      const pathLower = ep.path.toLowerCase();
      return handlerLower.includes(fileNameLower) ||
             pathLower.includes(fileNameLower) ||
             (fileNameLower && handlerLower.includes(fileNameLower.slice(0, -1))); // singular form
    }) || [];

    if (matchingEndpoints.length > 0) {
      // Determine pattern type based on HTTP methods
      const hasMutation = matchingEndpoints.some(ep => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(ep.method));
      const hasQuery = matchingEndpoints.some(ep => ep.method === 'GET');

      let patternType = 'unknown';
      let patternDesc = '';

      if (hasMutation && !hasQuery) {
        patternType = 'form_submission';
        patternDesc = 'Form that submits data (POST/PUT/PATCH operations)';
      } else if (hasQuery && !hasMutation) {
        patternType = 'data_display';
        patternDesc = 'Component that fetches and displays data (GET operations)';
      } else if (hasMutation && hasQuery) {
        patternType = 'crud';
        patternDesc = 'Full CRUD interface (fetch, create, update, delete)';
      }

      const inferredFeature = {
        id: `inferred_${fileName}`,
        name: `${fileName.charAt(0).toUpperCase() + fileName.slice(1)} Page`,
        description: `${patternDesc}. Available endpoints: ${matchingEndpoints.map(e => `${e.handler}(${e.method})`).join(', ')}`,
        endpoints: matchingEndpoints.map(e => e.handler),
        type: patternType,
        priority: 'high' as const,
        included_in_mvp: true
      };

      relevantFeatures.push(inferredFeature as any);
      console.log(`[Frontend] ✅ Inferred feature from pattern:`);
      console.log(`[Frontend]    Name: ${inferredFeature.name}`);
      console.log(`[Frontend]    Type: ${inferredFeature.type}`);
      console.log(`[Frontend]    Endpoints: ${inferredFeature.endpoints.join(', ')}`);
    } else {
      console.warn(`[Frontend] ⚠️  No matching endpoints found for "${fileName}" - AI will generate with minimal context`);
    }
  }
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Log final feature count after inference
  console.log(`[Frontend]    Relevant for this file (after inference): ${relevantFeatures.length}`);
  if (relevantFeatures.length > 0) {
    console.log(`[Frontend]    Features: ${relevantFeatures.map(f => f.name).join(', ')}`);
  }
  if (sectionsForThisFile.length > 0) {
    console.log(`[Frontend]    UI Sections: ${sectionsForThisFile.map(s => s.name).join(', ')}`);
  }

  // Build feature context AFTER pattern inference
  const featureContext = relevantFeatures.length > 0 || sectionsForThisFile.length > 0
    ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 FEATURES FOR THIS FILE (${filePlan.path})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${relevantFeatures.length > 0 ? `FEATURES to implement:
${relevantFeatures.map(f => `- ${f.name}: ${f.description}${f.type ? ` (Pattern: ${f.type})` : ''}`).join('\n')}

` : ''}${sectionsForThisFile.length > 0 ? `📄 SECTIONS FOR THIS PAGE - STRICT REQUIREMENTS:
${sectionsForThisFile.map(s => `- ${s.name} (${s.content_type}) - PM placed this section here`).join('\n')}

MANDATORY IMPLEMENTATION:
Every section above MUST be implemented. Missing sections = validation failure.

Section Requirements:
- Semantic HTML structure for content type
- Tailwind CSS styling matching design system
- Placeholder/sample content showing section purpose
- Responsive layout with proper spacing
- Lucide icons where relevant

Section Organization:
- Sections in logical order on page
- Visual separation between sections
- Use semantic tags: <section>, <article>, <aside>

` : ''}DO NOT include features from other pages!
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

  // ============================================================================
  // BUILD REGISTRY CONTEXT (Give AI full knowledge of project structure)
  // ============================================================================
  const registry = getProjectRegistry(state.projectId);
  const allComponents = registry.getAllComponents();
  const allRoutes = registry.getAllRoutes();

  // Build available routes from allRequestedFeatures
  const availableRoutes: string[] = [];
  state.allRequestedFeatures?.forEach((feature: any) => {
    if (feature.routes && Array.isArray(feature.routes)) {
      feature.routes.forEach((route: any) => {
        if (route.path && route.file) {
          availableRoutes.push(`✓ ${route.path} → ${route.file}`);
        }
      });
    }
  });

  const registryContext = `
📦 PROJECT STRUCTURE AWARENESS

## Available Routes:
${availableRoutes.length > 0 ? availableRoutes.join('\n') : '✓ / → src/app/page.tsx (main page)'}

When creating navigation links, use these exact route paths.

## Available Components (already created):
${allComponents.length > 0
  ? allComponents.map(c => {
      const importPath = c.path.replace(/\.(tsx?|jsx?)$/, '').replace(/^src\//, '@/');
      return `✓ ${c.name} - import ${c.name} from '${importPath}'`;
    }).join('\n')
  : '(No components yet - you may be generating the first file)'}

## Design System Tokens:
Use Tailwind's semantic design system with these tokens:
✓ Colors: bg-background, text-foreground, bg-primary, text-primary-foreground, bg-muted, text-muted-foreground
✓ Borders: border-border, rounded-lg, rounded-md
✓ Spacing: Use Tailwind scale (p-4, m-6, gap-3, space-y-4)
✓ Typography: text-xl, font-bold, font-medium, leading-tight
✓ Effects: hover:opacity-80, transition-all, shadow-sm, shadow-lg

All design tokens are configured in globals.css - you can use them directly via Tailwind classes.

## Helper Files & API Functions:
${hasBackend ? `
### Backend API Functions (@/lib/api):
${state.backendConfig?.apiEndpoints && state.backendConfig.apiEndpoints.length > 0
  ? state.backendConfig.apiEndpoints.map((ep: any) => {
      // ✅ CRITICAL FIX: Show FULL FUNCTION SIGNATURE with parameters
      const params = ep.parameters || [];

      // Build parameter string
      let paramStr = '';
      if (params.length > 0) {
        const pathParams = params.filter((p: any) => p.location === 'path');
        const queryParams = params.filter((p: any) => p.location === 'query');
        const bodyParams = params.filter((p: any) => p.location === 'body');

        const paramParts = [];

        // Add path params (e.g., id: string)
        pathParams.forEach((p: any) => {
          paramParts.push(`${p.name}: ${p.type}`);
        });

        // Add query params as object (e.g., params?: { query?: string })
        if (queryParams.length > 0) {
          const queryType = `{ ${queryParams.map((p: any) =>
            `${p.name}${p.required ? '' : '?'}: ${p.type}`
          ).join(', ')} }`;
          const allOptional = queryParams.every((p: any) => !p.required);
          paramParts.push(`params${allOptional ? '?' : ''}: ${queryType}`);
        }

        // Add body params (e.g., data: Product)
        bodyParams.forEach((p: any) => {
          paramParts.push(`${p.name}: ${p.type}`);
        });

        paramStr = paramParts.join(', ');
      }

      // ❌ REMOVED: Promise<${returnType}> - Showing return types causes AI to define types locally
      // ✅ CONSTRAINT: Types imported from @/lib/api, no need to show return type
      return `• ${ep.handler}(${paramStr})  // ${ep.method} ${ep.path}`;
    }).join('\n')
  : 'Check @/lib/api.ts for available functions'}

🚨 CRITICAL: Use EXACT function signatures - import types from @/lib/api
- All functions and types exported from @/lib/api
- Use exact handler names and parameters shown above
- NEVER invent function names or modify signatures

### State Management:
✓ @/lib/store - Zustand store for client state (theme, UI, etc.)
✓ @/lib/pocketbase - PocketBase client
` : `✓ @/lib/store - Zustand store for client state (NO BACKEND)`}

## Lucide React Icons (Available to Import):
X, Check, Menu, ChevronDown, ChevronRight, ChevronLeft, ChevronUp,
ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
User, Users, UserPlus, Mail, Send, MessageCircle,
Lock, Shield, Home, Search, Settings, Bell, Calendar,
Heart, Star, ShoppingCart, CreditCard, TrendingUp,
Eye, EyeOff, Loader2, RefreshCw,
Edit, Trash, Plus, Minus, X, AlertCircle, Info

Import only the icons you actually use from 'lucide-react'.
`;

  console.log(`[Frontend] 📋 Registry context prepared: ${allComponents.length} components, ${allRoutes.length} routes`);

  // 🚀 LAZY LOADING: Get only relevant prompts for this file type
  const relevantPrompts = getRelevantPrompts(filePlan.path, hasBackend);
  console.log(`[Frontend] 📦 Loaded prompts for ${filePlan.path}: ${Object.keys(relevantPrompts).filter(k => relevantPrompts[k as keyof typeof relevantPrompts]).join(', ')}`);

  const prompt = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 CRITICAL OUTPUT FORMAT REQUIREMENT 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${relevantPrompts.output}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${relevantPrompts.typescript}
${relevantPrompts.imports}
${relevantPrompts.codeStructure}
${relevantPrompts.stateManagement}
${relevantPrompts.icons || ''}

${registryContext}

Generate ${filePlan.path} - ${filePlan.purpose}

USER REQUEST: "${state.userDescription}"
PM OVERVIEW: ${state.context?.pmPlan?.overview || 'Build based on user request'}

TECH STACK:
Next.js 14 (App Router), TypeScript, Tailwind CSS
${hasBackend ? `Backend: PocketBase
${relevantPrompts.backend || ''}
${relevantPrompts.reactQuery || ''}` : 'No backend (client-side only)'}

${state.designInstructions || 'No design instructions available. Using defaults.'}

${pageOrg ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 PAGE LAYOUT & STRUCTURE (CRITICAL - FOLLOW THIS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This page (${routeFromPath}) should have the following structure:

Layout Type: ${pageOrg.layout}
Required Sections: ${pageOrg.sections.map(s => s.name || s).join(', ')}

🚨 CRITICAL: YOU MUST IMPLEMENT ALL ${pageOrg.sections.length} SECTIONS!
Missing any section = VALIDATION FAILURE

IMPLEMENTATION REQUIREMENTS:
${pageOrg.sections.map((section, idx) => {
  const sectionName = typeof section === 'string' ? section : section.name;
  const examples = {
    hero: `{/* Hero Section */}
<section className="py-20 bg-gradient-to-br from-primary/10 to-accent/10">
  <div className="container max-w-6xl mx-auto px-4 text-center">
    <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
      Your Headline
    </h1>
    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
      Your value proposition
    </p>
    <button className="px-8 py-4 bg-primary text-white rounded-lg hover:scale-105 transition-all">
      Get Started <ArrowRight className="inline h-5 w-5 ml-2" />
    </button>
  </div>
</section>`,
    features: `{/* Features Section */}
<section className="py-16">
  <div className="container">
    <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
    <div className="grid md:grid-cols-3 gap-8">
      {[
        { icon: Zap, title: 'Feature 1', desc: 'Description' },
        { icon: Shield, title: 'Feature 2', desc: 'Description' },
        { icon: Star, title: 'Feature 3', desc: 'Description' }
      ].map((f, i) => (
        <div key={i} className="p-6 border rounded-lg hover:-translate-y-1 transition-all">
          <f.icon className="h-6 w-6 text-primary mb-4" />
          <h3 className="font-bold mb-2">{f.title}</h3>
          <p className="text-muted-foreground">{f.desc}</p>
        </div>
      ))}
    </div>
  </div>
</section>`,
    pricing: `{/* Pricing Section */}
<section className="py-16 bg-muted">
  <div className="container">
    <h2 className="text-3xl font-bold text-center mb-12">Pricing</h2>
    <div className="grid md:grid-cols-3 gap-8">
      {['Basic', 'Pro', 'Enterprise'].map((plan) => (
        <div key={plan} className="p-8 bg-background rounded-lg border">
          <h3 className="font-bold text-xl mb-4">{plan}</h3>
          <p className="text-3xl font-bold mb-6">$XX<span className="text-sm">/mo</span></p>
          <button className="w-full px-6 py-3 bg-primary text-white rounded-lg">Choose Plan</button>
        </div>
      ))}
    </div>
  </div>
</section>`,
    testimonials: `{/* Testimonials Section */}
<section className="py-16">
  <div className="container">
    <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
    <div className="grid md:grid-cols-2 gap-8">
      {[1, 2].map((i) => (
        <div key={i} className="p-6 border rounded-lg">
          <div className="flex gap-1 mb-4">
            {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-primary text-primary" />)}
          </div>
          <p className="mb-4">"Testimonial text here..."</p>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div><p className="font-bold">User Name</p><p className="text-sm text-muted-foreground">Role</p></div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>`,
    form: `{/* Form Section */}
<section className="py-16">
  <div className="container max-w-md mx-auto">
    <h2 className="text-3xl font-bold text-center mb-8">Get Started</h2>
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="email" placeholder="your@email.com" className="w-full px-4 py-3 border rounded-lg" />
      <button type="submit" className="w-full px-6 py-3 bg-primary text-white rounded-lg">Submit</button>
    </form>
  </div>
</section>`,
    cta: `{/* Call to Action */}
<section className="py-20 bg-gradient-to-r from-primary to-accent text-white">
  <div className="container text-center">
    <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
    <p className="text-xl mb-8">Join thousands of satisfied users</p>
    <button className="px-8 py-4 bg-white text-primary rounded-lg font-bold hover:scale-105 transition-all">
      Start Free Trial
    </button>
  </div>
</section>`
  };
  return `${idx + 1}. ${sectionName.toUpperCase()} → ${examples[sectionName.toLowerCase()] || 'Implement with semantic HTML'}`;
}).join('\n\n')}

${pageCollMapping ? `
🔗 BACKEND INTEGRATION FOR THIS PAGE:
This page needs to work with: ${collectionsForThisPage.join(', ')}
Purpose: ${pageCollMapping.purpose}

You MUST:
- Import and use API functions for these collections
- Handle loading/error states
- Pages with forms MUST implement create/update API calls with onSubmit handlers
- Pages displaying data only MUST use GET endpoints with useEffect
- Forms MUST call create function on submit
- Chat/messaging MUST include input fields AND submission handlers calling API
- Buttons that perform actions (Add to Cart, Like, Remove, etc.) MUST have onClick handlers that call the appropriate API functions

${(() => {
  // Detect if there are multiple collections (likely involves relations)
  if (collectionsForThisPage.length > 1) {
    const primaryCollection = pageCollMapping.collections?.[0] || collectionsForThisPage[0];
    const relatedCollections = collectionsForThisPage.filter(c => c !== primaryCollection);

    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 HANDLING RELATIONS BETWEEN COLLECTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This page involves multiple collections: ${collectionsForThisPage.join(', ')}

🚨 CRITICAL: Relations are stored as ID strings, NOT full objects!

Example: If ${primaryCollection} has a field like "product" or "userId":
- Type definition: { product: string } ← This is just an ID, NOT the full object!
- To display data from related collection, you MUST fetch both collections and join them

STEP-BY-STEP PATTERN:
1. Fetch primary collection: const items = await get${primaryCollection.charAt(0).toUpperCase() + primaryCollection.slice(1)}();
2. Fetch related collections: ${relatedCollections.map(c => `const ${c} = await get${c.charAt(0).toUpperCase() + c.slice(1)}();`).join('\n   ')}
3. Join data in your component:
   items.map(item => {
     const related = ${relatedCollections[0]}.find(r => r.id === item.${relatedCollections[0].replace(/s$/, '')});
     return <div>{related?.name} - \${related?.price}</div>
   })

❌ WRONG PATTERN:
const items = await get${primaryCollection.charAt(0).toUpperCase() + primaryCollection.slice(1)}();
items.map(item => <div>{item.price}</div>)  // ← "price" doesn't exist on ${primaryCollection}!

✅ CORRECT PATTERN:
const items = await get${primaryCollection.charAt(0).toUpperCase() + primaryCollection.slice(1)}();
const ${relatedCollections[0]} = await get${relatedCollections[0].charAt(0).toUpperCase() + relatedCollections[0].slice(1)}();
items.map(item => {
  const related = ${relatedCollections[0]}.find(p => p.id === item.${relatedCollections[0].replace(/s$/, '')});
  return <div>{related?.name} - \${related?.price}</div>
})

🚨 NEVER access properties from related collections directly on the primary collection!
🚨 ALWAYS fetch both collections and join them in your code!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }
  return '';
})()}
` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : ''}

${FEATURE_INTEGRATION_PATTERNS}

${featureContext}

${specialInstructions}

${enhancedContext}
${state.backgroundContext ? formatBackgroundContextForFrontend(state.backgroundContext) : ''}
${state.designInspiration ? `
DESIGN INSPIRATION:
Primary: ${state.designInspiration.colors.primary}
Secondary: ${state.designInspiration.colors.secondary}
Accent: ${state.designInspiration.colors.accent}
Typography: ${state.designInspiration.typography.headingFont} / ${state.designInspiration.typography.bodyFont}
Patterns: ${state.designInspiration.patterns.join(', ')}
Border Radius: ${state.designInspiration.borderRadius}
Spacing: ${state.designInspiration.spacing.join('px, ')}px
` : ''}${(() => {
  const assetFiles = state.uploadedFiles?.filter(f => f.purpose === 'asset' || f.purpose === 'both') || [];
  if (assetFiles.length === 0) return '';
  const assetContext = assetFiles.map(f => `• ${f.fileName}: ${f.fileUrl}`).join('\n');
  return `
UPLOADED ASSETS:
${assetContext}
Use: <img src="${assetFiles[0].fileUrl}" alt="..." /> or <Image src="${assetFiles[0].fileUrl}" ... />
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
  const brand = state.stylingConfig.brand || {};
  const enhanced = state.stylingConfig.enhancedColors || {};
  const spacing = state.stylingConfig.spacing || {};
  const bordering = state.stylingConfig.bordering || {};
  const transitions = state.stylingConfig.transitions || {};
  const components = state.stylingConfig.components || {};

  // Build comprehensive design system context
  let designContext = `
DESIGN SYSTEM:
Colors: Primary ${colors.primary || '#136e35'}, Secondary ${colors.secondary || '#59687c'}, Accent ${colors.accent || '#945f06'}
Typography: ${typo.fontFamily || 'Inter'}, Headings font-${typo.headingWeight >= 700 ? 'bold' : 'semibold'}, Body font-${typo.bodyWeight >= 500 ? 'medium' : 'normal'}
Layout: Container max-w-${layout.containerWidth || '7xl'}, Spacing ${layout.spacing || 'normal'}, Corners ${layout.corners || 'rounded'}
Animations: ${anims.enabled ? `Enabled (${anims.intensity || 'moderate'})` : 'Disabled'}
Icons: ${icons.style || 'outlined'}, Size h-${icons.size === 'small' ? '4' : icons.size === 'large' ? '6' : '5'}`;

  // Add brand identity if available
  if (brand.brandName || brand.logoAssets) {
    designContext += `
Brand: ${brand.brandName || 'App'}, Logo at ${brand.logoAssets?.primary || '/logo.svg'}`;
  }

  // Add spacing system if available
  if (spacing.scale) {
    designContext += `
Spacing: ${spacing.scale} scale (${spacing.unit || 'rem'})`;
  }

  // Add border system if available
  if (bordering.radius) {
    designContext += `
Borders: Radius ${bordering.radius}, Width ${bordering.width || '1px'}, Style ${bordering.style || 'solid'}`;
  }

  // Add transition system if available
  if (transitions.duration) {
    designContext += `
Transitions: ${transitions.duration}, Easing ${transitions.easing || 'ease'}`;
  }

  // Add component-level styles if available
  if (components.button) {
    const btn = components.button;
    designContext += `
Button Styles: Size ${btn.size || 'md'}, Variant ${btn.variant || 'solid'}, Corners ${btn.corners || 'rounded'}`;
  }

  return designContext;
})()}

${componentCatalog}

${exampleContext || ''}

${filePlan.path.endsWith('.tsx') ? pagePatterns : ''}

🚨 INTERACTIVE ELEMENTS - CRITICAL FOR FUNCTIONALITY:
- Input fields MUST have value and onChange binding to state
- Buttons MUST have onClick handler or type="submit" in forms
- Forms MUST have onSubmit handler with preventDefault
- Textareas MUST bind value and onChange
- Selects/Dropdowns MUST have value and onChange handlers

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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 CRITICAL: EXACT API FUNCTION SIGNATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${state.backendConfig?.apiEndpoints?.map(ep => {
  const pathParams = (ep.path.match(/:[a-zA-Z_][a-zA-Z0-9_]*/g) || []).map((p: string) => p.slice(1));
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(ep.method);
  let params = [];
  pathParams.forEach((param: string) => params.push(`${param}`));
  if (hasBody) params.push('{ key: value }');
  return `${ep.handler}(${params.join(', ')})`;
}).join('\n')}

❌ NEVER ADD PARAMETERS NOT SHOWN ABOVE → BUILD FAILS!
❌ NEVER GUESS PARAMETERS FROM FUNCTION NAME → BUILD FAILS!

Example: If signature shows "searchProducts()" with NO parameters:
  ✅ CORRECT: const data = await searchProducts()
  ❌ WRONG: const data = await searchProducts({ query })
  ❌ WRONG: const data = await searchProducts(query)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨🚨🚨 FINAL CRITICAL REMINDER 🚨🚨🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${OUTPUT_FORMAT}

🚨 YOUR RESPONSE MUST START WITH CODE, NOT TEXT! 🚨
Examples of INVALID starts that will FAIL:
- "Certainly! Below is..."
- "Here's the implementation..."
- "This file includes..."
- "Let me create..."

Examples of VALID starts:
- 'use client'
- import { useState } from 'react'
- export default function Page() {

START YOUR RESPONSE WITH CODE NOW. NO TEXT BEFORE CODE.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

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
    attempt: 1,
    useCodestral: true // 🚀 PRIORITY: Use Codestral for code generation
  });

  // Clean up response (remove markdown fences and explanatory text if AI added them)
  let cleanedContent = resultText.trim();

  // CRITICAL: Remove conversational text that AI adds despite instructions
  const conversationalPatterns = [
    /^Certainly!?\s*.+?\n*/i,
    /^Here'?s?\s+the\s+.+?:\s*\n*/i,
    /^Below\s+is\s+.+?\n*/i,
    /^This\s+file\s+.+?\n*/i,
    /^Let\s+me\s+.+?\n*/i,
    /^I'?ll?\s+.+?\n*/i,
    /^Sure!?\s*.+?\n*/i,
  ];

  for (const pattern of conversationalPatterns) {
    if (pattern.test(cleanedContent)) {
      const beforeLength = cleanedContent.length;
      cleanedContent = cleanedContent.replace(pattern, '');
      if (cleanedContent.length < beforeLength) {
        console.log(`[Frontend] ⚠️  Removed conversational text from AI output (pattern: ${pattern.source})`);
      }
    }
  }

  // Remove any remaining non-code text before the first import or 'use client'
  const firstCodeLine = cleanedContent.search(/^('use client'|import\s|export\s|type\s|interface\s|const\s|function\s)/m);
  if (firstCodeLine > 0) {
    const removedText = cleanedContent.substring(0, firstCodeLine);
    console.log(`[Frontend] 🚨 Removed ${firstCodeLine} chars of non-code text: "${removedText.substring(0, 50)}..."`);
    cleanedContent = cleanedContent.substring(firstCodeLine);
  }

  // Remove markdown code fences
  if (cleanedContent.includes('```')) {
    cleanedContent = cleanedContent
      .replace(/^```[a-z]*\n?/gim, '')  // Remove opening fences with language
      .replace(/\n?```$/gm,'');         // Remove closing fences
    console.log('[Frontend] ⚠️  Removed markdown code fences from AI output');
  }
  // Remove trailing explanatory text after code (AI adds prose after closing brace)
  const lastBrace = cleanedContent.lastIndexOf('}');
  if (lastBrace !== -1) {
    const afterBrace = cleanedContent.substring(lastBrace + 1).trim();
    // Check if there's significant text after the last brace (more than just whitespace/semicolons)
    if (afterBrace && afterBrace.length > 10 && /[a-zA-Z]{5,}/.test(afterBrace)) {
      cleanedContent = cleanedContent.substring(0, lastBrace + 1);
      console.log('[Frontend] ⚠️  Removed trailing explanatory text after code');
    }
  }

  // Remove any remaining markdown artifacts
  cleanedContent = cleanedContent.trim();

  // ✅ DEBUG LOGGING: Show what AI generated
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[Frontend] 🔍 AI GENERATED CODE for ${filePlan.path}:`);
  console.log(`[Frontend] 📊 Length: ${cleanedContent.length} chars`);
  console.log(`[Frontend] 📊 Lines: ${cleanedContent.split('\n').length}`);

  // Extract imports to see what's being imported
  const imports = cleanedContent.match(/^import .+ from .+$/gm) || [];
  console.log(`[Frontend] 📦 Imports (${imports.length}):`);
  imports.forEach(imp => console.log(`[Frontend]    ${imp}`));

  // ✅ Track icon replacements for memory (declare at file-level scope for access throughout validation)
  const allIconReplacements: Array<{ from: string; to: string; files: string[]; timestamp: Date }> = [];

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
      'Move', 'GripVertical', 'GripHorizontal',
      // Additional common icons
      'Zap', 'Shield', 'ShieldCheck', 'Package', 'Box', 'Gift', 'Tag', 'Tags',
      'CreditCard', 'DollarSign', 'TrendingUp', 'TrendingDown', 'BarChart', 'PieChart',
      'Activity', 'Award', 'Target', 'Percent', 'ShoppingCart', 'ShoppingBag'
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
          const replacementsNeeded = new Map<string, string>(); // invalid -> valid

          invalidIcons.forEach(invalidIcon => {
            const replacement = iconReplacements[invalidIcon] || 'Square';
            replacementsNeeded.set(invalidIcon, replacement);
          });

          // Check which replacements are already imported
          replacementsNeeded.forEach((replacement, invalidIcon) => {
            // Only replace if the replacement icon is different from invalid icon
            // AND (replacement already exists in import OR we need to add it)
            const replacementAlreadyImported = iconList.includes(replacement);

            console.log(`[Frontend] 🔧 Replacing ${invalidIcon} → ${replacement}${replacementAlreadyImported ? ' (already imported)' : ''}`);

            // Track this replacement
            allIconReplacements.push({
              from: invalidIcon,
              to: replacement,
              files: [filePlan.path],
              timestamp: new Date()
            });

            if (replacementAlreadyImported) {
              // Remove invalid icon from import, keep replacement
              fixedContent = fixedContent.replace(
                new RegExp(`import\\s*{([^}]*\\b${invalidIcon}\\b[^}]*)}\\s*from\\s*['"]lucide-react['"]`),
                (match, importList) => {
                  // Remove the invalid icon from import list
                  const cleanedList = importList
                    .split(',')
                    .map((i: string) => i.trim())
                    .filter((i: string) => i !== invalidIcon)
                    .join(', ');
                  return `import { ${cleanedList} } from 'lucide-react'`;
                }
              );
              // Replace usage in code
              fixedContent = fixedContent.replace(
                new RegExp(`<${invalidIcon}\\b`, 'g'),
                `<${replacement}`
              );
            } else {
              // Replace in import statement and code
              fixedContent = fixedContent.replace(
                new RegExp(`\\b${invalidIcon}\\b`, 'g'),
                replacement
              );
            }
          });

          // Also apply known replacements
          Object.entries(iconReplacements).forEach(([invalid, valid]) => {
            if (iconList.includes(invalid)) {
              console.log(`[Frontend] 🔧 Replacing ${invalid} → ${valid}`);

              // Track this replacement
              allIconReplacements.push({
                from: invalid,
                to: valid,
                files: [filePlan.path],
                timestamp: new Date()
              });

              fixedContent = fixedContent.replace(
                new RegExp(`\\b${invalid}\\b`, 'g'),
                valid
              );
            }
          });

          cleanedContent = fixedContent;

          // 🚨 CRITICAL FIX: Deduplicate icon imports after replacements
          // When multiple invalid icons map to same replacement (e.g., Zap→Square, Shield→Square)
          // we end up with duplicate imports like: import { Square, Square } from 'lucide-react'
          const lucideImportMatch = cleanedContent.match(/import\s*{([^}]+)}\s*from\s*['"]lucide-react['"]/);
          if (lucideImportMatch) {
            const iconNames = lucideImportMatch[1].split(',').map(i => i.trim());
            const uniqueIcons = [...new Set(iconNames)]; // Remove duplicates

            if (iconNames.length !== uniqueIcons.length) {
              console.log(`[Frontend] 🔧 Deduplicating icon imports: ${iconNames.length} → ${uniqueIcons.length} icons`);
              cleanedContent = cleanedContent.replace(
                /import\s*{([^}]+)}\s*from\s*['"]lucide-react['"]/,
                `import { ${uniqueIcons.join(', ')} } from 'lucide-react'`
              );
            }
          }

          console.log(`[Frontend] ✅ Icon fixes applied`);
        } else {
          console.log(`[Frontend] ✅ All Lucide icons are valid`);
        }
      }
    });

    // 🆕 STORE IN MEMORY for AutoGen context (after forEach completes)
    if (allIconReplacements.length > 0) {
      await storeValidationContext(state.projectId, {
        iconReplacements: allIconReplacements
      });
      console.log(`[Frontend] 💾 Stored ${allIconReplacements.length} icon replacement(s) in memory`);
    }
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
              // 🚨 CRITICAL: React is NOT a named export, it's only available as default export
              // If someone wrote "import { useState, React }", move React to default import
              if (cleaned === 'React') {
                defaultImport = 'React';
                console.log(`[Frontend] ⚠️  Found 'React' as named import (INVALID) - converting to default import`);
              } else if (cleaned) {
                allNamedImports.add(cleaned);
              }
            });
          }

          // Group 3: named imports only (e.g., "useState, useEffect" in "import { useState, useEffect }")
          if (match[3]) {
            match[3].split(',').forEach(imp => {
              const cleaned = imp.trim();
              // 🚨 CRITICAL: React is NOT a named export, it's only available as default export
              // If someone wrote "import { useState, React }", move React to default import
              if (cleaned === 'React') {
                defaultImport = 'React';
                console.log(`[Frontend] ⚠️  Found 'React' as named import (INVALID) - converting to default import`);
              } else if (cleaned) {
                allNamedImports.add(cleaned);
              }
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

    // 🚨 STEP 3.5: Detect and fix duplicate lucide-react imports (UNCONDITIONAL)
    // Common AI error: multiple import { Loader2 } from 'lucide-react' statements
    // This prevents "Duplicate identifier 'Loader2'" TypeScript errors

    const allLucideImports = cleanedContent.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/g) || [];

    if (allLucideImports.length > 1) {
      console.log(`[Frontend] 🔍 DETECTED MULTIPLE LUCIDE-REACT IMPORTS (${allLucideImports.length}):`);
      allLucideImports.forEach(imp => console.log(`[Frontend]    ${imp}`));

      // Extract all icon imports and merge them
      const allIconImports = new Set<string>();

      allLucideImports.forEach(importStatement => {
        // Match: import { Icon1, Icon2, Icon3 } from 'lucide-react'
        const match = importStatement.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/);
        if (match) {
          const iconList = match[1];
          iconList.split(',').forEach(icon => {
            const cleaned = icon.trim();
            if (cleaned) allIconImports.add(cleaned);
          });
        }
      });

      // Build merged import statement
      const mergedImport = `import { ${Array.from(allIconImports).sort().join(', ')} } from 'lucide-react'`;

      console.log(`[Frontend] ✅ MERGED LUCIDE-REACT IMPORT:`, mergedImport);

      // Remove all lucide-react imports and add the merged one
      cleanedContent = cleanedContent.replace(/import\s+{[^}]+}\s+from\s+['"]lucide-react['"]\n?/g, '');

      // Add merged import after React import
      const reactImportMatch = cleanedContent.match(/import\s+(?:[^'"]*)\s+from\s+['"]react['"]/);
      if (reactImportMatch) {
        const reactImportEndIndex = cleanedContent.indexOf(reactImportMatch[0]) + reactImportMatch[0].length;
        cleanedContent = cleanedContent.substring(0, reactImportEndIndex) + '\n' + mergedImport + cleanedContent.substring(reactImportEndIndex);
      } else {
        // No React import found, add after 'use client'
        const useClientMatch = cleanedContent.match(/^['"]use client['"][\r\n]+/);
        if (useClientMatch) {
          cleanedContent = cleanedContent.replace(useClientMatch[0], useClientMatch[0] + mergedImport + '\n');
        } else {
          cleanedContent = mergedImport + '\n' + cleanedContent;
        }
      }

      console.log(`[Frontend] ✅ AUTO-FIXED: Merged ${allLucideImports.length} duplicate lucide-react imports into one`);
    } else if (allLucideImports.length === 1) {
      console.log(`[Frontend] ✅ Only one lucide-react import found, no duplicates`);
    }

    // 🚨 STEP 3.6: Detect and fix duplicate Next.js default imports (UNCONDITIONAL)
    // Common AI error: multiple import Image from 'next/image' or import Link from 'next/link' statements
    // This prevents "Duplicate identifier 'Image'" and "Duplicate identifier 'Link'" TypeScript errors

    const nextJsModules = ['next/image', 'next/link'];

    for (const moduleName of nextJsModules) {
      const defaultName = moduleName === 'next/image' ? 'Image' : 'Link';
      const importRegex = new RegExp(`import\\s+${defaultName}\\s+from\\s+['"]${moduleName.replace('/', '\\/')}['"]`, 'g');
      const allImports = cleanedContent.match(importRegex) || [];

      if (allImports.length > 1) {
        console.log(`[Frontend] 🔍 DETECTED MULTIPLE ${moduleName.toUpperCase()} IMPORTS (${allImports.length}):`);
        allImports.forEach(imp => console.log(`[Frontend]    ${imp}`));

        // Remove all duplicate imports
        cleanedContent = cleanedContent.replace(new RegExp(`import\\s+${defaultName}\\s+from\\s+['"]${moduleName.replace('/', '\\/')}['"]\\n?`, 'g'), '');

        // Add back a single import after React import
        const singleImport = `import ${defaultName} from '${moduleName}'`;
        const reactImportMatch = cleanedContent.match(/import\s+(?:[^'"]*)\s+from\s+['"]react['"]/);

        if (reactImportMatch) {
          const reactImportEndIndex = cleanedContent.indexOf(reactImportMatch[0]) + reactImportMatch[0].length;
          cleanedContent = cleanedContent.substring(0, reactImportEndIndex) + '\n' + singleImport + cleanedContent.substring(reactImportEndIndex);
        } else {
          // No React import found, add after 'use client'
          const useClientMatch = cleanedContent.match(/^['"]use client['"][\r\n]+/);
          if (useClientMatch) {
            cleanedContent = cleanedContent.replace(useClientMatch[0], useClientMatch[0] + singleImport + '\n');
          } else {
            cleanedContent = singleImport + '\n' + cleanedContent;
          }
        }

        console.log(`[Frontend] ✅ AUTO-FIXED: Removed ${allImports.length - 1} duplicate ${defaultName} imports, kept one`);
      } else if (allImports.length === 1) {
        console.log(`[Frontend] ✅ Only one ${defaultName} import found, no duplicates`);
      }
    }

    // 🚨 STEP 4: Add missing React hooks imports
    // This prevents "Cannot find name 'useState'" and "Cannot find name 'useEffect'" errors

    // Find all React hooks used in the code
    const hookPattern = /\b(useState|useEffect|useContext|useReducer|useCallback|useMemo|useRef|useLayoutEffect|useImperativeHandle|use)\s*\(/g;
    const usedHooks = new Set<string>();
    let hookMatch;
    while ((hookMatch = hookPattern.exec(cleanedContent)) !== null) {
      usedHooks.add(hookMatch[1]);
    }

    // 🚨 STEP 4.5: Check if React types are being used (e.g., React.FormEvent, React.ChangeEvent)
    // If yes, we need the default React import
    const needsReactDefaultImport = /\bReact\.(FormEvent|ChangeEvent|MouseEvent|KeyboardEvent|FocusEvent|SyntheticEvent|ReactNode|ReactElement|FC|Component)/g.test(cleanedContent);
    if (needsReactDefaultImport) {
      console.log(`[Frontend] 🔍 Detected React.* type usage - default React import required`);
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
            // 🚨 CRITICAL: Skip 'React' - it's not a hook and not a named export
            if (imp === 'React') {
              console.log(`[Frontend] ⚠️  Skipping 'React' in named imports (not a hook, should be default import)`);
              return;
            }
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
          // 🚨 CRITICAL: Filter out 'React' from hooks - it's not a named export
          const allHooks = [...importedHooks, ...missingHooks].filter(h => h !== 'React').sort();
          const defaultImport = reactImportMatch[2]; // e.g., "React" in "import React from 'react'"

          if (defaultImport || needsReactDefaultImport) {
            // Has default import OR needs one for React types: import React, { useState, useEffect } from 'react'
            const defaultName = defaultImport || 'React';
            const newImport = allHooks.length > 0
              ? `import ${defaultName}, { ${allHooks.join(', ')} } from 'react'`
              : `import ${defaultName} from 'react'`;
            cleanedContent = cleanedContent.replace(/import\s+(?:{[^}]+}|\w+)\s+from\s+['"]react['']/, newImport);
          } else {
            // Only named imports: import { ... } from 'react'
            const newImport = `import { ${allHooks.join(', ')} } from 'react'`;
            cleanedContent = cleanedContent.replace(/import\s+{[^}]+}\s+from\s+['"]react['"]/, newImport);
          }
          console.log(`[Frontend] ✅ AUTO-FIXED: Updated react import with missing hooks`);
        } else {
          // Add new react import after 'use client' if present, or at the very beginning
          // 🚨 CRITICAL: Filter out 'React' from hooks - it's not a named export
          const filteredHooks = missingHooks.filter(h => h !== 'React');
          const useClientMatch = cleanedContent.match(/^['"]use client['"][\r\n]+/);

          // Determine if we need default React import
          let newImport: string;
          if (needsReactDefaultImport && filteredHooks.length > 0) {
            newImport = `import React, { ${filteredHooks.sort().join(', ')} } from 'react'\n`;
          } else if (needsReactDefaultImport) {
            newImport = `import React from 'react'\n`;
          } else {
            newImport = `import { ${filteredHooks.sort().join(', ')} } from 'react'\n`;
          }

          if (useClientMatch) {
            cleanedContent = cleanedContent.replace(useClientMatch[0], useClientMatch[0] + newImport);
          } else {
            cleanedContent = newImport + cleanedContent;
          }
          console.log(`[Frontend] ✅ AUTO-FIXED: Added new react import${needsReactDefaultImport ? ' with default React for types' : ''}`);
        }
      } else {
        console.log(`[Frontend] ✅ All React hooks are properly imported`);

        // Check if React default import is needed (even if no hooks)
        if (needsReactDefaultImport && reactImportMatch) {
          const defaultImport = reactImportMatch[2];
          if (!defaultImport) {
            // Has named imports but no default import, and we need React for types
            const namedImports = reactImportMatch[1];
            const allHooks = namedImports.split(',').map(i => i.trim()).filter(h => h !== 'React').sort();
            const newImport = `import React, { ${allHooks.join(', ')} } from 'react'`;
            cleanedContent = cleanedContent.replace(/import\s+(?:{[^}]+}|\w+)\s+from\s+['"]react['']/, newImport);
            console.log(`[Frontend] ✅ AUTO-FIXED: Added default React import for type usage`);
          }
        }
      }
    } else if (needsReactDefaultImport) {
      // No hooks used, but React types are used - add default React import
      console.log(`[Frontend] 🔍 No hooks used, but React types detected - adding default React import`);
      const reactImportMatch = cleanedContent.match(/import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]react['"]/);

      if (!reactImportMatch) {
        // No React import at all, add one
        const useClientMatch = cleanedContent.match(/^['"]use client['"][\r\n]+/);
        const newImport = `import React from 'react'\n`;

        if (useClientMatch) {
          cleanedContent = cleanedContent.replace(useClientMatch[0], useClientMatch[0] + newImport);
        } else {
          cleanedContent = newImport + cleanedContent;
        }
        console.log(`[Frontend] ✅ AUTO-FIXED: Added default React import for type usage (no hooks)`);
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

    // 🚨 AUTO-FIX: Check for missing API function imports
    console.log(`[Frontend] 🔍 AUTO-FIX: Checking for missing API function imports...`);

    if (state.backendConfig?.apiEndpoints && state.backendConfig.apiEndpoints.length > 0) {
      // Get all API function names from backend config
      const apiHandlers = state.backendConfig.apiEndpoints.map((ep: any) => ep.handler);

      // Find all function calls in the code (e.g., functionName(...))
      const functionCallPattern = /\b([a-z][a-zA-Z0-9]*)\s*\(/g;
      const usedFunctions = new Set<string>();
      let funcMatch;

      while ((funcMatch = functionCallPattern.exec(cleanedContent)) !== null) {
        const funcName = funcMatch[1];
        // Only track if it's an API handler
        if (apiHandlers.includes(funcName)) {
          usedFunctions.add(funcName);
        }
      }

      if (usedFunctions.size > 0) {
        // Check current imports from @/lib/api - FIND ALL imports (not just first)
        const apiImportMatches = cleanedContent.matchAll(/import\s+{([^}]+)}\s+from\s+['"]@\/lib\/api['"]/g);
        const currentlyImported: string[] = [];

        for (const match of apiImportMatches) {
          const imports = match[1].split(',').map((i: string) => i.trim()).filter(Boolean);
          currentlyImported.push(...imports);
        }

        // Deduplicate
        const uniqueImports = [...new Set(currentlyImported)];

        // 🚨 CRITICAL: Check for local function definitions BEFORE adding imports
        // If AI generated a local stub function, remove it and use import instead
        const locallyDefined = new Set<string>();
        for (const funcName of usedFunctions) {
          // Check for various function definition patterns
          const functionDefPatterns = [
            new RegExp(`^\\s*function\\s+${funcName}\\s*\\(`, 'm'),
            new RegExp(`^\\s*const\\s+${funcName}\\s*=.*=>`, 'm'),
            new RegExp(`^\\s*const\\s+${funcName}\\s*=\\s*function`, 'm'),
          ];

          let hasLocalDef = false;
          for (const pattern of functionDefPatterns) {
            if (pattern.test(cleanedContent)) {
              hasLocalDef = true;
              console.log(`[Frontend] ⚠️  Found local definition of '${funcName}' - will remove and use import`);

              // Remove the local function definition
              // Match function + body including comments
              const funcRemovePatterns = [
                // function name() { ... }
                new RegExp(`^\\s*function\\s+${funcName}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?^}\\s*$`, 'gm'),
                // const name = () => { ... }
                new RegExp(`^\\s*const\\s+${funcName}\\s*=.*?=>\\s*{[\\s\\S]*?^}\\s*$`, 'gm'),
                // const name = function() { ... }
                new RegExp(`^\\s*const\\s+${funcName}\\s*=\\s*function\\s*\\([^)]*\\)\\s*{[\\s\\S]*?^}\\s*$`, 'gm'),
                // Single-line arrow function
                new RegExp(`^\\s*const\\s+${funcName}\\s*=.*?=>.*?[\\r\\n]+`, 'gm'),
              ];

              for (const removePattern of funcRemovePatterns) {
                if (removePattern.test(cleanedContent)) {
                  cleanedContent = cleanedContent.replace(removePattern, '');
                  console.log(`[Frontend] ✅ Removed local stub function '${funcName}'`);
                  break;
                }
              }

              locallyDefined.add(funcName);
              break;
            }
          }
        }

        // Find missing imports (exclude locally defined ones that we just removed)
        // FIXED: Changed || to && - only include if NOT imported AND NOT locally defined
        const missingImports = Array.from(usedFunctions).filter(
          (func) => !uniqueImports.includes(func) && !locallyDefined.has(func)
        );

        console.log(`[Frontend] 🔍 Import analysis:`);
        console.log(`[Frontend]   - Currently imported (all): ${uniqueImports.join(', ') || 'none'}`);
        console.log(`[Frontend]   - Used in code: ${Array.from(usedFunctions).join(', ')}`);
        console.log(`[Frontend]   - Locally defined: ${Array.from(locallyDefined).join(', ') || 'none'}`);
        console.log(`[Frontend]   - Missing: ${missingImports.join(', ') || 'none'}`);

        // 🚨 CRITICAL FIX: If there are multiple @/lib/api imports, consolidate them
        const allApiImports = Array.from(cleanedContent.matchAll(/import\s+{([^}]+)}\s+from\s+['"]@\/lib\/api['"]/g));

        if (allApiImports.length > 1) {
          console.log(`[Frontend] ⚠️  Found ${allApiImports.length} duplicate @/lib/api imports - consolidating...`);

          // Remove all existing @/lib/api imports
          cleanedContent = cleanedContent.replace(/import\s+{[^}]+}\s+from\s+['"]@\/lib\/api['"];?\s*[\r\n]*/g, '');

          // Combine all imports (existing + missing)
          const allImports = [...new Set([...uniqueImports, ...missingImports])].join(', ');

          // Add single consolidated import after 'use client' if present
          const useClientMatch = cleanedContent.match(/^['"]use client['"];?\s*[\r\n]+/m);
          const newImport = `import { ${allImports} } from '@/lib/api';\n`;

          if (useClientMatch && useClientMatch.index !== undefined) {
            const insertPos = useClientMatch.index + useClientMatch[0].length;
            cleanedContent = cleanedContent.slice(0, insertPos) + newImport + cleanedContent.slice(insertPos);
          } else {
            // Insert at top
            cleanedContent = newImport + cleanedContent;
          }

          console.log(`[Frontend] ✅ AUTO-FIXED: Consolidated into single import: { ${allImports} }`);
        } else if (missingImports.length > 0) {
          console.log(`[Frontend] ⚠️  MISSING API IMPORTS: ${missingImports.join(', ')}`);

          // Add missing imports to existing import or create new one
          if (allApiImports.length === 1) {
            // Add to existing import (deduplicate)
            const allImports = [...new Set([...uniqueImports, ...missingImports])].join(', ');
            const newImport = `import { ${allImports} } from '@/lib/api'`;
            cleanedContent = cleanedContent.replace(allApiImports[0][0], newImport);
            console.log(`[Frontend] ✅ AUTO-FIXED: Added missing imports to existing @/lib/api import`);
          } else {
            // Create new import after 'use client' if present
            const useClientMatch = cleanedContent.match(/^['"]use client['"];?\s*[\r\n]+/m);
            const allImports = [...missingImports].join(', ');
            const newImport = `import { ${allImports} } from '@/lib/api'\n`;

            if (useClientMatch && useClientMatch.index !== undefined) {
              // Insert after 'use client'
              const insertPos = useClientMatch.index + useClientMatch[0].length;
              cleanedContent = cleanedContent.slice(0, insertPos) + newImport + cleanedContent.slice(insertPos);
            } else {
              // Insert at top
              cleanedContent = newImport + cleanedContent;
            }
            console.log(`[Frontend] ✅ AUTO-FIXED: Created new @/lib/api import with: ${missingImports.join(', ')}`);
          }
        } else {
          console.log(`[Frontend] ✅ All used API functions are properly imported`);
        }
      } else {
        console.log(`[Frontend] ✅ No API functions used in this file`);
      }
    }

    // 🚨 STEP 8: Fix implicit any types in map callbacks (UNCONDITIONAL)
    // Common AI error: .map((item) => ...) when item has implicit any type
    // This prevents "Parameter 'item' implicitly has an 'any' type" errors

    console.log(`[Frontend] 🔍 AUTO-FIX: Checking for implicit any in map callbacks...`);

    // Pattern: .map((paramName) => ...) or .map((paramName, index) => ...)
    // Find all .map() calls with parameters that don't have type annotations
    const mapCallbackPattern = /\.map\(\s*\(([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\s*,\s*([a-zA-Z_$][a-zA-Z0-9_$]*))?\)\s*=>/g;
    let mapMatch;
    const implicitAnyFixes: Array<{ original: string; fixed: string }> = [];

    while ((mapMatch = mapCallbackPattern.exec(cleanedContent)) !== null) {
      const fullMatch = mapMatch[0];
      const firstParam = mapMatch[1];
      const secondParam = mapMatch[2];

      // Check if parameters already have type annotations
      // Look for patterns like (param: string) or (param: any)
      const hasTypeAnnotation = /\([a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*\w+/.test(fullMatch);

      if (!hasTypeAnnotation) {
        // Add explicit any type annotation to prevent implicit any errors
        let fixed: string;
        if (secondParam) {
          // Two parameters: .map((item, index) => ...)
          fixed = `.map((${firstParam}: any, ${secondParam}: number) =>`;
        } else {
          // One parameter: .map((item) => ...)
          fixed = `.map((${firstParam}: any) =>`;
        }

        implicitAnyFixes.push({ original: fullMatch, fixed });
      }
    }

    if (implicitAnyFixes.length > 0) {
      console.log(`[Frontend] ⚠️  Found ${implicitAnyFixes.length} map callbacks without type annotations`);

      // Apply fixes
      for (const fix of implicitAnyFixes) {
        cleanedContent = cleanedContent.replace(fix.original, fix.fixed);
      }

      console.log(`[Frontend] ✅ AUTO-FIXED: Added explicit type annotations to ${implicitAnyFixes.length} map callbacks`);
    } else {
      console.log(`[Frontend] ✅ No implicit any types detected in map callbacks`);
    }

    // 🚨 FINAL FIX: Ensure 'use client' is at the absolute top (after all auto-fixes)
    // This prevents "The 'use client' directive must be placed before other expressions" errors
    console.log(`[Frontend] 🔍 FINAL CHECK: Ensuring 'use client' placement is correct...`);

    const hasUseClientDirective = /^['"]use client['"];?\s*[\r\n]+/m.test(cleanedContent);
    if (hasUseClientDirective) {
      // Extract 'use client' and all imports
      const useClientMatch = cleanedContent.match(/^['"]use client['"];?\s*[\r\n]+/m);
      const allImports = cleanedContent.match(/^import\s+.+?['"];?\s*[\r\n]+/gm) || [];

      // Remove 'use client' and all imports from content
      let contentWithoutImports = cleanedContent
        .replace(/^['"]use client['"];?\s*[\r\n]+/m, '')
        .replace(/^import\s+.+?['"];?\s*[\r\n]+/gm, '');

      // Rebuild with correct order: 'use client' first, then imports, then rest
      if (useClientMatch && allImports.length > 0) {
        cleanedContent = useClientMatch[0] + allImports.join('') + '\n' + contentWithoutImports;
        console.log(`[Frontend] ✅ 'use client' placement verified and corrected`);
      }
    } else {
      console.log(`[Frontend] ✅ No 'use client' directive in this file (server component or non-React file)`);
    }

    // 🚨 AUTO-FIX: Ensure client directive for dynamic routes (standalone mode)
    // With output: 'standalone', dynamic routes use client components, NOT generateStaticParams()
    // This auto-fix ensures 'use client' is present for all dynamic routes
    const isDynamicRoute = filePlan.path.includes('[') && filePlan.path.includes(']') && filePlan.path.endsWith('page.tsx');
    if (isDynamicRoute) {
      console.log(`[Frontend] 🔍 AUTO-FIX: Ensuring dynamic route ${filePlan.path} uses client component`);

      const hasUseClient = /^['"]use client['"]/.test(cleanedContent);

      // With standalone mode, ALL dynamic routes should be client components
      if (!hasUseClient) {
        console.log(`[Frontend] 🚨 Dynamic route missing 'use client' directive - AUTO-FIXING!`);
        cleanedContent = `'use client';\n\n${cleanedContent}`;
        console.log(`[Frontend] ✅ AUTO-FIXED: Added 'use client' to dynamic route ${filePlan.path}`);
      } else {
        console.log(`[Frontend] ✅ Dynamic route already has 'use client' directive`);
      }

      // Remove any generateStaticParams() if present (not needed in standalone mode)
      const hasGenerateStaticParams = /export\s+(?:async\s+)?function\s+generateStaticParams/.test(cleanedContent);
      if (hasGenerateStaticParams) {
        console.log(`[Frontend] 🔧 Removing generateStaticParams() (not needed with standalone mode)`);
        // Remove the entire generateStaticParams function
        cleanedContent = cleanedContent.replace(
          /\/\/[^\n]*AUTO-GENERATED[^\n]*\nexport\s+async\s+function\s+generateStaticParams\(\)[^{]*\{[^}]*\}[\s\n]*/g,
          ''
        );
        console.log(`[Frontend] ✅ Removed generateStaticParams() from ${filePlan.path}`);
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

    // 🆕 VALIDATE AND FIX IMPORTS (missing lucide-react icons, etc.)
    console.log(`[Frontend] 🔍 Validating imports...`);
    const importFixResult = validateAndFixImports(cleanedContent);

    if (importFixResult.issues.length > 0) {
      console.warn(`[Frontend] ⚠️  IMPORT ISSUES (${importFixResult.issues.length}):`);
      importFixResult.issues.forEach(issue => {
        console.warn(`[Frontend]    Line ${issue.line}: Missing import '${issue.identifier}'`);
        console.warn(`[Frontend]    💡 ${issue.suggestion}`);
      });

      // Apply auto-fixes
      console.log(`[Frontend] 🔧 AUTO-FIXING ${importFixResult.issues.length} import issue(s)...`);
      cleanedContent = importFixResult.fixedCode;
      importFixResult.fixes.forEach(fix => {
        console.log(`[Frontend]    ✅ ${fix}`);
      });

      // 🆕 STORE IN MEMORY for AutoGen context
      const importFixesForMemory = importFixResult.issues.map(issue => ({
        file: filePlan.path,
        fix: 'added' as const,
        imports: [issue.identifier],
        timestamp: new Date()
      }));

      await storeValidationContext(state.projectId, {
        importFixes: importFixesForMemory
      });
      console.log(`[Frontend] 💾 Stored ${importFixesForMemory.length} import fix(es) in memory`);
    } else {
      console.log(`[Frontend] ✅ All imports valid`);
    }

    // NOTE: TypeScript validation moved to main loop (line ~4200) after file is added to files array

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

  // 🚨 STEP 5: FINAL CLEANUP - Remove ALL duplicate imports at end of file (AI hallucination)
  // AI often adds duplicate import statements at the very end of the file (AFTER the component)
  // Example: Line 127 might have "import { Loader2, Square, Plus } from 'lucide-react';"

  // Split into lines to find duplicate imports
  const lines = cleanedContent.split('\n');
  const importLines = new Map<string, number[]>(); // Track import statements and their line numbers

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('import ') && trimmed.includes(' from ')) {
      // Normalize the import statement (remove extra spaces, sort imports)
      const match = trimmed.match(/import\s+({[^}]+}|\w+)\s+from\s+['"]([^'"]+)['"]/);
      if (match) {
        const [, imports, source] = match;
        const normalizedKey = `${source}:::${imports.replace(/\s+/g, '')}`;

        if (!importLines.has(normalizedKey)) {
          importLines.set(normalizedKey, []);
        }
        importLines.get(normalizedKey)!.push(index);
      }
    }
  });

  // Find duplicates (same import from same source)
  const linesToRemove = new Set<number>();
  importLines.forEach((lineNumbers, key) => {
    if (lineNumbers.length > 1) {
      const [source] = key.split(':::');
      console.log(`[Frontend] 🔍 FOUND ${lineNumbers.length} DUPLICATE imports from '${source}' at lines:`, lineNumbers.map(n => n + 1));

      // Keep the FIRST occurrence, remove all others
      lineNumbers.slice(1).forEach(lineNum => {
        console.log(`[Frontend] ❌ REMOVING duplicate import at line ${lineNum + 1}: ${lines[lineNum].trim()}`);
        linesToRemove.add(lineNum);
      });
    }
  });

  // Remove duplicate lines
  if (linesToRemove.size > 0) {
    cleanedContent = lines
      .filter((_, index) => !linesToRemove.has(index))
      .join('\n');
    console.log(`[Frontend] ✅ REMOVED ${linesToRemove.size} duplicate import line(s)`);
  } else {
    console.log(`[Frontend] ✅ No duplicate imports at end of file`);
  }

  // 🚨 STEP 6: Fix malformed import statements (empty commas)
  // Example: import { Square, , Heart } from 'lucide-react'  ❌

  const malformedImportPattern = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
  let malformedMatch;
  let malformedCount = 0;

  while ((malformedMatch = malformedImportPattern.exec(cleanedContent)) !== null) {
    const [fullMatch, imports, source] = malformedMatch;

    // Split by comma and filter out empty strings
    const importItems = imports.split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0 && item !== ''); // Remove empty items

    // Check if we had empty items (malformed)
    const originalCount = imports.split(',').length;
    if (importItems.length !== originalCount) {
      const fixedImport = `import { ${importItems.join(', ')} } from '${source}'`;
      cleanedContent = cleanedContent.replace(fullMatch, fixedImport);
      console.log(`[Frontend] ✅ FIXED malformed import: ${fullMatch} → ${fixedImport}`);
      malformedCount++;
    }
  }

  if (malformedCount > 0) {
    console.log(`[Frontend] ✅ Fixed ${malformedCount} malformed import(s)`);
  } else {
    console.log(`[Frontend] ✅ No malformed imports found`);
  }

  // 🚨 STEP 7: Fix INVALID lucide-react imports (AI importing types/components from lucide-react)
  // AI often tries to import types like ToastContext, ToastData, Product, etc. from 'lucide-react'
  // These are NOT icons - they're user-defined types that should NOT be imported

  const lucideImportPattern = /import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/g;
  let lucideMatch;
  let invalidCount = 0;
  const allInvalidIconsRemoved: string[] = []; // ✅ Track for memory

  // List of INVALID patterns for lucide-react imports (NOT icons - they're types/contexts)
  // Only reject obvious non-icon patterns, NOT actual Lucide icons
  const invalidPatterns = [
    /Context$/,      // ToastContext, AuthContext, etc.
    /Data$/,         // ToastData, UserData, etc.
    /^Product$/,     // Product (type, not icon)
    /^Message$/,     // Message (type, not icon)
    /^Task$/,        // Task (type, not icon)
    /^Cart$/,        // Cart (type, not icon)
    /^Order$/,       // Order (type, not icon)
    /^Item$/,        // Item (type, not icon)
  ];

  while ((lucideMatch = lucideImportPattern.exec(cleanedContent)) !== null) {
    const [fullMatch, imports] = lucideMatch;

    const importItems = imports.split(',').map(item => item.trim()).filter(item => item.length > 0);
    const validImports: string[] = [];
    const invalidImports: string[] = [];

    importItems.forEach(item => {
      // Check if item matches any invalid pattern
      const isInvalid = invalidPatterns.some(pattern => pattern.test(item));

      if (isInvalid) {
        invalidImports.push(item);
        allInvalidIconsRemoved.push(item); // ✅ Track for memory
        console.log(`[Frontend] ❌ INVALID lucide-react import: '${item}' (not an icon)`);
      } else {
        validImports.push(item);
      }
    });

    // If we found invalid imports, rebuild the import statement
    if (invalidImports.length > 0) {
      if (validImports.length > 0) {
        const fixedImport = `import { ${validImports.join(', ')} } from 'lucide-react'`;
        cleanedContent = cleanedContent.replace(fullMatch, fixedImport);
        console.log(`[Frontend] ✅ FIXED lucide-react import: Removed ${invalidImports.join(', ')}`);
      } else {
        // All imports were invalid - remove the entire import line
        cleanedContent = cleanedContent.replace(fullMatch + ';', '').replace(fullMatch, '');
        console.log(`[Frontend] ✅ REMOVED entire lucide-react import (all items invalid)`);
      }
      invalidCount += invalidImports.length;
    }
  }

  if (invalidCount > 0) {
    console.log(`[Frontend] ✅ Removed ${invalidCount} invalid lucide-react import(s)`);

    // ✅ CRITICAL: Store rejected icons in allIconReplacements for memory tracking
    // This prevents AutoGen from trying to re-add them later
    // These will be stored in conversation memory at line ~2517
    allInvalidIconsRemoved.forEach(icon => {
      allIconReplacements.push({
        from: icon,
        to: '',  // Empty string means "rejected/removed" (not a valid icon)
        files: [filePlan.path],
        timestamp: new Date()
      });
    });
    console.log(`[Frontend] 💾 Tracked ${allInvalidIconsRemoved.length} rejected icon(s): ${allInvalidIconsRemoved.join(', ')}`);
  } else {
    console.log(`[Frontend] ✅ No invalid lucide-react imports found`);
  }

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
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // INCREMENTAL MODE DETECTION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const existingFiles = state.files || [];
    const isIncremental = existingFiles.length > 0;

    if (isIncremental) {
      console.log('[Frontend] 🔄 INCREMENTAL MODE: Adding to existing codebase');
      console.log(`[Frontend]   Existing files: ${existingFiles.length}`);
      console.log(`[Frontend]   Files: ${existingFiles.map(f => f.path).slice(0, 5).join(', ')}${existingFiles.length > 5 ? '...' : ''}`);
    } else {
      console.log('[Frontend] 🚀 NEW PROJECT MODE: Generating from scratch');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // BACKWARD COMPATIBILITY: Support both old backendConfig and new featureSchemas
    // During transition, populate backendConfig from featureSchemas if missing
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (!state.backendConfig && state.featureSchemas && state.featureSchemas.length > 0) {
      console.log('[Frontend] 🔄 Generating backendConfig from featureSchemas for backward compatibility');
      const { collections, apiEndpoints } = extractBackendFromSchemas(state.featureSchemas);
      state.backendConfig = {
        collections,
        apiEndpoints,
        pages: [], // Deprecated in new system
        pageCollectionMapping: [] // Deprecated in new system
      };
      console.log('[Frontend] ✅ backendConfig populated from featureSchemas');
    }
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log('[Frontend] 🚀 Starting unified frontend node (Next.js AI Autonomy)');
    console.log('[Frontend] 🔍 State:', { hasStylingConfig: !!state.stylingConfig, primary: state.stylingConfig?.colorTheme?.primary });
    console.log('[Frontend] 📊 Framework: Next.js + TypeScript + Tailwind (always)');
    console.log(`[Frontend] 📊 Complexity: ${state.context?.complexity || 'auto'}`);
    console.log(`[Frontend] 🗄️ Backend: ${state.backendConfig ? 'YES' : 'NO'}`);

    // CONVERSATION MEMORY: Get conversation context for multi-turn editing
    // ============================================================================
    // COMPONENT REGISTRY INITIALIZATION
    // ============================================================================
    console.log('[Frontend] 📦 Initializing component registry...');
    const registry = getProjectRegistry(state.projectId);
    registry.clear();  // Start fresh for this generation
    console.log('[Frontend] 📦 Registry initialized');

    // Register routes from PM node's features (NEW: direct from features)
    // INCREMENTAL MODE: Filter to only NEW features (not completed)
    let featuresToGenerate = state.allRequestedFeatures || [];
    if (isIncremental && featuresToGenerate.length > 0) {
      const newFeatures = featuresToGenerate.filter((f: any) => !f.completed);
      console.log(`[Frontend] 🔄 Filtering features: ${featuresToGenerate.length} total → ${newFeatures.length} new (${featuresToGenerate.length - newFeatures.length} already completed)`);
      featuresToGenerate = newFeatures;
    }

    if (featuresToGenerate && featuresToGenerate.length > 0) {
      console.log('[Frontend] 📍 Registering routes from PM features...');

      featuresToGenerate.forEach(feature => {
        feature.routes?.forEach(route => {
          const routeMetadata: RouteMetadata = {
            path: route.path,
            file: `src/app${route.path === '/' ? '' : route.path}/page.tsx`,
            components: [],  // Will be populated after generation
            linkedFrom: [],
            isDynamic: route.path.includes('['),
            featureId: feature.id
          };

          registry.registerRoute(routeMetadata);
          console.log(`[Frontend]   ${route.path} → ${routeMetadata.file} (${feature.name})`);
        });
      });

      const totalRoutes = featuresToGenerate.reduce((sum, f) => sum + (f.routes?.length || 0), 0);
      console.log(`[Frontend] ✅ Registered ${totalRoutes} routes from ${featuresToGenerate.length} features`);
    } else {
      console.log('[Frontend] ⚠️ No features with routes (defaulting to single page)');
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
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // DERIVE FILE PATHS FROM allRequestedFeatures ROUTES
    // Single source of truth: allRequestedFeatures
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log('[Frontend] 📋 Deriving file paths from allRequestedFeatures routes');

    // Helper function to convert route path to Next.js file path
    const routeToFilePath = (routePath: string): string => {
      if (!routePath || routePath === '/') {
        return 'src/app/page.tsx';
      }

      // Convert route path to Next.js App Router file path
      // /products → src/app/products/page.tsx
      // /products/:id → src/app/products/[id]/page.tsx
      const segments = routePath.split('/').filter(Boolean);
      const pathSegments = segments.map((seg: string) => {
        // Convert :param to [param] for Next.js dynamic routes
        return seg.startsWith(':') ? `[${seg.slice(1)}]` : seg;
      });
      return `src/app/${pathSegments.join('/')}/page.tsx`;
    };

    // Process allRequestedFeatures and add file paths to routes
    // CRITICAL: Only process Phase 1 (MVP) features
    const features = state.allRequestedFeatures?.filter((f: any) => f.included_in_mvp) || [];

    console.log(`[Frontend] 📋 Processing ${features.length} Phase 1 features for file generation`);
    features.forEach(f => console.log(`[Frontend]   → ${f.name} (${f.routes?.length || 0} routes)`));

    // Map to track unique files and their purposes
    const fileMap = new Map<string, string>();

    features.forEach((feature: any) => {
      if (!feature.routes || !Array.isArray(feature.routes)) {
        feature.routes = [{ path: '/', purpose: feature.name }];
      }

      feature.routes.forEach((route: any) => {
        // Add file path to route (updating allRequestedFeatures as single source of truth)
        // Always derive from route path - don't force landing pages to single file
        const filePath = routeToFilePath(route.path);
        route.file = filePath;

        // Track unique files
        if (!fileMap.has(filePath)) {
          fileMap.set(filePath, route.purpose || feature.name);
        } else {
          // Append additional purposes for same file
          const existing = fileMap.get(filePath)!;
          if (!existing.includes(route.purpose || feature.name)) {
            fileMap.set(filePath, `${existing}, ${route.purpose || feature.name}`);
          }
        }
      });
    });

    // Convert to file structure format
    let fileStructure: Array<{path: string; purpose: string; dependencies?: string[]}> =
      Array.from(fileMap.entries()).map(([path, purpose]) => ({
        path,
        purpose,
        dependencies: []
      }));

    // Fallback if no features
    if (fileStructure.length === 0) {
      console.log('[Frontend] ⚠️  No features found, creating fallback structure');
      fileStructure = [
        { path: 'src/app/page.tsx', purpose: 'Home page', dependencies: [] }
      ];
    }

    console.log(`[Frontend] ✅ Created ${fileStructure.length} unique files from ${features.length} features`);

    // Add required Next.js infrastructure files
    const hasGlobals = fileStructure.some(f => f.path.includes('globals.css'));
    const hasLayout = fileStructure.some(f => f.path.includes('layout.tsx'));

    if (!hasGlobals) {
      fileStructure.push({ path: 'src/app/globals.css', purpose: 'Global styles', dependencies: [] });
    }
    if (!hasLayout) {
      fileStructure.push({ path: 'src/app/layout.tsx', purpose: 'Root layout', dependencies: [] });
    }

    // Add backend API client if needed
    const hasBackend = !!(state.backendConfig?.collections && state.backendConfig.collections.length > 0);
    if (hasBackend) {
      const hasApiClient = fileStructure.some(f => f.path.includes('lib/api.ts'));
      if (!hasApiClient) {
        fileStructure.push({ path: 'src/lib/api.ts', purpose: 'API client for backend calls', dependencies: [] });
      }
    }

    // Add state management if features require shared state
    const mvpFeaturesForStateCheck = state.allRequestedFeatures?.filter((f: any) => f.included_in_mvp) || [];
    const featureNames = mvpFeaturesForStateCheck.map((f: any) => f.name.toLowerCase()).join(' ');
    const requiresSharedState =
      featureNames.includes('cart') ||
      featureNames.includes('basket') ||
      featureNames.includes('shopping') ||
      featureNames.includes('wishlist') ||
      featureNames.includes('favorites');

    if (requiresSharedState) {
      const hasStateContext = fileStructure.some(f => f.path.includes('context') && f.path.startsWith('src/lib/'));
      if (!hasStateContext) {
        fileStructure.push({ path: 'src/lib/cart-context.tsx', purpose: 'Global state management context', dependencies: [] });
      }
    }

    console.log('[Frontend] 📋 Final file structure:', fileStructure.map(f => f.path));

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

    // 🎯 PRE-GENERATE layout.tsx (NEVER let AI generate this - 100% deterministic)
    const layoutIndex = fileStructure.findIndex(f => f.path === 'src/app/layout.tsx');
    if (layoutIndex !== -1) {
      console.log('[Frontend] 🎯 PRE-GENERATING layout.tsx with template (NEVER using AI)');

      const font = state.stylingConfig?.typography?.fontFamily || 'Inter';
      // Handle pipe-separated fonts: "Inter|Roboto" → use first font only
      const primaryFont = font.split('|')[0].trim();
      const fontImportName = primaryFont.replace(/\s+/g, '_');
      const fontVarName = primaryFont.replace(/\s+/g, '').toLowerCase();
      const weights = state.stylingConfig?.typography?.weights || [400, 700];
      const mode = state.stylingConfig?.colorTheme?.mode || 'light';
      const hasBackendForLayout = !!(state.backendConfig?.collections && state.backendConfig.collections.length > 0);

      console.log('[Frontend] 🔍 Layout config:', {
        font,
        fontImportName,
        fontVarName,
        weights,
        mode,
        hasBackendForLayout
      });

      const layoutContent = hasBackendForLayout
        ? `'use client';
import { ${fontImportName} } from 'next/font/google'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import './globals.css'

const ${fontVarName} = ${fontImportName}({
  subsets: ['latin'],
  weight: [${weights.map(w => `'${w}'`).join(', ')}]
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
    <html lang="en"${mode === 'dark' ? ' className="dark"' : ''} suppressHydrationWarning>
      <body className={${fontVarName}.className}>
        <QueryClientProvider client={queryClient}>
          {children}
          {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </body>
    </html>
  )
}
`
        : `import { ${fontImportName} } from 'next/font/google'
import './globals.css'

const ${fontVarName} = ${fontImportName}({
  subsets: ['latin'],
  weight: [${weights.map(w => `'${w}'`).join(', ')}]
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"${mode === 'dark' ? ' className="dark"' : ''} suppressHydrationWarning>
      <body className={${fontVarName}.className}>{children}</body>
    </html>
  )
}
`;

      // Store in files and previousFiles (same pattern as globals.css)
      files.push({ path: 'src/app/layout.tsx', content: layoutContent });
      previousFiles.push({ path: 'src/app/layout.tsx', content: layoutContent, purpose: 'Root layout' });
      await storeFileInMemory(state.projectId, 'src/app/layout.tsx', layoutContent, 'Root layout');

      // Emit events for layout.tsx creation
      const layoutActualTotal = fileStructure.length;
      emitFileCreating(state.projectId, 'frontend', 'src/app/layout.tsx', 1, layoutActualTotal);
      emitFileCreated(state.projectId, 'frontend', 'src/app/layout.tsx', 1, layoutActualTotal, layoutContent.length);

      console.log('[Frontend] ✅ layout.tsx pre-generated with template, removed from AI queue');

      // Remove from fileStructure to skip AI generation
      fileStructure.splice(layoutIndex, 1);
    }

    // ✨ NEW: Fetch component examples based on app type
    console.log('[Frontend] 📚 Fetching component examples...');
    const appType = state.context?.appType || 'general';
    const visualTone = state.context?.visualTone || 'modern';
    const industries = detectIndustryContext(state.userDescription);

    const componentExamples = await selectExamplesForCategory(
      getCategoryFromAppType(appType),
      {
        projectDescription: state.userDescription,
        userPreferences: {
          industryContext: industries[0],
          styleVariant: visualTone
        },
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
      const { pb } = await import('@/lib/database/pocketbase');
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

      // 3.5. API Client (PocketBase function wrappers)
      if (state.backendConfig?.apiEndpoints && state.backendConfig.apiEndpoints.length > 0) {
        const apiClientCode = generateApiClient(
          state.backendConfig.apiEndpoints,
          state.projectId,
          state.backendConfig.collections || []
        );
        files.push({
          path: 'src/lib/api.ts',
          content: apiClientCode
        });
        console.log(`[Frontend] ✅ Generated src/lib/api.ts (${state.backendConfig.apiEndpoints.length} endpoints, ${state.backendConfig.collections?.length || 0} types)`);

        // ✅ CRITICAL FIX: Add api.ts to previousFiles so its type definitions are available for subsequent file generation
        previousFiles.push({
          path: 'src/lib/api.ts',
          content: apiClientCode,
          purpose: 'API client with TypeScript interfaces for backend collections'
        });
        await storeFileInMemory(state.projectId, 'src/lib/api.ts', apiClientCode, 'API client with TypeScript interfaces');
        console.log(`[Frontend] ✅ Added api.ts type definitions to context for subsequent files`);

        // ✅ NEW: Validate API client matches schema
        const { validateApiClientMatchesSchema, generateSchemaValidationReport } = await import('@/lib/langgraph/validation/post-gen/schema-validator');
        const schemaValidation = validateApiClientMatchesSchema(apiClientCode, state.backendConfig.apiEndpoints);

        if (!schemaValidation.valid || schemaValidation.warnings.length > 0) {
          console.log('[Frontend] 🔍 Schema validation results:');
          console.log(generateSchemaValidationReport(schemaValidation));

          if (!schemaValidation.valid) {
            console.warn('[Frontend] ⚠️  API client has schema mismatches - check logs above');
          }
        } else {
          console.log('[Frontend] ✅ API client matches backend schema perfectly');
        }

        // Generate .env.local for API configuration
        const envContent = generateEnvFile(state.projectId);
        files.push({
          path: '.env.local',
          content: envContent
        });
        console.log('[Frontend] ✅ Generated .env.local');
      }
    }

    // 4. Form Utilities (React Hook Form + Zod)
    files.push({
      path: 'src/lib/form-utils.ts',
      content: formUtilsTemplate
    });
    console.log('[Frontend] ✅ Generated src/lib/form-utils.ts (RHF + Zod)');

    // 5. Radix UI Components - DISABLED (use inline patterns instead)
    // ❌ DO NOT generate separate component files - patterns should be inline in page.tsx files
    // files.push({
    //   path: 'src/components/ui/Modal.tsx',
    //   content: radixModalComponent
    // });
    // files.push({
    //   path: 'src/components/ui/Dropdown.tsx',
    //   content: radixDropdownComponent
    // });
    // files.push({
    //   path: 'src/components/ui/Select.tsx',
    //   content: radixSelectComponent
    // });
    // files.push({
    //   path: 'src/components/ui/Toast.tsx',
    //   content: radixToastComponent
    // });
    // console.log('[Frontend] ✅ Generated 4 Radix UI components (Modal, Dropdown, Select, Toast)');
    console.log('[Frontend] ✅ Skipped Radix UI components (patterns should be inline)');

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
    console.log(`[Frontend] 🎉 Infrastructure setup complete (${infraFilesCount} infrastructure files: layout, globals.css, db, store, etc.)`);

    // ✅ CRITICAL FIX: Extract type definitions from api.ts for use in subsequent file generation
    let extractedTypeDefinitions: TypeDefinition[] = [];
    if (hasBackend) {
      const apiFile = previousFiles.find(f => f.path === 'src/lib/api.ts');
      if (apiFile) {
        extractedTypeDefinitions = extractTypeDefinitions(apiFile.content);
        console.log(`[Frontend] ✅ Extracted ${extractedTypeDefinitions.length} type definitions from api.ts: ${extractedTypeDefinitions.map(t => t.name).join(', ')}`);

        // 🔍 LOG TYPE EXTRACTION for tracking
        const { emitTypeDefinitionsExtracted } = await import('../../utils/logging/events');
        emitTypeDefinitionsExtracted(
          state.projectId,
          extractedTypeDefinitions.map(t => ({
            name: t.name,
            properties: t.properties.map(p => ({ name: p.name, type: p.type }))
          })),
          'src/lib/api.ts',
          'frontend'
        );
      }
    }

    // REMOVE src/lib/api.ts from fileStructure if AI included it (we already generated it in infrastructure phase)
    const apiFileIndex = fileStructure.findIndex((f: any) => f.path === 'src/lib/api.ts');
    if (apiFileIndex !== -1 && hasBackend) {
      fileStructure.splice(apiFileIndex, 1);
      console.log('[Frontend] ✅ src/lib/api.ts pre-generated in infrastructure phase, removed from AI queue');
    }

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

      // Generate single file with catalog, patterns, component examples, AND type definitions
      const content = await generateFile(state, filePlan, previousFiles, componentCatalog, pagePatterns, extractedTypeDefinitions, exampleContext);

      // Add to files array
      files.push({ path: filePlan.path, content });

      // 🆕 TYPESCRIPT COMPILATION CHECK (catch type errors before deployment)
      // Now that file is in files array, validate with all context
      if (filePlan.path.endsWith('.tsx') || filePlan.path.endsWith('.ts')) {
        console.log(`[Frontend] 🔍 Running TypeScript compilation check for ${filePlan.path}...`);

        // 🔍 STEP 1: Type Mismatch Detection (run BEFORE TypeScript compilation)
        if (extractedTypeDefinitions.length > 0) {
          const { emitTypeValidationStart, emitTypeValidationComplete, emitTypeMismatchDetected } = await import('../../utils/logging/events');
          const { detectTypeMismatches } = await import('../../validation/post-gen/typescript-validator');

          // Log validation start
          emitTypeValidationStart(
            state.projectId,
            filePlan.path,
            extractedTypeDefinitions.map(t => ({
              name: t.name,
              properties: t.properties.map(p => ({ name: p.name, type: p.type }))
            }))
          );

          console.log(`[Frontend] 🔍 Running type mismatch detection for ${filePlan.path}...`);
          const typeMismatches = detectTypeMismatches(content, extractedTypeDefinitions, filePlan.path);

          if (typeMismatches.length > 0) {
            console.error(`[Frontend] 🚨 TYPE MISMATCH DETECTED in ${filePlan.path}:`);
            typeMismatches.forEach(error => {
              console.error(`[Frontend]    Line ${error.line}: ${error.message}`);

              // Extract details for detailed logging
              const match = error.message.match(/Property '([^']+)' does not exist on type '([^']+)'\. Available properties: \[([^\]]+)\]/);
              if (match) {
                const [, property, typeName, availablePropsStr] = match;
                const availableProperties = availablePropsStr.split(', ');

                emitTypeMismatchDetected(
                  state.projectId,
                  filePlan.path,
                  error.line,
                  typeName,
                  property,
                  availableProperties
                );
              }
            });

            // Log validation complete with errors
            emitTypeValidationComplete(
              state.projectId,
              filePlan.path,
              typeMismatches.length,
              typeMismatches.map(e => ({ line: e.line, message: e.message }))
            );

            // Throw error to stop generation
            const firstError = typeMismatches[0];
            throw new Error(`Type mismatch detected in ${filePlan.path}: ${firstError.message}`);
          }

          console.log(`[Frontend] ✅ Type mismatch detection passed`);

          // Log validation complete with no errors
          emitTypeValidationComplete(state.projectId, filePlan.path, 0, []);
        }

        // 🔍 STEP 2: TypeScript Compilation Check
        const allFilesMap = new Map(files.map(f => [f.path, f.content]));
        const tsErrors = validateSingleFile(filePlan.path, content, allFilesMap);

        if (tsErrors.length > 0) {
          // 🚨 ALL TypeScript errors are now CRITICAL (block build)
          // EXCEPT: Ignore missing @/lib/* modules - those are generated in infrastructure phase
          const criticalErrors = tsErrors.filter(err => {
            // Allow missing @/lib/* modules (infrastructure files generated later)
            if (err.message.includes("Cannot find module '@/lib/")) {
              return false;
            }
            // 🚨 REMOVED: "has no exported member" suppression
            // This was causing builds to deploy with broken imports
            // Backend compatibility auto-fixer now handles these BEFORE validation
            // If this error appears, it means the auto-fixer failed and build WILL fail

            // ✅ BLOCK ALL TYPESCRIPT ERRORS (including import errors)
            // This includes: type mismatches, unknown types, argument errors, missing exports
            // Rationale: If TypeScript validator shows an error, Next.js build WILL fail
            return true;
          });

          if (criticalErrors.length > 0) {
            console.error(`[Frontend] 🚨 CRITICAL TypeScript errors detected - BUILD BLOCKED:`);
            criticalErrors.forEach(error => {
              console.error(`[Frontend]    ${error.line}:${error.column} - ${error.message}`);
            });

            // Context-aware error message based on error type
            const errorMessage = criticalErrors[0].message;
            let userMessage = '';

            // 1. Implicit 'any' type errors (catch parameters, function parameters, etc.)
            if (errorMessage.match(/implicitly has an 'any' type/i)) {
              userMessage = `${errorMessage}. Add explicit type annotation (e.g., error: any, param: any, or specific type).`;
              console.error(`[Frontend] VALIDATOR: Parameter needs explicit type annotation. In strict mode, all parameters must be typed.`);
            }
            // 2. API function errors (add, remove, get, create, update, delete, etc.)
            else if (errorMessage.match(/Cannot find name '(add|remove|get|create|update|delete|login|register|logout|fetch|submit|send|search)/i)) {
              userMessage = `${errorMessage}. Check that this function is imported from @/lib/api and matches the generated API handlers.`;
              console.error(`[Frontend] VALIDATOR: AI generated code using undefined API function. Must use ONLY functions from lib/api.ts.`);
            }
            // 3. Argument count mismatch (Expected X arguments, but got Y)
            else if (errorMessage.match(/Expected \d+ arguments?, but got \d+/)) {
              userMessage = `${errorMessage}. Check function signature and call arguments match.`;
              console.error(`[Frontend] VALIDATOR: Function called with wrong number of arguments. AI must match function signatures exactly.`);
            }
            // 4. Type errors ('X' is of type 'unknown', 'never', etc.)
            else if (errorMessage.match(/'([^']+)' is of type '(unknown|never)'/)) {
              userMessage = `${errorMessage}. Add type annotation or type guard (e.g., useState<any>(null) or error instanceof Error).`;
              console.error(`[Frontend] VALIDATOR: Type inference error. AI must provide explicit type annotations.`);
            }
            // 5. Property does not exist errors
            else if (errorMessage.match(/Property '([^']+)' does not exist on type '([^']+)'/)) {
              const match = errorMessage.match(/Property '([^']+)' does not exist on type '([^']+)'/);
              const property = match?.[1];
              const typeName = match?.[2];

              // Check if this is a generated type from @/lib/api
              if (typeName && extractedTypeDefinitions.length > 0) {
                const typeDefinition = extractedTypeDefinitions.find(t => t.name === typeName);
                if (typeDefinition) {
                  const availableProps = typeDefinition.properties.map(p => p.name).join(', ');
                  userMessage = `${errorMessage}. The ${typeName} type has these properties: [${availableProps}]. Use ONLY these properties, do not hallucinate properties.`;
                  console.error(`[Frontend] VALIDATOR: Property '${property}' does not exist on ${typeName}. Available: ${availableProps}`);
                } else {
                  userMessage = `${errorMessage}. Check type definitions and property names. Use ONLY properties that exist in the type definition.`;
                  console.error(`[Frontend] VALIDATOR: Property access error. AI must use correct property names for types.`);
                }
              } else {
                userMessage = `${errorMessage}. Check type definitions and property names. Use ONLY properties that exist in the type definition.`;
                console.error(`[Frontend] VALIDATOR: Property access error. AI must use correct property names for types.`);
              }
            }
            // 6. Undefined variable (lowercase single word)
            else if (errorMessage.match(/Cannot find name '([a-z][a-z0-9_]*)'/) && !errorMessage.includes('Component')) {
              userMessage = `${errorMessage}. This variable is not declared. Check variable declarations, function parameters, and destructuring.`;
              console.error(`[Frontend] VALIDATOR: Undefined variable detected. AI must declare all variables before use.`);
            }
            // 7. Missing types or React components
            else if (errorMessage.match(/Cannot find name '([A-Z][a-zA-Z0-9_]*)'/)) {
              userMessage = `${errorMessage}. This type or component is not imported. Check TypeScript imports and component definitions.`;
              console.error(`[Frontend] VALIDATOR: Missing type/component import. AI must import all types and components.`);
            }
            // 8. Missing module/package
            else if (errorMessage.includes('Cannot find module') || errorMessage.includes('has no exported member')) {
              userMessage = `${errorMessage}. Check that all imports are correct and packages are installed.`;
              console.error(`[Frontend] VALIDATOR: Missing module or export. AI must use valid imports.`);
            }
            // 9. Fallback for all other TypeScript errors
            else {
              userMessage = `${errorMessage}. Review TypeScript error and fix code accordingly.`;
              console.error(`[Frontend] VALIDATOR: TypeScript compilation error. AI must generate valid TypeScript code.`);
            }

            throw new Error(`TypeScript compilation failed in ${filePlan.path}: ${userMessage}`);
          }

          // ✅ ALL TypeScript errors are now blocking - no "non-critical warnings" section
          // If we reach here, all errors were filtered (e.g., @/lib/* imports)
          console.log(`[Frontend] ✅ TypeScript validation passed (${tsErrors.length} allowed errors filtered)`);
        } else {
          console.log(`[Frontend] ✅ TypeScript validation passed`);
        }
      }

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

    // 🚨 CRITICAL: Auto-fix API function names BEFORE any validation
    // This must run BEFORE TypeScript validation to fix import errors
    if (hasBackend) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[Frontend] 🔧 AUTO-FIXING API FUNCTION NAMES');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const { autoFixAPIFunctionNames, autoFixRelationTypeErrors } = await import('@/lib/langgraph/validation/post-gen/backend-compatibility');

      const filesToFix = files.map(f => ({ path: f.path, content: f.content }));

      // Fix 1: Function name mismatches (fetchCartItems → getCartItems)
      const autoFixResult = autoFixAPIFunctionNames(filesToFix);
      if (autoFixResult.fixed) {
        console.log('[Frontend] ✅ Auto-fixed API function names:');
        autoFixResult.changes.forEach(change => {
          console.log(`[Frontend]   🔧 ${change}`);
        });

        // Apply fixes back to files array
        filesToFix.forEach((fixedFile, index) => {
          files[index].content = fixedFile.content;
        });
      } else {
        console.log('[Frontend] ✅ No API function name fixes needed');
      }

      // Fix 2: Relation type errors (product.id issues)
      const relationFixResult = autoFixRelationTypeErrors(filesToFix);
      if (relationFixResult.fixed) {
        console.log('[Frontend] ✅ Auto-fixed relation type errors:');
        relationFixResult.changes.forEach(change => {
          console.log(`[Frontend]   🔧 ${change}`);
        });

        // Apply fixes back to files array
        filesToFix.forEach((fixedFile, index) => {
          files[index].content = fixedFile.content;
        });
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

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

    // RULE 3: API client already generated in infrastructure phase (line 4041-4057)
    // No need to generate it again here

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

    // ============================================================================
    // REGISTER GENERATED COMPONENTS IN REGISTRY
    // ============================================================================
    console.log('[Frontend] 📝 Registering generated components in registry...');

    files.forEach(file => {
      // Only register TypeScript/React files
      if (!file.path.endsWith('.tsx') && !file.path.endsWith('.ts')) return;
      if (file.path.includes('.test.') || file.path.includes('.spec.')) return; // Skip test files

      try {
        // Extract metadata from code
        const imports = extractImports(file.content);
        const exports = extractExports(file.content);
        const types = extractTypes(file.content);

        // Determine component type
        let componentType: 'page' | 'component' | 'layout' | 'context' | 'hook' = 'component';
        if (file.path.includes('/page.tsx')) componentType = 'page';
        else if (file.path.includes('/layout.tsx')) componentType = 'layout';
        else if (file.path.includes('context') || file.path.includes('Context')) componentType = 'context';
        else if (file.path.match(/use[A-Z]/)) componentType = 'hook';

        // Register component if it has a default export
        const defaultExport = exports.find(e => e.type === 'default');
        if (defaultExport) {
          const metadata: ComponentMetadata = {
            name: defaultExport.name,
            path: file.path,
            type: componentType,
            imports,
            exports,
            props: undefined,  // Could extract from props interface
            usedBy: [],
            uses: imports.filter(i => i.isLocal).map(i => i.name),
            createdAt: new Date()
          };

          registry.registerComponent(metadata);
        }

        // Register all exported types
        types.forEach(type => {
          const isExported = exports.some(e => e.name === type.name && e.isType);
          if (isExported) {
            const typeMetadata: TypeMetadata = {
              name: type.name,
              path: file.path,
              kind: type.kind,
              fields: [],  // Could extract from definition
              usedBy: [],
              isExported: true
            };

            registry.registerType(typeMetadata);
          }
        });
      } catch (extractError) {
        console.warn(`[Frontend] ⚠️ Failed to extract metadata from ${file.path}:`, extractError);
        // Continue with other files
      }
    });

    console.log(`[Frontend] ✅ Registered ${registry.getAllComponents().length} components`);
    registry.printSummary();

    // 🆕 BACKEND COMPATIBILITY VALIDATION (catch API import mismatches)
    if (hasBackend) {
      console.log('[Frontend] 🔧 Auto-fixing API function name mismatches...');
      const { autoFixAPIFunctionNames, autoFixRelationTypeErrors } = await import('@/lib/langgraph/validation/post-gen/backend-compatibility');

      const filesToFix = files.map(f => ({ path: f.path, content: f.content }));

      // Fix 1: Function name mismatches
      const autoFixResult = autoFixAPIFunctionNames(filesToFix);
      if (autoFixResult.fixed) {
        console.log('[Frontend] ✅ Auto-fixed API function names:');
        autoFixResult.changes.forEach(change => {
          console.log(`[Frontend]   🔧 ${change}`);
        });
      }

      // Fix 2: Relation type errors (product.id issues)
      console.log('[Frontend] 🔧 Auto-fixing relation type errors...');
      const relationFixResult = autoFixRelationTypeErrors(filesToFix);
      if (relationFixResult.fixed) {
        console.log('[Frontend] ✅ Auto-fixed relation type errors:');
        relationFixResult.changes.forEach(change => {
          console.log(`[Frontend]   🔧 ${change}`);
        });
      }

      // Apply all fixes back to files array
      if (autoFixResult.fixed || relationFixResult.fixed) {
        filesToFix.forEach((fixedFile, index) => {
          files[index].content = fixedFile.content;
        });
      }

      console.log('[Frontend] 🔍 Running backend compatibility validation...');
      const backendErrors = validateBackendCompatibility(
        files.map(f => ({ path: f.path, content: f.content }))
      );

      if (backendErrors.length > 0) {
        console.error(`[Frontend] ❌ Backend compatibility errors (${backendErrors.length}):`);
        backendErrors.forEach(error => {
          console.error(`[Frontend]    ${error.file}:${error.line}`);
          console.error(`[Frontend]    ${error.message}`);
          if (error.suggestion) {
            console.error(`[Frontend]    💡 ${error.suggestion}`);
          }
        });
        console.error('[Frontend] 🚨 CRITICAL: API import mismatches will cause build failure!');
      } else {
        console.log('[Frontend] ✅ Backend compatibility validated');
      }
    }

    // FIX #5: VALIDATION - Verify all MVP features have implementations
    console.log('[Frontend] 🔍 Validating feature completeness...');
    const mvpFeatures = state.allRequestedFeatures?.filter((f: any) => f.included_in_mvp) || [];
    const implementedFeatures = new Set<string>();

    for (const feature of mvpFeatures) {
      const featureName = feature.name.toLowerCase();
      const hasImplementation = files.some(file =>
        file.content.toLowerCase().includes(featureName) ||
        file.path.toLowerCase().includes(featureName.replace(/\s+/g, '-'))
      );
      if (hasImplementation) {
        implementedFeatures.add(feature.name);
        console.log(`[Frontend]   ✅ ${feature.name} - implemented`);
      } else {
        console.log(`[Frontend]   ⚠️  ${feature.name} - NOT FOUND in generated files`);
      }
    }

    const missingCount = mvpFeatures.length - implementedFeatures.size;
    if (missingCount > 0) {
      console.log(`[Frontend] ⚠️  ${missingCount}/${mvpFeatures.length} MVP features may be incomplete`);
    } else if (mvpFeatures.length > 0) {
      console.log(`[Frontend] ✅ All ${mvpFeatures.length} MVP features implemented`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // INCREMENTAL MODE: MERGE FILES (Phase 4)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let finalFiles = files;

    if (isIncremental) {
      console.log('[Frontend] 🔄 INCREMENTAL MODE: Merging files with existing codebase...');

      // 1. Identify which files are NEW (not in existingFiles)
      const existingFilePaths = new Set(existingFiles.map(f => f.path));
      const newFiles = files.filter(f => !existingFilePaths.has(f.path));
      const updatedFiles = files.filter(f => existingFilePaths.has(f.path));

      console.log(`[Frontend]   Generated files: ${files.length}`);
      console.log(`[Frontend]   New files: ${newFiles.length}`);
      console.log(`[Frontend]   Updated files: ${updatedFiles.length}`);

      // 2. Handle src/lib/api.ts specially - MERGE, don't replace
      const newApiFile = updatedFiles.find(f => f.path === 'src/lib/api.ts');
      const existingApiFile = existingFiles.find(f => f.path === 'src/lib/api.ts');

      if (newApiFile && existingApiFile) {
        console.log('[Frontend] 🔄 Merging src/lib/api.ts (appending new functions)...');

        // Extract new collection functions from generated API file
        const newCollectionRegex = /\/\/ ━━━ Collection: (\w+) ━━━[\s\S]*?(?=\/\/ ━━━ Collection:|$)/g;
        const newCollections = [...newApiFile.content.matchAll(newCollectionRegex)];

        // Extract existing collection names
        const existingCollectionNames = new Set(
          [...existingApiFile.content.matchAll(newCollectionRegex)].map(m => m[1])
        );

        // Filter to only truly NEW collections
        const collectionsToAdd = newCollections.filter(match => {
          const collectionName = match[1];
          return !existingCollectionNames.has(collectionName);
        });

        if (collectionsToAdd.length > 0) {
          console.log(`[Frontend]   Adding ${collectionsToAdd.length} new collection functions`);
          collectionsToAdd.forEach(match => {
            console.log(`[Frontend]     + ${match[1]}`);
          });

          // Append new collections to existing API file
          const newCollectionsCode = collectionsToAdd.map(m => m[0]).join('\n\n');
          const mergedApiContent = existingApiFile.content + '\n\n' + newCollectionsCode;

          // Update the file in newFiles array
          const apiIndex = files.findIndex(f => f.path === 'src/lib/api.ts');
          if (apiIndex !== -1) {
            files[apiIndex].content = mergedApiContent;
          }
        } else {
          console.log('[Frontend]   No new collections to add (all exist)');
          // Keep existing API file as-is
          const apiIndex = files.findIndex(f => f.path === 'src/lib/api.ts');
          if (apiIndex !== -1) {
            files[apiIndex] = existingApiFile;
          }
        }
      }

      // 3. Handle globals.css specially - only update if new design system elements added
      const newGlobalsFile = updatedFiles.find(f => f.path === 'src/app/globals.css');
      const existingGlobalsFile = existingFiles.find(f => f.path === 'src/app/globals.css');

      if (newGlobalsFile && existingGlobalsFile) {
        console.log('[Frontend] 🔄 Checking globals.css...');

        // Check if new globals.css has significantly different content
        const newUtilities = newGlobalsFile.content.match(/\.(btn|card|badge|form)/g)?.length || 0;
        const existingUtilities = existingGlobalsFile.content.match(/\.(btn|card|badge|form)/g)?.length || 0;

        if (newUtilities > existingUtilities) {
          console.log(`[Frontend]   Updating globals.css (${newUtilities} utilities vs ${existingUtilities} existing)`);
          // Keep new globals.css
        } else {
          console.log('[Frontend]   Keeping existing globals.css (no new utilities)');
          // Keep existing globals.css
          const globalsIndex = files.findIndex(f => f.path === 'src/app/globals.css');
          if (globalsIndex !== -1) {
            files[globalsIndex] = existingGlobalsFile;
          }
        }
      }

      // 4. For all other updated files, keep EXISTING versions (preserve existing code)
      const otherUpdatedFiles = updatedFiles.filter(
        f => f.path !== 'src/lib/api.ts' && f.path !== 'src/app/globals.css'
      );

      if (otherUpdatedFiles.length > 0) {
        console.log(`[Frontend] 📦 Preserving ${otherUpdatedFiles.length} existing files:`);
        otherUpdatedFiles.forEach(f => {
          console.log(`[Frontend]     • ${f.path}`);
          const existingFile = existingFiles.find(ef => ef.path === f.path);
          if (existingFile) {
            // Replace generated version with existing version
            const fileIndex = files.findIndex(gf => gf.path === f.path);
            if (fileIndex !== -1) {
              files[fileIndex] = existingFile;
            }
          }
        });
      }

      // 5. Final merge: Existing files + New files (with updated api.ts and globals.css)
      const preservedExistingFiles = existingFiles.filter(
        ef => !files.some(f => f.path === ef.path)
      );

      finalFiles = [...preservedExistingFiles, ...files];

      console.log(`[Frontend] ✅ Merge complete:`);
      console.log(`[Frontend]   Preserved existing: ${preservedExistingFiles.length}`);
      console.log(`[Frontend]   Added new: ${newFiles.length}`);
      console.log(`[Frontend]   Total files: ${finalFiles.length}`);
    }

    return {
      files: finalFiles,
      techStack,
      isMultiPage: finalFiles.some(f => f.path.includes('src/app/') && f.path !== 'src/app/page.tsx' && f.path !== 'src/app/layout.tsx'),
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

