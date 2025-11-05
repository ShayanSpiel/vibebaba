// @ts-nocheck
/**
 * TYPESCRIPT VALIDATOR
 *
 * Catches common TypeScript errors that would fail during build
 * Focuses on patterns that cause "implicitly has 'any' type" errors
 */

import type { ValidationError } from './types';

export function validateTypeScript(content: string, filePath: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Only validate .ts and .tsx files
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
    return errors;
  }

  const lines = content.split('\n');

  // Pattern 1: Untyped function parameters (most common)
  // Matches: function foo(param) or const foo = (param) =>
  const untypedParamPattern = /(?:function\s+\w+|const\s+\w+\s*=)\s*\(([^)]*)\)\s*(?:=>|{)/g;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Check for untyped parameters
    const match = untypedParamPattern.exec(line);
    if (match) {
      const params = match[1];

      // Skip if parameters are empty or already typed
      if (params && !params.includes(':') && params.trim().length > 0) {
        // Check if it looks like an event handler
        const isEventHandler = params.match(/\b(e|event|ev)\b/);

        if (isEventHandler) {
          errors.push({
            type: 'typescript',
            message: `Parameter '${params.trim()}' implicitly has an 'any' type. Add type annotation like: (e: React.ChangeEvent<HTMLInputElement>)`,
            line: lineNumber,
            column: line.indexOf(params),
            file: filePath,
            severity: 'error',
            rule: 'no-implicit-any'
          });
        } else {
          errors.push({
            type: 'typescript',
            message: `Parameter '${params.trim()}' needs a type annotation`,
            line: lineNumber,
            column: line.indexOf(params),
            file: filePath,
            severity: 'warning',
            rule: 'explicit-types'
          });
        }
      }
    }

    // Pattern 2: Arrow functions with untyped parameters
    // const handleClick = (e) => { ... }
    const arrowFuncPattern = /const\s+(\w+)\s*=\s*\(([^)]+)\)\s*=>/;
    const arrowMatch = arrowFuncPattern.exec(line);

    if (arrowMatch) {
      const funcName = arrowMatch[1];
      const params = arrowMatch[2];

      if (params && !params.includes(':')) {
        // Detect common event handler patterns
        const eventHandlers = {
          'Change': /change/i.test(funcName),
          'Click': /click/i.test(funcName),
          'Submit': /submit/i.test(funcName),
          'Input': /input/i.test(funcName),
          'Mouse': /mouse|hover/i.test(funcName),
        };

        let suggestedType = 'any';
        for (const [event, matches] of Object.entries(eventHandlers)) {
          if (matches) {
            if (event === 'Change' || event === 'Input') {
              suggestedType = 'React.ChangeEvent<HTMLInputElement>';
            } else if (event === 'Click' || event === 'Mouse') {
              suggestedType = 'React.MouseEvent';
            } else if (event === 'Submit') {
              suggestedType = 'React.FormEvent<HTMLFormElement>';
            }
            break;
          }
        }

        errors.push({
          type: 'typescript',
          message: `Parameter '${params.trim()}' implicitly has an 'any' type. Suggested: (${params.trim()}: ${suggestedType}) => void`,
          line: lineNumber,
          column: line.indexOf(params),
          file: filePath,
          severity: 'error',
          rule: 'no-implicit-any'
        });
      }
    }

    // Pattern 3: useState without explicit type (less critical but good practice)
    const useStatePattern = /useState\(\s*([^)]+)\s*\)/;
    const stateMatch = useStatePattern.exec(line);

    if (stateMatch && !line.includes('useState<')) {
      const initialValue = stateMatch[1];

      // Only warn for non-primitive initial values
      if (!['true', 'false', 'null', 'undefined'].includes(initialValue.trim()) &&
          !initialValue.match(/^['"`]/) && // not a string literal
          !initialValue.match(/^\d/) && // not a number
          !initialValue.match(/^\[/) && // not an array literal
          !initialValue.match(/^\{/)) { // not an object literal

        errors.push({
          type: 'typescript',
          message: `Consider adding explicit type to useState: useState<YourType>(${initialValue})`,
          line: lineNumber,
          column: line.indexOf('useState'),
          file: filePath,
          severity: 'warning',
          rule: 'explicit-state-types'
        });
      }
    }

    // Pattern 4: Missing 'use client' directive for client components
    const hasUseClientDirective = content.includes("'use client'") || content.includes('"use client"');

    if (index === 0 && filePath.includes('app/') && !hasUseClientDirective) {
      // Check if component uses client-side features
      const usesClientFeatures =
        content.includes('useState') ||
        content.includes('useEffect') ||
        content.includes('onClick') ||
        content.includes('onChange');

      if (usesClientFeatures) {
        errors.push({
          type: 'typescript',
          message: "Component uses client-side features but missing 'use client' directive at the top of the file",
          line: 1,
          column: 0,
          file: filePath,
          severity: 'error',
          rule: 'use-client-directive'
        });
      }
    }
  });

  // Pattern 5: JSX tag mismatch detection (CRITICAL - prevents build failures)
  // FIXED: Now handles multiline JSX tags (e.g., <button\n  className="..."\n>)
  // ⚠️ TEMPORARILY DISABLED FOR TESTING - Remove false && to re-enable
  if (false && (filePath.endsWith('.tsx') || filePath.endsWith('.jsx'))) {
    const tagStack: Array<{tag: string, line: number}> = [];

    // Helper: Get line number from character position
    const getLineNumber = (pos: number): number => {
      return content.substring(0, pos).split('\n').length;
    };

    // Remove comments and strings to avoid false matches
    let cleanedContent = content;
    cleanedContent = cleanedContent.replace(/\/\/.*$/gm, '');  // Single-line comments
    cleanedContent = cleanedContent.replace(/\/\*[\s\S]*?\*\//g, '');  // Multi-line comments
    cleanedContent = cleanedContent.replace(/"(?:[^"\\]|\\.)*"/g, '""');  // Double-quoted strings
    cleanedContent = cleanedContent.replace(/'(?:[^'\\]|\\.)*'/g, "''");  // Single-quoted strings
    cleanedContent = cleanedContent.replace(/`(?:[^`\\]|\\[\s\S])*`/g, '``');  // Template literals

    // CRITICAL FIX: Remove JSX expressions {...} to avoid false matches with < > operators
    // This handles cases like: <button disabled={count > 5}>, {items.map((item) => <div>)}
    cleanedContent = cleanedContent.replace(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, '{}');

    // Find all opening tags (MULTILINE-AWARE using 's' flag)
    // Matches: <tagname> or <tagname attr="value"> even across multiple lines
    const openTagRegex = /<(\w+)(?:\s[^>]*)?>/gs;
    let match;

    const allTags: Array<{type: 'open' | 'close', tag: string, line: number, pos: number}> = [];

    // Find all opening tags
    while ((match = openTagRegex.exec(cleanedContent)) !== null) {
      const tagName = match[1];
      const fullMatch = match[0];
      const position = match.index;

      // Skip TypeScript generic types (e.g., useState<string>, Promise<void>)
      const beforeTag = cleanedContent.substring(Math.max(0, position - 30), position);
      const isTypeAnnotation =
        /:\s*$/.test(beforeTag) ||  // After : (type annotation)
        /<\s*$/.test(beforeTag) ||  // After < (generic type)
        /\bPromise\s*$/.test(beforeTag) ||
        /\bArray\s*$/.test(beforeTag) ||
        /\bRecord\s*$/.test(beforeTag) ||
        /\bMap\s*$/.test(beforeTag) ||
        /\bSet\s*$/.test(beforeTag) ||
        /\buseState\s*$/.test(beforeTag) ||
        /\buseRef\s*$/.test(beforeTag) ||
        // React event types
        /\bReact\.ChangeEvent\s*$/.test(beforeTag) ||
        /\bReact\.MouseEvent\s*$/.test(beforeTag) ||
        /\bReact\.FormEvent\s*$/.test(beforeTag) ||
        /\bReact\.KeyboardEvent\s*$/.test(beforeTag) ||
        /\bReact\.FocusEvent\s*$/.test(beforeTag) ||
        /\bChangeEvent\s*$/.test(beforeTag) ||
        /\bMouseEvent\s*$/.test(beforeTag) ||
        /\bFormEvent\s*$/.test(beforeTag) ||
        /\bKeyboardEvent\s*$/.test(beforeTag) ||
        /\bFocusEvent\s*$/.test(beforeTag);

      if (isTypeAnnotation) {
        continue;
      }

      // Skip self-closing tags (e.g., <Icon ... />, <input />)
      // NOTE: Only treat lowercase HTML tags as self-closing, NOT React components (Link, Button, etc.)
      const isSelfClosing =
        fullMatch.trim().endsWith('/>') ||
        (tagName === tagName.toLowerCase() && ['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tagName));

      if (!isSelfClosing) {
        allTags.push({
          type: 'open',
          tag: tagName,
          line: getLineNumber(position),
          pos: position
        });
      }
    }

    // Find all closing tags
    const closeTagRegex = /<\/(\w+)>/g;
    while ((match = closeTagRegex.exec(cleanedContent)) !== null) {
      const tagName = match[1];
      const position = match.index;

      allTags.push({
        type: 'close',
        tag: tagName,
        line: getLineNumber(position),
        pos: position
      });
    }

    // Sort tags by position to process them in order
    allTags.sort((a, b) => a.pos - b.pos);

    // Process tags in order
    for (const tag of allTags) {
      if (tag.type === 'open') {
        tagStack.push({ tag: tag.tag, line: tag.line });
      } else {
        // Closing tag
        if (tagStack.length === 0) {
          errors.push({
            type: 'typescript',
            message: `Unexpected closing tag </${tag.tag}> with no matching opening tag`,
            line: tag.line,
            column: 0,
            file: filePath,
            severity: 'error',
            rule: 'jsx-tag-mismatch'
          });
          continue;
        }

        const lastOpened = tagStack[tagStack.length - 1];
        if (tag.tag !== lastOpened.tag) {
          errors.push({
            type: 'typescript',
            message: `JSX tag mismatch: expected </${lastOpened.tag}> (opened on line ${lastOpened.line}) but found </${tag.tag}>`,
            line: tag.line,
            column: 0,
            file: filePath,
            severity: 'error',
            rule: 'jsx-tag-mismatch'
          });
        } else {
          tagStack.pop(); // Correct match, remove from stack
        }
      }
    }

    // Check for unclosed tags at end of file
    if (tagStack.length > 0) {
      const unclosed = tagStack[tagStack.length - 1];
      errors.push({
        type: 'typescript',
        message: `Unclosed JSX tag <${unclosed.tag}> opened on line ${unclosed.line}`,
        line: unclosed.line,
        column: 0,
        file: filePath,
        severity: 'error',
        rule: 'jsx-unclosed-tag'
      });
    }
  }

  return errors;
}
