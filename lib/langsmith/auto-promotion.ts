// lib/langsmith/auto-promotion.ts
/**
 * Automatic Prompt Promotion System
 *
 * Automatically promotes winning prompts to production:
 * - Updates A/B test config with winner
 * - Sends notifications about changes
 * - Tracks promotion history
 * - Supports gradual rollout
 */

import fs from 'fs';
import path from 'path';
import type { ExperimentResult } from './auto-experiment';
import type { ABTestConfig } from './prompt-manager';

/**
 * Promotion strategy
 */
export type PromotionStrategy =
  | 'immediate' // 100% traffic immediately
  | 'gradual' // Gradual rollout (70/30, then 100/0)
  | 'canary' // Small percentage first (10%), then increase
  | 'manual'; // Don't auto-promote, just notify

/**
 * Promotion configuration
 */
export interface PromotionConfig {
  strategy: PromotionStrategy;
  minConfidence?: number; // e.g., 0.7 (70% confidence required)
  notifyOnPromotion?: boolean;
  rolloutSteps?: number[]; // For gradual strategy, e.g., [50, 70, 90, 100]
}

/**
 * Promotion result
 */
export interface PromotionResult {
  promoted: boolean;
  strategy: PromotionStrategy;
  winner?: {
    name: string;
    promptName: string;
  };
  configPath?: string;
  changes?: {
    before: ABTestConfig;
    after: ABTestConfig;
  };
  reason: string;
  timestamp: string;
}

/**
 * Promote winning prompt to production
 */
export async function promoteWinner(
  experimentResult: ExperimentResult,
  config: PromotionConfig,
  configFilePath: string = 'lib/langsmith/ab-test-config.ts'
): Promise<PromotionResult> {
  console.log('\n🚀 [AutoPromotion] Evaluating promotion...');

  const result: PromotionResult = {
    promoted: false,
    strategy: config.strategy,
    reason: '',
    timestamp: new Date().toISOString(),
  };

  // Check if there's a winner
  if (!experimentResult.winner) {
    result.reason = 'No winner selected from experiment';
    console.log(`   ℹ️  ${result.reason}`);
    return result;
  }

  const winner = experimentResult.winner;

  // Check confidence threshold
  if (config.minConfidence && winner.confidence < config.minConfidence) {
    result.reason = `Winner confidence ${(winner.confidence * 100).toFixed(1)}% below threshold ${(config.minConfidence * 100).toFixed(1)}%`;
    console.log(`   ⚠️  ${result.reason}`);
    return result;
  }

  result.winner = {
    name: winner.name,
    promptName: winner.promptName,
  };

  // Manual strategy - don't promote
  if (config.strategy === 'manual') {
    result.reason = `Manual promotion required. Winner: ${winner.name} (${(winner.confidence * 100).toFixed(1)}% confidence)`;
    console.log(`   ℹ️  ${result.reason}`);

    if (config.notifyOnPromotion) {
      await sendPromotionNotification(result, experimentResult);
    }

    return result;
  }

  // Read current config
  const fullPath = path.join(process.cwd(), configFilePath);

  try {
    const configContent = fs.readFileSync(fullPath, 'utf-8');

    // Extract current AB test config (simple regex approach)
    const configMatch = configContent.match(
      /export const PM_PLANNING_AB_TEST: ABTestConfig = ({[\s\S]*?});/
    );

    if (!configMatch) {
      result.reason = 'Could not find PM_PLANNING_AB_TEST in config file';
      console.log(`   ❌ ${result.reason}`);
      return result;
    }

    // Determine new weights based on strategy
    let newWeights: Record<string, number> = {};

    switch (config.strategy) {
      case 'immediate':
        // Winner gets 100%
        newWeights[winner.name] = 100;
        break;

      case 'gradual':
        // Winner gets 70%, others split remaining 30%
        const loserCount = experimentResult.variants.length - 1;
        newWeights[winner.name] = 70;
        for (const variant of experimentResult.variants) {
          if (variant.name !== winner.name) {
            newWeights[variant.name] = 30 / loserCount;
          }
        }
        break;

      case 'canary':
        // Winner gets 10%, control keeps 90%
        newWeights[winner.name] = 10;
        for (const variant of experimentResult.variants) {
          if (variant.name !== winner.name) {
            newWeights[variant.name] = 90 / (experimentResult.variants.length - 1);
          }
        }
        break;
    }

    // Build new config
    const newConfigContent = buildNewConfig(configContent, newWeights, experimentResult);

    // Write new config
    fs.writeFileSync(fullPath, newConfigContent, 'utf-8');

    result.promoted = true;
    result.configPath = fullPath;
    result.reason = `Promoted ${winner.name} with ${config.strategy} strategy`;

    console.log(`   ✅ ${result.reason}`);
    console.log(`   📝 Updated: ${configFilePath}`);
    console.log(`   🎯 New weights:`, newWeights);

    // Send notification
    if (config.notifyOnPromotion) {
      await sendPromotionNotification(result, experimentResult);
    }

    return result;
  } catch (error: any) {
    result.reason = `Failed to promote: ${error.message}`;
    console.error(`   ❌ ${result.reason}`);
    return result;
  }
}

/**
 * Build new config content with updated weights
 */
function buildNewConfig(
  currentContent: string,
  newWeights: Record<string, number>,
  experimentResult: ExperimentResult
): string {
  // Add comment about auto-promotion
  const promotionComment = `
/**
 * AUTO-PROMOTED: ${new Date().toISOString()}
 * Experiment: ${experimentResult.experimentName}
 * Winner: ${experimentResult.winner?.name}
 * Reason: ${experimentResult.winner?.reason}
 * Confidence: ${((experimentResult.winner?.confidence || 0) * 100).toFixed(1)}%
 */
`;

  // Find and replace the config
  const newContent = currentContent.replace(
    /export const PM_PLANNING_AB_TEST: ABTestConfig = ({[\s\S]*?});/,
    (match) => {
      // Update weights in the variants array
      let updatedConfig = match;

      for (const [variantName, weight] of Object.entries(newWeights)) {
        // Find variant and update weight
        updatedConfig = updatedConfig.replace(
          new RegExp(`name: ['"]${variantName}['"],\\s*promptName: [^,]+,\\s*weight: \\d+`, 'g'),
          (variantMatch) => {
            return variantMatch.replace(/weight: \d+/, `weight: ${Math.round(weight)}`);
          }
        );
      }

      return promotionComment + updatedConfig;
    }
  );

  return newContent;
}

/**
 * Send promotion notification
 */
async function sendPromotionNotification(
  promotion: PromotionResult,
  experiment: ExperimentResult
) {
  console.log('\n📧 [Notification] Sending promotion alert...');

  const message = `
🚀 Prompt Promotion Alert

Experiment: ${experiment.experimentName}
Strategy: ${promotion.strategy}
Promoted: ${promotion.promoted ? 'Yes' : 'No'}

${promotion.winner ? `
Winner: ${promotion.winner.name}
Prompt: ${promotion.winner.promptName}
Confidence: ${((experiment.winner?.confidence || 0) * 100).toFixed(1)}%
Reason: ${experiment.winner?.reason}
` : ''}

Reason: ${promotion.reason}
Timestamp: ${promotion.timestamp}

View results in LangSmith dashboard.
  `.trim();

  console.log(message);

  // TODO: Integrate with your notification system
  // - Send email
  // - Post to Slack
  // - Create dashboard notification
  // - Log to database

  // Example Slack webhook (uncomment and configure)
  // if (process.env.SLACK_WEBHOOK_URL) {
  //   await fetch(process.env.SLACK_WEBHOOK_URL, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ text: message }),
  //   });
  // }
}

/**
 * Rollback to previous config
 */
export async function rollbackPromotion(
  configFilePath: string = 'lib/langsmith/ab-test-config.ts',
  backupSuffix: string = '.backup'
): Promise<boolean> {
  console.log('\n⏮️  [AutoPromotion] Rolling back...');

  const fullPath = path.join(process.cwd(), configFilePath);
  const backupPath = fullPath + backupSuffix;

  try {
    if (!fs.existsSync(backupPath)) {
      console.log('   ❌ No backup found');
      return false;
    }

    const backup = fs.readFileSync(backupPath, 'utf-8');
    fs.writeFileSync(fullPath, backup, 'utf-8');

    console.log('   ✅ Rolled back to previous config');
    return true;
  } catch (error: any) {
    console.error('   ❌ Rollback failed:', error.message);
    return false;
  }
}

/**
 * Create backup of current config
 */
export function backupConfig(
  configFilePath: string = 'lib/langsmith/ab-test-config.ts'
): boolean {
  const fullPath = path.join(process.cwd(), configFilePath);
  const backupPath = fullPath + '.backup';

  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    fs.writeFileSync(backupPath, content, 'utf-8');
    console.log('   ✅ Config backed up');
    return true;
  } catch (error: any) {
    console.error('   ❌ Backup failed:', error.message);
    return false;
  }
}
