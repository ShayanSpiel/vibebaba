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
  api.ts             → API client functions (if backend needed)
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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 CRITICAL: NEXT.JS ROUTING & NAVIGATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ROUTING STRUCTURE:
- app/page.tsx              → /
- app/about/page.tsx        → /about
- app/users/page.tsx        → /users (list)
- app/users/[id]/page.tsx   → /users/:id (detail)
- app/blog/[...slug]/page.tsx → /blog/* (catch-all)

🚨 NAVIGATION RULES (MANDATORY):

1. INTERNAL LINKS - Use Next.js Link component:
   ✅ CORRECT: import Link from 'next/link'
              <Link href="/about">About</Link>
   ❌ WRONG:   <a href="/about">About</a>  // Will full page reload!
   ❌ WRONG:   <button onClick={() => window.location.href = '/about'}>  // Bad UX!

2. PROGRAMMATIC NAVIGATION - Use Next.js router:
   ✅ CORRECT: import { useRouter } from 'next/navigation'
              const router = useRouter()
              <button onClick={() => router.push('/dashboard')}>Go</button>
   ❌ WRONG:   window.location.href = '/dashboard'  // Full reload!

3. EXTERNAL LINKS - Use regular anchor tags:
   ✅ CORRECT: <a href="https://example.com" target="_blank" rel="noopener">External</a>
   ❌ WRONG:   <Link href="https://example.com">  // Don't use Link for external!

4. BUTTON ACTIONS (NON-NAVIGATION):
   ✅ CORRECT: <button onClick={handleSubmit}>Submit</button>  // Action, not navigation
   ❌ WRONG:   <button onClick={() => {}}>Submit</button>  // Empty handler!

5. AUTH/CART/CHECKOUT BUTTONS:
   - Login button → router.push('/login') OR open modal with setShowLoginModal(true)
   - Cart button → router.push('/cart') ONLY if cart page exists
   - Checkout → router.push('/checkout') ONLY if checkout page exists
   - If page doesn't exist, use modal or inline form instead

6. AVOID 404 ERRORS:
   ❌ NEVER create <Link href="/cart"> if you didn't create app/cart/page.tsx
   ❌ NEVER create <Link href="/about"> if you didn't create app/about/page.tsx
   ✅ ONLY link to pages you're actually building in this generation

SPECIAL FILES:
- layout.tsx   → Shared layout for route segment
- loading.tsx  → Loading UI
- error.tsx    → Error UI
- not-found.tsx → 404 UI

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
