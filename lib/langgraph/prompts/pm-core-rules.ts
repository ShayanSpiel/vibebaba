/**
 * PM NODE CORE RULES - Ultra-simplified, production-ready
 * Single source of truth for feature extraction and planning
 */

export const PM_RULES = `
EXTRACT FEATURES:
- List EVERY feature/section user mentioned
- Preserve ALL user requests (pricing, testimonials, forms, etc.)
- Ignore styling preferences (colors, themes, animations)

CLASSIFY BACKEND NEED:
backend_required: true IF:
- User inputs/edits/saves data
- Feature contains: catalog, inventory, products, listings, items
- Feature contains: cart, basket, wishlist, favorites
- Feature contains: orders, checkout, payments, transactions
- Feature contains: reviews, ratings, comments, feedback
- Feature contains: users, accounts, auth, login, signup

backend_required: false IF display-only content

ASSIGN ROUTES:
- Landing page → Single route "/" with all sections
- Multi-page app → Separate routes only if features need distinct URLs
- Default: When unsure, use single page "/"

SET PRIORITY:
- high = User explicitly requested → Include in MVP
- medium/low = Not mentioned → Exclude from MVP
`;

export const ROUTE_EXAMPLES = `
ROUTE PATTERNS:
✓ Landing page: ["/"] - all sections in page.tsx
✓ Blog: ["/blog", "/blog/[id]"] - list + detail
✓ Dashboard: ["/dashboard"] - tabs within single page
✓ E-commerce: ["/", "/products/[id]", "/cart", "/checkout"]
`;
