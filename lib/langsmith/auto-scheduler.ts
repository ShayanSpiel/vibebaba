// lib/langsmith/auto-scheduler.ts
/**
 * Automated Experiment Scheduler
 *
 * Runs experiments on a schedule:
 * - Cron-based scheduling
 * - One-time runs
 * - Continuous optimization mode
 */

import { runAutomatedExperiment, type ExperimentConfig } from './auto-experiment';
import { promoteWinner, backupConfig, type PromotionConfig } from './auto-promotion';

/**
 * Scheduler configuration
 */
export interface SchedulerConfig {
  experiments: ExperimentConfig[];
  promotionConfig: PromotionConfig;
  schedule: {
    type: 'cron' | 'interval' | 'once';
    value: string | number; // Cron expression or interval in ms
  };
  enabled: boolean;
}

/**
 * Scheduler state
 */
interface SchedulerState {
  running: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  errors: string[];
}

let schedulerState: SchedulerState = {
  running: false,
  runCount: 0,
  errors: [],
};

let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Start automated scheduler
 */
export function startScheduler(config: SchedulerConfig) {
  if (!config.enabled) {
    console.log('[Scheduler] Disabled in config');
    return;
  }

  if (schedulerState.running) {
    console.log('[Scheduler] Already running');
    return;
  }

  console.log('🤖 [Scheduler] Starting automated experiment scheduler...');
  console.log(`   Type: ${config.schedule.type}`);
  console.log(`   Value: ${config.schedule.value}`);
  console.log(`   Experiments: ${config.experiments.length}`);

  schedulerState.running = true;

  if (config.schedule.type === 'once') {
    // Run immediately, once
    runScheduledExperiments(config).then(() => {
      console.log('[Scheduler] One-time run completed');
      schedulerState.running = false;
    });
  } else if (config.schedule.type === 'interval') {
    // Run on interval
    const intervalMs = config.schedule.value as number;

    // Run immediately
    runScheduledExperiments(config);

    // Then schedule repeats
    schedulerInterval = setInterval(() => {
      runScheduledExperiments(config);
    }, intervalMs);

    schedulerState.nextRun = new Date(Date.now() + intervalMs);

    console.log(`[Scheduler] Running every ${intervalMs}ms`);
    console.log(`[Scheduler] Next run: ${schedulerState.nextRun.toISOString()}`);
  } else if (config.schedule.type === 'cron') {
    // TODO: Implement cron scheduling with node-cron
    console.warn('[Scheduler] Cron scheduling not yet implemented');
    console.log('[Scheduler] Use interval type instead');
    schedulerState.running = false;
  }
}

/**
 * Stop scheduler
 */
export function stopScheduler() {
  console.log('[Scheduler] Stopping...');

  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }

  schedulerState.running = false;
  console.log('[Scheduler] Stopped');
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): SchedulerState {
  return { ...schedulerState };
}

/**
 * Run all scheduled experiments
 */
async function runScheduledExperiments(config: SchedulerConfig) {
  console.log(`\n🤖 [Scheduler] Running ${config.experiments.length} experiments...`);
  schedulerState.lastRun = new Date();
  schedulerState.runCount++;

  for (const experiment of config.experiments) {
    try {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🧪 Experiment ${config.experiments.indexOf(experiment) + 1}/${config.experiments.length}: ${experiment.name}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      // Backup config before experiment
      backupConfig();

      // Run experiment
      const result = await runAutomatedExperiment(experiment);

      // Log results to file
      await saveExperimentResult(experiment.name, result);

      // Try to promote winner
      if (result.winner) {
        const promotion = await promoteWinner(
          result,
          config.promotionConfig,
          'lib/langsmith/ab-test-config.ts'
        );

        if (promotion.promoted) {
          console.log(`   🚀 Auto-promoted: ${promotion.winner?.name}`);
        }
      }
    } catch (error: any) {
      console.error(`   ❌ Experiment failed: ${error.message}`);
      schedulerState.errors.push(`${experiment.name}: ${error.message}`);
    }
  }

  console.log(`\n✅ [Scheduler] Run ${schedulerState.runCount} completed`);
  console.log(`   Time: ${schedulerState.lastRun.toISOString()}`);
  console.log(`   Errors: ${schedulerState.errors.length}`);

  if (config.schedule.type === 'interval') {
    const nextRun = new Date(Date.now() + (config.schedule.value as number));
    schedulerState.nextRun = nextRun;
    console.log(`   Next run: ${nextRun.toISOString()}`);
  }
}

/**
 * Save experiment result to file
 */
async function saveExperimentResult(experimentName: string, result: any) {
  const fs = require('fs');
  const path = require('path');

  const resultsDir = path.join(process.cwd(), '.langsmith-results');

  // Create directory if it doesn't exist
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${experimentName}_${timestamp}.json`;
  const filepath = path.join(resultsDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(result, null, 2), 'utf-8');

  console.log(`   💾 Results saved: ${filename}`);
}

/**
 * Continuous optimization mode
 * Runs experiments regularly and auto-promotes winners
 */
export function enableContinuousOptimization(config: {
  experiments: ExperimentConfig[];
  intervalHours?: number; // Default: 24 hours
  minConfidence?: number; // Default: 0.7
  promotionStrategy?: 'gradual' | 'canary'; // Default: gradual
}) {
  const intervalMs = (config.intervalHours || 24) * 60 * 60 * 1000;

  const schedulerConfig: SchedulerConfig = {
    experiments: config.experiments,
    promotionConfig: {
      strategy: config.promotionStrategy || 'gradual',
      minConfidence: config.minConfidence || 0.7,
      notifyOnPromotion: true,
    },
    schedule: {
      type: 'interval',
      value: intervalMs,
    },
    enabled: true,
  };

  console.log('🔄 [Continuous Optimization] Enabled');
  console.log(`   Running every ${config.intervalHours || 24} hours`);
  console.log(`   Auto-promotion: ${schedulerConfig.promotionConfig.strategy}`);
  console.log(`   Min confidence: ${(schedulerConfig.promotionConfig.minConfidence! * 100).toFixed(0)}%`);

  startScheduler(schedulerConfig);
}
