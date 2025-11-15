// lib/messaging/config-manager.ts
/**
 * CONFIG MANAGER
 *
 * Manages message configurations with persistence, validation, and real-time updates.
 * Provides admin API for CRUD operations on message configs.
 */

import { pb } from '../database/pocketbase';
import type { AppGenState } from '../langgraph/types';
import type { MessageConfig } from './message-config';
import {
  DEFAULT_MESSAGE_CONFIGS,
  disableMessageConfig,
  enableMessageConfig,
  getBestMatchingConfig,
  getMessageConfigById,
  matchMessageConfigs,
  renderMessageContent,
  upsertMessageConfig,
} from './message-config';

/**
 * ConfigManager handles persistence and retrieval of message configurations
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private cache: Map<string, MessageConfig> = new Map();
  private initialized = false;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Initialize config manager (load from database)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load custom configs from PocketBase (if collection exists)
      const records = await pb.collection('message_configs').getFullList({
        sort: '-priority',
      });

      records.forEach((record) => {
        const config: MessageConfig = {
          id: record.id,
          name: record.name,
          description: record.description,
          trigger: record.trigger,
          conditions: record.conditions || undefined,
          message: record.message,
          priority: record.priority,
          enabled: record.enabled,
          version: record.version || undefined,
          audience: record.audience || 'all',
        };

        this.cache.set(config.id, config);
        upsertMessageConfig(config);
      });

      console.log(`[ConfigManager] Loaded ${records.length} custom configs from database`);
    } catch (error) {
      // Collection might not exist yet - use defaults only
      console.log('[ConfigManager] Using default configs (no custom configs found)');
    }

    this.initialized = true;
  }

  /**
   * Get config by ID (checks cache first, then defaults)
   */
  getConfig(id: string): MessageConfig | null {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    // Fallback to defaults
    return getMessageConfigById(id);
  }

  /**
   * Get all configs
   */
  getAllConfigs(): MessageConfig[] {
    const customConfigs = Array.from(this.cache.values());
    const defaultConfigs = DEFAULT_MESSAGE_CONFIGS.filter(
      (config) => !this.cache.has(config.id)
    );
    return [...customConfigs, ...defaultConfigs].sort((a, b) => b.priority - a.priority);
  }

  /**
   * Find best matching config for event
   */
  findBestMatch(
    trigger: MessageConfig['trigger'],
    state: AppGenState,
    eventData?: any
  ): MessageConfig | null {
    return getBestMatchingConfig(trigger, state, eventData);
  }

  /**
   * Find all matching configs for event
   */
  findMatches(
    trigger: MessageConfig['trigger'],
    state: AppGenState,
    eventData?: any
  ): MessageConfig[] {
    return matchMessageConfigs(trigger, state, eventData);
  }

  /**
   * Render message content from config
   */
  renderContent(config: MessageConfig, data: any, state?: AppGenState): string {
    return renderMessageContent(config, data, state);
  }

  /**
   * Create new config
   */
  async createConfig(config: MessageConfig): Promise<MessageConfig> {
    // Validate config
    this.validateConfig(config);

    try {
      // Save to database
      const record = await pb.collection('message_configs').create({
        id: config.id,
        name: config.name,
        description: config.description,
        trigger: config.trigger,
        conditions: config.conditions || null,
        message: config.message,
        priority: config.priority,
        enabled: config.enabled,
        version: config.version || '1.0',
        audience: config.audience || 'all',
      });

      // Update cache
      this.cache.set(config.id, config);
      upsertMessageConfig(config);

      console.log(`[ConfigManager] Created config: ${config.id}`);
      return config;
    } catch (error) {
      console.error('[ConfigManager] Failed to create config:', error);
      throw error;
    }
  }

  /**
   * Update existing config
   */
  async updateConfig(id: string, updates: Partial<MessageConfig>): Promise<MessageConfig> {
    const existing = this.getConfig(id);
    if (!existing) {
      throw new Error(`Config not found: ${id}`);
    }

    const updated: MessageConfig = { ...existing, ...updates };
    this.validateConfig(updated);

    try {
      // Update in database
      await pb.collection('message_configs').update(id, {
        name: updated.name,
        description: updated.description,
        trigger: updated.trigger,
        conditions: updated.conditions || null,
        message: updated.message,
        priority: updated.priority,
        enabled: updated.enabled,
        version: updated.version || '1.0',
        audience: updated.audience || 'all',
      });

      // Update cache
      this.cache.set(id, updated);
      upsertMessageConfig(updated);

      console.log(`[ConfigManager] Updated config: ${id}`);
      return updated;
    } catch (error) {
      console.error('[ConfigManager] Failed to update config:', error);
      throw error;
    }
  }

  /**
   * Delete config
   */
  async deleteConfig(id: string): Promise<void> {
    try {
      // Delete from database
      await pb.collection('message_configs').delete(id);

      // Remove from cache
      this.cache.delete(id);

      console.log(`[ConfigManager] Deleted config: ${id}`);
    } catch (error) {
      console.error('[ConfigManager] Failed to delete config:', error);
      throw error;
    }
  }

  /**
   * Enable config
   */
  async enableConfig(id: string): Promise<void> {
    enableMessageConfig(id);

    const config = this.getConfig(id);
    if (config) {
      config.enabled = true;
      this.cache.set(id, config);

      try {
        await pb.collection('message_configs').update(id, { enabled: true });
        console.log(`[ConfigManager] Enabled config: ${id}`);
      } catch (error) {
        console.error('[ConfigManager] Failed to enable config:', error);
      }
    }
  }

  /**
   * Disable config
   */
  async disableConfig(id: string): Promise<void> {
    disableMessageConfig(id);

    const config = this.getConfig(id);
    if (config) {
      config.enabled = false;
      this.cache.set(id, config);

      try {
        await pb.collection('message_configs').update(id, { enabled: false });
        console.log(`[ConfigManager] Disabled config: ${id}`);
      } catch (error) {
        console.error('[ConfigManager] Failed to disable config:', error);
      }
    }
  }

  /**
   * Validate config structure
   */
  private validateConfig(config: MessageConfig): void {
    if (!config.id) throw new Error('Config must have an id');
    if (!config.name) throw new Error('Config must have a name');
    if (!config.trigger) throw new Error('Config must have a trigger');
    if (!config.message) throw new Error('Config must have a message');
    if (typeof config.priority !== 'number') throw new Error('Config must have a numeric priority');
    if (typeof config.enabled !== 'boolean') throw new Error('Config must have an enabled boolean');
  }

  /**
   * Clear cache (for testing)
   */
  clearCache(): void {
    this.cache.clear();
    this.initialized = false;
  }
}

/**
 * Export singleton instance
 */
export const configManager = ConfigManager.getInstance();
