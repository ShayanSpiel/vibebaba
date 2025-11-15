/**
 * PLACEHOLDER DETECTION MODULE
 *
 * Detects AI-generated placeholders and incomplete code
 * Catches comments like "// rest of code..." or "<!-- existing content -->"
 */

import type { ValidationError } from './types';

// Placeholder patterns to detect
const PLACEHOLDER_PATTERNS = [
  // AI placeholder comments
  {
    pattern: /\/\/\s*\.{3,}/g,
    description: '// ...',
    example: '// ...',
  },
  {
    pattern: /\/\/\s*rest\s+of/gi,
    description: '// rest of',
    example: '// rest of code...',
  },
  {
    pattern: /\/\/\s*existing\s+(code|content|logic|implementation)\b/gi,
    description: '// existing code',
    example: '// existing code here',
  },
  {
    pattern: /\/\/\s*keep\s+/gi,
    description: '// keep',
    example: '// keep existing',
  },
  {
    pattern: /\/\/\s*same\s+as\s+before/gi,
    description: '// same as before',
    example: '// same as before',
  },
  {
    pattern: /<!--\s*existing\s+(code|content|markup|html)\b/gi,
    description: '<!-- existing',
    example: '<!-- existing content -->',
  },
  {
    pattern: /<!--\s*keep/gi,
    description: '<!-- keep',
    example: '<!-- keep existing code -->',
  },
  {
    pattern: /<!--\s*\.{3,}/g,
    description: '<!-- ...',
    example: '<!-- ... -->',
  },
  {
    pattern: /<!--\s*rest\s+of/gi,
    description: '<!-- rest of',
    example: '<!-- rest of content -->',
  },
  {
    pattern: /<!--\s*same\s+as\s+before/gi,
    description: '<!-- same as before',
    example: '<!-- same as before -->',
  },
  {
    pattern: /\/\*\s*\.{3,}\s*\*\//g,
    description: '/* ... */',
    example: '/* ... */',
  },
  {
    pattern: /\/\*\s*rest\s+of.*?\*\//gi,
    description: '/* rest of */',
    example: '/* rest of code */',
  },
  {
    pattern: /\/\*\s*existing\s+(code|content|logic|implementation).*?\*\//gi,
    description: '/* existing */',
    example: '/* existing code */',
  },
  {
    pattern: /\/\/\s*\[\.{3,}\]|<!--\s*\[\.{3,}\]|\/\*\s*\[\.{3,}\]\s*\*\//g,
    description: '// [...] (comment placeholder)',
    example: '// [...] or <!-- [...] --> or /* [...] */',
  },
  {
    pattern: /{\s*\.{3,}\s*}/g,
    description: '{...}',
    example: '{...}',
  },
  {
    pattern: /\/\/\s*previous\s+code/gi,
    description: '// previous code',
    example: '// previous code here',
  },
  {
    pattern: /\/\/\s*unchanged/gi,
    description: '// unchanged',
    example: '// unchanged code',
  },
  {
    pattern: /<!--\s*previous\s+content/gi,
    description: '<!-- previous content',
    example: '<!-- previous content -->',
  },
  {
    pattern: /<!--\s*unchanged/gi,
    description: '<!-- unchanged',
    example: '<!-- unchanged -->',
  },
  {
    pattern: /<-\s*leave\s+original/gi,
    description: '<- leave original',
    example: '<- leave original code here ->',
  },
  {
    pattern: /<-\s*keep/gi,
    description: '<- keep',
    example: '<- keep existing ->',
  },
];

// Nonsense/test content patterns (from actual failures)
const NONSENSE_CONTENT_PATTERNS = [
  {
    pattern: /\btext\s+only\b/gi,
    description: 'nonsense text',
    example: 'Text only',
  },
  {
    pattern: /\bfuture\s+tipic\b/gi,
    description: 'placeholder future content',
    example: 'FUTURE TIPIC',
  },
  {
    pattern: /\bprofessional\s+events\b/gi,
    description: 'generic placeholder text',
    example: 'Professional Events',
  },
  {
    pattern: /\btodo\s*:/gi,
    description: 'TODO marker',
    example: 'TODO: implement this',
  },
  {
    pattern: /\bplaceholder\s+(text|content|data|value)\b/gi,
    description: 'explicit placeholder phrase',
    example: 'Placeholder text',
  },
  {
    pattern: /\blorem\s+ipsum\b/gi,
    description: 'lorem ipsum filler',
    example: 'Lorem ipsum dolor sit amet',
  },
  {
    pattern: /\btest\s+content\b/gi,
    description: 'test content marker',
    example: 'Test content here',
  },
  {
    pattern: /\bexample\s+text\b/gi,
    description: 'example placeholder',
    example: 'Example text',
  },
  {
    pattern: /\bsample\s+data\b/gi,
    description: 'sample data placeholder',
    example: 'Sample data',
  },
  {
    pattern: /\bdummy\s+content\b/gi,
    description: 'dummy content',
    example: 'Dummy content',
  },
  {
    pattern: /\bfixme\b/gi,
    description: 'FIXME marker',
    example: 'FIXME: broken code',
  },
  {
    pattern: /\bhack\s*:/gi,
    description: 'HACK marker',
    example: 'HACK: temporary fix',
  },
];

/**
 * Detect placeholders in code
 */
export function detectPlaceholders(content: string, filePath: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for placeholder comments
  for (const { pattern, description, example } of PLACEHOLDER_PATTERNS) {
    const matches = content.matchAll(pattern);

    for (const match of matches) {
      const line = getLineNumber(content, match.index || 0);
      const matchedText = match[0].trim();

      errors.push({
        file: filePath,
        line,
        column: 1,
        severity: 'error',
        message: `Placeholder comment detected: "${matchedText}"`,
        rule: 'no-placeholders',
        autoFixable: false,
        suggestion: `Replace placeholder with actual code. Example placeholder: "${example}"`,
        context: getContext(content, match.index || 0),
      });
    }
  }

  // Check for nonsense/test content in HTML body (but exclude HTML attributes)
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    const bodyContent = bodyMatch[1];

    for (const { pattern, description, example } of NONSENSE_CONTENT_PATTERNS) {
      const matches = bodyContent.matchAll(pattern);

      for (const match of matches) {
        const bodyIndex = bodyMatch.index! + bodyMatch[0].indexOf(bodyMatch[1]);
        const absoluteIndex = bodyIndex + (match.index || 0);

        // Get surrounding context to check if it's inside an HTML attribute
        const surroundingText = content.substring(
          Math.max(0, absoluteIndex - 50),
          absoluteIndex + 50
        );

        // Skip if this appears to be inside an HTML attribute (e.g., placeholder="...")
        if (surroundingText.match(/\w+\s*=\s*["'][^"']*$/)) {
          continue; // This is likely an attribute value, skip it
        }

        const line = getLineNumber(content, absoluteIndex);
        const matchedText = match[0].trim();

        errors.push({
          file: filePath,
          line,
          column: 1,
          severity: 'error',
          message: `Nonsense/placeholder content detected in HTML body: "${matchedText}"`,
          rule: 'no-nonsense-content',
          autoFixable: false,
          suggestion: `Replace with actual functional content. This appears to be test/placeholder text: "${example}"`,
          context: getContext(content, absoluteIndex),
        });
      }
    }
  }

  // Additional check: Look for suspiciously short functions
  const functionPattern = /function\s+(\w+)\s*\([^)]*\)\s*{([^}]*)}/g;
  const functionMatches = content.matchAll(functionPattern);

  for (const match of functionMatches) {
    const functionName = match[1];
    const functionBody = match[2].trim();

    // If function body is empty or only contains comments
    if (
      !functionBody ||
      functionBody.split('\n').every((line) => {
        const trimmed = line.trim();
        return trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*');
      })
    ) {
      const line = getLineNumber(content, match.index || 0);

      errors.push({
        file: filePath,
        line,
        column: 1,
        severity: 'warning',
        message: `Function "${functionName}" appears to be empty or contains only comments`,
        rule: 'empty-function',
        autoFixable: false,
        suggestion: 'Implement the function or remove it if not needed',
      });
    }
  }

  return errors;
}

/**
 * Get surrounding context for an error
 */
function getContext(content: string, index: number, contextLines: number = 2): string {
  const lines = content.split('\n');
  const lineNumber = getLineNumber(content, index) - 1; // 0-indexed

  const start = Math.max(0, lineNumber - contextLines);
  const end = Math.min(lines.length, lineNumber + contextLines + 1);

  return lines
    .slice(start, end)
    .map((line, i) => {
      const currentLine = start + i + 1;
      const marker = currentLine === lineNumber + 1 ? '→' : ' ';
      return `${marker} ${currentLine}: ${line}`;
    })
    .join('\n');
}

/**
 * Get line number from string index
 */
function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split('\n').length;
}
