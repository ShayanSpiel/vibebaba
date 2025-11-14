/**
 * AUTO-FIXER MODULE
 *
 * Automatically fixes common code errors when possible
 */

import type { ValidationError, FileToValidate } from './types';

/**
 * Auto-fix errors in files
 */
export function autoFixErrors(
  files: FileToValidate[],
  errors: ValidationError[]
): { files: FileToValidate[]; fixed: string[] } {
  const fixedFiles = files.map(file => ({ ...file }));
  const fixed: string[] = [];

  // Group errors by file
  const errorsByFile = new Map<string, ValidationError[]>();
  for (const error of errors) {
    if (!error.autoFixable) continue;

    if (!errorsByFile.has(error.file)) {
      errorsByFile.set(error.file, []);
    }
    errorsByFile.get(error.file)!.push(error);
  }

  // Fix each file
  for (const [filePath, fileErrors] of errorsByFile.entries()) {
    const fileIndex = fixedFiles.findIndex(f => f.path === filePath);
    if (fileIndex === -1) continue;

    let content = fixedFiles[fileIndex].content;
    let fileFixed = false;

    for (const error of fileErrors) {
      const result = applyFix(content, error);
      if (result.fixed) {
        content = result.content;
        fileFixed = true;
        if (!fixed.includes(error.rule)) {
          fixed.push(error.rule);
        }
      }
    }

    if (fileFixed) {
      fixedFiles[fileIndex].content = content;
    }
  }

  // Convert rule IDs to readable descriptions
  const fixedDescriptions = fixed.map(rule => getFixDescription(rule));

  return { files: fixedFiles, fixed: fixedDescriptions };
}

/**
 * Apply a specific fix to content
 */
function applyFix(content: string, error: ValidationError): { content: string; fixed: boolean } {
  let fixed = false;
  let newContent = content;

  switch (error.rule) {
    case 'doctype-first':
      // Add DOCTYPE at beginning
      if (!newContent.trim().toLowerCase().startsWith('<!doctype html>')) {
        newContent = '<!DOCTYPE html>\n' + newContent;
        fixed = true;
      }
      break;

    case 'html-extension-required':
      // Add .html extension to links
      // Extract the href value from error context
      const hrefMatch = error.context?.match(/href=["']([a-z-]+)["']/i);
      if (hrefMatch) {
        const href = hrefMatch[1];
        newContent = newContent.replace(
          new RegExp(`href=["']${href}["']`, 'gi'),
          `href="${href}.html"`
        );
        fixed = true;
      }
      break;

    case 'require-await':
      // Add await before window.db calls
      newContent = newContent.replace(
        /(const|let|var)\s+(\w+)\s*=\s*window\.db\.(get|find|findOne|add|update|delete)\(/g,
        '$1 $2 = await window.db.$3('
      );
      fixed = true;
      break;

    case 'property-no-unknown':
      // Fix common CSS typos
      const cssTypos = [
        { wrong: 'colour', right: 'color' },
        { wrong: 'centre', right: 'center' },
      ];

      for (const { wrong, right } of cssTypos) {
        if (newContent.includes(`${wrong}:`)) {
          newContent = newContent.replace(
            new RegExp(`\\b${wrong}\\s*:`, 'gi'),
            `${right}:`
          );
          fixed = true;
        }
      }
      break;

    case 'unit-no-unknown':
      // Add px to numeric values (conservative approach)
      // Only fix if in CSS context and the number is likely a pixel value
      newContent = newContent.replace(
        /(padding|margin|width|height|top|left|right|bottom|font-size|border-width):\s*(\d+)\s*([;}])/gi,
        '$1: $2px$3'
      );
      fixed = true;
      break;

    case 'tag-pair':
      // Try to close unclosed tags (simple cases only)
      if (error.message.includes('</body>')) {
        if (!newContent.includes('</body>')) {
          newContent = newContent.replace('</html>', '</body>\n</html>');
          fixed = true;
        }
      }
      if (error.message.includes('</html>')) {
        if (!newContent.includes('</html>')) {
          newContent += '\n</html>';
          fixed = true;
        }
      }
      break;

    case 'attr-value-double-quotes':
      // Convert single quotes to double quotes in HTML attributes
      newContent = newContent.replace(
        /(<[^>]+\s+\w+)='([^']*)'/g,
        '$1="$2"'
      );
      fixed = true;
      break;

    case 'tagname-lowercase':
      // Convert tag names to lowercase
      newContent = newContent.replace(
        /<\/?([A-Z][A-Z0-9]*)/g,
        (match, tagName) => match.replace(tagName, tagName.toLowerCase())
      );
      fixed = true;
      break;

    case 'attr-lowercase':
      // Convert attribute names to lowercase
      newContent = newContent.replace(
        /\s([A-Z][A-Z0-9-]*)=/g,
        (match, attrName) => match.replace(attrName, attrName.toLowerCase())
      );
      fixed = true;
      break;

    case 'id-unique':
      // Fix duplicate IDs by appending numbers
      const idMatch = error.message?.match(/duplicate\s+id\s+['"]([^'"]+)['"]/i);
      if (idMatch) {
        const duplicateId = idMatch[1];
        let counter = 1;
        const regex = new RegExp(`\\bid=["']${duplicateId}["']`, 'g');
        newContent = newContent.replace(regex, (match, offset) => {
          if (counter === 1) {
            counter++;
            return match; // Keep first occurrence
          }
          return `id="${duplicateId}-${counter++}"`;
        });
        fixed = true;
      }
      break;

    case 'src-not-empty':
      // Remove elements with empty src attributes
      newContent = newContent.replace(/<img[^>]*src=["']["'][^>]*>/gi, '<!-- Empty src removed -->');
      newContent = newContent.replace(/<script[^>]*src=["']["'][^>]*><\/script>/gi, '<!-- Empty src removed -->');
      fixed = true;
      break;

    case 'title-require':
      // Add missing <title> tag in <head>
      if (!newContent.match(/<title>/i)) {
        newContent = newContent.replace(
          /(<head[^>]*>)/i,
          '$1\n  <title>Generated App</title>'
        );
        fixed = true;
      }
      break;

    case 'spec-char-escape':
      // Auto-fix special character escaping in text content
      // Only escape < > & when they appear in text content (between tags)
      // This is safe because we only match text between > and <
      newContent = newContent.replace(
        />([^<]*)</g,
        (match, textContent) => {
          let escapedText = textContent;
          // Only escape if there are actual special chars that need escaping
          if (textContent.includes('<') || textContent.includes('>') ||
              /&(?![a-zA-Z]+;|#\d+;|#x[0-9a-fA-F]+;)/.test(textContent)) {
            // Escape < and >
            escapedText = escapedText
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
            // Escape standalone & (not part of an entity)
            escapedText = escapedText.replace(/&(?![a-zA-Z]+;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;');
            fixed = true;
          }
          return `>${escapedText}<`;
        }
      );
      break;

    default:
      // No auto-fix available
      break;
  }

  return { content: newContent, fixed };
}

/**
 * Get human-readable description of fix
 */
function getFixDescription(rule: string): string {
  const descriptions: Record<string, string> = {
    'doctype-first': 'Added missing DOCTYPE',
    'html-extension-required': 'Added .html extension to links',
    'require-await': 'Added missing await for database calls',
    'property-no-unknown': 'Fixed CSS property typos',
    'unit-no-unknown': 'Added missing units (px)',
    'tag-pair': 'Closed unclosed tags',
    'attr-value-double-quotes': 'Converted quotes to double quotes',
    'tagname-lowercase': 'Converted tag names to lowercase',
    'attr-lowercase': 'Converted attribute names to lowercase',
    'spec-char-escape': 'Escaped special characters (<, >, &) in text content',
  };

  return descriptions[rule] || rule;
}
