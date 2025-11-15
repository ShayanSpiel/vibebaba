// lib/repositories/memory.repository.ts

import { Collections, config } from '@/lib/config';
import { BaseRepository } from './base.repository';

export interface ConversationMemory {
  id: string;
  projectId: string;
  messages: string;
  projectConfig: string;
  workflowMetadata: string;
  entities: string;
  summary: string;
  created?: string;
  updated?: string;
}

class MemoryRepository extends BaseRepository<ConversationMemory> {
  constructor() {
    super(Collections.CONVERSATION_MEMORY, config.CACHE_TTL_MEMORY);
  }

  /**
   * Get or create memory for project
   */
  async getOrCreate(projectId: string): Promise<ConversationMemory> {
    let memory = await this.findById(projectId);

    if (!memory) {
      memory = await this.create({
        id: projectId,
        projectId,
        messages: JSON.stringify([]),
        projectConfig: JSON.stringify({}),
        workflowMetadata: JSON.stringify({}),
        entities: JSON.stringify([]),
        summary: '',
      } as any);
    }

    return memory;
  }

  /**
   * Update project config in memory
   */
  async updateProjectConfig(projectId: string, config: any): Promise<void> {
    const memory = await this.getOrCreate(projectId);

    const currentConfig = JSON.parse(memory.projectConfig || '{}');
    const updatedConfig = { ...currentConfig, ...config };

    await this.update(projectId, {
      projectConfig: JSON.stringify(updatedConfig),
    } as any);
  }

  /**
   * Add message to conversation
   */
  async addMessage(projectId: string, message: any): Promise<void> {
    const memory = await this.getOrCreate(projectId);

    const messages = JSON.parse(memory.messages || '[]');
    messages.push(message);

    await this.update(projectId, {
      messages: JSON.stringify(messages),
    } as any);
  }
}

// Export singleton
export const memoryRepository = new MemoryRepository();
