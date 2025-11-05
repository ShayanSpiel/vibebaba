/**
 * PROMPT STRATEGY COMPARISON METRICS
 *
 * Track performance between old verbose prompts vs new simplified approach
 */

export interface PromptMetrics {
  strategy: 'verbose' | 'simplified';
  timestamp: Date;
  projectId: string;

  // Token usage
  frontendPromptTokens: number;
  autogenPromptTokens?: number;

  // Generation results
  filesGenerated: number;
  totalCodeSize: number;
  generationTimeMs: number;

  // Validation results
  initialErrors: number;
  initialWarnings: number;
  autoFixedErrors: number;

  // AutoGen results (if triggered)
  autogenAttempts: number;
  autogenSuccess: boolean;
  finalErrors: number;

  // Quality metrics
  validationPassed: boolean;
  requiresAutogen: boolean;
}

class PromptMetricsTracker {
  private metrics: PromptMetrics[] = [];

  /**
   * Log metrics for a generation
   */
  logMetrics(metrics: PromptMetrics) {
    this.metrics.push(metrics);

    // Log summary
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 PROMPT STRATEGY METRICS (${metrics.strategy.toUpperCase()})`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📝 Frontend Prompt: ${metrics.frontendPromptTokens} tokens`);
    console.log(`⏱️  Generation Time: ${metrics.generationTimeMs}ms`);
    console.log(`📄 Files Generated: ${metrics.filesGenerated}`);
    console.log(`📦 Code Size: ${metrics.totalCodeSize} chars`);
    console.log(`❌ Initial Errors: ${metrics.initialErrors}`);
    console.log(`✅ Auto-Fixed: ${metrics.autoFixedErrors}`);
    console.log(`🔧 AutoGen Needed: ${metrics.requiresAutogen ? 'YES' : 'NO'}`);

    if (metrics.requiresAutogen) {
      console.log(`🔄 AutoGen Attempts: ${metrics.autogenAttempts}`);
      console.log(`✓  AutoGen Success: ${metrics.autogenSuccess ? 'YES' : 'NO'}`);
    }

    console.log(`🎯 Final Result: ${metrics.validationPassed ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  }

  /**
   * Get comparison statistics
   */
  getComparison() {
    const verboseMetrics = this.metrics.filter(m => m.strategy === 'verbose');
    const simplifiedMetrics = this.metrics.filter(m => m.strategy === 'simplified');

    if (verboseMetrics.length === 0 || simplifiedMetrics.length === 0) {
      return null;
    }

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    const verboseAvg = {
      tokens: avg(verboseMetrics.map(m => m.frontendPromptTokens)),
      time: avg(verboseMetrics.map(m => m.generationTimeMs)),
      errors: avg(verboseMetrics.map(m => m.initialErrors)),
      successRate: verboseMetrics.filter(m => m.validationPassed).length / verboseMetrics.length
    };

    const simplifiedAvg = {
      tokens: avg(simplifiedMetrics.map(m => m.frontendPromptTokens)),
      time: avg(simplifiedMetrics.map(m => m.generationTimeMs)),
      errors: avg(simplifiedMetrics.map(m => m.initialErrors)),
      successRate: simplifiedMetrics.filter(m => m.validationPassed).length / simplifiedMetrics.length
    };

    return {
      verbose: verboseAvg,
      simplified: simplifiedAvg,
      improvement: {
        tokenReduction: ((verboseAvg.tokens - simplifiedAvg.tokens) / verboseAvg.tokens * 100).toFixed(1),
        timeImprovement: ((verboseAvg.time - simplifiedAvg.time) / verboseAvg.time * 100).toFixed(1),
        errorReduction: ((verboseAvg.errors - simplifiedAvg.errors) / verboseAvg.errors * 100).toFixed(1),
        successRateChange: ((simplifiedAvg.successRate - verboseAvg.successRate) * 100).toFixed(1)
      }
    };
  }

  /**
   * Print comparison report
   */
  printComparison() {
    const comparison = this.getComparison();

    if (!comparison) {
      console.log('⚠️  Not enough data for comparison (need both verbose and simplified runs)');
      return;
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 VERBOSE vs SIMPLIFIED COMPARISON`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\n📝 PROMPT TOKENS:`);
    console.log(`   Verbose:    ${comparison.verbose.tokens.toFixed(0)} tokens`);
    console.log(`   Simplified: ${comparison.simplified.tokens.toFixed(0)} tokens`);
    console.log(`   💰 Reduction: ${comparison.improvement.tokenReduction}%`);

    console.log(`\n⏱️  GENERATION TIME:`);
    console.log(`   Verbose:    ${comparison.verbose.time.toFixed(0)}ms`);
    console.log(`   Simplified: ${comparison.simplified.time.toFixed(0)}ms`);
    console.log(`   ⚡ Improvement: ${comparison.improvement.timeImprovement}%`);

    console.log(`\n❌ INITIAL ERRORS:`);
    console.log(`   Verbose:    ${comparison.verbose.errors.toFixed(1)} errors`);
    console.log(`   Simplified: ${comparison.simplified.errors.toFixed(1)} errors`);
    console.log(`   ✅ Reduction: ${comparison.improvement.errorReduction}%`);

    console.log(`\n🎯 SUCCESS RATE:`);
    console.log(`   Verbose:    ${(comparison.verbose.successRate * 100).toFixed(1)}%`);
    console.log(`   Simplified: ${(comparison.simplified.successRate * 100).toFixed(1)}%`);
    console.log(`   📈 Change: ${comparison.improvement.successRateChange}%`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  }
}

// Singleton instance
export const metricsTracker = new PromptMetricsTracker();
