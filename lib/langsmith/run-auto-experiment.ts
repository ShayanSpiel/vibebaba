// lib/langsmith/run-auto-experiment.ts
/**
 * Complete example of running automated A/B testing
 *
 * This script demonstrates:
 * 1. Running automated experiments
 * 2. Auto-selecting winners
 * 3. Auto-promoting to production
 * 4. Scheduling for continuous optimization
 *
 * Usage:
 *   npm run langsmith:auto-experiment      # Run once
 *   npm run langsmith:continuous-opt       # Start continuous optimization
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { runAutomatedExperiment, builtInEvaluators, type ExperimentConfig } from './auto-experiment';
import { promoteWinner, type PromotionConfig } from './auto-promotion';
import { enableContinuousOptimization } from './auto-scheduler';

/**
 * Example: Mock PM node workflow for testing
 */
async function mockPMWorkflow(inputs: any, promptText: string): Promise<any> {
  // In real usage, this would call your actual PM node
  // For testing, return mock data

  return {
    plan: `Generated plan for: ${inputs.userDescription}`,
    appType: 'saas-app',
    complexity: 'moderate',
    needsBackend: true,
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
  };
}

/**
 * Define your experiment
 */
const PM_PLANNING_EXPERIMENT: ExperimentConfig = {
  name: 'pm-planning-ab-test',
  description: 'Compare detailed vs concise PM planning prompts',
  datasetName: 'vibebaba-pm-node-tests',

  // Variants to test
  variants: [
    {
      name: 'v1-detailed',
      promptName: 'vibebaba/pm-planning-v1:latest',
    },
    {
      name: 'v2-concise',
      promptName: 'vibebaba/pm-planning-v2:latest',
    },
  ],

  // Your workflow function
  runWorkflow: mockPMWorkflow,

  // Evaluators (how to score results)
  evaluators: [
    // Check if output has expected fields
    builtInEvaluators.correctness(['needsBackend', 'appType', 'complexity']),

    // Check if output has required sections
    builtInEvaluators.completeness(['plan', 'features', 'appType']),

    // Check output length is reasonable
    builtInEvaluators.lengthCheck(100, 5000),
  ],

  // Success criteria
  successCriteria: {
    minSuccessRate: 0.9, // 90% success rate required
    maxAvgLatency: 2000, // Max 2 seconds average
    minQualityScore: 0.8, // 80% quality score required
  },
};

/**
 * Promotion configuration
 */
const PROMOTION_CONFIG: PromotionConfig = {
  strategy: 'gradual', // Start with 70/30 split
  minConfidence: 0.6, // Require 60% confidence
  notifyOnPromotion: true, // Send notifications
};

/**
 * Run experiment once
 */
async function runOnce() {
  console.log('🚀 Running automated A/B test experiment\n');

  try {
    // Run experiment
    const result = await runAutomatedExperiment(PM_PLANNING_EXPERIMENT);

    // Print summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 EXPERIMENT SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (const variant of result.variants) {
      console.log(`${variant.name}:`);
      console.log(`  Success Rate: ${(variant.metrics.successRate * 100).toFixed(1)}%`);
      console.log(`  Avg Latency: ${variant.metrics.avgLatency.toFixed(0)}ms`);
      console.log(`  Quality Score: ${(variant.metrics.avgQualityScore * 100).toFixed(1)}%`);
      console.log(`  Runs: ${variant.metrics.totalRuns} (${variant.metrics.passedRuns} passed, ${variant.metrics.failedRuns} failed)`);
      console.log('');
    }

    if (result.winner) {
      console.log('🏆 WINNER:');
      console.log(`  ${result.winner.name}`);
      console.log(`  Confidence: ${(result.winner.confidence * 100).toFixed(1)}%`);
      console.log(`  Reason: ${result.winner.reason}`);
      console.log('');

      // Try to promote
      console.log('🚀 Attempting auto-promotion...\n');

      const promotion = await promoteWinner(
        result,
        PROMOTION_CONFIG,
        'lib/langsmith/ab-test-config.ts'
      );

      if (promotion.promoted) {
        console.log('\n✅ SUCCESS!');
        console.log(`   Winner "${promotion.winner?.name}" promoted to production`);
        console.log(`   Strategy: ${promotion.strategy}`);
        console.log(`   Config updated: ${promotion.configPath}`);
        console.log('\nNext steps:');
        console.log('1. Restart your dev server to use new config');
        console.log('2. Monitor performance in LangSmith dashboard');
        console.log('3. If needed, rollback with: npm run langsmith:rollback');
      } else {
        console.log('\n⚠️  Promotion skipped');
        console.log(`   Reason: ${promotion.reason}`);
        console.log('\nTo promote manually:');
        console.log('1. Review results above');
        console.log('2. Update lib/langsmith/ab-test-config.ts');
        console.log('3. Adjust variant weights');
      }
    } else {
      console.log('⚠️  No clear winner - results too close');
      console.log('\nRecommendations:');
      console.log('1. Run experiment with more test cases');
      console.log('2. Adjust success criteria');
      console.log('3. Try different prompt variants');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('\n❌ Experiment failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Enable continuous optimization
 */
async function runContinuous() {
  console.log('🔄 Starting continuous optimization mode\n');

  enableContinuousOptimization({
    experiments: [PM_PLANNING_EXPERIMENT],
    intervalHours: 24, // Run every 24 hours
    minConfidence: 0.6, // 60% confidence required
    promotionStrategy: 'gradual', // Gradual rollout
  });

  console.log('\n✅ Continuous optimization enabled');
  console.log('   Experiments will run automatically every 24 hours');
  console.log('   Winners will be auto-promoted with gradual rollout');
  console.log('   Results saved to .langsmith-results/');
  console.log('\n   Press Ctrl+C to stop\n');

  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping continuous optimization...');
    const { stopScheduler } = require('./auto-scheduler');
    stopScheduler();
    process.exit(0);
  });
}

/**
 * Main CLI
 */
const command = process.argv[2];

if (require.main === module) {
  (async () => {
    switch (command) {
      case 'once':
      case undefined:
        await runOnce();
        break;

      case 'continuous':
        await runContinuous();
        break;

      default:
        console.log(`
🤖 Automated A/B Testing

Usage:
  npm run langsmith:auto-experiment [command]

Commands:
  once        Run experiment once and exit (default)
  continuous  Enable continuous optimization mode

Examples:
  npm run langsmith:auto-experiment              # Run once
  npm run langsmith:auto-experiment once         # Run once
  npm run langsmith:auto-experiment continuous   # Continuous mode

What it does:
  1. Runs your experiments against test datasets
  2. Compares prompt variants (v1 vs v2)
  3. Selects winner based on metrics
  4. Auto-promotes winner to production
  5. Sends notifications

Results saved to: .langsmith-results/
        `);
    }
  })();
}
