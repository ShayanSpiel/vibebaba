/**
 * IMPORT VALIDATOR
 *
 * Validates import statements and catches common errors:
 * - Invalid imports from lucide-react (Logo, etc.)
 * - Missing React hooks imports (useEffect, useCallback, etc.)
 * - Duplicate imports
 * - Missing JSX component imports (uses registry for resolution)
 */

import {
  getReplacementIcon,
  isValidLucideIcon,
  VALID_LUCIDE_ICONS,
} from '@/lib/langgraph/prompts/lucide-icons';
import { getProjectRegistry } from '@/lib/registry/project-registry';
import type { FileToValidate, ValidationError } from './types';

/**
 * React hooks that are commonly used
 */
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

/**
 * Extract all imports from a file
 */
function extractImports(content: string): Map<string, string> {
  const imports = new Map<string, string>(); // component -> source

  // Match: import { X, Y, Z } from 'source'
  const namedImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = namedImportRegex.exec(content)) !== null) {
    const importedNames = match[1].split(',').map((n) => n.trim().replace(/^type\s+/, ''));
    const source = match[2];
    importedNames.forEach((name) => imports.set(name, source));
  }

  // Match: import X from 'source'
  const defaultImportRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = defaultImportRegex.exec(content)) !== null) {
    imports.set(match[1], match[2]);
  }

  // Match: import * as X from 'source'
  const namespaceImportRegex = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = namespaceImportRegex.exec(content)) !== null) {
    imports.set(match[1], match[2]);
  }

  return imports;
}

/**
 * Extract all JSX components used in a file
 */
function extractJSXComponents(content: string): Set<string> {
  const components = new Set<string>();

  // Remove TypeScript generic type annotations to avoid false positives
  // This prevents matching <Product> in useState<Product> or Array<CartItem>
  const cleanContent = content
    // Remove React event types with HTML elements: React.FormEvent<HTMLFormElement>, React.ChangeEvent<HTMLInputElement>
    .replace(/React\.\w+Event<HTML\w+Element>/g, 'ReactEvent')
    // Remove function generics: function foo<T>, <T extends X>, <T, U>
    .replace(/\bfunction\s+\w+<[^>]+>/g, 'function ')
    .replace(/\b<[A-Z](?:\s+extends\s+[^>]+)?>/g, '') // <T>, <T extends X>
    .replace(/\b<[A-Z],\s*[A-Z](?:\s*,\s*[A-Z])*>/g, '') // <T, U>, <T, U, V>
    // Remove useState<Type>, useRef<Type>, etc.
    .replace(/use\w+<[^>]+>/g, '')
    // Remove Array<Type>, Set<Type>, Map<Type>, etc.
    .replace(/\b(Array|Set|Map|Promise|Record|Ref|RefObject)<[^>]+>/g, '')
    // Remove function return types: ): Type<Generic>
    .replace(/\):\s*\w+<[^>]+>/g, '')
    // Remove type annotations: const x: Type<Generic>
    .replace(/:\s*\w+<[^>]+>/g, '')
    // Remove interface/type definitions: interface Foo<T>
    .replace(/\b(interface|type)\s+\w+<[^>]+>/g, '')
    // Remove generic constraints: extends SomeType<T>
    .replace(/extends\s+\w+<[^>]+>/g, '');

  // Match: <ComponentName or <ComponentName.SubComponent
  const jsxRegex = /<([A-Z][a-zA-Z0-9]*)/g;
  let match;
  while ((match = jsxRegex.exec(cleanContent)) !== null) {
    components.add(match[1]);
  }

  return components;
}

/**
 * Common libraries and their typical components
 * Used to suggest where missing imports should come from
 *
 * NOTE: lucide-react pattern REMOVED - was too broad (/^[A-Z][a-zA-Z0-9]*$/)
 * It matched ALL PascalCase names (types, components, etc.), causing false suggestions
 * Now relies ONLY on registry whitelist for lucide icons
 */
const COMMON_LIBRARY_PATTERNS: Record<string, RegExp> = {
  // 'lucide-react': /^[A-Z][a-zA-Z0-9]*$/,  // REMOVED: Too broad, use registry instead
  'next/link': /^Link$/,
  'next/image': /^Image$/,
  'next/navigation': /^(useRouter|usePathname|useSearchParams|redirect|notFound)$/,
  '@radix-ui/react-dialog': /^Dialog$/,
  '@radix-ui/react-toast': /^Toast$/,
};

/**
 * Libraries that use DEFAULT imports instead of named imports
 * CRITICAL: next/link uses 'import Link from "next/link"' NOT 'import { Link }'
 */
const DEFAULT_IMPORT_LIBRARIES = new Set(['next/link', 'next/image']);

/**
 * Validate imports in TypeScript/JavaScript files
 */
export function validateImports(files: FileToValidate[]): ValidationError[] {
  console.log('[ImportValidator] Starting import validation...');

  const errors: ValidationError[] = [];

  for (const file of files) {
    // Only check .tsx and .ts files
    if (!file.path.endsWith('.tsx') && !file.path.endsWith('.ts')) {
      continue;
    }

    // CRITICAL: Check for missing JSX component imports using REGISTRY
    const imports = extractImports(file.content);

    // Skip JSX validation for utility files (no JSX/components)
    // These are non-component files that should never have JSX
    const isUtilityFile = file.path.match(/\/(lib|utils|config|types|constants|helpers)\//);
    const jsxComponents = isUtilityFile ? new Set<string>() : extractJSXComponents(file.content);

    // Try to get registry for this project
    const projectId = (files[0]?.path.match(/project-([^/]+)/) || [])[1];
    const registry = projectId ? getProjectRegistry(projectId) : null;

    for (const component of jsxComponents) {
      if (imports.has(component)) continue; // Already imported

      // FIRST: Check if it's a known Next.js or library component
      let foundInCommonLibrary = false;
      for (const [library, pattern] of Object.entries(COMMON_LIBRARY_PATTERNS)) {
        if (pattern.test(component)) {
          const importType = DEFAULT_IMPORT_LIBRARIES.has(library) ? 'default' : 'named';
          errors.push({
            file: file.path,
            line: 1,
            message: `Component '${component}' is used but not imported from '${library}'`,
            rule: 'missing-jsx-component-import',
            severity: 'error',
            autoFixable: true,
            suggestion: `Add to imports: import ${importType === 'default' ? component : `{ ${component} }`} from '${library}'`,
          });
          console.log(
            `[ImportValidator] 🔍 NEXT.JS/LIBRARY: '${component}' needs to be imported from '${library}'`
          );
          foundInCommonLibrary = true;
          break;
        }
      }
      if (foundInCommonLibrary) continue;

      // SECOND: Check if it's a valid Lucide icon
      if (isValidLucideIcon(component)) {
        errors.push({
          file: file.path,
          line: 1,
          message: `Icon '${component}' is used but not imported from 'lucide-react'`,
          rule: 'missing-jsx-component-import',
          severity: 'error',
          autoFixable: true,
          suggestion: `Add to imports: import { ${component} } from 'lucide-react'`,
        });
        console.log(
          `[ImportValidator] 🔍 LUCIDE ICON: '${component}' needs to be imported from 'lucide-react'`
        );
        continue;
      }

      // THIRD: Check if it's an INVALID Lucide icon that should be replaced
      const replacement = getReplacementIcon(component, null as any);
      if (replacement && replacement !== 'Circle') {
        // This is a known invalid icon with a specific replacement
        errors.push({
          file: file.path,
          line: 1,
          message: `Invalid icon '${component}' found in JSX. Will auto-replace with '${replacement}' and import from 'lucide-react'`,
          rule: 'invalid-lucide-icon-jsx',
          severity: 'warning',
          autoFixable: true,
          suggestion: `Replace '${component}' with '${replacement}' in JSX and add to lucide-react imports`,
        });
        console.log(
          `[ImportValidator] ⚠️  INVALID ICON in JSX: '${component}' will be replaced with '${replacement}'`
        );
        continue;
      }

      // FOURTH: USE REGISTRY to resolve import
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

          console.log(
            `[ImportValidator] 🔍 REGISTRY RESOLUTION: '${component}' → '${resolvedImport.source}'`
          );
        } else {
          // Component not in registry and not external - might be a lucide icon typo
          // Try to find a replacement
          const fallbackReplacement = getReplacementIcon(component, 'Circle');
          errors.push({
            file: file.path,
            line: 1,
            message: `Unknown component '${component}'. Will replace with lucide icon '${fallbackReplacement}'`,
            rule: 'unknown-component-replaced',
            severity: 'warning',
            autoFixable: true,
            suggestion: `Replace '${component}' with '${fallbackReplacement}' and import from 'lucide-react'`,
          });

          console.log(
            `[ImportValidator] 🔄 UNKNOWN COMPONENT: '${component}' will be replaced with '${fallbackReplacement}'`
          );
        }
      } else {
        // Fallback to old behavior if no registry
        let suggestedLibrary = 'unknown';
        for (const [library, pattern] of Object.entries(COMMON_LIBRARY_PATTERNS)) {
          if (pattern.test(component)) {
            suggestedLibrary = library;
            break;
          }
        }

        // CRITICAL: Use correct import syntax (default vs named)
        const isDefaultImport = DEFAULT_IMPORT_LIBRARIES.has(suggestedLibrary);
        const importSyntax = isDefaultImport
          ? `import ${component} from '${suggestedLibrary}'`
          : `import { ${component} } from '${suggestedLibrary}'`;

        errors.push({
          file: file.path,
          line: 1,
          message: `Component '${component}' is used but not imported (likely from '${suggestedLibrary}')`,
          rule: 'missing-jsx-component-import',
          severity: 'error',
          autoFixable: suggestedLibrary !== 'unknown',
          suggestion:
            suggestedLibrary !== 'unknown'
              ? `Add to imports: ${importSyntax}`
              : `Import '${component}' from the appropriate library`,
        });
      }
    }

    const lines = file.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check 1: Lucide-react validation (syntax, icon names)
      const lucideImportMatch = line.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
      if (lucideImportMatch) {
        const importString = lucideImportMatch[1];

        // Check for syntax issues (missing commas)
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
          console.log(
            `[ImportValidator] ❌ ${file.path}:${lineNumber}: Malformed lucide import (missing commas)`
          );
        }

        // Check for invalid icon names
        const iconNames = importString.split(',').map((n) => n.trim());
        for (const iconName of iconNames) {
          if (iconName && !isValidLucideIcon(iconName)) {
            const replacement = getReplacementIcon(iconName);
            errors.push({
              file: file.path,
              line: lineNumber,
              message: `Invalid lucide-react icon '${iconName}'. Will auto-replace with '${replacement}'.`,
              rule: 'invalid-lucide-icon',
              severity: 'warning',
              autoFixable: true,
              suggestion: `Replace '${iconName}' with '${replacement}' in imports and JSX`,
            });
            console.log(
              `[ImportValidator] ⚠️  ${file.path}:${lineNumber}: Invalid icon '${iconName}' will be replaced with '${replacement}'`
            );
          }
        }
      }

      // Check 2: Missing React hook imports
      // Check if React hooks are used in the file but not imported
      for (const hook of REACT_HOOKS) {
        const hookUsageRegex = new RegExp(`\\b${hook}\\s*\\(`, 'g');
        const isUsed = file.content.match(hookUsageRegex);

        if (isUsed) {
          // Check if it's imported from 'react'
          const reactImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]react['"]/;
          const reactImportMatch = file.content.match(reactImportRegex);

          if (!reactImportMatch || !reactImportMatch[1].includes(hook)) {
            errors.push({
              file: file.path,
              line: lineNumber,
              message: `'${hook}' is used but not imported from 'react'`,
              rule: 'missing-react-hook-import',
              severity: 'error',
              autoFixable: true,
              suggestion: `Add '${hook}' to the React import: import { ..., ${hook} } from 'react'`,
            });
            console.log(`[ImportValidator] ❌ ${file.path}: Missing React hook import '${hook}'`);
            break; // Only report once per file
          }
        }
      }

      // Check 3: Wrong import syntax (named vs default)
      // CRITICAL: Detect 'import { Link } from "next/link"' instead of 'import Link from "next/link"'
      for (const library of Object.keys(COMMON_LIBRARY_PATTERNS)) {
        if (DEFAULT_IMPORT_LIBRARIES.has(library)) {
          // This library requires default imports
          const wrongSyntaxMatch = line.match(
            new RegExp(
              `import\\s+\\{\\s*([^}]+)\\}\\s+from\\s+['"]${library.replace(/\//g, '\\/')}['"]`
            )
          );
          if (wrongSyntaxMatch) {
            const component = wrongSyntaxMatch[1].trim();
            errors.push({
              file: file.path,
              line: lineNumber,
              message: `Wrong import syntax for '${component}' from '${library}'. Use default import instead of named import.`,
              rule: 'wrong-import-syntax',
              severity: 'error',
              autoFixable: true,
              suggestion: `Change to: import ${component} from '${library}'`,
            });
            console.log(
              `[ImportValidator] ❌ ${file.path}:${lineNumber}: Wrong import syntax - should be default import`
            );
          }
        }
      }

      // Check 4: Duplicate imports
      const importMatches = line.matchAll(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g);
      for (const match of importMatches) {
        const imports = match[1].split(',').map((s) => s.trim());
        const source = match[2];

        // Check for duplicates within the same import statement
        const seen = new Set<string>();
        for (const imp of imports) {
          if (seen.has(imp)) {
            errors.push({
              file: file.path,
              line: lineNumber,
              message: `Duplicate import '${imp}' from '${source}'`,
              rule: 'duplicate-import',
              severity: 'error',
              autoFixable: true,
              suggestion: `Remove duplicate '${imp}' from imports`,
            });
            console.log(
              `[ImportValidator] ❌ ${file.path}:${lineNumber}: Duplicate import '${imp}'`
            );
          }
          seen.add(imp);
        }
      }
    }
  }

  if (errors.length === 0) {
    console.log('[ImportValidator] ✅ All imports are valid');
  } else {
    console.log(`[ImportValidator] ❌ Found ${errors.length} import issues`);
  }

  return errors;
}

/**
 * Auto-fix import errors
 */
export function fixImportErrors(
  files: FileToValidate[],
  errors: ValidationError[]
): FileToValidate[] {
  console.log('[ImportValidator] Auto-fixing import errors...');

  const fixedFiles = [...files];

  for (const error of errors) {
    if (!error.autoFixable) continue;

    const fileIndex = fixedFiles.findIndex((f) => f.path === error.file);
    if (fileIndex === -1) continue;

    const file = fixedFiles[fileIndex];
    const lines = file.content.split('\n');

    // CRITICAL FIX: Auto-add missing JSX component imports
    if (error.rule === 'missing-jsx-component-import') {
      const componentMatch = error.message.match(/'([^']+)'/);
      const libraryMatch = error.message.match(/from '([^']+)'/);

      if (componentMatch && libraryMatch) {
        const component = componentMatch[1];
        const library = libraryMatch[1];

        // CRITICAL: Validate lucide-react imports before auto-fixing
        if (library === 'lucide-react') {
          // Extract projectId from file path
          const projectIdMatch = error.file.match(/project-([^/]+)/);
          const projectId = projectIdMatch ? projectIdMatch[1] : null;
          const registry = projectId ? getProjectRegistry(projectId) : null;

          // Only auto-fix if component is in the known lucide icons whitelist
          if (!registry?.isLucideIcon(component)) {
            console.log(
              `[ImportValidator] ⚠️  Skipping auto-fix: '${component}' is not a lucide-react icon`
            );
            console.log(
              `[ImportValidator] 💡 If this is a type/component, define it locally instead`
            );
            continue; // Skip this fix
          }
        }

        // CRITICAL: Determine if this should be a default or named import
        const isDefaultImport = DEFAULT_IMPORT_LIBRARIES.has(library);

        // Find where to insert the import (after existing imports)
        let insertIndex = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('import ')) {
            insertIndex = i + 1;
          }
        }

        // Check if there's already an import from this library
        let addedToExisting = false;

        // For default imports (like next/link), NEVER merge with existing imports
        // For named imports, try to merge
        if (!isDefaultImport) {
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(`from '${library}'`) || lines[i].includes(`from "${library}"`)) {
              // Add to existing import
              const match = lines[i].match(/import\s+\{([^}]+)\}/);
              if (match) {
                const existingImports = match[1].trim();
                lines[i] = lines[i].replace(
                  `{ ${existingImports} }`,
                  `{ ${existingImports}, ${component} }`
                );
                addedToExisting = true;
                console.log(
                  `[ImportValidator] 🔧 CRITICAL FIX: Added '${component}' to existing ${library} import`
                );
                break;
              }
            }
          }
        }

        // If not added to existing, create new import with correct syntax
        if (!addedToExisting) {
          const newImport = isDefaultImport
            ? `import ${component} from '${library}';`
            : `import { ${component} } from '${library}';`;

          lines.splice(insertIndex, 0, newImport);
          console.log(
            `[ImportValidator] 🔧 CRITICAL FIX: Created new ${isDefaultImport ? 'DEFAULT' : 'NAMED'} import for '${component}' from '${library}'`
          );
        }

        fixedFiles[fileIndex] = {
          ...file,
          content: lines.join('\n'),
        };
        continue;
      }
    }

    if (error.rule === 'wrong-import-syntax') {
      // Fix wrong import syntax (named → default)
      const componentMatch = error.message.match(/'([^']+)'/);
      const libraryMatch = error.message.match(/from '([^']+)'/);

      if (componentMatch && libraryMatch) {
        const component = componentMatch[1];
        const library = libraryMatch[1];

        for (let i = 0; i < lines.length; i++) {
          // Find the wrong import line
          const wrongImportRegex = new RegExp(
            `import\\s+\\{\\s*${component}\\s*\\}\\s+from\\s+['"]${library.replace(/\//g, '\\/')}['"]`
          );
          if (wrongImportRegex.test(lines[i])) {
            // Replace with correct default import syntax
            lines[i] = lines[i].replace(wrongImportRegex, `import ${component} from '${library}'`);
            console.log(
              `[ImportValidator] 🔧 Fixed: Changed named import to default import for '${component}' from '${library}'`
            );
            break;
          }
        }
      }
    } else if (error.rule === 'malformed-lucide-import') {
      // Fix missing commas in lucide-react imports
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('lucide-react')) {
          const match = lines[i].match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
          if (match) {
            let importString = match[1];

            // Step 1: Remove empty import slots (syntax errors)
            importString = importString.replace(/,\s*,/g, ','); // ,, → ,
            importString = importString.replace(/{\s*,/g, '{'); // {, → {
            importString = importString.replace(/,\s*}/g, '}'); // ,} → }

            // Step 2: Add commas between adjacent icon names
            while (/\b([A-Z][a-zA-Z0-9]*)\s+([A-Z][a-zA-Z0-9]*)\b/.test(importString)) {
              importString = importString.replace(
                /\b([A-Z][a-zA-Z0-9]*)\s+([A-Z][a-zA-Z0-9]*)\b/,
                '$1, $2'
              );
            }

            // Step 3: Final cleanup - remove any resulting double commas
            importString = importString.replace(/,\s*,/g, ',');
            importString = importString.trim();

            lines[i] = lines[i].replace(match[1], importString);
            console.log(
              `[ImportValidator] 🔧 Fixed: Cleaned up lucide-react import (removed empty slots, added commas)`
            );
          }
          break;
        }
      }
    } else if (error.rule === 'invalid-lucide-icon') {
      // Replace invalid icon in imports and JSX
      const invalidIconMatch = error.message.match(/Invalid lucide-react icon '([^']+)'/);
      const replacementMatch = error.message.match(/auto-replace with '([^']+)'/);

      if (invalidIconMatch && replacementMatch) {
        const invalidIcon = invalidIconMatch[1];
        const replacement = replacementMatch[1];

        // Step 1: Replace in import statement
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('lucide-react')) {
            const match = lines[i].match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
            if (match && match[1].includes(invalidIcon)) {
              // Replace icon name in import list
              const importString = match[1];
              const updatedImports = importString
                .split(',')
                .map((icon) => (icon.trim() === invalidIcon ? replacement : icon.trim()))
                .join(', ');

              lines[i] = lines[i].replace(match[1], updatedImports);
              console.log(
                `[ImportValidator] 🔧 Fixed: Replaced '${invalidIcon}' with '${replacement}' in lucide-react imports`
              );
              break;
            }
          }
        }

        // Step 2: Replace all JSX usages in the file
        let replacementCount = 0;
        for (let i = 0; i < lines.length; i++) {
          // Match: <InvalidIcon ... />
          const jsxPattern = new RegExp(`<${invalidIcon}(\\s|>)`, 'g');
          if (jsxPattern.test(lines[i])) {
            lines[i] = lines[i].replace(jsxPattern, `<${replacement}$1`);
            replacementCount++;
          }
        }

        if (replacementCount > 0) {
          console.log(
            `[ImportValidator] 🔧 Fixed: Replaced ${replacementCount} JSX usage(s) of '${invalidIcon}' with '${replacement}'`
          );
        }
      }
    } else if (
      error.rule === 'invalid-lucide-icon-jsx' ||
      error.rule === 'unknown-component-replaced'
    ) {
      // Replace invalid icon used in JSX but not in imports
      const componentMatch = error.message.match(/(Invalid icon|Unknown component) '([^']+)'/);
      const replacementMatch = error.message.match(/replace with (?:lucide icon )?'([^']+)'/);

      if (componentMatch && replacementMatch) {
        const invalidComponent = componentMatch[2];
        const replacement = replacementMatch[1];

        // Step 1: Replace all JSX usages
        let replacementCount = 0;
        for (let i = 0; i < lines.length; i++) {
          const jsxPattern = new RegExp(`<${invalidComponent}(\\s|>|/)`, 'g');
          if (jsxPattern.test(lines[i])) {
            lines[i] = lines[i].replace(jsxPattern, `<${replacement}$1`);
            replacementCount++;
          }
        }

        if (replacementCount > 0) {
          console.log(
            `[ImportValidator] 🔧 Fixed: Replaced ${replacementCount} JSX usage(s) of '${invalidComponent}' with '${replacement}'`
          );
        }

        // Step 2: Add to lucide-react imports (will be handled by missing-jsx-component-import fix)
        // We need to add the replacement icon to lucide imports
        let lucideImportAdded = false;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('lucide-react')) {
            const match = lines[i].match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
            if (match) {
              const existingImports = match[1].split(',').map((icon) => icon.trim());
              if (!existingImports.includes(replacement)) {
                const updatedImports = [...existingImports, replacement].join(', ');
                lines[i] = lines[i].replace(match[1], updatedImports);
                console.log(
                  `[ImportValidator] 🔧 Fixed: Added '${replacement}' to lucide-react imports`
                );
                lucideImportAdded = true;
              }
              break;
            }
          }
        }

        // If no lucide-react import exists, create one
        if (!lucideImportAdded) {
          // Find where to insert (after other imports)
          let insertIndex = 0;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('import ')) {
              insertIndex = i + 1;
            }
          }
          lines.splice(insertIndex, 0, `import { ${replacement} } from 'lucide-react';`);
          console.log(
            `[ImportValidator] 🔧 Fixed: Created lucide-react import with '${replacement}'`
          );
        }
      }
    } else if (error.rule === 'missing-react-hook-import') {
      // Add missing hook to React import
      const missingHook = error.message.match(/'([^']+)'/)?.[1];
      if (!missingHook) continue;

      for (let i = 0; i < lines.length; i++) {
        const reactImportMatch = lines[i].match(/import\s+\{([^}]+)\}\s+from\s+['"]react['"]/);
        if (reactImportMatch) {
          const currentImports = reactImportMatch[1];
          lines[i] = lines[i].replace(
            reactImportMatch[0],
            `import { ${currentImports}, ${missingHook} } from 'react'`
          );

          console.log(`[ImportValidator] 🔧 Fixed: Added '${missingHook}' to React imports`);
          break;
        }
      }
    } else if (error.rule === 'duplicate-import') {
      // Remove duplicate import
      const duplicateImport = error.message.match(/'([^']+)'/)?.[1];
      if (!duplicateImport) continue;

      // CRITICAL FIX: Properly parse and deduplicate import list
      for (let i = 0; i < lines.length; i++) {
        const importMatch = lines[i].match(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/);
        if (importMatch && importMatch[1].includes(duplicateImport)) {
          const [fullMatch, importList, source] = importMatch;

          // Parse import list into array
          const imports = importList
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);

          // Remove duplicates while preserving order
          const uniqueImports = Array.from(new Set(imports));

          // Only update if there were actual duplicates
          if (uniqueImports.length < imports.length) {
            const newImportStatement = `import { ${uniqueImports.join(', ')} } from '${source}'`;
            lines[i] = lines[i].replace(fullMatch, newImportStatement);
            console.log(
              `[ImportValidator] 🔧 Fixed: Deduplicated imports in ${file.path} (${imports.length} → ${uniqueImports.length})`
            );
          }
          break;
        }
      }
    }

    fixedFiles[fileIndex] = {
      ...file,
      content: lines.join('\n'),
    };
  }

  return fixedFiles;
}
