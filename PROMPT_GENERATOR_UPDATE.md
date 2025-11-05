# 🎯 Prompt Generator Update - Flexible Node & Strategy Selection

**New Feature: Full control over which nodes to generate for and how many strategies to use**

---

## What Changed

### Before (Limited)

```bash
# Only one option - generate for ALL nodes, ALL strategies
npm run langsmith:generate-prompts all

# Result: Always 30 prompts (5 nodes × 6 strategies)
```

**Limitations:**
- ❌ Can't generate for specific nodes only
- ❌ Can't limit number of strategies
- ❌ Takes 15 minutes even if you only need 1 node
- ❌ Generates 30 prompts when you might only need 5

---

### After (Flexible)

```bash
npm run langsmith:generate-prompts [nodes] [count]
```

**Full control:**
- ✅ Choose which nodes to generate for
- ✅ Choose how many strategies per node
- ✅ Save time by generating only what you need
- ✅ Combine multiple nodes with custom strategy count

---

## New Command Syntax

### Arguments

**`[nodes]`** - Which nodes to generate for (optional, default: `all`)
- Options: `all`, `pm`, `founder`, `ux`, `backend`, `frontend`
- Can specify multiple with commas: `pm,founder,ux`

**`[count]`** - How many strategies per node (optional, default: `6`)
- Options: `1` to `6`
- Strategies used in order:
  1. concise
  2. detailed
  3. structured
  4. creative
  5. technical
  6. conversational

---

## Usage Examples

### Generate for All Nodes

```bash
# Default - all nodes, all strategies
npm run langsmith:generate-prompts
# → 30 prompts (5 nodes × 6 strategies) - 15 minutes

# All nodes, limited strategies
npm run langsmith:generate-prompts all 3
# → 15 prompts (5 nodes × 3 strategies: concise, detailed, structured) - 8 minutes
```

---

### Generate for Single Node

```bash
# PM node only, all strategies
npm run langsmith:generate-prompts pm
# → 6 prompts (PM × 6 strategies) - 3 minutes

# PM node only, 3 strategies
npm run langsmith:generate-prompts pm 3
# → 3 prompts (PM × concise, detailed, structured) - 2 minutes

# Founder node only, 4 strategies
npm run langsmith:generate-prompts founder 4
# → 4 prompts (Founder × concise, detailed, structured, creative) - 2 minutes
```

---

### Generate for Multiple Nodes

```bash
# PM & Founder, all strategies
npm run langsmith:generate-prompts pm,founder
# → 12 prompts (2 nodes × 6 strategies) - 6 minutes

# PM, Founder & UX, all strategies
npm run langsmith:generate-prompts pm,founder,ux
# → 18 prompts (3 nodes × 6 strategies) - 9 minutes

# PM & Founder, 3 strategies only
npm run langsmith:generate-prompts pm,founder 3
# → 6 prompts (2 nodes × 3 strategies) - 3 minutes

# All frontend nodes, 4 strategies
npm run langsmith:generate-prompts ux,frontend 4
# → 8 prompts (2 nodes × 4 strategies) - 4 minutes
```

---

## Real-World Scenarios

### Scenario 1: Quick Test of PM Node

**Goal:** Want to quickly test if AI-generated prompts work for PM node

**Command:**
```bash
npm run langsmith:generate-prompts pm 2
```

**Result:**
- 2 prompts generated (concise, detailed)
- Takes ~1 minute
- Upload to Hub
- Test with `npm run langsmith:test-pm`

**Time saved:** 14 minutes vs generating all 30 prompts

---

### Scenario 2: Focus on Backend & Frontend

**Goal:** Backend and Frontend need optimization, others are fine

**Command:**
```bash
npm run langsmith:generate-prompts backend,frontend
```

**Result:**
- 12 prompts generated (2 nodes × 6 strategies)
- Takes ~6 minutes
- Only generates what you need

**Time saved:** 9 minutes vs generating all nodes

---

### Scenario 3: Quick Variants for All Nodes

**Goal:** Want 3 quick variants for each node to get started

**Command:**
```bash
npm run langsmith:generate-prompts all 3
```

**Result:**
- 15 prompts generated (5 nodes × 3 strategies)
- Takes ~8 minutes
- Good starting point for A/B testing

**Time saved:** 7 minutes vs 6 strategies per node

---

### Scenario 4: Iterative Testing

**Goal:** Test one node at a time, iterate based on results

**Workflow:**
```bash
# Day 1: Test PM
npm run langsmith:generate-prompts pm
npm run langsmith:test-pm
# Result: concise variant wins

# Day 2: Test Founder
npm run langsmith:generate-prompts founder
npm run langsmith:test-founder
# Result: detailed variant wins

# Day 3: Test UX
npm run langsmith:generate-prompts ux
npm run langsmith:test-ux
# Result: creative variant wins

# Continue...
```

**Benefit:** Test and iterate one node at a time, faster feedback loop

---

## Strategy Selection Logic

When you specify a count, strategies are used in this order:

```
count 1: concise
count 2: concise, detailed
count 3: concise, detailed, structured
count 4: concise, detailed, structured, creative
count 5: concise, detailed, structured, creative, technical
count 6: concise, detailed, structured, creative, technical, conversational (all)
```

**Why this order?**
1. **concise** - Usually the fastest & most cost-effective (always first)
2. **detailed** - Opposite of concise, good for comparison (always second)
3. **structured** - Important for JSON/structured outputs (third)
4. **creative** - Useful for flexibility (fourth)
5. **technical** - Domain-specific, not always needed (fifth)
6. **conversational** - Natural tone, niche use case (last)

---

## Help Command

```bash
npm run langsmith:generate-prompts help
```

Shows full usage instructions with all examples.

---

## Error Handling

### Invalid Node Name

```bash
npm run langsmith:generate-prompts pmm
```

**Output:**
```
❌ Invalid node(s): pmm
Valid nodes: founder, pm, ux, backend, frontend, all
```

---

### Invalid Count

```bash
npm run langsmith:generate-prompts pm 10
```

**Output:**
```
❌ Strategy count must be between 1 and 6
```

---

### Multiple Invalid Nodes

```bash
npm run langsmith:generate-prompts pm,xyz,abc
```

**Output:**
```
❌ Invalid node(s): xyz, abc
Valid nodes: founder, pm, ux, backend, frontend, all
```

---

## Output Format

### Before Running

```bash
npm run langsmith:generate-prompts pm,founder 3
```

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI Prompt Generator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nodes: pm, founder
Strategies: concise, detailed, structured (3 per node)
Total prompts: 6
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### While Running

```
🤖 [AI Generator] Creating prompts for PM...
   Generating "concise" variant...
   ✓ Created "concise" variant (245 chars)
   Generating "detailed" variant...
   ✓ Created "detailed" variant (512 chars)
   Generating "structured" variant...
   ✓ Created "structured" variant (389 chars)

📤 [Hub Upload] Uploading 3 prompts...
   ✓ Uploaded: vibebaba/pm-planning/concise
   ✓ Uploaded: vibebaba/pm-planning/detailed
   ✓ Uploaded: vibebaba/pm-planning/structured

✅ Upload complete!

🤖 [AI Generator] Creating prompts for Founder...
   ...
```

---

### After Completion

```
🎉 All prompts generated successfully!

Generated 6 prompts across 2 node(s)
```

---

## Time Savings

| Command | Prompts | Time (approx) | Saved vs All |
|---------|---------|---------------|--------------|
| `all` (default) | 30 | 15 min | - |
| `all 3` | 15 | 8 min | 7 min |
| `pm` | 6 | 3 min | 12 min |
| `pm 3` | 3 | 2 min | 13 min |
| `pm,founder` | 12 | 6 min | 9 min |
| `pm,founder 3` | 6 | 3 min | 12 min |
| `backend,frontend` | 12 | 6 min | 9 min |

---

## Integration with Existing Workflow

### Old Workflow

```bash
# Step 1: Generate (always 30 prompts, 15 min)
npm run langsmith:generate-prompts all

# Step 2: Wait...

# Step 3: Test
npm run langsmith:test-all
```

**Total time:** 15 min + 15 min = 30 minutes

---

### New Workflow (Faster)

```bash
# Step 1: Generate only what you need (3 min)
npm run langsmith:generate-prompts pm

# Step 2: Test immediately
npm run langsmith:test-pm

# Step 3: Generate next node based on results
npm run langsmith:generate-prompts founder
npm run langsmith:test-founder
```

**Total time:** 3 min + 2 min + 3 min + 2 min = 10 minutes for 2 nodes

**Time saved:** 20 minutes

---

## Best Practices

### 1. Start Small

```bash
# Start with 2-3 strategies
npm run langsmith:generate-prompts pm 3

# If results are good, generate more
npm run langsmith:generate-prompts pm
```

**Why:** Faster iteration, less waiting

---

### 2. Test One Node at a Time

```bash
# Focus on one node
npm run langsmith:generate-prompts pm
npm run langsmith:test-pm

# Once working, move to next
npm run langsmith:generate-prompts founder
npm run langsmith:test-founder
```

**Why:** Easier to debug, faster feedback

---

### 3. Generate Incrementally

```bash
# Day 1: Critical nodes
npm run langsmith:generate-prompts pm,backend

# Day 2: Add more after testing
npm run langsmith:generate-prompts founder,ux

# Day 3: Complete the set
npm run langsmith:generate-prompts frontend
```

**Why:** Spread the work, validate as you go

---

### 4. Use Strategy Count Strategically

```bash
# Quick test: 2 strategies (opposites)
npm run langsmith:generate-prompts pm 2
# → concise vs detailed

# Good coverage: 3 strategies
npm run langsmith:generate-prompts pm 3
# → concise, detailed, structured

# Full coverage: 6 strategies
npm run langsmith:generate-prompts pm
# → all variants
```

**Why:** Right balance of variety and speed

---

## Summary

### What You Can Do Now

✅ Generate for specific nodes only
✅ Choose how many strategies per node
✅ Combine multiple nodes
✅ Save time by generating only what you need
✅ Iterate faster with smaller batches
✅ Get help with `help` command

### Command Pattern

```bash
npm run langsmith:generate-prompts [nodes] [count]

nodes: all, pm, founder, ux, backend, frontend, pm,founder, etc.
count: 1-6 (default: 6)
```

### Time Savings

- Single node: ~12 minutes saved vs generating all
- Limited strategies: ~7 minutes saved vs all 6 strategies
- Both combined: Up to 13 minutes saved

### Next Steps

Try it out:
```bash
# Quick test with PM
npm run langsmith:generate-prompts pm 3

# See all options
npm run langsmith:generate-prompts help
```

---

**Updated: lib/langsmith/ai-prompt-generator.ts**
**Documentation: LANGSMITH_README.md, QUICK_REFERENCE.md**

✅ **Ready to use!**
