// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEPENDENCY ANALYZER
// Scans generated code and detects missing npm dependencies
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const fs = require('fs-extra');
const path = require('path');

/**
 * Known package name mappings for common imports
 * Some packages also require @types packages for TypeScript
 */
const IMPORT_TO_PACKAGE_MAP = {
  'react-big-calendar': {
    package: 'react-big-calendar',
    version: '^1.8.5',
    types: '@types/react-big-calendar@^1.8.0'
  },
  'moment': { package: 'moment', version: '^2.29.4' },
  'date-fns': { package: 'date-fns', version: '^2.30.0' },
  'axios': { package: 'axios', version: '^1.6.0' },
  'lodash': { package: 'lodash', version: '^4.17.21' },
  'recharts': { package: 'recharts', version: '^2.10.0' },
  'framer-motion': { package: 'framer-motion', version: '^10.16.0' },
  'react-icons': { package: 'react-icons', version: '^4.12.0' },
  'react-hook-form': { package: 'react-hook-form', version: '^7.48.0' },
  'zod': { package: 'zod', version: '^3.22.0' },
  '@tanstack/react-query': { package: '@tanstack/react-query', version: '^5.8.0' },
  'swr': { package: 'swr', version: '^2.2.4' },
  'react-toastify': { package: 'react-toastify', version: '^9.1.3' },
  'react-hot-toast': { package: 'react-hot-toast', version: '^2.4.1' },
  'sonner': { package: 'sonner', version: '^1.2.0' },
  'clsx': { package: 'clsx', version: '^2.0.0' },
  'class-variance-authority': { package: 'class-variance-authority', version: '^0.7.0' },
  'tailwind-merge': { package: 'tailwind-merge', version: '^2.0.0' },
  '@radix-ui/react-dialog': { package: '@radix-ui/react-dialog', version: '^1.0.5' },
  '@radix-ui/react-dropdown-menu': { package: '@radix-ui/react-dropdown-menu', version: '^2.0.6' },
  '@radix-ui/react-select': { package: '@radix-ui/react-select', version: '^2.0.0' },
  '@radix-ui/react-tabs': { package: '@radix-ui/react-tabs', version: '^1.0.4' },
  'react-datepicker': { package: 'react-datepicker', version: '^4.21.0' },
  'chart.js': { package: 'chart.js', version: '^4.4.0' },
  'react-chartjs-2': { package: 'react-chartjs-2', version: '^5.2.0' },
  'lucide-react': { package: 'lucide-react', version: '^0.292.0' },
  'react-markdown': { package: 'react-markdown', version: '^9.0.1' },
  'gray-matter': { package: 'gray-matter', version: '^4.0.3' },
  'uuid': { package: 'uuid', version: '^9.0.1' },
  'nanoid': { package: 'nanoid', version: '^5.0.3' },
  'dayjs': { package: 'dayjs', version: '^1.11.10' },
  'antd': { package: 'antd', version: '^5.12.0' },
  '@ant-design/icons': { package: '@ant-design/icons', version: '^5.2.6' },
  '@mui/material': { package: '@mui/material', version: '^5.15.0' },
  '@mui/icons-material': { package: '@mui/icons-material', version: '^5.15.0' },
  '@emotion/react': { package: '@emotion/react', version: '^11.11.0' },
  '@emotion/styled': { package: '@emotion/styled', version: '^11.11.0' },
  '@chakra-ui/react': { package: '@chakra-ui/react', version: '^2.8.0' },
  '@chakra-ui/icons': { package: '@chakra-ui/icons', version: '^2.1.0' },
  'pocketbase': { package: 'pocketbase', version: '^0.21.0' },
  // Tiptap - Rich Text Editor
  '@tiptap/react': { package: '@tiptap/react', version: '^2.1.0' },
  '@tiptap/starter-kit': { package: '@tiptap/starter-kit', version: '^2.1.0' },
  '@tiptap/core': { package: '@tiptap/core', version: '^2.1.0' },
  '@tiptap/pm': { package: '@tiptap/pm', version: '^2.1.0' },
  '@tiptap/extension-placeholder': { package: '@tiptap/extension-placeholder', version: '^2.1.0' },
  '@tiptap/extension-typography': { package: '@tiptap/extension-typography', version: '^2.1.0' },
  '@tiptap/extension-underline': { package: '@tiptap/extension-underline', version: '^2.1.0' },
  '@tiptap/extension-image': { package: '@tiptap/extension-image', version: '^2.1.0' },
  '@tiptap/extension-link': { package: '@tiptap/extension-link', version: '^2.1.0' },
  '@tiptap/extension-text-align': { package: '@tiptap/extension-text-align', version: '^2.1.0' },
  '@tiptap/extension-code-block': { package: '@tiptap/extension-code-block', version: '^2.1.0' },
  '@tiptap/extension-youtube': { package: '@tiptap/extension-youtube', version: '^2.1.0' },
  '@tiptap/extension-task-list': { package: '@tiptap/extension-task-list', version: '^2.1.0' },
  '@tiptap/extension-task-item': { package: '@tiptap/extension-task-item', version: '^2.1.0' },
  // Backend packages
  'jsonwebtoken': { package: 'jsonwebtoken', version: '^9.0.2' },
  'bcryptjs': { package: 'bcryptjs', version: '^2.4.3' },
  'express': { package: 'express', version: '^4.18.2' },
  'cors': { package: 'cors', version: '^2.8.5' }
};

/**
 * Built-in Node.js and Next.js modules that don't need npm packages
 */
const BUILT_IN_MODULES = new Set([
  'react',
  'react-dom',
  'next',
  'path',
  'fs',
  'http',
  'https',
  'crypto',
  'stream',
  'util',
  'events',
  'buffer',
  'child_process',
  'os',
  'url',
  'querystring'
]);

/**
 * Extract import statements from TypeScript/JavaScript code
 * @param {string} content - File content
 * @returns {string[]} - Array of imported package names
 */
function extractImports(content) {
  const imports = new Set();

  // Match: import ... from 'package'
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*)?)+\s+from\s+['"]([^'"]+)['"]/g;

  // Match: require('package')
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  let match;

  // Extract ES6 imports
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    // Skip relative imports (./file, ../file) and path aliases (@/, ~/path)
    if (importPath.startsWith('.') || importPath.startsWith('/') || importPath.startsWith('@/') || importPath.startsWith('~/')) {
      continue;
    }

    // Extract base package name (e.g., '@org/package' or 'package')
    const packageName = importPath.startsWith('@')
      ? importPath.split('/').slice(0, 2).join('/')
      : importPath.split('/')[0];

    if (!BUILT_IN_MODULES.has(packageName)) {
      imports.add(importPath);
    }
  }

  // Extract CommonJS requires
  while ((match = requireRegex.exec(content)) !== null) {
    const importPath = match[1];
    // Skip relative imports (./file, ../file) and path aliases (@/, ~/path)
    if (importPath.startsWith('.') || importPath.startsWith('/') || importPath.startsWith('@/') || importPath.startsWith('~/')) {
      continue;
    }

    const packageName = importPath.startsWith('@')
      ? importPath.split('/').slice(0, 2).join('/')
      : importPath.split('/')[0];

    if (!BUILT_IN_MODULES.has(packageName)) {
      imports.add(importPath);
    }
  }

  return Array.from(imports);
}

/**
 * Recursively scan directory for .ts, .tsx, .js, .jsx files
 * @param {string} dir - Directory path
 * @param {string[]} fileList - Accumulated file list
 * @returns {Promise<string[]>} - Array of file paths
 */
async function getCodeFiles(dir, fileList = []) {
  const files = await fs.readdir(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, out
      if (!['node_modules', '.next', 'out', '.git'].includes(file)) {
        await getCodeFiles(filePath, fileList);
      }
    } else if (/\.(tsx?|jsx?)$/.test(file)) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * Analyze project and detect missing dependencies
 * @param {string} projectPath - Path to project directory
 * @returns {Promise<{missing: Object, found: string[]}>}
 */
async function analyzeDependencies(projectPath) {
  console.log('[DependencyAnalyzer] Scanning project for imports...');

  // Get all code files
  const codeFiles = await getCodeFiles(projectPath);
  console.log(`[DependencyAnalyzer] Found ${codeFiles.length} code files`);

  // Extract all imports
  const allImports = new Set();
  for (const filePath of codeFiles) {
    const content = await fs.readFile(filePath, 'utf8');
    const fileImports = extractImports(content);
    fileImports.forEach(imp => allImports.add(imp));
  }

  console.log(`[DependencyAnalyzer] Found ${allImports.size} unique imports`);

  // Read current package.json
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);
  const existingDeps = {
    ...packageJson.dependencies || {},
    ...packageJson.devDependencies || {}
  };

  // Check which imports are missing
  const missingDeps = {};
  const foundImports = [];

  for (const importPath of allImports) {
    const packageName = importPath.startsWith('@')
      ? importPath.split('/').slice(0, 2).join('/')
      : importPath.split('/')[0];

    // Check if already in package.json
    if (existingDeps[packageName]) {
      foundImports.push(packageName);
      continue;
    }

    // Check if we have a known version for this package
    if (IMPORT_TO_PACKAGE_MAP[importPath] || IMPORT_TO_PACKAGE_MAP[packageName]) {
      const pkgInfo = IMPORT_TO_PACKAGE_MAP[importPath] || IMPORT_TO_PACKAGE_MAP[packageName];

      // Handle string or object format
      if (typeof pkgInfo === 'string') {
        missingDeps[packageName] = pkgInfo;
        console.log(`[DependencyAnalyzer] ⚠️  Missing: ${packageName}@${pkgInfo}`);
      } else {
        missingDeps[pkgInfo.package] = pkgInfo.version;
        console.log(`[DependencyAnalyzer] ⚠️  Missing: ${pkgInfo.package}@${pkgInfo.version}`);

        // Add type definitions if specified
        if (pkgInfo.types) {
          // Handle scoped packages like @types/react-big-calendar@^1.8.0
          const lastAtIndex = pkgInfo.types.lastIndexOf('@');
          const typesPackage = pkgInfo.types.substring(0, lastAtIndex);
          const typesVersion = pkgInfo.types.substring(lastAtIndex + 1);

          if (!existingDeps[typesPackage]) {
            missingDeps[typesPackage] = typesVersion;
            console.log(`[DependencyAnalyzer] ⚠️  Missing types: ${typesPackage}@${typesVersion}`);
          }
        }
      }
    } else {
      // Unknown package - use latest
      missingDeps[packageName] = 'latest';
      console.log(`[DependencyAnalyzer] ⚠️  Missing (unknown version): ${packageName}@latest`);
    }
  }

  return { missing: missingDeps, found: foundImports };
}

/**
 * Add missing dependencies to package.json
 * @param {string} projectPath - Path to project directory
 * @param {Object} missingDeps - Object with package names and versions
 * @returns {Promise<void>}
 */
async function addMissingDependencies(projectPath, missingDeps) {
  if (Object.keys(missingDeps).length === 0) {
    console.log('[DependencyAnalyzer] ✅ No missing dependencies');
    return;
  }

  console.log('[DependencyAnalyzer] Adding missing dependencies to package.json...');

  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);

  // Add to dependencies
  packageJson.dependencies = packageJson.dependencies || {};
  Object.assign(packageJson.dependencies, missingDeps);

  // Write back
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

  console.log(`[DependencyAnalyzer] ✅ Added ${Object.keys(missingDeps).length} dependencies`);
  Object.entries(missingDeps).forEach(([pkg, version]) => {
    console.log(`  + ${pkg}@${version}`);
  });
}

/**
 * Extract local file imports (relative and alias imports)
 * @param {string} content - File content
 * @returns {string[]} - Array of local import paths
 */
function extractLocalImports(content) {
  const imports = new Set();

  // Match: import ... from './file' or '../file' or '@/path/file'
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*)?)+\s+from\s+['"]([^'"]+)['"]/g;

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    // Only capture relative imports and path aliases
    if (importPath.startsWith('.') || importPath.startsWith('@/') || importPath.startsWith('~/')) {
      imports.add(importPath);
    }
  }

  return Array.from(imports);
}

/**
 * Validate that all local imports point to existing files
 * @param {string} projectPath - Path to project directory
 * @returns {Promise<string[]>} - Array of missing local imports
 */
async function validateLocalImports(projectPath) {
  console.log('[DependencyAnalyzer] Validating local file imports...');

  const codeFiles = await getCodeFiles(projectPath);
  const missingImports = [];

  for (const filePath of codeFiles) {
    const content = await fs.readFile(filePath, 'utf8');
    const localImports = extractLocalImports(content);
    const fileDir = path.dirname(filePath);

    for (const importPath of localImports) {
      let resolvedPath;

      if (importPath.startsWith('.')) {
        // Relative import: ./file or ../file
        resolvedPath = path.resolve(fileDir, importPath);
      } else if (importPath.startsWith('@/')) {
        // Alias import: @/path/file (resolve to src/)
        const relativePath = importPath.replace('@/', '');
        resolvedPath = path.join(projectPath, 'src', relativePath);
      } else if (importPath.startsWith('~/')) {
        // Alias import: ~/path/file (resolve to root)
        const relativePath = importPath.replace('~/', '');
        resolvedPath = path.join(projectPath, relativePath);
      }

      // Check if file exists (try with extensions)
      const extensions = ['', '.ts', '.tsx', '.js', '.jsx'];
      let exists = false;

      for (const ext of extensions) {
        const testPath = resolvedPath + ext;
        if (await fs.pathExists(testPath)) {
          exists = true;
          break;
        }
        // Also check index files
        const indexPath = path.join(resolvedPath, `index${ext}`);
        if (await fs.pathExists(indexPath)) {
          exists = true;
          break;
        }
      }

      if (!exists) {
        const relativeFilePath = path.relative(projectPath, filePath);
        missingImports.push({
          file: relativeFilePath,
          import: importPath,
          resolvedPath: path.relative(projectPath, resolvedPath)
        });
      }
    }
  }

  return missingImports;
}

/**
 * Main function: Analyze and fix missing dependencies
 * @param {string} projectPath - Path to project directory
 * @returns {Promise<{fixed: boolean, addedPackages: Object, missingLocalImports: Array}>}
 */
async function analyzeAndFix(projectPath) {
  try {
    const { missing, found } = await analyzeDependencies(projectPath);

    // Also check for missing local imports
    const missingLocalImports = await validateLocalImports(projectPath);

    if (missingLocalImports.length > 0) {
      console.log(`[DependencyAnalyzer] ⚠️  Found ${missingLocalImports.length} missing local imports:`);
      missingLocalImports.slice(0, 5).forEach(({ file, import: imp }) => {
        console.log(`  ${file}: import '${imp}' (file not found)`);
      });
    }

    if (Object.keys(missing).length > 0) {
      await addMissingDependencies(projectPath, missing);
      return {
        fixed: true,
        addedPackages: missing,
        missingLocalImports
      };
    }

    return {
      fixed: false,
      addedPackages: {},
      missingLocalImports
    };
  } catch (error) {
    console.error('[DependencyAnalyzer] ❌ Error:', error.message);
    throw error;
  }
}

module.exports = {
  analyzeDependencies,
  addMissingDependencies,
  analyzeAndFix,
  extractImports
};
