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
          // Remove ALL control characters
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
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
  // Try to find JSON object first
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return safeJsonParse<T>(objectMatch[0], fallback);
  }

  // Try to find JSON array
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return safeJsonParse<T>(arrayMatch[0], fallback);
  }

  console.warn('[JSON Parser] ⚠️  No JSON found in text');
  return fallback;
}
