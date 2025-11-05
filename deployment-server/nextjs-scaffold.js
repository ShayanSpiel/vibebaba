// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NEXT.JS SCAFFOLD GENERATOR
// Generates necessary config files for Next.js projects
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Generate package.json for Next.js project
 */
function generatePackageJson(projectId) {
  return JSON.stringify({
    name: `project-${projectId}`,
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint'
    },
    dependencies: {
      'next': '^14.2.0',
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      'typescript': '^5.3.0',
      '@types/node': '^20.0.0',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      'class-variance-authority': '^0.7.0',
      'clsx': '^2.1.0',
      'tailwind-merge': '^2.2.0',
      'lucide-react': '^0.460.0',
      '@heroicons/react': '^2.1.0',
      '@mui/icons-material': '^5.15.0',
      '@mui/material': '^5.15.0',
      'pocketbase': '^0.21.0',
      'express': '^4.18.2',
      'cors': '^2.8.5',
      'zod': '^3.22.0'
    },
    devDependencies: {
      'tailwindcss': '^3.4.0',
      'postcss': '^8.4.0',
      'autoprefixer': '^10.4.0'
    }
  }, null, 2);
}

/**
 * Generate next.config.js with static export
 */
function generateNextConfig(projectId) {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/apps/project-${projectId}',
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  // Disable font optimization to prevent network requests during build
  // Fonts are already optimized by next/font/google at runtime
  optimizeFonts: false,
};

module.exports = nextConfig;
`;
}

/**
 * Generate tsconfig.json for TypeScript
 */
function generateTsConfig() {
  return JSON.stringify({
    compilerOptions: {
      target: 'es5',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [
        {
          name: 'next'
        }
      ],
      paths: {
        '@/*': ['./src/*']
      }
    },
    include: ['next-env.d.ts', 'src/**/*.ts', 'src/**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules']
  }, null, 2);
}

/**
 * Generate tailwind.config.js with shadcn/ui theme
 */
function generateTailwindConfig() {
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
`;
}

/**
 * Generate postcss.config.js
 */
function generatePostCssConfig() {
  return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;
}

/**
 * Generate app/globals.css with shadcn/ui CSS variables
 */
function generateGlobalsCss() {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`;
}

/**
 * Generate .gitignore for Next.js
 */
function generateGitignore() {
  return `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`;
}

/**
 * Generate next-env.d.ts (Next.js types)
 */
function generateNextEnv() {
  return `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
`;
}

/**
 * Generate .eslintrc.json (Next.js 15+ compatible)
 */
function generateEslintrc() {
  return JSON.stringify({
    extends: 'next'
  }, null, 2);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPRESS API SERVER TEMPLATES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Calculate deterministic API port from projectId
 * IMPORTANT: This must match the algorithm in deployment-server/server.js and frontend-node.ts
 */
function calculateApiPort(projectId) {
  const PORT_RANGE = { min: 5000, max: 6000 };

  // Same hash algorithm as deployment server
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = ((hash << 5) - hash) + projectId.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Map hash to port range (5000-6000)
  const portOffset = Math.abs(hash) % (PORT_RANGE.max - PORT_RANGE.min + 1);
  const port = PORT_RANGE.min + portOffset;

  return port;
}

function generateExpressServer(projectId, backendConfig, hasAuthEndpoints = false) {
  const collections = backendConfig.collections;
  const collectionNames = collections.map(c => typeof c === 'string' ? c : c.name).filter(c => !(c === 'users' && hasAuthEndpoints));
  const calculatedPort = calculateApiPort(projectId);

  const authImport = hasAuthEndpoints ? `const authRouter = require('./routes/auth');` : '';
  const authRoute = hasAuthEndpoints ? `app.use('/api/auth', authRouter);` : '';

  return `const express = require('express');
const cors = require('cors');
${authImport}
${collectionNames.map(c => `const ${c}Router = require('./routes/${c}');`).join('\n')}

const app = express();
const PORT = process.env.PORT || ${calculatedPort}; // Fallback to deterministic port
const PROJECT_ID = process.env.PROJECT_ID || '${projectId}';

console.log(\`🚀 Starting API server for project: \${PROJECT_ID}\`);
console.log(\`📊 Collections: ${collectionNames.join(', ')}\`);
${hasAuthEndpoints ? `console.log('🔐 Authentication: ENABLED');` : ''}

// CORS configuration
app.use(cors({
  origin: 'http://localhost:4000',
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    projectId: PROJECT_ID,
    port: PORT,
    auth: ${hasAuthEndpoints}
  });
});

// Auth routes (if enabled)
${authRoute}

// API routes
${collectionNames.map(c => `app.use('/api/${c}', ${c}Router);`).join('\n')}

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ API Error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(\`✅ API server running on http://localhost:\${PORT}\`);
  console.log(\`🔗 Health check: http://localhost:\${PORT}/health\`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
`;
}

function generateDbClient(projectId, backendConfig) {
  const collections = backendConfig.collections;

  return `const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase('http://localhost:8090');
const PROJECT_ID = process.env.PROJECT_ID || '${projectId}';

console.log('🔗 Connecting to PocketBase...');
console.log(\`📦 Project ID: \${PROJECT_ID}\`);

// Helper: Get collection name with project prefix
function getCollectionName(name) {
  return \`\${PROJECT_ID}_\${name}\`;
}

${collections.map(collection => {
  const collectionName = typeof collection === 'string' ? collection : collection.name;
  return `
// ${collectionName.toUpperCase()} CRUD Operations

async function get${capitalize(collectionName)}() {
  try {
    const records = await pb.collection(getCollectionName('${collectionName}')).getFullList({
      sort: '-created'
    });
    return records;
  } catch (error) {
    console.error('Error fetching ${collectionName}:', error);
    throw error;
  }
}

async function get${capitalize(collectionName)}ById(id) {
  try {
    const record = await pb.collection(getCollectionName('${collectionName}')).getOne(id);
    return record;
  } catch (error) {
    console.error('Error fetching ${collectionName} by ID:', error);
    throw error;
  }
}

async function create${capitalize(collectionName)}(data) {
  try {
    const record = await pb.collection(getCollectionName('${collectionName}')).create(data);
    return record;
  } catch (error) {
    console.error('Error creating ${collectionName}:', error);
    throw error;
  }
}

async function update${capitalize(collectionName)}(id, data) {
  try {
    const record = await pb.collection(getCollectionName('${collectionName}')).update(id, data);
    return record;
  } catch (error) {
    console.error('Error updating ${collectionName}:', error);
    throw error;
  }
}

async function delete${capitalize(collectionName)}(id) {
  try {
    await pb.collection(getCollectionName('${collectionName}')).delete(id);
    return { success: true };
  } catch (error) {
    console.error('Error deleting ${collectionName}:', error);
    throw error;
  }
}`;
}).join('\n')}

module.exports = {
  ${collections.map(c => {
    const collectionName = typeof c === 'string' ? c : c.name;
    return `get${capitalize(collectionName)},
  get${capitalize(collectionName)}ById,
  create${capitalize(collectionName)},
  update${capitalize(collectionName)},
  delete${capitalize(collectionName)}`;
  }).join(',\n  ')}
};
`;
}

function generateRouteFile(collection) {
  const capitalized = capitalize(collection);

  return `const express = require('express');
const {
  get${capitalized},
  get${capitalized}ById,
  create${capitalized},
  update${capitalized},
  delete${capitalized}
} = require('../db');

const router = express.Router();

// GET /api/${collection} - Fetch all
router.get('/', async (req, res, next) => {
  try {
    const items = await get${capitalized}();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// GET /api/${collection}/:id - Fetch one
router.get('/:id', async (req, res, next) => {
  try {
    const item = await get${capitalized}ById(req.params.id);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// POST /api/${collection} - Create
router.post('/', async (req, res, next) => {
  try {
    const item = await create${capitalized}(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

// PUT /api/${collection}/:id - Update
router.put('/:id', async (req, res, next) => {
  try {
    const item = await update${capitalized}(req.params.id, req.body);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/${collection}/:id - Delete
router.delete('/:id', async (req, res, next) => {
  try {
    await delete${capitalized}(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
`;
}

function generateApiPackageJson(projectId, hasAuth = false) {
  const dependencies = {
    express: '^4.18.2',
    cors: '^2.8.5',
    pocketbase: '^0.21.3'
  };

  // Add auth dependencies if needed
  if (hasAuth) {
    dependencies.bcryptjs = '^2.4.3';
    dependencies.jsonwebtoken = '^9.0.2';
  }

  return JSON.stringify({
    name: `${projectId}-api`,
    version: '1.0.0',
    description: 'Express API server',
    main: 'server.js',
    scripts: {
      start: 'node server.js',
      dev: 'nodemon server.js'
    },
    dependencies,
    devDependencies: {
      nodemon: '^3.0.1'
    }
  }, null, 2);
}

/**
 * Generate complete Next.js scaffold
 * Returns array of files to write
 */
function generateScaffold(projectId, backendConfig = null) {
  const files = [
    { path: 'package.json', content: generatePackageJson(projectId) },
    { path: 'next.config.js', content: generateNextConfig(projectId) },
    { path: 'tsconfig.json', content: generateTsConfig() },
    { path: 'tailwind.config.js', content: generateTailwindConfig() },
    { path: 'postcss.config.js', content: generatePostCssConfig() },
    { path: '.gitignore', content: generateGitignore() },
    { path: 'next-env.d.ts', content: generateNextEnv() },
    { path: 'src/app/globals.css', content: generateGlobalsCss() }
  ];

  // Add backend files if config provided
  if (backendConfig?.apiEndpoints && backendConfig.apiEndpoints.length > 0) {
    console.log(`[Scaffold] 🔧 Generating backend files for ${projectId}...`);
    console.log(`[Scaffold]   Collections: ${backendConfig.collections.join(', ')}`);
    console.log(`[Scaffold]   Endpoints: ${backendConfig.apiEndpoints.length}`);

    // Check if auth endpoints exist
    const hasAuthEndpoints = backendConfig.apiEndpoints.some(ep => ep.path.includes('/api/auth'));
    console.log(`[Scaffold]   Auth endpoints: ${hasAuthEndpoints ? 'YES' : 'NO'}`);

    // Add Express server
    files.push({
      path: 'api/server.js',
      content: generateExpressServer(projectId, backendConfig, hasAuthEndpoints)
    });

    // Add database client
    files.push({
      path: 'api/db.js',
      content: generateDbClient(projectId, backendConfig)
    });

    // Add auth routes if needed
    if (hasAuthEndpoints) {
      console.log(`[Scaffold] 🔐 Generating authentication routes...`);
      files.push({
        path: 'api/routes/auth.js',
        content: generateAuthRoutes(projectId)
      });
      files.push({
        path: 'api/middleware/auth.js',
        content: generateAuthMiddleware()
      });
    }

    // Add route files (one per collection, except users if auth is enabled)
    backendConfig.collections.forEach(collection => {
      const collectionName = typeof collection === 'string' ? collection : collection.name;
      // Skip users collection if auth is enabled (handled by auth routes)
      if (collectionName === 'users' && hasAuthEndpoints) {
        console.log(`[Scaffold]   Skipping 'users' routes (handled by auth)`);
        return;
      }
      files.push({
        path: `api/routes/${collectionName}.js`,
        content: generateRouteFile(collectionName)
      });
    });

    // Add package.json for API server
    files.push({
      path: 'api/package.json',
      content: generateApiPackageJson(projectId, hasAuthEndpoints)
    });

    console.log(`[Scaffold] ✅ Generated ${files.filter(f => f.path.startsWith('api/')).length} backend files`);
  }

  return files;
}

// Generate auth routes with JWT
function generateAuthRoutes(projectId) {
  return `const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase('http://localhost:8090');
const PROJECT_ID = '${projectId}';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper: Get collection name with project prefix
function getCollectionName(name) {
  return \`\${PROJECT_ID}_\${name}\`;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in PocketBase
    const user = await pb.collection(getCollectionName('users')).create({
      email,
      password: hashedPassword,
      passwordConfirm: hashedPassword,
      username: username || email.split('@')[0]
    });

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const users = await pb.collection(getCollectionName('users')).getFullList({
      filter: \`email = "\${email}"\`
    });

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message || 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // Client-side logout (clear token)
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await pb.collection(getCollectionName('users')).getOne(decoded.userId);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
`;
}

// Generate auth middleware
function generateAuthMiddleware() {
  return `const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
`;
}

module.exports = {
  generateScaffold,
  generatePackageJson,
  generateNextConfig,
  generateTsConfig,
  generateTailwindConfig,
  generatePostCssConfig,
  generateGlobalsCss,
  generateGitignore,
  generateNextEnv,
  generateEslintrc,
  generateAuthRoutes,
  generateAuthMiddleware
};
