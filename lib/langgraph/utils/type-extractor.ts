// lib/langgraph/utils/type-extractor.ts

export interface TypeDefinition {
  name: string;           // e.g., "Task"
  kind: 'interface' | 'type';
  properties: Array<{
    name: string;        // e.g., "completedAt"
    type: string;        // e.g., "string"
    optional: boolean;   // e.g., false
  }>;
  raw: string;          // Full definition for context
}

/**
 * Parse property definitions from a type/interface body
 */
function parseProperties(body: string): Array<{name: string, type: string, optional: boolean}> {
  const properties = [];
  const lines = body.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));

  for (const line of lines) {
    // Match: propertyName?: type
    // Examples: "id: string", "name?: string", "count: number"
    const match = line.match(/(\w+)(\??):\s*([^;,]+)/);
    if (match) {
      const [, name, optional, type] = match;
      properties.push({
        name,
        type: type.trim(),
        optional: optional === '?'
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
        raw: raw.trim()
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
        raw: raw.trim()
      });
    }

    console.log(`[TypeExtractor] Extracted ${definitions.length} type definitions: ${definitions.map(d => d.name).join(', ')}`);
  } catch (error) {
    console.error('[TypeExtractor] Error extracting types:', error);
    // Return empty array on error (graceful degradation)
  }

  return definitions;
}

/**
 * Format type definitions for AI context
 * Creates a human-readable summary of types
 */
export function formatTypeDefinitionsForContext(types: TypeDefinition[]): string {
  if (types.length === 0) {
    return '';
  }

  let context = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  context += '📋 AVAILABLE TYPES (Use these exact definitions)\n';
  context += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  for (const type of types) {
    context += `${type.name} {\n`;
    for (const prop of type.properties) {
      context += `  ${prop.name}${prop.optional ? '?' : ''}: ${prop.type}\n`;
    }
    context += `}\n\n`;

    // Add usage hint
    context += `Usage: import { ${type.name} } from '@/lib/types'\n`;

    // Add example with actual property names
    const exampleProps = type.properties.slice(0, 2).map(p => p.name).join(', ');
    context += `Example: const item: ${type.name} = { ${exampleProps}, ... }\n\n`;
  }

  return context;
}
