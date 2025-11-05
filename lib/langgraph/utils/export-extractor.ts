// lib/langgraph/utils/export-extractor.ts

export interface ExportInfo {
  path: string;
  exports: Array<{
    name: string;
    kind: 'default' | 'named';
    type?: string;  // For named exports (function, const, etc.)
  }>;
  summary: string;  // Human-readable summary
}

/**
 * Extract export signatures from TypeScript/JavaScript code
 *
 * @param path - File path (for context)
 * @param code - TypeScript/JavaScript code
 * @returns Export information with signatures
 *
 * @example
 * ```typescript
 * const code = `
 *   import PocketBase from 'pocketbase';
 *   const pb = new PocketBase('http://localhost:8090');
 *   export default pb;
 * `;
 *
 * const info = extractExports('lib/db.ts', code);
 * // {
 * //   path: 'lib/db.ts',
 * //   exports: [{ name: 'pb', kind: 'default' }],
 * //   summary: 'default: pb'
 * // }
 * ```
 */
export function extractExports(path: string, code: string): ExportInfo {
  const exports: Array<{ name: string; kind: 'default' | 'named'; type?: string }> = [];

  try {
    // Extract default export
    // Patterns: export default X, export default function X, export default class X
    const defaultPatterns = [
      /export\s+default\s+function\s+(\w+)/,  // export default function Foo
      /export\s+default\s+class\s+(\w+)/,     // export default class Foo
      /export\s+default\s+(\w+)/,              // export default foo
    ];

    for (const pattern of defaultPatterns) {
      const match = code.match(pattern);
      if (match) {
        exports.push({ name: match[1], kind: 'default' });
        break; // Only one default export possible
      }
    }

    // Extract named exports
    // Patterns: export const X, export function X, export interface X, export type X, export class X
    const namedPattern = /export\s+(?:const|function|interface|type|class|enum)\s+(\w+)/g;
    let match;
    while ((match = namedPattern.exec(code)) !== null) {
      exports.push({ name: match[1], kind: 'named' });
    }

    // Also check for: export { X, Y, Z }
    const exportListPattern = /export\s+\{([^}]+)\}/g;
    while ((match = exportListPattern.exec(code)) !== null) {
      const names = match[1].split(',').map(n => n.trim());
      for (const name of names) {
        // Handle "X as Y" syntax
        const asMatch = name.match(/(\w+)\s+as\s+(\w+)/);
        if (asMatch) {
          exports.push({ name: asMatch[2], kind: 'named' });
        } else {
          exports.push({ name, kind: 'named' });
        }
      }
    }
  } catch (error) {
    console.error('[ExportExtractor] Error extracting exports:', error);
  }

  // Generate summary
  const defaultExp = exports.find(e => e.kind === 'default');
  const namedExps = exports.filter(e => e.kind === 'named');

  let summary = '';
  if (defaultExp) {
    summary = `default: ${defaultExp.name}`;
  }
  if (namedExps.length > 0) {
    const named = namedExps.map(e => e.name).join(', ');
    summary += summary ? `, named: { ${named} }` : `named: { ${named} }`;
  }

  return { path, exports, summary: summary || 'no exports' };
}

/**
 * Format export information for AI context
 * Creates import examples for previously generated files
 */
export function formatExportsForContext(
  previousFiles: Array<{ path: string; content: string; purpose: string }>
): string {
  if (previousFiles.length === 0) {
    return '';
  }

  let context = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  context += '📦 PREVIOUSLY GENERATED FILES\n';
  context += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  for (const file of previousFiles) {
    const exportInfo = extractExports(file.path, file.content);

    context += `${file.path}\n`;
    context += `  Purpose: ${file.purpose}\n`;

    if (exportInfo.summary !== 'no exports') {
      context += `  Exports: ${exportInfo.summary}\n`;

      // Add import examples
      const defaultExp = exportInfo.exports.find(e => e.kind === 'default');
      const namedExps = exportInfo.exports.filter(e => e.kind === 'named');

      const importPath = `@/${file.path.replace(/\.tsx?$/, '')}`;

      if (defaultExp) {
        context += `  Import: import ${defaultExp.name} from '${importPath}'\n`;
      }
      if (namedExps.length > 0) {
        const names = namedExps.map(e => e.name).join(', ');
        context += `  Import: import { ${names} } from '${importPath}'\n`;
      }
    }
    context += '\n';
  }

  return context;
}

/**
 * Build complete enhanced context with both types and exports
 */
export function buildEnhancedContext(
  previousFiles: Array<{ path: string; content: string; purpose: string }>,
  typeDefinitionsContext: string
): string {
  let context = '';

  // Type definitions section (if any)
  if (typeDefinitionsContext) {
    context += typeDefinitionsContext;
    context += '\n';
  }

  // Export signatures section
  const exportsContext = formatExportsForContext(previousFiles);
  if (exportsContext) {
    context += exportsContext;
  }

  return context;
}
