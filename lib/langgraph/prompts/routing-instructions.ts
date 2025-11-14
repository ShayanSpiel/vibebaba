/**
 * NEXT.JS ROUTING & FILE STRUCTURE INSTRUCTIONS
 *
 * Clean, focused instructions for Next.js App Router with AI Autonomy
 */

export const ROUTING_INSTRUCTIONS = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT.JS APP ROUTER - FILE-BASED ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## FILE-BASED ROUTING

Next.js uses file-based routing in the \`app/\` directory:

- \`app/page.tsx\` → \`/\` (home page - REQUIRED!)
- \`app/about/page.tsx\` → \`/about\`
- \`app/blog/[id]/page.tsx\` → \`/blog/:id\` (dynamic route)
- \`app/dashboard/[...slug]/page.tsx\` → \`/dashboard/*\` (catch-all)
- \`app/api/users/route.ts\` → \`/api/users\` (API endpoint)

## STANDARD PROJECT STRUCTURE

\`\`\`
/
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── app/
│   ├── layout.tsx          (root layout - REQUIRED!)
│   ├── page.tsx            (home page - REQUIRED!)
│   ├── globals.css
│   ├── about/
│   │   └── page.tsx
│   ├── blog/
│   │   ├── page.tsx        (blog index)
│   │   └── [id]/
│   │       └── page.tsx    (blog post)
│   └── api/
│       └── users/
│           └── route.ts
├── components/
│   ├── ui/                 (Ant Design components)
│   └── ...
└── public/
    └── images/
\`\`\`

## NAVIGATION

\`\`\`typescript
import Link from 'next/link';

// Internal navigation
<Link href="/">Home</Link>
<Link href="/about">About</Link>
<Link href="/blog/123">Blog Post</Link>

// Programmatic navigation
'use client';
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/dashboard');
\`\`\`

## REQUIRED FILES

### app/layout.tsx (ROOT LAYOUT - MANDATORY!)
\`\`\`typescript
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
\`\`\`

### app/page.tsx (HOME PAGE - MANDATORY!)
\`\`\`typescript
export default function HomePage() {
  return (
    <main>
      <h1>Welcome</h1>
    </main>
  );
}
\`\`\`

## SERVER VS CLIENT COMPONENTS

See shared-constraints.ts CODE_STRUCTURE for complete server vs client component rules.

Quick Summary:
- Server Components: Default behavior, no 'use client' needed
- Client Components: Add 'use client' for interactivity (see shared-constraints.ts)

## DYNAMIC ROUTES

\`\`\`typescript
// app/blog/[id]/page.tsx
export default function BlogPost({ params }: { params: { id: string } }) {
  return <h1>Post {params.id}</h1>;
}
\`\`\`

## CRITICAL RULES

✓ \`app/layout.tsx\` is MANDATORY (root layout)
✓ \`app/page.tsx\` is MANDATORY (home page)
✓ Use \`<Link href="/path">\` for navigation
✓ Each route folder needs \`page.tsx\` to be accessible
✓ Server Components by default, \`'use client'\` only when needed
✓ Use Tailwind CSS for styling (inline classes)
✓ Use Ant Design components from \`antd\`

✗ NEVER use \`<a href>\` for internal routes
✗ NEVER forget \`app/layout.tsx\` and \`app/page.tsx\`
✗ NEVER name route files anything other than \`page.tsx\`
✗ NEVER add \`'use client'\` unless component needs interactivity

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

/**
 * Get routing-specific instructions
 */
export function getRoutingInstructions(): string {
  return ROUTING_INSTRUCTIONS;
}

/**
 * Get Next.js file structure template
 */
export function getFileStructureTemplate(): string {
  return `Next.js App Router: package.json, next.config.js, tailwind.config.ts, app/layout.tsx, app/page.tsx, app/[route]/page.tsx`;
}
