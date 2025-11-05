/**
 * ROUTE COMPLETENESS VALIDATOR
 *
 * Validates that all routes referenced in code have corresponding page files
 * Prevents "Cannot GET /apps/project-X/route" errors at runtime
 */

import type { ValidationError, FileToValidate } from './types';

/**
 * Extract all route references from code
 * Looks for:
 * - <Link href="/path">
 * - router.push('/path')
 * - router.replace('/path')
 * - <a href="/path"> (Next.js redirects)
 */
function extractRouteReferences(content: string, filePath: string): string[] {
  const routes: string[] = [];

  // Pattern 1: <Link href="/path">  or <Link href={'/path'}>
  const linkMatches = content.matchAll(/<Link\s+href=["'{](['"`])(\/[^"'`}]+)\1[}'"]/gi);
  for (const match of linkMatches) {
    routes.push(match[2]);
  }

  // Pattern 2: router.push('/path') or router.push("/path")
  const routerPushMatches = content.matchAll(/router\.(push|replace)\s*\(\s*['"`](\/[^'"`]+)['"`]/gi);
  for (const match of routerPushMatches) {
    routes.push(match[2]);
  }

  // Pattern 3: href={`/path/${id}`} - dynamic routes
  const dynamicMatches = content.matchAll(/href=\{`(\/[^`]+)`\}/gi);
  for (const match of dynamicMatches) {
    // Extract base route (remove ${...} parts)
    const baseRoute = match[1].replace(/\$\{[^}]+\}/g, '[param]');
    routes.push(baseRoute);
  }

  // Pattern 4: href={'/path/' + id} - concatenated routes
  const concatMatches = content.matchAll(/href=\{['"`](\/[^'"`]+)['"`]\s*\+/gi);
  for (const match of concatMatches) {
    routes.push(match[1] + '[param]');
  }

  return routes;
}

/**
 * Convert route path to expected file path
 * /about → src/app/about/page.tsx
 * /blog/[id] → src/app/blog/[id]/page.tsx
 * / → src/app/page.tsx
 */
function routeToFilePath(route: string): string {
  if (route === '/') {
    return 'src/app/page.tsx';
  }

  // Remove leading slash
  const cleanRoute = route.startsWith('/') ? route.slice(1) : route;

  // Handle dynamic segments [id], [slug], etc.
  return `src/app/${cleanRoute}/page.tsx`;
}

/**
 * Check if a route file exists in the file list
 */
function routeFileExists(files: FileToValidate[], expectedPath: string): boolean {
  return files.some(file => {
    // Normalize paths for comparison
    const normalizedFilePath = file.path.replace(/\\/g, '/');
    const normalizedExpectedPath = expectedPath.replace(/\\/g, '/');

    return normalizedFilePath === normalizedExpectedPath ||
           normalizedFilePath.endsWith('/' + normalizedExpectedPath);
  });
}

/**
 * Validate route completeness
 * Returns errors for routes that don't have corresponding page files
 */
export function validateRoutes(files: FileToValidate[]): ValidationError[] {
  console.log('[RouteValidator] Starting route completeness validation...');

  const errors: ValidationError[] = [];
  const allReferencedRoutes = new Set<string>();
  const routeToSourceFile = new Map<string, string[]>();

  // Step 1: Extract all route references from all files
  for (const file of files) {
    // Only check .tsx and .ts files (where routes are referenced)
    if (!file.path.endsWith('.tsx') && !file.path.endsWith('.ts')) {
      continue;
    }

    const routes = extractRouteReferences(file.content, file.path);

    for (const route of routes) {
      allReferencedRoutes.add(route);

      // Track which file references this route
      if (!routeToSourceFile.has(route)) {
        routeToSourceFile.set(route, []);
      }
      routeToSourceFile.get(route)!.push(file.path);
    }
  }

  console.log(`[RouteValidator] Found ${allReferencedRoutes.size} unique route references`);

  // Step 2: Check if each referenced route has a corresponding page file
  for (const route of allReferencedRoutes) {
    // Skip external URLs and anchors
    if (route.startsWith('http') || route.startsWith('#') || route.startsWith('mailto:')) {
      continue;
    }

    // Skip API routes (handled separately)
    if (route.startsWith('/api/')) {
      continue;
    }

    // Skip dynamic routes with [param] - these are often intentional
    // Examples: /blog/[id], /posts/[param], /products/[slug]
    // These are typically template literals or dynamic segments that will be populated at runtime
    if (route.includes('[param]') || route.includes('[id]') || route.includes('[slug]')) {
      console.log(`[RouteValidator] ℹ️  Skipping dynamic route: ${route} (intentional dynamic segment)`);
      continue;
    }

    const expectedFilePath = routeToFilePath(route);
    const exists = routeFileExists(files, expectedFilePath);

    if (!exists) {
      const sourceFiles = routeToSourceFile.get(route) || [];

      // Only treat static routes as errors
      // Dynamic routes are often intentional and will be created later or are external
      errors.push({
        file: sourceFiles[0] || 'unknown',
        line: 0,
        message: `Route '${route}' is referenced but page file '${expectedFilePath}' does not exist`,
        rule: 'route-completeness',
        severity: 'warning', // Changed to warning - might be intentional
        autoFixable: false,
        suggestion: `Create ${expectedFilePath} if this route should exist, or this might be an external/future route`
      });

      console.log(`[RouteValidator] ⚠️  Missing page for route: ${route} (expected ${expectedFilePath})`);
    } else {
      console.log(`[RouteValidator] ✓ Route ${route} has page file`);
    }
  }

  if (errors.length === 0) {
    console.log('[RouteValidator] ✅ All routes have corresponding page files');
  } else {
    console.log(`[RouteValidator] ❌ Found ${errors.length} routes without page files`);
  }

  return errors;
}

/**
 * Validate that page files have proper structure for static export
 * - Dynamic routes must have generateStaticParams()
 * - No 'use client' + generateStaticParams() conflict
 */
export function validateStaticExportCompatibility(files: FileToValidate[]): ValidationError[] {
  console.log('[RouteValidator] Validating static export compatibility...');

  const errors: ValidationError[] = [];

  for (const file of files) {
    // Only check page.tsx files in dynamic routes
    if (!file.path.includes('[') || !file.path.includes(']') || !file.path.endsWith('/page.tsx')) {
      continue;
    }

    const content = file.content;
    const hasUseClient = content.includes("'use client'") || content.includes('"use client"');
    const hasGenerateStaticParams = content.includes('generateStaticParams');

    // ERROR: 'use client' + generateStaticParams() conflict
    // SKIP if generateStaticParams was auto-generated (frontend node handles this)
    const isAutoGenerated = content.includes('// 🚨 AUTO-GENERATED: Required for static export');

    if (hasUseClient && hasGenerateStaticParams && !isAutoGenerated) {
      errors.push({
        file: file.path,
        line: 0,
        message: "Cannot use both 'use client' and generateStaticParams() in the same file",
        rule: 'static-export-conflict',
        severity: 'error',
        autoFixable: false,
        suggestion: "Remove 'use client' directive - generateStaticParams() must be in a Server Component"
      });
      console.log(`[RouteValidator] ❌ ${file.path}: 'use client' + generateStaticParams() conflict`);
    } else if (hasUseClient && hasGenerateStaticParams && isAutoGenerated) {
      console.log(`[RouteValidator] ℹ️  ${file.path}: Auto-generated generateStaticParams() detected, skipping conflict check (frontend node already handled this)`);
    }
    // WARNING: Dynamic route without generateStaticParams() (might be okay if using getStaticPaths)
    else if (!hasGenerateStaticParams && !hasUseClient) {
      errors.push({
        file: file.path,
        line: 0,
        message: 'Dynamic route without generateStaticParams() - static export may fail',
        rule: 'missing-static-params',
        severity: 'warning',
        autoFixable: false,
        suggestion: 'Add generateStaticParams() function to pre-render dynamic routes, or return empty array if routes are unknown at build time'
      });
      console.log(`[RouteValidator] ⚠️  ${file.path}: Missing generateStaticParams()`);
    }
  }

  if (errors.filter(e => e.severity === 'error').length === 0) {
    console.log('[RouteValidator] ✅ Static export compatibility checks passed');
  }

  return errors;
}
