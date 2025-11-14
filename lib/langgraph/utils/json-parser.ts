/**
 * JSON Parsing Utility
 *
 * Safely parse JSON from AI responses that may contain control characters
 * or other invalid JSON syntax
 */

/**
 * Safely parse JSON with automatic sanitization of control characters
 *
 * AI models sometimes generate JSON with literal newlines, tabs, or other
 * control characters inside string values, which breaks JSON.parse().
 * This function automatically sanitizes such issues.
 *
 * @param jsonString - JSON string to parse
 * @param fallback - Fallback value if parsing fails completely (default: {})
 * @returns Parsed JSON object
 */
export function safeJsonParse<T = any>(jsonString: string, fallback: T = {} as T): T {
  if (!jsonString || jsonString.trim() === '') {
    return fallback;
  }

  try {
    // First try parsing as-is (fast path)
    return JSON.parse(jsonString);
  } catch (firstError) {
    // If that fails, try sanitizing control characters
    try {
      console.log('[JSON Parser] ⚠️  Control characters detected, sanitizing...');

      const sanitized = jsonString
        // Remove all control characters except those already escaped
        .replace(/[\u0000-\u001F]/g, (char) => {
          switch (char) {
            case '\n': return '\\n';
            case '\r': return '\\r';
            case '\t': return '\\t';
            default: return ''; // Remove other control chars
          }
        });

      return JSON.parse(sanitized);
    } catch (sanitizeError) {
      // If sanitization fails, try more aggressive cleaning
      try {
        console.log('[JSON Parser] ⚠️  Aggressive sanitization...');

        const aggressivelyCleaned = jsonString
          // Fix unescaped newlines in string values (common AI error)
          .replace(/"([^"]*?)(\r?\n)([^"]*?)"/g, (match, before, newline, after) => {
            return `"${before}\\n${after}"`;
          })
          // Remove ALL control characters
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
          // Remove comments (both // and /* */ styles)
          .replace(/\/\/[^\n]*/g, '')        // Remove // comments
          .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove /* */ comments
          // Fix common JSON issues
          .replace(/,\s*}/g, '}')    // Trailing commas
          .replace(/,\s*]/g, ']')    // Trailing commas in arrays
          .replace(/'/g, '"')        // Single quotes to double quotes
          // Remove markdown formatting from within strings
          .replace(/\*\*/g, '')      // Bold markers
          .replace(/\*/g, '')        // Italic markers
          // Fix common escape issues
          .replace(/\\(?!["\\/bfnrtu])/g, '\\\\'); // Escape unescaped backslashes

        return JSON.parse(aggressivelyCleaned);
      } catch (finalError) {
        console.error('[JSON Parser] ❌ Failed to parse JSON after all sanitization attempts');
        console.error('[JSON Parser] Original error:', (firstError as Error).message);
        console.error('[JSON Parser] JSON snippet:', jsonString.substring(0, 200));
        console.error('[JSON Parser] Tip: Ensure AI returns valid JSON with properly escaped strings');
        return fallback;
      }
    }
  }
}

/**
 * Extract and parse JSON from AI response text
 *
 * Extracts the first JSON object or array from a string and parses it safely
 *
 * @param text - Text containing JSON (may have markdown, explanations, etc.)
 * @param fallback - Fallback value if no valid JSON found
 * @returns Parsed JSON object
 */
export function extractAndParseJson<T = any>(text: string, fallback: T = {} as T): T {
  // First, try to extract JSON from markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    const result = safeJsonParse<T>(codeBlockMatch[1], null as any);
    if (result !== null) return result;
  }

  // Try to find balanced JSON object (handles nested objects properly)
  const objectMatch = findBalancedJson(text, '{', '}');
  if (objectMatch) {
    // Detect if there's significant text after the JSON (markdown contamination)
    const jsonEndIndex = text.indexOf(objectMatch) + objectMatch.length;
    const afterJson = text.slice(jsonEndIndex).trim();

    if (afterJson.length > 50) {
      console.warn('[JSON Parser] ⚠️  Detected text after JSON (markdown contamination)');
      console.warn('[JSON Parser] After JSON:', afterJson.substring(0, 100) + '...');
      console.warn('[JSON Parser] This suggests AI returned markdown instead of pure JSON');
    }

    const result = safeJsonParse<T>(objectMatch, null as any);
    if (result !== null) return result;
  }

  // Try to find balanced JSON array
  const arrayMatch = findBalancedJson(text, '[', ']');
  if (arrayMatch) {
    // Check for text after array
    const jsonEndIndex = text.indexOf(arrayMatch) + arrayMatch.length;
    const afterJson = text.slice(jsonEndIndex).trim();

    if (afterJson.length > 50) {
      console.warn('[JSON Parser] ⚠️  Detected text after JSON array');
      console.warn('[JSON Parser] After JSON:', afterJson.substring(0, 100) + '...');
    }

    const result = safeJsonParse<T>(arrayMatch, null as any);
    if (result !== null) return result;
  }

  // Fallback: try simple regex (for backwards compatibility)
  const simpleObjectMatch = text.match(/\{[\s\S]*?\}/);
  if (simpleObjectMatch) {
    const result = safeJsonParse<T>(simpleObjectMatch[0], null as any);
    if (result !== null) return result;
  }

  console.warn('[JSON Parser] ⚠️  No valid JSON found in text');
  console.warn('[JSON Parser] Text preview:', text.substring(0, 200));
  return fallback;
}

/**
 * Find balanced JSON in text (handles nested brackets properly)
 */
function findBalancedJson(text: string, openChar: string, closeChar: string): string | null {
  const startIndex = text.indexOf(openChar);
  if (startIndex === -1) return null;

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === openChar) {
      depth++;
    } else if (char === closeChar) {
      depth--;
      if (depth === 0) {
        return text.substring(startIndex, i + 1);
      }
    }
  }

  return null;
}
