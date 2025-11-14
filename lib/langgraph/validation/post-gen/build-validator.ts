/**
 * BUILD VALIDATOR
 *
 * Handles build-time validation using industry-standard tools:
 * - Biome: Ultra-fast linting and formatting (Rust-based, 15-25x faster than ESLint)
 * - TypeScript: Type checking with strict mode
 *
 * Replaces:
 * - lib/validation/import-validator.ts (418 lines)
 * - lib/validation/typescript-validator.ts (310 lines)
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BuildValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  duration: number;
}

export interface BuildValidatorOptions {
  checkTypes?: boolean;
  autoFix?: boolean;
  skipFiles?: string[];
}

/**
 * Run Biome linter and formatter
 */
async function runBiome(options: BuildValidatorOptions): Promise<{
  success: boolean;
  output: string;
  errors: string[];
}> {
  const { autoFix = false } = options;

  try {
    const command = autoFix ? 'npx biome check --write .' : 'npx biome check .';
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    return {
      success: true,
      output: stdout + stderr,
      errors: []
    };
  } catch (error: any) {
    // Biome returns non-zero exit code when there are issues
    const output = error.stdout || error.stderr || error.message;
    const errors = parseBiomeErrors(output);

    return {
      success: false,
      output,
      errors
    };
  }
}

/**
 * Run TypeScript type checking
 */
async function runTypeCheck(options: BuildValidatorOptions): Promise<{
  success: boolean;
  output: string;
  errors: string[];
}> {
  try {
    const { stdout, stderr } = await execAsync('npx tsc --noEmit', {
      maxBuffer: 10 * 1024 * 1024
    });

    return {
      success: true,
      output: stdout + stderr,
      errors: []
    };
  } catch (error: any) {
    const output = error.stdout || error.stderr || error.message;
    const errors = parseTypeScriptErrors(output);

    return {
      success: false,
      output,
      errors
    };
  }
}

/**
 * Parse Biome errors from output
 */
function parseBiomeErrors(output: string): string[] {
  const errors: string[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    // Biome error format: <path>:<line>:<column> <severity> <message>
    if (line.includes('error') || line.includes('✖')) {
      errors.push(line.trim());
    }
  }

  return errors;
}

/**
 * Parse TypeScript errors from output
 */
function parseTypeScriptErrors(output: string): string[] {
  const errors: string[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    // TypeScript error format: <path>(<line>,<column>): error TS<code>: <message>
    if (line.includes('error TS')) {
      errors.push(line.trim());
    }
  }

  return errors;
}

/**
 * Main build validation function
 */
export async function validateBuild(
  options: BuildValidatorOptions = {}
): Promise<BuildValidationResult> {
  const startTime = Date.now();
  const { checkTypes = true } = options;

  console.log('[BuildValidator] Starting build validation...');

  const errors: string[] = [];
  const warnings: string[] = [];

  // Run Biome linting and formatting
  console.log('[BuildValidator] Running Biome checks...');
  const biomeResult = await runBiome(options);

  if (!biomeResult.success) {
    errors.push(...biomeResult.errors);
    console.log(`[BuildValidator] ❌ Biome found ${biomeResult.errors.length} issues`);
  } else {
    console.log('[BuildValidator] ✅ Biome checks passed');
  }

  // Run TypeScript type checking
  if (checkTypes) {
    console.log('[BuildValidator] Running TypeScript type check...');
    const typeCheckResult = await runTypeCheck(options);

    if (!typeCheckResult.success) {
      errors.push(...typeCheckResult.errors);
      console.log(`[BuildValidator] ❌ TypeScript found ${typeCheckResult.errors.length} errors`);
    } else {
      console.log('[BuildValidator] ✅ TypeScript type check passed');
    }
  }

  const duration = Date.now() - startTime;
  const valid = errors.length === 0;

  console.log(`[BuildValidator] Validation ${valid ? 'PASSED' : 'FAILED'} in ${duration}ms`);
  console.log(`[BuildValidator] Errors: ${errors.length}, Warnings: ${warnings.length}`);

  return {
    valid,
    errors,
    warnings,
    duration
  };
}

/**
 * Quick lint check (formatting + linting only, no type checking)
 */
export async function quickLint(autoFix = false): Promise<BuildValidationResult> {
  return validateBuild({ checkTypes: false, autoFix });
}

/**
 * Full validation (linting + type checking)
 */
export async function fullValidation(autoFix = false): Promise<BuildValidationResult> {
  return validateBuild({ checkTypes: true, autoFix });
}
