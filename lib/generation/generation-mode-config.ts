// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATUS: DISABLED - Mode selection moved to explicit UI choice
// HTML-only for now. Next.js will be re-enabled when needed.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GENERATION MODE CONFIGURATION
 *
 * Determines whether to generate HTML/CSS or Next.js/TypeScript based on user request
 */

export type GenerationMode = 'html' | 'nextjs';

export interface GenerationModeDetection {
  mode: GenerationMode;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  features: {
    typescript: boolean;
    reactComponents: boolean;
    appRouter: boolean;
    serverComponents: boolean;
    apiRoutes: boolean;
    database: boolean;
  };
}

/**
 * Next.js keywords that indicate user wants a Next.js app
 */
const NEXTJS_KEYWORDS = [
  'next.js',
  'nextjs',
  'next js',
  'react',
  'typescript',
  'tsx',
  'app router',
  'server components',
  'server component',
  'client components',
  'client component',
  'api routes',
  'api route',
  'middleware',
  'server actions',
  'server action',
];

/**
 * HTML keywords that indicate user wants a static HTML site
 */
const HTML_KEYWORDS = [
  'static site',
  'static website',
  'landing page',
  'simple website',
  'html page',
  'html site',
  'single page',
  'portfolio site',
  'basic website',
];

/**
 * Feature keywords that map to specific Next.js features
 */
const FEATURE_KEYWORDS = {
  typescript: ['typescript', 'ts', 'tsx', 'type safety', 'typed'],
  reactComponents: ['react', 'component', 'jsx', 'tsx', 'hooks'],
  appRouter: ['app router', 'app directory', 'next 13', 'next 14', 'next 15'],
  serverComponents: ['server component', 'rsc', 'server-side'],
  apiRoutes: ['api', 'api route', 'endpoint', 'rest api', 'backend'],
  database: ['database', 'db', 'postgres', 'mysql', 'mongodb', 'prisma', 'supabase'],
};

/**
 * Detect generation mode from user description
 */
export function detectGenerationMode(userDescription: string): GenerationModeDetection {
  const lowerDesc = userDescription.toLowerCase();
  const reasons: string[] = [];
  let nextjsScore = 0;
  let htmlScore = 0;

  // Check for Next.js keywords
  for (const keyword of NEXTJS_KEYWORDS) {
    if (lowerDesc.includes(keyword)) {
      nextjsScore += 2;
      reasons.push(`Found Next.js keyword: "${keyword}"`);
    }
  }

  // Check for HTML keywords
  for (const keyword of HTML_KEYWORDS) {
    if (lowerDesc.includes(keyword)) {
      htmlScore += 1;
      reasons.push(`Found HTML keyword: "${keyword}"`);
    }
  }

  // Check for feature keywords
  const features = {
    typescript: FEATURE_KEYWORDS.typescript.some((k) => lowerDesc.includes(k)),
    reactComponents: FEATURE_KEYWORDS.reactComponents.some((k) => lowerDesc.includes(k)),
    appRouter: FEATURE_KEYWORDS.appRouter.some((k) => lowerDesc.includes(k)),
    serverComponents: FEATURE_KEYWORDS.serverComponents.some((k) => lowerDesc.includes(k)),
    apiRoutes: FEATURE_KEYWORDS.apiRoutes.some((k) => lowerDesc.includes(k)),
    database: FEATURE_KEYWORDS.database.some((k) => lowerDesc.includes(k)),
  };

  // Add feature scores
  if (features.typescript) nextjsScore += 3;
  if (features.reactComponents) nextjsScore += 3;
  if (features.appRouter) nextjsScore += 4;
  if (features.serverComponents) nextjsScore += 4;
  if (features.apiRoutes) nextjsScore += 2;

  // Determine mode and confidence
  let mode: GenerationMode;
  let confidence: 'high' | 'medium' | 'low';

  if (nextjsScore >= 5 && nextjsScore > htmlScore * 2) {
    mode = 'nextjs';
    confidence = 'high';
    reasons.push('Strong indicators for Next.js (TypeScript, React, modern features)');
  } else if (nextjsScore >= 2 && nextjsScore > htmlScore) {
    mode = 'nextjs';
    confidence = 'medium';
    reasons.push('Some Next.js indicators found');
  } else if (htmlScore > nextjsScore) {
    mode = 'html';
    confidence = 'high';
    reasons.push('HTML keywords found, no Next.js indicators');
  } else if (nextjsScore === 0 && htmlScore === 0) {
    // Default: Check for complexity
    const isComplex =
      lowerDesc.length > 200 ||
      lowerDesc.includes('dashboard') ||
      lowerDesc.includes('admin') ||
      lowerDesc.includes('authentication') ||
      lowerDesc.includes('user accounts');

    if (isComplex) {
      mode = 'nextjs';
      confidence = 'low';
      reasons.push('Complex application detected, defaulting to Next.js');
    } else {
      mode = 'html';
      confidence = 'low';
      reasons.push('Simple application, defaulting to HTML');
    }
  } else {
    mode = 'html';
    confidence = 'medium';
    reasons.push('Ambiguous, defaulting to HTML for simplicity');
  }

  return {
    mode,
    confidence,
    reasons,
    features,
  };
}

/**
 * Get generation prompt based on mode
 */
export function getGenerationPrompt(mode: GenerationMode): string {
  if (mode === 'nextjs') {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ NEXT.JS GENERATION MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are generating a NEXT.JS application with TypeScript.

PROJECT STRUCTURE:
\`\`\`
app/
  page.tsx           // Home page (Server Component)
  layout.tsx         // Root layout
  globals.css        // Global styles
  [other-pages]/
    page.tsx         // Other pages

components/
  [ComponentName].tsx // React components

lib/
  utils.ts           // Utility functions

public/
  images/            // Static assets
\`\`\`

TECHNOLOGY STACK:
- Next.js 14+ with App Router
- TypeScript
- React Server Components (default)
- Tailwind CSS
- shadcn/ui (for UI components)

CRITICAL RULES:
1. ✅ Use TypeScript (.tsx, .ts files)
2. ✅ Use App Router structure (app/ directory)
3. ✅ Server Components by default (no 'use client' unless needed)
4. ✅ Add 'use client' ONLY for: useState, useEffect, event handlers, browser APIs
5. ✅ Use proper TypeScript types for all props and functions
6. ✅ Use shadcn/ui components and Tailwind CSS for styling
7. ✅ Use Tailwind CSS for styling
8. ✅ Export components with proper types

FILE FORMAT:
Return files using this format:
---FILE:app/page.tsx---
export default function Home() {
  return <div>Content</div>
}
---ENDFILE---

---FILE:app/layout.tsx---
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
---ENDFILE---

COMPONENT EXAMPLE:
---FILE:components/Hero.tsx---
export function Hero() {
  return (
    <section className="bg-gradient-to-r from-blue-500 to-purple-600">
      <h1 className="text-4xl font-bold">Welcome</h1>
    </section>
  )
}
---ENDFILE---

CLIENT COMPONENT EXAMPLE (for interactivity):
---FILE:components/Counter.tsx---
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>
}
---ENDFILE---

Start generating NOW!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  } else {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 HTML GENERATION MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are generating a STATIC HTML website with CSS and JavaScript.

FILE STRUCTURE:
- index.html (main page)
- [other-pages].html (if multi-page)
- Inline CSS and JavaScript

TECHNOLOGY STACK:
- HTML5
- CSS3 (inline <style> tags or Tailwind CDN)
- Vanilla JavaScript (inline <script> tags)
- Tailwind CSS (via CDN)

CRITICAL RULES:
1. ✅ Start with <!DOCTYPE html>
2. ✅ Use complete, valid HTML5 structure
3. ✅ Include Tailwind CSS CDN in <head>
4. ✅ Use semantic HTML tags
5. ✅ Add inline CSS in <style> tags
6. ✅ Add JavaScript in <script> tags
7. ✅ Make it responsive (mobile-first)
8. ✅ No external file dependencies

SINGLE FILE FORMAT:
Return a complete HTML file:
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* Custom CSS here */
  </style>
</head>
<body>
  <!-- Content here -->
  <script>
    // JavaScript here
  </script>
</body>
</html>

MULTI-PAGE FORMAT:
---FILE:index.html---
<!DOCTYPE html>...
---ENDFILE---

---FILE:about.html---
<!DOCTYPE html>...
---ENDFILE---

Start generating NOW!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }
}

/**
 * Check if mode is explicitly requested
 */
export function isExplicitModeRequest(userDescription: string): GenerationMode | null {
  const lower = userDescription.toLowerCase();

  // Explicit Next.js request
  if (
    lower.includes('next.js app') ||
    lower.includes('nextjs app') ||
    lower.includes('react app') ||
    lower.includes('typescript app')
  ) {
    return 'nextjs';
  }

  // Explicit HTML request
  if (
    lower.includes('html page') ||
    lower.includes('html site') ||
    lower.includes('static website') ||
    lower.includes('landing page')
  ) {
    return 'html';
  }

  return null;
}
