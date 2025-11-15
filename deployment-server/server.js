const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { ensureCollection, generateSampleData } = require('./pocketbase.js');
const { generateScaffold } = require('./nextjs-scaffold.js');
const { buildAndExport, copyToDeployment, cleanupBuildArtifacts } = require('./build-manager.js');
const { analyzeAndFix } = require('./dependency-analyzer.js');

const app = express();
const PORT = 4000;
const DEPLOYMENTS_DIR = path.join(__dirname, 'deployments');
const BUILD_DIR = path.join(__dirname, 'builds'); // Temporary build directory

// Track active deployments to prevent race conditions
const activeDeployments = new Set();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BUILD DIFFING - Detect unchanged code for instant deployments
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const deploymentHashes = new Map(); // projectId -> { hash, url, timestamp }
const DEPLOYMENT_HASHES_FILE = path.join(__dirname, 'deployment-hashes.json');

// Load existing deployment hashes on startup
function loadDeploymentHashes() {
  try {
    if (fs.existsSync(DEPLOYMENT_HASHES_FILE)) {
      const data = fs.readFileSync(DEPLOYMENT_HASHES_FILE, 'utf-8');
      const hashes = JSON.parse(data);
      Object.entries(hashes).forEach(([projectId, hashData]) => {
        deploymentHashes.set(projectId, hashData);
      });
      console.log(`[Build Diffing] Loaded ${deploymentHashes.size} deployment hashes`);
    }
  } catch (error) {
    console.error('[Build Diffing] Failed to load deployment hashes:', error);
  }
}

// Save deployment hashes to file
function saveDeploymentHashes() {
  try {
    const hashes = Object.fromEntries(deploymentHashes);
    fs.writeFileSync(DEPLOYMENT_HASHES_FILE, JSON.stringify(hashes, null, 2));
  } catch (error) {
    console.error('[Build Diffing] Failed to save deployment hashes:', error);
  }
}

// Hash all files in a directory (recursive)
async function hashFilesInDirectory(dir, fileList = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules, .next, out, .git
      if (!['node_modules', '.next', 'out', '.git'].includes(entry.name)) {
        await hashFilesInDirectory(fullPath, fileList);
      }
    } else {
      // Only hash source files
      if (/\.(tsx?|jsx?|json|css|html)$/.test(entry.name)) {
        try {
          const content = await fs.readFile(fullPath, 'utf8');
          const hash = crypto.createHash('sha256').update(content).digest('hex');
          const relativePath = path.relative(dir, fullPath);
          fileList.push({ path: relativePath, hash });
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
  }

  return fileList;
}

// Calculate combined hash for all files
async function calculateProjectHash(projectPath) {
  const fileHashes = await hashFilesInDirectory(projectPath);

  // Sort by path for consistent hashing
  fileHashes.sort((a, b) => a.path.localeCompare(b.path));

  // Combine all hashes
  const combined = fileHashes.map(f => `${f.path}:${f.hash}`).join('|');
  return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 16);
}

// Initialize deployment hashes
loadDeploymentHashes();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUBDOMAIN ROUTING MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const subdomainMap = new Map(); // subdomain -> projectId
const SUBDOMAIN_MAP_FILE = path.join(__dirname, 'subdomain-map.json');

// Load existing subdomain mappings on startup
function loadSubdomainMap() {
  try {
    if (fs.existsSync(SUBDOMAIN_MAP_FILE)) {
      const data = fs.readFileSync(SUBDOMAIN_MAP_FILE, 'utf-8');
      const mappings = JSON.parse(data);
      Object.entries(mappings).forEach(([subdomain, projectId]) => {
        subdomainMap.set(subdomain, projectId);
      });
      console.log(`[Subdomain] Loaded ${subdomainMap.size} subdomain mappings`);
    }
  } catch (error) {
    console.error('[Subdomain] Failed to load subdomain map:', error);
  }
}

// Save subdomain mappings to file
function saveSubdomainMap() {
  try {
    const mappings = Object.fromEntries(subdomainMap);
    fs.writeFileSync(SUBDOMAIN_MAP_FILE, JSON.stringify(mappings, null, 2));
    console.log(`[Subdomain] Saved ${subdomainMap.size} subdomain mappings`);
  } catch (error) {
    console.error('[Subdomain] Failed to save subdomain map:', error);
  }
}

// Initialize subdomain mappings
loadSubdomainMap();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API SERVER MANAGEMENT (Express servers per project)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const apiServers = new Map(); // projectId → { process, port, startTime, restartCount }
const usedPorts = new Set();
const PORT_RANGE = { min: 5000, max: 6000 };
const MAX_RESTART_ATTEMPTS = 3;
const RESTART_DELAY_MS = 2000;

function allocatePort(projectId) {
  console.log(`[API Manager] 🔍 Allocating port for ${projectId}...`);

  // DETERMINISTIC PORT ALLOCATION: Use projectId hash to always assign same port
  // This ensures frontend knows the port before deployment
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = ((hash << 5) - hash) + projectId.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Map hash to port range (5000-6000)
  const portOffset = Math.abs(hash) % (PORT_RANGE.max - PORT_RANGE.min + 1);
  const preferredPort = PORT_RANGE.min + portOffset;

  // Try preferred port first (deterministic)
  if (!usedPorts.has(preferredPort)) {
    usedPorts.add(preferredPort);
    console.log(`[API Manager] ✅ Allocated deterministic port ${preferredPort} to ${projectId}`);
    return preferredPort;
  }

  // Fallback: Try sequential ports if preferred is taken (rare collision)
  console.log(`[API Manager] ⚠️  Preferred port ${preferredPort} in use, trying alternatives...`);
  for (let port = PORT_RANGE.min; port <= PORT_RANGE.max; port++) {
    if (!usedPorts.has(port)) {
      usedPorts.add(port);
      console.log(`[API Manager] ✅ Allocated fallback port ${port} to ${projectId}`);
      return port;
    }
  }

  console.error(`[API Manager] ❌ Port exhaustion - all ports ${PORT_RANGE.min}-${PORT_RANGE.max} in use`);
  throw new Error('Port exhaustion - all ports 5000-6000 in use');
}

function releasePort(port) {
  if (usedPorts.has(port)) {
    usedPorts.delete(port);
    console.log(`[API Manager] ♻️  Released port ${port}`);
  }
}

async function startApiServer(projectId, buildPath) {
  console.log(`\n[API Manager] 🚀 Starting API server for ${projectId}...`);
  console.log(`[API Manager] 📂 Build path: ${buildPath}`);

  // Check for standalone Next.js server (for API routes like NextAuth)
  const standaloneServerPath = path.join(buildPath, 'standalone');
  const standalonServerFile = path.join(standaloneServerPath, 'server.js');

  // Check for Express API server
  const apiServerPath = path.join(buildPath, 'api');
  const expressServerFile = path.join(apiServerPath, 'server.js');

  let serverPath = null;
  let serverType = null;

  if (fs.existsSync(standalonServerFile)) {
    serverPath = standaloneServerPath;
    serverType = 'standalone';
    console.log(`[API Manager] 📦 Found standalone Next.js server (supports API routes)`);
  } else if (fs.existsSync(expressServerFile)) {
    serverPath = apiServerPath;
    serverType = 'express';
    console.log(`[API Manager] 📦 Found Express API server`);
  } else {
    console.log(`[API Manager] ℹ️  No API server found - using PocketBase-direct architecture`);
    console.log(`[API Manager] ℹ️  Frontend will call PocketBase API directly via /pb-api proxy`);
    return null; // Return null without allocating port (not an error)
  }

  const port = allocatePort(projectId);

  // ✅ FIX: Install dependencies before starting server (Express API only, standalone has deps)
  if (serverType === 'express') {
    console.log(`[API Manager] 📦 Installing API dependencies for ${projectId}...`);
    const npmInstall = spawn('npm', ['install'], {
      cwd: serverPath,
      stdio: 'inherit'
    });

    await new Promise((resolve, reject) => {
      npmInstall.on('exit', (code) => {
        if (code === 0) {
          console.log(`[API Manager] ✅ Dependencies installed for ${projectId}`);
          resolve();
        } else {
          console.error(`[API Manager] ❌ npm install failed for ${projectId} (exit code: ${code})`);
          reject(new Error('npm install failed'));
        }
      });

      npmInstall.on('error', (err) => {
        console.error(`[API Manager] ❌ npm install error for ${projectId}:`, err);
        reject(err);
      });
    }).catch((err) => {
      console.error(`[API Manager] ❌ Failed to install dependencies: ${err.message}`);
      releasePort(port);
      return null;
    });
  } else {
    console.log(`[API Manager] ℹ️  Standalone server has dependencies pre-installed`);
  }

  const apiProcess = spawn('node', ['server.js'], {
    cwd: serverPath,
    env: {
      ...process.env,
      PORT: port,
      HOSTNAME: '0.0.0.0', // Standalone Next.js requires HOSTNAME
      PROJECT_ID: projectId,
      NODE_ENV: 'production',
      // NextAuth/PocketBase integration
      NEXT_PUBLIC_POCKETBASE_URL: process.env.POCKETBASE_URL || 'http://127.0.0.1:8090',
      POCKETBASE_URL: process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
    },
    detached: false
  });

  apiProcess.stdout.on('data', (data) => {
    console.log(`[API ${projectId}:${port}] ${data.toString().trim()}`);
  });

  apiProcess.stderr.on('data', (data) => {
    console.error(`[API ${projectId}:${port}] ❌ ERROR: ${data.toString().trim()}`);
  });

  apiProcess.on('exit', (code, signal) => {
    console.log(`[API ${projectId}:${port}] ⚠️  Process exited with code ${code}, signal ${signal}`);

    const server = apiServers.get(projectId);
    if (server && server.restartCount < MAX_RESTART_ATTEMPTS) {
      console.log(`[API ${projectId}:${port}] 🔄 Auto-restarting (attempt ${server.restartCount + 1}/${MAX_RESTART_ATTEMPTS})...`);

      setTimeout(async () => {
        try {
          await startApiServer(projectId, buildPath);
        } catch (error) {
          console.error(`[API ${projectId}:${port}] ❌ Restart failed: ${error.message}`);
        }
      }, RESTART_DELAY_MS);

      server.restartCount += 1;
    } else if (server) {
      console.error(`[API ${projectId}:${port}] ❌ Max restart attempts reached - giving up`);
      releasePort(port);
      apiServers.delete(projectId);
    }
  });

  apiServers.set(projectId, {
    process: apiProcess,
    port,
    type: serverType, // Store server type for routing decisions
    startTime: Date.now(),
    restartCount: 0
  });

  console.log(`[API Manager] ✅ ${serverType === 'standalone' ? 'Standalone Next.js' : 'Express API'} server started for ${projectId} on port ${port}\n`);

  return port;
}

function stopApiServer(projectId) {
  console.log(`[API Manager] 🛑 Stopping API server for ${projectId}...`);

  const server = apiServers.get(projectId);
  if (server) {
    server.process.kill('SIGTERM');
    releasePort(server.port);
    apiServers.delete(projectId);
    console.log(`[API Manager] ✅ API server stopped for ${projectId}`);
  } else {
    console.log(`[API Manager] ⚠️  No API server found for ${projectId}`);
  }
}

async function healthCheck(projectId) {
  const server = apiServers.get(projectId);
  if (!server) return false;

  try {
    const res = await fetch(`http://localhost:${server.port}/health`, {
      signal: AbortSignal.timeout(2000) // 2 second timeout
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure directories exist
fs.ensureDirSync(DEPLOYMENTS_DIR);
fs.ensureDirSync(BUILD_DIR);

// Import database routes
const dbRoutes = require('./db-routes');
app.use('/api', dbRoutes);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POCKETBASE PROXY
// Proxy /pb-api/* to PocketBase at localhost:8090/*
// PocketBase SDK adds /api prefix automatically, so req.url already contains it
// This avoids Chrome's Private Network Access blocking for localhost cross-port requests
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use('/pb-api', async (req, res) => {
  const pbUrl = `http://localhost:8090${req.url}`;
  try {
    const response = await fetch(pbUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: 'localhost:8090',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    // Forward status and headers
    res.status(response.status);
    response.headers.forEach((value, key) => {
      // Don't forward certain headers
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    // Forward response body
    const data = await response.text();
    res.send(data);
  } catch (error) {
    console.error('[PocketBase Proxy] Error:', error.message);
    res.status(502).json({ error: 'Proxy error', message: error.message });
  }
});

// Deploy endpoint - Next.js with Static Export
app.post('/deploy/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { files, backendConfig } = req.body;

  // Check if deployment already in progress
  if (activeDeployments.has(projectId)) {
    console.log(`⚠️  Deployment already in progress for project: ${projectId}`);
    return res.status(409).json({
      error: 'Deployment already in progress',
      projectId,
      message: 'Please wait for the current deployment to finish before starting a new one.'
    });
  }

  // Lock deployment
  activeDeployments.add(projectId);
  console.log(`🚀 Deploying Next.js project: ${projectId}`);
  console.log(`📦 Files to deploy: ${files?.length || 0}`);

  try {
    const buildPath = path.join(BUILD_DIR, `project-${projectId}`);
    const deployPath = path.join(DEPLOYMENTS_DIR, `project-${projectId}`);

    console.log(`⚡ OPTIMIZED DEPLOYMENT PIPELINE STARTING...`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: Write all files (scaffold + user files already merged by devops-node)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log(`📝 Step 1/4: Writing all project files...`);
    // ✅ OPTIMIZATION: Use ensureDir instead of emptyDir to preserve incremental build state
    await fs.ensureDir(buildPath);
    console.log(`  📁 Using persistent build directory (incremental builds enabled)`);
    console.log(`  📂 Path: ${buildPath}`);

    // ✅ FIX 47: Deduplicate files array to prevent duplicate writes causing corruption
    // Keep last occurrence (most recent version)
    const fileMap = new Map();
    (files || []).forEach(file => {
      fileMap.set(file.path, file);
    });
    const deduplicatedFiles = Array.from(fileMap.values());

    const duplicateCount = (files || []).length - deduplicatedFiles.length;
    if (duplicateCount > 0) {
      console.log(`  ⚠️  Found ${duplicateCount} duplicate file(s) - using latest version`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // OPTIMIZATION 4: Parallel file writing + dependency analysis prep
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const fileWritePromises = deduplicatedFiles.map(async (file) => {
      const filePath = path.join(buildPath, file.path);
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, file.content, 'utf8');
      console.log(`  ✅ ${file.path}`);
    });

    // Write all files in parallel
    await Promise.all(fileWritePromises);
    console.log(`  ⚡ All files written in parallel`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // OPTIMIZATION 5: Build Diffing - Skip rebuild if source unchanged
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const startTime = Date.now();
    const currentHash = await calculateProjectHash(buildPath);
    const lastDeployment = deploymentHashes.get(projectId);

    console.log(`🔍 Build Diffing: Current hash = ${currentHash}`);
    if (lastDeployment) {
      console.log(`🔍 Build Diffing: Last hash    = ${lastDeployment.hash}`);
    }

    if (lastDeployment && lastDeployment.hash === currentHash) {
      const hashCheckTime = Date.now() - startTime;
      console.log(`✅ BUILD SKIPPED - Source code unchanged!`);
      console.log(`   ⚡ Reusing existing deployment (${hashCheckTime}ms)`);
      console.log(`   📦 Last deployed: ${new Date(lastDeployment.timestamp).toLocaleString()}`);
      console.log(`   🌐 URL: ${lastDeployment.url}`);

      // Return existing deployment immediately
      return res.json({
        success: true,
        url: lastDeployment.url,
        apiUrl: lastDeployment.apiUrl || null,
        databaseUrl: lastDeployment.databaseUrl || null,
        cached: true,
        deployTime: `${hashCheckTime}ms`,
        message: 'Deployment unchanged - reusing existing build',
        filesDeployed: files.length,
        buildInfo: {
          framework: 'Next.js 14+ (Static Export)',
          outputType: 'static',
          cached: true,
          lastDeployed: new Date(lastDeployment.timestamp).toISOString()
        }
      });
    }

    console.log(`⚡ Source changed - proceeding with build...`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: Analyze and fix missing dependencies
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log(`🔍 Step 2/4: Analyzing dependencies...`);
    try {
      const depResult = await analyzeAndFix(buildPath);
      if (depResult.fixed) {
        const packageCount = Object.keys(depResult.addedPackages).length;
        console.log(`  ✅ Auto-added ${packageCount} missing packages`);
      } else {
        console.log(`  ✅ All dependencies satisfied`);
      }

      // CRITICAL: Check for missing local imports (these will cause build failures)
      if (depResult.missingLocalImports && depResult.missingLocalImports.length > 0) {
        console.error(`❌ Build failed: ${depResult.missingLocalImports.length} missing local module(s)`);
        await cleanupBuildArtifacts(buildPath);
        return res.status(400).json({
          success: false,
          error: `Missing local modules:\n${depResult.missingLocalImports.slice(0, 3).map(m => `  ${m.file}: import '${m.import}'`).join('\n')}`,
          stage: 'validation',
          missingModules: depResult.missingLocalImports
        });
      }
    } catch (depError) {
      console.warn(`  ⚠️  Dependency analysis failed (continuing anyway):`, depError.message);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 3: Build Next.js project
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log(`🔨 Step 3/4: Building Next.js project...`);
    const buildResult = await buildAndExport(buildPath, (step, message) => {
      console.log(`  [${step}] ${message}`);
    });

    if (!buildResult.success) {
      console.error(`❌ Build failed: ${buildResult.error}`);
      await cleanupBuildArtifacts(buildPath);
      return res.status(500).json({
        success: false,
        error: buildResult.error,
        stage: 'build'
      });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 4: Copy built files to deployment directory
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log(`📦 Step 4/4: Deploying built files...`);
    await fs.emptyDir(deployPath);

    const copyResult = await copyToDeployment(buildResult.outputDir, deployPath);
    if (!copyResult.success) {
      console.error(`❌ Deployment copy failed: ${copyResult.error}`);
      await cleanupBuildArtifacts(buildPath);
      return res.status(500).json({
        success: false,
        error: copyResult.error,
        stage: 'copy'
      });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 5: Setup database collections (if backend exists)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // OPTIMIZATION 5: Parallel database setup + cleanup
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const finalTasks = [];

    // Add database setup task if needed
    if (backendConfig?.collections) {
      console.log(`🗄️  Step 5/5: Setting up ${backendConfig.collections.length} database collections...`);

      const dbSetupTask = (async () => {
        for (const collection of backendConfig.collections) {
          try {
            await ensureCollection(projectId, collection.name, collection.fields || []);
            await generateSampleData(projectId, collection);
          } catch (error) {
            console.error(`  ❌ Failed to setup collection ${collection.name}:`, error.message);
          }
        }
        console.log(`  ✅ Database setup complete!`);
      })();

      finalTasks.push(dbSetupTask);
    } else {
      console.log(`⏭️  Step 5/5: No database collections (skipped)`);
    }

    // ✅ OPTIMIZATION: Keep build directory for faster redeployments
    // Build artifacts (node_modules, .next) are preserved for incremental builds
    console.log(`✅ Build directory preserved for future deployments`);
    console.log(`   💾 Cached at: ${buildPath}`);
    console.log(`   ⚡ Next deployment will be 70-80% faster!`);

    // Run database setup (if exists)
    if (finalTasks.length > 0) {
      await Promise.all(finalTasks);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 6: Start API server (Express API OR standalone Next.js)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let apiPort = null;
    let apiUrl = null;

    // Check if Express API or standalone Next.js server exists
    const hasExpressApi = backendConfig?.apiEndpoints && backendConfig.apiEndpoints.length > 0;
    const hasStandaloneServer = fs.existsSync(path.join(deployPath, 'standalone', 'server.js'));

    if (hasExpressApi || hasStandaloneServer) {
      console.log(`\n🔧 Step 6/6: Starting ${hasStandaloneServer ? 'standalone Next.js' : 'Express API'} server...`);
      if (hasExpressApi) {
        console.log(`[Deployment] 🔗 API Endpoints: ${backendConfig.apiEndpoints.length}`);
      }
      if (hasStandaloneServer) {
        console.log(`[Deployment] 📦 Standalone Next.js (for API routes like NextAuth)`);
      }

      try {
        // Stop existing API server if running
        if (apiServers.has(projectId)) {
          console.log('[Deployment] ♻️  Stopping existing API server...');
          stopApiServer(projectId);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for cleanup
        }

        // Start new API server (will auto-detect standalone or Express)
        apiPort = await startApiServer(projectId, deployPath);

        if (apiPort) {
          apiUrl = `http://localhost:${apiPort}`;
          console.log(`[Deployment] ✅ ${hasStandaloneServer ? 'Standalone Next.js' : 'Express API'} server started on port ${apiPort}\n`);
        } else {
          console.log(`[Deployment] ℹ️  API server not started (using PocketBase-direct architecture)\n`);
        }
      } catch (error) {
        console.error('[Deployment] ❌ Failed to start API server:', error.message);
        // Continue with deployment even if API server fails
      }
    } else {
      console.log(`\n⏭️  Step 6/6: No API server needed (static only)`);
    }

    const deploymentUrl = `http://localhost:${PORT}/apps/project-${projectId}/`;
    const databaseUrl = backendConfig?.collections
      ? `http://localhost:8090/_/#/collections?filter=project_${projectId}`
      : null;

    console.log(`✅ Deployment successful!`);
    console.log(`🌐 URL: ${deploymentUrl}`);
    if (apiUrl) {
      console.log(`🔗 API: ${apiUrl}`);
    }
    if (databaseUrl) {
      console.log(`🗄️  Database: ${databaseUrl}`);
    }

    // ✅ OPTIMIZATION: Save deployment hash for future build diffing
    deploymentHashes.set(projectId, {
      hash: currentHash,
      url: deploymentUrl,
      apiUrl: apiUrl,
      databaseUrl: databaseUrl,
      timestamp: Date.now()
    });
    saveDeploymentHashes();
    console.log(`💾 Deployment hash saved for future optimizations`);

    res.json({
      success: true,
      url: deploymentUrl,
      apiUrl: apiUrl,
      databaseUrl: databaseUrl,
      files: files,
      filesDeployed: files.length,
      buildInfo: {
        framework: 'Next.js 14+ (Static Export)',
        outputType: 'static',
        hasBackend: !!apiPort,
        hash: currentHash
      }
    });
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stage: 'unknown'
    });
  } finally {
    // Always unlock deployment, even if it failed
    activeDeployments.delete(projectId);
    console.log(`🔓 Deployment lock released for project: ${projectId}`);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUBLISH/UNPUBLISH ENDPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Publish a project to a subdomain
app.post('/publish', (req, res) => {
  const { projectId, subdomain } = req.body;

  if (!projectId || !subdomain) {
    return res.status(400).json({
      error: 'Missing required fields: projectId and subdomain'
    });
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const deployUrl = isProduction
    ? `https://${subdomain}.vibebaba.com`
    : `http://localhost:${PORT}/apps/project-${projectId}`;

  console.log(`[Subdomain] Publishing ${projectId} to ${deployUrl}`);

  // Add to subdomain map (used in production for subdomain routing)
  subdomainMap.set(subdomain, projectId);

  // Save to file for persistence
  saveSubdomainMap();

  res.json({
    success: true,
    subdomain,
    projectId,
    url: deployUrl
  });
});

// Unpublish a project (remove subdomain mapping)
app.post('/unpublish', (req, res) => {
  const { projectId } = req.body;

  if (!projectId) {
    return res.status(400).json({
      error: 'Missing required field: projectId'
    });
  }

  console.log(`[Subdomain] Unpublishing ${projectId}`);

  // Find and remove subdomain mapping
  let removedSubdomain = null;
  for (const [subdomain, pid] of subdomainMap.entries()) {
    if (pid === projectId) {
      subdomainMap.delete(subdomain);
      removedSubdomain = subdomain;
      break;
    }
  }

  // Save to file
  saveSubdomainMap();

  res.json({
    success: true,
    removedSubdomain,
    projectId
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUBDOMAIN ROUTING MIDDLEWARE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Subdomain routing middleware - Only active in production
app.use((req, res, next) => {
  const host = req.headers.host;
  const isProduction = process.env.NODE_ENV === 'production';

  // Only do subdomain routing in production
  if (!isProduction || !host) {
    return next();
  }

  // Check if this is a subdomain request (*.vibebaba.com)
  const subdomainMatch = host.match(/^(.+)\.vibebaba\.com$/);

  if (subdomainMatch) {
    const subdomain = subdomainMatch[1];

    // Skip 'www' subdomain
    if (subdomain === 'www') {
      return next();
    }

    // Check if this subdomain is mapped to a project
    const projectId = subdomainMap.get(subdomain);

    if (projectId) {
      console.log(`[Subdomain] Routing ${subdomain}.vibebaba.com → project-${projectId}`);

      // Rewrite URL to project path
      req.url = `/apps/project-${projectId}${req.url}`;
    } else {
      console.log(`[Subdomain] No mapping found for ${subdomain}.vibebaba.com`);
    }
  }

  next();
});

// Serve deployed apps - Fixed to properly serve static files with permissive CSP
app.use('/apps/:projectId', (req, res, next) => {
  const { projectId } = req.params;
  const projectPath = path.join(DEPLOYMENTS_DIR, projectId);

  // Check if project directory exists
  if (!fs.existsSync(projectPath)) {
    console.error(`❌ Project not found: ${projectId}`);
    return res.status(404).send('Project not found');
  }

  // Set permissive headers for all responses
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Content-Security-Policy',
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
    "script-src * 'unsafe-inline' 'unsafe-eval'; " +
    "style-src * 'unsafe-inline'; " +
    "img-src * data: blob:; " +
    "font-src * data:; " +
    "connect-src *; " +
    "frame-src *;"
  );

  // ✅ NEW: Proxy /api/* requests to standalone Next.js server (for NextAuth, etc.)
  if (req.path.startsWith('/api/')) {
    const server = apiServers.get(projectId);

    if (server && server.type === 'standalone') {
      // Proxy request to standalone Next.js server
      const targetUrl = `http://localhost:${server.port}${req.path}`;
      console.log(`[Proxy] ${req.method} ${req.path} → standalone:${server.port}`);

      const proxyReq = require('http').request(targetUrl, {
        method: req.method,
        headers: req.headers
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });

      proxyReq.on('error', (err) => {
        console.error(`[Proxy] Error proxying to standalone server:`, err);
        res.status(502).json({ error: 'API server unavailable' });
      });

      req.pipe(proxyReq);
      return;
    }
  }

  // Next.js static export structure: HTML in /server/app/, assets at root
  // Handle static assets (_next/static/* OR static/*) from root
  // Note: req.path already has /apps/project-xxx stripped by Express router
  if (req.path.startsWith('/_next/')) {
    // Map /_next/static/ to /static/ (Next.js build output structure)
    const mappedPath = req.path.replace('/_next/', '/');
    const staticPath = path.join(projectPath, mappedPath);
    if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
      return res.sendFile(staticPath);
    }
  } else if (req.path.startsWith('/static/')) {
    // Direct /static/ access
    const staticPath = path.join(projectPath, req.path);
    if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
      return res.sendFile(staticPath);
    }
  }

  // Handle app HTML from /server/app/
  const appPath = path.join(projectPath, 'server', 'app');

  // Strip trailing slash for route lookups (Next.js trailingSlash: true compatibility)
  // e.g., /basket/ → /basket, but keep / as is
  const routePath = req.path === '/' ? req.path : req.path.replace(/\/$/, '');

  // Try to serve HTML file from app directory
  const filePath = path.join(appPath, routePath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }

  // For SPA routing: Try HTML file for the route (e.g., /basket → basket.html)
  const htmlPath = path.join(appPath, routePath + '.html');
  if (fs.existsSync(htmlPath)) {
    return res.sendFile(htmlPath);
  }

  // Try route as directory with index.html (e.g., /basket → basket/index.html)
  if (routePath !== '/') {
    const dirIndexPath = path.join(appPath, routePath, 'index.html');
    if (fs.existsSync(dirIndexPath)) {
      return res.sendFile(dirIndexPath);
    }
  }

  // Fallback to index.html for SPA client-side routing
  const indexPath = path.join(appPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  // Nothing found
  return res.status(404).send('Not found');
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    deployments: fs.readdirSync(DEPLOYMENTS_DIR).filter(f => f.startsWith('project-')).length,
    apiServers: apiServers.size
  });
});

// Manual reload endpoint - useful for dev:manual mode
app.post('/reload', (req, res) => {
  console.log('🔄 Manual reload triggered');
  res.json({
    success: true,
    message: 'Changes acknowledged. In manual mode, restart server when ready.'
  });
  // In the future, you could add hot-reload logic here
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BUILD CLEANUP ENDPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Clean up build directory for a specific project
app.delete('/cleanup/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const buildPath = path.join(BUILD_DIR, `project-${projectId}`);

  try {
    console.log(`🧹 Cleaning up build directory for ${projectId}...`);

    if (!fs.existsSync(buildPath)) {
      return res.status(404).json({
        success: false,
        error: 'Build directory not found',
        projectId
      });
    }

    // Get size before cleanup
    const { stdout: sizeBefore } = await require('util').promisify(require('child_process').exec)(
      `du -sh "${buildPath}"`
    );

    // Remove build artifacts
    await cleanupBuildArtifacts(buildPath);

    // Also remove deployment hash
    if (deploymentHashes.has(projectId)) {
      deploymentHashes.delete(projectId);
      saveDeploymentHashes();
      console.log(`   💾 Removed deployment hash`);
    }

    console.log(`✅ Cleanup complete for ${projectId}`);
    console.log(`   💾 Freed space: ${sizeBefore.trim().split('\t')[0]}`);

    res.json({
      success: true,
      projectId,
      freedSpace: sizeBefore.trim().split('\t')[0],
      message: 'Build artifacts cleaned up successfully'
    });
  } catch (error) {
    console.error(`❌ Cleanup failed for ${projectId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      projectId
    });
  }
});

// Clean up ALL build directories
app.delete('/cleanup', async (req, res) => {
  try {
    console.log(`🧹 Cleaning up ALL build directories...`);

    const buildDirs = fs.readdirSync(BUILD_DIR)
      .filter(f => f.startsWith('project-'))
      .map(f => path.join(BUILD_DIR, f));

    let totalFreed = 0;
    const results = [];

    for (const buildPath of buildDirs) {
      try {
        const projectId = path.basename(buildPath).replace('project-', '');

        // Get size
        const { stdout } = await require('util').promisify(require('child_process').exec)(
          `du -sk "${buildPath}"`
        );
        const sizeKB = parseInt(stdout.split('\t')[0]);
        totalFreed += sizeKB;

        // Cleanup
        await cleanupBuildArtifacts(buildPath);

        results.push({
          projectId,
          freedKB: sizeKB,
          success: true
        });

        console.log(`   ✅ ${projectId}: ${(sizeKB / 1024).toFixed(1)} MB`);
      } catch (error) {
        console.error(`   ❌ Failed to clean ${buildPath}:`, error.message);
        results.push({
          projectId: path.basename(buildPath).replace('project-', ''),
          error: error.message,
          success: false
        });
      }
    }

    // Clear all deployment hashes
    deploymentHashes.clear();
    saveDeploymentHashes();

    console.log(`✅ Cleanup complete`);
    console.log(`   💾 Total freed: ${(totalFreed / 1024 / 1024).toFixed(2)} GB`);

    res.json({
      success: true,
      projectsCleaned: results.filter(r => r.success).length,
      totalFreedMB: (totalFreed / 1024).toFixed(1),
      results
    });
  } catch (error) {
    console.error(`❌ Mass cleanup failed:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get build directory stats
app.get('/build-stats', async (req, res) => {
  try {
    const buildDirs = fs.readdirSync(BUILD_DIR)
      .filter(f => f.startsWith('project-'));

    const stats = [];
    let totalSize = 0;

    for (const dir of buildDirs) {
      const buildPath = path.join(BUILD_DIR, dir);
      const projectId = dir.replace('project-', '');

      try {
        const { stdout } = await require('util').promisify(require('child_process').exec)(
          `du -sk "${buildPath}"`
        );
        const sizeKB = parseInt(stdout.split('\t')[0]);
        totalSize += sizeKB;

        // Check last modified time
        const stat = fs.statSync(buildPath);

        stats.push({
          projectId,
          sizeMB: (sizeKB / 1024).toFixed(1),
          lastModified: stat.mtime,
          hasHash: deploymentHashes.has(projectId)
        });
      } catch (error) {
        // Skip projects that can't be accessed
      }
    }

    // Sort by size descending
    stats.sort((a, b) => parseFloat(b.sizeMB) - parseFloat(a.sizeMB));

    res.json({
      totalProjects: stats.length,
      totalSizeMB: (totalSize / 1024).toFixed(1),
      cacheHits: stats.filter(s => s.hasHash).length,
      projects: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API SERVER MANAGEMENT ENDPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Get all running API servers
app.get('/api-servers', (req, res) => {
  const servers = Array.from(apiServers.entries()).map(([projectId, server]) => ({
    projectId,
    port: server.port,
    uptime: Date.now() - server.startTime,
    restartCount: server.restartCount
  }));

  res.json({ servers, totalPorts: usedPorts.size });
});

// Health check for specific project API
app.get('/api-servers/:projectId/health', async (req, res) => {
  const { projectId } = req.params;
  const healthy = await healthCheck(projectId);
  const server = apiServers.get(projectId);

  res.json({
    projectId,
    healthy,
    port: server?.port || null,
    uptime: server ? Date.now() - server.startTime : null
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 Vibebaba Deployment Server');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📍 Server:      http://localhost:${PORT}`);
  console.log(`🗄️  PocketBase:  http://localhost:8090/_/`);
  console.log(`📂 Deployments: ${DEPLOYMENTS_DIR}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
});
