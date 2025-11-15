// lib/langsmith/run-all-experiments.ts
/**
 * Run automated A/B tests for ALL workflow nodes
 *
 * Usage:
 *   npm run langsmith:test-all          # Test all nodes
 *   npm run langsmith:test-founder      # Test single node
 *   npm run langsmith:continuous-all    # Continuous optimization for all
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import {
  builtInEvaluators,
  type ExperimentConfig,
  runAutomatedExperiment,
} from './auto-experiment';
import { type PromotionConfig, promoteWinner } from './auto-promotion';
import { enableContinuousOptimization } from './auto-scheduler';
import {
  AUTOGEN_AB_TEST,
  BACKEND_AB_TEST,
  DEVOPS_AB_TEST,
  EDITOR_AB_TEST,
  FOUNDER_AB_TEST,
  FRONTEND_AB_TEST,
  PM_AB_TEST,
  QA_AB_TEST,
  UX_AB_TEST,
} from './configs/all-nodes-config';

/**
 * Mock workflow functions (replace with real implementations)
 */
const mockWorkflows = {
  founder: async (inputs: any, promptText: string) => ({
    refinedRequirements: `Refined: ${inputs.userDescription}`,
    targetAudience: 'users',
    primaryGoal: 'solve problem',
  }),

  pm: async (inputs: any, promptText: string) => ({
    plan: `Plan for: ${inputs.userDescription}`,
    appType: 'app',
    complexity: 'moderate',
    needsBackend: true,
  }),

  ux: async (inputs: any, promptText: string) => ({
    designSystem: 'tailwind-shadcn',
    visualTone: 'light',
    primaryColors: ['blue', 'white'],
  }),

  backend: async (inputs: any, promptText: string) => ({
    collections: ['users', 'items'],
    hasRelationships: true,
  }),

  frontend: async (inputs: any, promptText: string) => ({
    hasPages: true,
    hasComponents: true,
    hasApiIntegration: true,
  }),

  qa: async (inputs: any, promptText: string) => ({
    validationStatus: 'pass',
    errors: [],
    warnings: ['Minor warning'],
  }),

  devops: async (inputs: any, promptText: string) => ({
    deploymentStatus: 'success',
    previewUrl: 'https://example.com/preview',
    filesDeployed: inputs.files?.length || 0,
  }),

  editor: async (inputs: any, promptText: string) => ({
    filesModified: ['page.tsx'],
    filesAdded: [],
    filesDeleted: [],
    changeDescription: `Applied changes: ${inputs.userRequest}`,
  }),

  autogen: async (inputs: any, promptText: string) => ({
    fixed: true,
    filesModified: ['page.tsx'],
    fixDescription: 'Fixed errors',
    validationPassed: true,
  }),
};

/**
 * Experiment configurations for each node
 */
const EXPERIMENTS: Record<string, ExperimentConfig> = {
  founder: {
    name: 'founder-ab-test',
    description: 'Compare thorough vs quick requirement refinement',
    datasetName: 'vibebaba-founder-tests',
    variants: FOUNDER_AB_TEST.variants,
    runWorkflow: mockWorkflows.founder,
    evaluators: [
      builtInEvaluators.correctness(['refinedRequirements', 'targetAudience']),
      builtInEvaluators.completeness(['refinedRequirements', 'primaryGoal']),
      builtInEvaluators.lengthCheck(50, 3000),
    ],
    successCriteria: {
      minSuccessRate: 0.9,
      maxAvgLatency: 2000,
      minQualityScore: 0.8,
    },
  },

  pm: {
    name: 'pm-ab-test',
    description: 'Compare detailed vs concise planning',
    datasetName: 'vibebaba-pm-tests',
    variants: PM_AB_TEST.variants,
    runWorkflow: mockWorkflows.pm,
    evaluators: [
      builtInEvaluators.correctness(['appType', 'complexity', 'needsBackend']),
      builtInEvaluators.completeness(['plan', 'appType']),
      builtInEvaluators.lengthCheck(100, 5000),
    ],
    successCriteria: {
      minSuccessRate: 0.9,
      maxAvgLatency: 2000,
      minQualityScore: 0.8,
    },
  },

  ux: {
    name: 'ux-ab-test',
    description: 'Compare comprehensive vs minimal design selection',
    datasetName: 'vibebaba-ux-tests',
    variants: UX_AB_TEST.variants,
    runWorkflow: mockWorkflows.ux,
    evaluators: [
      builtInEvaluators.correctness(['designSystem', 'visualTone']),
      builtInEvaluators.completeness(['designSystem', 'primaryColors']),
      builtInEvaluators.lengthCheck(50, 2000),
    ],
    successCriteria: {
      minSuccessRate: 0.85,
      maxAvgLatency: 1500,
      minQualityScore: 0.75,
    },
  },

  backend: {
    name: 'backend-ab-test',
    description: 'Compare normalized vs simplified schema generation',
    datasetName: 'vibebaba-backend-tests',
    variants: BACKEND_AB_TEST.variants,
    runWorkflow: mockWorkflows.backend,
    evaluators: [
      builtInEvaluators.correctness(['collections', 'hasRelationships']),
      builtInEvaluators.completeness(['collections']),
      builtInEvaluators.lengthCheck(100, 4000),
    ],
    successCriteria: {
      minSuccessRate: 0.9,
      maxAvgLatency: 2500,
      minQualityScore: 0.85,
    },
  },

  frontend: {
    name: 'frontend-ab-test',
    description: 'Compare modular vs integrated code generation',
    datasetName: 'vibebaba-frontend-tests',
    variants: FRONTEND_AB_TEST.variants,
    runWorkflow: mockWorkflows.frontend,
    evaluators: [
      builtInEvaluators.correctness(['hasPages', 'hasComponents']),
      builtInEvaluators.completeness(['hasPages', 'hasApiIntegration']),
      builtInEvaluators.lengthCheck(500, 50000),
    ],
    successCriteria: {
      minSuccessRate: 0.85,
      maxAvgLatency: 5000,
      minQualityScore: 0.8,
    },
  },

  qa: {
    name: 'qa-ab-test',
    description: 'Compare thorough vs quick code validation',
    datasetName: 'vibebaba-qa-node-tests',
    variants: QA_AB_TEST.variants,
    runWorkflow: mockWorkflows.qa,
    evaluators: [
      builtInEvaluators.correctness(['validationStatus', 'errors']),
      builtInEvaluators.completeness(['validationStatus', 'errors', 'warnings']),
      builtInEvaluators.lengthCheck(50, 5000),
    ],
    successCriteria: {
      minSuccessRate: 0.9,
      maxAvgLatency: 1500,
      minQualityScore: 0.85,
    },
  },

  devops: {
    name: 'devops-ab-test',
    description: 'Compare comprehensive vs minimal deployment',
    datasetName: 'vibebaba-devops-node-tests',
    variants: DEVOPS_AB_TEST.variants,
    runWorkflow: mockWorkflows.devops,
    evaluators: [
      builtInEvaluators.correctness(['deploymentStatus', 'previewUrl']),
      builtInEvaluators.completeness(['deploymentStatus', 'filesDeployed']),
      builtInEvaluators.lengthCheck(50, 2000),
    ],
    successCriteria: {
      minSuccessRate: 0.95,
      maxAvgLatency: 3000,
      minQualityScore: 0.9,
    },
  },

  editor: {
    name: 'editor-ab-test',
    description: 'Compare surgical vs holistic code editing',
    datasetName: 'vibebaba-editor-node-tests',
    variants: EDITOR_AB_TEST.variants,
    runWorkflow: mockWorkflows.editor,
    evaluators: [
      builtInEvaluators.correctness(['filesModified', 'changeDescription']),
      builtInEvaluators.completeness(['filesModified', 'filesAdded', 'filesDeleted']),
      builtInEvaluators.lengthCheck(100, 50000),
    ],
    successCriteria: {
      minSuccessRate: 0.85,
      maxAvgLatency: 4000,
      minQualityScore: 0.8,
    },
  },

  autogen: {
    name: 'autogen-ab-test',
    description: 'Compare iterative vs aggressive debugging',
    datasetName: 'vibebaba-autogen-node-tests',
    variants: AUTOGEN_AB_TEST.variants,
    runWorkflow: mockWorkflows.autogen,
    evaluators: [
      builtInEvaluators.correctness(['fixed', 'validationPassed']),
      builtInEvaluators.completeness(['fixed', 'filesModified', 'fixDescription']),
      builtInEvaluators.lengthCheck(100, 50000),
    ],
    successCriteria: {
      minSuccessRate: 0.9,
      maxAvgLatency: 5000,
      minQualityScore: 0.85,
    },
  },
};

/**
 * Promotion config (same for all nodes)
 */
const PROMOTION_CONFIG: PromotionConfig = {
  strategy: 'gradual',
  minConfidence: 0.6,
  notifyOnPromotion: true,
};

/**
 * Config file paths for each node
 */
const CONFIG_PATHS: Record<string, string> = {
  founder: 'lib/langsmith/configs/all-nodes-config.ts',
  pm: 'lib/langsmith/configs/all-nodes-config.ts',
  ux: 'lib/langsmith/configs/all-nodes-config.ts',
  backend: 'lib/langsmith/configs/all-nodes-config.ts',
  frontend: 'lib/langsmith/configs/all-nodes-config.ts',
  qa: 'lib/langsmith/configs/all-nodes-config.ts',
  devops: 'lib/langsmith/configs/all-nodes-config.ts',
  editor: 'lib/langsmith/configs/all-nodes-config.ts',
  autogen: 'lib/langsmith/configs/all-nodes-config.ts',
};

/**
 * Run experiment for single node
 */
async function runNodeExperiment(nodeName: string) {
  const experiment = EXPERIMENTS[nodeName];

  if (!experiment) {
    throw new Error(`Unknown node: ${nodeName}`);
  }

  console.log(`\n${'━'.repeat(60)}`);
  console.log(`🧪 Testing ${nodeName.toUpperCase()} Node`);
  console.log('━'.repeat(60));

  try {
    // Run experiment
    const result = await runAutomatedExperiment(experiment);

    // Print summary
    console.log(`\n📊 ${nodeName.toUpperCase()} RESULTS:`);
    for (const variant of result.variants) {
      console.log(`  ${variant.name}:`);
      console.log(`    Success: ${(variant.metrics.successRate * 100).toFixed(1)}%`);
      console.log(`    Latency: ${variant.metrics.avgLatency.toFixed(0)}ms`);
      console.log(`    Quality: ${(variant.metrics.avgQualityScore * 100).toFixed(1)}%`);
    }

    if (result.winner) {
      console.log(
        `\n  🏆 Winner: ${result.winner.name} (${(result.winner.confidence * 100).toFixed(1)}%)`
      );

      // Try to promote
      const promotion = await promoteWinner(result, PROMOTION_CONFIG, CONFIG_PATHS[nodeName]);

      if (promotion.promoted) {
        console.log(`  ✅ Auto-promoted to production`);
      } else {
        console.log(`  ⚠️  ${promotion.reason}`);
      }
    }

    return result;
  } catch (error: any) {
    console.error(`\n❌ ${nodeName} experiment failed:`, error.message);
    throw error;
  }
}

/**
 * Run all experiments sequentially
 */
async function runAllExperiments() {
  console.log('🤖 Running A/B tests for ALL workflow nodes\n');

  const nodes = ['founder', 'pm', 'ux', 'backend', 'frontend', 'qa', 'devops', 'editor', 'autogen'];
  const results: Record<string, any> = {};

  for (const node of nodes) {
    try {
      results[node] = await runNodeExperiment(node);
    } catch (error: any) {
      console.error(`\n❌ ${node} failed, continuing...`);
      results[node] = { error: error.message };
    }
  }

  // Print overall summary
  console.log(`\n${'━'.repeat(60)}`);
  console.log('📊 OVERALL SUMMARY');
  console.log('━'.repeat(60));

  for (const [node, result] of Object.entries(results)) {
    if (result.error) {
      console.log(`❌ ${node}: Failed - ${result.error}`);
    } else if (result.winner) {
      console.log(`✅ ${node}: ${result.winner.name} promoted`);
    } else {
      console.log(`⚠️  ${node}: No clear winner`);
    }
  }

  console.log(`\n✅ All experiments complete!`);
  console.log(`\nResults saved to: .langsmith-results/`);
}

/**
 * Enable continuous optimization for all nodes
 */
async function runContinuousAll() {
  console.log('🔄 Starting continuous optimization for ALL nodes\n');

  const allExperiments = Object.values(EXPERIMENTS);

  enableContinuousOptimization({
    experiments: allExperiments,
    intervalHours: 24,
    minConfidence: 0.6,
    promotionStrategy: 'gradual',
  });

  console.log('\n✅ Continuous optimization enabled for all nodes');
  console.log('   Will run every 24 hours automatically');
  console.log('   Press Ctrl+C to stop\n');

  // Keep alive
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping...');
    const { stopScheduler } = require('./auto-scheduler');
    stopScheduler();
    process.exit(0);
  });
}

/**
 * CLI
 */
const command = process.argv[2];

if (require.main === module) {
  (async () => {
    try {
      switch (command) {
        case 'founder':
        case 'pm':
        case 'ux':
        case 'backend':
        case 'frontend':
        case 'qa':
        case 'devops':
        case 'editor':
        case 'autogen':
          await runNodeExperiment(command);
          break;

        case 'all':
        case undefined:
          await runAllExperiments();
          break;

        case 'continuous':
          await runContinuousAll();
          break;

        default:
          console.log(`
🤖 Automated A/B Testing for All Nodes

Usage:
  npm run langsmith:test-all [command]

Commands:
  all         Test all 9 nodes (default)
  founder     Test Founder node only
  pm          Test PM node only
  ux          Test UX node only
  backend     Test Backend node only
  frontend    Test Frontend node only
  qa          Test QA node only
  devops      Test DevOps node only
  editor      Test Editor node only
  autogen     Test Autogen node only
  continuous  Enable continuous mode for all nodes

Examples:
  npm run langsmith:test-all              # Test all nodes
  npm run langsmith:test-all pm           # Test PM only
  npm run langsmith:test-all qa           # Test QA only
  npm run langsmith:test-all continuous   # Continuous mode

What it does:
  1. Runs experiments for selected nodes
  2. Compares prompt variants
  3. Selects winners automatically
  4. Auto-promotes to production
  5. Saves results

Prerequisites:
  1. Create datasets: npm run langsmith:setup-dataset setup-all-nodes
  2. Create prompts in LangSmith Hub
  3. Enable configs in lib/langsmith/configs/all-nodes-config.ts
          `);
      }
    } catch (error) {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    }
  })();
}
