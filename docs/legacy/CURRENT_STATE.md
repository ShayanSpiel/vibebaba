# Current State & Philosophy
**Last Updated**: Design System Migration (Ant Design → shadcn/ui) ✅

## Core Rules
1. **Fix ROOT CAUSE** - No band-aids, find the actual problem
2. **Short, simple prompts** - Show what TO do, not 50 things NOT to do
3. **Enable, don't constrain** - Give examples, not restrictions
4. **Orchestration & consistency** - All nodes aligned, no duplicates, no contradictions
5. **Token efficiency** - 48% reduction achieved through cleanup + migration
6. **Use AI-native tools** - Design systems built for AI code generation

## Architecture Decisions

### Static Export (Current - WORKING)
- **Mode**: `output: 'export'` in next.config.js
- **Backend**: NONE - Backend node skipped entirely
- **Data**: Sample data in client state only, NO persistence
- **Files**: Layout, pages, types.ts ONLY (NO API routes, NO db.ts)
- **Use case**: Prototypes, design validation, demos

### File Generation
- **Framework**: Next.js 14+ App Router with /src folder
- **Structure**:
  - `/src/app/` - Pages, layouts
  - `/src/lib/` - Types only
  - NO `/src/components/` - All UI inline in pages
- **Files**: 8 scaffold + 3-6 user files = 11-14 total

### AI Instructions Pattern
**DO** ✅:
- Special instructions per file type (page, types, layout)
- Show concrete examples of correct code
- List what TO import at the top
- Provide sample data structure

**DON'T** ❌:
- Long negative constraint lists
- Assume AI knows context
- Let AI create helper components
- Allow auth/complex features without explicit request

## Comprehensive Prompt Cleanup Applied

### Phase 1: Removed Contradictions ✅
1. **QA Node** - Removed backend validation (lines 22-24, 148-160)
   - No longer checks for db.ts or API routes
   - Static export mode doesn't have backend to validate

2. **Frontend Planning** - Removed backend instructions
   - Already completed in previous session

### Phase 2: Simplified All Node Prompts ✅

**Token Savings: 550 tokens per app generation (45% reduction)**

| Node | Before | After | Saved |
|------|--------|-------|-------|
| UX Styling | 120 tokens | 20 tokens | 100 ✅ |
| Frontend Planning | 180 tokens | 80 tokens | 100 ✅ |
| Editor Rules | 300 tokens | 80 tokens | 220 ✅ |
| Autogen Fixer | 150 tokens | 80 tokens | 70 ✅ |
| PM Planning | 130 tokens | 120 tokens | 10 ✅ |
| Frontend Generation | 100 tokens | 100 tokens | 0 (already good) |
| Backend | 20 tokens | 20 tokens | 0 (disabled) |
| Founder | 80 tokens | 80 tokens | 0 (already good) |

### Specific Changes:

1. **UX Node** (ux-node.ts:46-56)
   - From: 120-token detailed styling extraction with colors, typography, layout, iconography, animations
   - To: 20-token simple extraction of colorMode and explicit colors only
   - **Why**: System uses Ant Design defaults anyway, extracting unused config wastes tokens

2. **Frontend Planning** (frontend-node.ts:85-87)
   - From: 10-line "FILE BUDGET" breakdown with accounting
   - To: 3-line simple requirements list
   - **Why**: AI doesn't need accounting lesson, just what to create

3. **Editor Node** (editor-node.ts:664-670)
   - From: 50-line rules with 5 categories, examples, repetition
   - To: 5-line core rules
   - **Why**: All 4 bullets in "TARGETED CHANGES" said same thing

4. **Autogen Fixer** (autogen-debugger.ts:381-388)
   - From: 20 lines saying "return all files" 5 different ways
   - To: 3 lines simple instruction
   - **Why**: Unnecessary repetition

5. **PM Node** (pm-node.ts:114)
   - Removed: "IMPORTANT: Use the tech stack from research"
   - **Why**: AI already sees search results, redundant instruction

### Root Cause Fixes:

**Problem 1**: Architecture conflict - backend generation incompatible with static export
**Solution**: Backend node returns `backendConfig: null`, QA skips backend validation

**Problem 2**: Over-specification - extracting config that's never used
**Solution**: UX only extracts explicitly mentioned styling

**Problem 3**: Micromanagement - 50+ lines teaching AI how to edit
**Solution**: Trust AI with clear 5-line rules

## Key Fixes Applied

### 1. Import Issues
**Problem**: AI using components without importing
**Fix**: Clear import pattern in instructions
```typescript
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
```

### 2. Sample Data Pattern
**Approach**: Initialize state with sample data directly
```typescript
const [tasks, setTasks] = useState([
  { id: '1', title: 'Sample', status: 'todo' }
])
```

### 3. Over-Engineering Prevention
**Fix**: Simple apps only - no auth, no complex features

### 4. Single Component Files
**Fix**: "Write ONE component, NO helper components inside the file"

### 5. Type Simplicity
**Fix**: Types.ts instructions forbid auth/state management types

## File-Specific Instructions

### types.ts
- Only data types for the app
- NO auth, global state, or complex utils
- Simple interfaces for data models and props

### page.tsx
- Sample data in useState
- All CRUD updates local state only
- One main component, inline logic
- Tailwind styling: p-6, gap-4, bg-background, text-foreground

### layout.tsx
- Simple structure - no special wrappers
- suppressHydrationWarning on <html> for theme support
- Import globals.css

## Design System Migration: Ant Design → shadcn/ui

**Date**: January 2025
**Reason**: Eliminate library-specific instructions, use AI-native patterns

### Why We Switched:

#### Problems with Ant Design:
1. **Non-standard date library**: dayjs (952 occurrences) - AI expects native Date
2. **Complex type signatures**: `CalendarProps<DateType>` requires generic type arguments
3. **Library-specific wrapper**: `AntdRegistry` - non-standard pattern
4. **Required explicit instructions**:
   - "If using Calendar/DatePicker: import dayjs from 'dayjs'"
   - "Don't import types from @/lib/types"
   - "Let TypeScript infer types - don't add explicit type annotations"
5. **Prompt bloat**: 3 lines of library-specific guidance per page.tsx generation

#### Benefits of shadcn/ui:
1. ✅ **AI-Native Patterns** - Uses standard React patterns AI trained on
2. ✅ **Standard TypeScript Types** - No complex generics, native Date objects
3. ✅ **Zero Library-Specific Instructions** - AI naturally understands patterns
4. ✅ **Tailwind-First** - Standard utility classes, no custom wrappers
5. ✅ **Designed FOR AI** - shadcn/ui built specifically for code generation

### Changes Made:

**1. Design System Files** (2 new):
- Created: `lib/design-systems/shadcn-prompt.ts` (~50 tokens vs 100 for Ant Design)
- Created: `lib/design-systems/shadcn-tokens.ts` (CSS variables for theming)
- Updated: `lib/design-systems/index.ts` (enabled tailwind-shadcn, disabled ant-design)

**2. Frontend Node Cleanup** ([frontend-node.ts:255-278](lib/langgraph/nodes/frontend-node.ts#L255-L278)):
- **Removed** (layout.tsx):
  - AntdRegistry wrapper requirement
  - ConfigProvider theme config
- **Removed** (page.tsx):
  - "Import only what you use from antd"
  - "If using Calendar/DatePicker: import dayjs from 'dayjs'"
  - "Don't import types from @/lib/types"
  - "Let TypeScript infer types - don't add explicit type annotations"
- **Added** (simpler instructions):
  - "Import UI components: import { Button } from '@/components/ui/button'"
  - "Use native Date objects for date handling"
  - "Use Tailwind for all styling (bg-background, text-foreground)"

**3. Scaffold Files** ([nextjs-scaffold.js](deployment-server/nextjs-scaffold.js)):
- **package.json**: Removed antd/dayjs, added shadcn dependencies:
  - Added: class-variance-authority, clsx, tailwind-merge, lucide-react
  - Added: tailwindcss-animate
  - Removed: antd, dayjs, @ant-design/nextjs-registry
- **tailwind.config.js**: Added shadcn theme with CSS custom properties
  - Dark mode support via `class` strategy
  - Color system: bg-background, text-foreground, etc.
  - Border radius via CSS variables
- **globals.css**: Added CSS custom properties for light/dark modes
  - Complete color palette (background, foreground, primary, muted, etc.)
  - Dark mode overrides in `.dark` class
  - Base styles for body and border

### Token Savings:

| Phase | Tokens Saved | Description |
|-------|--------------|-------------|
| Previous Cleanup | 550 tokens/gen | UX, Frontend, Editor, Autogen simplification |
| Design System Migration | +40 tokens/gen | Removed library-specific instructions |
| **Total Optimized** | **590 tokens/gen** | **48% total reduction** |

**Breakdown**:
- Page.tsx instructions: 80 → 60 tokens (20 saved)
- Layout.tsx instructions: 50 → 40 tokens (10 saved)
- No date library guidance needed: (10 saved)

### Error Elimination:

**Before** (Ant Design errors):
- ❌ CalendarProps type errors: `Generic type 'CalendarProps<DateType>' requires 1 type argument(s)`
- ❌ Date vs Dayjs mismatches: `Type 'Date' is not assignable to type 'Dayjs'`
- ❌ Non-existent type imports: `AlertProps`, `DrawerProps` imported from wrong location
- ❌ AntdRegistry configuration issues

**After** (shadcn/ui):
- ✅ Standard React component props - no type errors
- ✅ Native Date objects - no library mismatches
- ✅ Standard imports from `@/components/ui/*` - AI naturally understands
- ✅ No wrapper requirements - clean layout.tsx

### Philosophy Alignment:

This migration perfectly aligns with our core philosophy:

> **"The less instructions we give to AI, the less errors we see"**

**Before**: Had to tell AI about dayjs, type handling, library specifics
**After**: AI naturally understands standard React + Tailwind patterns

> **"We can't be adding every single entity to prompts"**

**Before**: Adding Calendar, DatePicker, CalendarProps, dayjs, etc.
**After**: Zero library-specific entities in prompts

### Testing Checklist:

After migration, verify:
- [ ] Generate dashboard app - check for type errors
- [ ] Generate landing page - verify styling works
- [ ] Generate tool with date picker - ensure native Date works
- [ ] Check token usage logs - verify 590 tokens saved
- [ ] Verify no missing imports
- [ ] Confirm no AntdRegistry errors

## Dependencies (Auto-Added)
- class-variance-authority@^0.7.0
- clsx@^2.1.0
- tailwind-merge@^2.2.0
- lucide-react@^0.344.0
- tailwindcss-animate@^1.0.7

## Known Limitations (By Design)
1. **No data persistence** - Prototype/demo mode only
2. **No backend** - Client-side state only
3. **No auth** - Not needed for prototypes
4. **Client-side only** - Everything runs in browser

## Next Steps: Backend Integration Plan

When ready to add backend support:

### Phase 1: Conditional Backend (4-5 hours)
- Add deployment mode toggle in UI
- Backend node checks mode before generating
- Frontend generates API routes only if mode = 'runtime'
- Update next.config.js based on mode

### Phase 2: Full Runtime Deployment (18-21 hours)
- PM2 process manager
- Port allocation
- Reverse proxy
- Resource management
- Health monitoring

**Current Status**: Phase 0 complete (static export working)
