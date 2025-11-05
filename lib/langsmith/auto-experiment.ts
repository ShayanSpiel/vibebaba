// lib/langsmith/auto-experiment.ts
/**
 * Automated Prompt A/B Testing & Optimization
 *
 * Features:
 * - Automatically run experiments against datasets
 * - Compare prompt variants with statistical analysis
 * - Auto-select winning prompts based on metrics
 * - Auto-promote winners to production
 */

import { getLangSmithClient } from './client';
import { fetchPrompt, formatPrompt, type PromptMetrics } from './prompt-manager';
import { getDataset, listDatasetExamples } from './client';

/**
 * Experiment configuration
 */
export interface ExperimentConfig {
  name: string;
  description?: string;
  datasetName: string; // Dataset to test against
  variants: Array<{
    name: string;
    promptName: string; // LangSmith Hub prompt name
  }>;
  runWorkflow: (inputs: any, promptText: string) => Promise<any>; // Your workflow function
  evaluators: EvaluatorConfig[];
  successCriteria?: {
    minSuccessRate?: number; // e.g., 0.95 (95%)
    maxAvgLatency?: number; // e.g., 1000 (ms)
    minQualityScore?: number; // e.g., 0.8 (80%)
  };
}

/**
 * Evaluator configuration
 */
export interface EvaluatorConfig {
  name: string;
  type: 'correctness' | 'completeness' | 'latency' | 'cost' | 'custom';
  evaluate: (inputs: any, output: any, expected?: any) => Promise<EvaluationResult>;
}

/**
 * Evaluation result for a single test case
 */
export interface EvaluationResult {
  score: number; // 0-1
  passed: boolean;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Experiment result
 */
export interface ExperimentResult {
  experimentName: string;
  datasetName: string;
  variants: Array<{
    name: string;
    promptName: string;
    metrics: {
      successRate: number;
      avgLatency: number;
      avgQualityScore: number;
      totalRuns: number;
      passedRuns: number;
      failedRuns: number;
    };
    results: Array<{
      exampleId: string;
      success: boolean;
      latency: number;
      evaluations: Record<string, EvaluationResult>;
    }>;
  }>;
  winner?: {
    name: string;
    promptName: string;
    confidence: number; // 0-1
    reason: string;
  };
  timestamp: string;
}

/**
 * Run automated experiment
 */
export async function runAutomatedExperiment(
  config: ExperimentConfig
): Promise<ExperimentResult> {
  console.log(`🧪 [AutoExperiment] Starting: ${config.name}`);
  console.log(`📦 Dataset: ${config.datasetName}`);
  console.log(`🔬 Variants: ${config.variants.map(v => v.name).join(', ')}`);

  // Load dataset
  const dataset = await getDataset(config.datasetName);
  const examples = await listDatasetExamples(dataset.id);

  console.log(`📋 Loaded ${examples.length} test cases`);

  const result: ExperimentResult = {
    experimentName: config.name,
    datasetName: config.datasetName,
    variants: [],
    timestamp: new Date().toISOString(),
  };

  // Test each variant
  for (const variant of config.variants) {
    console.log(`\n🧪 Testing variant: ${variant.name}`);
    console.log(`   Prompt: ${variant.promptName}`);

    // Fetch prompt from Hub
    const prompt = await fetchPrompt(variant.promptName);

    const variantResults = {
      name: variant.name,
      promptName: variant.promptName,
      metrics: {
        successRate: 0,
        avgLatency: 0,
        avgQualityScore: 0,
        totalRuns: 0,
        passedRuns: 0,
        failedRuns: 0,
      },
      results: [] as any[],
    };

    // Run against each example
    for (const example of examples) {
      const startTime = Date.now();

      try {
        // Format prompt with example inputs
        const formattedPrompt = formatPrompt(prompt, example.inputs);

        // Run workflow
        const output = await config.runWorkflow(example.inputs, formattedPrompt);
        const latency = Date.now() - startTime;

        // Evaluate output
        const evaluations: Record<string, EvaluationResult> = {};
        let totalScore = 0;

        for (const evaluator of config.evaluators) {
          const evalResult = await evaluator.evaluate(
            example.inputs,
            output,
            example.outputs
          );

          evaluations[evaluator.name] = evalResult;
          totalScore += evalResult.score;
        }

        const avgScore = totalScore / config.evaluators.length;
        const allPassed = Object.values(evaluations).every(e => e.passed);

        variantResults.results.push({
          exampleId: example.id,
          success: allPassed,
          latency,
          evaluations,
        });

        variantResults.metrics.totalRuns++;
        if (allPassed) {
          variantResults.metrics.passedRuns++;
        } else {
          variantResults.metrics.failedRuns++;
        }

        console.log(`   ✓ Example ${variantResults.metrics.totalRuns}/${examples.length} - Score: ${avgScore.toFixed(2)} (${latency}ms)`);
      } catch (error: any) {
        console.error(`   ✗ Example ${variantResults.metrics.totalRuns + 1} failed:`, error.message);

        variantResults.results.push({
          exampleId: example.id,
          success: false,
          latency: Date.now() - startTime,
          evaluations: {},
        });

        variantResults.metrics.totalRuns++;
        variantResults.metrics.failedRuns++;
      }
    }

    // Calculate aggregate metrics
    variantResults.metrics.successRate =
      variantResults.metrics.passedRuns / variantResults.metrics.totalRuns;

    variantResults.metrics.avgLatency =
      variantResults.results.reduce((sum, r) => sum + r.latency, 0) /
      variantResults.results.length;

    // Calculate average quality score across all evaluations
    let totalQualityScore = 0;
    let evaluationCount = 0;

    for (const testResult of variantResults.results) {
      for (const evalResult of Object.values(testResult.evaluations)) {
        totalQualityScore += (evalResult as EvaluationResult).score;
        evaluationCount++;
      }
    }

    variantResults.metrics.avgQualityScore =
      evaluationCount > 0 ? totalQualityScore / evaluationCount : 0;

    console.log(`\n📊 Variant "${variant.name}" Results:`);
    console.log(`   Success Rate: ${(variantResults.metrics.successRate * 100).toFixed(1)}%`);
    console.log(`   Avg Latency: ${variantResults.metrics.avgLatency.toFixed(0)}ms`);
    console.log(`   Avg Quality: ${(variantResults.metrics.avgQualityScore * 100).toFixed(1)}%`);

    result.variants.push(variantResults);
  }

  // Determine winner
  result.winner = selectWinner(result.variants, config.successCriteria);

  if (result.winner) {
    console.log(`\n🏆 Winner: ${result.winner.name}`);
    console.log(`   Confidence: ${(result.winner.confidence * 100).toFixed(1)}%`);
    console.log(`   Reason: ${result.winner.reason}`);
  } else {
    console.log('\n⚠️  No clear winner - results too close or criteria not met');
  }

  return result;
}

/**
 * Select winning variant based on metrics
 */
function selectWinner(
  variants: ExperimentResult['variants'],
  criteria?: ExperimentConfig['successCriteria']
): ExperimentResult['winner'] | undefined {
  // Filter variants that meet minimum criteria
  const qualifiedVariants = variants.filter(v => {
    if (criteria?.minSuccessRate && v.metrics.successRate < criteria.minSuccessRate) {
      return false;
    }
    if (criteria?.maxAvgLatency && v.metrics.avgLatency > criteria.maxAvgLatency) {
      return false;
    }
    if (criteria?.minQualityScore && v.metrics.avgQualityScore < criteria.minQualityScore) {
      return false;
    }
    return true;
  });

  if (qualifiedVariants.length === 0) {
    return undefined;
  }

  // Score each variant (weighted combination of metrics)
  const scores = qualifiedVariants.map(v => {
    const qualityScore = v.metrics.avgQualityScore * 0.5; // 50% weight
    const successScore = v.metrics.successRate * 0.3; // 30% weight
    const latencyScore = Math.max(0, 1 - v.metrics.avgLatency / 10000) * 0.2; // 20% weight (lower is better)

    return {
      variant: v,
      score: qualityScore + successScore + latencyScore,
    };
  });

  // Sort by score
  scores.sort((a, b) => b.score - a.score);

  const winner = scores[0];
  const runnerUp = scores[1];

  // Calculate confidence (how much better winner is than runner-up)
  const confidence = runnerUp
    ? (winner.score - runnerUp.score) / winner.score
    : 1.0;

  // Build reason
  const reasons: string[] = [];
  const v = winner.variant;

  if (v.metrics.avgQualityScore > 0.9) {
    reasons.push('excellent quality');
  } else if (v.metrics.avgQualityScore > 0.8) {
    reasons.push('high quality');
  }

  if (v.metrics.successRate > 0.95) {
    reasons.push('very reliable');
  } else if (v.metrics.successRate > 0.9) {
    reasons.push('reliable');
  }

  if (v.metrics.avgLatency < 500) {
    reasons.push('fast');
  } else if (v.metrics.avgLatency < 1000) {
    reasons.push('responsive');
  }

  return {
    name: winner.variant.name,
    promptName: winner.variant.promptName,
    confidence,
    reason: reasons.join(', ') || 'best overall performance',
  };
}

/**
 * Built-in evaluators
 */

export const builtInEvaluators = {
  /**
   * Check if output contains expected features
   */
  correctness: (expectedFields: string[]): EvaluatorConfig => ({
    name: 'correctness',
    type: 'correctness',
    evaluate: async (inputs, output, expected) => {
      let matchedFields = 0;

      for (const field of expectedFields) {
        if (expected && expected[field]) {
          // Check if output has similar value
          const outputValue = JSON.stringify(output).toLowerCase();
          const expectedValue = JSON.stringify(expected[field]).toLowerCase();

          if (outputValue.includes(expectedValue)) {
            matchedFields++;
          }
        }
      }

      const score = matchedFields / expectedFields.length;

      return {
        score,
        passed: score >= 0.8,
        reason: `Matched ${matchedFields}/${expectedFields.length} expected fields`,
        metadata: { matchedFields, expectedFields: expectedFields.length },
      };
    },
  }),

  /**
   * Check if output is complete (not truncated, has all sections)
   */
  completeness: (requiredSections: string[]): EvaluatorConfig => ({
    name: 'completeness',
    type: 'completeness',
    evaluate: async (inputs, output) => {
      const outputText = JSON.stringify(output).toLowerCase();
      let foundSections = 0;

      for (const section of requiredSections) {
        if (outputText.includes(section.toLowerCase())) {
          foundSections++;
        }
      }

      const score = foundSections / requiredSections.length;

      return {
        score,
        passed: score >= 0.8,
        reason: `Found ${foundSections}/${requiredSections.length} required sections`,
        metadata: { foundSections, requiredSections: requiredSections.length },
      };
    },
  }),

  /**
   * Check if output length is reasonable
   */
  lengthCheck: (minLength: number, maxLength?: number): EvaluatorConfig => ({
    name: 'length-check',
    type: 'custom',
    evaluate: async (inputs, output) => {
      const outputText = JSON.stringify(output);
      const length = outputText.length;

      const meetsMin = length >= minLength;
      const meetsMax = maxLength ? length <= maxLength : true;
      const passed = meetsMin && meetsMax;

      let score = 1.0;
      if (!meetsMin) score = Math.min(length / minLength, 1.0);
      if (!meetsMax && maxLength) score = Math.min(maxLength / length, 1.0);

      return {
        score,
        passed,
        reason: passed
          ? `Length OK (${length} chars)`
          : `Length ${length} (expected ${minLength}-${maxLength || '∞'})`,
        metadata: { length, minLength, maxLength },
      };
    },
  }),
};
