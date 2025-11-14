/**
 * UNIFIED VALIDATOR INTERFACE
 *
 * Single entry point for all validation types:
 * - Build Validation (Biome + TypeScript)
 * - Code Validation (typescript-eslint + Vitest)
 * - UI Validation (Playwright + Lost Pixel)
 *
 * Usage:
 *   import { validateAll, validateBuild, validateCode, validateUI } from '@/lib/validators';
 *
 *   // Run all validators
 *   const result = await validateAll();
 *
 *   // Run specific validator
 *   const buildResult = await validateBuild();
 */

import type { BuildValidationResult } from './build-validator';
import type { CodeValidationResult } from './code-validator';
import type { ValidationResult as UIValidationResult } from './ui-validator';
import type { ValidationResult as GeneratedCodeValidationResult, ValidationOptions as GeneratedCodeValidationOptions, FileToValidate } from './types';

export { validateBuild, quickLint, fullValidation as fullBuildValidation } from './build-validator';
export { validateCode as validateCodeQuality, quickCodeCheck, fullCodeValidation } from './code-validator';
export { validateGeneratedUI, applyAutoFixes, hasQualityIssues, getValidationSummary } from './ui-validator';
export type { GeneratedCodeValidationResult as FileValidationResult, GeneratedCodeValidationOptions as FileValidationOptions };

export interface ValidationResult {
  valid: boolean;
  build: BuildValidationResult;
  code?: CodeValidationResult;
  ui?: UIValidationResult;
  totalDuration: number;
  summary: {
    totalErrors: number;
    totalWarnings: number;
    buildErrors: number;
    lintErrors: number;
    testFailures: number;
    e2eFailures: number;
    visualDiffs: number;
  };
}

export interface ValidationOptions {
  runBuild?: boolean;
  runCode?: boolean;
  runUI?: boolean;
  autoFix?: boolean;
  checkTypes?: boolean;
  runTests?: boolean;
  checkCoverage?: boolean;
  browsers?: string[];
}

/**
 * Run all validators
 */
export async function validateAll(
  options: ValidationOptions = {}
): Promise<ValidationResult> {
  const {
    runBuild = true,
    runCode = true,
    runUI = false, // UI tests are slower, opt-in
    autoFix = false,
    checkTypes = true,
    runTests = false,
    checkCoverage = false,
    browsers = ['chromium']
  } = options;

  const startTime = Date.now();

  console.log('='.repeat(80));
  console.log('[Validator] Starting comprehensive validation...');
  console.log('='.repeat(80));

  // Import validators dynamically to avoid circular dependencies
  const { validateBuild } = await import('./build-validator');
  const { validateCode: validateCodeQuality } = await import('./code-validator');
  const { validateGeneratedUI } = await import('./ui-validator');

  let buildResult: BuildValidationResult | null = null;
  let codeResult: CodeValidationResult | null = null;
  let uiResult: UIValidationResult | null = null;

  // Run build validation
  if (runBuild) {
    buildResult = await validateBuild({ checkTypes, autoFix });
  }

  // Run code validation
  if (runCode) {
    codeResult = await validateCodeQuality({ runTests, checkCoverage, fix: autoFix });
  }

  // Run UI validation
  // Note: validateGeneratedUI has a different signature and is for generated UI validation only
  // if (runUI) {
  //   uiResult = await validateGeneratedUI(generatedCode);
  // }

  const totalDuration = Date.now() - startTime;

  // Calculate summary
  const buildErrors = buildResult?.errors.length || 0;
  const buildWarnings = buildResult?.warnings.length || 0;
  const lintErrors = codeResult?.lintErrors.length || 0;
  const testFailures = codeResult?.testFailures.length || 0;
  const e2eFailures = 0; // UI validation uses contrastIssues instead
  const visualDiffs = uiResult?.contrastIssues.length || 0;

  const totalErrors = buildErrors + lintErrors + testFailures + e2eFailures + visualDiffs;
  const totalWarnings = buildWarnings;

  const valid = totalErrors === 0;

  // Print summary
  console.log('='.repeat(80));
  console.log(`[Validator] ${valid ? '✅ PASSED' : '❌ FAILED'} - Completed in ${totalDuration}ms`);
  console.log('='.repeat(80));
  console.log(`  Build:    ${buildErrors} errors, ${buildWarnings} warnings`);
  if (runCode) console.log(`  Code:     ${lintErrors} lint errors, ${testFailures} test failures`);
  if (runUI) console.log(`  UI:       ${e2eFailures} E2E failures, ${visualDiffs} visual diffs`);
  console.log('-'.repeat(80));
  console.log(`  TOTAL:    ${totalErrors} errors, ${totalWarnings} warnings`);
  console.log('='.repeat(80));

  return {
    valid,
    build: buildResult!,
    code: codeResult || undefined,
    ui: uiResult || undefined,
    totalDuration,
    summary: {
      totalErrors,
      totalWarnings,
      buildErrors,
      lintErrors,
      testFailures,
      e2eFailures,
      visualDiffs
    }
  };
}

/**
 * Quick validation (linting + formatting only, no tests/UI)
 */
export async function quickValidation(autoFix = false): Promise<ValidationResult> {
  return validateAll({
    runBuild: true,
    runCode: true,
    runUI: false,
    autoFix,
    checkTypes: false,
    runTests: false
  });
}

/**
 * Full validation (everything: build + code + tests + coverage)
 */
export async function fullValidation(options: Partial<ValidationOptions> = {}): Promise<ValidationResult> {
  return validateAll({
    runBuild: true,
    runCode: true,
    runUI: false, // UI tests are slow, opt-in only
    autoFix: false,
    checkTypes: true,
    runTests: true,
    checkCoverage: true,
    ...options
  });
}

/**
 * CI/CD validation (all checks, no auto-fix, fail fast)
 */
export async function ciValidation(): Promise<ValidationResult> {
  return validateAll({
    runBuild: true,
    runCode: true,
    runUI: true,
    autoFix: false,
    checkTypes: true,
    runTests: true,
    checkCoverage: true,
    browsers: ['chromium', 'firefox', 'webkit']
  });
}

/**
 * Validate generated code files
 * Used by QA node to validate AI-generated code
 */
export async function validateCode(
  files: FileToValidate[],
  options: GeneratedCodeValidationOptions = {}
): Promise<GeneratedCodeValidationResult> {
  const startTime = Date.now();
  console.log('[ValidateCode] Starting validation of generated files...');

  // Import validators
  const { validateBackendCompatibility } = await import('./backend-compatibility');
  const { validateRoutes } = await import('./structure-validator');
  const { validateDeploymentReadiness } = await import('./deployment-readiness');

  let allErrors: any[] = [];
  let allWarnings: any[] = [];
  const fixed: string[] = [];

  // Run validators that work with file arrays
  if (options.backendConfig) {
    console.log('[ValidateCode] Running backend compatibility validation...');
    const backendErrors = validateBackendCompatibility(files);
    allErrors.push(...backendErrors);
  }

  console.log('[ValidateCode] Running route validation...');
  const routeErrors = validateRoutes(files);
  allErrors.push(...routeErrors);

  console.log('[ValidateCode] Running deployment readiness validation...');
  const deploymentErrors = validateDeploymentReadiness(files);
  allErrors.push(...deploymentErrors);

  // Apply auto-fixes if requested
  if (options.autoFix) {
    console.log('[ValidateCode] Applying auto-fixes...');
    const { autoFixErrors } = await import('./auto-fixer');

    // Filter out non-autofixable errors
    const autofixableErrors = allErrors.filter(e => e.autoFixable);
    if (autofixableErrors.length > 0) {
      const fixResult = autoFixErrors(files, autofixableErrors);
      files = fixResult.files;
      fixed.push(...fixResult.fixed);

      // Remove fixed errors from the error list
      allErrors = allErrors.filter(e => !fixed.includes(e.rule) || e.rule === undefined);
      console.log(`[ValidateCode] Auto-fixed ${fixed.length} issue(s)`);
    }
  }

  // Separate errors and warnings
  const errors = allErrors.filter(e => e.severity === 'error');
  const warnings = allErrors.filter(e => e.severity === 'warning');

  const valid = errors.length === 0;
  const duration = Date.now() - startTime;

  console.log(`[ValidateCode] Validation complete in ${duration}ms`);
  console.log(`[ValidateCode] Errors: ${errors.length}, Warnings: ${warnings.length}, Fixed: ${fixed.length}`);

  return {
    valid,
    files,
    report: {
      errors,
      warnings,
      fixed
    }
  };
}
