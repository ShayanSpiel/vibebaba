# Documentation & Planning Rules

> **Created:** 2025-10-26
> **Purpose:** Maintain clean, organized, and actionable documentation

## Core Principles

1. **One Topic, One File** - Avoid duplicate files on same topics
2. **Tag Everything** - Every file must have a status tag
3. **Keep It Lean** - Merge, summarize, or archive regularly
4. **Critical vs Non-Critical** - Only essential architecture/structure docs stay large

---

## Rule 1: File Naming & Tagging

### Status Tags (Required)
All documentation and planning files MUST start with a status tag:

- **`#done_`** - Completely implemented and verified
- **`#doing_`** - Partially implemented, has incomplete phases
- **`#toDo_`** - Planned but not started

### Examples
```
#done_PERFORMANCE_OPTIMIZATION.md
#doing_PERSIAN_TRANSLATION_RTL.md
#toDo_APP_SIZE_OPTIMIZATION.md
```

### Tag Usage Rules
- **Plans folder**: Use `#toDo_` or `#doing_` only
- **Implementation folder**: Use `#done_` or `#doing_` only
- **Root docs**: Tag only if they represent actionable work
- **Guides/Reference**: No tags needed (they're documentation, not tasks)

---

## Rule 2: File Organization Structure

```
/VB/
├── README.md                           # Project overview (no tag)
├── #done_TECHNICAL_REFERENCE.md        # Combined architecture doc
├── ARCHITECTURE_QUICK_REFERENCE.md     # Quick lookup (no tag)
├── #done_DEPLOYMENT_GUIDE.md           # Single deployment guide
├── DOCUMENTATION_INDEX.md              # Navigation only
│
└── docs/
    ├── plans/                          # Future work (#toDo_ or #doing_)
    ├── implementation/                 # Completed work (#done_)
    ├── guides/                         # How-to docs (no tags)
    ├── architecture/                   # System design (no tags)
    ├── troubleshooting/               # Debug guides (no tags)
    ├── reference/                      # API/data references (no tags)
    ├── legacy/                         # Archived/outdated docs
    └── [other organized folders]
```

---

## Rule 3: Duplicate Detection & Merging

### When Files Are Duplicates
- **Same topic** with >50% content overlap
- **Same purpose** (e.g., two deployment checklists)
- **Sequential fixes** on same issue (merge into latest)

### Merge Process
1. Identify newest/most complete version
2. Extract unique info from older versions
3. Merge into single comprehensive file
4. Add `#done_` tag if completed
5. Move old versions to `docs/legacy/` or delete

### Example
```
Before:
- DEPLOYMENT_CHECKLIST.md
- DEPLOYMENT_CHECKLIST_SEO.md
- DEPLOYMENT_README.md
- DEPLOYMENT_PHASE_1.md

After:
- #done_DEPLOYMENT_GUIDE.md (merged all)
```

---

## Rule 4: Handling Partial Implementations

### Identifying Partial Work
A file is `#doing_` if:
- Has completed phases AND incomplete phases
- References "TODO" or "Not implemented" sections
- Was started but abandoned mid-way

### Action Required
1. Review all phases/sections
2. Document what's complete vs incomplete
3. Tag as `#doing_`
4. Move to `docs/plans/` if primarily unfinished
5. Keep in `docs/implementation/` if >80% done

### Example
```
File: COMPREHENSIVE_IMPLEMENTATION_PLAN.md
- Phase 1: ✅ Done
- Phase 2: ✅ Done
- Phase 3: ❌ Not started

Action:
→ Rename to #doing_COMPREHENSIVE_IMPLEMENTATION.md
→ Move to docs/plans/
→ Add note: "Phase 3 pending"
```

---

## Rule 5: Large File Management

### Size Thresholds
- **Small**: <10 KB - Keep as-is
- **Medium**: 10-30 KB - Monitor, consider splitting if grows
- **Large**: 30-100 KB - Acceptable if critical reference
- **Very Large**: >100 KB - MUST split or summarize

### Critical Files (Can Stay Large)
- Combined technical reference/architecture
- Comprehensive API documentation
- Master implementation guides
- Complete troubleshooting compendiums

### Non-Critical Files (Must Summarize)
- Completed implementation plans → Summarize to 20% of size
- Historical analysis → Extract key insights only
- Sequential bug fixes → Keep latest only
- Temporal status updates → Delete or merge

---

## Rule 6: Outdated Content Removal

### Identifying Outdated Content
- References removed features/code
- Describes old architecture that changed
- Contains superseded approaches
- Has timestamps >6 months old (context-dependent)

### Removal Process
1. **Analyze** - Read file, identify outdated sections
2. **List** - Document what's outdated and why
3. **Review** - Confirm with team/self
4. **Action** - Update, merge, archive, or delete
5. **Document** - Note changes in commit/changelog

---

## Rule 7: Temporal/Historical Documents

### Types
- Daily summaries (WAKEUP_SUMMARY.md)
- Exploration reports (EXPLORATION_SUMMARY.txt)
- Phase completion reports (PHASE_1_COMPLETE.md)

### Decision Tree
```
Is content still relevant?
├─ YES → Can it merge with active docs?
│  ├─ YES → Merge and delete
│  └─ NO → Move to docs/legacy/
└─ NO → Delete
```

---

## Rule 8: Documentation Index Maintenance

### Single Source of Truth
- **Keep**: `DOCUMENTATION_INDEX.md` (root level)
- **Delete**: Any duplicate indexes

### Update Frequency
- After any file reorganization
- After adding new major docs
- Monthly review for accuracy

### Index Structure
```markdown
# Documentation Index

## Quick Navigation
- [Technical Reference](#technical)
- [Planning](#planning)
- [Implementation](#implementation)

## Active Work (#doing_)
- List all #doing_ files

## Planned Work (#toDo_)
- List all #toDo_ files

## Completed Work (#done_)
- Recent completions only (last 3 months)
```

---

## Monthly Maintenance Checklist

- [ ] Review all `#doing_` files - still active?
- [ ] Check for duplicate files
- [ ] Verify large files (>30 KB) still need to be large
- [ ] Move old `#done_` files to appropriate docs/ subfolders
- [ ] Update `DOCUMENTATION_INDEX.md`
- [ ] Archive temporal docs older than 3 months to legacy/
- [ ] Delete truly irrelevant legacy files older than 6 months

---

## Quick Reference Commands

### Find untagged plan/implementation files
```bash
find . -name "*.md" -path "*/docs/plans/*" ! -name "#*"
find . -name "*.md" -path "*/docs/implementation/*" ! -name "#*"
```

### Find very large files
```bash
find . -name "*.md" -size +100k
```

### Find duplicate filenames (potential duplicates)
```bash
find . -name "*.md" | rev | cut -d'/' -f1 | rev | sort | uniq -d
```

---

## Examples of Good Structure

### Good ✅
```
/VB/
├── #done_TECHNICAL_REFERENCE.md        (32 KB - critical, comprehensive)
├── ARCHITECTURE_QUICK_REFERENCE.md      (8 KB - focused)
└── docs/
    ├── plans/
    │   ├── #toDo_MOBILE_APP.md
    │   └── #doing_PERSIAN_RTL.md
    └── implementation/
        └── #done_CREDIT_SYSTEM.md
```

### Bad ❌
```
/VB/
├── ARCHITECTURE.md
├── ARCHITECTURE_v2.md
├── ARCHITECTURE_OVERVIEW.md            (3 duplicates!)
├── deployment_checklist.md
├── DEPLOYMENT_CHECKLIST_SEO.md         (Lowercase inconsistent)
└── docs/
    ├── plans/
    │   └── MOBILE_APP.md               (Missing tag!)
    └── implementation/
        └── DONE_CREDIT_SYSTEM.md       (Wrong tag format!)
```

---

## Summary

1. **Tag everything** with `#done_`, `#doing_`, or `#toDo_`
2. **Merge duplicates** ruthlessly
3. **Summarize completed plans** and move to implementation
4. **Identify partial work** and tag as `#doing_`
5. **Archive or delete** outdated temporal docs
6. **Keep one index** and update it regularly
7. **Monthly maintenance** to prevent clutter

**The goal:** Clean, navigable, actionable documentation that helps you plan and execute efficiently.
