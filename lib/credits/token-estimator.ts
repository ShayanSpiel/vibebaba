// lib/credits/token-estimator.ts
// PHASE 3: Accurate Token Estimation using tiktoken
import { encoding_for_model } from 'tiktoken';

export class TokenEstimator {
  private encoder;

  constructor(model: string = 'gpt-4') {
    this.encoder = encoding_for_model(model as any);
  }

  /**
   * Accurately count tokens in text using tiktoken
   */
  countTokens(text: string): number {
    return this.encoder.encode(text).length;
  }

  /**
   * Estimate tokens for a complete prompt
   */
  estimatePromptTokens(prompt: string, systemPrompt?: string): number {
    let total = this.countTokens(prompt);

    if (systemPrompt) {
      total += this.countTokens(systemPrompt);
    }

    // Add message formatting overhead (~4 tokens per message)
    total += 4;

    return total;
  }

  /**
   * Estimate tokens for a conversation (chat format)
   */
  estimateConversationTokens(messages: Array<{ role: string; content: string }>): number {
    let total = 0;

    for (const message of messages) {
      total += this.countTokens(message.content);
      total += 4; // Message formatting overhead
    }

    return total;
  }

  /**
   * Estimate tokens for specific agentic node types
   */
  estimateNodeCost(nodeName: string, context: any): number {
    switch (nodeName) {
      case 'pm':
        // PM node: requirements analysis
        return (
          this.estimatePromptTokens(context.requirements || '', 'Product Manager System Prompt') +
          2000
        ); // Expected completion

      case 'ux':
        // UX node: design planning
        return this.estimatePromptTokens(context.plan || '', 'UX Designer System Prompt') + 3000;

      case 'frontend': {
        // Frontend: code generation (largest)
        const designTokens = this.countTokens(JSON.stringify(context.design || {}));
        return designTokens + 8000;
      }

      case 'backend':
        // Backend: API + schema
        return (
          this.estimatePromptTokens(
            JSON.stringify(context.schema || {}),
            'Backend Developer System Prompt'
          ) + 6000
        );

      case 'editor': {
        // Editor: code modifications
        const codeTokens = this.countTokens(context.code || '');
        return codeTokens + 4000;
      }

      case 'chat':
        // Simple chat message
        if (context.messages) {
          return this.estimateConversationTokens(context.messages) + 1000;
        }
        return 5000;

      default:
        // Default conservative estimate
        return 5000;
    }
  }

  /**
   * Estimate total cost for a complete workflow
   */
  estimateWorkflowCost(workflow: { nodes: Array<{ name: string; context: any }> }): {
    total: number;
    breakdown: Record<string, number>;
  } {
    const breakdown: Record<string, number> = {};
    let total = 0;

    for (const node of workflow.nodes) {
      const cost = this.estimateNodeCost(node.name, node.context);
      breakdown[node.name] = cost;
      total += cost;
    }

    // Add 20% safety buffer to prevent edge case failures
    total = Math.ceil(total * 1.2);

    return { total, breakdown };
  }

  /**
   * Convert token count to USD cost
   */
  tokensToCost(
    tokens: number,
    modelPricing: {
      inputCostPerMillion: number;
      outputCostPerMillion: number;
    }
  ): number {
    // Assume 70% input, 30% output (typical distribution)
    const inputTokens = tokens * 0.7;
    const outputTokens = tokens * 0.3;

    const inputCost = (inputTokens / 1000000) * modelPricing.inputCostPerMillion;
    const outputCost = (outputTokens / 1000000) * modelPricing.outputCostPerMillion;

    return inputCost + outputCost;
  }

  /**
   * Clean up encoder when done
   */
  free() {
    this.encoder.free();
  }
}

// Singleton instance
let estimatorInstance: TokenEstimator | null = null;

export function getTokenEstimator(model?: string): TokenEstimator {
  if (!estimatorInstance || (model && model !== 'gpt-4')) {
    if (estimatorInstance) {
      estimatorInstance.free();
    }
    estimatorInstance = new TokenEstimator(model);
  }
  return estimatorInstance;
}
