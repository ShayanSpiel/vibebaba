/**
 * STRUCTURE & LINK VALIDATION MODULE
 *
 * Validates file structure, links, and multi-page consistency
 */

import type { ValidationError, FileToValidate } from './types';

/**
 * Validate overall file structure
 */
export function validateStructure(
  files: FileToValidate[],
  isMultiPage: boolean
): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Check all HTML files have DOCTYPE
  errors.push(...validateDocTypes(files));

  // 2. Validate links between files
  if (isMultiPage) {
    errors.push(...validateLinks(files, isMultiPage));
  }

  // 3. Check for hash routing in multi-page apps
  if (isMultiPage) {
    errors.push(...validateNoHashRouting(files));
  }

  // 4. Check for missing .html extensions in multi-page apps
  if (isMultiPage) {
    errors.push(...validateHTMLExtensions(files));
  }

  // 5. Validate that script/style tags are closed
  errors.push(...validateClosedTags(files));

  return errors;
}

/**
 * Validate all HTML files have DOCTYPE
 */
function validateDocTypes(files: FileToValidate[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const file of files) {
    if (file.path.endsWith('.html')) {
      const trimmed = file.content.trim();
      if (!trimmed.toLowerCase().startsWith('<!doctype html>')) {
        errors.push({
          file: file.path,
          line: 1,
          column: 1,
          severity: 'error',
          message: 'Missing or incorrect DOCTYPE declaration',
          rule: 'doctype-first',
          autoFixable: true,
          suggestion: 'Add <!DOCTYPE html> at the beginning of the file',
        });
      }
    }
  }

  return errors;
}

/**
 * Validate links between files
 */
function validateLinks(files: FileToValidate[], isMultiPage: boolean): ValidationError[] {
  const errors: ValidationError[] = [];
  const fileNames = files.map(f => f.path);

  for (const file of files) {
    if (!file.path.endsWith('.html')) continue;

    // Extract all href attributes
    const hrefRegex = /href=["']([^"']+)["']/gi;
    const matches = [...file.content.matchAll(hrefRegex)];

    for (const match of matches) {
      const href = match[1];

      // Skip external links
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
        continue;
      }

      // Skip anchor-only links (like href="#" or href="#top")
      if (href === '#' || (href.startsWith('#') && href.length < 10)) {
        continue;
      }

      // Check hash routing in multi-page apps (should not exist)
      if (isMultiPage && href.startsWith('#') && href.length > 1) {
        const line = getLineNumber(file.content, match.index || 0);
        errors.push({
          file: file.path,
          line,
          column: 1,
          severity: 'error',
          message: `Hash routing "${href}" should not be used in multi-page apps`,
          rule: 'no-hash-routing-multipage',
          autoFixable: false,
          suggestion: `Create a separate .html file instead of using hash routing`,
        });
      }

      // Check if target file exists (for .html links)
      if (href.endsWith('.html')) {
        if (!fileNames.includes(href)) {
          const line = getLineNumber(file.content, match.index || 0);
          errors.push({
            file: file.path,
            line,
            column: 1,
            severity: 'error',
            message: `Broken link: "${href}" not found in generated files`,
            rule: 'broken-link',
            autoFixable: false,
            suggestion: `Create ${href} or fix the link to an existing file: ${fileNames.filter(f => f.endsWith('.html')).join(', ')}`,
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Check for hash routing patterns in multi-page apps
 * IMPORTANT: Only validate when explicitly told this is a MULTI-PAGE app
 * Single-page apps with sections are ALLOWED to have multiple divs with IDs
 */
function validateNoHashRouting(files: FileToValidate[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const file of files) {
    if (!file.path.endsWith('.html')) continue;

    const content = file.content.toLowerCase();

    // Check for hash routing indicators ONLY
    // NOTE: We only check for JavaScript-based routing (window.location.hash, hashchange)
    // We DO NOT check for multiple divs with IDs because:
    // - Single-page landing pages LEGITIMATELY have sections with IDs (hero, features, pricing)
    // - Only flag if actual routing code is detected
    const indicators = [
      { pattern: /window\.location\.hash/gim, message: 'Using window.location.hash for routing' },
      { pattern: /hashchange/gim, message: 'Using hashchange event for routing' },
      { pattern: /showpage|hidepage|togglepage/gim, message: 'Using show/hide page functions (single-page pattern)' },
    ];

    for (const { pattern, message } of indicators) {
      const matches = file.content.matchAll(pattern);
      for (const match of matches) {
        const line = getLineNumber(file.content, match.index || 0);
        errors.push({
          file: file.path,
          line,
          column: 1,
          severity: 'error',
          message: `${message} - this is a single-page pattern, not multi-page`,
          rule: 'no-hash-routing-multipage',
          autoFixable: false,
          suggestion: 'Use separate HTML files with <a href="page.html"> instead',
        });
      }
    }

    // REMOVED: No longer check for multiple divs with IDs
    // Reason: Single-page landing pages legitimately have multiple sections with IDs
    // (e.g., <div id="hero">, <div id="features">, <div id="pricing">)
  }

  return errors;
}

/**
 * Check for missing .html extensions in links
 */
function validateHTMLExtensions(files: FileToValidate[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const file of files) {
    if (!file.path.endsWith('.html')) continue;

    // Look for links without extensions (but not starting with # or http)
    const suspiciousLinkPattern = /href=["']([a-z-]+)["']/gi;
    const matches = file.content.matchAll(suspiciousLinkPattern);

    for (const match of matches) {
      const href = match[1];

      // Skip if it's just a hash, or if it already has an extension
      if (href.startsWith('#') || href.includes('.') || href.startsWith('http')) {
        continue;
      }

      // Check if this looks like a page name (common page names)
      const pageNames = ['home', 'about', 'contact', 'pricing', 'features', 'services', 'blog', 'portfolio', 'team', 'faq'];
      if (pageNames.includes(href.toLowerCase())) {
        const line = getLineNumber(file.content, match.index || 0);
        errors.push({
          file: file.path,
          line,
          column: 1,
          severity: 'error',
          message: `Missing .html extension in link: "${href}"`,
          rule: 'html-extension-required',
          autoFixable: true,
          suggestion: `Change href="${href}" to href="${href}.html"`,
        });
      }
    }
  }

  return errors;
}

/**
 * Validate that script and style tags are properly closed
 */
function validateClosedTags(files: FileToValidate[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const file of files) {
    if (!file.path.endsWith('.html')) continue;

    // Check script tags - count ALL script tags (both inline and with src)
    const openScripts = (file.content.match(/<script[^>]*>/gi) || []).length;
    const closeScripts = (file.content.match(/<\/script>/gi) || []).length;

    if (openScripts !== closeScripts) {
      errors.push({
        file: file.path,
        line: 1,
        column: 1,
        severity: 'error',
        message: `Unbalanced <script> tags: ${openScripts} opening, ${closeScripts} closing`,
        rule: 'tag-pair',
        autoFixable: false,
        suggestion: 'Ensure all <script> tags have matching </script> closing tags',
      });
    }

    // Check style tags
    const openStyles = (file.content.match(/<style[^>]*>/gi) || []).length;
    const closeStyles = (file.content.match(/<\/style>/gi) || []).length;

    if (openStyles !== closeStyles) {
      errors.push({
        file: file.path,
        line: 1,
        column: 1,
        severity: 'error',
        message: `Unbalanced <style> tags: ${openStyles} opening, ${closeStyles} closing`,
        rule: 'tag-pair',
        autoFixable: false,
        suggestion: 'Ensure all <style> tags have matching </style> closing tags',
      });
    }
  }

  return errors;
}

/**
 * Get line number from string index
 */
function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split('\n').length;
}
