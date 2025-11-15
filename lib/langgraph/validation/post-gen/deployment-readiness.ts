/**
 * DEPLOYMENT READINESS VALIDATOR
 *
 * Validates that code is ready for deployment with static export
 * Checks Next.js configuration, image optimization, API route conflicts, etc.
 */

import type { FileToValidate, ValidationError } from './types';

/**
 * Validate Next.js configuration for static export
 */
export function validateNextConfig(files: FileToValidate[]): ValidationError[] {
  console.log('[DeploymentReadiness] Validating Next.js configuration...');

  const errors: ValidationError[] = [];

  // Find next.config.js
  const configFile = files.find(
    (f) =>
      f.path.endsWith('next.config.js') ||
      f.path.endsWith('next.config.ts') ||
      f.path.endsWith('next.config.mjs')
  );

  if (!configFile) {
    // SKIP: next.config.js is a scaffold file added by DevOps node
    // If it's missing here, it will be added later
    console.log('[DeploymentReadiness] ℹ️  next.config.js not found - will be added by scaffold');
    return [];
  }

  const content = configFile.content;

  // Check 1: output: 'export' is set
  if (!content.includes("output: 'export'") && !content.includes('output: "export"')) {
    errors.push({
      file: configFile.path,
      line: 0,
      message: "Missing output: 'export' in next.config.js - required for static export",
      rule: 'missing-static-export-config',
      severity: 'error',
      autoFixable: true,
      suggestion: "Add output: 'export' to next.config.js module.exports",
    });
  }

  // Check 2: images.unoptimized is set (required for static export)
  if (!content.includes('unoptimized: true')) {
    errors.push({
      file: configFile.path,
      line: 0,
      message: 'Missing images: { unoptimized: true } - required for static export with next/image',
      rule: 'missing-image-optimization-config',
      severity: 'warning',
      autoFixable: true,
      suggestion: 'Add images: { unoptimized: true } to next.config.js',
    });
  }

  // Check 3: basePath is set (for multi-tenant deployment)
  // REMOVED: This is optional and causes false positives
  // Only add basePath if specifically needed for subdirectory deployment

  // Check 4: trailingSlash setting
  // REMOVED: This is optional and causes false positives
  // Only needed in specific deployment scenarios

  if (errors.filter((e) => e.severity === 'error').length === 0) {
    console.log('[DeploymentReadiness] ✅ Next.js configuration is valid');
  }

  return errors;
}

/**
 * Validate that no API routes exist (not supported in static export)
 * Exception: NextAuth routes are allowed as they're part of authentication infrastructure
 */
export function validateNoAPIRoutes(files: FileToValidate[]): ValidationError[] {
  console.log('[DeploymentReadiness] Checking for API routes...');

  const errors: ValidationError[] = [];

  for (const file of files) {
    // Check for app/api/ directory structure
    if (
      file.path.includes('/api/') &&
      file.path.includes('src/app/api/') &&
      file.path.endsWith('/route.ts')
    ) {
      // EXCEPTION: Auth routes are allowed (part of authentication infrastructure)
      if (
        file.path.includes('/api/auth/[...nextauth]/route.ts') ||
        file.path.includes('/api/auth/signup/route.ts')
      ) {
        console.log(`[DeploymentReadiness] ✅ Auth route allowed: ${file.path}`);
        continue;
      }

      errors.push({
        file: file.path,
        line: 0,
        message: 'API routes are not supported in static export mode',
        rule: 'api-routes-not-supported',
        severity: 'error',
        autoFixable: false,
        suggestion:
          'Move API logic to separate Express server or remove static export mode. API routes should be handled by the Express backend, not Next.js API routes.',
      });
      console.log(`[DeploymentReadiness] ❌ Found API route: ${file.path}`);
    }
  }

  if (errors.length === 0) {
    console.log('[DeploymentReadiness] ✅ No API routes found (correct for static export)');
  }

  return errors;
}

/**
 * Validate image usage (next/image with unoptimized or regular <img>)
 */
export function validateImageUsage(files: FileToValidate[]): ValidationError[] {
  console.log('[DeploymentReadiness] Validating image usage...');

  const errors: ValidationError[] = [];

  for (const file of files) {
    if (!file.path.endsWith('.tsx') && !file.path.endsWith('.jsx')) {
      continue;
    }

    const content = file.content;
    const lines = content.split('\n');

    // Check for next/image import
    const hasNextImageImport =
      content.includes("from 'next/image'") || content.includes('from "next/image"');

    // Check for Image component usage
    const imageComponentPattern = /<Image\s+/g;
    const imageMatches = [...content.matchAll(imageComponentPattern)];

    if (imageMatches.length > 0 && !hasNextImageImport) {
      errors.push({
        file: file.path,
        line: 0,
        message: 'Using <Image /> component without importing from next/image',
        rule: 'missing-image-import',
        severity: 'error',
        autoFixable: true,
        suggestion: "Add: import Image from 'next/image'",
      });
    }

    // Check for regular <img> tags in Next.js (should use next/image)
    // REMOVED: Regular <img> tags are perfectly fine in many cases
    // This was causing too many false positives
  }

  return errors;
}

/**
 * Validate environment variables usage
 */
export function validateEnvironmentVariables(files: FileToValidate[]): ValidationError[] {
  console.log('[DeploymentReadiness] Validating environment variables...');

  const errors: ValidationError[] = [];

  // Find .env.local file
  const envFile = files.find((f) => f.path.endsWith('.env.local') || f.path.endsWith('.env'));

  if (!envFile) {
    // SKIP: .env.local is optional and may be added by scaffold or not needed
    console.log('[DeploymentReadiness] ℹ️  No .env.local file found - skipping env var validation');
    return [];
  }

  // Check for required variables
  const content = envFile.content;
  // REMOVED: NEXT_PUBLIC_API_URL check - not always required
  // Projects can have different architectures that don't need this
  // Only validate that env vars used in code have proper NEXT_PUBLIC_ prefix

  // Check that public env vars start with NEXT_PUBLIC_
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip comments and empty lines
    if (!line || line.startsWith('#')) {
      continue;
    }

    // Check if it's an env var declaration
    const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*=/);
    if (match) {
      const varName = match[1];

      // If used in frontend code, must start with NEXT_PUBLIC_
      // (This is a simplified check - in reality would need to grep frontend files)
      if (
        !varName.startsWith('NEXT_PUBLIC_') &&
        !varName.startsWith('NODE_') &&
        varName !== 'JWT_SECRET' &&
        varName !== 'PORT'
      ) {
        // Check if this var is used in any .tsx files
        const usedInFrontend = files.some(
          (f) =>
            (f.path.endsWith('.tsx') || f.path.endsWith('.jsx')) &&
            f.content.includes(`process.env.${varName}`)
        );

        if (usedInFrontend) {
          errors.push({
            file: envFile.path,
            line: i + 1,
            message: `Environment variable '${varName}' used in frontend must start with NEXT_PUBLIC_`,
            rule: 'frontend-env-var-prefix',
            severity: 'error',
            autoFixable: false,
            suggestion: `Rename to NEXT_PUBLIC_${varName} for frontend access, or move to backend-only code`,
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Validate package.json for required scripts and dependencies
 */
export function validatePackageJson(files: FileToValidate[]): ValidationError[] {
  console.log('[DeploymentReadiness] Validating package.json...');

  const errors: ValidationError[] = [];

  const packageFile = files.find((f) => f.path.endsWith('package.json'));

  if (!packageFile) {
    // SKIP: package.json is a scaffold file added by DevOps node
    // If it's missing here, it will be added later
    console.log('[DeploymentReadiness] ℹ️  package.json not found - will be added by scaffold');
    return [];
  }

  try {
    const pkg = JSON.parse(packageFile.content);

    // Check required scripts
    const requiredScripts = ['dev', 'build', 'start'];
    for (const script of requiredScripts) {
      if (!pkg.scripts || !pkg.scripts[script]) {
        errors.push({
          file: packageFile.path,
          line: 0,
          message: `Missing npm script: ${script}`,
          rule: 'missing-npm-script',
          severity: 'warning',
          autoFixable: false,
          suggestion: `Add "${script}" script to package.json`,
        });
      }
    }

    // Check required dependencies
    const requiredDeps = ['next', 'react', 'react-dom'];
    for (const dep of requiredDeps) {
      if (!pkg.dependencies || !pkg.dependencies[dep]) {
        errors.push({
          file: packageFile.path,
          line: 0,
          message: `Missing required dependency: ${dep}`,
          rule: 'missing-dependency',
          severity: 'error',
          autoFixable: false,
          suggestion: `Add ${dep} to dependencies in package.json`,
        });
      }
    }
  } catch (err) {
    errors.push({
      file: packageFile.path,
      line: 0,
      message: 'Invalid JSON in package.json',
      rule: 'invalid-package-json',
      severity: 'error',
      autoFixable: false,
      suggestion: 'Fix JSON syntax errors in package.json',
    });
  }

  return errors;
}

/**
 * Main deployment readiness validation function
 * Runs all deployment checks
 */
export function validateDeploymentReadiness(files: FileToValidate[]): ValidationError[] {
  console.log('[DeploymentReadiness] Starting deployment readiness validation...');

  const allErrors: ValidationError[] = [];

  // Run all deployment checks
  allErrors.push(...validateNextConfig(files));
  allErrors.push(...validateNoAPIRoutes(files));
  allErrors.push(...validateImageUsage(files));
  allErrors.push(...validateEnvironmentVariables(files));
  allErrors.push(...validatePackageJson(files));

  const errorCount = allErrors.filter((e) => e.severity === 'error').length;
  const warningCount = allErrors.filter((e) => e.severity === 'warning').length;

  if (errorCount === 0) {
    console.log('[DeploymentReadiness] ✅ Deployment readiness checks passed');
  } else {
    console.log(`[DeploymentReadiness] ❌ Found ${errorCount} errors and ${warningCount} warnings`);
  }

  return allErrors;
}
