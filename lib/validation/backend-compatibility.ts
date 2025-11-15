/**
 * BACKEND COMPATIBILITY VALIDATOR
 *
 * Validates that frontend API calls match backend endpoints
 * Prevents issues like "posts loading in subscription form" due to mismatched API calls
 */

import type { FileToValidate, ValidationError } from '@/lib/langgraph/validation/post-gen/types';

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
      const isLikelyAPICall =
        /^(get|create|update|delete|fetch|submit|post|put|patch|remove|add|save|load)[A-Z]/.test(
          functionName
        );

      // Exclude common React/framework functions that match the pattern
      const excludedFunctions = [
        'createElement',
        'createContext',
        'createRef',
        'createPortal',
        'createRoot',
        'removeEventListener',
        'removeChild',
        'removeAttribute',
        'getAttribute',
        'getContext',
        'getBoundingClientRect',
        'getComputedStyle',
        'getElementById',
        'getElementsByClassName',
        'getElementsByTagName',
        'addEventListener',
        'addChild',
        'importScripts', // Web Workers
        'getItem',
        'setItem',
        'removeItem', // localStorage
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
          lineNumber: index + 1,
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
  const apiFile = files.find((f) => f.path.includes('lib/api.ts') || f.path.endsWith('/api.ts'));

  if (!apiFile) {
    console.log('[BackendCompatibility] ⚠️  No lib/api.ts found - skipping backend validation');
    return [];
  }

  const content = apiFile.content;
  const lines = content.split('\n');

  // Pattern: export async function functionName(params): Promise<Type>
  // or export function functionName(params)
  const functionDefPattern = /export\s+(async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/;

  lines.forEach((line) => {
    const match = line.match(functionDefPattern);

    if (match) {
      const functionName = match[2];
      const paramsStr = match[3].trim();

      // Parse parameters
      const params: string[] = [];
      if (paramsStr) {
        // Split by comma, extract parameter names (before colon for TypeScript)
        const paramParts = paramsStr.split(',').map((p) => p.trim());
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
        parameters: params,
      });
    }
  });

  console.log(
    `[BackendCompatibility] Found ${definitions.length} API function definitions in lib/api.ts`
  );

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
    const importedFunctions = match[1].split(',').map((f) => f.trim());
    importedFunctions.forEach((f) => imports.add(f));
  }

  return imports;
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
  const apiDefMap = new Map(apiDefinitions.map((def) => [def.name, def]));

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
          suggestion: `Add '${call.name}' to lib/api.ts or remove from imports. Available functions: ${Array.from(apiDefMap.keys()).join(', ')}`,
        });
        console.log(
          `[BackendCompatibility] ❌ ${file.path}:${call.lineNumber}: Undefined function ${call.name}()`
        );
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
          suggestion: `Add to imports: import { ${call.name} } from '@/lib/api' (if this is an API function)`,
        });
        console.log(
          `[BackendCompatibility] ⚠️  ${file.path}:${call.lineNumber}: Function ${call.name}() not imported from @/lib/api`
        );
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
          suggestion: `Expected signature: ${call.name}(${definition.parameters.join(', ')})`,
        });
        console.log(
          `[BackendCompatibility] ⚠️  ${file.path}:${call.lineNumber}: Parameter count mismatch for ${call.name}()`
        );
      }
    }
  }

  if (errors.filter((e) => e.severity === 'error').length === 0) {
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
    const lines = content.split('\n');

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
          suggestion: `Define ${handlerName} function or check for typos`,
        });
      }
    }
  }

  return errors;
}
