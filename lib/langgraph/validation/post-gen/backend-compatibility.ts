/**
 * BACKEND COMPATIBILITY VALIDATOR
 *
 * Validates that frontend API calls match backend endpoints
 * Prevents issues like "posts loading in subscription form" due to mismatched API calls
 */

import type { ValidationError, FileToValidate } from './types';

interface APIFunction {
  name: string;
  parameters: string[];
  filePath: string;
  lineNumber: number;
}

interface APIDefinition {
  name: string;
  parameters: string[];
  returnType?: string;
}

/**
 * Extract API function calls from frontend code
 * Looks for patterns like: await createPost(data), getPosts()
 */
function extractAPIFunctionCalls(content: string, filePath: string): APIFunction[] {
  const calls: APIFunction[] = [];
  const lines = content.split('\n');

  // Pattern: await functionName(args) or functionName(args)
  // Looking for common API function patterns
  const apiCallPattern = /(await\s+)?([a-z][a-zA-Z0-9_]*)\s*\(([^)]*)\)/g;

  lines.forEach((line, index) => {
    // Skip comments and imports
    if (line.trim().startsWith('//') || line.trim().startsWith('import')) {
      return;
    }

    const matches = [...line.matchAll(apiCallPattern)];

    for (const match of matches) {
      const functionName = match[2];

      // Filter to likely API function names (camelCase starting with action verbs)
      const isLikelyAPICall = /^(get|create|update|delete|fetch|submit|post|put|patch|remove|add|save|load)[A-Z]/.test(functionName);

      // Exclude common React/framework functions that match the pattern
      const excludedFunctions = [
        'createElement', 'createContext', 'createRef', 'createPortal', 'createRoot',
        'removeEventListener', 'removeChild', 'removeAttribute',
        'getAttribute', 'getContext', 'getBoundingClientRect', 'getComputedStyle',
        'getElementById', 'getElementsByClassName', 'getElementsByTagName',
        'addEventListener', 'addChild',
        'importScripts', // Web Workers
        'getItem', 'setItem', 'removeItem', // localStorage
        'fetch', // Native fetch (not an API function name, it's the actual fetch call)
      ];

      if (isLikelyAPICall && !excludedFunctions.includes(functionName)) {
        // Extract parameters (simplified - just count commas)
        const paramsStr = match[3].trim();
        const paramCount = paramsStr ? paramsStr.split(',').length : 0;
        const params: string[] = [];
        for (let i = 0; i < paramCount; i++) {
          params.push(`param${i + 1}`);
        }

        calls.push({
          name: functionName,
          parameters: params,
          filePath,
          lineNumber: index + 1
        });
      }
    }
  });

  return calls;
}

/**
 * Extract API function definitions from lib/api.ts
 */
function extractAPIDefinitions(files: FileToValidate[]): APIDefinition[] {
  const definitions: APIDefinition[] = [];

  // Find lib/api.ts file
  const apiFile = files.find(f => f.path.includes('lib/api.ts') || f.path.endsWith('/api.ts'));

  if (!apiFile) {
    console.log('[BackendCompatibility] ⚠️  No lib/api.ts found - skipping backend validation');
    return [];
  }

  const content = apiFile.content;
  const lines = content.split('\n');

  // Pattern: export async function functionName(params): Promise<Type>
  // or export function functionName(params)
  const functionDefPattern = /export\s+(async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/;

  lines.forEach(line => {
    const match = line.match(functionDefPattern);

    if (match) {
      const functionName = match[2];
      const paramsStr = match[3].trim();

      // Parse parameters
      const params: string[] = [];
      if (paramsStr) {
        // Split by comma, extract parameter names (before colon for TypeScript)
        const paramParts = paramsStr.split(',').map(p => p.trim());
        for (const part of paramParts) {
          // Extract param name (before : if TypeScript typed)
          const paramName = part.split(':')[0].trim();
          if (paramName) {
            params.push(paramName);
          }
        }
      }

      definitions.push({
        name: functionName,
        parameters: params
      });
    }
  });

  console.log(`[BackendCompatibility] Found ${definitions.length} API function definitions in lib/api.ts`);

  return definitions;
}

/**
 * Extract API imports from files
 * Tracks which functions are imported from '@/lib/api'
 */
function extractAPIImports(content: string): Set<string> {
  const imports = new Set<string>();

  // Pattern: import { func1, func2 } from '@/lib/api'
  const importPattern = /import\s+\{([^}]+)\}\s+from\s+['"]@\/lib\/api['"]/g;

  const matches = [...content.matchAll(importPattern)];

  for (const match of matches) {
    const importedFunctions = match[1].split(',').map(f => f.trim());
    importedFunctions.forEach(f => imports.add(f));
  }

  return imports;
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching function names
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Find similar function name (for auto-correction)
 * Examples:
 *   fetchCartItems → getCartItems
 *   getProductDetails → getProducts
 *   createUserAccount → createUser
 */
function findSimilarFunction(wrongName: string, availableFunctions: string[]): string | null {
  const lower = wrongName.toLowerCase();

  // Strategy 1: Common word replacements
  // fetch → get, remove → delete, submit → create
  const commonReplacements = {
    'fetch': 'get',
    'remove': 'delete',
    'submit': 'create',
    'add': 'create',
    'save': 'create',
    'load': 'get',
  };

  for (const [wrong, correct] of Object.entries(commonReplacements)) {
    if (lower.startsWith(wrong)) {
      const replaced = wrongName.replace(new RegExp(`^${wrong}`, 'i'), correct);

      // Check if exact match exists
      const exactMatch = availableFunctions.find(f =>
        f.toLowerCase() === replaced.toLowerCase()
      );
      if (exactMatch) {
        console.log(`[BackendCompatibility] 🎯 Exact match found: ${wrongName} → ${exactMatch} (word replacement)`);
        return exactMatch;
      }
    }
  }

  // Strategy 2: Extract action verb and subject
  // Examples: getProductDetails → get + product, fetchCartItems → fetch + cart
  const verbMatch = lower.match(/^(get|create|update|delete|fetch|submit|post|put|patch|remove|add|save|load)[A-Z]/);
  if (verbMatch) {
    const verb = verbMatch[1];
    const subject = lower.replace(verb, '').replace(/details?|info|data|item|s$/g, '');

    // Find matching function with same verb and similar subject
    for (const funcName of availableFunctions) {
      const funcLower = funcName.toLowerCase();

      // Check if starts with same verb
      if (funcLower.startsWith(verb) || funcLower.startsWith(commonReplacements[verb as keyof typeof commonReplacements] || verb)) {
        // Check if contains similar subject
        const funcSubject = funcLower.replace(/^(get|create|update|delete|fetch)/, '');

        if (funcSubject.includes(subject) || subject.includes(funcSubject.replace(/s$/, ''))) {
          console.log(`[BackendCompatibility] 🎯 Similar match found: ${wrongName} → ${funcName} (verb+subject)`);
          return funcName;
        }
      }
    }
  }

  // Strategy 3: Fuzzy matching with Levenshtein distance
  // Find the closest match with distance < 5
  let bestMatch: string | null = null;
  let bestDistance = Infinity;

  for (const funcName of availableFunctions) {
    const distance = levenshteinDistance(lower, funcName.toLowerCase());

    // Only consider if:
    // 1. Distance is reasonable (< 5)
    // 2. Function names start with same letter (reduces false positives)
    // 3. This is better than current best
    if (distance < 5 &&
        lower[0] === funcName.toLowerCase()[0] &&
        distance < bestDistance) {
      bestMatch = funcName;
      bestDistance = distance;
    }
  }

  if (bestMatch && bestDistance <= 3) {
    console.log(`[BackendCompatibility] 🎯 Fuzzy match found: ${wrongName} → ${bestMatch} (distance: ${bestDistance})`);
    return bestMatch;
  }

  console.log(`[BackendCompatibility] ❌ No similar function found for '${wrongName}' in [${availableFunctions.join(', ')}]`);
  return null;
}

/**
 * Auto-fix relation field type errors
 * Fixes cases where code treats relation IDs (strings) as full objects
 */
export function autoFixRelationTypeErrors(files: FileToValidate[]): { fixed: boolean; changes: string[] } {
  const changes: string[] = [];
  let fixed = false;

  for (const file of files) {
    if (!file.path.endsWith('.tsx') && !file.path.endsWith('.ts')) continue;

    let newContent = file.content;
    let fileChanged = false;

    // Fix 1: product: product.id → product: product.id!
    // Handles optional ID issue with non-null assertion
    const optionalIdPattern = /product:\s*product\.id([,\s}])/g;
    const needsIdFix = optionalIdPattern.test(newContent) &&
                       !newContent.includes('product.id!') &&
                       !newContent.includes('product.id || \'\'');

    if (needsIdFix) {
      newContent = newContent.replace(/product:\s*product\.id([,\s}])/g, 'product: product.id!$1');
      changes.push(`${file.path}: Added non-null assertion to product.id`);
      fileChanged = true;
    }

    // Fix 2: item.product?.price → Remove invalid cartTotal calculation
    // CartContext shouldn't calculate prices directly (product is a string ID, not object)
    const wrongRelationAccessPattern = /item\.product\??\.(price|name|description|imageUrl)/g;
    if (wrongRelationAccessPattern.test(newContent)) {
      // This pattern is ALWAYS wrong in cart-context - remove the cartTotal calculation
      if (file.path.includes('cart-context')) {
        // Remove the cartTotal calculation entirely
        const cartTotalCalcPattern = /const cartTotal = items\.reduce\([^}]+\}\s*,\s*0\)/s;
        if (cartTotalCalcPattern.test(newContent)) {
          newContent = newContent.replace(cartTotalCalcPattern, 'const cartTotal = 0 // Removed: prices should be calculated in components with product data');
          changes.push(`${file.path}: Removed invalid cartTotal calculation (relation ID used as object)`);
          fileChanged = true;
        }

        // Also remove cartTotal from the context value and type definition
        newContent = newContent.replace(/,?\s*cartTotal[,\s}]/g, '\n    ');
        newContent = newContent.replace(/cartTotal:\s*number[,\s]/g, '');
        newContent = newContent.replace(/cartTotal:\s*CartContextType\['cartTotal'\][,\s]/g, '');
      } else {
        // In other files, just log warning
        changes.push(`${file.path}: WARNING - Accessing properties on relation ID (string). Needs product lookup.`);
      }
    }

    if (fileChanged) {
      file.content = newContent;
      fixed = true;
    }
  }

  return { fixed, changes };
}

/**
 * Auto-fix API function name mismatches
 * Replaces incorrect function names with correct ones
 *
 * CRITICAL: This runs BEFORE import validation to ensure all function names
 * are correct before trying to fix imports.
 */
export function autoFixAPIFunctionNames(files: FileToValidate[]): { fixed: boolean; changes: string[] } {
  const changes: string[] = [];
  let fixed = false;

  // Extract API definitions
  const apiDefinitions = extractAPIDefinitions(files);
  if (apiDefinitions.length === 0) {
    console.log('[BackendCompatibility] No API definitions found - skipping auto-fix');
    return { fixed, changes };
  }

  const apiDefMap = new Map(apiDefinitions.map(def => [def.name, def]));
  const availableFunctions = Array.from(apiDefMap.keys());

  console.log(`[BackendCompatibility] 🔍 Available API functions: ${availableFunctions.join(', ')}`);

  // Check each file for mismatches
  for (const file of files) {
    if (!file.path.endsWith('.tsx') && !file.path.endsWith('.ts')) continue;
    if (file.path.includes('lib/api.ts')) continue;
    if (!file.content.includes('@/lib/api')) continue;

    const importedFunctions = extractAPIImports(file.content);
    const apiCalls = extractAPIFunctionCalls(file.content, file.path);

    // Find mismatches
    const replacements = new Map<string, string>(); // wrongName → correctName

    // Check 1: Functions that are imported but don't exist
    for (const importedFunc of importedFunctions) {
      const definition = apiDefMap.get(importedFunc);

      if (!definition) {
        // Function imported but doesn't exist - try to find similar
        const similar = findSimilarFunction(importedFunc, availableFunctions);
        if (similar) {
          replacements.set(importedFunc, similar);
          console.log(`[BackendCompatibility] 🔧 Will fix import: ${importedFunc} → ${similar} in ${file.path}`);
        } else {
          console.error(`[BackendCompatibility] ❌ Cannot find replacement for '${importedFunc}' - will fail at build`);
          changes.push(`${file.path}: ERROR - Cannot find replacement for '${importedFunc}'`);
        }
      }
    }

    // Check 2: Functions that are called but don't exist (even if not explicitly imported)
    for (const call of apiCalls) {
      const definition = apiDefMap.get(call.name);

      if (!definition && !replacements.has(call.name)) {
        // Function called but doesn't exist - try to find similar
        const similar = findSimilarFunction(call.name, availableFunctions);
        if (similar) {
          replacements.set(call.name, similar);
          console.log(`[BackendCompatibility] 🔧 Will fix call: ${call.name} → ${similar} in ${file.path}:${call.lineNumber}`);
        }
      }
    }

    // Apply replacements
    if (replacements.size > 0) {
      let newContent = file.content;

      for (const [wrongName, correctName] of replacements.entries()) {
        // Replace in imports first
        const importRegex = new RegExp(`(import\\s+\\{[^}]*?)\\b${wrongName}\\b([^}]*\\}\\s+from\\s+['"]@/lib/api['"])`, 'g');
        newContent = newContent.replace(importRegex, `$1${correctName}$2`);

        // Replace function calls (with word boundaries to avoid partial matches)
        // Match: functionName( with optional await/space before
        const callRegex = new RegExp(`\\b${wrongName}\\s*\\(`, 'g');
        newContent = newContent.replace(callRegex, `${correctName}(`);

        changes.push(`${file.path}: Renamed ${wrongName} → ${correctName} (imports + calls)`);
        fixed = true;
      }

      file.content = newContent;
      console.log(`[BackendCompatibility] ✅ Fixed ${replacements.size} function name(s) in ${file.path}`);
    }
  }

  if (fixed) {
    console.log(`[BackendCompatibility] ✅ Auto-fixed API function names in ${changes.length} location(s)`);
  } else {
    console.log('[BackendCompatibility] ✅ No API function name fixes needed');
  }

  return { fixed, changes };
}

/**
 * Validate backend compatibility
 * Checks that:
 * 1. All API function calls are defined in lib/api.ts
 * 2. All API function calls have correct number of parameters
 * 3. All API functions used are imported
 */
export function validateBackendCompatibility(files: FileToValidate[]): ValidationError[] {
  console.log('[BackendCompatibility] Starting backend compatibility validation...');

  const errors: ValidationError[] = [];

  // Step 1: Extract API definitions from lib/api.ts
  const apiDefinitions = extractAPIDefinitions(files);

  if (apiDefinitions.length === 0) {
    // No API file found or no functions defined - skip validation
    return [];
  }

  // Create a map for quick lookup
  const apiDefMap = new Map(apiDefinitions.map(def => [def.name, def]));

  // Step 2: Check each frontend file for API calls
  for (const file of files) {
    // Only check .tsx and .ts files (frontend code)
    if (!file.path.endsWith('.tsx') && !file.path.endsWith('.ts')) {
      continue;
    }

    // Skip the API file itself
    if (file.path.includes('lib/api.ts')) {
      continue;
    }

    // Skip files that don't import from @/lib/api - no point checking them
    const hasAPIImports = file.content.includes('@/lib/api');
    if (!hasAPIImports) {
      continue;
    }

    // Extract API imports
    const importedFunctions = extractAPIImports(file.content);

    // Extract API function calls
    const apiCalls = extractAPIFunctionCalls(file.content, file.path);

    // Validate each API call
    for (const call of apiCalls) {
      // Check 1: Function exists in lib/api.ts
      const definition = apiDefMap.get(call.name);

      // Only report as error if the function was expected to be imported but isn't defined
      // If it's not in the import list, it might be a local function or from another library
      const wasExpectedFromAPI = importedFunctions.has(call.name);

      if (!definition && wasExpectedFromAPI) {
        errors.push({
          file: file.path,
          line: call.lineNumber,
          message: `API function '${call.name}()' is imported from '@/lib/api' but not defined there`,
          rule: 'undefined-api-function',
          severity: 'error',
          autoFixable: false,
          suggestion: `Add '${call.name}' to lib/api.ts or remove from imports. Available functions: ${Array.from(apiDefMap.keys()).join(', ')}`
        });
        console.log(`[BackendCompatibility] ❌ ${file.path}:${call.lineNumber}: Undefined function ${call.name}()`);
        continue;
      } else if (!definition) {
        // Function not in API and not imported from API - skip it (likely a local function)
        continue;
      }

      // Check 2: Function is imported (only if this file imports from @/lib/api)
      const hasAPIImports = file.content.includes('@/lib/api');
      if (hasAPIImports && !importedFunctions.has(call.name)) {
        errors.push({
          file: file.path,
          line: call.lineNumber,
          message: `API function '${call.name}()' is used but not imported from '@/lib/api'`,
          rule: 'missing-api-import',
          severity: 'warning', // Changed to warning - may be defined locally or from another source
          autoFixable: true,
          suggestion: `Add to imports: import { ${call.name} } from '@/lib/api' (if this is an API function)`
        });
        console.log(`[BackendCompatibility] ⚠️  ${file.path}:${call.lineNumber}: Function ${call.name}() not imported from @/lib/api`);
      }

      // Check 3: Parameter count matches (rough check)
      const expectedParamCount = definition.parameters.length;
      const actualParamCount = call.parameters.length;

      if (actualParamCount !== expectedParamCount) {
        errors.push({
          file: file.path,
          line: call.lineNumber,
          message: `API function '${call.name}()' called with ${actualParamCount} parameter(s) but expects ${expectedParamCount}`,
          rule: 'api-parameter-mismatch',
          severity: 'warning',
          autoFixable: false,
          suggestion: `Expected signature: ${call.name}(${definition.parameters.join(', ')})`
        });
        console.log(`[BackendCompatibility] ⚠️  ${file.path}:${call.lineNumber}: Parameter count mismatch for ${call.name}()`);
      }
    }
  }

  if (errors.filter(e => e.severity === 'error').length === 0) {
    console.log('[BackendCompatibility] ✅ All API calls are valid');
  } else {
    console.log(`[BackendCompatibility] ❌ Found ${errors.length} backend compatibility issues`);
  }

  return errors;
}

/**
 * Validate that forms interact with correct API endpoints
 * Prevents issues like "posts load in subscription form"
 */
export function validateFormAPIUsage(files: FileToValidate[]): ValidationError[] {
  console.log('[BackendCompatibility] Validating form-API associations...');

  const errors: ValidationError[] = [];

  for (const file of files) {
    if (!file.path.endsWith('.tsx')) {
      continue;
    }

    const content = file.content;

    // Look for forms (onSubmit handlers)
    const formPattern = /<form[^>]*onSubmit=\{([^}]+)\}/g;
    const formMatches = [...content.matchAll(formPattern)];

    for (const formMatch of formMatches) {
      const handlerName = formMatch[1].trim();

      // Find the handler function in the same file
      const handlerPattern = new RegExp(`(const|let|var)\\s+${handlerName}\\s*=`, 'g');
      const handlerExists = handlerPattern.test(content);

      if (!handlerExists) {
        const lineNumber = content.substring(0, formMatch.index).split('\n').length;

        errors.push({
          file: file.path,
          line: lineNumber,
          message: `Form handler '${handlerName}' is referenced but not defined in this file`,
          rule: 'missing-form-handler',
          severity: 'warning',
          autoFixable: false,
          suggestion: `Define ${handlerName} function or check for typos`
        });
      }
    }
  }

  return errors;
}
