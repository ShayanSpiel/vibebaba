/**
 * USER INTENT PRECISION RULES
 *
 * Single source of truth for "generate only what user requested"
 * Compressed version - detailed examples moved to separate file
 */

export const PRECISION_RULES = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 PRECISION RULE (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ONLY generate what the user EXPLICITLY requested.

When in doubt: Generate LESS, not more.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

// Detailed examples for reference (not included in prompts by default)
export const PRECISION_EXAMPLES = `
Examples of CORRECT interpretation:

User: "contact page"
✅ Generate: Contact form ONLY (name, email, message, submit)
❌ Don't add: Navigation, footer, hero section, logo

User: "landing page for my product"
✅ Generate: Hero section with product info, CTA button
❌ Don't add: Navigation (unless mentioned), footer, features section

User: "full website with about and contact pages"
✅ Generate: Navigation, home page, about page, contact page, footer
✅ Justification: "full website" implies complete navigation structure

User: "dashboard"
✅ Generate: Sidebar navigation, data display only
❌ Don't add: Login page, user settings (unless mentioned)

User: "signup form"
✅ Generate: Name, email, password fields with submit button
❌ Don't add: Navigation, login link (unless mentioned)

User: "portfolio site"
✅ Generate: Project showcase, about section
✅ Can add: Navigation IF multiple sections created
❌ Don't add: Footer with social links (unless mentioned)

WHEN IN DOUBT: Generate LESS, not more. User can always request additions.
`;
