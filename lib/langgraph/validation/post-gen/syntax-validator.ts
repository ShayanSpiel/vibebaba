// @ts-nocheck
/**
 * CONSOLIDATED SYNTAX VALIDATOR
 *
 * Combines HTML, CSS, JavaScript, and TypeScript syntax validation
 * into a single, unified validator class to eliminate code duplication.
 *
 * Previously separate files:
 * - html-validator.ts (274 lines)
 * - css-validator.ts (229 lines)
 * - js-validator.ts (211 lines)
 * - typescript-validator.ts (311 lines - syntax checking parts)
 */

import { HTMLHint } from 'htmlhint';
import type { ValidationError } from './types';
import {
  getLineNumber,
  extractStyleBlocks,
  extractScriptBlocks,
  areBracketsBalanced,
} from '@/lib/utils/validation';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Validation strictness - can be toggled
let STRICT_NESTING_VALIDATION = false;

export function setStrictNesting(strict: boolean) {
  STRICT_NESTING_VALIDATION = strict;
}

// HTMLHint configuration
const HTML_RULES = {
  'tagname-lowercase': true,
  'attr-lowercase': true,
  'attr-value-double-quotes': true,
  'doctype-first': true,
  'tag-pair': true,
  'spec-char-escape': false, // DISABLED: Causes false positives on normal HTML syntax (< and > in tags)
  'id-unique': true,
  'src-not-empty': true,
  'attr-no-duplication': true,
  'title-require': true,
};

// ============================================================================
// MAIN VALIDATOR CLASS
// ============================================================================

export class SyntaxValidator {
  /**
   * Validate HTML content
   */
  validateHTML(content: string, filePath: string): ValidationError[] {
    const errors: ValidationError[] = [];

    try {
      // Run HTMLHint validation
      const messages = HTMLHint.verify(content, HTML_RULES);

      // Convert HTMLHint messages to our error format
      for (const msg of messages) {
        errors.push({
          file: filePath,
          line: msg.line,
          column: msg.col,
          severity: msg.type as 'error' | 'warning',
          message: msg.message,
          rule: msg.rule?.id || 'unknown',
          autoFixable: this.isHTMLAutoFixable(msg.rule?.id || ''),
          suggestion: this.getHTMLSuggestion(msg.rule?.id || '', msg),
        });
      }

      // Additional custom validations
      errors.push(...this.validateHTMLCustomRules(content, filePath));
    } catch (error: any) {
      errors.push({
        file: filePath,
        line: 1,
        column: 1,
        severity: 'error',
        message: `HTML validation failed: ${error.message}`,
        rule: 'validation-error',
        autoFixable: false,
      });
    }

    return errors;
  }

  /**
   * Validate CSS content
   */
  validateCSS(content: string, filePath: string): ValidationError[] {
    const errors: ValidationError[] = [];

    try {
      // Extract all <style> blocks
      const styleBlocks = extractStyleBlocks(content);

      for (const { css, startLine } of styleBlocks) {
        errors.push(...this.validateCSSBlock(css, filePath, startLine));
      }
    } catch (error: any) {
      errors.push({
        file: filePath,
        line: 1,
        column: 1,
        severity: 'error',
        message: `CSS validation failed: ${error.message}`,
        rule: 'validation-error',
        autoFixable: false,
      });
    }

    return errors;
  }

  /**
   * Validate JavaScript content
   */
  validateJavaScript(content: string, filePath: string): ValidationError[] {
    const errors: ValidationError[] = [];

    try {
      // Extract all <script> blocks
      const scriptBlocks = extractScriptBlocks(content);

      for (const { js, startLine } of scriptBlocks) {
        errors.push(...this.validateJSBlock(js, filePath, startLine));
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
   * Validate TypeScript content
   */
  validateTypeScript(content: string, filePath: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Only validate .ts and .tsx files
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
      return errors;
    }

    const lines = content.split('\n');

    // Pattern 1: Untyped function parameters
    const untypedParamPattern = /(?:function\s+\w+|const\s+\w+\s*=)\s*\(([^)]*)\)\s*(?:=>|{)/g;

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for untyped parameters
      const match = untypedParamPattern.exec(line);
      if (match) {
        const params = match[1];

        if (params && !params.includes(':') && params.trim().length > 0) {
          const isEventHandler = params.match(/\b(e|event|ev)\b/);

          if (isEventHandler) {
            errors.push({
              type: 'typescript',
              message: `Parameter '${params.trim()}' implicitly has an 'any' type. Add type annotation like: (e: React.ChangeEvent<HTMLInputElement>)`,
              line: lineNumber,
              column: line.indexOf(params),
              file: filePath,
              severity: 'error',
              rule: 'no-implicit-any',
            });
          } else {
            errors.push({
              type: 'typescript',
              message: `Parameter '${params.trim()}' needs a type annotation`,
              line: lineNumber,
              column: line.indexOf(params),
              file: filePath,
              severity: 'warning',
              rule: 'explicit-types',
            });
          }
        }
      }

      // Pattern 2: Arrow functions with untyped parameters
      const arrowFuncPattern = /const\s+(\w+)\s*=\s*\(([^)]+)\)\s*=>/;
      const arrowMatch = arrowFuncPattern.exec(line);

      if (arrowMatch) {
        const funcName = arrowMatch[1];
        const params = arrowMatch[2];

        if (params && !params.includes(':')) {
          const eventHandlers = {
            Change: /change/i.test(funcName),
            Click: /click/i.test(funcName),
            Submit: /submit/i.test(funcName),
            Input: /input/i.test(funcName),
            Mouse: /mouse|hover/i.test(funcName),
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
            rule: 'no-implicit-any',
          });
        }
      }

      // Pattern 3: useState without explicit type
      const useStatePattern = /useState\(\s*([^)]+)\s*\)/;
      const stateMatch = useStatePattern.exec(line);

      if (stateMatch && !line.includes('useState<')) {
        const initialValue = stateMatch[1];

        if (
          !['true', 'false', 'null', 'undefined'].includes(initialValue.trim()) &&
          !initialValue.match(/^['"`]/) &&
          !initialValue.match(/^\d/) &&
          !initialValue.match(/^\[/) &&
          !initialValue.match(/^\{/)
        ) {
          errors.push({
            type: 'typescript',
            message: `Consider adding explicit type to useState: useState<YourType>(${initialValue})`,
            line: lineNumber,
            column: line.indexOf('useState'),
            file: filePath,
            severity: 'warning',
            rule: 'explicit-state-types',
          });
        }
      }

      // Pattern 4: Missing 'use client' directive
      const hasUseClientDirective =
        content.includes("'use client'") || content.includes('"use client"');
      const isApiRoute = filePath.includes('/api/') || filePath.endsWith('/route.ts');

      if (index === 0 && filePath.includes('app/') && !isApiRoute && !hasUseClientDirective) {
        const usesClientFeatures =
          content.includes('useState') ||
          content.includes('useEffect') ||
          content.includes('onClick') ||
          content.includes('onChange');

        if (usesClientFeatures) {
          errors.push({
            type: 'typescript',
            message:
              "Component uses client-side features but missing 'use client' directive at the top of the file",
            line: 1,
            column: 0,
            file: filePath,
            severity: 'error',
            rule: 'use-client-directive',
          });
        }
      }
    });

    return errors;
  }

  // ============================================================================
  // HTML VALIDATION HELPERS
  // ============================================================================

  private validateHTMLCustomRules(content: string, filePath: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for duplicate IDs
    const idMatches = content.matchAll(/id=["']([^"']+)["']/gi);
    const ids = new Map<string, number[]>();

    for (const match of idMatches) {
      const id = match[1];
      const line = getLineNumber(content, match.index || 0);

      if (!ids.has(id)) {
        ids.set(id, []);
      }
      ids.get(id)!.push(line);
    }

    for (const [id, lines] of ids.entries()) {
      if (lines.length > 1) {
        errors.push({
          file: filePath,
          line: lines[1],
          column: 1,
          severity: 'error',
          message: `Duplicate ID "${id}" (first used on line ${lines[0]})`,
          rule: 'id-unique',
          autoFixable: false,
          suggestion: `Use unique IDs for each element. Consider using classes instead.`,
        });
      }
    }

    // Check for proper DOCTYPE
    if (!content.trim().startsWith('<!DOCTYPE html>')) {
      errors.push({
        file: filePath,
        line: 1,
        column: 1,
        severity: 'error',
        message: 'Missing or incorrect DOCTYPE declaration',
        rule: 'doctype-first',
        autoFixable: true,
        suggestion: 'Add <!DOCTYPE html> at the beginning of the file',
      });
    }

    // Check for missing closing tags
    if (content.includes('<body') && !content.includes('</body>')) {
      errors.push({
        file: filePath,
        line: 1,
        column: 1,
        severity: 'error',
        message: 'Missing closing </body> tag',
        rule: 'tag-pair',
        autoFixable: true,
      });
    }

    if (content.includes('<html') && !content.includes('</html>')) {
      errors.push({
        file: filePath,
        line: 1,
        column: 1,
        severity: 'error',
        message: 'Missing closing </html> tag',
        rule: 'tag-pair',
        autoFixable: true,
      });
    }

    // Check for unescaped special characters
    const textContentPattern = />([^<]*)</g;
    let textMatch;
    while ((textMatch = textContentPattern.exec(content)) !== null) {
      const textContent = textMatch[1];

      if (textContent.includes('<') || textContent.includes('>')) {
        const line = getLineNumber(content, textMatch.index);
        errors.push({
          file: filePath,
          line,
          column: 1,
          severity: 'error',
          message: 'Special characters < and > must be escaped as &lt; and &gt; in text content',
          rule: 'spec-char-escape',
          autoFixable: true,
          suggestion: 'Replace < with &lt; and > with &gt; in text content',
        });
      }

      const ampersandPattern = /&(?![a-zA-Z]+;|#\d+;|#x[0-9a-fA-F]+;)/;
      if (ampersandPattern.test(textContent)) {
        const line = getLineNumber(content, textMatch.index);
        errors.push({
          file: filePath,
          line,
          column: 1,
          severity: 'warning',
          message: 'Standalone & should be escaped as &amp; in text content',
          rule: 'spec-char-escape',
          autoFixable: true,
          suggestion: "Replace & with &amp; unless it's part of an HTML entity",
        });
      }
    }

    // Check for invalid nesting
    const invalidNestingPatterns = [
      { pattern: /<p[^>]*>[\s\S]*?<div/gim, message: '<div> cannot be nested inside <p>' },
      {
        pattern: /<p[^>]*>[\s\S]*?<section/gim,
        message: '<section> cannot be nested inside <p>',
      },
      {
        pattern: /<p[^>]*>[\s\S]*?<article/gim,
        message: '<article> cannot be nested inside <p>',
      },
      { pattern: /<p[^>]*>[\s\S]*?<header/gim, message: '<header> cannot be nested inside <p>' },
      { pattern: /<p[^>]*>[\s\S]*?<footer/gim, message: '<footer> cannot be nested inside <p>' },
      { pattern: /<p[^>]*>[\s\S]*?<nav/gim, message: '<nav> cannot be nested inside <p>' },
      { pattern: /<p[^>]*>[\s\S]*?<aside/gim, message: '<aside> cannot be nested inside <p>' },
      { pattern: /<p[^>]*>[\s\S]*?<main/gim, message: '<main> cannot be nested inside <p>' },
      {
        pattern: /<p[^>]*>[\s\S]*?<h[1-6]/gim,
        message: 'Heading tags cannot be nested inside <p>',
      },
      { pattern: /<p[^>]*>[\s\S]*?<ul/gim, message: '<ul> cannot be nested inside <p>' },
      { pattern: /<p[^>]*>[\s\S]*?<ol/gim, message: '<ol> cannot be nested inside <p>' },
      { pattern: /<p[^>]*>[\s\S]*?<table/gim, message: '<table> cannot be nested inside <p>' },
      { pattern: /<p[^>]*>[\s\S]*?<form/gim, message: '<form> cannot be nested inside <p>' },
    ];

    for (const { pattern, message } of invalidNestingPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const beforeMatch = content.substring(0, (match.index || 0) + match[0].length);
        const pTagStart = beforeMatch.lastIndexOf('<p');
        const pTagEnd = beforeMatch.indexOf('</p>', pTagStart);

        if (pTagEnd === -1 || pTagEnd > (match.index || 0)) {
          errors.push({
            file: filePath,
            line: getLineNumber(content, match.index || 0),
            column: 1,
            severity: STRICT_NESTING_VALIDATION ? 'error' : 'warning',
            message: `Invalid nesting: ${message}`,
            rule: 'invalid-nesting',
            autoFixable: false,
            suggestion:
              'Use <div> or <section> as the outer container, then put <p> tags inside for text content.',
          });
        }
      }
    }

    return errors;
  }

  private isHTMLAutoFixable(ruleId: string): boolean {
    const autoFixableRules = [
      'doctype-first',
      'tagname-lowercase',
      'attr-lowercase',
      'attr-value-double-quotes',
      'tag-pair',
    ];
    return autoFixableRules.includes(ruleId);
  }

  private getHTMLSuggestion(ruleId: string, msg: any): string | undefined {
    const suggestions: Record<string, string> = {
      'doctype-first': 'Add <!DOCTYPE html> at the start of your HTML file',
      'tagname-lowercase': 'Use lowercase for all HTML tag names',
      'attr-lowercase': 'Use lowercase for all HTML attributes',
      'attr-value-double-quotes': 'Use double quotes for attribute values',
      'tag-pair': 'Ensure all opening tags have matching closing tags',
      'id-unique': 'Each ID must be unique. Use classes for multiple elements with same styling.',
      'src-not-empty': 'Do not leave src attributes empty',
      'attr-no-duplication': 'Remove duplicate attributes',
      'title-require': 'Add a <title> tag inside <head>',
    };

    return suggestions[ruleId];
  }

  // ============================================================================
  // CSS VALIDATION HELPERS
  // ============================================================================

  private validateCSSBlock(css: string, filePath: string, offsetLine: number): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for unclosed braces
    const openBraces = (css.match(/{/g) || []).length;
    const closeBraces = (css.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push({
        file: filePath,
        line: offsetLine,
        column: 1,
        severity: 'error',
        message: `Unbalanced braces: ${openBraces} opening, ${closeBraces} closing`,
        rule: 'brace-balance',
        autoFixable: false,
        suggestion: 'Check that all CSS rules have matching opening and closing braces',
      });
    }

    // Check for common typos
    const commonTypos = [
      { wrong: 'colour', right: 'color' },
      { wrong: 'centre', right: 'center' },
      { wrong: 'floaat', right: 'float' },
      { wrong: 'wiidth', right: 'width' },
      { wrong: 'heigth', right: 'height' },
      { wrong: 'posiiton', right: 'position' },
      { wrong: 'margiin', right: 'margin' },
      { wrong: 'paddinng', right: 'padding' },
    ];

    for (const { wrong, right } of commonTypos) {
      const regex = new RegExp(`\\b${wrong}\\s*:`, 'gi');
      const matches = css.matchAll(regex);

      for (const match of matches) {
        const line = this.getLineNumberInBlock(css, match.index || 0) + offsetLine;
        errors.push({
          file: filePath,
          line,
          column: 1,
          severity: 'error',
          message: `Unknown property "${wrong}" - did you mean "${right}"?`,
          rule: 'property-no-unknown',
          autoFixable: true,
          suggestion: `Change "${wrong}" to "${right}"`,
        });
      }
    }

    // Check for missing units
    const numericValueRegex = /:\s*([1-9]\d*)\s*[;}]/g;
    const matches = css.matchAll(numericValueRegex);

    for (const match of matches) {
      const value = match[1];
      const line = this.getLineNumberInBlock(css, match.index || 0) + offsetLine;

      const beforeColon = css.substring(Math.max(0, (match.index || 0) - 50), match.index || 0);
      const property = beforeColon.match(/(\w+)\s*:\s*$/)?.[1];

      const noUnitProperties = ['opacity', 'z-index', 'font-weight', 'line-height', 'flex', 'order'];
      if (property && noUnitProperties.includes(property.toLowerCase())) {
        continue;
      }

      errors.push({
        file: filePath,
        line,
        column: 1,
        severity: 'warning',
        message: `Missing unit for value "${value}"`,
        rule: 'unit-no-unknown',
        autoFixable: true,
        suggestion: 'Add a unit like px, em, rem, %, etc.',
      });
    }

    // Check for duplicate properties
    const ruleBlocks = css.split('}').filter((block) => block.trim());

    for (const block of ruleBlocks) {
      const properties = new Map<string, number[]>();
      const propertyRegex = /(\w+(?:-\w+)*)\s*:/g;

      let match;
      while ((match = propertyRegex.exec(block)) !== null) {
        const property = match[1].toLowerCase();
        const line = this.getLineNumberInBlock(css, match.index || 0) + offsetLine;

        if (!properties.has(property)) {
          properties.set(property, []);
        }
        properties.get(property)!.push(line);
      }

      for (const [property, lines] of properties.entries()) {
        if (lines.length > 1) {
          errors.push({
            file: filePath,
            line: lines[lines.length - 1],
            column: 1,
            severity: 'warning',
            message: `Duplicate property "${property}" (first declared on line ${lines[0]})`,
            rule: 'declaration-block-no-duplicate-properties',
            autoFixable: false,
            suggestion: 'Remove duplicate properties or combine them',
          });
        }
      }
    }

    // Check for invalid color formats
    const invalidColorRegex = /##|#(?![0-9a-f]{3}(?:[0-9a-f]{3})?\b)[0-9a-f]{0,5}\b|#\s|#;|#:/gi;
    const colorMatches = css.matchAll(invalidColorRegex);

    for (const match of colorMatches) {
      const line = this.getLineNumberInBlock(css, match.index || 0) + offsetLine;
      const colorValue = match[0].trim();
      const digitCount = colorValue.replace(/#/g, '').length;

      let errorMessage = `Invalid hex color "${colorValue}"`;
      if (colorValue === '##') {
        errorMessage = `Invalid hex color "##" - double hash is not valid`;
      } else if (colorValue === '#' || colorValue === '#;' || colorValue === '#:') {
        errorMessage = `Invalid hex color "${colorValue}" - empty color value`;
      } else if (digitCount < 3) {
        errorMessage = `Invalid hex color "${colorValue}" - must be 3 or 6 digits (found ${digitCount})`;
      } else if (digitCount === 4 || digitCount === 5) {
        errorMessage = `Invalid hex color "${colorValue}" - must be 3 or 6 digits (found ${digitCount})`;
      }

      errors.push({
        file: filePath,
        line,
        column: 1,
        severity: 'error',
        message: errorMessage,
        rule: 'color-no-invalid-hex',
        autoFixable: false,
        suggestion:
          'Use valid hex format: #RGB (3 digits) or #RRGGBB (6 digits). Examples: #FFF, #000000, #667eea',
      });
    }

    return errors;
  }

  // ============================================================================
  // JAVASCRIPT VALIDATION HELPERS
  // ============================================================================

  private validateJSBlock(js: string, filePath: string, offsetLine: number): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for unbalanced brackets using shared utility
    const brackets = {
      '{': '}',
      '(': ')',
      '[': ']',
    };

    if (!areBracketsBalanced(js, brackets)) {
      // Find the specific unmatched bracket
      const stack: string[] = [];
      for (let i = 0; i < js.length; i++) {
        const char = js[i];

        if (char in brackets) {
          stack.push(char);
        } else if (Object.values(brackets).includes(char)) {
          const last = stack.pop();
          if (!last || brackets[last as keyof typeof brackets] !== char) {
            const line = this.getLineNumberInBlock(js, i) + offsetLine;
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
    }

    // Check for missing await on window.db calls
    const dbCallRegex =
      /(?:const|let|var)\s+(\w+)\s*=\s*window\.db\.(get|add|update|delete|find|findOne)\(/g;
    const matches = js.matchAll(dbCallRegex);

    for (const match of matches) {
      const beforeMatch = js.substring(Math.max(0, (match.index || 0) - 20), match.index || 0);

      if (!beforeMatch.includes('await')) {
        const line = this.getLineNumberInBlock(js, match.index || 0) + offsetLine;
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

    // Check for console.log
    const consoleLogMatches = js.matchAll(/console\.log\(/g);
    for (const match of consoleLogMatches) {
      const line = this.getLineNumberInBlock(js, match.index || 0) + offsetLine;
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

    return errors;
  }

  // ============================================================================
  // SHARED HELPERS
  // ============================================================================

  private getLineNumberInBlock(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS (Backward compatibility)
// ============================================================================

const validator = new SyntaxValidator();

export function validateHTML(content: string, filePath: string): ValidationError[] {
  return validator.validateHTML(content, filePath);
}

export function validateCSS(content: string, filePath: string): ValidationError[] {
  return validator.validateCSS(content, filePath);
}

export function validateJavaScript(content: string, filePath: string): ValidationError[] {
  return validator.validateJavaScript(content, filePath);
}

export function validateTypeScript(content: string, filePath: string): ValidationError[] {
  return validator.validateTypeScript(content, filePath);
}
