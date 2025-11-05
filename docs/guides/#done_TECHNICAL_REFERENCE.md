# VB Platform - Complete Technical Reference

> **Status**: #done - Complete and up-to-date as of 2025-10-26
> **Purpose**: Single comprehensive reference for VB platform architecture, APIs, and workflows

---

## Quick Navigation

- [Executive Summary](#executive-summary)
- [Architecture Overview](#architecture-overview)
- [AI Generation Workflow](#ai-generation-workflow)
- [API Routes](#api-routes)
- [Database Schema](#database-schema)
- [Authentication & Security](#authentication--security)
- [Performance & Optimization](#performance--optimization)
- [Development Guide](#development-guide)

---

## Executive Summary

**VB (Vibebaba)** is an advanced AI-powered full-stack web application generation platform built with Next.js 15, TypeScript, and PocketBase. It converts natural language descriptions into production-ready code with full-stack capabilities including frontend UI, backend database schemas, and deployment configurations.

### Core Technology Stack
- **Frontend**: Next.js 15.5.6 + React 19 + TypeScript 5.9.3 + Tailwind CSS 3.4.18
- **Backend**: PocketBase (SQLite) + Express wrapper
- **AI**: Multi-model orchestration (Gemini 2.0, Claude, DeepSeek, Llama 3.3)
- **Advanced**: LangChain 1.0.1, LangGraph 1.0.0, Model Context Protocol (MCP) 1.20.1
- **i18n**: next-intl 4.3.12 (English, Persian, Arabic with RTL support)

### Key Capabilities
- 🤖 Multi-model AI with intelligent fallback (10+ models)
- 🧠 Persistent context via MCP Memory Server
- ✅ 5-layer code validation pipeline
- 🎨 Multiple design system templates (Ant Design, DaisyUI, Shadcn, Moon)
- 🌍 Multi-language support (EN, FA, AR)
- 💳 Token-based credit system with payment integration
- 📊 Comprehensive admin dashboard
- 🚀 Production-ready error handling

---

## Architecture Overview

### Project Structure

```
/Users/shayan/Desktop/Projects/VB/
├── app/                          # Next.js App Router
│   ├── api/                       # 40+ REST API routes
│   ├── admin/                     # Admin dashboard (12+ pages)
│   ├── project/[id]/              # Dynamic project workspace
│   ├── projects/                  # Projects listing
│   ├── settings/                  # User settings
│   ├── pricing/                   # Pricing page
│   ├── layout.tsx                 # Root layout + SEO
│   ├── page.tsx                   # Landing page
│   └── globals.css                # Global styles
├── components/                    # React components (21 directories)
│   ├── chat/                      # AI chat interfaces
│   ├── project/                   # Project-specific components
│   ├── admin/                     # Admin panel components
│   ├── auth/                      # Authentication components
│   └── ui/                        # Reusable UI (Shadcn-style)
├── lib/                           # Business logic (80+ modules)
│   ├── ai.ts                      # AI orchestration
│   ├── pocketbase.ts              # Database client
│   ├── pocketbase-credits.ts      # Token/credit system
│   ├── services/                  # Service layer
│   │   ├── memory-service.ts      # MCP memory integration
│   │   └── memory-consolidator.ts # Memory optimization
│   ├── validation/                # Code validation (5 layers)
│   │   ├── html-validator.ts
│   │   ├── css-validator.ts
│   │   ├── js-validator.ts
│   │   ├── auto-fixer.ts
│   │   └── placeholder-detector.ts
│   ├── prompts/                   # AI prompt templates
│   │   ├── prompts-i18n.ts        # Internationalized prompts
│   │   ├── routing-instructions.ts
│   │   ├── node-prompts.ts
│   │   └── precision-rules.ts
│   ├── mcp-client.ts              # MCP integration
│   ├── mcp-config.ts              # MCP configuration
│   └── payment-providers.ts       # Payment gateway
├── deployment-server/             # Backend infrastructure
│   ├── pocketbase                 # PocketBase binary
│   ├── server.js                  # Express wrapper
│   ├── db-routes.js               # Custom DB routes
│   ├── pb_migrations/             # 80+ migration scripts
│   └── pb_data/                   # SQLite database
├── middleware.ts                  # Route protection + security
├── next.config.js                 # Performance optimizations
├── tailwind.config.js             # Design system + CSS variables
└── tsconfig.json                  # TypeScript configuration
```

---

## AI Generation Workflow

### Complete Pipeline

```
User Input (Description)
        ↓
[Planning Stage]
        ↓
/api/ai/plan (POST)
    ├─ Authentication check
    ├─ Token verification
    ├─ Intent analysis (AI determines app type, complexity, style)
    ├─ Background context gathering (MCP, optional)
    ├─ Generate plan with context
    └─ Consume tokens
        ↓
Return: { plan, context }
        ↓
User reviews/refines plan
        ↓
[Building Stage]
        ├─ /api/ai/backend (POST)
        │   ├─ Analyze description
        │   ├─ Generate database collections
        │   ├─ Determine page structure
        │   └─ Return: { backendConfig }
        │
        └─ /api/ai/prototype (POST)
            ├─ Authentication & token check
            ├─ Component selection (AI-driven)
            ├─ Gather MCP context (optional)
            ├─ Build component library
            ├─ Generate HTML/React code
            ├─ Inject database API
            ├─ Parse response (JSON array or single HTML)
            ├─ Validate multi-page structure
            ├─ Auto-fix errors (3 attempts)
            ├─ Strip security (images, scripts)
            └─ Return: { code, files, aiMetadata }
                ↓
        [Chat/Refinement Loop]
            /api/ai/chat (POST)
            ├─ Stage: "planning" | "building"
            ├─ Fetch conversation history from memory
            ├─ Fetch user preferences from memory
            ├─ Get current code/files
            ├─ Generate modifications
            ├─ Preserve existing code (CRITICAL)
            └─ Return: { response, updatedCode, updatedFiles }
                ↓
        [Preview]
            /api/preview/[projectId]/[...path] (GET)
            ├─ Serve generated files
            ├─ Client-side file management
            └─ Live preview of app
                ↓
        [Save & Deploy]
            Store in PocketBase + localStorage
            Enable future deployments
```

### AI Prompts System

**Location**: `/lib/prompts/prompts-i18n.ts`

#### Core Prompts

**1. Generate Plan Prompt** (Lines 54-173)
- Creates initial app requirements and feature list
- Languages: English, Persian, Arabic
- Structure: App Overview, Core Features, User Journey, Data Models, UI/UX
- Max Output: 300 words
- Tone: Scannable, actionable, no colored emojis

**2. Generate Prototype Prompt** (Lines 179-234)
- Creates complete production-ready HTML/React code
- Routing Support: Single HTML (hash), Multi-page HTML, React Router, Next.js App Router
- Requirements: Complete file contents (NO placeholders), correct paths, responsive, Tailwind CSS, error handling

**3. Refine Plan Prompt** (Lines 239-269)
- Allows users to modify plan based on feedback
- Maintains same structure and format

**4. Generate Backend Prompt** (Lines 274-328)
- Creates database schema and API configuration
- Includes: Database collections, page/route structures, field types, relationships

#### Routing Instructions

**Location**: `/lib/prompts/routing-instructions.ts` (702 lines)

**Critical Sections:**
- Single-Page HTML (hash-based): Lines 121-193
- Multi-Page HTML (separate files): Lines 194-266
- React Router (Vite + React): Lines 267-343
- Next.js App Router: Lines 344-412
- Expo/React Native: Lines 413-494
- Common mistakes: Lines 555-646
- Validation checklist: Lines 648-691

**Key Rules:**
- ✓ Routing consistency (pick ONE approach)
- ✓ Correct file extensions (.html in multi-page)
- ✓ Relative path usage
- ✗ NO mixing of approaches
- ✗ NO hash routing in multi-page apps
- ✗ NO absolute paths

---

## API Routes

### AI Generation Routes

| Route | Method | Purpose | Auth Required |
|-------|--------|---------|---------------|
| `/api/ai/chat` | POST | Main AI chat endpoint with memory integration | Yes |
| `/api/ai/plan` | POST | Planning/analysis | Yes |
| `/api/ai/plan-chat` | POST | Planning chat with context | Yes |
| `/api/ai/prototype` | POST | Prototype generation | Yes |
| `/api/ai/execute` | POST | Code execution | Yes |
| `/api/ai/backend` | POST | Backend code generation | Yes |

### LangGraph Workflow Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/langgraph/execute` | POST | Execute full workflow |
| `/api/langgraph/stream` | POST | Stream workflow execution |
| `/api/langgraph/resume` | POST | Resume interrupted workflow |
| `/api/langgraph/status` | GET | Get workflow status |

### Database CRUD Routes

```
Pattern: /api/database/[projectId]/[collection]/[id?]

GET    /api/database/[projectId]/[collection]          List records
POST   /api/database/[projectId]/[collection]          Create record
GET    /api/database/[projectId]/[collection]/[id]     Get single record
PATCH  /api/database/[projectId]/[collection]/[id]     Update record
DELETE /api/database/[projectId]/[collection]/[id]     Delete record
```

### Admin Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/ai-config` | POST | Update AI configuration |
| `/api/admin/ai-config/test` | POST | Test AI model |
| `/api/admin/check-access` | GET | Check admin access |
| `/api/admin/dashboard-stats` | GET | Dashboard statistics |
| `/api/admin/credits/adjust` | POST | Adjust user credits |
| `/api/admin/credits/add-by-email` | POST | Add credits by email |
| `/api/admin/payments` | GET | Payment records |
| `/api/admin/payments/refund` | POST | Process refund |
| `/api/admin/validation` | GET/POST | Validation logs |

### Payment Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/payment/create` | POST | Create payment (Zarinpal) |
| `/api/payment/verify` | POST | Verify payment & grant credits |

### Utility Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/cron/reset-daily-tokens` | GET | Daily token reset (cron job) |
| `/api/cron/consolidate-memory` | GET | Memory consolidation (cron job) |
| `/api/credits` | GET | Get user credits |
| `/api/auth/check` | GET | Check authentication status |

---

## Database Schema

### Core Collections

#### users
```typescript
{
  id: string
  email: string
  username: string
  name: string
  avatar: string
  totalTokens: number          // Monthly/subscription allocation
  usedTokens: number           // Cumulative consumption
  dailyTokens: number          // Daily bonus for active packages
  lastDailyReset: datetime     // Last daily reset timestamp
  packageId: string            // Active pricing package
  packageExpiry: datetime      // Package expiration date
  verified: boolean
  created: datetime
  updated: datetime
}
```

#### projects
```typescript
{
  id: string
  userId: string
  name: string
  description: string
  type: "next" | "react" | "html" | "other"
  status: "draft" | "prototype" | "live"
  prototype: string            // Generated code
  files: Array<{path, content}>
  database: object             // Backend config
  created: datetime
  updated: datetime
}
```

#### transactions
```typescript
{
  id: string
  userId: string
  type: "purchase" | "subscription" | "refund"
  amount: number
  tokens: number
  currency: string             // USD, IRT
  packageId: string
  paymentProvider: "zarinpal" | "stripe" | "paypal"
  paymentId: string
  status: "pending" | "completed" | "failed" | "cancelled" | "refunded"
  created: datetime
  updated: datetime
}
```

#### tokenUsage
```typescript
{
  id: string
  userId: string
  tokensUsed: number
  endpoint: string             // Which API route
  projectId: string
  created: datetime
}
```

#### projectMessages
```typescript
{
  id: string
  projectId: string
  role: "user" | "assistant"
  content: string
  metadata: object
  created: datetime
}
```

### Credit System Lifecycle

```
1. User purchases package
   → Create transaction (status: pending)
   → Get payment URL from provider

2. User completes payment
   → Callback to /api/payment/verify
   → Verify with provider
   → Grant tokens (totalTokens += package.tokens)
   → Update transaction (status: completed)

3. Daily reset (cron job, 2 AM)
   → Check active packages (packageExpiry > now)
   → Reset dailyTokens based on package tier
   → Update lastDailyReset

4. AI request
   → Estimate tokens (request.length / 2)
   → Check availability (totalTokens - usedTokens >= estimate)
   → Execute generation
   → Consume tokens (usedTokens += actual)
   → Create tokenUsage record
```

### Pricing Packages

```typescript
{
  Starter: {
    monthly: 500000,    // 500K tokens/month
    daily: 5000,        // 5K daily bonus
    price: 5,           // $5/month
    currency: "USD"
  },
  Pro: {
    monthly: 2000000,   // 2M tokens/month
    daily: 20000,       // 20K daily bonus
    price: 15,          // $15/month
    currency: "USD"
  },
  Unlimited: {
    monthly: 10000000,  // 10M tokens/month
    daily: 50000,       // 50K daily bonus
    price: 40,          // $40/month
    currency: "USD"
  },
  Custom: {
    payPerUse: true,
    rate: 1,            // $1 per 100K tokens
    currency: "USD"
  }
}
```

---

## Authentication & Security

### Authentication Flow

```
1. User signs up/logs in via AuthModal
2. PocketBase authenticates credentials
3. Token stored in localStorage (key: 'pb_auth' or 'pocketbase_auth')
4. Token synced to pb_auth cookie
5. Middleware validates cookie for protected routes
6. Invalid auth → redirect to home + show signin modal
```

### Security Headers (Middleware)

**Location**: `/middleware.ts`

```typescript
X-Frame-Options: DENY                              // Prevent clickjacking
X-Content-Type-Options: nosniff                    // Prevent MIME sniffing
X-XSS-Protection: 1; mode=block                    // XSS protection
Referrer-Policy: strict-origin-when-cross-origin   // Referrer control
Content-Security-Policy: [configured]              // CSP for PocketBase + localhost
```

### Protected Routes

- `/settings` - User settings
- `/projects` - Projects listing
- `/project/*` - Project workspace
- `/admin/*` - Admin dashboard

### Public Routes

- `/` - Home/landing
- `/pricing` - Pricing page

---

## Performance & Optimization

### Next.js Optimizations

**Location**: `/next.config.js`

```javascript
- Console removal in production (experimental.removeConsoleInProduction)
- CSS optimization (experimental.optimizeCss)
- Package imports optimized (lucide-react, date-fns, @heroicons, framer-motion, etc.)
- Image optimization (WebP, AVIF formats)
- Minimum cache TTL: 60 seconds
- Compression enabled (Gzip/Brotli)
- Powered-by header removed (security)
```

### Tailwind CSS Configuration

**Location**: `/tailwind.config.js`

**Dynamic CSS Variables** (30+ semantic colors):
```css
/* Brand Colors */
--color-brand-primary
--color-brand-primary-hover
--color-brand-primary-light
--color-brand-primary-pale

/* Accent Colors */
--color-accent-default
--color-accent-light
--color-accent-pale
--color-accent-hover

/* Background Levels */
--color-background-base
--color-background-raised
--color-background-overlay
--color-background-sunken

/* Text Hierarchy */
--color-text-primary
--color-text-secondary
--color-text-tertiary
--color-text-subtle

/* Border Levels */
--color-border-subtle
--color-border-light
--color-border-default
--color-border-strong
--color-border-focus

/* Semantic Colors */
--color-success
--color-error
--color-warning
--color-info
```

**Font System**:
- English: Proxima Nova → Poppins → System
- Farsi: IRANSansXFaNum → IRANSansX
- Arabic: IRANSansX

### Code Validation Pipeline (5 Layers)

**Location**: `/lib/validation/`

```
1. HTML Validation (html-validator.ts)
   - Tag validation
   - Attribute validation
   - Semantic correctness
   - Mobile responsiveness

2. CSS Validation (css-validator.ts)
   - Syntax validation
   - Tailwind class validation
   - Performance checks
   - Browser compatibility

3. JavaScript Validation (js-validator.ts)
   - Syntax validation
   - Runtime error detection
   - Performance checks

4. Auto-Fixer (auto-fixer.ts)
   - Attempts to fix validation errors
   - Runs up to 3 times
   - Logs persistent errors

5. Placeholder Detection (placeholder-detector.ts)
   - Finds Lorem Ipsum text
   - Finds placeholder values
   - Flags incomplete components
```

### AI Request Optimization

- **Timeout**: 60 seconds per AI request (reduced from 180s)
- **Rate Limiting**: Token-based, per-user throttling
- **Model Failover**: Automatic switching between providers
- **Caching**: Request caching with TTL (60s)
- **Retry Logic**: 3 attempts with exponential backoff
- **Circuit Breaker**: Prevents cascading failures

---

## Development Guide

### Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd VB

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Start development server
npm run dev
```

### Required Environment Variables

```bash
# PocketBase
NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=your_password

# AI Models
GEMINI_API_KEY=your_gemini_key
OPENROUTER_API_KEY=your_openrouter_key

# Payment
ZARINPAL_MERCHANT_ID=your_merchant_id

# Cron Jobs
CRON_SECRET=your_secret_key

# MCP (Optional)
GITHUB_TOKEN=your_github_token
BRAVE_API_KEY=your_brave_api_key
```

### Key Commands

```bash
npm run dev              # Start dev server (with nodemon)
npm run dev:direct       # Direct Next.js dev (no nodemon)
npm run build            # Production build
npm start                # Start production server
npm run lint             # Run ESLint
npm run setup:validation-db  # Setup validation database
npm run kill:dev         # Kill dev processes
```

### Adding a New API Route

```typescript
// File: app/api/[feature]/[action]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/pocketbase-middleware";

export async function POST(req: NextRequest) {
  // 1. Authenticate user
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse request
  const body = await req.json();

  // 3. Implement logic
  // ...

  // 4. Return response
  return NextResponse.json({ success: true, data: result });
}
```

### Adding a New Component

```typescript
// File: components/[feature]/NewComponent.tsx
"use client"; // Only if interactive

import React from "react";

interface NewComponentProps {
  // Define props
}

export function NewComponent({ ...props }: NewComponentProps) {
  return (
    <div className="space-y-4">
      {/* Component content */}
    </div>
  );
}
```

### Debugging Tips

**Check Authentication (Browser Console)**:
```javascript
pb.authStore.isValid  // True if logged in
pb.authStore.token    // JWT token
pb.authStore.model    // User object
```

**Check Token Balance (Browser Console)**:
```javascript
const user = await pb.collection('users').getOne(userId);
console.log({
  total: user.totalTokens,
  used: user.usedTokens,
  daily: user.dailyTokens
});
```

**Test AI Model**:
```bash
curl -X POST http://localhost:3000/api/admin/ai-config/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"model": "gemini-2.0-flash"}'
```

**PocketBase Admin Dashboard**:
```
http://localhost:8090/_/
```

---

## AI Model Orchestration

### Available Models (Priority Order)

**Tier 1: Primary (200+ requests/day)**
- Gemini 2.0 Flash (experimental)
- Gemini 1.5 Flash
- Gemini 2.0 Flash (stable)

**Tier 2: Secondary (50+ requests/day)**
- Gemini 1.5 Pro
- Claude (via OpenRouter free tier)

**Tier 3: Fallbacks**
- DeepSeek R1
- Qwen 3
- Llama 3.3
- HuggingFace inference API
- Groq models

### Fallback Chain

```
Gemini (primary)
  ↓ [Rate limit / error]
OpenRouter (secondary)
  ↓ [Rate limit / error]
HuggingFace (fallback)
  ↓ [Error]
Return error to user
```

### Configuration

**Location**: `/lib/ai.ts`

```typescript
{
  timeout: 60000,              // 60 seconds
  retries: 3,                  // Max retry attempts
  throttling: true,            // Enable rate limiting
  caching: true,               // Cache responses (60s TTL)
  circuitBreaker: true,        // Prevent cascading failures
  metadata: {
    model: string,             // Model used
    provider: string,          // Provider name
    attemptsLog: Array,        // Attempt details
    tokensUsed: number         // Token consumption
  }
}
```

---

## Model Context Protocol (MCP)

### Enabled Servers (40+ tools)

**1. Memory Server (9 tools)**
- `create_entities` - Store user preferences
- `add_observations` - Add project context
- `open_nodes` - Retrieve stored information
- `search_nodes` - Search knowledge graph
- `create_relations` - Link concepts
- `delete_entities`, `delete_observations`, `delete_relations` - Cleanup
- `read_graph` - Full graph access

**2. GitHub Server (26 tools)**
- Code search across repositories
- Repository navigation
- Documentation lookup
- File content retrieval
- Pull request management

**3. Brave Search (2 tools)**
- Web search (paid API)
- Advanced filtering

**4. DuckDuckGo (1 tool)**
- Free web search (fallback)

**5. Exa Search (1+ tools)**
- Alternative web search

### When MCP is Used

- **Planning Phase**: Research & context gathering
- **Prototype Generation**: Code examples & templates
- **Chat Interactions**: Real-time information lookup
- **Memory Consolidation**: Daily cron job (2 AM)

### Configuration

**Location**: `/lib/mcp-config.ts`

```typescript
{
  memory: {
    enabled: true,
    maxEntities: 1000,
    consolidationInterval: "daily"
  },
  github: {
    enabled: true,
    token: process.env.GITHUB_TOKEN
  },
  braveSearch: {
    enabled: true,
    apiKey: process.env.BRAVE_API_KEY
  },
  duckDuckGo: {
    enabled: true
  }
}
```

---

## Deployment

### Infrastructure

- **Frontend**: Next.js server (Vercel or self-hosted)
- **Backend**: PocketBase (SQLite)
- **Database**: `/deployment-server/pb_data/data.db`
- **Migrations**: 80+ scripts in `/deployment-server/pb_migrations/`

### Deployment Steps

```bash
# 1. Build frontend
npm run build

# 2. Start backend
cd deployment-server
./start.sh

# 3. Start frontend
npm start
```

### Environment Configuration

**Production `.env` requirements**:
- All API keys configured
- CRON_SECRET set for scheduled jobs
- PocketBase URL pointing to production instance
- Payment provider credentials

### Cron Jobs (External Scheduler)

**Daily Token Reset**:
```bash
curl -X GET https://your-domain.com/api/cron/reset-daily-tokens \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Memory Consolidation**:
```bash
curl -X GET https://your-domain.com/api/cron/consolidate-memory \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Recommended Schedule**: Daily at 2 AM

---

## File Statistics

- **Total API Routes**: 40+
- **React Components**: 21+ directories
- **Library Modules**: 80+ files
- **Database Collections**: 9+
- **Database Migrations**: 80+
- **Supported Languages**: 3 (EN, FA, AR)
- **Design Systems**: 5+ (Ant Design, DaisyUI, Shadcn, Moon, Custom)
- **AI Models**: 10+
- **MCP Servers**: 5+ (40+ tools)
- **Validation Layers**: 5

---

## Key Architectural Decisions

### Why PocketBase?
- Lightweight SQLite backend
- Built-in admin UI
- Real-time subscriptions
- Built-in auth system
- Easy deployment

### Why Next.js?
- Modern App Router
- Server/Client component split
- Built-in API routes
- Native optimizations
- TypeScript support

### Why Multiple AI Models?
- No single rate limit dependency
- Graceful fallback chain
- Cost optimization
- Model-specific strengths

### Why MCP Integration?
- Persistent context via Memory
- Code search via GitHub
- Web search capabilities
- Extensible tool system (40+ tools)

### Why Token-Based Credits?
- Fair usage tracking
- Monetization support
- Flexible pricing tiers
- Transparent consumption

---

## Related Documentation

- [DOCUMENTATION_AND_PLANNING_RULES.md](DOCUMENTATION_AND_PLANNING_RULES.md) - Documentation standards
- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) - Complete file index
- [README.md](README.md) - Project overview
- [docs/](docs/) - Additional documentation

---

**Last Updated**: 2025-10-26
**Version**: 2.0 (Merged from APP_GENERATION_WORKFLOW.md, VB_ARCHITECTURE_OVERVIEW.md, ARCHITECTURE_QUICK_REFERENCE.md)
**Maintainer**: VB Development Team
