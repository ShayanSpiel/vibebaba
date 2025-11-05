/**
 * File Structure Scaffold
 *
 * Provides framework conventions and guidance (NOT rigid file lists)
 * Shows the RULES OF THE GAME, lets AI play creatively
 * ~100 tokens vs rigid blueprints
 *
 * Philosophy: Framework conventions (must follow) + Project patterns (should guide)
 */

export interface FileStructureGuide {
  framework: string;
  conventions: string;
  guidance: string;
  examples: string;
}

/**
 * Get Next.js App Router file structure scaffold
 * Returns ~100 tokens of enabling guidance
 */
export function getNextJSScaffold(): string {
  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 NEXT.JS PROJECT STRUCTURE (App Router)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ROOT:
/
├── src/
│   ├── app/           ← Pages, layouts, API routes
│   ├── lib/           ← Utils, db, types
│   └── components/    ← UI components
├── package.json       ← Auto-provided
├── next.config.js     ← Auto-provided
├── tsconfig.json      ← Auto-provided
├── tailwind.config.js ← Auto-provided
└── .env.local         ← Create if needed

APP ROUTER:
src/app/
  layout.tsx         → Root layout
  page.tsx           → Home page
  [feature]/page.tsx → Feature routes
  api/[name]/route.ts → API endpoints

ORGANIZATION:
src/lib/
  db.ts              → Database client (if backend needed)
  utils.ts           → Utility functions (if needed)

IMPORTANT:
- Define types inline in components where needed
- NO separate types.ts file
- NO src/components/ui/ folder (use Tailwind directly)

RULES:
- All code in src/ folder
- Use app/, lib/, components/ inside src/
- Config files stay in root
`;
}

/**
 * Get framework conventions for any framework
 */
export function getFrameworkScaffold(framework: string): string {
  switch (framework.toLowerCase()) {
    case 'nextjs':
    case 'next.js':
    case 'next':
      return getNextJSScaffold();
    case 'react':
      return getReactScaffold();
    case 'vue':
      return getVueScaffold();
    case 'html':
      return getHTMLScaffold();
    default:
      return getNextJSScaffold(); // Default to Next.js
  }
}

/**
 * Get React (Vite/CRA) file structure scaffold
 */
function getReactScaffold(): string {
  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 REACT APP STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TYPICAL STRUCTURE:
src/
  App.tsx            → Root component
  main.tsx           → Entry point
  index.css          → Global styles

  components/        → Reusable components
  pages/             → Page components
  hooks/             → Custom hooks
  lib/               → Utilities, types
  context/           → React contexts

public/              → Static assets

GUIDELINES:
- Organize by features or file type
- Use React Router for routing (if needed)
- TypeScript for all files
- Create structure based on app size
`;
}

/**
 * Get Vue file structure scaffold
 */
function getVueScaffold(): string {
  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 VUE APP STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TYPICAL STRUCTURE:
src/
  App.vue            → Root component
  main.ts            → Entry point

  components/        → Reusable components
  views/             → Page components
  composables/       → Composition functions
  stores/            → Pinia stores
  router/            → Vue Router config

public/              → Static assets

GUIDELINES:
- Use Vue 3 Composition API
- TypeScript for script setup
- Create structure based on app needs
`;
}

/**
 * Get HTML file structure scaffold
 */
function getHTMLScaffold(): string {
  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 HTML APP STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TYPICAL STRUCTURE:
index.html           → Main page
styles.css           → Styles
script.js            → JavaScript (optional)

additional-page.html → Other pages (if multi-page)

GUIDELINES:
- Single HTML file for simple apps
- Multiple HTML files for multi-page apps
- Use modern CSS (Grid, Flexbox)
- Vanilla JS or lightweight library
`;
}

/**
 * Get routing conventions for a framework
 */
export function getRoutingConventions(framework: string): string {
  switch (framework.toLowerCase()) {
    case 'nextjs':
    case 'next.js':
    case 'next':
      return `
NEXT.JS ROUTING CONVENTIONS:
- app/page.tsx              → /
- app/about/page.tsx        → /about
- app/users/page.tsx        → /users (list)
- app/users/[id]/page.tsx   → /users/:id (detail)
- app/blog/[...slug]/page.tsx → /blog/* (catch-all)

SPECIAL FILES:
- layout.tsx   → Shared layout for route segment
- loading.tsx  → Loading UI
- error.tsx    → Error UI
- not-found.tsx → 404 UI

Create routes based on app requirements. Use meaningful path names.
`;
    case 'react':
      return `
REACT ROUTER CONVENTIONS:
- Use React Router for client-side routing
- Define routes in App.tsx or router config
- Use <Route path="/path" element={<Component />} />
- Use useNavigate() for navigation
- Use useParams() for dynamic routes
`;
    case 'html':
      return `
HTML NAVIGATION:
- Use <a href="page.html"> for page links
- Separate HTML files for each page
- Use relative paths for links
`;
    default:
      return '';
  }
}

/**
 * Get minimal scaffold (for tight token budgets)
 * Returns ~50 tokens
 */
export function getMinimalScaffold(framework: string): string {
  switch (framework.toLowerCase()) {
    case 'nextjs':
    case 'next.js':
    case 'next':
      return `
Next.js Structure:
app/ → pages (page.tsx, layout.tsx)
components/ → reusable UI
lib/ → utilities, types
Use App Router conventions. Organize logically.
`;
    default:
      return `
${framework} Structure:
src/ → source code
components/ → UI components
Organize based on app needs.
`;
  }
}

/**
 * Estimate token count for scaffold
 */
export function getScaffoldTokenEstimate(framework: string): number {
  const scaffold = getFrameworkScaffold(framework);
  // Rough estimate: 4 chars per token
  return Math.ceil(scaffold.length / 4);
}
