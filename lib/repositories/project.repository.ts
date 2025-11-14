// lib/repositories/project.repository.ts
import { BaseRepository } from './base.repository';
import { Collections, config } from '@/lib/config';

export interface ProjectData {
  id: string;
  userId: string;
  name: string;
  description: string;
  stage: 'planning' | 'building' | 'completed' | 'editing';
  plan?: string;
  planMessages?: string;
  files?: any[];
  backendConfig?: any;
  context?: any;
  created?: string;
  updated?: string;
}

class ProjectRepository extends BaseRepository<ProjectData> {
  constructor() {
    super(Collections.PROJECTS, config.CACHE_TTL_PROJECT);
  }

  /**
   * Get projects by user ID
   */
  async findByUserId(userId: string): Promise<ProjectData[]> {
    return this.find(`userId="${userId}"`, { sort: '-created' });
  }

  /**
   * Get projects by stage
   */
  async findByStage(stage: string, userId?: string): Promise<ProjectData[]> {
    const filter = userId
      ? `stage="${stage}" && userId="${userId}"`
      : `stage="${stage}"`;
    return this.find(filter);
  }

  /**
   * Update project with validation
   */
  async updateProject(id: string, updates: Partial<ProjectData>): Promise<ProjectData> {
    // Validate updates before saving
    if (updates.description && updates.description.length > 500) {
      throw new Error('Project description too long (max 500 characters)');
    }

    // Auto-set name from description
    if (updates.description) {
      updates.name = updates.description.substring(0, 100);
    }

    return this.update(id, updates);
  }
}

// Export singleton
export const projectRepository = new ProjectRepository();
