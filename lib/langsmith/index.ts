// lib/langsmith/index.ts
/**
 * LangSmith Utilities - Main Exports
 *
 * Central export point for all LangSmith functionality:
 * - Client utilities
 * - Prompt management with A/B testing
 * - Dataset management
 * - Configuration
 * - Automated experiments
 * - Auto-promotion
 */

// Client utilities
export {
  getLangSmithClient,
  createDataset,
  addDatasetExample,
  listDatasets,
  getDataset,
  listDatasetExamples,
  deleteDataset,
} from './client';

// Prompt management & A/B testing
export {
  fetchPrompt,
  selectVariant,
  fetchPromptWithABTest,
  formatPrompt,
  trackPromptMetrics,
  clearPromptCache,
  type ABTestConfig,
  type PromptMetrics,
} from './prompt-manager';

// Dataset setup helpers
export {
  setupAppGenDataset,
  setupPMNodeDataset,
  listExistingDatasets,
} from './dataset-setup';

// A/B test configuration
export {
  PM_PLANNING_AB_TEST,
  PM_PLANNING_FALLBACK_PROMPT,
  validateLangSmithSetup,
} from './ab-test-config';

// Automated experiments (NEW)
export {
  runAutomatedExperiment,
  builtInEvaluators,
  type ExperimentConfig,
  type ExperimentResult,
  type EvaluatorConfig,
  type EvaluationResult,
} from './auto-experiment';

// Auto-promotion (NEW)
export {
  promoteWinner,
  rollbackPromotion,
  backupConfig,
  type PromotionConfig,
  type PromotionResult,
  type PromotionStrategy,
} from './auto-promotion';

// Scheduler (NEW)
export {
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  enableContinuousOptimization,
  type SchedulerConfig,
} from './auto-scheduler';
