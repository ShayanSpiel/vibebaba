/**
 * PRE-VALIDATION MODULE
 *
 * Quick validation checks before full HTML validation
 * Catches common fatal errors early to provide better feedback
 */

/**
 * Pre-validate HTML for common fatal errors
 * Returns array of error messages (empty if valid)
 */
export function preValidateHTML(code: string): string[] {
  const errors: string[] = [];

  // Check 1: Starts with closing tag (CRITICAL ERROR from logs)
  const trimmed = code.trim();
  if (trimmed.startsWith('</')) {
    const firstTag = trimmed.match(/^<\/(\w+)>/)?.[1] || 'unknown';
    errors.push(`CRITICAL: Code starts with closing tag </${firstTag}> instead of <!DOCTYPE html>`);
  }

  // Check 2: Missing DOCTYPE
  if (!code.includes('<!DOCTYPE html>') && !code.includes('<!DOCTYPE HTML>')) {
    errors.push('Missing <!DOCTYPE html> declaration');
  }

  // Check 3: Basic tag balance check (quick heuristic)
  const openTags = (code.match(/<(?!\/|!)[a-zA-Z][\w-]*/g) || []).length;
  const closeTags = (code.match(/<\/[a-zA-Z][\w-]*>/g) || []).length;
  const selfClosing = (code.match(/<[a-zA-Z][\w-]*[^>]*\/>/g) || []).length;

  // Approximate balance (not perfect, but catches major issues)
  const expectedCloses = openTags - selfClosing;
  if (Math.abs(closeTags - expectedCloses) > 5) {
    errors.push(
      `Tag imbalance detected: ${openTags} opening tags, ${closeTags} closing tags (difference > 5)`
    );
  }

  // Check 4: Truncation markers (but allow in alt/src attributes)
  const dotsPattern = /\.\.\./g;
  const matches = [...code.matchAll(dotsPattern)];
  let suspiciousDots = 0;

  for (const match of matches) {
    const index = match.index || 0;
    const context = code.substring(Math.max(0, index - 20), Math.min(code.length, index + 20));

    // Allow ... in attributes like alt="..." or src="..."
    if (!/(?:alt|src|placeholder|title|aria-label)\s*=\s*["'][^"']*\.\.\./.test(context)) {
      suspiciousDots++;
    }
  }

  if (suspiciousDots > 0) {
    errors.push(
      `CRITICAL: Code contains ${suspiciousDots} "..." truncation marker(s) outside of attributes - AI truncated the implementation`
    );
  }

  // Check 5: Missing required elements
  if (!code.includes('<title>')) {
    errors.push('Missing <title> tag in <head>');
  }

  if (!code.includes('</html>')) {
    errors.push('Missing closing </html> tag');
  }

  if (!code.includes('</body>')) {
    errors.push('Missing closing </body> tag');
  }

  // Check 6: Invalid <p> nesting (common error)
  const invalidPNesting = [
    /<p[^>]*>[\s\S]*?<div/i,
    /<p[^>]*>[\s\S]*?<section/i,
    /<p[^>]*>[\s\S]*?<header/i,
    /<p[^>]*>[\s\S]*?<h\d/i,
  ];

  for (const pattern of invalidPNesting) {
    if (pattern.test(code)) {
      errors.push('Invalid <p> tag nesting detected (block element inside <p>)');
      break;
    }
  }

  return errors;
}
