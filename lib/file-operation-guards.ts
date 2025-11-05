/**
 * FILE OPERATION SAFETY GUARDS
 *
 * Provides validation and safety checks for file operations during debugging
 * Prevents accidental deletion of critical files or system files
 */

export interface FileOperation {
  type: 'create' | 'update' | 'delete' | 'rename' | 'move';
  path: string;
  newPath?: string; // For rename/move operations
  content?: string; // For create/update operations
  reason: string;
}

export interface ValidationResult {
  allowed: boolean;
  reason: string;
  warning?: string;
}

/**
 * Critical files that should NEVER be deleted or modified
 */
const PROTECTED_FILES = [
  'package.json',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'tsconfig.json',
  'next.config.js',
  'next.config.mjs',
  'tailwind.config.js',
  'tailwind.config.ts',
  'postcss.config.js',
  '.env',
  '.env.local',
  '.gitignore',
  'README.md',
];

/**
 * Critical directories that should NEVER be deleted
 */
const PROTECTED_DIRECTORIES = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.vercel',
];

/**
 * Allowed file extensions for operations
 */
const ALLOWED_EXTENSIONS = [
  '.html',
  '.css',
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.md',
  '.txt',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
];

/**
 * Project root files that can be created/modified (limited set)
 */
const ALLOWED_ROOT_FILES = [
  'index.html',
  'about.html',
  'contact.html',
  'services.html',
  'portfolio.html',
  'blog.html',
  'style.css',
  'styles.css',
  'script.js',
  'app.js',
  'main.js',
];

/**
 * Validates if a file operation is safe to perform
 */
export function validateFileOperation(operation: FileOperation): ValidationResult {
  const { type, path, newPath } = operation;

  // Extract filename and check against protected files
  const filename = path.split('/').pop() || '';
  const extension = filename.includes('.') ? '.' + filename.split('.').pop() : '';

  // Check if file is protected
  if (PROTECTED_FILES.includes(filename)) {
    return {
      allowed: false,
      reason: `Cannot ${type} protected file: ${filename}. This file is critical to the project.`,
    };
  }

  // Check if directory is protected
  for (const protectedDir of PROTECTED_DIRECTORIES) {
    if (path.includes(protectedDir + '/') || path.startsWith(protectedDir)) {
      return {
        allowed: false,
        reason: `Cannot ${type} files in protected directory: ${protectedDir}`,
      };
    }
  }

  // Validate based on operation type
  switch (type) {
    case 'create':
      return validateCreate(path, extension, filename);

    case 'delete':
      return validateDelete(path, filename);

    case 'rename':
    case 'move':
      if (!newPath) {
        return { allowed: false, reason: 'New path is required for rename/move operations' };
      }
      return validateRenameOrMove(path, newPath, filename);

    default:
      return { allowed: false, reason: `Unknown operation type: ${type}` };
  }
}

/**
 * Validates file creation
 */
function validateCreate(path: string, extension: string, filename: string): ValidationResult {
  // Check file extension
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      allowed: false,
      reason: `File extension ${extension} is not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  // If creating in root, must be in allowed list
  if (!path.includes('/') && !ALLOWED_ROOT_FILES.includes(filename)) {
    return {
      allowed: false,
      reason: `Cannot create ${filename} in project root. Allowed root files: ${ALLOWED_ROOT_FILES.join(', ')}`,
      warning: 'Consider creating files in subdirectories (e.g., pages/, components/, public/)',
    };
  }

  // Warn about potential duplicates
  if (filename === 'index.html' || filename === 'index.tsx' || filename === 'index.ts') {
    return {
      allowed: true,
      reason: 'File creation allowed',
      warning: 'Creating index file - ensure this does not conflict with existing entry points',
    };
  }

  return { allowed: true, reason: 'File creation allowed' };
}

/**
 * Validates file deletion
 */
function validateDelete(path: string, filename: string): ValidationResult {
  // Extra protection for critical files
  const criticalPatterns = [
    /index\.html$/,
    /package\.json$/,
    /tsconfig\.json$/,
    /next\.config\./,
    /tailwind\.config\./,
    /postcss\.config\./,
    /\.env/,
    // Next.js App Router critical files
    /^app\/layout\.(tsx|ts|jsx|js)$/,
    /^app\/page\.(tsx|ts|jsx|js)$/,
    /^app\/globals\.css$/,
    /^lib\/types\.(tsx|ts|jsx|js)$/,
    /^lib\/db\.(tsx|ts|jsx|js)$/,
    // Protect all app router files (pages, API routes, layouts)
    /^app\/.*\/page\.(tsx|ts|jsx|js)$/,
    /^app\/.*\/layout\.(tsx|ts|jsx|js)$/,
    /^app\/api\/.*\/route\.(tsx|ts|jsx|js)$/,
  ];

  for (const pattern of criticalPatterns) {
    if (pattern.test(path)) {
      return {
        allowed: false,
        reason: `Cannot delete critical Next.js file: ${filename}. This may break the application.`,
      };
    }
  }

  // Warn about deleting HTML entry points
  if (filename.endsWith('.html') && !path.includes('/')) {
    return {
      allowed: true,
      reason: 'Deletion allowed',
      warning: 'Deleting HTML file in root - ensure this is not a primary entry point',
    };
  }

  // Warn about deleting components
  if (path.startsWith('components/')) {
    return {
      allowed: true,
      reason: 'Deletion allowed',
      warning: 'Deleting component - ensure it is not used by pages or other components',
    };
  }

  // Warn about deleting hooks
  if (path.startsWith('hooks/')) {
    return {
      allowed: true,
      reason: 'Deletion allowed',
      warning: 'Deleting hook - ensure it is not used by components or pages',
    };
  }

  return { allowed: true, reason: 'Deletion allowed' };
}

/**
 * Validates file rename or move
 */
function validateRenameOrMove(
  oldPath: string,
  newPath: string,
  filename: string
): ValidationResult {
  // Check if trying to rename/move protected file
  if (PROTECTED_FILES.includes(filename)) {
    return {
      allowed: false,
      reason: `Cannot rename/move protected file: ${filename}`,
    };
  }

  // Check if moving to protected directory
  for (const protectedDir of PROTECTED_DIRECTORIES) {
    if (newPath.includes(protectedDir + '/') || newPath.startsWith(protectedDir)) {
      return {
        allowed: false,
        reason: `Cannot move files into protected directory: ${protectedDir}`,
      };
    }
  }

  // Validate new filename extension
  const newFilename = newPath.split('/').pop() || '';
  const newExtension = newFilename.includes('.') ? '.' + newFilename.split('.').pop() : '';

  if (!ALLOWED_EXTENSIONS.includes(newExtension)) {
    return {
      allowed: false,
      reason: `Target extension ${newExtension} is not allowed`,
    };
  }

  return { allowed: true, reason: 'Rename/move allowed' };
}

/**
 * Validates a batch of file operations
 * Returns array of validation results
 */
export function validateFileOperations(operations: FileOperation[]): ValidationResult[] {
  return operations.map(validateFileOperation);
}

/**
 * Checks if all operations in a batch are allowed
 */
export function areAllOperationsAllowed(operations: FileOperation[]): boolean {
  const results = validateFileOperations(operations);
  return results.every((result) => result.allowed);
}

/**
 * Filters operations to only include allowed ones
 * Returns { allowed, rejected } operations
 */
export function filterOperations(operations: FileOperation[]): {
  allowed: FileOperation[];
  rejected: Array<{ operation: FileOperation; reason: string }>;
} {
  const allowed: FileOperation[] = [];
  const rejected: Array<{ operation: FileOperation; reason: string }> = [];

  operations.forEach((operation) => {
    const validation = validateFileOperation(operation);
    if (validation.allowed) {
      allowed.push(operation);
    } else {
      rejected.push({ operation, reason: validation.reason });
    }
  });

  return { allowed, rejected };
}

/**
 * Logs file operation for audit trail
 */
export function logFileOperation(operation: FileOperation, success: boolean, error?: string) {
  const timestamp = new Date().toISOString();
  const status = success ? '✅ SUCCESS' : '❌ FAILED';

  console.log(`[FILE-OP] ${timestamp} ${status} ${operation.type.toUpperCase()}: ${operation.path}`);
  if (operation.reason) {
    console.log(`[FILE-OP]   Reason: ${operation.reason}`);
  }
  if (error) {
    console.log(`[FILE-OP]   Error: ${error}`);
  }
}
