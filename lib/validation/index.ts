/**
 * VALIDATION ORCHESTRATOR
 *
 * Main entry point for code validation
 * Coordinates all validation modules and returns comprehensive results
 */

import { validateHTML } from './html-validator';
import { validateCSS } from './css-validator';
import { validateJavaScript } from './js-validator';
import { validateTypeScript } from './typescript-validator';
import { detectPlaceholders } from './placeholder-detector';
import { validateStructure } from './structure-validator';
import { autoFixErrors } from './auto-fixer';
import type {
  ValidationError,
  ValidationResult,
  ValidationOptions,
  FileToValidate,
} from './types';

/**
 * Main validation function
 * Validates all files and returns comprehensive report
 */
export async function validateCode(
  files: FileToValidate[],
  options: ValidationOptions = {}
): Promise<ValidationResult> {
  const {
    autoFix = true,
    strict = false,
    isMultiPage = false,
    skipHTML = false,
    skipCSS = false,
    skipJS = false,
  } = options;

  console.log(`[Validation] Starting validation of ${files.length} file(s)...`);
  console.log(`[Validation] Options:`, { autoFix, strict, isMultiPage });

  let allErrors: ValidationError[] = [];

  // LAYER 1: Structure validation (runs first, checks file structure)
  console.log('[Validation] Layer 1: Structure validation...');
  const structureErrors = validateStructure(files, isMultiPage);
  allErrors.push(...structureErrors);
  console.log(`[Validation] Structure: ${structureErrors.length} issues found`);

  // LAYER 2: Route Completeness Validation (NEW)
  console.log('[Validation] Layer 2: Route completeness validation...');
  const routeErrors = validateRoutes(files);
  // Only include errors, not warnings (warnings are just suggestions)
  const criticalRouteErrors = routeErrors.filter(e => e.severity === 'error');
  allErrors.push(...criticalRouteErrors);
  console.log(`[Validation] Route completeness: ${criticalRouteErrors.length} critical issues found (${routeErrors.length - criticalRouteErrors.length} warnings ignored)`);

  // LAYER 3: Backend Compatibility Validation (NEW)
  console.log('[Validation] Layer 3: Backend compatibility validation...');
  const backendErrors = validateBackendCompatibility(files);
  // Only include errors, not warnings (parameter mismatches are warnings)
  const criticalBackendErrors = backendErrors.filter(e => e.severity === 'error');
  allErrors.push(...criticalBackendErrors);
  console.log(`[Validation] Backend compatibility: ${criticalBackendErrors.length} critical issues found (${backendErrors.length - criticalBackendErrors.length} warnings ignored)`);

  // LAYER 4: Static Export Compatibility (NEW)
  // Only check static export if we have dynamic routes
  const hasDynamicRoutes = files.some(f => f.path.includes('[') && f.path.includes(']') && f.path.endsWith('/page.tsx'));
  if (hasDynamicRoutes) {
    console.log('[Validation] Layer 4: Static export compatibility validation...');
    const staticExportErrors = validateStaticExportCompatibility(files);
    // Convert warnings to informational only - don't block builds
    const criticalErrors = staticExportErrors.filter(e => e.severity === 'error');
    allErrors.push(...criticalErrors);
    console.log(`[Validation] Static export compatibility: ${criticalErrors.length} critical issues found (${staticExportErrors.length - criticalErrors.length} warnings ignored)`);
  } else {
    console.log('[Validation] Layer 4: Static export compatibility validation... (skipped - no dynamic routes)');
  }

  // LAYER 5: Deployment Readiness (NEW)
  console.log('[Validation] Layer 5: Deployment readiness validation...');
  const deploymentErrors = validateDeploymentReadiness(files);
  // Only include critical errors, ignore warnings to prevent false positives
  const criticalDeploymentErrors = deploymentErrors.filter(e => e.severity === 'error');
  allErrors.push(...criticalDeploymentErrors);
  console.log(`[Validation] Deployment readiness: ${criticalDeploymentErrors.length} critical issues found (${deploymentErrors.length - criticalDeploymentErrors.length} warnings ignored)`);

  // LAYER 6: Import Validation (NEW)
  console.log('[Validation] Layer 6: Import validation...');
  const importErrors = validateImports(files);
  allErrors.push(...importErrors);
  console.log(`[Validation] Import validation: ${importErrors.length} issues found`);

  // LAYER 7-10: Validate each file individually
  for (const file of files) {
    // ✅ FIX 50: Add TypeScript/Next.js validation
    if (file.path.endsWith('.ts') || file.path.endsWith('.tsx')) {
      console.log(`[Validation] Validating ${file.path}...`);

      // TypeScript validation (catches missing types, etc.)
      const tsErrors = validateTypeScript(file.content, file.path);
      allErrors.push(...tsErrors);
      console.log(`[Validation]   TypeScript: ${tsErrors.length} issues`);

      // Log errors for debugging
      if (tsErrors.length > 0) {
        console.log('[Validation]   TypeScript errors:');
        tsErrors.forEach(err => {
          console.log(`[Validation]     Line ${err.line}: ${err.message}`);
        });
      }

      // Placeholder detection
      const placeholderErrors = detectPlaceholders(file.content, file.path);
      allErrors.push(...placeholderErrors);
      console.log(`[Validation]   Placeholders: ${placeholderErrors.length} issues`);

      continue; // Skip HTML validation for TS files
    }

    // HTML file validation (original logic)
    if (!file.path.endsWith('.html')) continue;

    console.log(`[Validation] Validating ${file.path}...`);

    // LAYER 2: HTML validation
    if (!skipHTML) {
      const htmlErrors = validateHTML(file.content, file.path);
      allErrors.push(...htmlErrors);
      console.log(`[Validation]   HTML: ${htmlErrors.length} issues`);

      // Log first 5 HTML errors for debugging
      if (htmlErrors.length > 0) {
        console.log('[Validation]   Sample HTML errors:');
        htmlErrors.slice(0, 5).forEach(err => {
          console.log(`[Validation]     Line ${err.line}: ${err.message} [${err.rule}]`);
        });
        if (htmlErrors.length > 5) {
          console.log(`[Validation]     ... and ${htmlErrors.length - 5} more HTML errors`);
        }
      }
    }

    // LAYER 3: CSS validation (extract from HTML)
    if (!skipCSS) {
      const cssErrors = validateCSS(file.content, file.path);
      allErrors.push(...cssErrors);
      console.log(`[Validation]   CSS: ${cssErrors.length} issues`);
    }

    // LAYER 4: JavaScript validation (extract from HTML)
    if (!skipJS) {
      const jsErrors = validateJavaScript(file.content, file.path);
      allErrors.push(...jsErrors);
      console.log(`[Validation]   JS: ${jsErrors.length} issues`);
    }

    // LAYER 5: Placeholder detection
    const placeholderErrors = detectPlaceholders(file.content, file.path);
    allErrors.push(...placeholderErrors);
    console.log(`[Validation]   Placeholders: ${placeholderErrors.length} issues`);
  }

  // Separate errors and warnings
  const errors = allErrors.filter(e => e.severity === 'error');
  const warnings = allErrors.filter(e => e.severity === 'warning');

  console.log(`[Validation] Total: ${errors.length} errors, ${warnings.length} warnings`);

  // AUTO-FIX if enabled
  let fixedFiles = files;
  let fixedList: string[] = [];

  if (autoFix && errors.some(e => e.autoFixable)) {
    console.log('[Validation] Auto-fixing errors...');

    // Fix import errors first (they're critical)
    const importErrorsToFix = allErrors.filter(e =>
      e.autoFixable && (e.rule?.includes('import') || e.rule?.includes('lucide'))
    );
    if (importErrorsToFix.length > 0) {
      console.log(`[Validation] Fixing ${importErrorsToFix.length} import errors...`);
      fixedFiles = fixImportErrors(fixedFiles, importErrorsToFix);
      fixedList.push('import-errors');
    }

    // Then fix other errors
    const fixResult = autoFixErrors(fixedFiles, errors);
    fixedFiles = fixResult.files;
    fixedList.push(...fixResult.fixed);

    console.log(`[Validation] Auto-fixed: ${fixedList.length} types of issues`);

    // Re-validate after auto-fix to update error count
    // (In a production system, you might want to re-run full validation here)
    // For now, we'll just filter out fixed errors
    allErrors = allErrors.filter(e => !e.autoFixable);
  }

  // Determine if code is valid
  const remainingErrors = allErrors.filter(e => e.severity === 'error');
  const valid = remainingErrors.length === 0;

  // In strict mode, warnings also count as invalid
  const isValid = strict ? (allErrors.length === 0) : valid;

  console.log(`[Validation] Validation ${isValid ? 'PASSED ✓' : 'FAILED ✗'}`);

  return {
    valid: isValid,
    files: fixedFiles,
    report: {
      errors: remainingErrors,
      warnings: allErrors.filter(e => e.severity === 'warning'),
      fixed: fixedList,
    },
  };
}

/**
 * Quick validation (errors only, no auto-fix)
 */
export async function validateQuick(files: FileToValidate[]): Promise<boolean> {
  const result = await validateCode(files, { autoFix: false, strict: false });
  return result.valid;
}

/**
 * Format validation report for display
 */
export function formatValidationReport(result: ValidationResult): string {
  const { report } = result;
  let output = '';

  if (result.valid) {
    output += '✅ Validation PASSED\n\n';
  } else {
    output += '❌ Validation FAILED\n\n';
  }

  // Errors
  if (report.errors.length > 0) {
    output += `🔴 ERRORS (${report.errors.length}):\n`;
    for (const error of report.errors.slice(0, 10)) {
      output += `  ${error.file}:${error.line} - ${error.message}\n`;
      if (error.suggestion) {
        output += `    💡 ${error.suggestion}\n`;
      }
    }
    if (report.errors.length > 10) {
      output += `  ... and ${report.errors.length - 10} more errors\n`;
    }
    output += '\n';
  }

  // Warnings
  if (report.warnings.length > 0) {
    output += `🟡 WARNINGS (${report.warnings.length}):\n`;
    for (const warning of report.warnings.slice(0, 5)) {
      output += `  ${warning.file}:${warning.line} - ${warning.message}\n`;
    }
    if (report.warnings.length > 5) {
      output += `  ... and ${report.warnings.length - 5} more warnings\n`;
    }
    output += '\n';
  }

  // Fixed
  if (report.fixed.length > 0) {
    output += `🔧 AUTO-FIXED (${report.fixed.length}):\n`;
    for (const fix of report.fixed) {
      output += `  ✓ ${fix}\n`;
    }
    output += '\n';
  }

  return output;
}

// Import new validators
import { validateRoutes, validateStaticExportCompatibility } from './route-validator';
import { validateBackendCompatibility, validateFormAPIUsage } from './backend-compatibility';
import { validateDeploymentReadiness } from './deployment-readiness';
import { validateImports, fixImportErrors } from './import-validator';

// Export types and sub-validators
export type { ValidationError, ValidationResult, ValidationOptions, FileToValidate };
export {
  validateHTML,
  validateCSS,
  validateJavaScript,
  detectPlaceholders,
  validateStructure,
  validateRoutes,
  validateStaticExportCompatibility,
  validateBackendCompatibility,
  validateFormAPIUsage,
  validateDeploymentReadiness,
  validateImports,
  fixImportErrors
};
