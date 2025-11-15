/**
 * HTML VALIDATION MODULE
 *
 * Validates HTML syntax using HTMLHint
 * Catches malformed HTML, missing tags, duplicate IDs, etc.
 */

import { HTMLHint } from 'htmlhint';
import type { ValidationError } from './types';

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

/**
 * Validate HTML content
 */
export function validateHTML(content: string, filePath: string): ValidationError[] {
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
        autoFixable: isAutoFixable(msg.rule?.id || ''),
        suggestion: getSuggestion(msg.rule?.id || '', msg),
      });
    }

    // Additional custom validations
    errors.push(...validateCustomRules(content, filePath));
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
 * Custom validation rules not covered by HTMLHint
 */
function validateCustomRules(content: string, filePath: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for duplicate IDs more thoroughly
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

  // Report duplicates
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

  // Check for missing </body> or </html>
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

  // Check for unescaped special characters in TEXT CONTENT (not in tags)
  // This is a custom implementation since HTMLHint's spec-char-escape rule has false positives
  const textContentPattern = />([^<]*)</g;
  let textMatch;
  while ((textMatch = textContentPattern.exec(content)) !== null) {
    const textContent = textMatch[1];

    // Check for < or > in text content (these need escaping as &lt; and &gt;)
    if (textContent.includes('<') || textContent.includes('>')) {
      const line = getLineNumber(content, textMatch.index);
      errors.push({
        file: filePath,
        line,
        column: 1,
        severity: 'error',
        message: 'Special characters < and > must be escaped as &lt; and &gt; in text content',
        rule: 'spec-char-escape',
        autoFixable: true, // NOW AUTO-FIXABLE - we can safely escape in text content
        suggestion: 'Replace < with &lt; and > with &gt; in text content (not in HTML tags)',
      });
    }

    // Check for & not followed by entity (like &amp;, &nbsp;, &#...)
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
        autoFixable: true, // NOW AUTO-FIXABLE - we can safely escape in text content
        suggestion: "Replace & with &amp; unless it's part of an HTML entity",
      });
    }
  }

  // Check for invalid nesting (e.g., <div> inside <p>)
  // P tags can only contain inline elements (phrasing content), not block elements
  const invalidNestingPatterns = [
    { pattern: /<p[^>]*>[\s\S]*?<div/gim, message: '<div> cannot be nested inside <p>' },
    { pattern: /<p[^>]*>[\s\S]*?<section/gim, message: '<section> cannot be nested inside <p>' },
    { pattern: /<p[^>]*>[\s\S]*?<article/gim, message: '<article> cannot be nested inside <p>' },
    { pattern: /<p[^>]*>[\s\S]*?<header/gim, message: '<header> cannot be nested inside <p>' },
    { pattern: /<p[^>]*>[\s\S]*?<footer/gim, message: '<footer> cannot be nested inside <p>' },
    { pattern: /<p[^>]*>[\s\S]*?<nav/gim, message: '<nav> cannot be nested inside <p>' },
    { pattern: /<p[^>]*>[\s\S]*?<aside/gim, message: '<aside> cannot be nested inside <p>' },
    { pattern: /<p[^>]*>[\s\S]*?<main/gim, message: '<main> cannot be nested inside <p>' },
    { pattern: /<p[^>]*>[\s\S]*?<h[1-6]/gim, message: 'Heading tags cannot be nested inside <p>' },
    { pattern: /<p[^>]*>[\s\S]*?<ul/gim, message: '<ul> cannot be nested inside <p>' },
    { pattern: /<p[^>]*>[\s\S]*?<ol/gim, message: '<ol> cannot be nested inside <p>' },
    { pattern: /<p[^>]*>[\s\S]*?<table/gim, message: '<table> cannot be nested inside <p>' },
    { pattern: /<p[^>]*>[\s\S]*?<form/gim, message: '<form> cannot be nested inside <p>' },
  ];

  for (const { pattern, message } of invalidNestingPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      // Make sure it's not a false positive (check that we're actually inside the <p> tag)
      const beforeMatch = content.substring(0, (match.index || 0) + match[0].length);
      const pTagStart = beforeMatch.lastIndexOf('<p');
      const pTagEnd = beforeMatch.indexOf('</p>', pTagStart);

      // Only report if we haven't closed the <p> tag yet
      if (pTagEnd === -1 || pTagEnd > (match.index || 0)) {
        errors.push({
          file: filePath,
          line: getLineNumber(content, match.index || 0),
          column: 1,
          // In non-strict mode, invalid nesting is a warning (browsers auto-correct this)
          // In strict mode, it's an error (technically invalid HTML5)
          severity: STRICT_NESTING_VALIDATION ? 'error' : 'warning',
          message: `Invalid nesting: ${message}`,
          rule: 'invalid-nesting',
          autoFixable: false,
          suggestion:
            'Use <div> or <section> as the outer container, then put <p> tags inside for text content. <p> tags should only contain inline elements like <span>, <a>, <strong>, <em>.',
        });
      }
    }
  }

  return errors;
}

/**
 * Check if an error can be auto-fixed
 */
function isAutoFixable(ruleId: string): boolean {
  const autoFixableRules = [
    'doctype-first',
    'tagname-lowercase',
    'attr-lowercase',
    'attr-value-double-quotes',
    'tag-pair', // Simple cases only
  ];
  return autoFixableRules.includes(ruleId);
}

/**
 * Get suggestion for fixing an error
 */
function getSuggestion(ruleId: string, msg: any): string | undefined {
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

/**
 * Get line number from string index
 */
function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split('\n').length;
}
