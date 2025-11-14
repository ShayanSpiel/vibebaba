// lib/memory/unified-memory.ts

import { memoryRepository } from '@/lib/repositories/memory.repository';
import { log } from '@/lib/logger';

export interface ProjectMemory {
  projectId: string;
  messages: any[];
  projectConfig: any;
  workflowMetadata: any;
  entities: any[];
  summary: string;
  updatedAt: string;
}

class UnifiedMemoryService {
  /**
   * Get project memory (always from PocketBase)
   */
  async getProjectMemory(projectId: string): Promise<ProjectMemory> {
    try {
      const record = await memoryRepository.getOrCreate(projectId);

      return {
        projectId: record.projectId,
        messages: JSON.parse(record.messages || '[]'),
        projectConfig: JSON.parse(record.projectConfig || '{}'),
        workflowMetadata: JSON.parse(record.workflowMetadata || '{}'),
        entities: JSON.parse(record.entities || '[]'),
        summary: record.summary || '',
        updatedAt: record.updated || new Date().toISOString(),
      };
    } catch (error) {
      log.error('Failed to get project memory', { projectId }, error as Error);
      throw error;
    }
  }

  /**
   * Update project config
   */
  async updateProjectConfig(projectId: string, config: any): Promise<void> {
    try {
      await memoryRepository.updateProjectConfig(projectId, config);
      log.debug('Updated project config', { projectId });
    } catch (error) {
      log.error('Failed to update project config', { projectId }, error as Error);
      throw error;
    }
  }

  /**
   * Add message to conversation
   */
  async addMessage(projectId: string, message: any): Promise<void> {
    try {
      await memoryRepository.addMessage(projectId, message);
      log.debug('Added message to memory', { projectId });
    } catch (error) {
      log.error('Failed to add message', { projectId }, error as Error);
      throw error;
    }
  }

  /**
   * Update workflow metadata
   */
  async updateWorkflowMetadata(projectId: string, metadata: any): Promise<void> {
    try {
      const memory = await memoryRepository.getOrCreate(projectId);
      const current = JSON.parse(memory.workflowMetadata || '{}');
      const updated = { ...current, ...metadata };

      await memoryRepository.update(projectId, {
        workflowMetadata: JSON.stringify(updated),
      } as any);

      log.debug('Updated workflow metadata', { projectId });
    } catch (error) {
      log.error('Failed to update workflow metadata', { projectId }, error as Error);
      throw error;
    }
  }

  /**
   * Clear memory for project
   */
  async clearMemory(projectId: string): Promise<void> {
    try {
      await memoryRepository.update(projectId, {
        messages: JSON.stringify([]),
        projectConfig: JSON.stringify({}),
        workflowMetadata: JSON.stringify({}),
        entities: JSON.stringify([]),
        summary: '',
      } as any);

      log.info('Cleared project memory', { projectId });
    } catch (error) {
      log.error('Failed to clear memory', { projectId }, error as Error);
      throw error;
    }
  }
}

// Export singleton
export const unifiedMemory = new UnifiedMemoryService();
