/**
 * SHARED VALIDATION UTILITIES
 *
 * Common utility functions used across multiple validators
 * to eliminate code duplication.
 */

/**
 * Get line number from string index
 * @param content - The content string
 * @param index - The character index
 * @returns The line number (1-indexed)
 */
export function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split('\n').length;
}

/**
 * Extract <style> blocks from HTML content
 * @param content - HTML content
 * @returns Array of CSS blocks with their starting line numbers
 */
export function extractStyleBlocks(content: string): Array<{ css: string; startLine: number }> {
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
 * Extract <script> blocks from HTML content (excluding external scripts with src)
 * @param content - HTML content
 * @returns Array of JavaScript blocks with their starting line numbers
 */
export function extractScriptBlocks(content: string): Array<{ js: string; startLine: number }> {
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
 * Generic function to extract code blocks by tag name
 * @param content - HTML content
 * @param tagName - Tag name to extract (e.g., 'style', 'script')
 * @returns Array of code blocks with their starting line numbers
 */
export function extractCodeBlocks(
  content: string,
  tagName: string
): Array<{ code: string; startLine: number }> {
  const blocks: Array<{ code: string; startLine: number }> = [];
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');

  let match;
  while ((match = regex.exec(content)) !== null) {
    const code = match[1];
    const startLine = getLineNumber(content, match.index);
    blocks.push({ code, startLine });
  }

  return blocks;
}

/**
 * Check if brackets/parens/braces are balanced
 * @param content - Code content to check
 * @param brackets - Map of opening to closing brackets
 * @returns True if balanced, false otherwise
 */
export function areBracketsBalanced(
  content: string,
  brackets: Record<string, string> = {
    '{': '}',
    '(': ')',
    '[': ']',
  }
): boolean {
  const stack: string[] = [];
  const openBrackets = Object.keys(brackets);
  const closeBrackets = Object.values(brackets);

  for (const char of content) {
    if (openBrackets.includes(char)) {
      stack.push(char);
    } else if (closeBrackets.includes(char)) {
      const lastOpen = stack.pop();
      if (!lastOpen || brackets[lastOpen] !== char) {
        return false;
      }
    }
  }

  return stack.length === 0;
}

/**
 * Count occurrences of a character in a string
 * @param content - The content to search
 * @param char - The character to count
 * @returns The count
 */
export function countChar(content: string, char: string): number {
  return (content.match(new RegExp(`\\${char}`, 'g')) || []).length;
}

/**
 * Format validation error message with context
 * @param file - File path
 * @param line - Line number
 * @param message - Error message
 * @returns Formatted error string
 */
export function formatValidationError(file: string, line: number, message: string): string {
  return `${file}:${line} - ${message}`;
}

/**
 * Simple hash function for string content
 * @param str - String to hash
 * @returns Hash number
 */
export function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Extract content between two markers
 * @param content - Content to search
 * @param startMarker - Start marker
 * @param endMarker - End marker
 * @returns Array of extracted content
 */
export function extractBetweenMarkers(
  content: string,
  startMarker: string,
  endMarker: string
): string[] {
  const results: string[] = [];
  const regex = new RegExp(
    `${escapeRegExp(startMarker)}([\\s\\S]*?)${escapeRegExp(endMarker)}`,
    'gi'
  );

  let match;
  while ((match = regex.exec(content)) !== null) {
    results.push(match[1]);
  }

  return results;
}

/**
 * Escape special regex characters
 * @param str - String to escape
 * @returns Escaped string
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
