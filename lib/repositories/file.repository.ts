// lib/repositories/file.repository.ts

import { Collections, config, validateFileSize } from '@/lib/config';
import { BaseRepository } from './base.repository';

export interface ProjectFile {
  id: string;
  projectId: string;
  path: string;
  content: string;
  language?: string;
  created?: string;
  updated?: string;
}

class FileRepository extends BaseRepository<ProjectFile> {
  constructor() {
    super(Collections.PROJECT_FILES, config.CACHE_TTL_FILES);
  }

  /**
   * Get files by project ID
   */
  async findByProjectId(projectId: string): Promise<ProjectFile[]> {
    return this.find(`projectId="${projectId}"`);
  }

  /**
   * Create file with validation
   */
  async createFile(data: Partial<ProjectFile>): Promise<ProjectFile> {
    // Validate file size
    if (data.content && !validateFileSize(data.content.length)) {
      throw new Error(`File too large (max ${config.MAX_FILE_SIZE / 1_000_000}MB)`);
    }

    // Validate file path
    if (data.path && (data.path.includes('..') || data.path.startsWith('/'))) {
      throw new Error('Invalid file path (no path traversal allowed)');
    }

    return this.create(data);
  }

  /**
   * Update file content
   */
  async updateFileContent(id: string, content: string): Promise<ProjectFile> {
    if (!validateFileSize(content.length)) {
      throw new Error(`File too large (max ${config.MAX_FILE_SIZE / 1_000_000}MB)`);
    }

    return this.update(id, { content } as any);
  }

  /**
   * Delete all files for project
   */
  async deleteByProjectId(projectId: string): Promise<void> {
    const files = await this.findByProjectId(projectId);
    await Promise.all(files.map((file) => this.delete(file.id)));
  }
}

// Export singleton
export const fileRepository = new FileRepository();
