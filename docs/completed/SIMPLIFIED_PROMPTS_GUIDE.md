# SIMPLIFIED PROMPTS - QUICK REFERENCE GUIDE

## 🎯 Core Philosophy

**Trust AI + Validate + Fix**

Modern LLMs (GPT-4, Claude, Gemini 2.0) already know:
- ✅ HTML syntax and structure
- ✅ Proper tag nesting
- ✅ HTML entity escaping
- ✅ CSS best practices
- ✅ JavaScript fundamentals

**We only need to tell them:**
- 📋 WHAT to build (user requirements)
- 🎨 HOW to style it (design system)
- 🔧 WHAT tools to use (component library)
- 📄 WHAT format to output (file structure)

---

## 📊 Token Comparison

| Component | Old | New | Savings |
|-----------|-----|-----|---------|
| Frontend Prompt | 8,251 | 1,500 | **82%** |
| AutoGen Fix | 4,000 | 800 | **80%** |
| AutoGen Analysis | 300 | 150 | **50%** |
| **TOTAL** | **12,551** | **2,450** | **80%** |

---

## 🏗️ NEW PROMPT STRUCTURE

### Frontend Generation Prompt

```
🎯 GENERATE HTML APPLICATION

USER REQUEST:
"[user's description]"

PRODUCT PLAN:
[plan from PM node]

📚 DESIGN SYSTEM & COMPONENTS
[Ant Design guidelines]
[Component library]

🗄️ DATA & FUNCTIONALITY
[Database API if needed]

📄 OUTPUT REQUIREMENTS
Structure:
• Start with <!DOCTYPE html>
• Include <style> in <head>
• Include <script> before </body>
• End with </html>

GUIDELINES:
✅ Generate complete, functional code
✅ Use components from library as needed
✅ Match user's request exactly
✅ Include all necessary structure
✅ Make it production-ready

Return ONLY the HTML code.
Generate now:
```

**Total: ~30 lines** (vs 400+ old)

---

### AutoGen Fix Prompt

```
Fix the validation errors based on the analysis.

ANALYSIS:
[analyst's findings about root cause]

CURRENT FILES:
=== index.html ===
[file content]

CHECKLIST:
✅ Fix ONLY the errors identified
✅ Preserve existing functionality
✅ Use real content (no placeholders)
✅ Generate complete code
✅ Proper HTML structure

OUTPUT FORMAT:
Return complete HTML from <!DOCTYPE html> to </html>

Return ONLY the fixed code.
Generate now:
```

**Total: ~20 lines** (vs 196 old)

---

## 🔑 KEY PRINCIPLES

### 1. Positive Framing
❌ **OLD:** "DON'T use placeholders, DON'T add extra features, DON'T..."
✅ **NEW:** "Generate complete code, Match user's request, Use real content"

### 2. Trust AI Knowledge
❌ **OLD:** Explain HTML tag pairing rules with 20 examples
✅ **NEW:** Trust AI already knows HTML, just remind "Proper HTML structure"

### 3. Avoid Duplication
❌ **OLD:** Repeat HTML escaping rules 4 times in different sections
✅ **NEW:** Mention once in validation, AI already knows this

### 4. Focus on Intent
❌ **OLD:** "Every <tag> needs matching </tag>, count your tags..."
✅ **NEW:** "Generate complete, functional code"

### 5. Minimal Examples
❌ **OLD:** Show 10 examples of what NOT to do
✅ **NEW:** Show 1-2 examples of what TO do (if needed)

---

## 📋 VALIDATION STRATEGY

### Let Auto-Fixer Handle Simple Issues

**Auto-fixable errors:**
- ✅ Missing DOCTYPE
- ✅ Unclosed tags (simple cases)
- ✅ HTML entity escaping (`< > &`)
- ✅ Duplicate IDs
- ✅ Lowercase attributes
- ✅ Missing title tag

**Result:** Most errors fixed automatically without AI involvement

### Let AutoGen Handle Complex Issues

**If auto-fixer can't fix:**
- 🔧 Complex tag imbalances
- 🔧 Invalid nesting patterns
- 🔧 Structural problems

**AutoGen with simplified prompts:**
- Gets straight to the point
- No cognitive overload
- Higher fix success rate

---

## 🎨 GUIDELINES FORMAT

### Old Approach (Defensive):
```
⚠️ CRITICAL REQUIREMENTS - ABSOLUTE RULES:

1. ❌ NEVER EVER use placeholder content:
   - NO "placeholder text/content"
   - NO "sample", "example", "demo"
   - NO "TODO:", "FIXME:"
   - NO "Lorem ipsum"
   [20 more lines of DON'Ts]

2. 📝 VALID HTML STRUCTURE:
   a) TAG PAIRING (Count your tags!):
      ✅ <button>Text</button> ← 1 opening, 1 closing
      ✅ <div><p>Text</p></div> ← All paired
      ❌ </button> ← NO opening tag (FORBIDDEN!)
      [30 more lines of examples]
```

### New Approach (Trust):
```
CHECKLIST:
✅ Fix ONLY the errors identified
✅ Preserve existing functionality
✅ Use real content (no placeholders)
✅ Generate complete code
✅ Proper HTML structure
```

**5 lines vs 50+ lines. Same effect (or better).**

---

## 🧪 TESTING CHECKLIST

When generating a new app, verify:

### Frontend Generation:
- [ ] Prompt tokens: ~1,500 (not 8,000+)
- [ ] Logs show "SIMPLIFIED" strategy
- [ ] HTML generated completely
- [ ] No excessive errors

### Validation:
- [ ] Auto-fixer runs first
- [ ] Simple errors fixed automatically
- [ ] Only complex issues need AutoGen

### AutoGen (if triggered):
- [ ] Prompt tokens: ~800 (not 4,000+)
- [ ] Analysis is brief and focused
- [ ] Fix attempt succeeds on first try
- [ ] Final validation passes

---

## 📈 EXPECTED METRICS

### Ideal Generation Flow:

```
Frontend Generation (1,500 tokens)
         ↓
   Validation
         ↓
   Auto-Fixer (0 AI calls)
         ↓
   ✅ PASS (90% of cases)

   OR ↓ (10% of cases)

   AutoGen Fix (800 tokens, 1 attempt)
         ↓
   ✅ PASS
```

### Target Numbers:
- **Token usage:** 1,500-2,300 per app (vs 8,000-12,000 old)
- **AutoGen trigger rate:** <20% (vs 30% old)
- **AutoGen success rate:** >90% first attempt (vs 60% old)
- **Total cost:** $0.004 per app (vs $0.02 old)

---

## 🛠️ WHEN TO ADD RULES

### Add Rules If:
✅ Same error occurs repeatedly across 10+ generations
✅ Error is not auto-fixable
✅ AutoGen consistently fails to fix it
✅ Users complain about specific issue

### Don't Add Rules If:
❌ Error happened once or twice
❌ Auto-fixer can handle it
❌ AutoGen fixes it successfully
❌ It's already covered by AI training

**Golden Rule:** Add rules incrementally based on data, not assumptions.

---

## 🔄 EVOLUTION PATH

### Phase 1: Current (Simplified)
- 80% token reduction
- Trust AI on HTML/CSS basics
- Minimal positive guidance

### Phase 2: Ultra-Minimal (Future)
- 90% token reduction
- Remove even more rules
- Just: User request + Component library + Output format

### Phase 3: Pure Intent (Long-term)
- 95% token reduction
- Only: "Build [user request]"
- Let AI figure out everything else
- Validation catches mistakes

**Direction:** Less is more. Trust the AI.

---

## 💡 KEY INSIGHTS

1. **Modern LLMs don't need HTML tutorials**
   - They've seen millions of HTML files
   - They know W3C specs
   - They understand web standards

2. **Negative instructions create confusion**
   - "Don't think of pink elephant" → thinks of it
   - "Never use ..." → AI focuses on what to avoid
   - Positive framing works better

3. **Duplication creates cognitive overload**
   - Same rule repeated 4 times → AI confused
   - Single clear statement → AI understands

4. **Examples should be minimal**
   - 1-2 examples: ✅ Helpful
   - 10+ examples: ❌ Distracting

5. **Trust + Validate is better than Prevent**
   - Trust AI to generate properly
   - Validate to catch mistakes
   - Fix efficiently when needed

---

## 🎯 SUCCESS MARKERS

### You're Doing It Right If:
✅ Prompts are short and clear
✅ No repeated rules
✅ Positive framing ("Do this" not "Don't do that")
✅ AI generates clean code most of the time
✅ AutoGen fixes issues on first try
✅ Token usage is low
✅ Cost is down 70%+

### Warning Signs:
⚠️ Adding more rules after each error
⚠️ Duplicating instructions
⚠️ Explaining HTML basics to AI
⚠️ Token usage creeping back up
⚠️ AutoGen needing multiple attempts

---

## 📚 FURTHER READING

- See `PROMPT_SIMPLIFICATION_CHANGES.md` for full implementation details
- See `lib/prompt-comparison-metrics.ts` for tracking performance
- See `lib/langgraph/nodes/frontend-node.ts` for simplified prompt code
- See `lib/langgraph/subgraphs/autogen-debugger.ts` for AutoGen simplification

---

**Remember:** The AI is smart. Our job is to guide it, not teach it HTML.

**Motto:** Less rules, better results. 🚀
