// lib/langsmith/configs/all-nodes-config.ts
/**
 * A/B Test Configurations for ALL Workflow Nodes
 *
 * Enable/disable A/B testing per node
 * Configure variants, weights, and strategies
 */

import type { ABTestConfig } from '../prompt-manager';

/**
 * FOUNDER NODE - Requirements refinement
 */
export const FOUNDER_AB_TEST: ABTestConfig = {
  enabled: false, // Set to true after creating prompts in Hub
  strategy: 'user-hash',
  variants: [
    {
      name: 'v1-thorough',
      promptName: 'vibebaba/founder-v1:latest', // TODO: Create in Hub
      weight: 50,
    },
    {
      name: 'v2-quick',
      promptName: 'vibebaba/founder-v2:latest', // TODO: Create in Hub
      weight: 50,
    },
  ],
};

/**
 * PM NODE - Product planning
 */
export const PM_AB_TEST: ABTestConfig = {
  enabled: false, // Set to true after creating prompts in Hub
  strategy: 'user-hash',
  variants: [
    {
      name: 'v1-detailed',
      promptName: 'vibebaba/pm-planning-v1:latest', // TODO: Create in Hub
      weight: 50,
    },
    {
      name: 'v2-concise',
      promptName: 'vibebaba/pm-planning-v2:latest', // TODO: Create in Hub
      weight: 50,
    },
  ],
};

/**
 * UX NODE - Design system selection
 */
export const UX_AB_TEST: ABTestConfig = {
  enabled: false, // Set to true after creating prompts in Hub
  strategy: 'user-hash',
  variants: [
    {
      name: 'v1-comprehensive',
      promptName: 'vibebaba/ux-design-v1:latest', // TODO: Create in Hub
      weight: 50,
    },
    {
      name: 'v2-minimal',
      promptName: 'vibebaba/ux-design-v2:latest', // TODO: Create in Hub
      weight: 50,
    },
  ],
};

/**
 * BACKEND NODE - Database schema generation
 */
export const BACKEND_AB_TEST: ABTestConfig = {
  enabled: false, // Set to true after creating prompts in Hub
  strategy: 'user-hash',
  variants: [
    {
      name: 'v1-normalized',
      promptName: 'vibebaba/backend-schema-v1:latest', // TODO: Create in Hub
      weight: 50,
    },
    {
      name: 'v2-simplified',
      promptName: 'vibebaba/backend-schema-v2:latest', // TODO: Create in Hub
      weight: 50,
    },
  ],
};

/**
 * FRONTEND NODE - Code generation
 */
export const FRONTEND_AB_TEST: ABTestConfig = {
  enabled: false, // Set to true after creating prompts in Hub
  strategy: 'user-hash',
  variants: [
    {
      name: 'v1-modular',
      promptName: 'vibebaba/frontend-gen-v1:latest', // TODO: Create in Hub
      weight: 50,
    },
    {
      name: 'v2-integrated',
      promptName: 'vibebaba/frontend-gen-v2:latest', // TODO: Create in Hub
      weight: 50,
    },
  ],
};

/**
 * QA NODE - Code validation and debugging
 */
export const QA_AB_TEST: ABTestConfig = {
  enabled: false, // Set to true after creating prompts in Hub
  strategy: 'user-hash',
  variants: [
    {
      name: 'v1-thorough',
      promptName: 'vibebaba/qa-validation-v1:latest', // TODO: Create in Hub
      weight: 50,
    },
    {
      name: 'v2-quick',
      promptName: 'vibebaba/qa-validation-v2:latest', // TODO: Create in Hub
      weight: 50,
    },
  ],
};

/**
 * DEVOPS NODE - Deployment and infrastructure
 */
export const DEVOPS_AB_TEST: ABTestConfig = {
  enabled: false, // Set to true after creating prompts in Hub
  strategy: 'user-hash',
  variants: [
    {
      name: 'v1-comprehensive',
      promptName: 'vibebaba/devops-deployment-v1:latest', // TODO: Create in Hub
      weight: 50,
    },
    {
      name: 'v2-minimal',
      promptName: 'vibebaba/devops-deployment-v2:latest', // TODO: Create in Hub
      weight: 50,
    },
  ],
};

/**
 * EDITOR NODE - Code modifications
 */
export const EDITOR_AB_TEST: ABTestConfig = {
  enabled: false, // Set to true after creating prompts in Hub
  strategy: 'user-hash',
  variants: [
    {
      name: 'v1-surgical',
      promptName: 'vibebaba/editor-modifications-v1:latest', // TODO: Create in Hub
      weight: 50,
    },
    {
      name: 'v2-holistic',
      promptName: 'vibebaba/editor-modifications-v2:latest', // TODO: Create in Hub
      weight: 50,
    },
  ],
};

/**
 * AUTOGEN NODE - Multi-agent debugging
 */
export const AUTOGEN_AB_TEST: ABTestConfig = {
  enabled: false, // Set to true after creating prompts in Hub
  strategy: 'user-hash',
  variants: [
    {
      name: 'v1-iterative',
      promptName: 'vibebaba/autogen-debugger-v1:latest', // TODO: Create in Hub
      weight: 50,
    },
    {
      name: 'v2-aggressive',
      promptName: 'vibebaba/autogen-debugger-v2:latest', // TODO: Create in Hub
      weight: 50,
    },
  ],
};

/**
 * Fallback prompts (used when A/B testing disabled or on error)
 */
export const FALLBACK_PROMPTS = {
  founder: (requirements: string) =>
    `Refine these requirements: "${requirements}"\n\nProvide:\n- Clear user goals\n- Target audience\n- Success metrics`,

  pm: (requirements: string, context: any) =>
    `Create MVP plan for: "${requirements}"\n\nApp Type: ${context.appType}\nComplexity: ${context.complexity}\n\nGenerate:\n- Overview\n- Core Features\n- Design Direction`,

  ux: (plan: string, context: any) =>
    `Design UI/UX for: ${context.appType}\n\nPlan: ${plan}\n\nSelect:\n- Design system\n- Color scheme\n- Typography`,

  backend: (plan: string, needsBackend: boolean) =>
    needsBackend
      ? `Generate database schema for: "${plan}"\n\nProvide:\n- Collections/tables\n- Fields with types\n- Relationships`
      : 'No backend needed',

  frontend: (plan: string, designSystem: string) =>
    `Generate Next.js app for: "${plan}"\n\nDesign: ${designSystem}\n\nCreate:\n- File structure\n- Components\n- Pages`,

  qa: (files: any[], backendConfig: any) =>
    `Validate these code files:\n\nFiles: ${files.length} total\n\nCheck for:\n- TypeScript errors\n- Import issues\n- API integration problems\n- Database schema mismatches\n\nReturn:\n- Validation status (pass/fail)\n- Error list with locations\n- Severity (critical/warning)\n- Suggested fixes`,

  devops: (appName: string, files: any[], backendConfig: any) =>
    `Deploy application: "${appName}"\n\nFiles: ${files.length} total\nBackend: ${backendConfig ? 'Yes' : 'No'}\n\nActions:\n- Deduplicate files (scaffold vs user files)\n- Save to PocketBase\n- Generate preview URL\n- Return deployment status`,

  editor: (userRequest: string, files: any[], backendConfig: any) =>
    `Edit application based on request: "${userRequest}"\n\nCurrent files: ${files.length} total\nBackend: ${backendConfig ? 'Yes' : 'No'}\n\nDetermine:\n- Which files to modify/create/delete\n- Specific changes needed\n- Preserve database integration\n- Maintain code quality\n\nReturn:\n- Modified files with full content\n- Change descriptions`,

  autogen: (errors: string[], files: any[], backendConfig: any) =>
    `Debug errors:\n\nErrors: ${errors.length} total\nFiles: ${files.length} total\nBackend: ${backendConfig ? 'Yes' : 'No'}\n\nWorkflow:\n1. Analyst: Analyze errors and identify root causes\n2. Fixer: Generate code fixes\n3. FileOps: Apply file operations\n4. Reviewer: Validate fixes\n\nReturn:\n- Fixed files\n- Changes made\n- Validation results`,
};

/**
 * Validation helper
 */
export function validateAllConfigs(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const configs = {
    founder: FOUNDER_AB_TEST,
    pm: PM_AB_TEST,
    ux: UX_AB_TEST,
    backend: BACKEND_AB_TEST,
    frontend: FRONTEND_AB_TEST,
    qa: QA_AB_TEST,
    devops: DEVOPS_AB_TEST,
    editor: EDITOR_AB_TEST,
    autogen: AUTOGEN_AB_TEST,
  };

  for (const [name, config] of Object.entries(configs)) {
    if (config.enabled) {
      const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        errors.push(`${name}: weights sum to ${totalWeight}, not 100`);
      }

      for (const variant of config.variants) {
        if (variant.promptName.includes('TODO')) {
          errors.push(`${name}.${variant.name}: prompt name not configured`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
