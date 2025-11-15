import type { ExportSpec, ImportSpec } from './types';

/**
 * Extract import statements from TypeScript/React code
 */
export function extractImports(code: string): ImportSpec[] {
  const imports: ImportSpec[] = [];

  // Match: import { X, Y, Z } from 'source'
  const namedImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = namedImportRegex.exec(code)) !== null) {
    const names = match[1].split(',').map((n) => n.trim().replace(/^type\s+/, ''));
    const source = match[2];
    const isLocal = source.startsWith('./') || source.startsWith('../') || source.startsWith('@/');

    names.forEach((name) => {
      imports.push({
        name,
        source,
        type: match[1].includes('type ' + name) ? 'type' : 'named',
        isLocal,
      });
    });
  }

  // Match: import X from 'source'
  const defaultImportRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = defaultImportRegex.exec(code)) !== null) {
    const source = match[2];
    imports.push({
      name: match[1],
      source,
      type: 'default',
      isLocal: source.startsWith('./') || source.startsWith('../') || source.startsWith('@/'),
    });
  }

  // Match: import * as X from 'source'
  const namespaceImportRegex = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = namespaceImportRegex.exec(code)) !== null) {
    const source = match[2];
    imports.push({
      name: match[1],
      source,
      type: 'namespace',
      isLocal: source.startsWith('./') || source.startsWith('../') || source.startsWith('@/'),
    });
  }

  return imports;
}

/**
 * Extract export statements from TypeScript/React code
 */
export function extractExports(code: string): ExportSpec[] {
  const exports: ExportSpec[] = [];

  // Match: export default X
  const defaultExportRegex = /export\s+default\s+(?:function\s+)?(\w+)/g;
  let match;
  while ((match = defaultExportRegex.exec(code)) !== null) {
    exports.push({
      name: match[1],
      type: 'default',
      isType: false,
    });
  }

  // Match: export function X
  const namedFunctionRegex = /export\s+(?:async\s+)?function\s+(\w+)/g;
  while ((match = namedFunctionRegex.exec(code)) !== null) {
    exports.push({
      name: match[1],
      type: 'named',
      isType: false,
    });
  }

  // Match: export const X
  const namedConstRegex = /export\s+const\s+(\w+)/g;
  while ((match = namedConstRegex.exec(code)) !== null) {
    exports.push({
      name: match[1],
      type: 'named',
      isType: false,
    });
  }

  // Match: export interface X
  const interfaceRegex = /export\s+interface\s+(\w+)/g;
  while ((match = interfaceRegex.exec(code)) !== null) {
    exports.push({
      name: match[1],
      type: 'named',
      isType: true,
    });
  }

  // Match: export type X
  const typeRegex = /export\s+type\s+(\w+)/g;
  while ((match = typeRegex.exec(code)) !== null) {
    exports.push({
      name: match[1],
      type: 'named',
      isType: true,
    });
  }

  return exports;
}

/**
 * Extract JSX component usage from code
 */
export function extractJSXComponents(code: string): Set<string> {
  const components = new Set<string>();

  // Match: <ComponentName or <ComponentName.SubComponent
  const jsxRegex = /<([A-Z][a-zA-Z0-9]*)/g;
  let match;
  while ((match = jsxRegex.exec(code)) !== null) {
    components.add(match[1]);
  }

  return components;
}

/**
 * Extract type/interface definitions from code
 */
export function extractTypes(
  code: string
): Array<{ name: string; kind: 'interface' | 'type' | 'enum' }> {
  const types: Array<{ name: string; kind: 'interface' | 'type' | 'enum' }> = [];

  // Match: interface X
  const interfaceRegex = /(?:export\s+)?interface\s+(\w+)/g;
  let match;
  while ((match = interfaceRegex.exec(code)) !== null) {
    types.push({ name: match[1], kind: 'interface' });
  }

  // Match: type X
  const typeRegex = /(?:export\s+)?type\s+(\w+)\s*=/g;
  while ((match = typeRegex.exec(code)) !== null) {
    types.push({ name: match[1], kind: 'type' });
  }

  // Match: enum X
  const enumRegex = /(?:export\s+)?enum\s+(\w+)/g;
  while ((match = enumRegex.exec(code)) !== null) {
    types.push({ name: match[1], kind: 'enum' });
  }

  return types;
}
