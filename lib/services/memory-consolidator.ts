/**
 * Memory Consolidation Service
 * Background job to consolidate observations and build user personas
 */

import { getMemoryService } from './memory-service';

export class MemoryConsolidator {
  private memoryService = getMemoryService();

  /**
   * Consolidate user observations into preferences
   */
  async consolidateUserMemory(userId: string): Promise<void> {
    console.log(`[Consolidator] Consolidating memory for user ${userId}`);

    try {
      // Get all observations
      const userPreferences = await this.memoryService.getUserPreferences(userId);
      if (!userPreferences) return;

      // Extract patterns from observations
      const observations = (userPreferences as any).learningNotes || [];

      // Example: If user requested dark mode 3+ times, make it a preference
      const darkModeCount = observations.filter((obs: string) =>
        obs.toLowerCase().includes('dark')
      ).length;

      if (darkModeCount >= 3 && !userPreferences.prefersDarkMode) {
        await this.memoryService.storeUserPreference(userId, 'prefersDarkMode', true);
        console.log(`[Consolidator] Set prefersDarkMode=true for user ${userId}`);
      }

      // Example: Extract favorite design styles
      const designStyles: Record<string, number> = {};
      observations.forEach((obs: string) => {
        if (obs.includes('minimalist')) designStyles.minimalist = (designStyles.minimalist || 0) + 1;
        if (obs.includes('modern')) designStyles.modern = (designStyles.modern || 0) + 1;
        if (obs.includes('professional')) designStyles.professional = (designStyles.professional || 0) + 1;
        if (obs.includes('playful')) designStyles.playful = (designStyles.playful || 0) + 1;
        if (obs.includes('elegant')) designStyles.elegant = (designStyles.elegant || 0) + 1;
      });

      const favoriteStyle = Object.entries(designStyles)
        .sort((a, b) => b[1] - a[1])[0]?.[0];

      if (favoriteStyle && favoriteStyle !== userPreferences.designStyle) {
        await this.memoryService.storeUserPreference(userId, 'designStyle', favoriteStyle);
        console.log(`[Consolidator] Set designStyle=${favoriteStyle} for user ${userId}`);
      }

      // Extract favorite components
      const components: Record<string, number> = {};
      observations.forEach((obs: string) => {
        if (obs.includes('navbar')) components.navbar = (components.navbar || 0) + 1;
        if (obs.includes('hero')) components.hero = (components.hero || 0) + 1;
        if (obs.includes('pricing')) components.pricing = (components.pricing || 0) + 1;
        if (obs.includes('footer')) components.footer = (components.footer || 0) + 1;
        if (obs.includes('form')) components.form = (components.form || 0) + 1;
      });

      const favoriteComponents = Object.entries(components)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name);

      if (favoriteComponents.length > 0) {
        await this.memoryService.storeUserPreference(userId, 'favoriteComponents', favoriteComponents);
        console.log(`[Consolidator] Set favoriteComponents for user ${userId}:`, favoriteComponents);
      }
    } catch (error) {
      console.error(`[Consolidator] Failed to consolidate user ${userId}:`, error);
    }
  }

  /**
   * Consolidate project observations
   */
  async consolidateProjectMemory(projectId: string): Promise<void> {
    console.log(`[Consolidator] Consolidating memory for project ${projectId}`);

    try {
      const projectContext = await this.memoryService.getProjectContext(projectId);
      if (!projectContext) return;

      // TODO: Implement project-level consolidation
      // - Extract common patterns
      // - Identify technical stack
      // - Build component inventory
      console.log(`[Consolidator] Project consolidation not yet implemented for ${projectId}`);
    } catch (error) {
      console.error(`[Consolidator] Failed to consolidate project ${projectId}:`, error);
    }
  }

  /**
   * Run consolidation for all users (cron job)
   */
  async consolidateAll(): Promise<void> {
    console.log('[Consolidator] Running full consolidation...');

    try {
      // Get all users from knowledge graph
      const graph = await this.memoryService.getKnowledgeGraph();
      const entities = (graph as any)?.entities || [];
      const users = entities.filter((e: any) => e.entityType === 'user');

      console.log(`[Consolidator] Found ${users.length} users to consolidate`);

      for (const user of users) {
        try {
          const userId = user.name.replace('user_', '');
          await this.consolidateUserMemory(userId);
        } catch (error) {
          console.error('[Consolidator] Failed for user:', user.name, error);
        }
      }

      console.log('[Consolidator] Consolidation complete');
    } catch (error) {
      console.error('[Consolidator] Consolidation failed:', error);
    }
  }
}

// Singleton
let consolidatorInstance: MemoryConsolidator | null = null;

export function getMemoryConsolidator(): MemoryConsolidator {
  if (!consolidatorInstance) {
    consolidatorInstance = new MemoryConsolidator();
  }
  return consolidatorInstance;
}
