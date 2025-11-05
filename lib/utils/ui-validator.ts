/**
 * UI Validator - Post-Generation Quality Checks
 *
 * Validates generated UI code for:
 * - Contrast issues (grey on grey)
 * - Missing animations
 * - Alignment problems
 * - Auto-fixes common issues
 */

export interface ContrastIssue {
  line: number;
  element: string;
  background: string;
  foreground: string;
  contrast: number;
  wcagLevel: 'AAA' | 'AA' | 'fail';
  suggestion: string;
}

export interface ValidationResult {
  contrastIssues: ContrastIssue[];
  animationWarnings: string[];
  alignmentWarnings: string[];
  fixes: string[];
}

/**
 * Validate generated UI code for common issues
 */
export async function validateGeneratedUI(
  code: string,
  uxConfig?: any
): Promise<ValidationResult> {
  const result: ValidationResult = {
    contrastIssues: [],
    animationWarnings: [],
    alignmentWarnings: [],
    fixes: []
  };

  // 1. Contrast validation
  result.contrastIssues = validateContrast(code);

  // 2. Animation usage check
  result.animationWarnings = checkAnimationUsage(code);

  // 3. Alignment check
  result.alignmentWarnings = checkAlignment(code);

  // 4. Generate auto-fixes
  result.fixes = generateFixes(result);

  return result;
}

/**
 * Check for low-contrast color combinations
 */
function validateContrast(code: string): ContrastIssue[] {
  const issues: ContrastIssue[] = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    // Pattern 1: bg-secondary with text-muted-foreground (grey on grey)
    if (line.includes('bg-secondary') && line.includes('text-muted-foreground')) {
      issues.push({
        line: index + 1,
        element: line.trim().substring(0, 80) + '...',
        background: 'bg-secondary',
        foreground: 'text-muted-foreground',
        contrast: 2.5, // Estimated low contrast
        wcagLevel: 'fail',
        suggestion: 'Change text-muted-foreground to text-foreground for better contrast'
      });
    }

    // Pattern 2: bg-muted with text-muted-foreground (very low contrast)
    if (line.includes('bg-muted') && line.includes('text-muted-foreground')) {
      issues.push({
        line: index + 1,
        element: line.trim().substring(0, 80) + '...',
        background: 'bg-muted',
        foreground: 'text-muted-foreground',
        contrast: 2.0, // Estimated very low contrast
        wcagLevel: 'fail',
        suggestion: 'Change text-muted-foreground to text-foreground for better contrast'
      });
    }

    // Pattern 3: bg-card with text-muted-foreground (potential issue)
    if (line.includes('bg-card') && line.includes('text-muted-foreground')) {
      issues.push({
        line: index + 1,
        element: line.trim().substring(0, 80) + '...',
        background: 'bg-card',
        foreground: 'text-muted-foreground',
        contrast: 3.0, // Estimated borderline contrast
        wcagLevel: 'AA',
        suggestion: 'Consider using text-foreground instead of text-muted-foreground'
      });
    }
  });

  return issues;
}

/**
 * Check if animations are being used appropriately
 */
function checkAnimationUsage(code: string): string[] {
  const warnings: string[] = [];

  // Check if code has cards but no animations
  const hasCards = /className="[^"]*card[^"]*"/.test(code);
  const hasAnimations = /animate-fade-in|animate-slide-up/.test(code);

  if (hasCards && !hasAnimations) {
    warnings.push('Cards detected without animations. Consider adding animate-fade-in for better UX.');
  }

  // Check for grids that could benefit from staggered animations
  const hasGrid = /grid grid-cols/.test(code);
  const hasStaggeredAnimations = /animationDelay/.test(code);

  if (hasGrid && !hasStaggeredAnimations && !hasAnimations) {
    warnings.push('Grid layout detected. Consider adding staggered animations (animate-fade-in with animationDelay).');
  }

  // Check for success/error states without animations
  const hasSuccessState = /success &&/.test(code) || /error &&/.test(code);

  if (hasSuccessState && !hasAnimations) {
    warnings.push('Success/error states detected. Consider adding animate-fade-in for smooth appearance.');
  }

  return warnings;
}

/**
 * Check for alignment issues
 */
function checkAlignment(code: string): string[] {
  const warnings: string[] = [];

  // Check for button+input combos without flex
  const singleLineCode = code.replace(/\n/g, ' ');
  const hasInputButton = /<input[^>]*>.*?<button|<button[^>]*>.*?<input/.test(singleLineCode);

  if (hasInputButton) {
    // Look for parent div with flex
    const hasFlexParent = /className="[^"]*flex[^"]*"[^>]*>\s*(?:<[^>]*>)*\s*<(?:input|button)/.test(singleLineCode);

    if (!hasFlexParent) {
      warnings.push('Button+Input combo detected without flex layout. Wrap in a container with className="flex gap-2" for proper alignment.');
    }
  }

  // Check for button groups without proper spacing
  const hasMultipleButtons = (code.match(/<button/g) || []).length > 1;
  const hasButtonGroup = /className="[^"]*(?:flex|space-x|gap-)[^"]*"[^>]*>[\s\S]*?<button[\s\S]*?<button/.test(code);

  if (hasMultipleButtons && !hasButtonGroup) {
    warnings.push('Multiple buttons detected. Consider grouping them with className="flex items-center gap-3" for consistent spacing.');
  }

  return warnings;
}

/**
 * Generate auto-fix suggestions
 */
function generateFixes(result: ValidationResult): string[] {
  const fixes: string[] = [];

  // Generate fix for each contrast issue
  result.contrastIssues.forEach(issue => {
    fixes.push(`Line ${issue.line}: ${issue.suggestion}`);
  });

  return fixes;
}

/**
 * Apply automatic fixes to code
 */
export function applyAutoFixes(code: string, issues: ContrastIssue[]): string {
  let fixedCode = code;

  // Fix 1: bg-secondary + text-muted-foreground → text-foreground
  // We need to be careful to only fix within the same element
  const lines = fixedCode.split('\n');
  const fixedLines = lines.map((line, index) => {
    // Check if this line has a contrast issue
    const lineIssue = issues.find(issue => issue.line === index + 1);

    if (lineIssue) {
      // Fix grey-on-grey by replacing text-muted-foreground with text-foreground
      // Only within elements that have bg-secondary or bg-muted
      if (line.includes('bg-secondary') || line.includes('bg-muted') || line.includes('bg-card')) {
        return line.replace(/text-muted-foreground/g, 'text-foreground');
      }
    }

    return line;
  });

  fixedCode = fixedLines.join('\n');

  return fixedCode;
}

/**
 * Check if code has specific quality issues
 */
export function hasQualityIssues(result: ValidationResult): boolean {
  return (
    result.contrastIssues.filter(i => i.wcagLevel === 'fail').length > 0 ||
    result.alignmentWarnings.length > 0
  );
}

/**
 * Get summary of validation results
 */
export function getValidationSummary(result: ValidationResult): string {
  const parts: string[] = [];

  if (result.contrastIssues.length > 0) {
    parts.push(`${result.contrastIssues.length} contrast issue(s)`);
  }

  if (result.animationWarnings.length > 0) {
    parts.push(`${result.animationWarnings.length} animation suggestion(s)`);
  }

  if (result.alignmentWarnings.length > 0) {
    parts.push(`${result.alignmentWarnings.length} alignment warning(s)`);
  }

  if (parts.length === 0) {
    return 'No issues detected';
  }

  return parts.join(', ');
}
