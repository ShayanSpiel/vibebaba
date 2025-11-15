/**
 * CONSOLIDATED STRUCTURE & VALIDATION MODULE
 *
 * Combines validation for:
 * - File structure and links (original structure-validator.ts)
 * - Route completeness (from route-validator.ts)
 * - Import validation (from import-validator.ts)
 *
 * Previously separate files merged:
 * - structure-validator.ts (277 lines)
 * - route-validator.ts (308 lines)
 * - import-validator.ts (525 lines)
 */

import { getProjectRegistry } from '@/lib/registry/project-registry';
import { getLineNumber } from '@/lib/utils/validation';
import type { FileToValidate, ValidationError } from './types';

/**
 * Validate overall file structure
 */
export function validateStructure(
  files: FileToValidate[],
  isMultiPage: boolean
): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Check all HTML files have DOCTYPE
  errors.push(...validateDocTypes(files));

  // 2. Validate links between files
  if (isMultiPage) {
    errors.push(...validateLinks(files, isMultiPage));
  }

  // 3. Check for hash routing in multi-page apps
  if (isMultiPage) {
    errors.push(...validateNoHashRouting(files));
  }

  // 4. Check for missing .html extensions in multi-page apps
  if (isMultiPage) {
    errors.push(...validateHTMLExtensions(files));
  }

  // 5. Validate that script/style tags are closed
  errors.push(...validateClosedTags(files));

  return errors;
}

/**
 * Validate all HTML files have DOCTYPE
 */
function validateDocTypes(files: FileToValidate[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const file of files) {
    if (file.path.endsWith('.html')) {
      const trimmed = file.content.trim();
      if (!trimmed.toLowerCase().startsWith('<!doctype html>')) {
        errors.push({
          file: file.path,
          line: 1,
          column: 1,
          severity: 'error',
          message: 'Missing or incorrect DOCTYPE declaration',
          rule: 'doctype-first',
          autoFixable: true,
          suggestion: 'Add <!DOCTYPE html> at the beginning of the file',
        });
      }
    }
  }

  return errors;
}

/**
 * Validate links between files
 */
function validateLinks(files: FileToValidate[], isMultiPage: boolean): ValidationError[] {
  const errors: ValidationError[] = [];
  const fileNames = files.map((f) => f.path);

  for (const file of files) {
    if (!file.path.endsWith('.html')) continue;

    // Extract all href attributes
    const hrefRegex = /href=["']([^"']+)["']/gi;
    const matches = [...file.content.matchAll(hrefRegex)];

    for (const match of matches) {
      const href = match[1];

      // Skip external links
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
        continue;
      }

      // Skip anchor-only links (like href="#" or href="#top")
      if (href === '#' || (href.startsWith('#') && href.length < 10)) {
        continue;
      }

      // Check hash routing in multi-page apps (should not exist)
      if (isMultiPage && href.startsWith('#') && href.length > 1) {
        const line = getLineNumber(file.content, match.index || 0);
        errors.push({
          file: file.path,
          line,
          column: 1,
          severity: 'error',
          message: `Hash routing "${href}" should not be used in multi-page apps`,
          rule: 'no-hash-routing-multipage',
          autoFixable: false,
          suggestion: `Create a separate .html file instead of using hash routing`,
        });
      }

      // Check if target file exists (for .html links)
      if (href.endsWith('.html')) {
        if (!fileNames.includes(href)) {
          const line = getLineNumber(file.content, match.index || 0);
          errors.push({
            file: file.path,
            line,
            column: 1,
            severity: 'error',
            message: `Broken link: "${href}" not found in generated files`,
            rule: 'broken-link',
            autoFixable: false,
            suggestion: `Create ${href} or fix the link to an existing file: ${fileNames.filter((f) => f.endsWith('.html')).join(', ')}`,
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Check for hash routing patterns in multi-page apps
 * IMPORTANT: Only validate when explicitly told this is a MULTI-PAGE app
 * Single-page apps with sections are ALLOWED to have multiple divs with IDs
 */
function validateNoHashRouting(files: FileToValidate[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const file of files) {
    if (!file.path.endsWith('.html')) continue;

    const content = file.content.toLowerCase();

    // Check for hash routing indicators ONLY
    // NOTE: We only check for JavaScript-based routing (window.location.hash, hashchange)
    // We DO NOT check for multiple divs with IDs because:
    // - Single-page landing pages LEGITIMATELY have sections with IDs (hero, features, pricing)
    // - Only flag if actual routing code is detected
    const indicators = [
      { pattern: /window\.location\.hash/gim, message: 'Using window.location.hash for routing' },
      { pattern: /hashchange/gim, message: 'Using hashchange event for routing' },
      {
        pattern: /showpage|hidepage|togglepage/gim,
        message: 'Using show/hide page functions (single-page pattern)',
      },
    ];

    for (const { pattern, message } of indicators) {
      const matches = file.content.matchAll(pattern);
      for (const match of matches) {
        const line = getLineNumber(file.content, match.index || 0);
        errors.push({
          file: file.path,
          line,
          column: 1,
          severity: 'error',
          message: `${message} - this is a single-page pattern, not multi-page`,
          rule: 'no-hash-routing-multipage',
          autoFixable: false,
          suggestion: 'Use separate HTML files with <a href="page.html"> instead',
        });
      }
    }

    // REMOVED: No longer check for multiple divs with IDs
    // Reason: Single-page landing pages legitimately have multiple sections with IDs
    // (e.g., <div id="hero">, <div id="features">, <div id="pricing">)
  }

  return errors;
}

/**
 * Check for missing .html extensions in links
 */
function validateHTMLExtensions(files: FileToValidate[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const file of files) {
    if (!file.path.endsWith('.html')) continue;

    // Look for links without extensions (but not starting with # or http)
    const suspiciousLinkPattern = /href=["']([a-z-]+)["']/gi;
    const matches = file.content.matchAll(suspiciousLinkPattern);

    for (const match of matches) {
      const href = match[1];

      // Skip if it's just a hash, or if it already has an extension
      if (href.startsWith('#') || href.includes('.') || href.startsWith('http')) {
        continue;
      }

      // Check if this looks like a page name (common page names)
      const pageNames = [
        'home',
        'about',
        'contact',
        'pricing',
        'features',
        'services',
        'blog',
        'portfolio',
        'team',
        'faq',
      ];
      if (pageNames.includes(href.toLowerCase())) {
        const line = getLineNumber(file.content, match.index || 0);
        errors.push({
          file: file.path,
          line,
          column: 1,
          severity: 'error',
          message: `Missing .html extension in link: "${href}"`,
          rule: 'html-extension-required',
          autoFixable: true,
          suggestion: `Change href="${href}" to href="${href}.html"`,
        });
      }
    }
  }

  return errors;
}

/**
 * Validate that script and style tags are properly closed
 */
function validateClosedTags(files: FileToValidate[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const file of files) {
    if (!file.path.endsWith('.html')) continue;

    // Check script tags - count ALL script tags (both inline and with src)
    const openScripts = (file.content.match(/<script[^>]*>/gi) || []).length;
    const closeScripts = (file.content.match(/<\/script>/gi) || []).length;

    if (openScripts !== closeScripts) {
      errors.push({
        file: file.path,
        line: 1,
        column: 1,
        severity: 'error',
        message: `Unbalanced <script> tags: ${openScripts} opening, ${closeScripts} closing`,
        rule: 'tag-pair',
        autoFixable: false,
        suggestion: 'Ensure all <script> tags have matching </script> closing tags',
      });
    }

    // Check style tags
    const openStyles = (file.content.match(/<style[^>]*>/gi) || []).length;
    const closeStyles = (file.content.match(/<\/style>/gi) || []).length;

    if (openStyles !== closeStyles) {
      errors.push({
        file: file.path,
        line: 1,
        column: 1,
        severity: 'error',
        message: `Unbalanced <style> tags: ${openStyles} opening, ${closeStyles} closing`,
        rule: 'tag-pair',
        autoFixable: false,
        suggestion: 'Ensure all <style> tags have matching </style> closing tags',
      });
    }
  }

  return errors;
}

// ============================================================================
// ROUTE VALIDATION (from route-validator.ts)
// ============================================================================

/**
 * Extract all route references from code
 */
function extractRouteReferences(content: string, filePath: string): string[] {
  const routes: string[] = [];

  const linkMatches = content.matchAll(/<Link\s+href=["'{](['"`])(\/[^"'`}]+)\1[}'"]/gi);
  for (const match of linkMatches) {
    routes.push(match[2]);
  }

  const routerPushMatches = content.matchAll(
    /router\.(push|replace)\s*\(\s*['"`](\/[^'"`]+)['"`]/gi
  );
  for (const match of routerPushMatches) {
    routes.push(match[2]);
  }

  const dynamicMatches = content.matchAll(/href=\{`(\/[^`]+)`\}/gi);
  for (const match of dynamicMatches) {
    const baseRoute = match[1].replace(/\$\{[^}]+\}/g, '[param]');
    routes.push(baseRoute);
  }

  const concatMatches = content.matchAll(/href=\{['"`](\/[^'"`]+)['"`]\s*\+/gi);
  for (const match of concatMatches) {
    routes.push(match[1] + '[param]');
  }

  return routes;
}

function routeToFilePath(route: string): string {
  if (route === '/') {
    return 'src/app/page.tsx';
  }
  const cleanRoute = route.startsWith('/') ? route.slice(1) : route;
  return `src/app/${cleanRoute}/page.tsx`;
}

function routeFileExists(files: FileToValidate[], expectedPath: string): boolean {
  return files.some((file) => {
    const normalizedFilePath = file.path.replace(/\\/g, '/');
    const normalizedExpectedPath = expectedPath.replace(/\\/g, '/');
    return (
      normalizedFilePath === normalizedExpectedPath ||
      normalizedFilePath.endsWith('/' + normalizedExpectedPath)
    );
  });
}

export function validateRoutes(files: FileToValidate[]): ValidationError[] {
  console.log('[RouteValidator] Starting route completeness validation...');
  const errors: ValidationError[] = [];
  const allReferencedRoutes = new Set<string>();
  const routeToSourceFile = new Map<string, string[]>();

  for (const file of files) {
    if (!file.path.endsWith('.tsx') && !file.path.endsWith('.ts')) {
      continue;
    }
    const routes = extractRouteReferences(file.content, file.path);
    for (const route of routes) {
      allReferencedRoutes.add(route);
      if (!routeToSourceFile.has(route)) {
        routeToSourceFile.set(route, []);
      }
      routeToSourceFile.get(route)!.push(file.path);
    }
  }

  console.log(`[RouteValidator] Found ${allReferencedRoutes.size} unique route references`);

  for (const route of allReferencedRoutes) {
    if (
      route.startsWith('http') ||
      route.startsWith('#') ||
      route.startsWith('mailto:') ||
      route.startsWith('/api/')
    ) {
      continue;
    }
    if (route.includes('[param]') || route.includes('[id]') || route.includes('[slug]')) {
      console.log(`[RouteValidator] ℹ️  Skipping dynamic route: ${route}`);
      continue;
    }

    const expectedFilePath = routeToFilePath(route);
    const exists = routeFileExists(files, expectedFilePath);

    if (!exists) {
      const sourceFiles = routeToSourceFile.get(route) || [];
      errors.push({
        file: sourceFiles[0] || 'unknown',
        line: 0,
        message: `Route '${route}' is referenced but page file '${expectedFilePath}' does not exist`,
        rule: 'route-completeness',
        severity: 'warning',
        autoFixable: false,
        suggestion: `Create ${expectedFilePath} if this route should exist`,
      });
      console.log(`[RouteValidator] ⚠️  Missing page for route: ${route}`);
    }
  }

  if (errors.length === 0) {
    console.log('[RouteValidator] ✅ All routes have corresponding page files');
  }
  return errors;
}

// ============================================================================
// IMPORT VALIDATION (from import-validator.ts)
// ============================================================================

const REACT_HOOKS = [
  'useState',
  'useEffect',
  'useCallback',
  'useMemo',
  'useRef',
  'useContext',
  'useReducer',
  'useLayoutEffect',
  'useImperativeHandle',
];

const COMMON_LIBRARY_PATTERNS: Record<string, RegExp> = {
  'next/link': /^Link$/,
  'next/image': /^Image$/,
  'next/navigation': /^(useRouter|usePathname|useSearchParams|redirect|notFound)$/,
};

const DEFAULT_IMPORT_LIBRARIES = new Set(['next/link', 'next/image']);

function extractImports(content: string): Map<string, string> {
  const imports = new Map<string, string>();

  const namedImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = namedImportRegex.exec(content)) !== null) {
    const importedNames = match[1].split(',').map((n) => n.trim().replace(/^type\s+/, ''));
    const source = match[2];
    importedNames.forEach((name) => imports.set(name, source));
  }

  const defaultImportRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = defaultImportRegex.exec(content)) !== null) {
    imports.set(match[1], match[2]);
  }

  const namespaceImportRegex = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = namespaceImportRegex.exec(content)) !== null) {
    imports.set(match[1], match[2]);
  }

  return imports;
}

function extractJSXComponents(content: string): Set<string> {
  const components = new Set<string>();
  const cleanContent = content
    .replace(/React\.\w+Event<HTML\w+Element>/g, 'ReactEvent')
    .replace(/\bfunction\s+\w+<[^>]+>/g, 'function ')
    .replace(/\b<[A-Z](?:\s+extends\s+[^>]+)?>/g, '')
    .replace(/\b<[A-Z],\s*[A-Z](?:\s*,\s*[A-Z])*>/g, '')
    .replace(/use\w+<[^>]+>/g, '')
    .replace(/\b(Array|Set|Map|Promise|Record|Ref|RefObject)<[^>]+>/g, '')
    .replace(/\):\s*\w+<[^>]+>/g, '')
    .replace(/:\s*\w+<[^>]+>/g, '')
    .replace(/\b(interface|type)\s+\w+<[^>]+>/g, '')
    .replace(/extends\s+\w+<[^>]+>/g, '');

  const jsxRegex = /<([A-Z][a-zA-Z0-9]*)/g;
  let match;
  while ((match = jsxRegex.exec(cleanContent)) !== null) {
    components.add(match[1]);
  }

  return components;
}

export function validateImports(files: FileToValidate[]): ValidationError[] {
  console.log('[ImportValidator] Starting import validation...');
  const errors: ValidationError[] = [];

  for (const file of files) {
    if (!file.path.endsWith('.tsx') && !file.path.endsWith('.ts')) {
      continue;
    }

    const imports = extractImports(file.content);
    const isUtilityFile = file.path.match(/\/(lib|utils|config|types|constants|helpers)\//);
    const jsxComponents = isUtilityFile ? new Set<string>() : extractJSXComponents(file.content);

    const projectId = (files[0]?.path.match(/project-([^/]+)/) || [])[1];
    const registry = projectId ? getProjectRegistry(projectId) : null;

    for (const component of jsxComponents) {
      if (imports.has(component)) continue;

      if (registry) {
        const resolvedImport = registry.resolveImport(component);
        if (resolvedImport) {
          errors.push({
            file: file.path,
            line: 1,
            message: `Component '${component}' is used but not imported from '${resolvedImport.source}'`,
            rule: 'missing-jsx-component-import',
            severity: 'error',
            autoFixable: true,
            suggestion: `Add to imports: import ${resolvedImport.type === 'default' ? component : `{ ${component} }`} from '${resolvedImport.source}'`,
          });
        }
      }
    }

    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      const lucideImportMatch = line.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
      if (lucideImportMatch) {
        const importString = lucideImportMatch[1];
        if (/[A-Z][a-zA-Z0-9]*\s+[A-Z]/.test(importString)) {
          errors.push({
            file: file.path,
            line: lineNumber,
            message: `Malformed lucide-react import: missing commas between icon names`,
            rule: 'malformed-lucide-import',
            severity: 'error',
            autoFixable: true,
            suggestion: `Add commas between icon names: { Icon1, Icon2, Icon3 }`,
          });
        }
      }

      for (const hook of REACT_HOOKS) {
        const hookUsageRegex = new RegExp(`\\b${hook}\\s*\\(`, 'g');
        const isUsed = file.content.match(hookUsageRegex);
        if (isUsed) {
          const reactImportMatch = file.content.match(
            /import\s+\{([^}]+)\}\s+from\s+['"]react['"]/
          );
          if (!reactImportMatch || !reactImportMatch[1].includes(hook)) {
            errors.push({
              file: file.path,
              line: lineNumber,
              message: `'${hook}' is used but not imported from 'react'`,
              rule: 'missing-react-hook-import',
              severity: 'error',
              autoFixable: true,
              suggestion: `Add '${hook}' to the React import`,
            });
            break;
          }
        }
      }
    }
  }

  if (errors.length === 0) {
    console.log('[ImportValidator] ✅ All imports are valid');
  }
  return errors;
}
