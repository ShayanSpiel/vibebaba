# LangSmith A/B Testing - Quick Start (5 Minutes)

Fast track guide to get A/B testing running.

---

## ⚡ 1. Create Dataset (1 minute)

```bash
npm run langsmith:setup-dataset setup
```

**What this does:**
- Creates `vibebaba-app-gen-tests` dataset
- Adds 5 test cases automatically

---

## ⚡ 2. Create Prompts in Hub (2 minutes)

### Go to: https://smith.langchain.com/hub

**Create Prompt 1: Detailed Version**

1. Click "New Prompt"
2. Name: `pm-planning-v1`
3. Template:

```
{memoryContext}{searchContext}Create a detailed MVP plan for: "{requirements}"

App Type: {appType}
Complexity: {complexity}
MVP Features:
{mvpFeatures}

Generate a comprehensive plan including:
- Detailed Overview (2-3 sentences explaining the app purpose)
- Core Features ({featureCount} features with full descriptions)
- Design Direction (visual style, color scheme, typography recommendations)
- User Experience considerations
```

4. Save

**Create Prompt 2: Concise Version**

1. Click "New Prompt"
2. Name: `pm-planning-v2`
3. Template:

```
{memoryContext}{searchContext}Create a concise MVP plan for: "{requirements}"

Type: {appType} | Complexity: {complexity}

MVP Features:
{mvpFeatures}

Generate:
- Overview (1 sentence)
- Features ({featureCount} items, bullet points only)
- Design (visual style in 5 words)
```

4. Save

**Copy your prompt URLs** (you'll need them next)

---

## ⚡ 3. Configure A/B Test (1 minute)

Edit `lib/langsmith/ab-test-config.ts`:

```typescript
export const PM_PLANNING_AB_TEST: ABTestConfig = {
  enabled: true, // 👈 Change to true
  strategy: 'user-hash',
  variants: [
    {
      name: 'v1-detailed',
      promptName: 'YOUR_USERNAME/pm-planning-v1:latest', // 👈 Update this
      weight: 50,
    },
    {
      name: 'v2-concise',
      promptName: 'YOUR_USERNAME/pm-planning-v2:latest', // 👈 Update this
      weight: 50,
    },
  ],
};
```

**Replace:**
- `YOUR_USERNAME` with your LangSmith username (from the prompt URL)

---

## ⚡ 4. Test It (1 minute)

Start your dev server:

```bash
npm run dev
```

Create a new project and check the console:

```
[PM] 🧪 A/B Testing enabled - fetching prompt from LangSmith Hub
[PM] A/B Test - Selected variant: "v1-detailed"
[PM] ✅ Using LangSmith prompt variant: v1-detailed
```

**Check LangSmith Dashboard:**
- Go to: https://smith.langchain.com
- Open your project: `vibebaba-langgraph`
- See traces with variant metadata

---

## ✅ Done!

You now have:
- ✅ Datasets for testing
- ✅ Two prompt variants in Hub
- ✅ A/B testing running
- ✅ Metrics being tracked

---

## 🔍 What to Check

### Console Logs
```
[PM] A/B Test - Selected variant: "v1-detailed"
[LangSmith Metrics] {
  prompt: 'pm-planning',
  variant: 'v1-detailed',
  latency: '850ms',
  success: true
}
```

### LangSmith Dashboard
1. Go to Projects → `vibebaba-langgraph`
2. Filter traces by metadata
3. Compare variants

---

## 🎯 Next Steps

### Compare Performance
After collecting data:

1. **Check Average Latency**
   - Variant 1 (detailed): ~1000ms
   - Variant 2 (concise): ~600ms

2. **Check Quality**
   - Which generates better plans?
   - Which users prefer?

3. **Adjust Traffic**
   - If V2 is better, increase to 70%
   - If V1 is better, increase to 70%

### Roll Out Winner
```typescript
// Once you have a winner
variants: [
  { name: 'winner', promptName: '...', weight: 100 },
]
```

---

## 🆘 Troubleshooting

**"Failed to fetch prompt"**
- Check prompt name format: `username/prompt-name:latest`
- Make sure prompt is public or you have access

**"LANGCHAIN_API_KEY not found"**
```bash
# Check .env.local
cat .env.local | grep LANGCHAIN_API_KEY
```

**Variant weights don't work**
```typescript
// Must sum to 100
variants: [
  { weight: 50 },
  { weight: 50 }, // 50 + 50 = 100 ✅
]
```

---

## 📚 Full Documentation

For complete guide: [LANGSMITH_AB_TESTING.md](./LANGSMITH_AB_TESTING.md)

---

**Time to complete: ~5 minutes**
