/**
 * IMPORT VALIDATOR
 *
 * Validates import statements and catches common errors:
 * - Invalid imports from lucide-react (Logo, etc.)
 * - Missing React hooks imports (useEffect, useCallback, etc.)
 * - Duplicate imports
 */

import type { ValidationError, FileToValidate } from './types';

/**
 * REMOVED: Lucide-react icon whitelist
 *
 * Lucide has 1000+ icons and grows regularly. Maintaining a whitelist is impossible.
 * Instead, we trust the AI and only validate syntax (commas, duplicates, etc.)
 *
 * If an icon doesn't exist, TypeScript will catch it at build time anyway.
 */

/**
 * React hooks that are commonly used
 */
const REACT_HOOKS = [
  'useState', 'useEffect', 'useCallback', 'useMemo', 'useRef',
  'useContext', 'useReducer', 'useLayoutEffect', 'useImperativeHandle'
];

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

    const lines = file.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check 1: Lucide-react syntax validation (commas, duplicates)
      // Note: We don't validate icon names - lucide has 1000+ icons and grows regularly.
      // TypeScript will catch invalid icons at build time.
      const lucideImportMatch = line.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
      if (lucideImportMatch) {
        const importString = lucideImportMatch[1];

        // Only check for syntax issues (missing commas)
        if (/[A-Z][a-zA-Z0-9]*\s+[A-Z]/.test(importString)) {
          errors.push({
            file: file.path,
            line: lineNumber,
            message: `Malformed lucide-react import: missing commas between icon names`,
            rule: 'malformed-lucide-import',
            severity: 'error',
            autoFixable: true,
            suggestion: `Add commas between icon names: { Icon1, Icon2, Icon3 }`
          });
          console.log(`[ImportValidator] ❌ ${file.path}:${lineNumber}: Malformed lucide import (missing commas)`);
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
              suggestion: `Add '${hook}' to the React import: import { ..., ${hook} } from 'react'`
            });
            console.log(`[ImportValidator] ❌ ${file.path}: Missing React hook import '${hook}'`);
            break; // Only report once per file
          }
        }
      }

      // Check 3: Duplicate imports
      const importMatches = line.matchAll(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g);
      for (const match of importMatches) {
        const imports = match[1].split(',').map(s => s.trim());
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
              suggestion: `Remove duplicate '${imp}' from imports`
            });
            console.log(`[ImportValidator] ❌ ${file.path}:${lineNumber}: Duplicate import '${imp}'`);
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
export function fixImportErrors(files: FileToValidate[], errors: ValidationError[]): FileToValidate[] {
  console.log('[ImportValidator] Auto-fixing import errors...');

  const fixedFiles = [...files];

  for (const error of errors) {
    if (!error.autoFixable) continue;

    const fileIndex = fixedFiles.findIndex(f => f.path === error.file);
    if (fileIndex === -1) continue;

    const file = fixedFiles[fileIndex];
    const lines = file.content.split('\n');

    if (error.rule === 'malformed-lucide-import') {
      // Fix missing commas in lucide-react imports
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('lucide-react')) {
          const match = lines[i].match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
          if (match) {
            let importString = match[1];

            // Add commas between icon names
            while (/\b([A-Z][a-zA-Z0-9]*)\s+([A-Z][a-zA-Z0-9]*)\b/.test(importString)) {
              importString = importString.replace(/\b([A-Z][a-zA-Z0-9]*)\s+([A-Z][a-zA-Z0-9]*)\b/, '$1, $2');
            }

            lines[i] = lines[i].replace(match[1], importString);
            console.log(`[ImportValidator] 🔧 Fixed: Added commas to lucide-react import`);
          }
          break;
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

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(duplicateImport)) {
          // Find all occurrences and keep only the first one
          const parts = lines[i].split(duplicateImport);
          if (parts.length > 2) {
            lines[i] = parts[0] + duplicateImport + parts.slice(2).join('');
            console.log(`[ImportValidator] 🔧 Fixed: Removed duplicate '${duplicateImport}'`);
          }
          break;
        }
      }
    }

    fixedFiles[fileIndex] = {
      ...file,
      content: lines.join('\n')
    };
  }

  return fixedFiles;
}
