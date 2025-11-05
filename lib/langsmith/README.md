# LangSmith Integration

Complete A/B testing and prompt management for VibeBaba.

## 📁 Files

| File | Purpose |
|------|---------|
| `client.ts` | LangSmith client initialization and dataset utilities |
| `prompt-manager.ts` | Prompt fetching, A/B testing logic, metrics tracking |
| `ab-test-config.ts` | A/B test configuration for PM node |
| `dataset-setup.ts` | Scripts to create test datasets |
| `validate-setup.ts` | Validation script to check setup |
| `pm-node-integration-example.ts` | Example of integrating A/B testing into PM node |
| `index.ts` | Main export file |

## 🚀 Quick Commands

```bash
# Validate setup
npm run langsmith:validate

# Create datasets
npm run langsmith:setup-dataset setup      # Full app generation tests
npm run langsmith:setup-dataset setup-pm   # PM node specific tests
npm run langsmith:setup-dataset list       # List all datasets
```

## 📖 Documentation

- **Quick Start**: [/docs/LANGSMITH_QUICK_START.md](../../docs/LANGSMITH_QUICK_START.md)
- **Full Guide**: [/docs/LANGSMITH_AB_TESTING.md](../../docs/LANGSMITH_AB_TESTING.md)

## 🎯 Usage Examples

### Create Dataset

```typescript
import { createDataset, addDatasetExample } from '@/lib/langsmith';

const dataset = await createDataset('my-tests', 'Test cases for X');

await addDatasetExample(
  dataset.id,
  { input: 'data' },
  { expected: 'output' }
);
```

### Fetch Prompt

```typescript
import { fetchPrompt, formatPrompt } from '@/lib/langsmith';

const prompt = await fetchPrompt('username/prompt-name:latest');
const formatted = formatPrompt(prompt, { variable: 'value' });
```

### A/B Testing

```typescript
import { fetchPromptWithABTest } from '@/lib/langsmith';
import { PM_PLANNING_AB_TEST } from '@/lib/langsmith/ab-test-config';

const { prompt, variant } = await fetchPromptWithABTest(
  PM_PLANNING_AB_TEST,
  userId
);

console.log(`Selected variant: ${variant}`);
```

### Track Metrics

```typescript
import { trackPromptMetrics } from '@/lib/langsmith';

await trackPromptMetrics({
  promptName: 'pm-planning',
  variant: 'v1-detailed',
  latencyMs: 850,
  success: true,
  userId: 'user-123',
});
```

## 🔧 Configuration

Edit `ab-test-config.ts` to configure A/B tests:

```typescript
export const PM_PLANNING_AB_TEST: ABTestConfig = {
  enabled: true, // Enable/disable A/B testing
  strategy: 'user-hash', // 'random' or 'user-hash'
  variants: [
    {
      name: 'v1-detailed',
      promptName: 'username/pm-planning-v1:latest',
      weight: 50, // Traffic percentage
    },
    {
      name: 'v2-concise',
      promptName: 'username/pm-planning-v2:latest',
      weight: 50,
    },
  ],
};
```

## ✅ Setup Checklist

- [ ] Environment variables set in `.env.local`
- [ ] Run `npm run langsmith:validate`
- [ ] Create datasets: `npm run langsmith:setup-dataset setup`
- [ ] Create prompts in LangSmith Hub
- [ ] Update `ab-test-config.ts` with prompt names
- [ ] Enable A/B testing: `enabled: true`
- [ ] Test integration

## 🆘 Troubleshooting

**Setup issues?**
```bash
npm run langsmith:validate
```

**Need help?**
- Check [LANGSMITH_AB_TESTING.md](../../docs/LANGSMITH_AB_TESTING.md) troubleshooting section
- Enable debug: `LANGSMITH_DEBUG=true`

## 🔗 Links

- **LangSmith Dashboard**: https://smith.langchain.com
- **Prompt Hub**: https://smith.langchain.com/hub
- **Docs**: https://docs.smith.langchain.com
