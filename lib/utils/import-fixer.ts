/**
 * Import Fixer - AST-based import validation and auto-fixing
 *
 * Detects missing imports and automatically adds them
 * Focuses on lucide-react icons which are commonly missing
 */

import { VALID_LUCIDE_ICONS } from '@/lib/langgraph/prompts/lucide-icons';

export interface ImportIssue {
  line: number;
  identifier: string;
  suggestion: string;
  autoFixable: boolean;
}

export interface ImportFixResult {
  issues: ImportIssue[];
  fixedCode: string;
  fixes: string[];
}

/**
 * Find all JSX components used in code (e.g., <Plus />, <Check />)
 */
function findUsedJSXComponents(code: string): Set<string> {
  const components = new Set<string>();

  // Match self-closing tags: <Icon />
  const selfClosingRegex = /<([A-Z][a-zA-Z0-9]*)\s*\/>/g;
  let match;

  while ((match = selfClosingRegex.exec(code)) !== null) {
    components.add(match[1]);
  }

  // Match opening tags: <Icon>
  const openingTagRegex = /<([A-Z][a-zA-Z0-9]*)[>\s]/g;
  while ((match = openingTagRegex.exec(code)) !== null) {
    // Exclude closing tags
    if (!code.substring(match.index - 2, match.index).includes('/')) {
      components.add(match[1]);
    }
  }

  return components;
}

/**
 * Find all imports from lucide-react in the code
 */
function findLucideImports(code: string): Set<string> {
  const imports = new Set<string>();

  // Match: import { X, Check, Plus } from 'lucide-react'
  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/;
  const match = code.match(importRegex);

  if (match) {
    const importList = match[1];
    // Split by comma and clean up whitespace
    importList.split(',').forEach(item => {
      const cleaned = item.trim();
      if (cleaned) {
        imports.add(cleaned);
      }
    });
  }

  return imports;
}

/**
 * Find all identifiers that are already imported from ANY source
 * This prevents duplicate imports (e.g., Image from next/image AND lucide-react)
 */
function findAllImportedIdentifiers(code: string): Set<string> {
  const identifiers = new Set<string>();

  // Match all import statements: import { X, Y } from 'any-package'
  const namedImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"][^'"]+['"]/g;
  let match;

  while ((match = namedImportRegex.exec(code)) !== null) {
    const importList = match[1];
    importList.split(',').forEach(item => {
      const cleaned = item.trim().split(/\s+as\s+/)[0].trim(); // Handle "import { X as Y }"
      if (cleaned) {
        identifiers.add(cleaned);
      }
    });
  }

  // Match default imports: import X from 'any-package'
  const defaultImportRegex = /import\s+([A-Z][a-zA-Z0-9]*)\s+from\s+['"][^'"]+['"]/g;
  while ((match = defaultImportRegex.exec(code)) !== null) {
    identifiers.add(match[1]);
  }

  return identifiers;
}

/**
 * Detect missing lucide-react icon imports
 */
export function detectMissingIconImports(code: string): ImportFixResult {
  const issues: ImportIssue[] = [];
  const fixes: string[] = [];

  // Find all JSX components used
  const usedComponents = findUsedJSXComponents(code);

  // Find current lucide-react imports
  const currentImports = findLucideImports(code);

  // ✨ NEW: Find ALL imported identifiers (from any source)
  const allImportedIdentifiers = findAllImportedIdentifiers(code);

  // Check which components are valid lucide icons
  const missingIcons: string[] = [];

  usedComponents.forEach(component => {
    // Check if it's a valid lucide icon
    if (VALID_LUCIDE_ICONS.includes(component)) {
      // ✨ CRITICAL FIX: Check if it's already imported from lucide-react OR any other source
      // This prevents duplicate imports like Image (from next/image) being added to lucide-react
      if (!currentImports.has(component) && !allImportedIdentifiers.has(component)) {
        missingIcons.push(component);

        // Find first usage line for better error reporting
        const regex = new RegExp(`<${component}[>\\s/]`);
        const match = code.match(regex);
        const line = match ? code.substring(0, code.indexOf(match[0])).split('\n').length : 0;

        issues.push({
          line,
          identifier: component,
          suggestion: `Add '${component}' to lucide-react imports`,
          autoFixable: true
        });
      }
    }
  });

  // Auto-fix: Add missing imports
  let fixedCode = code;

  if (missingIcons.length > 0) {
    const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/;
    const match = code.match(importRegex);

    if (match) {
      // Existing lucide-react import found - add to it
      const allImports = [...currentImports, ...missingIcons].sort();
      const newImportList = allImports.join(', ');
      const newImportStatement = `import { ${newImportList} } from 'lucide-react'`;

      fixedCode = code.replace(match[0], newImportStatement);
      fixes.push(`Added ${missingIcons.join(', ')} to existing lucide-react import`);
    } else {
      // No lucide-react import - add new one after React import
      const reactImportRegex = /import\s+.*from\s+['"]react['"]/;
      const reactMatch = code.match(reactImportRegex);

      if (reactMatch) {
        const newImportStatement = `import { ${missingIcons.sort().join(', ')} } from 'lucide-react'\n`;
        const insertIndex = code.indexOf(reactMatch[0]) + reactMatch[0].length;
        fixedCode = code.substring(0, insertIndex) + '\n' + newImportStatement + code.substring(insertIndex);
        fixes.push(`Added new lucide-react import: ${missingIcons.join(', ')}`);
      } else {
        // No React import found - add at the top (after 'use client')
        const useClientRegex = /['"]use client['"]/;
        const useClientMatch = code.match(useClientRegex);

        if (useClientMatch) {
          const newImportStatement = `\nimport { ${missingIcons.sort().join(', ')} } from 'lucide-react'`;
          const insertIndex = code.indexOf(useClientMatch[0]) + useClientMatch[0].length;
          fixedCode = code.substring(0, insertIndex) + '\n' + newImportStatement + code.substring(insertIndex);
        } else {
          // Add at very top
          const newImportStatement = `import { ${missingIcons.sort().join(', ')} } from 'lucide-react'\n\n`;
          fixedCode = newImportStatement + code;
        }
        fixes.push(`Created new lucide-react import: ${missingIcons.join(', ')}`);
      }
    }
  }

  return {
    issues,
    fixedCode,
    fixes
  };
}

/**
 * Find all function calls that look like API calls
 * Pattern: await apiFunction(...) or apiFunction().then()
 */
function findApiCalls(code: string): Set<string> {
  const apiCalls = new Set<string>();

  // Pattern 1: await apiFunction(...)
  const awaitRegex = /await\s+([a-z][a-zA-Z0-9]*)\(/g;
  let match: RegExpExecArray | null;
  while ((match = awaitRegex.exec(code)) !== null) {
    apiCalls.add(match[1]);
  }

  // Pattern 2: apiFunction().then()
  const thenRegex = /([a-z][a-zA-Z0-9]*)\([^)]*\)\.then\(/g;
  while ((match = thenRegex.exec(code)) !== null) {
    apiCalls.add(match[1]);
  }

  // Pattern 3: Direct function call assignment: const data = functionName(...)
  const assignmentRegex = /(?:const|let|var)\s+\w+\s*=\s*([a-z][a-zA-Z0-9]*)\(/g;
  while ((match = assignmentRegex.exec(code)) !== null) {
    // Only include if it looks like an API call (camelCase starting with lowercase)
    const funcName = match[1];
    if (funcName.length > 3 && funcName.match(/^[a-z]/)) {
      apiCalls.add(funcName);
    }
  }

  return apiCalls;
}

/**
 * Find all imports from @/lib/api
 */
function findApiImports(code: string): Set<string> {
  const imports = new Set<string>();

  // Match: import { func1, func2 } from '@/lib/api'
  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]@\/lib\/api['"]/;
  const match = code.match(importRegex);

  if (match) {
    const importList = match[1];
    importList.split(',').forEach(item => {
      const cleaned = item.trim();
      if (cleaned) {
        imports.add(cleaned);
      }
    });
  }

  return imports;
}

/**
 * Detect missing API imports from @/lib/api
 */
function detectMissingApiImports(code: string): ImportFixResult {
  const issues: ImportIssue[] = [];
  const fixes: string[] = [];

  // Check if @/lib/api.ts is referenced (if not, no API imports needed)
  if (!code.includes('from \'@/lib/api\'') && !code.includes('from "@/lib/api"')) {
    // No API imports expected in this file
    return { issues, fixedCode: code, fixes };
  }

  // Find all function calls that might be API calls
  const apiCalls = findApiCalls(code);

  // Find current @/lib/api imports
  const currentImports = findApiImports(code);

  // Find missing imports
  const missingApiFunctions: string[] = [];

  apiCalls.forEach(funcName => {
    // Skip non-API functions (useState, useEffect, etc.)
    if (funcName.startsWith('use') || funcName === 'fetch' || funcName === 'console') {
      return;
    }

    // Check if it's already imported
    if (!currentImports.has(funcName)) {
      missingApiFunctions.push(funcName);

      // Find first usage line
      const regex = new RegExp(`\\b${funcName}\\(`);
      const match = code.match(regex);
      const line = match ? code.substring(0, code.indexOf(match[0])).split('\n').length : 0;

      issues.push({
        line,
        identifier: funcName,
        suggestion: `Add '${funcName}' to @/lib/api imports`,
        autoFixable: true
      });
    }
  });

  // Auto-fix: Add missing imports
  let fixedCode = code;

  if (missingApiFunctions.length > 0) {
    const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]@\/lib\/api['"]/;
    const match = code.match(importRegex);

    if (match) {
      // Existing @/lib/api import found - add to it
      const allImports = [...currentImports, ...missingApiFunctions].sort();
      const newImportList = allImports.join(', ');
      const newImportStatement = `import { ${newImportList} } from '@/lib/api'`;

      fixedCode = code.replace(match[0], newImportStatement);
      fixes.push(`Added ${missingApiFunctions.join(', ')} to existing @/lib/api import`);
    } else {
      // No @/lib/api import - this is unexpected if API calls exist, but add one
      const reactImportRegex = /import\s+.*from\s+['"]react['"]/;
      const reactMatch = code.match(reactImportRegex);

      if (reactMatch) {
        const newImportStatement = `\nimport { ${missingApiFunctions.sort().join(', ')} } from '@/lib/api'`;
        const insertIndex = code.indexOf(reactMatch[0]) + reactMatch[0].length;
        fixedCode = code.substring(0, insertIndex) + newImportStatement + code.substring(insertIndex);
        fixes.push(`Created new @/lib/api import: ${missingApiFunctions.join(', ')}`);
      } else {
        // Add after lucide-react import or at top
        const lucideImportRegex = /import\s+.*from\s+['"]lucide-react['"]/;
        const lucideMatch = code.match(lucideImportRegex);

        if (lucideMatch) {
          const newImportStatement = `\nimport { ${missingApiFunctions.sort().join(', ')} } from '@/lib/api'`;
          const insertIndex = code.indexOf(lucideMatch[0]) + lucideMatch[0].length;
          fixedCode = code.substring(0, insertIndex) + newImportStatement + code.substring(insertIndex);
          fixes.push(`Created new @/lib/api import: ${missingApiFunctions.join(', ')}`);
        }
      }
    }
  }

  return {
    issues,
    fixedCode,
    fixes
  };
}

/**
 * Validate and fix all imports in generated code
 */
export function validateAndFixImports(code: string): ImportFixResult {
  // Fix lucide-react icon imports
  const iconFixResult = detectMissingIconImports(code);

  // Fix @/lib/api imports
  const apiFixResult = detectMissingApiImports(iconFixResult.fixedCode);

  // Combine results
  return {
    issues: [...iconFixResult.issues, ...apiFixResult.issues],
    fixedCode: apiFixResult.fixedCode,
    fixes: [...iconFixResult.fixes, ...apiFixResult.fixes]
  };
}
