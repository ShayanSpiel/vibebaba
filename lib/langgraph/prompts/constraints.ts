/**
 * MINIMAL TypeScript Constraints for AI Code Generation
 * Philosophy: ENABLE AI NOT CONSTRAINT
 *
 * Only CRITICAL rules that prevent build failures.
 * Everything else is handled by post-generation validation.
 */

export const STRICT_TYPESCRIPT_RULES = `
CRITICAL TYPESCRIPT RULES:

1. 'use client' DIRECTIVE:
   - See shared-constraints.ts for complete 'use client' rules

2. NEXT.JS IMPORTS:
   - See routing-instructions.ts for complete Next.js import patterns and examples

3. TYPE SAFETY:
   - Type all function parameters and catch blocks (see shared-constraints.ts for detailed catch block patterns)
   - React events: React.FormEvent<HTMLFormElement>, React.ChangeEvent<HTMLInputElement>

4. FORBIDDEN IN FRONTEND:
   - NO process.env in client components (causes TypeScript errors)
   - NO backend packages: express, cors, mongoose, pg

5. useEffect PATTERNS:
   - See shared-constraints.ts CODE_STRUCTURE for complete useEffect patterns with async operations
`;

export const COMMON_ERROR_PATTERNS = `
COMMON BUILD FAILURES TO AVOID:

1. Missing imports - Every component/hook MUST be imported
2. Wrong import syntax - Check default vs named imports
3. 'use client' in wrong position - Must be line 1
`;

/**
 * Get full constraint text for AI prompts
 */
export function getTypeScriptConstraints(): string {
  return STRICT_TYPESCRIPT_RULES + '\n\n' + COMMON_ERROR_PATTERNS;
}

/**
 * Specific constraints for different file types
 */
export const FILE_TYPE_CONSTRAINTS = {
  'page.tsx': `Next.js page - needs 'use client' at top, default export`,
  'layout.tsx': `Next.js layout - server component unless providers needed`,
  'api/route.ts': `Next.js API route - server-side, export GET/POST/PUT/DELETE`,
  'components/*.tsx': `React component - 'use client' if using hooks`,
  'lib/*.ts': `Utility functions - no React hooks`
};
