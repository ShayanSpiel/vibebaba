/**
 * Enhanced File Operations (inspired by Bolt.new)
 *
 * Provides robust file management with:
 * - Recursive directory creation
 * - Path normalization and sanitization
 * - Graceful error handling (log but don't crash)
 * - Better validation and security checks
 */

export interface FileOperation {
  filePath: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
}

export interface FileOperationResult {
  success: boolean;
  filePath: string;
  error?: string;
  bytesWritten?: number;
}

export interface DirectoryOperation {
  path: string;
  recursive?: boolean;
}

export interface DirectoryOperationResult {
  success: boolean;
  path: string;
  error?: string;
}

/**
 * Normalize and sanitize file path
 * - Removes trailing slashes
 * - Converts backslashes to forward slashes
 * - Removes double slashes
 * - Trims whitespace
 */
export function normalizePath(path: string): string {
  return path
    .trim()
    .replace(/\\/g, '/') // Convert backslashes to forward slashes
    .replace(/\/+/g, '/') // Remove duplicate slashes
    .replace(/\/+$/g, '') // Remove trailing slashes
    .replace(/^\.\//, ''); // Remove leading ./
}

/**
 * Validate file path for security
 * Prevents directory traversal attacks
 */
export function validatePath(path: string): { valid: boolean; error?: string } {
  const normalized = normalizePath(path);

  // Check for directory traversal attempts
  if (normalized.includes('..')) {
    return { valid: false, error: 'Path contains directory traversal (..)' };
  }

  // Check for absolute paths (should be relative)
  if (normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) {
    return { valid: false, error: 'Absolute paths not allowed' };
  }

  // Check for empty path
  if (!normalized || normalized === '.') {
    return { valid: false, error: 'Empty or root path not allowed' };
  }

  // Check for invalid characters
  const invalidChars = /[<>:"|?*\x00-\x1f]/;
  if (invalidChars.test(normalized)) {
    return { valid: false, error: 'Path contains invalid characters' };
  }

  return { valid: true };
}

/**
 * Extract directory from file path
 */
export function getDirectory(filePath: string): string {
  const normalized = normalizePath(filePath);
  const lastSlash = normalized.lastIndexOf('/');

  if (lastSlash === -1) {
    return '.';
  }

  return normalized.substring(0, lastSlash) || '.';
}

/**
 * Extract filename from file path
 */
export function getFilename(filePath: string): string {
  const normalized = normalizePath(filePath);
  const lastSlash = normalized.lastIndexOf('/');

  if (lastSlash === -1) {
    return normalized;
  }

  return normalized.substring(lastSlash + 1);
}

/**
 * Extract file extension
 */
export function getExtension(filePath: string): string {
  const filename = getFilename(filePath);
  const lastDot = filename.lastIndexOf('.');

  if (lastDot === -1 || lastDot === 0) {
    return '';
  }

  return filename.substring(lastDot + 1).toLowerCase();
}

/**
 * Check if path represents a directory
 */
export function isDirectory(path: string): boolean {
  const normalized = normalizePath(path);
  const filename = getFilename(normalized);

  // No extension = directory
  return !filename.includes('.');
}

/**
 * Validate file content for security
 */
export function validateContent(
  content: string,
  filePath: string,
  options: { strict?: boolean } = {}
): { valid: boolean; error?: string } {
  // Check content size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (content.length > maxSize) {
    return { valid: false, error: `Content too large (max ${maxSize} bytes)` };
  }

  // Check for potentially dangerous content in HTML/JS files
  const ext = getExtension(filePath);
  const webFiles = ['html', 'htm', 'js', 'jsx', 'ts', 'tsx'];

  if (webFiles.includes(ext)) {
    // Check for suspicious patterns (basic security)
    const dangerousPatterns = [
      /<script[^>]*>[\s\S]*?eval\s*\(/i,
      /document\.write\s*\(/i,
      /innerHTML\s*=.*<script/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        const message = `Potentially dangerous pattern detected in ${filePath}`;

        // Respect strict mode
        if (options.strict) {
          return { valid: false, error: message };
        } else {
          console.warn(`[FileOps] ${message} (allowed in non-strict mode)`);
        }
      }
    }
  }

  return { valid: true };
}

/**
 * Virtual file system for browser environment
 * Mimics Bolt's file operations for localStorage-based projects
 */
export class VirtualFileSystem {
  private projectId: string;
  private storageKey: string;

  constructor(projectId: string) {
    this.projectId = projectId;
    this.storageKey = `project_${projectId}`;
  }

  /**
   * Write file to virtual file system
   * Includes recursive directory creation and validation
   */
  async writeFile(operation: FileOperation): Promise<FileOperationResult> {
    const { filePath, content, encoding = 'utf-8' } = operation;

    try {
      // Normalize path
      const normalized = normalizePath(filePath);

      // Validate path
      const pathValidation = validatePath(normalized);
      if (!pathValidation.valid) {
        console.error(`[FileOps] Invalid path: ${pathValidation.error}`);
        return {
          success: false,
          filePath: normalized,
          error: pathValidation.error,
        };
      }

      // Validate content
      const contentValidation = validateContent(content, normalized);
      if (!contentValidation.valid) {
        console.error(`[FileOps] Invalid content: ${contentValidation.error}`);
        return {
          success: false,
          filePath: normalized,
          error: contentValidation.error,
        };
      }

      // Get current project data
      const projectData = this.getProjectData();

      // Ensure directories exist (virtual)
      const directory = getDirectory(normalized);
      if (directory !== '.') {
        await this.ensureDirectory({ path: directory, recursive: true });
      }

      // Store file
      if (!projectData.files) {
        projectData.files = {};
      }

      projectData.files[normalized] = {
        content,
        encoding,
        updatedAt: Date.now(),
      };

      // Save to localStorage
      this.saveProjectData(projectData);

      console.log(`[FileOps] File written: ${normalized} (${content.length} bytes)`);

      return {
        success: true,
        filePath: normalized,
        bytesWritten: content.length,
      };
    } catch (error: any) {
      console.error(`[FileOps] Failed to write file ${filePath}:`, error);

      // Graceful error handling - log but don't crash
      return {
        success: false,
        filePath,
        error: error.message,
      };
    }
  }

  /**
   * Read file from virtual file system
   */
  async readFile(filePath: string): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const normalized = normalizePath(filePath);
      const projectData = this.getProjectData();

      if (!projectData.files || !projectData.files[normalized]) {
        return {
          success: false,
          error: `File not found: ${normalized}`,
        };
      }

      return {
        success: true,
        content: projectData.files[normalized].content,
      };
    } catch (error: any) {
      console.error(`[FileOps] Failed to read file ${filePath}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Ensure directory exists (virtual)
   * Mimics mkdir -p behavior
   */
  async ensureDirectory(operation: DirectoryOperation): Promise<DirectoryOperationResult> {
    const { path, recursive = true } = operation;

    try {
      const normalized = normalizePath(path);

      // Validate path
      const pathValidation = validatePath(normalized + '/dummy.txt');
      if (!pathValidation.valid) {
        return {
          success: false,
          path: normalized,
          error: pathValidation.error,
        };
      }

      // Get current project data
      const projectData = this.getProjectData();

      if (!projectData.directories) {
        projectData.directories = [];
      }

      if (recursive) {
        // Create all parent directories
        const parts = normalized.split('/');
        let currentPath = '';

        for (const part of parts) {
          if (!part) continue;

          currentPath = currentPath ? `${currentPath}/${part}` : part;

          if (!projectData.directories.includes(currentPath)) {
            projectData.directories.push(currentPath);
            console.log(`[FileOps] Created directory: ${currentPath}`);
          }
        }
      } else {
        // Create only this directory
        if (!projectData.directories.includes(normalized)) {
          projectData.directories.push(normalized);
          console.log(`[FileOps] Created directory: ${normalized}`);
        }
      }

      // Save to localStorage
      this.saveProjectData(projectData);

      return {
        success: true,
        path: normalized,
      };
    } catch (error: any) {
      console.error(`[FileOps] Failed to create directory ${path}:`, error);

      // Graceful error handling
      return {
        success: false,
        path,
        error: error.message,
      };
    }
  }

  /**
   * List files in directory
   */
  async listFiles(directory: string = '.'): Promise<{ success: boolean; files?: string[]; error?: string }> {
    try {
      const normalized = directory === '.' ? '' : normalizePath(directory);
      const projectData = this.getProjectData();

      if (!projectData.files) {
        return { success: true, files: [] };
      }

      const files = Object.keys(projectData.files).filter(filePath => {
        if (!normalized) return true; // Root directory
        return filePath.startsWith(normalized + '/');
      });

      return {
        success: true,
        files,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<FileOperationResult> {
    try {
      const normalized = normalizePath(filePath);
      const projectData = this.getProjectData();

      if (!projectData.files || !projectData.files[normalized]) {
        return {
          success: false,
          filePath: normalized,
          error: 'File not found',
        };
      }

      delete projectData.files[normalized];
      this.saveProjectData(projectData);

      console.log(`[FileOps] File deleted: ${normalized}`);

      return {
        success: true,
        filePath: normalized,
      };
    } catch (error: any) {
      console.error(`[FileOps] Failed to delete file ${filePath}:`, error);
      return {
        success: false,
        filePath,
        error: error.message,
      };
    }
  }

  /**
   * Get project data from localStorage
   */
  private getProjectData(): any {
    if (typeof window === 'undefined') {
      return {}; // Server-side
    }

    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : {};
  }

  /**
   * Save project data to localStorage
   */
  private saveProjectData(data: any): void {
    if (typeof window === 'undefined') {
      return; // Server-side
    }

    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }
}

/**
 * Log file operation for audit trail
 */
export function logFileOperation(
  operation: { type: string; path: string; content?: string; reason?: string },
  success: boolean,
  error?: string
): void {
  const timestamp = new Date().toISOString();
  const status = success ? '✅' : '❌';
  const logPrefix = `[FileOp ${timestamp}]`;

  if (success) {
    console.log(`${logPrefix} ${status} ${operation.type.toUpperCase()}: ${operation.path}`);
    if (operation.reason) {
      console.log(`${logPrefix}    Reason: ${operation.reason}`);
    }
  } else {
    console.error(`${logPrefix} ${status} ${operation.type.toUpperCase()} FAILED: ${operation.path}`);
    if (error) {
      console.error(`${logPrefix}    Error: ${error}`);
    }
    if (operation.reason) {
      console.error(`${logPrefix}    Reason: ${operation.reason}`);
    }
  }
}

/**
 * Create a virtual file system instance
 */
export function createVirtualFileSystem(projectId: string): VirtualFileSystem {
  return new VirtualFileSystem(projectId);
}
