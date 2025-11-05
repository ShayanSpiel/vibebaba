# LangSmith A/B Testing Guide

Complete guide for using LangSmith datasets, prompts, and A/B testing in VibeBaba.

> **🤖 Want automatic A/B testing?** Check out [LANGSMITH_AUTOMATION.md](./LANGSMITH_AUTOMATION.md) for fully automated prompt optimization!

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Datasets](#datasets)
5. [Prompts & Prompt Hub](#prompts--prompt-hub)
6. [A/B Testing](#ab-testing)
7. [Automated Testing](#automated-testing) 🆕
8. [Evaluation & Analysis](#evaluation--analysis)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### What is LangSmith?

LangSmith is LangChain's observability and testing platform that provides:

- **Tracing**: Automatic logging of LLM calls and workflows ✅ (Already active)
- **Datasets**: Test case collections for evaluation
- **Prompts**: Version-controlled prompt templates
- **Experiments**: A/B testing and prompt comparison
- **Evaluation**: Automated testing and metrics

### What's Already Working

✅ **Tracing & Observability**
- All LangGraph workflow executions are automatically traced
- View traces at: https://smith.langchain.com/o/YOUR_ORG/projects/vibebaba-langgraph

### What's New

🆕 **Datasets**: Create test cases for your workflows
🆕 **Prompts**: Manage prompts in LangSmith Hub
🆕 **A/B Testing**: Compare prompt variants with real users

---

## Prerequisites

### Environment Setup

Your `.env.local` should have:

```bash
# LangSmith Configuration (already set)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_pt_...
LANGCHAIN_PROJECT=vibebaba-langgraph
```

### Verify Installation

Check that LangSmith is working:

```bash
# Run validation (optional - create this file if needed)
npx tsx lib/langsmith/validate-setup.ts
```

---

## Quick Start

### 1. Create Your First Dataset

```bash
# Create app generation test dataset
npm run langsmith:setup-dataset setup

# Create PM node specific dataset
npm run langsmith:setup-dataset setup-pm

# List all datasets
npm run langsmith:setup-dataset list
```

**What this does:**
- Creates a dataset named `vibebaba-app-gen-tests`
- Adds 5 example test cases (todo app, landing page, blog, dashboard, portfolio)
- Stores in LangSmith for evaluation

### 2. View Your Dataset

1. Go to https://smith.langchain.com
2. Navigate to "Datasets" tab
3. Click on `vibebaba-app-gen-tests`
4. View test cases with inputs/outputs

---

## Datasets

### What are Datasets?

Datasets are collections of test cases used to evaluate your AI workflows. Each test case contains:
- **Inputs**: What you send to the workflow (e.g., user description)
- **Expected Outputs**: What you expect to get back (e.g., features, pages)
- **Metadata**: Additional context (category, complexity, etc.)

### Creating Datasets Programmatically

```typescript
import { createDataset, addDatasetExample } from '@/lib/langsmith/client';

// Create dataset
const dataset = await createDataset(
  'my-test-dataset',
  'Test cases for feature X'
);

// Add examples
await addDatasetExample(
  dataset.id,
  {
    // Inputs
    userDescription: 'Build a todo app',
    userId: 'test-user-1',
  },
  {
    // Expected outputs
    needsBackend: true,
    complexity: 'simple',
  },
  {
    // Metadata
    category: 'productivity',
  }
);
```

### Using Datasets for Evaluation

```typescript
import { getDataset, listDatasetExamples } from '@/lib/langsmith/client';

// Load dataset
const dataset = await getDataset('vibebaba-app-gen-tests');

// Get all examples
const examples = await listDatasetExamples(dataset.id);

// Run your workflow against each example
for (const example of examples) {
  const result = await myWorkflow(example.inputs);

  // Compare result with example.outputs
  // Track metrics
}
```

---

## Prompts & Prompt Hub

### What is Prompt Hub?

LangSmith Prompt Hub is a version-controlled storage for prompts. Instead of hardcoding prompts in your code, you can:
- Store prompts centrally
- Version them (v1, v2, v3...)
- Update without code changes
- Share across team

### Creating Prompts in Hub

**Method 1: Via Web UI**

1. Go to https://smith.langchain.com/hub
2. Click "New Prompt"
3. Name it (e.g., `pm-planning-detailed`)
4. Add prompt template with variables:

```
{memoryContext}{searchContext}Create MVP plan for: "{requirements}"

App Type: {appType}
Complexity: {complexity}
MVP Features:
{mvpFeatures}

Generate:
- Overview (1-2 sentences)
- Core Features ({featureCount} features)
- Design Direction (visual style)
```

5. Save with tags (e.g., `pm-node`, `v1`, `detailed`)

**Method 2: Via SDK**

```typescript
import { getLangSmithClient } from '@/lib/langsmith/client';

const client = getLangSmithClient();

await client.pushPrompt('pm-planning-v1', {
  object: {
    template: 'Your prompt template here with {variables}',
    input_variables: ['requirements', 'appType', 'complexity'],
  },
  is_public: false, // Keep private
});
```

### Using Prompts in Code

```typescript
import { fetchPrompt, formatPrompt } from '@/lib/langsmith/prompt-manager';

// Fetch prompt from Hub
const prompt = await fetchPrompt('vibebaba/pm-planning-v1:latest');

// Format with variables
const formattedPrompt = formatPrompt(prompt, {
  requirements: 'Build a todo app',
  appType: 'productivity',
  complexity: 'simple',
});

// Use in AI call
const result = await generateWithAI(formattedPrompt);
```

### Prompt Naming Convention

Format: `owner/prompt-name:version`

Examples:
- `vibebaba/pm-planning-v1:latest`
- `vibebaba/pm-planning-v2:latest`
- `vibebaba/pm-planning-v1:3` (specific version number)

---

## A/B Testing

### What is A/B Testing for Prompts?

A/B testing lets you compare different prompt variants to see which performs better:
- **Variant A**: Detailed, comprehensive planning
- **Variant B**: Concise, bullet-point planning

The system automatically:
- Splits traffic between variants
- Tracks metrics (latency, tokens, success rate)
- Shows which variant performs better

### Setting Up A/B Tests

**Step 1: Create Prompt Variants in Hub**

Create two prompts:
1. `vibebaba/pm-planning-v1:latest` (Detailed version)
2. `vibebaba/pm-planning-v2:latest` (Concise version)

**Step 2: Configure A/B Test**

Edit `lib/langsmith/ab-test-config.ts`:

```typescript
export const PM_PLANNING_AB_TEST: ABTestConfig = {
  enabled: true, // Enable A/B testing
  strategy: 'user-hash', // Consistent per user
  variants: [
    {
      name: 'v1-detailed',
      promptName: 'vibebaba/pm-planning-v1:latest',
      weight: 50, // 50% of users
    },
    {
      name: 'v2-concise',
      promptName: 'vibebaba/pm-planning-v2:latest',
      weight: 50, // 50% of users
    },
  ],
};
```

**Step 3: Integrate into Node**

See `lib/langsmith/pm-node-integration-example.ts` for complete integration example.

Key changes to make in `lib/langgraph/nodes/pm-node.ts`:

```typescript
// Add imports
import {
  fetchPromptWithABTest,
  formatPrompt,
  trackPromptMetrics,
} from '@/lib/langsmith/prompt-manager';
import { PM_PLANNING_AB_TEST } from '@/lib/langsmith/ab-test-config';

// Replace planning prompt section (around line 272)
if (PM_PLANNING_AB_TEST.enabled) {
  const { prompt, variant } = await fetchPromptWithABTest(
    PM_PLANNING_AB_TEST,
    state.userId
  );

  planPrompt = formatPrompt(prompt, {
    requirements,
    appType: context.appType,
    // ... other variables
  });

  // Track metrics
  await trackPromptMetrics({
    promptName: 'pm-planning',
    variant,
    latencyMs: Date.now() - startTime,
    success: true,
    userId: state.userId,
  });
}
```

### A/B Testing Strategies

**1. Random Strategy**
```typescript
strategy: 'random' // Different variant each time
```
- Pros: True randomization
- Cons: Same user may see different variants

**2. User Hash Strategy**
```typescript
strategy: 'user-hash' // Same variant per user
```
- Pros: Consistent experience per user
- Cons: Requires userId

### Adjusting Traffic Split

```typescript
variants: [
  { name: 'control', promptName: '...', weight: 70 }, // 70%
  { name: 'test', promptName: '...', weight: 30 },    // 30%
]
```

---

## Automated Testing

### 🤖 Want Zero-Effort A/B Testing?

Instead of manually running experiments, you can enable **fully automated prompt optimization**:

```bash
# Run automated experiment once
npm run langsmith:auto-experiment

# Enable continuous optimization (runs every 24 hours)
npm run langsmith:continuous-opt
```

**What it does:**
1. ✅ Automatically runs experiments against datasets
2. ✅ Compares all variants
3. ✅ Selects winner based on metrics
4. ✅ Auto-promotes winner to production
5. ✅ Sends notifications
6. ✅ Repeats on schedule

**Learn more:** [LANGSMITH_AUTOMATION.md](./LANGSMITH_AUTOMATION.md)

### Quick Example

```bash
# 1. Create dataset
npm run langsmith:setup-dataset setup-pm

# 2. Run automated test
npm run langsmith:auto-experiment
```

**Output:**
```
🧪 Testing variant: v1-detailed
   ✓ Example 1/5 - Score: 0.89 (850ms)
   ...
📊 Results: Success 100%, Latency 820ms, Quality 90.5%

🧪 Testing variant: v2-concise
   ✓ Example 1/5 - Score: 0.91 (650ms)
   ...
📊 Results: Success 100%, Latency 680ms, Quality 88.2%

🏆 Winner: v2-concise (78.5% confidence)
🚀 Auto-promoted to 70% traffic
```

**That's it!** Config auto-updated, no manual work needed.

---

## Evaluation & Analysis

### Viewing Results in LangSmith

**1. Traces View**
- Go to Projects → `vibebaba-langgraph`
- Filter by metadata: `variant:v1-detailed` or `variant:v2-concise`
- Compare traces side-by-side

**2. Metrics Dashboard**
- Check console logs for tracked metrics
- Aggregate manually or export to analytics

**3. Experiments Tab** (Coming soon in LangSmith)
- Automated comparison of variants
- Statistical significance testing

### Manual Analysis

```typescript
import { listDatasetExamples } from '@/lib/langsmith/client';

// Get all PM planning test cases
const examples = await listDatasetExamples('pm-node-dataset-id');

// Run each variant
const results = {
  v1: [],
  v2: [],
};

for (const example of examples) {
  // Test variant 1
  const result1 = await testWithVariant('v1', example.inputs);
  results.v1.push(result1);

  // Test variant 2
  const result2 = await testWithVariant('v2', example.inputs);
  results.v2.push(result2);
}

// Compare metrics
console.log('V1 avg latency:', avgLatency(results.v1));
console.log('V2 avg latency:', avgLatency(results.v2));
```

### Key Metrics to Track

| Metric | What it Measures | Goal |
|--------|------------------|------|
| **Latency** | Response time | Lower is better |
| **Tokens** | API cost | Lower is better |
| **Success Rate** | No errors | Higher is better |
| **Quality** | User feedback | Higher is better |

---

## Troubleshooting

### Issue: "LANGCHAIN_API_KEY not found"

**Solution:**
```bash
# Check .env.local
cat .env.local | grep LANGCHAIN_API_KEY

# If missing, add it:
echo "LANGCHAIN_API_KEY=lsv2_pt_YOUR_KEY" >> .env.local
```

### Issue: "Failed to fetch prompt from Hub"

**Possible causes:**
1. Prompt doesn't exist in Hub
2. Prompt is private and you don't have access
3. Incorrect prompt name format

**Solution:**
```typescript
// Check prompt exists
const client = getLangSmithClient();
const prompt = await client.pullPrompt('vibebaba/pm-planning-v1:latest');
```

### Issue: "Variant weights don't sum to 100"

**Solution:**
```typescript
// Fix weights in ab-test-config.ts
variants: [
  { name: 'v1', promptName: '...', weight: 60 }, // Must sum to 100
  { name: 'v2', promptName: '...', weight: 40 },
]
```

### Issue: Dataset creation fails

**Solution:**
```bash
# Check if dataset already exists
npm run langsmith:setup-dataset list

# If exists, delete first via LangSmith UI or:
import { deleteDataset } from '@/lib/langsmith/client';
await deleteDataset('dataset-id');
```

### Enable Debug Logging

```typescript
// In any file using LangSmith
process.env.LANGSMITH_DEBUG = 'true';
```

---

## Best Practices

### 1. Start Small
- Test with A/B testing **disabled** first
- Verify fallback prompts work
- Enable A/B testing after confirming setup

### 2. Version Your Prompts
- Use semantic versioning (v1, v2, v3)
- Tag prompts with metadata (`pm-node`, `production`)
- Keep old versions for rollback

### 3. Gradual Rollout
- Start with 90/10 split (90% control, 10% test)
- Increase test traffic as confidence grows
- Monitor metrics closely

### 4. Track Everything
- Log prompt variant in every trace
- Track latency, tokens, errors
- Export metrics to analytics platform

### 5. Use Datasets
- Create datasets for critical workflows
- Run evaluation before deploying new prompts
- Catch regressions early

---

## Advanced: Running Experiments

### Batch Evaluation

```typescript
// lib/langsmith/evaluation.ts (create this file)
import { getDataset, listDatasetExamples } from './client';
import { fetchPrompt, formatPrompt } from './prompt-manager';

export async function runExperiment(config: {
  datasetName: string;
  promptName: string;
  runWorkflow: (inputs: any) => Promise<any>;
}) {
  const dataset = await getDataset(config.datasetName);
  const examples = await listDatasetExamples(dataset.id);
  const prompt = await fetchPrompt(config.promptName);

  const results = [];

  for (const example of examples) {
    const startTime = Date.now();

    try {
      const result = await config.runWorkflow(example.inputs);

      results.push({
        example: example.id,
        success: true,
        latency: Date.now() - startTime,
        output: result,
      });
    } catch (error: any) {
      results.push({
        example: example.id,
        success: false,
        latency: Date.now() - startTime,
        error: error.message,
      });
    }
  }

  return {
    promptName: config.promptName,
    datasetName: config.datasetName,
    totalExamples: examples.length,
    successRate: results.filter(r => r.success).length / results.length,
    avgLatency: results.reduce((sum, r) => sum + r.latency, 0) / results.length,
    results,
  };
}
```

### Usage:

```typescript
const results = await runExperiment({
  datasetName: 'vibebaba-pm-node-tests',
  promptName: 'vibebaba/pm-planning-v2:latest',
  runWorkflow: async (inputs) => {
    // Your workflow logic here
    return await pmNode(inputs);
  },
});

console.log('Experiment Results:', results);
```

---

## Summary

### What You Can Do Now

✅ Create datasets for testing
✅ Store prompts in LangSmith Hub
✅ Run A/B tests with different prompt variants
✅ Track metrics and compare performance
✅ Evaluate prompts against test datasets

### Next Steps

1. **Create your first dataset**
   ```bash
   npm run langsmith:setup-dataset setup
   ```

2. **Create prompts in Hub**
   - Go to https://smith.langchain.com/hub
   - Create `pm-planning-v1` and `pm-planning-v2`

3. **Enable A/B testing**
   - Update `lib/langsmith/ab-test-config.ts`
   - Set `enabled: true`

4. **Monitor results**
   - Check console logs for variant selection
   - View traces in LangSmith dashboard

---

## Support

### Resources

- **LangSmith Docs**: https://docs.smith.langchain.com
- **Prompt Hub**: https://smith.langchain.com/hub
- **Your Dashboard**: https://smith.langchain.com/o/YOUR_ORG

### Need Help?

- Check [Troubleshooting](#troubleshooting) section
- Review code examples in `lib/langsmith/pm-node-integration-example.ts`
- Enable debug logging: `LANGSMITH_DEBUG=true`

---

**Last Updated**: 2025-01-04
**Version**: 1.0.0
