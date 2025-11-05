/**
 * JAVASCRIPT VALIDATION MODULE
 *
 * Validates JavaScript syntax and catches common errors
 * Uses custom parsing to detect common issues
 */

import type { ValidationError } from './types';

/**
 * Validate JavaScript content
 */
export function validateJavaScript(content: string, filePath: string): ValidationError[] {
  const errors: ValidationError[] = [];

  try {
    // Extract all <script> blocks
    const scriptBlocks = extractScriptBlocks(content);

    for (const { js, startLine } of scriptBlocks) {
      errors.push(...validateJSBlock(js, filePath, startLine));
    }

  } catch (error: any) {
    errors.push({
      file: filePath,
      line: 1,
      column: 1,
      severity: 'error',
      message: `JavaScript validation failed: ${error.message}`,
      rule: 'validation-error',
      autoFixable: false,
    });
  }

  return errors;
}

/**
 * Extract <script> blocks from HTML
 */
function extractScriptBlocks(content: string): Array<{ js: string; startLine: number }> {
  const blocks: Array<{ js: string; startLine: number }> = [];
  const scriptRegex = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;

  let match;
  while ((match = scriptRegex.exec(content)) !== null) {
    const js = match[1];
    const startLine = getLineNumber(content, match.index);
    blocks.push({ js, startLine });
  }

  return blocks;
}

/**
 * Validate a JavaScript block
 */
function validateJSBlock(js: string, filePath: string, offsetLine: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Check for unbalanced brackets/parens/braces
  const brackets = {
    '{': '}',
    '(': ')',
    '[': ']',
  };

  const stack: string[] = [];
  for (let i = 0; i < js.length; i++) {
    const char = js[i];

    if (char in brackets) {
      stack.push(char);
    } else if (Object.values(brackets).includes(char)) {
      const last = stack.pop();
      if (!last || brackets[last as keyof typeof brackets] !== char) {
        const line = getLineNumberInJS(js, i) + offsetLine;
        errors.push({
          file: filePath,
          line,
          column: 1,
          severity: 'error',
          message: `Unmatched closing bracket "${char}"`,
          rule: 'syntax-error',
          autoFixable: false,
        });
      }
    }
  }

  if (stack.length > 0) {
    errors.push({
      file: filePath,
      line: offsetLine + js.split('\n').length,
      column: 1,
      severity: 'error',
      message: `Unclosed bracket "${stack[stack.length - 1]}"`,
      rule: 'syntax-error',
      autoFixable: false,
    });
  }

  // 2. Check for missing await on window.db calls
  const dbCallRegex = /(?:const|let|var)\s+(\w+)\s*=\s*window\.db\.(get|add|update|delete|find|findOne)\(/g;
  const matches = js.matchAll(dbCallRegex);

  for (const match of matches) {
    // Check if await is NOT before it
    const beforeMatch = js.substring(Math.max(0, (match.index || 0) - 20), match.index || 0);

    if (!beforeMatch.includes('await')) {
      const line = getLineNumberInJS(js, match.index || 0) + offsetLine;
      const varName = match[1];
      const method = match[2];

      errors.push({
        file: filePath,
        line,
        column: 1,
        severity: 'error',
        message: `Missing "await" for async database call: window.db.${method}()`,
        rule: 'require-await',
        autoFixable: true,
        suggestion: `Add "await" before window.db.${method}()`,
        context: match[0],
      });
    }
  }

  // 3. Check for undefined variables (basic check)
  const commonUndefinedVars = [
    'data',
    'items',
    'item',
    'user',
    'users',
    'response',
    'result',
    'value',
  ];

  for (const varName of commonUndefinedVars) {
    // Check if variable is used but not declared
    const usageRegex = new RegExp(`\\b${varName}\\b`, 'g');
    const declarationRegex = new RegExp(`(?:const|let|var)\\s+${varName}\\b`, 'g');

    const usages = js.match(usageRegex);
    const declarations = js.match(declarationRegex);

    if (usages && usages.length > (declarations?.length || 0)) {
      // Find first usage after first declaration (or first usage if no declaration)
      const firstDeclIndex = js.search(declarationRegex);
      const usageAfterDecl = js.substring(firstDeclIndex + 1).search(usageRegex);

      if (usageAfterDecl === -1 && firstDeclIndex === -1 && usages.length > 0) {
        // Variable used but never declared
        const firstUsageIndex = js.search(usageRegex);
        const line = getLineNumberInJS(js, firstUsageIndex) + offsetLine;

        errors.push({
          file: filePath,
          line,
          column: 1,
          severity: 'warning',
          message: `"${varName}" may not be defined`,
          rule: 'no-undef',
          autoFixable: false,
          suggestion: `Ensure "${varName}" is declared before use`,
        });
      }
    }
  }

  // 4. Check for console.log (optional warning)
  const consoleLogMatches = js.matchAll(/console\.log\(/g);
  for (const match of consoleLogMatches) {
    const line = getLineNumberInJS(js, match.index || 0) + offsetLine;
    errors.push({
      file: filePath,
      line,
      column: 1,
      severity: 'warning',
      message: 'Unexpected console.log statement',
      rule: 'no-console',
      autoFixable: false,
      suggestion: 'Remove console.log in production code',
    });
  }

  // 5. Check for basic syntax patterns that indicate errors
  // Note: These checks are now handled by the bracket matching above (lines 62-102)
  // Removing duplicate/unreliable pattern-based checks that caused false positives

  return errors;
}

/**
 * Get line number within JS content
 */
function getLineNumberInJS(js: string, index: number): number {
  return js.substring(0, index).split('\n').length;
}

/**
 * Get line number from string index in full content
 */
function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split('\n').length;
}
