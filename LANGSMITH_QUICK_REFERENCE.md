# ⚡ LangSmith A/B Testing - Quick Reference

## 🎯 What You Have

**Automated prompt A/B testing for ALL 9 workflow nodes:**
- Founder, PM, UX, Backend, Frontend
- QA, DevOps, Editor, Autogen

**Features:**
- Automatic testing
- Automatic winner selection
- Auto-promotion to production
- Continuous optimization (24h cycles)

---

## 📋 Commands Cheat Sheet

### Setup (One-Time)
```bash
npm run langsmith:validate              # Check setup ✅
npm run langsmith:setup-all-datasets    # Create all datasets ✅ DONE
```

### Testing Individual Nodes
```bash
npm run langsmith:test-founder
npm run langsmith:test-pm
npm run langsmith:test-ux
npm run langsmith:test-backend
npm run langsmith:test-frontend
npm run langsmith:test-qa
npm run langsmith:test-devops
npm run langsmith:test-editor
npm run langsmith:test-autogen
```

### Testing All Nodes
```bash
npm run langsmith:test-all              # Test all 9 nodes
npm run langsmith:continuous-all        # Enable continuous mode
```

### AI Prompt Generation & Evolution
```bash
# AI Generation - Flexible syntax
npm run langsmith:generate-prompts              # All nodes, 6 strategies (30 prompts)
npm run langsmith:generate-prompts all 3        # All nodes, 3 strategies (15 prompts)
npm run langsmith:generate-prompts pm           # PM only, 6 strategies (6 prompts)
npm run langsmith:generate-prompts pm 4         # PM only, 4 strategies (4 prompts)
npm run langsmith:generate-prompts pm,founder   # PM & Founder, 6 strategies (12 prompts)
npm run langsmith:generate-prompts help         # Show help

# Evolution
npm run langsmith:evolve-prompts pm     # Evolve prompts through mutations
```

---

## 🚀 Next Steps (30 Minutes)

### Step 1: Create Prompts in Hub (30 min)

Go to: **https://smith.langchain.com/hub**

Create 18 prompts (2 per node) - see `docs/LANGSMITH_ALL_NODES_SETUP.md` for templates

Or use AI generation:
```bash
npm run langsmith:generate-prompts all  # Generates 54 prompts (9 nodes × 6 strategies)
```

### Step 2: Enable Configs (2 min)

Edit: `lib/langsmith/configs/all-nodes-config.ts`

Change all `enabled: false` → `enabled: true`

### Step 3: Test
```bash
npm run langsmith:test-all
```

---

## 📊 Status

✅ Environment configured
✅ Datasets created (11 test cases)
✅ Code ready
✅ AI prompt generation
✅ Evolutionary optimization (9 mutation types)
⏳ Need: Create prompts & enable configs

---

## 📚 Docs

- `QUICK_REFERENCE.md` ← You are here
- `docs/LANGSMITH_ALL_NODES_SETUP.md` ← Full setup
- `docs/LANGSMITH_PROMPT_EVOLUTION.md` ← AI prompt evolution
- `ALL_NODES_IMPLEMENTATION_COMPLETE.md` ← Summary

**Time to complete: 30 minutes | ROI: 520x 🚀**
