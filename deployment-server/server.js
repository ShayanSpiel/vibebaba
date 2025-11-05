const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');
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

function startApiServer(projectId, buildPath) {
  console.log(`\n[API Manager] 🚀 Starting API server for ${projectId}...`);
  console.log(`[API Manager] 📂 Build path: ${buildPath}`);

  const port = allocatePort(projectId);
  const apiServerPath = path.join(buildPath, 'api');

  // Check if API server exists
  if (!fs.existsSync(path.join(apiServerPath, 'server.js'))) {
    console.error(`[API Manager] ❌ No API server found at ${apiServerPath}/server.js`);
    releasePort(port);
    return null;
  }

  const apiProcess = spawn('node', ['server.js'], {
    cwd: apiServerPath,
    env: {
      ...process.env,
      PORT: port,
      PROJECT_ID: projectId,
      NODE_ENV: 'production'
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

      setTimeout(() => {
        try {
          startApiServer(projectId, buildPath);
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
    startTime: Date.now(),
    restartCount: 0
  });

  console.log(`[API Manager] ✅ API server started for ${projectId} on port ${port}\n`);

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
    await fs.emptyDir(buildPath);

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

    // Add cleanup task (always runs)
    console.log(`🧹 Cleaning up build artifacts...`);
    const cleanupTask = cleanupBuildArtifacts(buildPath);
    finalTasks.push(cleanupTask);

    // Run both tasks in parallel
    await Promise.all(finalTasks);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 6: Start API server (if backend config exists)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let apiPort = null;
    let apiUrl = null;

    if (backendConfig?.apiEndpoints && backendConfig.apiEndpoints.length > 0) {
      console.log(`\n🔧 Step 6/6: Starting API server...`);
      console.log(`[Deployment] 🔗 API Endpoints: ${backendConfig.apiEndpoints.length}`);

      try {
        // Stop existing API server if running
        if (apiServers.has(projectId)) {
          console.log('[Deployment] ♻️  Stopping existing API server...');
          stopApiServer(projectId);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for cleanup
        }

        // Start new API server
        apiPort = startApiServer(projectId, buildPath);

        if (apiPort) {
          apiUrl = `http://localhost:${apiPort}`;
          console.log(`[Deployment] ✅ API server started on port ${apiPort}\n`);
        } else {
          console.log(`[Deployment] ⚠️  API server not started (no server files found)\n`);
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
        hasBackend: !!apiPort
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

  // Serve static files from project directory
  express.static(projectPath, {
    index: ['index.html'],
    extensions: ['html'],
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      // Permissive CSP for deployed apps (they're user-generated)
      res.setHeader('Content-Security-Policy',
        "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
        "script-src * 'unsafe-inline' 'unsafe-eval'; " +
        "style-src * 'unsafe-inline'; " +
        "img-src * data: blob:; " +
        "font-src * data:; " +
        "connect-src *; " +
        "frame-src *;"
      );
    }
  })(req, res, next);
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
