# Vibebaba - Incomplete Vibe Coding Platform Experiment

> **⚠️ This is an incomplete, experimental vibe coding platform.** Use at your own risk. This is an open-source experiment - use it however you want, modify it, break it, learn from it, or build something better on top.

---

## What is this?

Vibebaba is an **experimental vibe coding platform** that attempts to merge:
- **Frontend generation** (React/Next.js/HTML via AI)
- **Backend/database** via a lightweight **PocketBase** instance (SQLite-based, self-hosted)
- **LangGraph-based orchestration** with role-based nodes (planner, frontend dev, backend dev, QA, etc.)
- **Multi-model AI orchestration** (Gemini, OpenRouter/Claude, OpenAI, etc.)

It's an experiment in "vibe coding" - where you describe what you want in natural language and AI agents collaborate to generate a full-stack application with frontend, backend schema, and database schema all at once.

## ⚠️ Status: INCOMPLETE EXPERIMENT

This is **not production-ready**. It's an experiment with:
- ⚠️ Incomplete LangGraph integration (work in progress)
- ⚠️ PocketBase as a lightweight self-hosted DB (SQLite, not for production scale)
- ⚠️ Role-based LangGraph nodes (planner, frontend, backend, QA) - partially implemented
- ⚠️ Multi-model AI orchestration (Gemini, OpenRouter, OpenAI, etc.) - partially working
- ⚠️ PocketBase schema generation from AI - experimental
- ⚠️ Frontend code generation (React/Next.js/HTML) - experimental quality
- ⚠️ No authentication/authorization in generated apps (yet)
- ⚠️ No deployment pipeline (experimental deployment server exists but is experimental)
- ⚠️ Many bugs, incomplete features, and rough edges

**Use at your own risk. This is an experiment, not a product.**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vibebaba Platform                        │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js 15 + React 19 + Tailwind)                   │
│  ├── Chat Interface → LangGraph Orchestrator                    │
│  ├── Project Workspace (Code Editor, Preview, DB Viewer)       │
│  └── Admin Dashboard                                            │
├─────────────────────────────────────────────────────────────────┤
│  LangGraph Orchestrator (WIP)                                   │
│  ├── Planner Node       → Creates app specification             │
│  ├── Frontend Node      → Generates React/Next.js/HTML code     │
│  ├── Backend Node       → Generates PocketBase schema           │
│  ├── QA Node            → Validates generated code              │
│  └── Refiner Node       → Iterates based on feedback            │
├─────────────────────────────────────────────────────────────────┤
│  PocketBase (SQLite, Self-Hosted)                               │
│  ├── Projects / Users / Collections                             │
│   ├── Generated App Schemas (dynamic collections)              │
│   ├── Auth (Auth + Auth providers)                             │
│   └── File Storage                                              │
├─────────────────────────────────────────────────────────────────┤
│  AI Providers (Multi-Model)                                     │
│  ├── Google Gemini 2.0 Flash (primary)                         │
│  ├── OpenRouter (Claude, GPT-4, etc.)                          │
│  ├── OpenAI Direct                                              │
│  └── Puter.js (client-side fallback)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| **Backend/DB** | PocketBase (Go + SQLite), self-hosted |
| **AI Orchestration** | LangGraph (LangChain) - WIP |
| **AI Models** | Gemini 2.0 Flash, OpenRouter (Claude/GPT-4), OpenAI, Puter.js |
| **Validation** | Custom HTML/CSS/JS validation, AI Debugger (auto-fix) |
| **Deployment** | Experimental deployment server (WIP) |

---

## Quick Start (If You Dare)

### Prerequisites
- Node.js 18+
- PocketBase (downloaded automatically or manually)
- API keys for at least one AI provider (Gemini, OpenRouter, or OpenAI)

### Setup

```bash
# Clone
git clone https://github.com/ShayanSpiel/Vibebaba.git
cd Vibebaba

# Install dependencies
npm install

# Copy env template (NO REAL KEYS IN REPO - use .env.local)
cp .env.example .env.local

# Edit .env.local with your API keys
# Required: At least one of GEMINI_API_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY
# Optional: PocketBase URL (defaults to http://localhost:8090)

# Start PocketBase (in separate terminal)
cd deployment-server && ./start.sh
# OR manually: ./pocketbase serve --http=0.0.0.0:8090

# Start Next.js dev server (in another terminal)
npm run dev

# Open http://localhost:3000
```

### Environment Variables (`.env.local`)

```env
# REQUIRED: At least one AI provider
GEMINI_API_KEY=your_gemini_key
# OR
OPENROUTER_API_KEY=your_openrouter_key
# OR
OPENAI_API_KEY=your_openai_key

# PocketBase (optional - defaults to localhost:8090)
NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090

# Optional: LangSmith for LangGraph tracing
# LANGCHAIN_TRACING_V2=true
# LANGCHAIN_API_KEY=your_langsmith_key
# LANGCHAIN_PROJECT=vibebaba
```

**⚠️ NEVER commit `.env.local` or any real API keys to git. The `.gitignore` excludes them.**

---

## Project Structure

```
Vibebaba/
├── app/                          # Next.js App Router
│   ├── api/ai/                   # AI API routes
│   │   ├── plan/                 # Planning node (LangGraph)
│   │   ├── prototype/            # Frontend generation node
│   │   ├── backend/              # Backend schema generation node
│   │   ├── chat/                 # Refinement/chat node
│   │   └── langgraph/            # LangGraph workflow (WIP)
│   ├── project/[id]/             # Project workspace
│   └── admin/                    # Admin dashboard
├── components/                   # React components
│   ├── project/                  # Project workspace components
│   ├── chat/                     # Chat interface
│   ├── auth/                     # Auth components (PocketBase)
│   └── ui/                       # UI primitives
├── lib/                          # Core libraries
│   ├── langgraph/                # LangGraph nodes & workflows (WIP)
│   ├── prompts/                  # AI prompt templates
│   ├── validation/               # Code validation system
│   ├── services/                 # AI debugger, error logging
│   └── pocketbase.ts             # PocketBase client
├── pocketbase/                   # PocketBase binary & migrations
├── deployment-server/            # Experimental deployment server
├── scripts/                      # Utility scripts
└── docs/                         # Documentation (extensive)
```

---

## LangGraph Architecture (WIP)

The core experiment is a **LangGraph-based multi-agent system** with role-based nodes:

| Node | Role | Status |
|------|------|--------|
| **Planner** | Analyzes user intent, creates app spec | 🚧 WIP |
| **Frontend Dev** | Generates React/Next.js/HTML code | 🚧 WIP |
| **Backend Dev** | Generates PocketBase schema/collections | 🚧 WIP |
| **QA / Validator** | Runs validation, detects issues | 🚧 Partial |
| **Refiner** | Iterates based on validation feedback | 🚧 WIP |
| **Supervisor** | Orchestrates the workflow | 🚧 WIP |

**LangGraph integration is incomplete** - the workflow graph is defined but execution has issues. The legacy non-LangGraph API routes still handle most generation.

---

## PocketBase Integration

PocketBase runs as a **lightweight, self-hosted SQLite database** with:
- Auto-generated collections from AI-generated backend specs
- Built-in auth (email/password, OAuth providers)
- File storage for uploads
- Real-time subscriptions
- Admin UI at `http://localhost:8090/_/`

**Not production-ready** - SQLite doesn't scale horizontally. For production, you'd migrate to PostgreSQL.

---

## Open Source License

**This is open source. Use it however you want.**

- MIT License (see `LICENSE` file)
- No warranty, no guarantees
- Fork it, break it, learn from it, build something better
- No attribution required (but appreciated)

---

## Documentation

Extensive (but sometimes outdated) documentation in [`docs/`](docs/):
- [Architecture](docs/architecture/) - System design, schemas
- [Guides](docs/guides/) - How-to guides
- [Infrastructure](docs/infrastructure/) - App generation pipeline
- [Research](docs/research/) - AI generation research, v0.dev analysis
- [Troubleshooting](docs/troubleshooting/) - Common issues

---

## Contributing

It's an experiment. PRs welcome but no guarantees on review speed or direction. This project may pivot, stall, or be abandoned at any time.

---

## Disclaimer

> **This is an incomplete experiment.** It has bugs, incomplete features, security issues, and architectural flaws. Do not use for production applications. Do not put real user data in it. Do not rely on generated code without thorough review. This is a learning experiment shared openly.

---

**Built with ❤️ and 🤖 as a vibe coding experiment.**  
**Repository:** https://github.com/ShayanSpiel/Vibebaba