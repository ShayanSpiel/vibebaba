/**
 * FEATURE PLANNING - Ultra-simplified PM rules
 *
 * Replaces: mvp-guidelines.ts, feature-classification-schema.ts
 * Reduces: ~350 lines → ~40 lines (88% reduction)
 */

export const FEATURE_EXTRACTION_RULES = `
EXTRACT ALL FEATURES USER MENTIONS:
- Extract EVERY feature the user requests
- Don't limit yourself - list everything they want
- Phasing will be done automatically by the system
- Exclude: styling (colors, themes, animations)

EXAMPLES:
"E-commerce site with products, cart, checkout, and user accounts"
  → Product Catalog (regular, backend, routes: "/", "/products/[id]")
  → Shopping Cart (regular, backend, routes: "/cart")
  → Checkout Flow (regular, backend, routes: "/checkout")
  → User Authentication (infrastructure, backend, routes: "/login", "/signup")

"Blog with posts, comments, categories, tags, and search"
  → Blog Posts (regular, backend, routes: "/blog")
  → Post Detail (regular, no backend, routes: "/blog/[id]")
  → Comments System (regular, backend, no routes - integrated in post detail)
  → Categories (regular, backend, no routes - filter in blog list)
  → Tags (regular, backend, no routes - filter in blog list)
  → Search (regular, no backend, no routes - search bar in blog list)

"Landing page with hero, pricing, testimonials, and contact form"
  → Landing Page (regular, no backend, routes: "/" - all sections in one page)
  → Contact Form (regular, backend, no routes - integrated in landing page)

BACKEND DETECTION:
✓ Needs backend: User creates/edits/saves data (products, posts, orders, users, forms)
✗ No backend: Display-only content (landing sections, static pages, lists without CRUD)

ROUTE PLANNING:
- Landing page → "/" (single page.tsx with all sections)
- Multi-page app → Separate routes for distinct features
- List + Detail → Two routes: "/items", "/items/[id]"
- Default: Use "/" for main feature

CLASSIFICATION:
- "infrastructure" = Auth, Payments, Admin Panel, User Management, API Keys, Monitoring, Settings
- "regular" = All other features (Product Catalog, Blog Posts, Landing Page, Cart, etc.)

Note: Phasing (which features to build first) is determined automatically by the system

OUTPUT JSON:
{
  "features": [{
    "name": "Feature Name",
    "description": "What it does",
    "backend_required": true|false,
    "classification": "regular|infrastructure",
    "routes": [{"path": "/", "purpose": "Homepage"}]
  }]
}
`;

export const ROUTE_PATTERNS = `
COMMON PATTERNS:
✓ Landing: ["/"] - all sections in page.tsx
✓ Blog: ["/blog", "/blog/[id]"] - list + detail
✓ Dashboard: ["/dashboard"] - tabs in single page
✓ E-commerce: ["/", "/products/[id]", "/cart", "/checkout"]
✓ SaaS: ["/", "/dashboard", "/settings"]
`;

export const FEATURE_INTEGRATION_PATTERNS = `
STATE MANAGEMENT:
1. Shared state (cart, auth) → Context in lib/[name]-context.tsx
2. Local state (forms, UI) → useState in component
3. Persistent data → localStorage or backend API

BACKEND API:
- Import from @/lib/api
- Use EXACT function signatures
- Never assume or modify

BUTTONS & ACTIONS:
- All buttons need onClick handlers
- Connect to state or API
- No placeholders

TYPE SAFETY:
- useState<Type[]>([])
- item?.name || 'default'
- .map((item: Type) => ...)
`;