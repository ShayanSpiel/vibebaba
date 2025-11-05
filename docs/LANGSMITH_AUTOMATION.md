# LangSmith Automated A/B Testing

🤖 Fully automated prompt optimization with zero manual intervention.

---

## What is Automated A/B Testing?

Instead of manually running experiments and updating configs, the system **automatically**:

1. ✅ Runs experiments against your test datasets
2. ✅ Compares prompt variants (v1 vs v2 vs v3...)
3. ✅ Scores results using multiple evaluators
4. ✅ Selects the winner based on metrics
5. ✅ Promotes winner to production
6. ✅ Sends notifications about changes
7. ✅ Runs continuously on a schedule

**You literally set it and forget it.**

---

## Quick Start (3 Commands)

### 1. Create Dataset
```bash
npm run langsmith:setup-dataset setup-pm
```

### 2. Run Automated Experiment
```bash
npm run langsmith:auto-experiment
```

**What happens:**
- Loads test cases from dataset
- Tests both prompt variants (v1 & v2)
- Runs evaluators on each result
- Calculates metrics (success rate, latency, quality)
- Selects winner
- **Auto-updates** `ab-test-config.ts` with winner
- Prints report

### 3. Enable Continuous Optimization (Optional)
```bash
npm run langsmith:continuous-opt
```

**What happens:**
- Runs experiments every 24 hours automatically
- Auto-promotes winners
- Saves results to `.langsmith-results/`
- Keeps optimizing forever

---

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Automated A/B Testing                     │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
              ┌─────▼──────┐      ┌────▼─────┐
              │ Experiment │      │ Dataset  │
              │  Runner    │◄─────┤ Loader   │
              └─────┬──────┘      └──────────┘
                    │
          ┌─────────┼─────────┐
          │         │         │
     ┌────▼───┐ ┌──▼───┐ ┌───▼────┐
     │Variant │ │Variant│ │Variant │
     │   1    │ │   2   │ │   3    │
     └────┬───┘ └──┬───┘ └───┬────┘
          │        │         │
          └────────┼─────────┘
                   │
            ┌──────▼──────┐
            │ Evaluators  │
            │ - Correctness
            │ - Completeness
            │ - Latency
            │ - Quality
            └──────┬──────┘
                   │
            ┌──────▼──────┐
            │   Scoring   │
            │  & Winner   │
            │  Selection  │
            └──────┬──────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
   ┌────▼───┐ ┌───▼────┐ ┌───▼─────┐
   │Auto-   │ │Results │ │Notifi-  │
   │Promote │ │Logging │ │cations  │
   └────────┘ └────────┘ └─────────┘
```

---

## Configuration

Edit `lib/langsmith/run-auto-experiment.ts` to configure:

### 1. Define Experiment

```typescript
const PM_PLANNING_EXPERIMENT: ExperimentConfig = {
  name: 'pm-planning-ab-test',
  datasetName: 'vibebaba-pm-node-tests',

  // Variants to test
  variants: [
    { name: 'v1-detailed', promptName: 'vibebaba/pm-planning-v1:latest' },
    { name: 'v2-concise', promptName: 'vibebaba/pm-planning-v2:latest' },
    { name: 'v3-balanced', promptName: 'vibebaba/pm-planning-v3:latest' }, // Add more!
  ],

  // Your workflow function
  runWorkflow: mockPMWorkflow,

  // Evaluators
  evaluators: [
    builtInEvaluators.correctness(['needsBackend', 'appType']),
    builtInEvaluators.completeness(['plan', 'features']),
    builtInEvaluators.lengthCheck(100, 5000),
  ],

  // Success criteria
  successCriteria: {
    minSuccessRate: 0.9,  // 90% success required
    maxAvgLatency: 2000,  // Max 2s latency
    minQualityScore: 0.8, // 80% quality required
  },
};
```

### 2. Configure Promotion

```typescript
const PROMOTION_CONFIG: PromotionConfig = {
  strategy: 'gradual',     // 'immediate' | 'gradual' | 'canary' | 'manual'
  minConfidence: 0.6,      // 60% confidence required
  notifyOnPromotion: true, // Send notifications
};
```

**Promotion Strategies:**

| Strategy | Behavior | Use When |
|----------|----------|----------|
| `immediate` | Winner gets 100% traffic immediately | Very confident in results |
| `gradual` | Winner gets 70%, losers share 30% | Safe default (recommended) |
| `canary` | Winner gets 10%, control keeps 90% | Testing cautiously |
| `manual` | Don't auto-promote, just notify | Want manual review |

---

## Built-in Evaluators

### Correctness Evaluator
Checks if output contains expected fields:

```typescript
builtInEvaluators.correctness(['needsBackend', 'appType', 'complexity'])
```

**Scores:** 0-1 based on how many expected fields matched

### Completeness Evaluator
Checks if output has required sections:

```typescript
builtInEvaluators.completeness(['plan', 'features', 'designDirection'])
```

**Scores:** 0-1 based on how many sections found

### Length Check Evaluator
Checks if output length is reasonable:

```typescript
builtInEvaluators.lengthCheck(100, 5000) // Min 100, max 5000 chars
```

**Scores:** 0-1 based on whether length is in range

### Custom Evaluator
Create your own:

```typescript
{
  name: 'custom-quality',
  type: 'custom',
  evaluate: async (inputs, output, expected) => {
    // Your custom logic
    const score = calculateQuality(output);

    return {
      score: score,        // 0-1
      passed: score >= 0.8,
      reason: 'Custom quality check',
    };
  },
}
```

---

## Running Experiments

### One-Time Run

```bash
npm run langsmith:auto-experiment
```

**Output:**
```
🧪 [AutoExperiment] Starting: pm-planning-ab-test
📦 Dataset: vibebaba-pm-node-tests
🔬 Variants: v1-detailed, v2-concise

📋 Loaded 5 test cases

🧪 Testing variant: v1-detailed
   Prompt: vibebaba/pm-planning-v1:latest
   ✓ Example 1/5 - Score: 0.89 (850ms)
   ✓ Example 2/5 - Score: 0.92 (780ms)
   ...

📊 Variant "v1-detailed" Results:
   Success Rate: 100.0%
   Avg Latency: 820ms
   Avg Quality: 90.5%

🧪 Testing variant: v2-concise
   ...

🏆 Winner: v2-concise
   Confidence: 78.5%
   Reason: high quality, fast

🚀 Attempting auto-promotion...
   ✅ Promoted "v2-concise" with gradual strategy
   📝 Updated: lib/langsmith/ab-test-config.ts
   🎯 New weights: { v2-concise: 70, v1-detailed: 30 }

✅ SUCCESS!
```

### Continuous Mode

```bash
npm run langsmith:continuous-opt
```

**Runs every 24 hours automatically.** Results saved to `.langsmith-results/`

---

## Metrics & Scoring

### How Winners Are Selected

Each variant gets a **composite score**:

```
Score = (Quality × 0.5) + (Success Rate × 0.3) + (Latency Score × 0.2)
```

**Weights:**
- Quality: 50% (most important)
- Success Rate: 30%
- Latency: 20% (faster is better)

**Winner Selection:**
1. Filter variants that meet `successCriteria`
2. Calculate composite score for each
3. Select highest score
4. Check confidence (difference vs runner-up)
5. If confidence > threshold → promote

### Confidence Calculation

```
Confidence = (Winner Score - Runner-Up Score) / Winner Score
```

**Example:**
- Winner: 0.85
- Runner-Up: 0.70
- Confidence: (0.85 - 0.70) / 0.85 = **17.6%**

**Low confidence?** Results are too close, need more data.

---

## Auto-Promotion

### How It Works

1. **Backup Current Config**
   - Creates `ab-test-config.ts.backup`

2. **Check Winner Meets Criteria**
   - Confidence > `minConfidence`?
   - Meets success criteria?

3. **Update Config File**
   - Writes new weights to `ab-test-config.ts`
   - Adds comment with experiment details

4. **Send Notification**
   - Logs to console
   - (Optional) Send to Slack/Email

### Rollback

If something goes wrong:

```bash
# Rollback to previous config
npm run langsmith:rollback
```

Or manually:
```bash
cp lib/langsmith/ab-test-config.ts.backup lib/langsmith/ab-test-config.ts
```

---

## Continuous Optimization

### Enable

```typescript
enableContinuousOptimization({
  experiments: [PM_PLANNING_EXPERIMENT],
  intervalHours: 24,          // Run every 24 hours
  minConfidence: 0.6,         // 60% confidence required
  promotionStrategy: 'gradual', // Gradual rollout
});
```

### What It Does

**Hour 0:** Initial state
```
v1: 50% | v2: 50%
```

**Hour 24:** First run
- Runs experiment
- Finds v2 is better
- Promotes to 70/30

```
v1: 30% | v2: 70%
```

**Hour 48:** Second run
- v2 still winning
- Could promote to 100% if very confident

```
v1: 0% | v2: 100%
```

### Results Storage

All results saved to `.langsmith-results/`:

```
.langsmith-results/
├── pm-planning-ab-test_2025-01-04T10-30-00.json
├── pm-planning-ab-test_2025-01-05T10-30-00.json
└── pm-planning-ab-test_2025-01-06T10-30-00.json
```

Each file contains:
- Experiment config
- All variant results
- Metrics for each test case
- Winner selection details

---

## Advanced: Custom Workflow

Replace `mockPMWorkflow` with your actual workflow:

```typescript
import { pmNode } from '@/lib/langgraph/nodes/pm-node';

async function realPMWorkflow(inputs: any, promptText: string): Promise<any> {
  // Create mock state with the formatted prompt
  const state = {
    ...inputs,
    userDescription: inputs.userDescription,
    userId: inputs.userId,
    projectId: inputs.projectId,
  };

  // Override the prompt generation with the A/B test prompt
  // (You'd need to modify pm-node to accept custom prompts)
  const result = await pmNode(state);

  return result;
}

const experiment: ExperimentConfig = {
  // ...
  runWorkflow: realPMWorkflow,
  // ...
};
```

---

## Best Practices

### 1. Start Small
- Run manually first: `npm run langsmith:auto-experiment`
- Verify results make sense
- Enable continuous mode only after validation

### 2. Set Conservative Criteria
```typescript
successCriteria: {
  minSuccessRate: 0.95,  // 95% (strict)
  maxAvgLatency: 1000,   // 1s (fast)
  minQualityScore: 0.85, // 85% (high quality)
}
```

### 3. Use Gradual Rollout
```typescript
promotionConfig: {
  strategy: 'gradual', // Safe default
  minConfidence: 0.7,  // 70% confidence
}
```

### 4. Monitor Results
- Check `.langsmith-results/` regularly
- Review LangSmith dashboard
- Track user feedback

### 5. Add More Test Cases
```typescript
// In dataset-setup.ts
const testCases = [
  { inputs: {...}, outputs: {...} },
  { inputs: {...}, outputs: {...} },
  // Add 10-20 diverse test cases
];
```

More test cases = more confidence in results

---

## Comparison: Manual vs Automated

| Task | Manual | Automated |
|------|--------|-----------|
| Run experiment | 15 min | 0 min (automatic) |
| Analyze results | 10 min | 0 min (automatic) |
| Update config | 5 min | 0 min (automatic) |
| Deploy changes | 5 min | 0 min (automatic) |
| Monitor & repeat | 30 min/day | 0 min (automatic) |
| **Total time/week** | **3.5 hours** | **0 minutes** |

---

## Troubleshooting

### Experiment Fails

**Check:**
1. Dataset exists: `npm run langsmith:setup-dataset list`
2. Prompts exist in Hub: Check https://smith.langchain.com/hub
3. Workflow function works: Test it separately

### No Winner Selected

**Reasons:**
- Results too close (low confidence)
- No variant meets success criteria
- Not enough test cases

**Fix:**
- Add more test cases to dataset
- Lower `minConfidence` threshold
- Adjust `successCriteria`

### Auto-Promotion Fails

**Check:**
- Config file path is correct
- File is writable
- Backup was created

**Manual fallback:**
```bash
# Check backup exists
ls lib/langsmith/ab-test-config.ts.backup

# Restore if needed
cp lib/langsmith/ab-test-config.ts.backup lib/langsmith/ab-test-config.ts
```

---

## Summary

### Commands

```bash
# Setup
npm run langsmith:setup-dataset setup-pm

# Run once
npm run langsmith:auto-experiment

# Continuous optimization
npm run langsmith:continuous-opt

# Rollback
cp lib/langsmith/ab-test-config.ts.backup lib/langsmith/ab-test-config.ts
```

### What You Get

✅ **Zero-effort A/B testing**
✅ **Automatic winner selection**
✅ **Automatic promotion to production**
✅ **Continuous optimization**
✅ **Full audit trail of changes**

### Next Steps

1. Run first automated experiment
2. Review results in `.langsmith-results/`
3. Enable continuous optimization
4. Monitor performance
5. Add more prompts and variants

---

**Congratulations! You now have fully automated prompt optimization. 🎉**
