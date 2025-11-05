# PROMPT CLEANUP - QUICK REFERENCE

**Status:** Analysis Complete ✅ | Implementation Pending ⏸️
**Last Updated:** 2025-10-27

---

## 📊 KEY METRICS

| Metric | Impact |
|--------|--------|
| **Token Reduction** | 35% (3,000 tokens per generation) |
| **Annual Savings** | $585 (based on 10K generations) |
| **Issues Found** | 13 critical inconsistencies across 8 files |
| **Implementation Time** | 9-13 hours estimated |

---

## 🚨 CRITICAL ISSUES FOUND

### Original 5 Issues

1. **Routing Instructions Bloat** (718 lines → 100 lines)
   - File: `lib/prompts/routing-instructions.ts`
   - Problem: 86% irrelevant HTML-era routing instructions
   - Fix: Keep only Next.js App Router section (~100 lines)

2. **UX Component Prescription** (80 lines to remove)
   - File: `lib/prompts/node-prompts.ts:156-236`
   - Problem: Prescribes 7 component types (navigation, hero, footer, etc.)
   - Fix: Let Frontend AI choose from full Ant Design library

3. **PM Node GenerationMode Logic** (contradictory code)
   - File: `lib/langgraph/nodes/pm-node.ts:87-93`
   - Problem: Comments say "always Next.js" but code says "HTML mode, Next.js disabled"
   - Fix: Remove generationMode entirely, always Next.js

4. **Duplicate Precision Rules** (4 locations)
   - Files: Multiple prompt files import and repeat the same rules
   - Problem: Rule changes require editing 4+ files
   - Fix: Single source of truth via import

5. **Frontend HTML References** (outdated terminology)
   - File: `lib/prompts/node-prompts.ts:310-365`
   - Problem: Says "HTML/CSS code" but generates Next.js/TypeScript
   - Fix: Update all references to "Next.js applications"

### Deep Review: 8 Additional Issues

6. **PM Prompt Pages Array** (line 112)
   - Problem: `"pages": ["home", "about"]` conflicts with Next.js file-based routing
   - Fix: Remove "pages" key entirely

7. **Backend Pages Array** (multiple locations)
   - File: `lib/langgraph/nodes/backend-node.ts`
   - Lines: 18, 39-50, 97, 125, 173
   - Problem: Backend deciding routing structure
   - Fix: Remove all pages-related logic from backend

8. **UX Component Selection Schema** (lines 160-218)
   - Problem: Still outputs component types in JSON schema
   - Fix: Only output designSystem and stylingConfig

9. **Frontend window.db Guidance** (lines 345-350)
   - Problem: No distinction between Server Components (can't use window.db) vs Client Components (can use it)
   - Fix: Add guidance about Server vs Client component usage

10. **Editor HTML Defaults** (editor-node.ts)
    - Lines: 63, 161-230, 333-342
    - Problem: Defaults to 'index.html' instead of 'page.tsx'
    - Fix: Change default to 'page.tsx', prioritize .tsx detection

11. **Context Analyzer HTML Detection** (context-analyzer-node.ts)
    - Lines: 65, 299, 366-369
    - Problem: Looks for .html files when system generates .tsx
    - Fix: Update regex to detect .tsx|.ts files

12. **UX Prompt Justification Logic** (lines 207-218)
    - Problem: Examples show component selection justifications
    - Fix: Remove justification field entirely (no more component selection)

13. **Frontend Output Schema** (line 360-362)
    - Problem: Examples show index.html/styles.css instead of Next.js structure
    - Fix: Update to show app/page.tsx, app/layout.tsx examples

---

## 📁 FILES TO MODIFY

| File | Lines | Changes |
|------|-------|---------|
| `lib/prompts/routing-instructions.ts` | 1-718 | Delete 618 lines (keep only Next.js) |
| `lib/prompts/node-prompts.ts` | 112, 156-236, 310-365, 345-350 | Remove pages array, component selection, HTML refs, add window.db guidance |
| `lib/langgraph/nodes/pm-node.ts` | 87-93 | Delete generationMode logic |
| `lib/langgraph/nodes/backend-node.ts` | 18, 39-50, 97, 125, 173 | Remove pages array references |
| `lib/langgraph/nodes/editor-node.ts` | 63, 161-230, 333-342 | Change default .html → .tsx |
| `lib/langgraph/nodes/context-analyzer-node.ts` | 65, 299, 366-369 | Update file detection .html → .tsx |

---

## 🎯 IMPLEMENTATION PHASES

### Phase 1: Quick Wins (2-3 hours)
- [ ] Delete HTML routing instructions (keep Next.js only)
- [ ] Remove PM generationMode logic
- [ ] Consolidate duplicate precision rules

### Phase 1.5: Critical Inconsistencies (3-4 hours) **NEW**
- [ ] Remove pages array from PM prompt
- [ ] Remove pages logic from backend-node.ts
- [ ] Update UX prompt (remove component selection)
- [ ] Fix frontend window.db guidance
- [ ] Fix editor HTML defaults → .tsx
- [ ] Fix context analyzer file detection

### Phase 2: UX Node Simplification (2 hours)
- [ ] Remove component selection output schema
- [ ] Simplify to designSystem + stylingConfig only
- [ ] Update examples

### Phase 3: Frontend Modernization (2-3 hours)
- [ ] Remove HTML/CSS references
- [ ] Update to "Next.js applications" terminology
- [ ] Add Server vs Client component guidance
- [ ] Update output schema examples

### Phase 4: Documentation (1 hour)
- [ ] Update NEXTJS_AI_AUTONOMY_ARCHITECTURE.md
- [ ] Archive legacy prompt versions
- [ ] Create migration guide

### Phase 5: Testing & Validation (1-2 hours)
- [ ] Test simple app generation
- [ ] Test medium app generation
- [ ] Test complex app generation
- [ ] Verify token reduction metrics
- [ ] Ensure no regressions

---

## 🔍 TESTING CHECKLIST

After implementation, verify:

✅ **Simple App Test**: "Create a contact form"
- Should generate minimal Next.js app with app/page.tsx
- No unnecessary components
- No HTML files
- Uses Ant Design components
- Proper 'use client' directive if needed

✅ **Medium App Test**: "Build a blog with posts and comments"
- Should generate app/page.tsx, app/[id]/page.tsx
- Proper file-based routing
- Server Components by default
- Client Components only when needed
- PocketBase integration for data

✅ **Complex App Test**: "Create a marketplace for freelancers"
- Multiple route segments (app/jobs/page.tsx, app/profile/[id]/page.tsx, etc.)
- Proper database collections (no pages array from backend)
- AI decides file structure autonomously
- No component presets from UX node

---

## 📊 SUCCESS CRITERIA

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Token reduction | ≥35% | Compare before/after prompt token counts |
| No HTML references | 0 instances | Grep for "index.html", "styles.css" in prompts |
| No component selection | 0 instances | UX output should only have designSystem |
| No pages arrays | 0 instances | Backend/PM output should not include pages |
| Build success | 100% | `npm run build` completes without errors |
| Test coverage | All passing | Run full test suite |

---

## 🚀 ROLLBACK PLAN

If issues occur:

1. **Git restore**: All changes are in git, easy to revert
2. **Backup prompts**: Located in `lib/prompts/_legacy/` (archived during Phase 4)
3. **Feature flags**: Organization-level toggle for prompt versions (future enhancement)

---

## 📌 NEXT ACTIONS

**When ready to implement:**

1. Review the full plan: `#notDone_PROMPT_CLEANUP_MASTER_PLAN.md`
2. Create feature branch: `git checkout -b prompt-cleanup-nextjs-alignment`
3. Start with Phase 1 (Quick Wins)
4. Move to Phase 1.5 (Critical Inconsistencies) - **HIGH PRIORITY**
5. Continue through remaining phases
6. Run full test suite
7. Merge to main after validation

**DO NOT START** until #notDone tag is removed by user approval.

---

**Full Details:** See [#Done_PROMPT_CLEANUP_MASTER_PLAN.md](/#Done_PROMPT_CLEANUP_MASTER_PLAN.md)
