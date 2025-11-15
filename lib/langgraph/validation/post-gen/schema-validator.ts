// lib/validation/schema-validator.ts
/**
 * Schema Validator - Validates that generated code matches backend schema
 * This ensures API client functions match their declared parameter schemas
 */

export interface SchemaValidationResult {
  valid: boolean;
  errors: SchemaValidationError[];
  warnings: SchemaValidationWarning[];
}

export interface SchemaValidationError {
  endpoint: string;
  issue: string;
  expected: string;
  actual: string;
  severity: 'error' | 'warning';
}

export interface SchemaValidationWarning {
  endpoint: string;
  issue: string;
  suggestion: string;
}

/**
 * Validate that API client functions match backend endpoint schemas
 */
export function validateApiClientMatchesSchema(
  apiClientContent: string,
  endpoints: any[]
): SchemaValidationResult {
  const errors: SchemaValidationError[] = [];
  const warnings: SchemaValidationWarning[] = [];

  for (const endpoint of endpoints) {
    if (!endpoint.handler) continue;

    // Find the function declaration in the API client
    const functionRegex = new RegExp(
      `export\\s+async\\s+function\\s+${endpoint.handler}\\s*\\(([^)]*)\\)\\s*:\\s*Promise<([^>]+)>`,
      'g'
    );

    const match = functionRegex.exec(apiClientContent);

    if (!match) {
      errors.push({
        endpoint: endpoint.handler,
        issue: 'Function not found in API client',
        expected: `export async function ${endpoint.handler}(...)`,
        actual: 'Not found',
        severity: 'error',
      });
      continue;
    }

    const [_, actualParams, actualReturn] = match;

    // Validate parameters
    if (endpoint.parameters && Array.isArray(endpoint.parameters)) {
      const result = validateParameters(endpoint.handler, endpoint.parameters, actualParams);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }

    // Validate return type
    if (endpoint.returns) {
      const expectedReturn = endpoint.returns;
      const actualReturnTrimmed = actualReturn.trim();

      if (expectedReturn !== actualReturnTrimmed && expectedReturn !== 'any') {
        // Allow 'any' as a fallback, but warn
        if (actualReturnTrimmed === 'any') {
          warnings.push({
            endpoint: endpoint.handler,
            issue: 'Return type is generic',
            suggestion: `Consider using specific type: Promise<${expectedReturn}>`,
          });
        } else {
          errors.push({
            endpoint: endpoint.handler,
            issue: 'Return type mismatch',
            expected: `Promise<${expectedReturn}>`,
            actual: `Promise<${actualReturnTrimmed}>`,
            severity: 'warning',
          });
        }
      }
    }
  }

  return {
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate function parameters match schema
 */
function validateParameters(
  handler: string,
  schemaParams: any[],
  actualParamsStr: string
): { errors: SchemaValidationError[]; warnings: SchemaValidationWarning[] } {
  const errors: SchemaValidationError[] = [];
  const warnings: SchemaValidationWarning[] = [];

  // Parse actual parameters
  const actualParams = parseParameters(actualParamsStr);

  // Build expected parameters from schema
  const expectedParams: string[] = [];

  const pathParams = schemaParams.filter((p) => p.location === 'path');
  const queryParams = schemaParams.filter((p) => p.location === 'query');
  const bodyParams = schemaParams.filter((p) => p.location === 'body');

  // Path parameters
  pathParams.forEach((p) => {
    expectedParams.push(`${p.name}: ${p.type}`);
  });

  // Query parameters (as object)
  if (queryParams.length > 0) {
    const isAllOptional = queryParams.every((p) => !p.required);
    const queryType = `{ ${queryParams
      .map((p) => `${p.name}${p.required ? '' : '?'}: ${p.type}`)
      .join(', ')} }`;
    expectedParams.push(`params${isAllOptional ? '?' : ''}: ${queryType}`);
  }

  // Body parameters
  bodyParams.forEach((p) => {
    expectedParams.push(`${p.name}: ${p.type}`);
  });

  // Compare expected vs actual
  const expectedStr = expectedParams.join(', ');
  const actualStr = actualParams.join(', ');

  if (expectedStr !== actualStr) {
    // Check if it's close (might just be formatting)
    const expectedNormalized = normalizeParams(expectedStr);
    const actualNormalized = normalizeParams(actualStr);

    if (expectedNormalized !== actualNormalized) {
      errors.push({
        endpoint: handler,
        issue: 'Parameter signature mismatch',
        expected: expectedStr,
        actual: actualStr,
        severity: 'error',
      });
    }
  }

  return { errors, warnings };
}

/**
 * Parse function parameter string into array
 */
function parseParameters(paramsStr: string): string[] {
  if (!paramsStr || paramsStr.trim() === '') return [];

  // Simple parsing - split by comma outside of braces
  const params: string[] = [];
  let current = '';
  let braceDepth = 0;

  for (let i = 0; i < paramsStr.length; i++) {
    const char = paramsStr[i];

    if (char === '{') braceDepth++;
    if (char === '}') braceDepth--;

    if (char === ',' && braceDepth === 0) {
      params.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    params.push(current.trim());
  }

  return params;
}

/**
 * Normalize parameter string for comparison (remove extra whitespace)
 */
function normalizeParams(params: string): string {
  return params
    .replace(/\s+/g, ' ')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*,\s*/g, ',')
    .replace(/\s*\?\s*:/g, '?:')
    .replace(/\{\s+/g, '{')
    .replace(/\s+\}/g, '}')
    .trim();
}

/**
 * Generate a report of schema validation results
 */
export function generateSchemaValidationReport(result: SchemaValidationResult): string {
  if (result.valid && result.warnings.length === 0) {
    return '✅ All API functions match their schemas perfectly!';
  }

  let report = '';

  if (result.errors.length > 0) {
    report += '❌ SCHEMA VALIDATION ERRORS:\n\n';
    result.errors.forEach((error) => {
      report += `Function: ${error.endpoint}\n`;
      report += `Issue: ${error.issue}\n`;
      report += `Expected: ${error.expected}\n`;
      report += `Actual: ${error.actual}\n`;
      report += `Severity: ${error.severity}\n\n`;
    });
  }

  if (result.warnings.length > 0) {
    report += '⚠️  SCHEMA VALIDATION WARNINGS:\n\n';
    result.warnings.forEach((warning) => {
      report += `Function: ${warning.endpoint}\n`;
      report += `Issue: ${warning.issue}\n`;
      report += `Suggestion: ${warning.suggestion}\n\n`;
    });
  }

  return report;
}
