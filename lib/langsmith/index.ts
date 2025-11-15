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

// A/B test configuration
export {
  PM_PLANNING_AB_TEST,
  PM_PLANNING_FALLBACK_PROMPT,
  validateLangSmithSetup,
} from './ab-test-config';
// Automated experiments (NEW)
export {
  builtInEvaluators,
  type EvaluationResult,
  type EvaluatorConfig,
  type ExperimentConfig,
  type ExperimentResult,
  runAutomatedExperiment,
} from './auto-experiment';
// Auto-promotion (NEW)
export {
  backupConfig,
  type PromotionConfig,
  type PromotionResult,
  type PromotionStrategy,
  promoteWinner,
  rollbackPromotion,
} from './auto-promotion';
// Scheduler (NEW)
export {
  enableContinuousOptimization,
  getSchedulerStatus,
  type SchedulerConfig,
  startScheduler,
  stopScheduler,
} from './auto-scheduler';
// Client utilities
export {
  addDatasetExample,
  createDataset,
  deleteDataset,
  getDataset,
  getLangSmithClient,
  listDatasetExamples,
  listDatasets,
} from './client';
// Dataset setup helpers
export {
  listExistingDatasets,
  setupAppGenDataset,
  setupPMNodeDataset,
} from './dataset-setup';
// Prompt management & A/B testing
export {
  type ABTestConfig,
  clearPromptCache,
  fetchPrompt,
  fetchPromptWithABTest,
  formatPrompt,
  type PromptMetrics,
  selectVariant,
  trackPromptMetrics,
} from './prompt-manager';
