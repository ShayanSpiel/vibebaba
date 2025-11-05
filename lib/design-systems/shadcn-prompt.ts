/**
 * SHADCN/UI DESIGN SYSTEM PROMPT
 *
 * Minimal, AI-native prompt for shadcn/ui
 * Uses standard React patterns + Tailwind CSS
 * NO library-specific instructions needed
 */

import { DesignConfig } from './index';

export function getShadcnPrompt(config: DesignConfig): string {
  const { appType, userStyling, isDarkMode = false } = config;

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 SHADCN/UI DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OUTPUT FORMAT (MANDATORY):
Return a JSON array of file objects:
[
  {"path": "index.html", "content": "<!DOCTYPE html>..."},
  {"path": "styles.css", "content": "/* CSS */"}
]

DESIGN TOKENS:
Primary Color: hsl(221.2 83.2% 53.3%)
Background: hsl(0 0% 100%)
Foreground: hsl(222.2 84% 4.9%)
Border Radius: 0.5rem
Font Family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

${isDarkMode ? `
DARK MODE:
Background: hsl(222.2 84% 4.9%)
Foreground: hsl(210 40% 98%)
Primary: hsl(217.2 91.2% 59.8%)
` : ''}

COLOR SYSTEM:
Uses CSS custom properties via Tailwind:
- bg-background, text-foreground
- bg-primary, text-primary-foreground
- bg-secondary, text-secondary-foreground
- bg-muted, text-muted-foreground
- border-border

TYPOGRAPHY:
- Headings: font-bold, text-3xl → text-sm
- Body: text-base (16px)
- Muted text: text-muted-foreground

SPACING:
Standard Tailwind scale (p-4, gap-6, mt-8, etc.)

STYLING:
Use Tailwind CSS classes directly for all UI elements
Example: <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">

${userStyling ? `
═══════════════════════════════════════════════════════════
USER STYLING OVERRIDES (PRIORITY!)
═══════════════════════════════════════════════════════════

${JSON.stringify(userStyling, null, 2)}

Apply these custom styles AFTER shadcn defaults.
` : ''}

DESIGN PRINCIPLES:
1. Simplicity: Clean, minimal interfaces
2. Accessibility: ARIA labels, keyboard navigation
3. Consistency: Standard React patterns
4. Composability: Build complex UIs from simple components

APP TYPE: ${appType}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}
