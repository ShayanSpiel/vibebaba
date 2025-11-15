/**
 * DESIGN SYSTEM REGISTRY WITH TOGGLE CAPABILITY
 *
 * Central registry for all design systems.
 * Only Ant Design is enabled currently.
 * Other systems can be enabled by setting enabled: true
 */

export type DesignSystemId = 'ant-design' | 'tailwind-shadcn' | 'v0-inspired' | 'enhanced-2025';

export interface DesignConfig {
  appType: string;
  userStyling?: Partial<any>;
  isDarkMode?: boolean;
}

interface DesignSystem {
  id: DesignSystemId;
  name: string;
  enabled: boolean; // ← TOGGLE HERE
  description: string;
  getPrompt: (config: DesignConfig) => string;
}

// Import prompt generators
import { getShadcnPrompt } from './shadcn-prompt';

export const DESIGN_SYSTEMS: Record<DesignSystemId, DesignSystem> = {
  'ant-design': {
    id: 'ant-design',
    name: 'Ant Design System',
    enabled: false, // ← DISABLED (removed completely)
    description: 'Enterprise-grade design system with Ant Design specifications (REMOVED)',
    getPrompt: () => {
      throw new Error(
        'Ant Design has been removed. System now uses shadcn/ui. Check lib/design-systems/index.ts'
      );
    },
  },
  'tailwind-shadcn': {
    id: 'tailwind-shadcn',
    name: 'Tailwind + shadcn/ui',
    enabled: true, // ← ACTIVE (AI-native, standard patterns)
    description: 'Modern, AI-friendly design system using Tailwind CSS and shadcn/ui components',
    getPrompt: (config) => getShadcnPrompt(config),
  },
  'v0-inspired': {
    id: 'v0-inspired',
    name: 'V0-Inspired System',
    enabled: false, // ← DISABLED
    description: 'V0.dev-inspired creative system with semantic colors',
    getPrompt: () => {
      throw new Error(
        'V0-inspired design system is currently disabled. Enable in lib/design-systems/index.ts'
      );
    },
  },
  'enhanced-2025': {
    id: 'enhanced-2025',
    name: 'Enhanced 2025 System',
    enabled: false, // ← DISABLED
    description: 'Modern UI patterns with glassmorphism and advanced caching',
    getPrompt: () => {
      throw new Error(
        'Enhanced-2025 design system is currently disabled. Enable in lib/design-systems/index.ts'
      );
    },
  },
};

/**
 * Get the currently active design system
 * Throws error if no system is enabled
 */
export function getActiveDesignSystem(): DesignSystem {
  const active = Object.values(DESIGN_SYSTEMS).find((ds) => ds.enabled);
  if (!active) {
    throw new Error(
      'No design system enabled! Check DESIGN_SYSTEMS config in lib/design-systems/index.ts'
    );
  }
  return active;
}

/**
 * Get prompt for active design system
 */
export function getDesignSystemPrompt(config: DesignConfig): string {
  const activeSystem = getActiveDesignSystem();
  console.log(`[Design System] Using: ${activeSystem.name}`);
  return activeSystem.getPrompt(config);
}

/**
 * Get list of all available design systems (for UI display)
 */
export function getAllDesignSystems(): DesignSystem[] {
  return Object.values(DESIGN_SYSTEMS);
}

/**
 * Check if a specific design system is enabled
 */
export function isDesignSystemEnabled(id: DesignSystemId): boolean {
  return DESIGN_SYSTEMS[id]?.enabled || false;
}

/**
 * Select best design system based on app type
 * Currently returns the single active system
 * Future: Smart selection based on app characteristics
 */
export function selectDesignSystem(params: {
  appType?: string;
  userDescription: string;
  designStyle?: string;
}): DesignSystemId {
  // Get active design system (currently only one is enabled)
  const activeSystem = getActiveDesignSystem();
  console.log(`[DesignSystemSelector] Selected: ${activeSystem.id}`);
  return activeSystem.id;
}
