# App Generation & Multi-Agent Database Optimization - Full Implementation Plan

**Status:** #notDone
**Created:** 2025-10-24
**Priority:** CRITICAL
**Timeline:** 8 weeks (4 phases)
**Owner:** Development Team

---

## 📑 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Decisions & Answers](#critical-decisions--answers)
3. [Current Architecture Analysis](#current-architecture-analysis)
4. [Database Scalability Assessment](#database-scalability-assessment)
5. [Proposed Solutions](#proposed-solutions)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Database Schema Evolution](#database-schema-evolution)
8. [Multi-Agent Communication Architecture](#multi-agent-communication-architecture)
9. [Risk Assessment & Mitigation](#risk-assessment--mitigation)
10. [Success Metrics](#success-metrics)
11. [Testing Strategy](#testing-strategy)
12. [Appendix](#appendix)

---

## Executive Summary

This document provides a comprehensive plan to optimize the app generation system and prepare the database architecture for multi-agent scaling. Based on answers to critical questions and deep codebase analysis, this plan addresses:

### Primary Goals

1. **Generation Mode Strategy:** Implement Landing Page Mode vs App Mode (toggleable) instead of removing HTML
2. **Backend Optimization:** Multi-collection support with pricing-plan-based limits
3. **Real-Time Sync:** WebSocket implementation in Phase 3 (not deferred)
4. **Editing Support:** Phase 1 priority (critical blocker for users)
5. **Database Scalability:** Prepare for multi-agent architecture with proper indexing, transactions, and communication patterns

### Key Outcomes

- ✅ **Scalable generation modes** that users can toggle between Landing Page and App Mode
- ✅ **Pricing-plan-based collection limits** (Starter: 1, Pro: 3, Enterprise: 5+)
- ✅ **WebSocket-powered real-time sync** with 95%+ efficiency gain
- ✅ **Full editing support** from day 1 (Phase 1 delivery)
- ✅ **Multi-agent-ready database** with proper indexes, transactions, and message queuing
- ✅ **Zero breaking changes** to existing functionality

---

## Critical Decisions & Answers

### User Responses to Questions

| Question | User Answer | Implementation Impact |
|----------|-------------|----------------------|
| **Q1: HTML Generation** | Keep as optional "Landing Page Mode" vs "App Mode" (toggle) | Create mode selector in UI, preserve both generators, add toggle logic in PM node |
| **Q2: Collection Limits** | Pricing-plan-based: Starter=1, Pro=3, Enterprise=5+ | Add `maxCollections` field to pricing plans, enforce in backend-node, display limits in UI |
| **Q3: WebSocket Timeline** | Phase 3 (not deferred) | Implement WebSocket server, client library, fallback to polling, connection management |
| **Q4: Editing Priority** | Phase 1 (critical) | Edit workflow must be delivered in Week 1-2, not Week 4 |
| **Q5: HTML Migration** | No existing apps | No migration tools needed, clean slate |

### Additional Requirements

**Multi-Agent Database Scaling:**
- Current 7-node system must scale to N agents (10+, 50+, 100+ future)
- Agents must communicate via message queue (not shared state only)
- Database must support:
  - Concurrent agent reads/writes without race conditions
  - Transaction support for atomic operations
  - Proper indexing for foreign keys
  - Schema versioning and evolution
  - Real-time propagation between agents and generated apps

---

## Current Architecture Analysis

### LangGraph Workflow (7-Node System)

```
┌────────────────────────────────────────────────────────┐
│                    USER INPUT                          │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
      ┌───────────────────────────────┐
      │  1. Founder Node              │  ← Business analysis
      │     /lib/langgraph/nodes/     │     Extracts requirements
      │     founder-node.ts           │
      └───────────────┬───────────────┘
                      │
                      ▼
      ┌───────────────────────────────┐
      │  2. PM Node                   │  ← Product planning
      │     pm-node.ts                │     MODE DETECTION HERE
      └───────────────┬───────────────┘     (Next.js vs HTML)
                      │
                      ▼
      ┌───────────────────────────────┐
      │  3. UX Node                   │  ← Component selection
      │     ux-node.ts                │     Design system
      └───────────────┬───────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
   ┌──────────────┐      ┌──────────────┐
   │ 4. Frontend  │      │ 5. Backend   │  ← PARALLEL
   │    Router    │      │    Node      │     EXECUTION
   │              │      │              │
   │ ┌──────────┐ │      │ Schema       │
   │ │Next.js   │ │      │ Generation   │
   │ │or HTML   │ │      └──────────────┘
   │ └──────────┘ │
   └──────────────┘
          │                       │
          └───────────┬───────────┘
                      │
                      ▼
      ┌───────────────────────────────┐
      │  6. QA Node                   │  ← Validation
      │     qa-node.ts                │     Auto-fix (3 attempts)
      └───────────────┬───────────────┘
                      │
                      ▼
      ┌───────────────────────────────┐
      │  7. DevOps Node               │  ← Deployment
      │     devops-node.ts            │     PocketBase + Preview
      └───────────────┬───────────────┘
                      │
                      ▼
      ┌───────────────────────────────┐
      │       GENERATED APP            │
      └───────────────────────────────┘
```

### State Flow (AppGenState)

```typescript
// File: /lib/langgraph/types.ts

interface AppGenState {
  // INPUT LAYER
  userDescription: string
  userId: string
  projectId: string

  // FOUNDER NODE OUTPUT
  refinedRequirements?: string
  businessContext?: {
    targetAudience: string
    primaryGoal: string
    successMetrics: string[]
  }

  // PM NODE OUTPUT
  plan?: string
  context?: {
    appType: string
    complexity: string
    designStyle: string
    visualTone: string
    generationMode: 'nextjs' | 'html'  // ← CRITICAL DECISION
    generationConfidence: 'high' | 'medium' | 'low'
  }

  // UX NODE OUTPUT
  componentNeeds?: {
    navigation: string
    hero: string
    features: string
    cta: string
  }
  designSystemPrompt?: string
  examples?: DesignExample[]

  // BACKEND NODE OUTPUT (parallel with Frontend)
  backendConfig?: {
    collections: Collection[]  // ← LIMITED TO 1 CURRENTLY
    pages: Page[]
  }

  // FRONTEND NODE OUTPUT (parallel with Backend)
  files?: GeneratedFile[]
  isMultiPage?: boolean

  // QA NODE OUTPUT
  validationResult?: {
    valid: boolean
    errors: ValidationError[]
    warnings: string[]
    fixed: boolean
  }
  debugAttempts?: number

  // DEVOPS NODE OUTPUT
  deployUrl?: string

  // METADATA
  stage: string
  completedNodes: string[]
  errors: Error[]
  artifacts: Map<string, any>

  // EDITING SESSION (new)
  editingSession?: {
    previousVersion: string
    editIntent: string
    affectedFiles: string[]
  }
}
```

### Key Files Reference

| File | Lines | Responsibility | Current Issues |
|------|-------|----------------|----------------|
| [`/lib/langgraph/workflow.ts`](lib/langgraph/workflow.ts) | Full | Graph orchestration, node wiring | ⚠️ No error recovery between nodes |
| [`/lib/langgraph/nodes/pm-node.ts`](lib/langgraph/nodes/pm-node.ts) | 80-91 | Mode detection (Next.js vs HTML) | ⚠️ Decision never reconsidered |
| [`/lib/generation-mode-config.ts`](lib/generation-mode-config.ts) | Full | Keyword scoring for mode | ⚠️ Hardcoded heuristics |
| [`/lib/langgraph/nodes/frontend-router.ts`](lib/langgraph/nodes/frontend-router.ts) | Full | Routes to Next.js or HTML generator | ✅ Works as designed |
| [`/lib/langgraph/nodes/backend-node.ts`](lib/langgraph/nodes/backend-node.ts) | 71-73 | **Artificially limits to 1 collection** | 🚨 CRITICAL BOTTLENECK |
| [`/lib/database-injection.ts`](lib/database-injection.ts) | 27-313 | Client-side DB API, polling sync | ⚠️ Polling-based, no WebSocket |
| [`/app/api/ai/chat/route.ts`](app/api/ai/chat/route.ts) | 108-120 | Chat endpoint, stage routing | 🚨 NO EDITING SUPPORT |

---

## Database Scalability Assessment

### Current Database Schema (PocketBase Collections)

```
┌─────────────────────────────────────────────────────────┐
│                     USERS                                │
├─────────────────────────────────────────────────────────┤
│ id, email, username, password                           │
│ totalTokens, usedTokens (⚠️ RACE CONDITION)            │
│ dailyTokens, lastDailyReset                             │
│ packageId (→ pricing_plans)                            │
│ packageExpiry                                            │
│                                                          │
│ Relationships: 1:N projects, transactions, token_usage  │
└─────────────────────────────────────────────────────────┘
                      │
                      │ 1:N (NO INDEX ON userId)
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   PROJECTS                               │
├─────────────────────────────────────────────────────────┤
│ id, userId (⚠️ NO INDEX)                               │
│ name, description                                        │
│ stage ('planning'|'building'|'completed'|'error')       │
│ plan (text)                                              │
│ backendConfig (JSON - serialized)                       │
│ context (JSON - serialized)                             │
│ thumbnail (file)                                         │
│ deployUrl                                                │
│                                                          │
│ Relationships: 1:N project_files, project_messages,     │
│                     workflow_checkpoints                 │
└─────────────────────────────────────────────────────────┘
                      │
                      │ 1:N (NO INDEX ON projectId)
                      ▼
┌─────────────────────────────────────────────────────────┐
│               PROJECT_FILES                              │
├─────────────────────────────────────────────────────────┤
│ id, projectId (⚠️ NO INDEX)                            │
│ path, content (large text), encoding, size              │
│                                                          │
│ Issue: 50 files = 50 INSERT statements (NO BATCH)       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│            WORKFLOW_CHECKPOINTS                          │
├─────────────────────────────────────────────────────────┤
│ id, projectId (⚠️ NO INDEX)                            │
│ state (JSON - entire AppGenState serialized)            │
│ stage, completedNodes (array), lastNode, timestamp      │
│                                                          │
│ Issue: Full state save after EACH node (memory heavy)   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              EXAMPLE_CATEGORIES                          │
├─────────────────────────────────────────────────────────┤
│ id, slug (indexed), name, description                   │
│ minExamplesRequired, targetExamples                     │
│ parentCategory, isActive, priority (0-10)               │
└─────────────────────────────────────────────────────────┘
                      │
                      │ 1:N
                      ▼
┌─────────────────────────────────────────────────────────┐
│              DESIGN_EXAMPLES                             │
├─────────────────────────────────────────────────────────┤
│ id, categoryId, htmlContent (large)                     │
│ styleVariant, industryContext (array)                   │
│ complexityLevel, qualityScore, performanceScore         │
│ version, isActive, replacedBy, usageCount               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                 TOKEN_USAGE                              │
├─────────────────────────────────────────────────────────┤
│ id, userId (⚠️ NO INDEX), projectId (⚠️ NO INDEX)     │
│ tokensUsed, endpoint, timestamp                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                TRANSACTIONS                              │
├─────────────────────────────────────────────────────────┤
│ id, userId (⚠️ NO INDEX)                               │
│ type, amount, tokens, currency                          │
│ paymentProvider, paymentId                              │
│ status ('pending'|'completed'|'failed'|'refunded')      │
└─────────────────────────────────────────────────────────┘
```

### Critical Database Issues

#### 1. Race Condition: Token Consumption

**File:** Identified across token consumption paths

```typescript
// CURRENT (BROKEN):
const user = await pb.collection('users').getOne(userId)
// ⚠️ Another request could read here
await pb.collection('users').update(userId, {
  usedTokens: user.usedTokens + tokensConsumed  // ← Lost update
})

// SCENARIO:
// Request A reads usedTokens = 100
// Request B reads usedTokens = 100  (before A writes)
// Request A writes usedTokens = 120 (+20 tokens)
// Request B writes usedTokens = 140 (+40 tokens)
// RESULT: Only 40 charged instead of 60
```

**Impact:** Revenue loss, users get free tokens

#### 2. Missing Foreign Key Indexes

**Performance Impact:**

```sql
-- Slow query (full table scan):
SELECT * FROM project_files WHERE projectId = 'abc123'
-- With 10,000 files across 100 projects = 10,000 row scan

-- Fast query (with index):
CREATE INDEX idx_project_files_projectId ON project_files(projectId)
-- Only scans ~100 files for project 'abc123'
```

**Missing Indexes:**
- `projects.userId` (N+1 query when listing user's projects)
- `project_files.projectId` (slow file loading)
- `workflow_checkpoints.projectId` (slow checkpoint retrieval)
- `token_usage.userId` (slow billing reports)
- `token_usage.projectId` (slow project analytics)
- `transactions.userId` (slow payment history)

#### 3. No Transaction Support

**PocketBase Limitation:** SQLite backend has transaction support, but PocketBase JS SDK doesn't expose it

**Workarounds Available:**
- **Optimistic Locking:** Add `version` field, use `If-Match` header
- **Custom Hooks:** Use PocketBase server-side hooks for atomic operations
- **Batch API:** Implement custom batch endpoint

#### 4. No Batch Operations

**File:** Observed in DevOps node file saving

```typescript
// CURRENT (SLOW):
for (const file of files) {
  await pb.collection('project_files').create({
    projectId, path: file.path, content: file.content
  })
}
// 50 files = 50 HTTP requests = ~2-5 seconds

// DESIRED (FAST):
await pb.collection('project_files').createBatch(
  files.map(f => ({ projectId, ...f }))
)
// 50 files = 1 HTTP request = ~200ms
```

#### 5. Checkpoint Serialization Overhead

**File:** `/lib/langgraph/checkpointer.ts`

```typescript
// Saves ENTIRE state after EACH node
await pb.collection('workflow_checkpoints').create({
  projectId,
  state: JSON.stringify(state),  // Could be 100KB+
  stage, completedNodes, lastNode, timestamp
})
```

**Issues:**
- Map-to-object conversion loses type info
- No compression (checkpoint could be 100KB+ for large projects)
- Every node save = full state write (7 nodes = 7 full writes)

---

## Proposed Solutions

### Solution 1: Landing Page Mode vs App Mode (Toggleable)

**Strategy:** Keep both Next.js and HTML generators, let users toggle between modes

#### Implementation

**1.1 Add Mode Selector to UI**

**File:** Create `/components/generation-mode-selector.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

type GenerationMode = 'landing-page' | 'app'

interface GenerationModeSelectorProps {
  initialMode?: GenerationMode
  onChange: (mode: GenerationMode) => void
  disabled?: boolean
}

export function GenerationModeSelector({
  initialMode = 'app',
  onChange,
  disabled = false
}: GenerationModeSelectorProps) {
  const [selected, setSelected] = useState<GenerationMode>(initialMode)

  const modes = [
    {
      id: 'landing-page' as const,
      name: 'Landing Page Mode',
      description: 'Fast, lightweight HTML for marketing pages',
      features: [
        'Instant load times',
        'SEO optimized',
        'Single HTML file',
        'No build step'
      ],
      bestFor: 'Marketing sites, portfolios, simple presentations'
    },
    {
      id: 'app' as const,
      name: 'App Mode',
      description: 'Full Next.js framework for scalable applications',
      features: [
        'Database integration',
        'Multi-page routing',
        'TypeScript support',
        'Backend API routes'
      ],
      bestFor: 'Dashboards, SaaS tools, complex applications'
    }
  ]

  const handleSelect = (mode: GenerationMode) => {
    setSelected(mode)
    onChange(mode)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => handleSelect(mode.id)}
          disabled={disabled}
          className={`
            relative p-6 rounded-lg border-2 transition-all text-left
            ${selected === mode.id
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {selected === mode.id && (
            <div className="absolute top-4 right-4">
              <Check className="w-6 h-6 text-blue-500" />
            </div>
          )}

          <h3 className="text-lg font-semibold mb-2">{mode.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {mode.description}
          </p>

          <div className="space-y-2 mb-4">
            {mode.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-500">
            Best for: {mode.bestFor}
          </div>
        </button>
      ))}
    </div>
  )
}
```

**1.2 Update PM Node with Toggle Logic**

**File:** `/lib/langgraph/nodes/pm-node.ts`

```typescript
import { GenerationMode } from '@/lib/types'

export async function pmNode(state: AppGenState): Promise<Partial<AppGenState>> {
  // Check if user explicitly selected mode
  const userSelectedMode = state.context?.userSelectedMode as GenerationMode | undefined

  let generationMode: 'nextjs' | 'html'
  let modeReason: string

  if (userSelectedMode) {
    // User explicitly selected mode via UI toggle
    generationMode = userSelectedMode === 'app' ? 'nextjs' : 'html'
    modeReason = `User selected ${userSelectedMode} mode`
  } else {
    // Fallback to automatic detection (existing logic)
    const explicitMode = isExplicitModeRequest(state.userDescription)
    const modeDetection = explicitMode
      ? { mode: explicitMode, confidence: 'high' as const }
      : detectGenerationMode(state.userDescription)

    generationMode = modeDetection.mode
    modeReason = `Auto-detected based on: ${modeDetection.reason}`
  }

  // Rest of PM node logic...
  const context = {
    ...state.context,
    generationMode,
    generationConfidence: 'high',
    generationReason: modeReason
  }

  return {
    plan: '...',
    context,
    stage: 'planning'
  }
}
```

**1.3 Update Chat UI to Include Mode Selector**

**File:** `/components/ChatPanelClaude.tsx` (or similar)

```typescript
import { GenerationModeSelector } from '@/components/generation-mode-selector'

export function ChatPanel() {
  const [generationMode, setGenerationMode] = useState<GenerationMode>('app')

  const handleSubmit = async (message: string) => {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        projectId,
        userId,
        userSelectedMode: generationMode  // ← Pass to backend
      })
    })
  }

  return (
    <div>
      {/* Show mode selector before first generation */}
      {!hasGeneratedApp && (
        <GenerationModeSelector
          onChange={setGenerationMode}
          initialMode="app"
        />
      )}

      {/* Chat interface */}
      <ChatInput onSubmit={handleSubmit} />
    </div>
  )
}
```

**Benefits:**
- ✅ Users choose explicitly (no guessing)
- ✅ Both generators preserved
- ✅ Can toggle between modes in UI
- ✅ Auto-detection still works as fallback

---

### Solution 2: Pricing-Plan-Based Collection Limits

**Strategy:** Store `maxCollections` in pricing plans, enforce in backend-node, display in UI

#### Database Schema Update

**File:** Create migration `/migrations/1234567890_add_collection_limits.js`

```javascript
/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  // Add maxCollections field to pricing_plans collection
  const collection = db.findCollectionByNameOrId('pricing_plans')

  collection.schema.addField(new Field({
    name: 'maxCollections',
    type: 'number',
    required: true,
    min: 1,
    max: 100,
    system: false
  }))

  db.saveCollection(collection)

  // Set defaults for existing plans
  const plans = db.select('pricing_plans').all()
  plans.forEach(plan => {
    let maxCollections = 1

    if (plan.name === 'Starter' || plan.name === 'Free') {
      maxCollections = 1
    } else if (plan.name === 'Pro' || plan.name === 'Professional') {
      maxCollections = 3
    } else if (plan.name === 'Enterprise' || plan.name === 'Business') {
      maxCollections = 10  // Effectively unlimited for most use cases
    }

    db.update('pricing_plans', plan.id, {
      maxCollections: maxCollections
    })
  })
}, (db) => {
  // Rollback
  const collection = db.findCollectionByNameOrId('pricing_plans')
  collection.schema.removeField('maxCollections')
  db.saveCollection(collection)
})
```

#### Backend Enforcement

**File:** `/lib/langgraph/nodes/backend-node.ts`

```typescript
import { getPocketBase } from '@/lib/services/pocketbase'

export async function backendNode(state: AppGenState): Promise<Partial<AppGenState>> {
  // Get user's pricing plan
  const pb = getPocketBase()
  const user = await pb.collection('users').getOne(state.userId, {
    expand: 'package'  // Assuming packageId relates to pricing_plans
  })

  const maxCollections = user.expand?.package?.maxCollections || 1

  // Generate backend schema with AI
  const prompt = `
You are designing a database schema for this application.

USER REQUEST:
${state.userDescription}

PRODUCT PLAN:
${state.plan}

PRICING PLAN LIMIT: Maximum ${maxCollections} collection(s)

Generate a JSON schema with:
- Up to ${maxCollections} collections
- Fields with appropriate types
- Relationships using "relation" type

If the app requires more than ${maxCollections} collections, prioritize the most critical entities.
You MUST NOT exceed ${maxCollections} collections.

Return JSON:
{
  "collections": [
    {
      "name": "collection_name",
      "fields": [
        { "name": "field_name", "type": "string|text|number|boolean|relation", "target": "other_collection" }
      ]
    }
  ],
  "pages": [
    { "name": "Page Name", "route": "/" }
  ]
}
`

  const result = await generateWithLogging({
    prompt,
    schema: BackendConfigSchema,
    model: 'gemini-2.0-flash',
    context: { node: 'backend', projectId: state.projectId }
  })

  // ENFORCE LIMIT (safety check)
  const enforcedCollections = result.collections.slice(0, maxCollections)

  if (result.collections.length > maxCollections) {
    console.warn(
      `AI generated ${result.collections.length} collections, ` +
      `but plan limit is ${maxCollections}. Truncated to first ${maxCollections}.`
    )
  }

  return {
    backendConfig: {
      collections: enforcedCollections,
      pages: result.pages
    },
    stage: 'backend-complete',
    completedNodes: [...state.completedNodes, 'backend']
  }
}
```

#### UI Display

**File:** Create `/components/collection-limit-badge.tsx`

```typescript
'use client'

import { Info } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'

interface CollectionLimitBadgeProps {
  current: number
  max: number
  planName: string
}

export function CollectionLimitBadge({ current, max, planName }: CollectionLimitBadgeProps) {
  const percentage = (current / max) * 100
  const isNearLimit = percentage >= 80
  const isAtLimit = current >= max

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
        ${isAtLimit
          ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
          : isNearLimit
          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        }
      `}
    >
      <span className="font-medium">
        {current} / {max} collections
      </span>

      <Tooltip content={`Your ${planName} plan allows up to ${max} database collections. ${isAtLimit ? 'Upgrade to add more.' : ''}`}>
        <Info className="w-4 h-4" />
      </Tooltip>
    </div>
  )
}
```

**Benefits:**
- ✅ Flexible limits per plan
- ✅ Revenue-driven (incentivizes upgrades)
- ✅ AI prompt includes limit
- ✅ Enforced in code (safety)

---

### Solution 3: WebSocket Real-Time Sync (Phase 3)

**Strategy:** Replace polling with WebSocket connections, fallback to polling if unavailable

#### Architecture

```
┌─────────────────────────────────────────────────────────┐
│           GENERATED APP (Client)                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │  window.db API                                      │ │
│  │  - subscribe(collection, callback)                  │ │
│  │  - add(collection, record)                          │ │
│  │  - update(collection, id, data)                     │ │
│  │  - delete(collection, id)                           │ │
│  └─────────────────────┬──────────────────────────────┘ │
│                        │                                 │
│                        ▼                                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │  WebSocket Client Layer                            │ │
│  │  - Establishes WS connection to server             │ │
│  │  - Sends subscribe/unsubscribe messages            │ │
│  │  - Receives real-time updates                      │ │
│  │  - Auto-reconnects on disconnect                   │ │
│  └─────────────────────┬──────────────────────────────┘ │
└────────────────────────┼────────────────────────────────┘
                         │
                         │ WebSocket (wss://)
                         ▼
┌─────────────────────────────────────────────────────────┐
│           WEBSOCKET SERVER                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Connection Manager                                 │ │
│  │  - Tracks active connections per project           │ │
│  │  - Manages subscriptions (project → collections)   │ │
│  │  - Broadcasts updates to subscribers               │ │
│  └─────────────────────┬──────────────────────────────┘ │
│                        │                                 │
│                        ▼                                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │  PocketBase Realtime API                           │ │
│  │  - pb.collection(name).subscribe('*', callback)    │ │
│  │  - Receives DB changes from PocketBase             │ │
│  │  - Filters by projectId                            │ │
│  └─────────────────────┬──────────────────────────────┘ │
└────────────────────────┼────────────────────────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │  PocketBase  │
                  │   Database   │
                  └──────────────┘
```

#### Implementation

**3.1 WebSocket Server**

**File:** Create `/lib/websocket/server.ts`

```typescript
import { WebSocketServer, WebSocket } from 'ws'
import { Server as HTTPServer } from 'http'
import { getPocketBase } from '@/lib/services/pocketbase'

interface ClientSubscription {
  projectId: string
  collections: Set<string>
}

export class DatabaseWebSocketServer {
  private wss: WebSocketServer
  private clients: Map<WebSocket, ClientSubscription>
  private pbSubscriptions: Map<string, () => void>  // collection → unsubscribe

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ server, path: '/api/db/realtime' })
    this.clients = new Map()
    this.pbSubscriptions = new Map()

    this.wss.on('connection', this.handleConnection.bind(this))
  }

  private handleConnection(ws: WebSocket, req: any) {
    console.log('WebSocket client connected')

    // Extract projectId from URL query
    const url = new URL(req.url!, `http://${req.headers.host}`)
    const projectId = url.searchParams.get('projectId')

    if (!projectId) {
      ws.close(1008, 'Missing projectId')
      return
    }

    // Initialize client subscription
    this.clients.set(ws, {
      projectId,
      collections: new Set()
    })

    ws.on('message', (data) => this.handleMessage(ws, data))
    ws.on('close', () => this.handleDisconnect(ws))
    ws.on('error', (err) => console.error('WebSocket error:', err))

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      projectId
    }))
  }

  private async handleMessage(ws: WebSocket, data: any) {
    try {
      const message = JSON.parse(data.toString())
      const subscription = this.clients.get(ws)

      if (!subscription) return

      switch (message.type) {
        case 'subscribe':
          await this.handleSubscribe(ws, subscription, message.collection)
          break

        case 'unsubscribe':
          this.handleUnsubscribe(ws, subscription, message.collection)
          break

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }))
          break
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error)
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }))
    }
  }

  private async handleSubscribe(
    ws: WebSocket,
    subscription: ClientSubscription,
    collectionName: string
  ) {
    // Add to client's subscriptions
    subscription.collections.add(collectionName)

    // Subscribe to PocketBase realtime if not already
    const pbKey = `${subscription.projectId}:${collectionName}`
    if (!this.pbSubscriptions.has(pbKey)) {
      const pb = getPocketBase()

      const unsubscribe = await pb.collection(collectionName).subscribe('*', (e) => {
        // Filter by projectId
        if (e.record.projectId !== subscription.projectId) return

        // Broadcast to all subscribed clients
        this.broadcast(subscription.projectId, collectionName, {
          type: 'update',
          collection: collectionName,
          action: e.action,  // 'create', 'update', 'delete'
          record: e.record
        })
      })

      this.pbSubscriptions.set(pbKey, unsubscribe)
    }

    // Send current data
    const pb = getPocketBase()
    const records = await pb.collection(collectionName).getFullList({
      filter: `projectId = "${subscription.projectId}"`
    })

    ws.send(JSON.stringify({
      type: 'initial-data',
      collection: collectionName,
      records
    }))
  }

  private handleUnsubscribe(
    ws: WebSocket,
    subscription: ClientSubscription,
    collectionName: string
  ) {
    subscription.collections.delete(collectionName)

    // If no clients subscribed to this collection anymore, unsubscribe from PocketBase
    const hasOtherSubscribers = Array.from(this.clients.values()).some(
      sub => sub.projectId === subscription.projectId && sub.collections.has(collectionName)
    )

    if (!hasOtherSubscribers) {
      const pbKey = `${subscription.projectId}:${collectionName}`
      const unsubscribe = this.pbSubscriptions.get(pbKey)
      if (unsubscribe) {
        unsubscribe()
        this.pbSubscriptions.delete(pbKey)
      }
    }
  }

  private broadcast(projectId: string, collection: string, message: any) {
    this.clients.forEach((subscription, ws) => {
      if (
        subscription.projectId === projectId &&
        subscription.collections.has(collection)
      ) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message))
        }
      }
    })
  }

  private handleDisconnect(ws: WebSocket) {
    console.log('WebSocket client disconnected')
    this.clients.delete(ws)
  }
}
```

**3.2 Client-Side WebSocket Integration**

**File:** `/lib/database-injection.ts` (update)

```javascript
// Injected into generated apps
(function() {
  const projectId = '{{PROJECT_ID}}'
  const collections = {{COLLECTIONS_JSON}}

  // WebSocket connection state
  let ws = null
  let isConnected = false
  let reconnectAttempts = 0
  const MAX_RECONNECT_ATTEMPTS = 5
  const RECONNECT_DELAY = 2000

  // Fallback to polling if WebSocket unavailable
  let pollingInterval = null
  let shouldPoll = false

  // Subscription callbacks
  const syncCallbacks = new Map()  // collection → Set<callback>

  // Cache
  const collectionCache = new Map()  // collection → records[]

  // Initialize WebSocket
  function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/db/realtime?projectId=${projectId}`

    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('[DB] WebSocket connected')
      isConnected = true
      reconnectAttempts = 0

      // Stop polling if it was running
      if (pollingInterval) {
        clearInterval(pollingInterval)
        pollingInterval = null
        shouldPoll = false
      }

      // Resubscribe to all collections
      syncCallbacks.forEach((callbacks, collection) => {
        if (callbacks.size > 0) {
          ws.send(JSON.stringify({
            type: 'subscribe',
            collection
          }))
        }
      })
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)

      switch (message.type) {
        case 'connected':
          console.log('[DB] Connection confirmed')
          break

        case 'initial-data':
          // Cache initial data
          collectionCache.set(message.collection, message.records)

          // Trigger callbacks
          const callbacks = syncCallbacks.get(message.collection)
          if (callbacks) {
            callbacks.forEach(cb => cb(message.records))
          }
          break

        case 'update':
          // Update cache
          updateCache(message.collection, message.action, message.record)

          // Trigger callbacks
          const subs = syncCallbacks.get(message.collection)
          if (subs) {
            const cached = collectionCache.get(message.collection) || []
            subs.forEach(cb => cb(cached))
          }
          break

        case 'pong':
          // Heartbeat response
          break

        case 'error':
          console.error('[DB] Server error:', message.message)
          break
      }
    }

    ws.onerror = (error) => {
      console.error('[DB] WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('[DB] WebSocket disconnected')
      isConnected = false

      // Attempt reconnect
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++
        console.log(`[DB] Reconnecting (attempt ${reconnectAttempts})...`)
        setTimeout(initWebSocket, RECONNECT_DELAY * reconnectAttempts)
      } else {
        // Fall back to polling
        console.warn('[DB] WebSocket unavailable, falling back to polling')
        shouldPoll = true
        startPolling()
      }
    }

    // Heartbeat to keep connection alive
    setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000)  // Every 30 seconds
  }

  // Polling fallback
  function startPolling() {
    if (!shouldPoll || pollingInterval) return

    pollingInterval = setInterval(() => {
      syncCallbacks.forEach(async (callbacks, collection) => {
        if (callbacks.size > 0) {
          try {
            const response = await fetch(`/api/db/${projectId}/${collection}`)
            const data = await response.json()
            const records = data.items || []

            collectionCache.set(collection, records)
            callbacks.forEach(cb => cb(records))
          } catch (error) {
            console.error(`[DB] Polling error for ${collection}:`, error)
          }
        }
      })
    }, 2000)  // Poll every 2 seconds
  }

  // Cache update helper
  function updateCache(collection, action, record) {
    const cached = collectionCache.get(collection) || []

    if (action === 'create') {
      cached.push(record)
    } else if (action === 'update') {
      const index = cached.findIndex(r => r.id === record.id)
      if (index >= 0) cached[index] = record
    } else if (action === 'delete') {
      const index = cached.findIndex(r => r.id === record.id)
      if (index >= 0) cached.splice(index, 1)
    }

    collectionCache.set(collection, cached)
  }

  // window.db API
  window.db = {
    // Subscribe to real-time updates
    subscribe: function(collection, callback) {
      if (!syncCallbacks.has(collection)) {
        syncCallbacks.set(collection, new Set())
      }

      syncCallbacks.get(collection).add(callback)

      // Send subscribe message
      if (isConnected && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'subscribe',
          collection
        }))
      } else if (shouldPoll) {
        // Fetch initial data via polling
        fetch(`/api/db/${projectId}/${collection}`)
          .then(r => r.json())
          .then(data => {
            const records = data.items || []
            collectionCache.set(collection, records)
            callback(records)
          })
      }

      // Return unsubscribe function
      return () => {
        const callbacks = syncCallbacks.get(collection)
        callbacks?.delete(callback)

        if (callbacks?.size === 0) {
          syncCallbacks.delete(collection)

          // Unsubscribe from server
          if (isConnected && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'unsubscribe',
              collection
            }))
          }
        }
      }
    },

    // Fetch all records
    get: async function(collection, options = {}) {
      const { expand } = options

      let url = `/api/db/${projectId}/${collection}`
      if (expand) {
        url += `?expand=${Array.isArray(expand) ? expand.join(',') : expand}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error(`Failed to fetch ${collection}`)

      const data = await response.json()
      return data.items || []
    },

    // Add record
    add: async function(collection, record) {
      const response = await fetch(`/api/db/${projectId}/${collection}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...record, projectId })
      })

      if (!response.ok) throw new Error(`Failed to add to ${collection}`)

      const newRecord = await response.json()

      // Optimistically update cache
      const cached = collectionCache.get(collection) || []
      collectionCache.set(collection, [...cached, newRecord])

      // Trigger callbacks (WebSocket update will confirm)
      const callbacks = syncCallbacks.get(collection)
      if (callbacks) {
        callbacks.forEach(cb => cb(collectionCache.get(collection)))
      }

      return newRecord
    },

    // Update record
    update: async function(collection, id, updates) {
      const response = await fetch(`/api/db/${projectId}/${collection}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) throw new Error(`Failed to update ${collection}`)

      const updated = await response.json()

      // Optimistically update cache
      const cached = collectionCache.get(collection) || []
      const index = cached.findIndex(r => r.id === id)
      if (index >= 0) {
        cached[index] = updated
        collectionCache.set(collection, cached)
      }

      // Trigger callbacks
      const callbacks = syncCallbacks.get(collection)
      if (callbacks) {
        callbacks.forEach(cb => cb(cached))
      }

      return updated
    },

    // Delete record
    delete: async function(collection, id) {
      const response = await fetch(`/api/db/${projectId}/${collection}/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error(`Failed to delete from ${collection}`)

      // Optimistically update cache
      const cached = collectionCache.get(collection) || []
      const filtered = cached.filter(r => r.id !== id)
      collectionCache.set(collection, filtered)

      // Trigger callbacks
      const callbacks = syncCallbacks.get(collection)
      if (callbacks) {
        callbacks.forEach(cb => cb(filtered))
      }

      return true
    }
  }

  // Initialize on page load
  initWebSocket()
})()
```

**Benefits:**
- ✅ Instant updates (no polling delay)
- ✅ 95%+ reduction in network requests
- ✅ Scales to 1000+ concurrent users
- ✅ Fallback to polling if WebSocket unavailable
- ✅ Auto-reconnect on disconnect

---

### Solution 4: Editing Support (Phase 1 Priority)

**Strategy:** Deliver edit workflow in Week 1-2, not Week 4

#### Architecture

```
┌──────────────────────────────────────────────────────┐
│           CHAT ENDPOINT                               │
│  /app/api/ai/chat/route.ts                           │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
        ┌──────────────────────┐
        │  detectStage()       │
        │  - Check if project  │
        │    has files         │
        │  - Analyze message   │
        │    for edit intent   │
        └──────┬───────────────┘
               │
       ┌───────┴────────┐
       │                │
   NEW │            EDIT│
       ▼                ▼
┌──────────────┐  ┌─────────────────────┐
│  AppGen      │  │  EditWorkflow       │
│  Workflow    │  │                     │
│              │  │  1. EditPlanner     │
│ 1. Founder   │  │     ↓               │
│ 2. PM        │  │  2. Frontend/Backend│
│ 3. UX        │  │     (parallel)      │
│ 4. FE/BE     │  │     ↓               │
│ 5. QA        │  │  3. QA              │
│ 6. DevOps    │  │     ↓               │
│              │  │  4. DevOps          │
└──────────────┘  └─────────────────────┘
```

#### Implementation

**4.1 Edit Detection**

**File:** `/app/api/ai/chat/route.ts`

```typescript
function detectStage(message: string, project: Project | null): 'generating' | 'editing' {
  // If no project or no files, must be new generation
  if (!project || !project.files || project.files.length === 0) {
    return 'generating'
  }

  // Edit intent keywords
  const editKeywords = [
    'change', 'update', 'modify', 'fix', 'add',
    'remove', 'delete', 'adjust', 'improve', 'refactor',
    'make it', 'can you', 'please', 'instead',
    'edit', 'alter', 'replace', 'swap'
  ]

  const messageLC = message.toLowerCase()
  const hasEditIntent = editKeywords.some(kw => messageLC.includes(kw))

  return hasEditIntent ? 'editing' : 'generating'
}

export async function POST(req: Request) {
  const { message, projectId, userId, userSelectedMode } = await req.json()

  // Load project
  const project = projectId ? await loadProject(projectId) : null

  // Detect stage
  const stage = detectStage(message, project)

  console.log(`[Chat] Stage detected: ${stage}`)

  // Route to appropriate workflow
  if (stage === 'editing') {
    return streamEditWorkflow({
      userDescription: message,
      projectId,
      userId,
      stage: 'editing'
    })
  } else {
    return streamAppGenWorkflow({
      userDescription: message,
      projectId,
      userId,
      userSelectedMode,  // ← Pass mode selection
      stage: 'generating'
    })
  }
}
```

**4.2 Edit Planner Node**

**File:** Create `/lib/langgraph/nodes/edit-planner-node.ts`

```typescript
import { generateWithLogging } from '@/lib/ai-core'
import { getPocketBase } from '@/lib/services/pocketbase'
import { z } from 'zod'
import type { AppGenState } from '../types'

const EditPlanSchema = z.object({
  editPlan: z.string().describe('Brief description of changes'),
  affectedFiles: z.array(z.string()).describe('Files to modify'),
  needsNewFiles: z.array(z.string()).describe('New files to create'),
  needsBackendUpdate: z.boolean(),
  backendChanges: z.object({
    addCollections: z.array(z.any()).optional(),
    modifyCollections: z.array(z.any()).optional(),
    removeCollections: z.array(z.string()).optional()
  }).optional(),
  preserveDesignSystem: z.boolean()
})

export async function editPlannerNode(state: AppGenState): Promise<Partial<AppGenState>> {
  const pb = getPocketBase()

  // Load existing project
  const project = await pb.collection('projects').getOne(state.projectId, {
    expand: 'files'
  })

  if (!project.files || project.files.length === 0) {
    throw new Error('Cannot edit: No existing files found')
  }

  const existingFiles = project.files
  const existingBackendConfig = project.backendConfig || { collections: [], pages: [] }
  const existingContext = project.context || {}

  // Analyze edit request
  const prompt = `
You are planning edits to an existing ${existingContext.generationMode === 'nextjs' ? 'Next.js' : 'HTML'} application.

EXISTING APP DETAILS:
- Files: ${existingFiles.map((f: any) => f.path).join(', ')}
- Backend Schema: ${JSON.stringify(existingBackendConfig, null, 2)}
- Design System:
  - Primary Color: ${existingContext.designSystem?.primaryColor || 'Not set'}
  - Font: ${existingContext.designSystem?.fontFamily || 'Not set'}
- Component Choices: ${JSON.stringify(existingContext.componentChoices || {}, null, 2)}

USER EDIT REQUEST:
"${state.userDescription}"

ANALYZE THE REQUEST:

1. Which existing files need modification? (Return file paths)
2. Are new files needed? (Return new file paths)
3. Does the backend schema need updates?
   - New collections?
   - New fields in existing collections?
   - Remove collections?
4. Should we preserve the existing design system or make changes?

IMPORTANT RULES:
- Be surgical: only modify what's necessary
- Preserve existing architecture and patterns
- Maintain code style consistency
- Don't break existing functionality

Return JSON with your analysis.
`

  const result = await generateWithLogging({
    prompt,
    schema: EditPlanSchema,
    model: 'gemini-2.0-flash',
    context: {
      node: 'editPlanner',
      projectId: state.projectId
    }
  })

  // Merge backend changes if needed
  let updatedBackendConfig = existingBackendConfig

  if (result.needsBackendUpdate && result.backendChanges) {
    const { addCollections = [], modifyCollections = [], removeCollections = [] } = result.backendChanges

    // Remove collections
    let collections = existingBackendConfig.collections.filter(
      (c: any) => !removeCollections.includes(c.name)
    )

    // Add new collections
    collections = [...collections, ...addCollections]

    // Modify collections (merge fields)
    modifyCollections.forEach((mod: any) => {
      const index = collections.findIndex((c: any) => c.name === mod.name)
      if (index >= 0) {
        collections[index] = {
          ...collections[index],
          fields: [...collections[index].fields, ...mod.newFields]
        }
      }
    })

    updatedBackendConfig = {
      ...existingBackendConfig,
      collections
    }
  }

  return {
    plan: result.editPlan,
    context: {
      ...existingContext,
      editMode: true,
      affectedFiles: result.affectedFiles,
      needsNewFiles: result.needsNewFiles,
      preserveDesignSystem: result.preserveDesignSystem
    },
    backendConfig: updatedBackendConfig,
    stage: 'edit-planning',
    completedNodes: ['editPlanner']
  }
}
```

**4.3 Edit Workflow**

**File:** Create `/lib/langgraph/workflows/edit-workflow.ts`

```typescript
import { StateGraph } from '@langchain/langgraph'
import type { AppGenState } from '../types'
import { editPlannerNode } from '../nodes/edit-planner-node'
import { frontendNodeNextJS } from '../nodes/frontend-node-nextjs'
import { frontendNode } from '../nodes/frontend-node'
import { backendNode } from '../nodes/backend-node'
import { qaNode } from '../nodes/qa-node'
import { devopsNode } from '../nodes/devops-node'

export function createEditWorkflow() {
  const graph = new StateGraph<AppGenState>({
    channels: {
      userDescription: null,
      projectId: null,
      userId: null,
      plan: null,
      context: null,
      backendConfig: null,
      files: null,
      stage: null,
      completedNodes: null,
      errors: null,
      // ... all other channels from AppGenState
    }
  })

  // Add nodes
  graph.addNode('editPlanner', editPlannerNode)
  graph.addNode('frontendNextJS', frontendNodeNextJS)
  graph.addNode('frontendHTML', frontendNode)
  graph.addNode('backend', backendNode)
  graph.addNode('qa', qaNode)
  graph.addNode('devops', devopsNode)

  // Flow
  graph.addEdge('__start__', 'editPlanner')

  // Conditional: route to appropriate frontend generator
  graph.addConditionalEdges('editPlanner', (state) => {
    const mode = state.context?.generationMode || 'nextjs'
    return mode === 'nextjs' ? 'frontendNextJS' : 'frontendHTML'
  })

  // Conditional: only run backend if schema needs update
  graph.addConditionalEdges('editPlanner', (state) => {
    return state.context?.needsBackendUpdate ? 'backend' : '__skip__'
  })

  graph.addEdge('frontendNextJS', 'qa')
  graph.addEdge('frontendHTML', 'qa')
  graph.addEdge('backend', 'qa')
  graph.addEdge('qa', 'devops')
  graph.addEdge('devops', '__end__')

  return graph.compile()
}

export const editWorkflow = createEditWorkflow()
```

**4.4 Frontend Node (Edit Mode)**

**File:** Update `/lib/langgraph/nodes/frontend-node-nextjs.ts`

```typescript
export async function frontendNodeNextJS(state: AppGenState): Promise<Partial<AppGenState>> {
  const isEditMode = state.context?.editMode === true

  if (isEditMode) {
    return await handleEditMode(state)
  } else {
    return await handleFullGeneration(state)
  }
}

async function handleEditMode(state: AppGenState): Promise<Partial<AppGenState>> {
  const pb = getPocketBase()

  // Load existing files
  const project = await pb.collection('projects').getOne(state.projectId, {
    expand: 'files'
  })
  const existingFiles = project.files || []

  const affectedPaths = state.context.affectedFiles || []
  const newPaths = state.context.needsNewFiles || []
  const filesToGenerate = [...new Set([...affectedPaths, ...newPaths])]

  // Build prompt for AI
  const prompt = `
You are EDITING an existing Next.js application.

EDIT REQUEST: "${state.userDescription}"
EDIT PLAN: ${state.plan}

EXISTING FILES (for context):
${existingFiles
  .filter((f: any) => affectedPaths.includes(f.path) || f.path === 'package.json')
  .map((f: any) => `
=== ${f.path} ===
${f.content}
`).join('\n')}

FILES TO MODIFY: ${affectedPaths.join(', ')}
NEW FILES TO CREATE: ${newPaths.join(', ')}

CRITICAL INSTRUCTIONS:
1. ONLY generate files in this list: ${filesToGenerate.join(', ')}
2. Preserve existing imports and dependencies
3. ${state.context.preserveDesignSystem
    ? `Maintain current design system:
   - Primary Color: ${state.context.designSystem?.primaryColor}
   - Font: ${state.context.designSystem?.fontFamily}`
    : 'You may update the design system based on the request'
  }
4. Keep same code style and patterns
5. Don't break existing functionality
6. For modified files, output the COMPLETE updated file (not a diff)

${state.backendConfig?.collections?.length > 0 ? `
DATABASE SCHEMA:
${JSON.stringify(state.backendConfig.collections, null, 2)}

Use window.db API for database operations.
` : ''}

Generate the files in the same JSON format as original generation.
`

  const files = await generateNextJSFiles(prompt, filesToGenerate)

  // Merge with existing files
  const mergedFiles = mergeFileUpdates(existingFiles, files)

  return {
    files: mergedFiles,
    isMultiPage: mergedFiles.some(f => f.path.includes('app/') && f.path !== 'app/page.tsx'),
    stage: 'frontend-complete',
    completedNodes: [...state.completedNodes, 'frontend']
  }
}

function mergeFileUpdates(existing: any[], updates: any[]): any[] {
  const updateMap = new Map(updates.map(f => [f.path, f]))

  // Replace existing files with updates
  const merged = existing.map(file =>
    updateMap.has(file.path) ? updateMap.get(file.path) : file
  )

  // Add new files
  updates.forEach(file => {
    if (!existing.find(f => f.path === file.path)) {
      merged.push(file)
    }
  })

  return merged
}

async function handleFullGeneration(state: AppGenState): Promise<Partial<AppGenState>> {
  // Original generation logic (unchanged)
  // ...
}
```

**Benefits:**
- ✅ Users can iterate on apps (no full regeneration)
- ✅ Preserves design consistency
- ✅ Only regenerates affected files (faster, cheaper)
- ✅ Works from Phase 1 (not Week 4)

---

## Database Schema Evolution

### Phase 1: Immediate Fixes (Week 1)

#### Add Critical Indexes

**File:** Create `/migrations/1730000000_add_foreign_key_indexes.js`

```javascript
/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  // Add indexes on foreign keys for performance
  db.createIndex('idx_projects_userId', 'projects', ['userId'])
  db.createIndex('idx_project_files_projectId', 'project_files', ['projectId'])
  db.createIndex('idx_workflow_checkpoints_projectId', 'workflow_checkpoints', ['projectId'])
  db.createIndex('idx_workflow_checkpoints_timestamp', 'workflow_checkpoints', ['created DESC'])
  db.createIndex('idx_token_usage_userId', 'token_usage', ['userId'])
  db.createIndex('idx_token_usage_projectId', 'token_usage', ['projectId'])
  db.createIndex('idx_transactions_userId', 'transactions', ['userId'])
  db.createIndex('idx_project_messages_projectId', 'project_messages', ['projectId'])

  console.log('✅ Foreign key indexes created')
}, (db) => {
  // Rollback
  db.dropIndex('idx_projects_userId')
  db.dropIndex('idx_project_files_projectId')
  db.dropIndex('idx_workflow_checkpoints_projectId')
  db.dropIndex('idx_workflow_checkpoints_timestamp')
  db.dropIndex('idx_token_usage_userId')
  db.dropIndex('idx_token_usage_projectId')
  db.dropIndex('idx_transactions_userId')
  db.dropIndex('idx_project_messages_projectId')
})
```

#### Fix Token Consumption Race Condition

**File:** Create `/lib/services/token-manager.ts`

```typescript
import { getPocketBase } from './pocketbase'

export class TokenManager {
  /**
   * Atomically consume tokens using optimistic locking
   */
  async consumeTokens(userId: string, tokens: number): Promise<boolean> {
    const pb = getPocketBase()
    const MAX_RETRIES = 3

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Read current state
        const user = await pb.collection('users').getOne(userId)

        // Check if user has enough tokens
        if (user.usedTokens + tokens > user.totalTokens) {
          throw new Error('Insufficient tokens')
        }

        // Optimistic update with version check
        const updated = await pb.collection('users').update(userId, {
          usedTokens: user.usedTokens + tokens,
          _version: (user._version || 0) + 1
        }, {
          // PocketBase doesn't natively support If-Match, so we use filter
          $if: `_version = ${user._version || 0}`
        })

        // Success
        return true
      } catch (error: any) {
        if (error.status === 409 || error.message?.includes('version')) {
          // Version mismatch = concurrent update, retry
          console.warn(`[TokenManager] Retry ${attempt + 1}/${MAX_RETRIES}`)
          await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)))
          continue
        }

        // Other error, rethrow
        throw error
      }
    }

    throw new Error('Failed to consume tokens after max retries')
  }

  /**
   * Record token usage for analytics
   */
  async recordUsage(userId: string, projectId: string, tokens: number, endpoint: string) {
    const pb = getPocketBase()

    await pb.collection('token_usage').create({
      userId,
      projectId,
      tokensUsed: tokens,
      endpoint,
      timestamp: new Date()
    })
  }
}

export const tokenManager = new TokenManager()
```

**Usage:**

**File:** Update `/lib/ai-core.ts` (or wherever AI calls are made)

```typescript
import { tokenManager } from '@/lib/services/token-manager'

export async function generateWithLogging(options: GenerateOptions) {
  const { userId, projectId } = options.context || {}

  // Generate content
  const result = await generate(options)

  // Calculate tokens
  const tokensUsed = estimateTokens(options.prompt + JSON.stringify(result))

  // Atomically consume tokens
  if (userId) {
    try {
      await tokenManager.consumeTokens(userId, tokensUsed)
      await tokenManager.recordUsage(userId, projectId, tokensUsed, options.model)
    } catch (error) {
      console.error('[AI] Token consumption failed:', error)
      // Optionally: rollback generation or alert
    }
  }

  return result
}
```

#### Add Version Field to Users

**File:** Create `/migrations/1730000001_add_user_version.js`

```javascript
/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = db.findCollectionByNameOrId('users')

  // Add version field for optimistic locking
  collection.schema.addField(new Field({
    name: '_version',
    type: 'number',
    required: false,
    min: 0,
    system: false
  }))

  db.saveCollection(collection)

  // Initialize all existing users with version 0
  db.update('users', {}, { _version: 0 })

  console.log('✅ User version field added')
}, (db) => {
  const collection = db.findCollectionByNameOrId('users')
  collection.schema.removeField('_version')
  db.saveCollection(collection)
})
```

### Phase 2: Multi-Agent Preparation (Week 3-4)

#### Create Agent State Collection

**File:** Create `/migrations/1730100000_create_agent_state.js`

```javascript
/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  // Create collection for agent execution state
  const collection = new Collection({
    name: 'agent_state',
    type: 'base',
    system: false,
    schema: [
      new Field({
        name: 'projectId',
        type: 'relation',
        required: true,
        options: {
          collectionId: db.findCollectionByNameOrId('projects').id,
          cascadeDelete: true
        }
      }),
      new Field({
        name: 'agentId',
        type: 'text',
        required: true
      }),
      new Field({
        name: 'agentName',
        type: 'text',
        required: true
      }),
      new Field({
        name: 'status',
        type: 'select',
        required: true,
        options: {
          values: ['pending', 'running', 'completed', 'failed', 'skipped']
        }
      }),
      new Field({
        name: 'inputs',
        type: 'json',
        required: false
      }),
      new Field({
        name: 'outputs',
        type: 'json',
        required: false
      }),
      new Field({
        name: 'error',
        type: 'json',
        required: false
      }),
      new Field({
        name: 'startedAt',
        type: 'date',
        required: false
      }),
      new Field({
        name: 'completedAt',
        type: 'date',
        required: false
      }),
      new Field({
        name: 'durationMs',
        type: 'number',
        required: false
      })
    ],
    indexes: [
      'CREATE INDEX idx_agent_state_projectId ON agent_state(projectId)',
      'CREATE INDEX idx_agent_state_status ON agent_state(status)',
      'CREATE INDEX idx_agent_state_agentId ON agent_state(agentId)',
      'CREATE INDEX idx_agent_state_created ON agent_state(created DESC)'
    ]
  })

  db.saveCollection(collection)

  console.log('✅ agent_state collection created')
}, (db) => {
  db.deleteCollection('agent_state')
})
```

#### Create Message Queue Collection

**File:** Create `/migrations/1730100001_create_message_queue.js`

```javascript
/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    name: 'agent_messages',
    type: 'base',
    system: false,
    schema: [
      new Field({
        name: 'projectId',
        type: 'relation',
        required: true,
        options: {
          collectionId: db.findCollectionByNameOrId('projects').id,
          cascadeDelete: true
        }
      }),
      new Field({
        name: 'sourceAgent',
        type: 'text',
        required: true
      }),
      new Field({
        name: 'targetAgent',
        type: 'text',
        required: true
      }),
      new Field({
        name: 'payload',
        type: 'json',
        required: true
      }),
      new Field({
        name: 'priority',
        type: 'select',
        required: true,
        options: {
          values: ['high', 'normal', 'low']
        }
      }),
      new Field({
        name: 'status',
        type: 'select',
        required: true,
        options: {
          values: ['pending', 'processing', 'completed', 'failed']
        }
      }),
      new Field({
        name: 'processedAt',
        type: 'date',
        required: false
      }),
      new Field({
        name: 'expiresAt',
        type: 'date',
        required: false
      }),
      new Field({
        name: 'retryCount',
        type: 'number',
        required: false,
        min: 0,
        max: 5
      })
    ],
    indexes: [
      'CREATE INDEX idx_agent_messages_projectId ON agent_messages(projectId)',
      'CREATE INDEX idx_agent_messages_targetAgent ON agent_messages(targetAgent)',
      'CREATE INDEX idx_agent_messages_status ON agent_messages(status)',
      'CREATE INDEX idx_agent_messages_priority_created ON agent_messages(priority DESC, created ASC)'
    ]
  })

  db.saveCollection(collection)

  console.log('✅ agent_messages collection created')
}, (db) => {
  db.deleteCollection('agent_messages')
})
```

#### Update AppGenState Interface

**File:** `/lib/langgraph/types.ts`

```typescript
// Add to existing AppGenState interface

export interface AppGenState {
  // ... existing fields

  // NEW: Multi-agent support
  agentExecutionId?: string  // Links to agent_state record
  messageQueue?: AgentMessage[]
  dependencies?: {
    waitingFor: string[]  // Agent IDs this execution is waiting for
    requiredBy: string[]  // Agent IDs waiting for this execution
  }
}

export interface AgentMessage {
  id: string
  sourceAgent: string
  targetAgent: string
  payload: any
  priority: 'high' | 'normal' | 'low'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: Date
  expiresAt?: Date
}

export interface AgentExecutionState {
  id: string
  projectId: string
  agentId: string
  agentName: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  inputs: Record<string, any>
  outputs: Record<string, any>
  error?: Error
  startedAt?: Date
  completedAt?: Date
  durationMs?: number
}
```

### Phase 3: Message Queue Service

**File:** Create `/lib/services/message-queue.ts`

```typescript
import { getPocketBase } from './pocketbase'
import type { AgentMessage } from '@/lib/langgraph/types'

export class MessageQueueService {
  private pb = getPocketBase()
  private pollingInterval: NodeJS.Timeout | null = null
  private isProcessing = false

  /**
   * Send message from one agent to another
   */
  async sendMessage(message: Omit<AgentMessage, 'id' | 'status' | 'createdAt'>): Promise<string> {
    const record = await this.pb.collection('agent_messages').create({
      ...message,
      status: 'pending',
      retryCount: 0,
      expiresAt: message.expiresAt || new Date(Date.now() + 3600000)  // 1 hour default
    })

    return record.id
  }

  /**
   * Pull messages for a specific agent
   */
  async pullMessages(agentId: string, limit = 10): Promise<AgentMessage[]> {
    const records = await this.pb.collection('agent_messages').getList(1, limit, {
      filter: `targetAgent = "${agentId}" && status = "pending"`,
      sort: '-priority,created',  // High priority first, then oldest
      fields: '*'
    })

    return records.items.map(this.mapToAgentMessage)
  }

  /**
   * Mark message as processing
   */
  async markProcessing(messageId: string): Promise<void> {
    await this.pb.collection('agent_messages').update(messageId, {
      status: 'processing'
    })
  }

  /**
   * Mark message as completed
   */
  async markCompleted(messageId: string): Promise<void> {
    await this.pb.collection('agent_messages').update(messageId, {
      status: 'completed',
      processedAt: new Date()
    })
  }

  /**
   * Mark message as failed and retry if within limit
   */
  async markFailed(messageId: string, error: Error): Promise<void> {
    const message = await this.pb.collection('agent_messages').getOne(messageId)

    if (message.retryCount < 3) {
      // Retry
      await this.pb.collection('agent_messages').update(messageId, {
        status: 'pending',
        retryCount: message.retryCount + 1
      })
    } else {
      // Give up
      await this.pb.collection('agent_messages').update(messageId, {
        status: 'failed',
        error: { message: error.message, stack: error.stack }
      })
    }
  }

  /**
   * Start polling for messages (for agent workers)
   */
  startPolling(agentId: string, handler: (messages: AgentMessage[]) => Promise<void>, intervalMs = 1000) {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
    }

    this.pollingInterval = setInterval(async () => {
      if (this.isProcessing) return

      this.isProcessing = true

      try {
        const messages = await this.pullMessages(agentId)

        if (messages.length > 0) {
          await handler(messages)
        }
      } catch (error) {
        console.error(`[MessageQueue] Error processing messages for ${agentId}:`, error)
      } finally {
        this.isProcessing = false
      }
    }, intervalMs)
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
  }

  /**
   * Cleanup expired messages
   */
  async cleanupExpired(): Promise<number> {
    const expired = await this.pb.collection('agent_messages').getFullList({
      filter: `expiresAt < "${new Date().toISOString()}" && status != "completed"`
    })

    for (const message of expired) {
      await this.pb.collection('agent_messages').delete(message.id)
    }

    return expired.length
  }

  private mapToAgentMessage(record: any): AgentMessage {
    return {
      id: record.id,
      sourceAgent: record.sourceAgent,
      targetAgent: record.targetAgent,
      payload: record.payload,
      priority: record.priority,
      status: record.status,
      createdAt: new Date(record.created),
      expiresAt: record.expiresAt ? new Date(record.expiresAt) : undefined
    }
  }
}

export const messageQueue = new MessageQueueService()
```

---

## Multi-Agent Communication Architecture

### Current vs Future

#### Current (Shared State Only)

```typescript
// All agents read/write same AppGenState object
const state: AppGenState = { ... }

// Founder node
state.refinedRequirements = await analyzeRequirements(state.userDescription)

// PM node
state.plan = await createPlan(state.refinedRequirements)  // Reads Founder output

// UX node
state.componentNeeds = await selectComponents(state.plan)  // Reads PM output

// ⚠️ ISSUES:
// - No isolation (mutations affect all)
// - No concurrency control
// - Hard to add new agents (must update state interface)
// - Can't distribute across servers
```

#### Future (Message-Based + State)

```typescript
// Agent Registry
interface Agent {
  id: string
  name: string
  version: string
  inputs: Record<string, InputSchema>  // Declarative contract
  outputs: Record<string, OutputSchema>
  execute(inputs: any): Promise<any>
}

// Agent execution
class AgentExecutor {
  async executeAgent(agentId: string, projectId: string, inputs: any) {
    // 1. Record agent start
    const executionId = await this.recordStart(projectId, agentId, inputs)

    try {
      // 2. Execute agent
      const agent = agentRegistry.get(agentId)
      const outputs = await agent.execute(inputs)

      // 3. Record completion
      await this.recordCompletion(executionId, outputs)

      // 4. Send outputs to dependent agents via message queue
      await this.notifyDependents(agentId, projectId, outputs)

      return outputs
    } catch (error) {
      // Record failure
      await this.recordFailure(executionId, error)
      throw error
    }
  }

  async notifyDependents(sourceAgent: string, projectId: string, outputs: any) {
    const dependents = await this.getDependents(sourceAgent)

    for (const targetAgent of dependents) {
      await messageQueue.sendMessage({
        projectId,
        sourceAgent,
        targetAgent,
        payload: outputs,
        priority: 'normal'
      })
    }
  }
}

// ✅ BENEFITS:
// - Agents isolated (no shared state mutation)
// - Message queue enables async execution
// - Can distribute agents across servers
// - Easy to add new agents (register + define inputs/outputs)
// - Built-in retry and error handling
```

### Agent Dependency Graph

```typescript
// File: /lib/langgraph/agent-dependencies.ts

export const agentDependencies = {
  'founder': {
    dependencies: [],  // No dependencies (first agent)
    provides: ['refinedRequirements', 'businessContext']
  },
  'pm': {
    dependencies: ['founder'],
    requires: ['refinedRequirements', 'businessContext'],
    provides: ['plan', 'context']
  },
  'ux': {
    dependencies: ['pm'],
    requires: ['plan', 'context'],
    provides: ['componentNeeds', 'designSystemPrompt', 'examples']
  },
  'frontend': {
    dependencies: ['ux'],
    requires: ['componentNeeds', 'designSystemPrompt', 'context'],
    provides: ['files', 'isMultiPage']
  },
  'backend': {
    dependencies: ['pm'],  // Parallel with frontend, only needs PM output
    requires: ['plan', 'userDescription'],
    provides: ['backendConfig']
  },
  'qa': {
    dependencies: ['frontend', 'backend'],  // Waits for both
    requires: ['files', 'backendConfig'],
    provides: ['validationResult', 'debugAttempts']
  },
  'devops': {
    dependencies: ['qa'],
    requires: ['files', 'validationResult'],
    provides: ['deployUrl']
  }
}

// Execution order resolver
export function resolveExecutionOrder(agents: string[]): string[][] {
  // Returns array of parallel execution batches
  // Example: [['founder'], ['pm'], ['ux'], ['frontend', 'backend'], ['qa'], ['devops']]

  const dependencies = new Map<string, string[]>()
  const remaining = new Set(agents)
  const batches: string[][] = []

  // Build dependency map
  agents.forEach(agent => {
    dependencies.set(agent, agentDependencies[agent]?.dependencies || [])
  })

  while (remaining.size > 0) {
    // Find agents with no remaining dependencies
    const batch = Array.from(remaining).filter(agent => {
      const deps = dependencies.get(agent) || []
      return deps.every(dep => !remaining.has(dep))
    })

    if (batch.length === 0) {
      throw new Error('Circular dependency detected')
    }

    batches.push(batch)
    batch.forEach(agent => remaining.delete(agent))
  }

  return batches
}
```

### Agent Registry

**File:** Create `/lib/langgraph/agent-registry.ts`

```typescript
import type { Agent } from './types'
import { founderNode } from './nodes/founder-node'
import { pmNode } from './nodes/pm-node'
import { uxNode } from './nodes/ux-node'
import { frontendNodeNextJS } from './nodes/frontend-node-nextjs'
import { frontendNode } from './nodes/frontend-node'
import { backendNode } from './nodes/backend-node'
import { qaNode } from './nodes/qa-node'
import { devopsNode } from './nodes/devops-node'

// Wrapper to convert existing nodes to Agent interface
function wrapNode(id: string, name: string, fn: Function): Agent {
  return {
    id,
    name,
    version: '1.0.0',
    inputs: {},  // TODO: Define schemas
    outputs: {},
    execute: async (inputs: any) => {
      const result = await fn(inputs)
      return result
    }
  }
}

class AgentRegistry {
  private agents = new Map<string, Agent>()

  constructor() {
    // Register default agents
    this.register(wrapNode('founder', 'Founder', founderNode))
    this.register(wrapNode('pm', 'Product Manager', pmNode))
    this.register(wrapNode('ux', 'UX Designer', uxNode))
    this.register(wrapNode('frontend-nextjs', 'Frontend (Next.js)', frontendNodeNextJS))
    this.register(wrapNode('frontend-html', 'Frontend (HTML)', frontendNode))
    this.register(wrapNode('backend', 'Backend', backendNode))
    this.register(wrapNode('qa', 'QA', qaNode))
    this.register(wrapNode('devops', 'DevOps', devopsNode))
  }

  register(agent: Agent) {
    this.agents.set(agent.id, agent)
    console.log(`[AgentRegistry] Registered agent: ${agent.name} (${agent.id})`)
  }

  get(agentId: string): Agent | undefined {
    return this.agents.get(agentId)
  }

  list(): Agent[] {
    return Array.from(this.agents.values())
  }

  has(agentId: string): boolean {
    return this.agents.has(agentId)
  }
}

export const agentRegistry = new AgentRegistry()
```

---

## Implementation Roadmap

### Phase 1: Foundation + Editing (Week 1-2) 🚀

**Priority:** CRITICAL - Must deliver editing support

#### Week 1: Database Fixes + Mode Toggle

**Monday-Tuesday:**
- [ ] Create and run index migration (`1730000000_add_foreign_key_indexes.js`)
- [ ] Create and run user version migration (`1730000001_add_user_version.js`)
- [ ] Create and run collection limits migration (`1234567890_add_collection_limits.js`)
- [ ] Implement `TokenManager` class with optimistic locking
- [ ] Update all AI generation calls to use `tokenManager.consumeTokens()`
- [ ] Test token consumption under concurrent load (10+ simultaneous requests)

**Wednesday-Thursday:**
- [ ] Create `GenerationModeSelector` component
- [ ] Update `ChatPanelClaude.tsx` to include mode selector
- [ ] Update `pm-node.ts` to respect `userSelectedMode`
- [ ] Test mode selection: Landing Page vs App Mode
- [ ] Verify both generators still work correctly

**Friday:**
- [ ] Code review
- [ ] Integration testing
- [ ] Deploy to staging
- [ ] Performance benchmarks (query speeds, token consumption accuracy)

#### Week 2: Editing Workflow

**Monday-Tuesday:**
- [ ] Create `edit-planner-node.ts`
- [ ] Create `edit-workflow.ts`
- [ ] Update `frontend-node-nextjs.ts` with `handleEditMode()`
- [ ] Update `frontend-node.ts` (HTML) with edit support
- [ ] Update `app/api/ai/chat/route.ts` with stage detection

**Wednesday:**
- [ ] Test editing workflow:
  - [ ] Generate simple app → edit (change color) → verify
  - [ ] Generate complex app → add feature → verify
  - [ ] Generate app → modify backend schema → verify
- [ ] Test design system preservation
- [ ] Test affected file detection

**Thursday:**
- [ ] Fix bugs found in testing
- [ ] Add error handling for edit failures
- [ ] Implement "undo last edit" feature (keep previous version)

**Friday:**
- [ ] Final testing
- [ ] Documentation: "How to Edit Generated Apps"
- [ ] Deploy to production with feature flag (10% rollout)
- [ ] Monitor metrics

**Deliverables:**
- ✅ Database indexes added (5-10x query speed improvement)
- ✅ Token consumption race condition fixed (zero revenue loss)
- ✅ Mode toggle UI working (Landing Page vs App)
- ✅ Editing workflow functional (Phase 1 priority met)
- ✅ Collection limits enforced by pricing plan

---

### Phase 2: Multi-Collection Backend (Week 3)

#### Tasks

**Monday:**
- [ ] Update `backend-node.ts` to use pricing-plan-based limits
- [ ] Add relation field type to backend prompt
- [ ] Test AI generates correct multi-collection schemas

**Tuesday:**
- [ ] Update `database-injection.ts` to support `expand` parameter
- [ ] Update `/app/api/db/[projectId]/[collection]/route.ts` with expand support
- [ ] Test relation expansion: `window.db.get('posts', { expand: 'author' })`

**Wednesday:**
- [ ] Update frontend instructions in `frontend-node-nextjs.ts`
- [ ] Add multi-collection examples to generated apps
- [ ] Create `CollectionLimitBadge` component

**Thursday:**
- [ ] Integration testing:
  - [ ] Generate app with 1 collection (Starter plan) → works
  - [ ] Generate app with 3 collections (Pro plan) → works
  - [ ] Attempt 4 collections on Pro plan → truncated to 3
  - [ ] Test relation CRUD operations
  - [ ] Verify PocketBase schema matches generated config

**Friday:**
- [ ] Bug fixes
- [ ] Performance testing (query speeds with relations)
- [ ] Deploy to production

**Deliverables:**
- ✅ Multi-collection support (up to plan limit)
- ✅ Relation field type working
- ✅ `window.db.get()` supports `expand` parameter
- ✅ UI shows collection usage badge
- ✅ Revenue-driven pricing enforcement

---

### Phase 3: WebSocket Real-Time Sync (Week 4-5)

#### Week 4: WebSocket Server

**Monday-Tuesday:**
- [ ] Create `DatabaseWebSocketServer` class
- [ ] Integrate with Next.js server (custom server.js)
- [ ] Test WebSocket connection establishment
- [ ] Test subscribe/unsubscribe messages

**Wednesday:**
- [ ] Integrate with PocketBase realtime API
- [ ] Test real-time updates propagate to clients
- [ ] Test filtering by projectId

**Thursday:**
- [ ] Add connection manager (track active connections)
- [ ] Add heartbeat/ping-pong for connection keepalive
- [ ] Test reconnect logic

**Friday:**
- [ ] Load testing: 10, 50, 100 concurrent connections
- [ ] Memory profiling
- [ ] Fix any performance issues

#### Week 5: Client Integration

**Monday:**
- [ ] Update `database-injection.ts` with WebSocket client
- [ ] Implement fallback to polling if WebSocket fails
- [ ] Test auto-reconnect on disconnect

**Tuesday:**
- [ ] Update `window.db.subscribe()` to use WebSocket
- [ ] Test real-time updates in generated apps
- [ ] Verify optimistic UI updates work

**Wednesday:**
- [ ] Integration testing:
  - [ ] Multi-tab sync (open app in 2 tabs, update in one, see in other)
  - [ ] Network interruption (disconnect WiFi, reconnect)
  - [ ] Server restart (app reconnects automatically)
  - [ ] Concurrent mutations (2 users edit simultaneously)

**Thursday:**
- [ ] Performance benchmarks:
  - [ ] Measure network requests before/after (should be 95% reduction)
  - [ ] Measure UI update latency (should be <100ms)
  - [ ] Measure server CPU/memory usage

**Friday:**
- [ ] Bug fixes
- [ ] Documentation
- [ ] Deploy to production with gradual rollout (10% → 50% → 100%)

**Deliverables:**
- ✅ WebSocket server running
- ✅ Clients connect via WebSocket
- ✅ Real-time updates with <100ms latency
- ✅ 95%+ reduction in network requests
- ✅ Graceful fallback to polling

---

### Phase 4: Multi-Agent Preparation (Week 6-8)

#### Week 6: Database Schema

**Monday-Tuesday:**
- [ ] Create `agent_state` collection migration
- [ ] Create `agent_messages` collection migration
- [ ] Run migrations on dev environment
- [ ] Test CRUD operations

**Wednesday:**
- [ ] Update `AppGenState` interface with multi-agent fields
- [ ] Create `AgentExecutionState` and `AgentMessage` types
- [ ] Update existing nodes to be compatible

**Thursday:**
- [ ] Create `MessageQueueService` class
- [ ] Test message send/receive
- [ ] Test message priority ordering

**Friday:**
- [ ] Test cleanup of expired messages
- [ ] Performance testing (1000+ messages)
- [ ] Deploy migrations to production

#### Week 7: Agent Registry

**Monday-Tuesday:**
- [ ] Create `Agent` interface
- [ ] Create `AgentRegistry` class
- [ ] Wrap existing nodes as Agents
- [ ] Test agent registration and discovery

**Wednesday:**
- [ ] Create `agentDependencies` configuration
- [ ] Implement `resolveExecutionOrder()` function
- [ ] Test parallel execution batches

**Thursday:**
- [ ] Create `AgentExecutor` class
- [ ] Implement agent lifecycle (start, execute, complete/fail)
- [ ] Test with existing 7-node workflow

**Friday:**
- [ ] Integration testing
- [ ] Verify backward compatibility (existing workflows still work)
- [ ] Documentation: "How to Add a New Agent"

#### Week 8: Message-Based Communication

**Monday:**
- [ ] Update nodes to send messages to dependents
- [ ] Update nodes to pull messages from queue
- [ ] Test Founder → PM → UX message flow

**Tuesday:**
- [ ] Test parallel execution (Frontend + Backend simultaneously)
- [ ] Test QA waits for both Frontend and Backend
- [ ] Verify no race conditions

**Wednesday:**
- [ ] Add retry logic for failed messages
- [ ] Add timeout handling for stuck agents
- [ ] Test error recovery

**Thursday:**
- [ ] Performance testing: 5 concurrent workflows
- [ ] Monitor database load
- [ ] Optimize if needed

**Friday:**
- [ ] Final testing
- [ ] Deploy to production
- [ ] Monitor metrics

**Deliverables:**
- ✅ Agent state tracked in database
- ✅ Message queue functional
- ✅ Agent registry with 7 default agents
- ✅ Backward compatible with existing workflows
- ✅ Ready for N agents (10+, 50+, 100+)

---

## Risk Assessment & Mitigation

### Risk Matrix

| Phase | Risk | Level | Mitigation |
|-------|------|-------|------------|
| **Phase 1** | Token race condition fix breaks billing | MEDIUM | Extensive testing with concurrent load, rollback plan ready |
| | Editing workflow generates breaking changes | HIGH | QA validation before deploy, "undo" feature, version control |
| | Mode toggle confuses users | LOW | Clear UI design, tooltips, documentation |
| **Phase 2** | AI generates invalid relation targets | MEDIUM | Validation in backend-node, QA catches errors, auto-fix logic |
| | Collection limits frustrate users | LOW | Clear messaging, upgrade prompts, grandfather existing projects |
| **Phase 3** | WebSocket connection failures | HIGH | Robust fallback to polling, auto-reconnect, connection monitoring |
| | Server overload with 1000+ connections | MEDIUM | Load testing, horizontal scaling plan, connection limits |
| **Phase 4** | Message queue becomes bottleneck | MEDIUM | Performance testing, indexing, caching, Redis migration if needed |
| | Circular dependencies in agent graph | LOW | Validation in `resolveExecutionOrder()`, throw error if detected |

### Rollback Plans

#### Phase 1: Database Indexes

**If queries slow down:**
1. Check index usage: `EXPLAIN QUERY PLAN SELECT ...`
2. Drop problematic index
3. Optimize query
4. Recreate index

#### Phase 1: Token Manager

**If token consumption fails:**
1. Feature flag: disable optimistic locking
2. Revert to simple update (accept race condition temporarily)
3. Monitor revenue loss
4. Fix and redeploy

#### Phase 2: Multi-Collection

**If relation errors spike:**
1. Revert backend-node to single collection limit
2. Clear invalid projects
3. Fix relation validation
4. Redeploy

#### Phase 3: WebSocket

**If WebSocket server crashes:**
1. Kill WebSocket server process
2. Clients auto-fallback to polling
3. Fix crash
4. Restart WebSocket server
5. Clients reconnect automatically

---

## Success Metrics

### Phase 1: Foundation + Editing

**Database Performance:**
- [ ] Query speed improvement: 5-10x faster (measured via logging)
- [ ] Token consumption accuracy: 100% (zero lost updates in load test)
- [ ] Index size: <10% of database size

**Editing Workflow:**
- [ ] Edit success rate: >95%
- [ ] Edit completion time: 30-50% faster than full regen
- [ ] User satisfaction: >80% positive feedback
- [ ] Edit adoption: >40% of users make edits within first week

**Mode Toggle:**
- [ ] Landing Page mode usage: 20-30% of generations
- [ ] App mode usage: 70-80% of generations
- [ ] Mode switch rate: <5% (indicates good initial selection)

### Phase 2: Multi-Collection

**Backend Generation:**
- [ ] Multi-collection usage: >30% of apps use 2+ collections
- [ ] Relation accuracy: >90% of AI-generated relations are valid
- [ ] Schema errors: <5%

**Performance:**
- [ ] Relation expansion latency: <200ms
- [ ] Database integrity: Zero orphaned records

### Phase 3: WebSocket

**Network Efficiency:**
- [ ] Request reduction: >95%
- [ ] Bytes transferred reduction: >90%
- [ ] Server load reduction: >60%

**Real-Time Performance:**
- [ ] UI update latency: <100ms
- [ ] Connection uptime: >99.9%
- [ ] Reconnect time: <2 seconds

**Scalability:**
- [ ] Support 1000+ concurrent connections
- [ ] CPU usage: <70% at peak
- [ ] Memory usage: <2GB

### Phase 4: Multi-Agent

**Agent Execution:**
- [ ] Agent start latency: <500ms
- [ ] Message queue latency: <100ms
- [ ] Parallel execution speedup: 2x (Frontend + Backend)

**Reliability:**
- [ ] Agent success rate: >98%
- [ ] Message delivery: 100%
- [ ] Error recovery: <3 retries per failure

---

## Testing Strategy

### Unit Tests

```typescript
// Example: TokenManager tests
describe('TokenManager', () => {
  it('should atomically consume tokens', async () => {
    const userId = 'test_user'
    const initialTokens = 1000

    // Concurrent consumption
    const promises = Array(10).fill(null).map(() =>
      tokenManager.consumeTokens(userId, 10)
    )

    await Promise.all(promises)

    const user = await pb.collection('users').getOne(userId)
    expect(user.usedTokens).toBe(100)  // Should be exactly 100, not less
  })

  it('should fail when insufficient tokens', async () => {
    const userId = 'test_user_broke'
    // User has 10 tokens

    await expect(
      tokenManager.consumeTokens(userId, 20)
    ).rejects.toThrow('Insufficient tokens')
  })
})
```

### Integration Tests

```typescript
// Example: Editing workflow test
describe('Edit Workflow', () => {
  it('should edit existing app without breaking it', async () => {
    // 1. Generate initial app
    const project = await generateApp({
      description: 'Build a todo app',
      userId: 'test_user',
      mode: 'app'
    })

    expect(project.files).toHaveLength(>= 5)

    // 2. Edit app
    const edited = await editApp({
      projectId: project.id,
      message: 'Change primary color to blue',
      userId: 'test_user'
    })

    // 3. Verify
    const pageFile = edited.files.find(f => f.path === 'app/page.tsx')
    expect(pageFile.content).toContain('blue')

    // 4. Verify app still works
    const validation = await validateApp(edited.files)
    expect(validation.valid).toBe(true)
  })
})
```

### Load Tests

```typescript
// Example: WebSocket load test
import { WebSocket } from 'ws'

describe('WebSocket Load Test', () => {
  it('should handle 1000 concurrent connections', async () => {
    const connections: WebSocket[] = []

    // Create 1000 connections
    for (let i = 0; i < 1000; i++) {
      const ws = new WebSocket('ws://localhost:3000/api/db/realtime?projectId=test')
      connections.push(ws)

      await new Promise(resolve => ws.once('open', resolve))
    }

    expect(connections.every(ws => ws.readyState === WebSocket.OPEN)).toBe(true)

    // Test message broadcast
    const received = new Set<number>()

    connections.forEach((ws, i) => {
      ws.on('message', () => received.add(i))
    })

    // Trigger update
    await pb.collection('todos').create({ projectId: 'test', text: 'Hello' })

    // Wait for broadcasts
    await new Promise(resolve => setTimeout(resolve, 1000))

    // All connections should receive update
    expect(received.size).toBe(1000)

    // Cleanup
    connections.forEach(ws => ws.close())
  })
})
```

### Performance Benchmarks

```bash
# Database query benchmarks
npm run benchmark:queries

# Expected results:
# Before indexes:
#   projects.userId query: 450ms (10,000 projects)
#   project_files.projectId query: 1200ms (50,000 files)
#
# After indexes:
#   projects.userId query: 45ms (10x faster) ✅
#   project_files.projectId query: 120ms (10x faster) ✅

# WebSocket benchmarks
npm run benchmark:websocket

# Expected results:
#   Connection time: <100ms ✅
#   Message latency: <50ms ✅
#   Broadcast to 1000 clients: <500ms ✅
#   Memory per connection: <10KB ✅

# Token consumption benchmark
npm run benchmark:tokens

# Expected results:
#   Sequential consumption (baseline): 2000ms for 100 requests
#   Concurrent consumption (10 parallel): 250ms for 100 requests ✅
#   Race condition errors: 0 ✅
```

---

## Appendix

### A. File Change Summary

**Phase 1:**
- **Created:**
  - `/migrations/1730000000_add_foreign_key_indexes.js`
  - `/migrations/1730000001_add_user_version.js`
  - `/migrations/1234567890_add_collection_limits.js`
  - `/lib/services/token-manager.ts`
  - `/components/generation-mode-selector.tsx`
  - `/components/collection-limit-badge.tsx`
  - `/lib/langgraph/nodes/edit-planner-node.ts`
  - `/lib/langgraph/workflows/edit-workflow.ts`

- **Modified:**
  - `/lib/ai-core.ts` (use TokenManager)
  - `/lib/langgraph/nodes/pm-node.ts` (mode toggle)
  - `/components/ChatPanelClaude.tsx` (mode selector)
  - `/lib/langgraph/nodes/frontend-node-nextjs.ts` (edit mode)
  - `/app/api/ai/chat/route.ts` (stage detection)

**Phase 2:**
- **Modified:**
  - `/lib/langgraph/nodes/backend-node.ts` (pricing limits)
  - `/lib/database-injection.ts` (expand parameter)
  - `/app/api/db/[projectId]/[collection]/route.ts` (expand support)

**Phase 3:**
- **Created:**
  - `/lib/websocket/server.ts`
  - `/server.js` (custom Next.js server)

- **Modified:**
  - `/lib/database-injection.ts` (WebSocket client)
  - `/package.json` (add ws dependency)

**Phase 4:**
- **Created:**
  - `/migrations/1730100000_create_agent_state.js`
  - `/migrations/1730100001_create_message_queue.js`
  - `/lib/services/message-queue.ts`
  - `/lib/langgraph/agent-registry.ts`
  - `/lib/langgraph/agent-dependencies.ts`

- **Modified:**
  - `/lib/langgraph/types.ts` (multi-agent types)

### B. Database Schema Evolution

**Current Collections:**
- users
- projects
- project_files
- project_messages
- workflow_checkpoints
- example_categories
- design_examples
- token_usage
- transactions
- pricing_plans

**New Collections (Phase 4):**
- agent_state
- agent_messages
- app_generation_context (from context persistence)

**Total:** 14 collections (up from 10)

### C. API Endpoints

**Existing:**
- `GET /api/db/[projectId]/[collection]`
- `POST /api/db/[projectId]/[collection]`
- `PATCH /api/db/[projectId]/[collection]/[id]`
- `DELETE /api/db/[projectId]/[collection]/[id]`
- `POST /api/ai/chat`
- `POST /api/langgraph/execute`
- `GET /api/langgraph/stream`

**New:**
- `WS /api/db/realtime?projectId=...` (WebSocket)
- `GET /api/db/[projectId]/[collection]?expand=field1,field2` (relation expansion)

### D. Environment Variables

**Required:**
```bash
# PocketBase
POCKETBASE_URL=http://localhost:8090
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=...

# AI Models
GEMINI_API_KEY=...

# Redis (optional, for Phase 4+)
REDIS_URL=redis://localhost:6379

# Feature Flags
ENABLE_WEBSOCKET=true
ENABLE_MULTI_COLLECTION=true
ENABLE_EDITING=true
```

### E. Deployment Checklist

**Before Deploying Phase 1:**
- [ ] Run all database migrations in staging
- [ ] Test token consumption with load test (100+ concurrent requests)
- [ ] Verify no revenue loss in staging
- [ ] Test editing workflow with 10+ real examples
- [ ] Performance benchmarks meet targets (5-10x query speedup)
- [ ] Rollback plan documented and tested
- [ ] Monitoring dashboards configured
- [ ] Alert thresholds set (error rate, latency, token accuracy)

**Before Deploying Phase 3:**
- [ ] WebSocket server tested with 1000+ connections
- [ ] Memory profiling shows <2GB usage at peak
- [ ] Auto-reconnect tested (disconnect WiFi, server restart)
- [ ] Fallback to polling verified
- [ ] Load balancer configured (if multiple servers)
- [ ] Health check endpoint working (`/api/db/health`)

---

## Next Steps

### This Week

1. **Review this plan** with stakeholders
2. **Answer any remaining questions**
3. **Approve Phase 1 for implementation**
4. **Set up development environment:**
   - Dev database with test data
   - Feature flags configured
   - CI/CD pipeline updated
5. **Create Phase 1 implementation tickets:**
   - Database migrations
   - TokenManager implementation
   - Mode toggle UI
   - Editing workflow
   - Testing tasks

### Week 1 Kickoff

**Monday Morning:**
- Team meeting: Review implementation plan
- Assign tasks to developers
- Set up daily standups (15 min, 10am)

**Throughout Week:**
- Daily progress updates in Slack
- Pair programming for complex features (TokenManager, EditPlanner)
- Code reviews within 4 hours

**Friday Afternoon:**
- Demo: Show progress to stakeholders
- Retrospective: What went well, what to improve
- Plan Week 2 tasks

---

## Questions Before Proceeding

**Technical Clarifications:**

1. **PocketBase Version:** What version are you running? (Some features require v0.19+)

2. **Server Infrastructure:** Are you using:
   - Single server (Vercel/Netlify/etc)?
   - Multiple servers (need WebSocket sticky sessions)?
   - Serverless functions (WebSocket won't work, need different approach)?

3. **Current User Load:** How many concurrent users do you have now?
   - < 10: Simple implementation sufficient
   - 10-100: Need connection pooling
   - 100+: Need horizontal scaling

4. **Pricing Plans:** Do you have `pricing_plans` collection already, or should we create it?

5. **Testing Environment:** Do you have:
   - Staging environment?
   - CI/CD pipeline?
   - Automated testing setup?

**Process Questions:**

6. **Timeline Flexibility:** Are the 8 weeks flexible, or hard deadline?

7. **Feature Priority:** If we had to cut scope, which phase is optional?
   - Phase 1: Must have (database + editing)
   - Phase 2: Must have (multi-collection)
   - Phase 3: Nice to have (WebSocket)
   - Phase 4: Future (multi-agent)

8. **Breaking Changes:** Are you okay with database migrations that require downtime?
   - Creating indexes: ~1-5 minutes downtime
   - Adding collections: Zero downtime
   - Adding fields: Zero downtime

---

**Status:** #notDone
**Ready for Review:** ✅
**Awaiting Approval:** Pending technical clarifications above
**Next Action:** Schedule kickoff meeting

---

**Document Version:** 2.0
**Last Updated:** 2025-10-24
**Contributors:** Development Team + Database Architecture Analysis
**Estimated Effort:** 320 developer-hours (8 weeks × 40 hours)

**Approval Signatures:**
- [ ] Technical Lead: _______________
- [ ] Product Owner: _______________
- [ ] Database Admin: _______________
- [ ] QA Lead: _______________

🚀 **Ready to transform the app generation system and scale to multi-agent architecture!**
