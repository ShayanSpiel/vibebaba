// lib/langgraph/utils/type-extractor.ts

export interface TypeDefinition {
  name: string; // e.g., "Task"
  kind: 'interface' | 'type';
  properties: Array<{
    name: string; // e.g., "completedAt"
    type: string; // e.g., "string"
    optional: boolean; // e.g., false
  }>;
  raw: string; // Full definition for context
}

/**
 * Parse property definitions from a type/interface body
 */
function parseProperties(body: string): Array<{ name: string; type: string; optional: boolean }> {
  const properties = [];
  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('//'));

  for (const line of lines) {
    // Match: propertyName?: type
    // Examples: "id: string", "name?: string", "count: number"
    const match = line.match(/(\w+)(\??):\s*([^;,]+)/);
    if (match) {
      const [, name, optional, type] = match;
      properties.push({
        name,
        type: type.trim(),
        optional: optional === '?',
      });
    }
  }

  return properties;
}

/**
 * Extract TypeScript type and interface definitions from code
 *
 * @param code - TypeScript code containing type/interface definitions
 * @returns Array of extracted type definitions
 *
 * @example
 * ```typescript
 * const code = `
 *   export interface Task {
 *     id: string;
 *     title: string;
 *     completedAt: string;
 *   }
 * `;
 *
 * const types = extractTypeDefinitions(code);
 * // [{ name: 'Task', kind: 'interface', properties: [...], raw: '...' }]
 * ```
 */
export function extractTypeDefinitions(code: string): TypeDefinition[] {
  const definitions: TypeDefinition[] = [];

  try {
    // Regex patterns for interfaces and types
    const interfacePattern = /export\s+interface\s+(\w+)\s*\{([^}]+)\}/g;
    const typePattern = /export\s+type\s+(\w+)\s*=\s*\{([^}]+)\}/g;

    // Extract interfaces
    let match;
    while ((match = interfacePattern.exec(code)) !== null) {
      const [raw, name, body] = match;
      const properties = parseProperties(body);

      definitions.push({
        name,
        kind: 'interface',
        properties,
        raw: raw.trim(),
      });
    }

    // Extract types (object types only)
    while ((match = typePattern.exec(code)) !== null) {
      const [raw, name, body] = match;
      const properties = parseProperties(body);

      definitions.push({
        name,
        kind: 'type',
        properties,
        raw: raw.trim(),
      });
    }

    console.log(
      `[TypeExtractor] Extracted ${definitions.length} type definitions: ${definitions.map((d) => d.name).join(', ')}`
    );
  } catch (error) {
    console.error('[TypeExtractor] Error extracting types:', error);
    // Return empty array on error (graceful degradation)
  }

  return definitions;
}

/**
 * Format type definitions for AI context
 * Shows ONLY property names (not structure) to prevent hallucination
 * Does not show type structure to avoid AI copying it as local definition
 */
export function formatTypeDefinitionsForContext(types: TypeDefinition[]): string {
  if (types.length === 0) {
    return '';
  }

  // ✅ CONSTRAINT FORMAT: Show properties with types for strict validation
  let context = '🚨 PROPERTY VALIDATION - Imported Types from @/lib/api:\n\n';

  for (const type of types) {
    // Show property names with types and optional indicator
    const propList = type.properties.map((p) => `${p.name}${p.optional ? '?' : ''}: ${p.type}`);
    context += `${type.name}: { ${propList.join(', ')} }\n`;
  }

  context += '\n❌ CRITICAL: Do NOT access properties not listed above\n';
  context += '❌ CRITICAL: Do NOT guess property names - use ONLY listed properties\n';
  context +=
    '❌ CRITICAL: Do NOT hallucinate properties (e.g., price, timeRange) not in type definition\n';
  context +=
    "⚠️  CRITICAL: Properties with ? are optional - check before use (e.g., post.created || 'fallback')\n";
  context += '✅ These types are imported from @/lib/api - do not redefine them\n';

  return context;
}
