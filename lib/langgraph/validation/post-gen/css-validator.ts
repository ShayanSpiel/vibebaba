/**
 * CSS VALIDATION MODULE
 *
 * Validates CSS syntax and catches common errors
 * Uses custom parsing since stylelint requires async setup
 */

import type { ValidationError } from './types';

/**
 * Validate CSS content
 */
export function validateCSS(content: string, filePath: string): ValidationError[] {
  const errors: ValidationError[] = [];

  try {
    // Extract all <style> blocks
    const styleBlocks = extractStyleBlocks(content);

    for (const { css, startLine } of styleBlocks) {
      errors.push(...validateCSSBlock(css, filePath, startLine));
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
 * Extract <style> blocks from HTML
 */
function extractStyleBlocks(content: string): Array<{ css: string; startLine: number }> {
  const blocks: Array<{ css: string; startLine: number }> = [];
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;

  let match;
  while ((match = styleRegex.exec(content)) !== null) {
    const css = match[1];
    const startLine = getLineNumber(content, match.index);
    blocks.push({ css, startLine });
  }

  return blocks;
}

/**
 * Validate a CSS block
 */
function validateCSSBlock(css: string, filePath: string, offsetLine: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for common CSS syntax errors

  // 1. Check for unclosed braces
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

  // 2. Check for common typos in property names
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
      const line = getLineNumberInCSS(css, match.index || 0) + offsetLine;
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

  // 3. Check for missing units on numeric values (except 0)
  const numericValueRegex = /:\s*([1-9]\d*)\s*[;}]/g;
  const matches = css.matchAll(numericValueRegex);

  for (const match of matches) {
    const value = match[1];
    const line = getLineNumberInCSS(css, match.index || 0) + offsetLine;

    // Skip if it's a property that doesn't need units (opacity, z-index, etc.)
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

  // 4. Check for duplicate properties in same rule
  const ruleBlocks = css.split('}').filter((block) => block.trim());

  for (const block of ruleBlocks) {
    const properties = new Map<string, number[]>();
    const propertyRegex = /(\w+(?:-\w+)*)\s*:/g;

    let match;
    while ((match = propertyRegex.exec(block)) !== null) {
      const property = match[1].toLowerCase();
      const line = getLineNumberInCSS(css, match.index || 0) + offsetLine;

      if (!properties.has(property)) {
        properties.set(property, []);
      }
      properties.get(property)!.push(line);
    }

    // Report duplicates
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

  // 5. Check for invalid color formats
  // Match: # followed by 0-2 digits OR 4-5 digits (invalid lengths)
  // Also match ## (double hash) or just # with no digits
  const invalidColorRegex = /##|#(?![0-9a-f]{3}(?:[0-9a-f]{3})?\b)[0-9a-f]{0,5}\b|#\s|#;|#:/gi;
  const colorMatches = css.matchAll(invalidColorRegex);

  for (const match of colorMatches) {
    const line = getLineNumberInCSS(css, match.index || 0) + offsetLine;
    const colorValue = match[0].trim();

    // Calculate digit count (excluding the # symbol)
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
    } else {
      errorMessage = `Invalid hex color "${colorValue}" - must be 3 or 6 digits`;
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

/**
 * Get line number within CSS content
 */
function getLineNumberInCSS(css: string, index: number): number {
  return css.substring(0, index).split('\n').length;
}

/**
 * Get line number from string index in full content
 */
function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split('\n').length;
}
