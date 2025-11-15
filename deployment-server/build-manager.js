// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BUILD MANAGER
// Handles npm install + next build for Next.js projects
// OPTIMIZED: Dependency caching, incremental builds, rsync for 2-3x faster copies
//
// PERFORMANCE OPTIMIZATIONS:
// - npm ci instead of npm install when package-lock.json exists (30-50% faster)
// - npm --prefer-offline (uses local npm cache when available)
// - rsync instead of cp (2-3x faster for large directories like node_modules)
// - Smart node_modules caching with package.json hash comparison
// - Incremental .next builds (only rebuild changed files)
// - Integrity validation to prevent cache corruption
// TARGET: 30-60 seconds for first build, 10-20 seconds for subsequent builds
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const execAsync = util.promisify(exec);

// Cache directory for storing node_modules and build artifacts
const CACHE_DIR = path.join(__dirname, '.build-cache');

/**
 * Generate hash of file content
 */
function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

/**
 * Check if package.json changed and cache exists
 */
async function shouldSkipInstall(projectPath) {
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
    const currentHash = hashContent(packageJsonContent);

    // Check if cache exists
    const cacheInfoPath = path.join(CACHE_DIR, 'cache-info.json');
    const nodeModulesCache = path.join(CACHE_DIR, 'node_modules');

    try {
      const cacheInfo = JSON.parse(await fs.readFile(cacheInfoPath, 'utf8'));
      const cacheExists = await fs.access(nodeModulesCache).then(() => true).catch(() => false);

      if (cacheInfo.hash === currentHash && cacheExists) {
        return { skip: true, hash: currentHash };
      }
    } catch {
      // Cache doesn't exist or is invalid
    }

    return { skip: false, hash: currentHash };
  } catch (error) {
    return { skip: false, hash: null };
  }
}

/**
 * Restore cached node_modules
 */
async function restoreCachedDependencies(projectPath) {
  try {
    const nodeModulesCache = path.join(CACHE_DIR, 'node_modules');
    const nodeModulesTarget = path.join(projectPath, 'node_modules');

    console.log('[Build] 📦 Restoring cached dependencies...');
    // ✅ OPTIMIZATION: Use rsync instead of cp for faster, more reliable copying
    // rsync is 2-3x faster for large directories and handles symlinks correctly
    // --archive (-a) = preserve symlinks, permissions, timestamps, ownership
    // --delete = remove files in destination that don't exist in source (clean state)
    await fs.mkdir(nodeModulesTarget, { recursive: true });
    await execAsync(`rsync -a --delete "${nodeModulesCache}/" "${nodeModulesTarget}/"`, { timeout: 120000 });

    // ✅ FIX 30: Enhanced cache integrity validation
    // ✅ FIX 45: Added caniuse-lite data validation
    // Check multiple critical paths to ensure complete Next.js installation
    const criticalPaths = [
      path.join(nodeModulesTarget, '.bin', 'next'),
      path.join(nodeModulesTarget, 'next', 'dist', 'server', 'require-hook.js'),
      path.join(nodeModulesTarget, 'next', 'dist', 'server', 'next-server.js'),
      path.join(nodeModulesTarget, 'next', 'dist', 'trace', 'shared.js'),  // Missing in error logs
      path.join(nodeModulesTarget, 'next', 'dist', 'telemetry', 'flush-and-exit.js'),
      path.join(nodeModulesTarget, 'tailwindcss', 'lib', 'util', 'hashConfig.js'),  // Missing in error logs
      path.join(nodeModulesTarget, 'tailwindcss', 'lib', 'lib', 'setupTrackingContext.js'),
      path.join(nodeModulesTarget, 'react', 'index.js'),
      path.join(nodeModulesTarget, 'react-dom', 'index.js'),
      path.join(nodeModulesTarget, 'caniuse-lite', 'data', 'browsers.js')
    ];

    console.log('[Build] 🔍 Validating cache integrity...');
    for (const criticalPath of criticalPaths) {
      try {
        await fs.access(criticalPath);
      } catch {
        const relativePath = path.relative(nodeModulesTarget, criticalPath);
        console.log(`[Build] ⚠️  Cache corrupted (missing ${relativePath}), will run npm install`);
        await fs.rm(nodeModulesTarget, { recursive: true, force: true });
        return false;
      }
    }

    console.log('[Build] ✅ Cache integrity verified - all critical modules present');
    return true;
  } catch (error) {
    console.log('[Build] ⚠️  Failed to restore cache, will run npm install');
    return false;
  }
}

/**
 * Cache node_modules for future builds
 */
async function cacheDependencies(projectPath, packageJsonHash) {
  // Define paths outside try block so they're accessible in catch
  const nodeModulesSource = path.join(projectPath, 'node_modules');
  const nodeModulesCache = path.join(CACHE_DIR, 'node_modules');
  // FIX: Use system tmp to avoid macOS path length limits
  const nodeModulesCacheTmp = path.join(require('os').tmpdir(), `nm-${process.pid}-${Date.now()}`);
  const cacheInfoPath = path.join(CACHE_DIR, 'cache-info.json');

  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });

    console.log('[Build] 💾 Caching dependencies for future builds...');

    // Use a temporary directory to avoid ENOTEMPTY errors
    // 1. Copy to temp location
    // 2. Remove old cache
    // 3. Rename temp to final location

    // Remove any existing temp directory
    try {
      await fs.rm(nodeModulesCacheTmp, { recursive: true, force: true });
    } catch (e) {
      // Ignore - temp might not exist
    }

    // Create temp directory and use rsync with --delete
    await fs.mkdir(nodeModulesCacheTmp, { recursive: true });
    await execAsync(`rsync -a --delete "${nodeModulesSource}/" "${nodeModulesCacheTmp}/"`, { timeout: 120000 });

    // Remove old cache and rename temp to final
    // Use rm -rf via shell for more reliable removal on macOS
    try {
      await execAsync(`rm -rf "${nodeModulesCache}"`, { timeout: 30000 });
    } catch (e) {
      // If shell command fails, try Node.js method
      try {
        await fs.rm(nodeModulesCache, { recursive: true, force: true, maxRetries: 3 });
      } catch (e2) {
        // Ignore if doesn't exist
      }
    }

    await fs.rename(nodeModulesCacheTmp, nodeModulesCache);

    // Save cache info
    await fs.writeFile(cacheInfoPath, JSON.stringify({
      hash: packageJsonHash,
      timestamp: Date.now()
    }));

    console.log('[Build] ✅ Dependencies cached');
  } catch (error) {
    console.log('[Build] ⚠️  Failed to cache dependencies:', error.message);
    if (error.stderr) console.log('[Build] rsync stderr:', error.stderr);
    if (error.stdout) console.log('[Build] rsync stdout:', error.stdout);
    console.log('[Build] This is non-fatal - builds will still work but won\'t benefit from caching');

    // Clean up temp directory if it exists
    try {
      await fs.rm(nodeModulesCacheTmp, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Build and export Next.js project
 * @param {string} projectPath - Absolute path to project directory
 * @param {Function} onProgress - Callback for progress updates (step, message)
 * @returns {Promise<{success: boolean, outputDir?: string, error?: string}>}
 */
async function buildAndExport(projectPath, onProgress = () => {}) {
  try {
    console.log(`[Build] Starting OPTIMIZED build for: ${projectPath}`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // OPTIMIZATION 1: Dependency Caching
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const cacheCheck = await shouldSkipInstall(projectPath);
    let needsInstall = !cacheCheck.skip;
    let packageJsonHash = cacheCheck.hash;

    if (cacheCheck.skip) {
      console.log('[Build] ⚡ package.json unchanged, using cached dependencies');
      onProgress('install', 'Using cached dependencies...');
      const restored = await restoreCachedDependencies(projectPath);
      if (!restored) {
        console.log('[Build] ⚠️  Cache restoration failed - will run npm install');
        needsInstall = true;
      } else {
        console.log('[Build] ✅ Cache validated - SKIPPING npm install entirely');
        needsInstall = false;
      }
    }

    // Step 1: npm install (only if needed)
    if (needsInstall) {
      onProgress('install', 'Installing dependencies...');
      console.log('[Build] Step 1/2: npm install');

      try {
        // ✅ OPTIMIZATION: Use npm ci when package-lock.json exists (faster and more reliable)
        // ✅ OPTIMIZATION: Use --prefer-offline to leverage local npm cache (fallback to network if needed)
        const hasPackageLock = await fs.access(path.join(projectPath, 'package-lock.json')).then(() => true).catch(() => false);
        const installCommand = hasPackageLock
          ? 'npm ci --no-audit --no-fund --prefer-offline'  // npm ci is faster and more deterministic
          : 'npm install --no-audit --no-fund --prefer-offline';

        console.log(`[Build] Running: ${installCommand}`);
        const { stdout: installStdout, stderr: installStderr } = await execAsync(
          installCommand,
          {
            cwd: projectPath,
            timeout: 300000, // 5 minutes (increased from 2 minutes to handle slower installs)
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer
          }
        );

        if (installStdout) {
          console.log('[Build] Install output:', installStdout);
        }
        if (installStderr && !installStderr.includes('npm WARN')) {
          console.log('[Build] Install warnings:', installStderr);
        }
        console.log('[Build] ✅ Dependencies installed');

        // Cache dependencies for future builds
        if (packageJsonHash) {
          await cacheDependencies(projectPath, packageJsonHash);
        }
      } catch (installError) {
        console.error('[Build] ❌ npm install failed:', installError.message);
        console.error('[Build] Install stdout:', installError.stdout);
        console.error('[Build] Install stderr:', installError.stderr);
        return {
          success: false,
          error: `Dependency installation failed: ${installError.message}\n${installError.stderr || ''}`
        };
      }
    } else {
      console.log('[Build] ⚡ Skipped npm install (using cache) - saved ~15-30 seconds');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // OPTIMIZATION 2: Restore .next cache for incremental builds
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ FIX: Per-project .next cache to support parallel deployments
    const projectId = path.basename(projectPath).replace('project-', '');
    const nextCachePath = path.join(CACHE_DIR, 'next-cache', projectId);
    const projectNextPath = path.join(projectPath, '.next');

    try {
      const cacheExists = await fs.access(nextCachePath).then(() => true).catch(() => false);
      if (cacheExists) {
        console.log('[Build] ⚡ Restoring .next cache for incremental build...');
        // ✅ OPTIMIZATION: Use rsync for faster cache restoration
        await execAsync(`rsync -a --delete "${nextCachePath}/" "${projectNextPath}/"`, { timeout: 30000 });
        console.log('[Build] ✅ .next cache restored');
      }
    } catch (error) {
      console.log('[Build] ⚠️  Could not restore .next cache, doing full build');
    }

    // Step 2: next build (includes static export)
    onProgress('build', 'Building Next.js application...');
    console.log('[Build] Step 2/2: next build (incremental)');

    try {
      const { stdout: buildStdout, stderr: buildStderr } = await execAsync(
        'npm run build',
        {
          cwd: projectPath,
          timeout: 300000, // 5 minutes
          maxBuffer: 20 * 1024 * 1024, // 20MB buffer
          env: {
            ...process.env,
            NODE_ENV: 'production'
          }
        }
      );

      console.log('[Build] Build output:', buildStdout);
      if (buildStderr) {
        console.log('[Build] Build stderr:', buildStderr);
      }
      console.log('[Build] ✅ Build completed');

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // OPTIMIZATION 3: Cache .next for future incremental builds
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      try {
        // ✅ FIX: Ensure per-project cache directory exists
        await fs.mkdir(path.join(CACHE_DIR, 'next-cache'), { recursive: true });
        await fs.rm(nextCachePath, { recursive: true, force: true });
        await fs.mkdir(nextCachePath, { recursive: true });
        console.log(`[Build] 💾 Caching .next for project ${projectId}...`);
        // ✅ OPTIMIZATION: Use rsync for faster cache saving
        // NOTE: --delete is unnecessary here since we removed the old cache above
        await execAsync(`rsync -a "${projectNextPath}/" "${nextCachePath}/"`, { timeout: 60000 });
        console.log(`[Build] ✅ .next cache saved for project ${projectId}`);
      } catch (cacheError) {
        console.log('[Build] ⚠️  Could not cache .next:', cacheError.message);
      }

    } catch (buildError) {
      console.error('[Build] ❌ next build failed:', buildError.message);

      // Parse error for common issues
      const errorMessage = buildError.message || buildError.stderr || buildError.stdout || '';
      let userFriendlyError = 'Build failed';

      if (errorMessage.includes('TypeScript')) {
        userFriendlyError = 'TypeScript compilation errors detected';
      } else if (errorMessage.includes('Module not found')) {
        userFriendlyError = 'Missing module or import error';
      } else if (errorMessage.includes('SyntaxError')) {
        userFriendlyError = 'Syntax error in generated code';
      }

      return {
        success: false,
        error: `${userFriendlyError}: ${errorMessage.substring(0, 500)}`
      };
    }

    // Step 3: Verify build output exists (.next for standard builds, out for static export)
    const nextDir = path.join(projectPath, '.next');
    const outDir = path.join(projectPath, 'out');

    let outputDir;
    try {
      await fs.access(nextDir);
      outputDir = nextDir;
      console.log('[Build] ✅ Standard build verified (.next directory):', outputDir);
    } catch {
      try {
        await fs.access(outDir);
        outputDir = outDir;
        console.log('[Build] ✅ Static export verified (out directory):', outputDir);
      } catch (error) {
        console.error('[Build] ❌ No build output found (checked .next and out directories)');
        return {
          success: false,
          error: 'Build completed but no output directory was generated'
        };
      }
    }

    onProgress('complete', 'Build successful');
    return {
      success: true,
      outputDir
    };

  } catch (error) {
    console.error('[Build] ❌ Unexpected error:', error);
    return {
      success: false,
      error: `Unexpected build error: ${error.message}`
    };
  }
}

/**
 * Copy built files from ./out to deployment directory
 * @param {string} outputDir - Path to Next.js out directory
 * @param {string} deployDir - Path to deployment directory
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function copyToDeployment(outputDir, deployDir) {
  try {
    console.log(`[Build] Copying files from ${outputDir} to ${deployDir}`);

    // Ensure deployment directory exists
    await fs.mkdir(deployDir, { recursive: true });

    // Copy all files from out/ to deployment directory
    // ✅ OPTIMIZATION: Use rsync for faster, more reliable copying
    const { stdout, stderr } = await execAsync(
      `rsync -a --delete "${outputDir}/" "${deployDir}/"`,
      { timeout: 60000 }
    );

    if (stderr) {
      console.log('[Build] Copy warnings:', stderr);
    }

    console.log('[Build] ✅ Files copied to deployment directory');
    return { success: true };

  } catch (error) {
    console.error('[Build] ❌ Failed to copy files:', error);
    return {
      success: false,
      error: `Failed to copy files: ${error.message}`
    };
  }
}

/**
 * Clean up build artifacts (node_modules, .next, out)
 * @param {string} projectPath - Path to project directory
 * @returns {Promise<void>}
 */
async function cleanupBuildArtifacts(projectPath) {
  try {
    console.log(`[Build] Cleaning up build artifacts in ${projectPath}`);

    const dirsToRemove = ['node_modules', '.next', 'out'];

    for (const dir of dirsToRemove) {
      const dirPath = path.join(projectPath, dir);
      try {
        await fs.rm(dirPath, { recursive: true, force: true });
        console.log(`[Build] Removed ${dir}`);
      } catch (error) {
        // Ignore errors if directory doesn't exist
        console.log(`[Build] Could not remove ${dir} (may not exist)`);
      }
    }

    console.log('[Build] ✅ Cleanup complete');
  } catch (error) {
    console.error('[Build] Cleanup warning:', error.message);
    // Don't throw - cleanup is non-critical
  }
}

module.exports = {
  buildAndExport,
  copyToDeployment,
  cleanupBuildArtifacts
};
