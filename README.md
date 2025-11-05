# VB - AI-Powered App Generation Platform

**VibeCoding Platform** - Transform ideas into fully functional applications using AI.

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![PocketBase](https://img.shields.io/badge/PocketBase-Backend-orange?style=flat)](https://pocketbase.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

---

## 🎯 What is VB?

VB (VibeCoding) is a sophisticated AI-powered platform that converts natural language descriptions into production-ready web applications. Users describe what they want to build, and VB generates complete, functional code with:

- **Multi-page applications** with proper routing
- **Backend integration** via PocketBase
- **Responsive UI** with modern design systems
- **Real-time preview** and live editing
- **Multi-language support** (English, Persian, Arabic)

---

## ✨ Key Features

### 🤖 Multi-Model AI System
- **Gemini 2.0 Flash** (primary)
- **Claude via OpenRouter** (fallback)
- **Puter AI** (client-side option)
- Automatic model selection and failover

### 🎨 Advanced Code Generation
- Production-ready HTML/CSS/JavaScript
- React + Vite applications
- Next.js App Router projects
- React Native/Expo apps
- Multi-page and single-page architectures

### ✅ Quality Assurance
- **Comprehensive validation** (HTML, CSS, JS)
- **AI Debugger** with auto-fix (up to 3 attempts)
- **Error tracking & logging**
- **Placeholder detection**
- **Structure validation**

### 🗄️ Database Integration
- PocketBase backend with auto-generated schemas
- Virtual database API (`window.db`) injected into generated apps
- CRUD operations support
- Real-time subscriptions

### 🌍 Internationalization
- English, Persian (Farsi), Arabic support
- RTL language infrastructure
- Localized AI prompts

### 💳 Credit System
- Token-based usage tracking
- Transaction management
- Admin dashboard for monitoring

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- PocketBase (optional, for backend features)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/vb.git
cd vb

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev

# Open browser
open http://localhost:3000
```

### Environment Variables

```env
# AI Provider Keys
GEMINI_API_KEY=your_gemini_key
OPENROUTER_API_KEY=your_openrouter_key

# PocketBase
NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090

# Optional: MCP (Model Context Protocol)
GITHUB_TOKEN=your_github_token
```

---

## 📖 Documentation

### Primary Documentation (Root Level)

- **[APP_GENERATION_WORKFLOW.md](APP_GENERATION_WORKFLOW.md)** ⭐
  Complete technical deep-dive into the app generation system (32 KB, 1,134 lines)

- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** ⭐
  Fast reference guide for common tasks and workflows (12 KB, 493 lines)

- **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)**
  Navigation hub for all documentation

- **[PLAN.md](PLAN.md)**
  Original project plan and roadmap

### Comprehensive Documentation Hub

All detailed documentation is organized in the **[docs/](docs/)** directory:

```
docs/
├── README.md                    # Documentation navigation hub
├── architecture/                # System architecture & schemas
├── guides/                      # How-to guides & tutorials
├── infrastructure/              # App generation infrastructure
├── research/                    # Research & competitive analysis
├── troubleshooting/             # Issue resolution guides
├── fixes/                       # Bug fixes & patches
└── legacy/                      # Historical documentation
```

**👉 Start here:** [docs/README.md](docs/README.md)

---

## 🏗️ Architecture Overview

### App Generation Pipeline (16 Steps)

```
1. User Input → Landing page chat
2. Planning Phase → AI analyzes & generates plan
3. App Type Detection → AI categorizes app type
4. Component Selection → AI determines needed components
5. MCP Context → Gathers real-world examples (optional)
6. Design System → Selects colors, fonts, patterns
7. Example Selection → Fetches implementation examples
8. AI Generation → Generates complete code
9. Validation → Checks HTML/CSS/JS/structure
10. AI Debugging → Auto-fixes errors (3 attempts)
11. Error Logging → Tracks issues in database
12. Backend Config → Generates PocketBase schema (if requested)
13. File Processing → Prepares multi-page structure
14. Storage → Saves to database
15. Live Preview → Renders in iframe
16. Iteration → Chat-based refinement
```

### Tech Stack

**Frontend:**
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Tailwind CSS + DaisyUI
- Sandpack (live code preview)

**Backend:**
- PocketBase (database, auth, file storage)
- SQLite (via PocketBase)

**AI Integration:**
- Google Gemini API
- OpenRouter (Claude, GPT-4, etc.)
- Puter AI (client-side)

**Quality Assurance:**
- Custom validation system
- AI-powered debugging
- Error tracking & logging

---

## 📁 Project Structure

```
vb/
├── app/                         # Next.js App Router
│   ├── api/ai/                  # AI generation endpoints
│   │   ├── plan/                # Planning generation
│   │   ├── backend/             # Backend config generation
│   │   ├── prototype/           # Code generation
│   │   └── chat/                # Refinement & iteration
│   ├── project/[id]/            # Project workspace
│   └── admin/                   # Admin dashboard
│
├── components/                  # React components
│   ├── chat/                    # Chat interface
│   ├── project/                 # Project management
│   └── prototype/               # Code preview
│
├── lib/                         # Core utilities
│   ├── prompts/                 # AI prompt templates
│   ├── validation/              # Code validation
│   ├── services/                # AI debugger, logging
│   ├── langgraph/               # LangGraph integration (WIP)
│   └── *.ts                     # Various utilities
│
├── docs/                        # Comprehensive documentation
├── pocketbase/                  # PocketBase instance & migrations
└── public/                      # Static assets
```

---

## 🎯 Usage Workflow

### 1. Create a Project

```
User: "Build a todo app with categories"
↓
VB generates a comprehensive plan
↓
User reviews and confirms
```

### 2. Generate Code

```
VB analyzes plan
↓
Selects appropriate components and design system
↓
Generates production-ready code
↓
Validates and auto-fixes errors
↓
Displays live preview
```

### 3. Refine & Iterate

```
User: "Make the button blue"
↓
VB updates code while preserving existing functionality
↓
Live preview updates instantly
```

### 4. Deploy

```
Export generated files
↓
Deploy to your preferred hosting
↓
PocketBase schema can be migrated to production
```

---

## 🔍 Key Components

### AI Endpoints

- **[/api/ai/plan](app/api/ai/plan/route.ts)** - Plan generation
- **[/api/ai/backend](app/api/ai/backend/route.ts)** - Database schema generation
- **[/api/ai/prototype](app/api/ai/prototype/route.ts)** - Code generation (main)
- **[/api/ai/chat](app/api/ai/chat/route.ts)** - Code refinement

### Validation System

- **[lib/validation/](lib/validation/)** - Complete validation suite
  - HTML validation (HTMLHint-based)
  - CSS validation (custom)
  - JavaScript validation (custom)
  - Placeholder detection
  - Structure validation
  - Link validation (multi-page apps)

### AI Services

- **[lib/services/ai-debugger.ts](lib/services/ai-debugger.ts)** - Auto-fix errors
- **[lib/services/validation-error-logger.ts](lib/services/validation-error-logger.ts)** - Error tracking

### Example System

- **[lib/example-selector.ts](lib/example-selector.ts)** - Select implementation examples
- **[lib/example-generator.ts](lib/example-generator.ts)** - Generate examples via AI
- **[lib/example-categories.ts](lib/example-categories.ts)** - Example categorization

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run type-check

# Build for production
npm run build
```

---

## ⚡ Command Reference

### Development Servers

#### Main Application (Next.js)

```bash
# Start development server (default)
npm run dev

# Start development server directly (no nodemon)
npm run dev:direct

# Clean start (kills orphaned processes first)
npm run dev:clean

# Kill all development processes
npm run kill:dev
```

#### PocketBase Database & Deployment Server

```bash
# Start PocketBase + Deployment Server (recommended)
cd deployment-server && ./start.sh

# PocketBase will be available at:
# - Admin UI: http://localhost:8090/_/
# - Default credentials: admin@vibebaba.com / admin1234567890

# Deployment Server will be available at:
# - API: http://localhost:4000

# Stop PocketBase
pkill -f pocketbase

# View PocketBase logs
cd deployment-server && tail -f pocketbase.log
```

### Build & Production

```bash
# Build for production
npm run build

# Start production server
npm start

# Test production build locally
npm run build && npm start
```

### Database & Setup

```bash
# Setup validation database
npm run setup:validation-db

# Run database verification
./verify-data.sh

# Check database status
./check-db.sh

# List PocketBase users
./scripts/list-users.sh

# Setup admin and projects collection
./scripts/setup-admin-and-projects.sh

# Create projects collection
./scripts/create-projects-collection.sh

# Fix PocketBase schema
./scripts/fix-pocketbase-schema.sh

# Apply validation logs migration
./scripts/apply-validation-logs-migration.sh
```

### Testing & Debugging

```bash
# Test all API endpoints
./scripts/test-all-endpoints.sh

# Test design system
./test-design-system.sh

# Clean development environment
./scripts/clean-dev.sh

# Check for running Node processes
ps aux | grep -E 'next-server|next dev|node.*\.next'

# Kill specific process by PID
kill -9 <PID>

# Check ports in use
lsof -i :3000  # Main app
lsof -i :8090  # PocketBase
lsof -i :4000  # Deployment server
```

### Deployment Server Commands

```bash
# Navigate to deployment server
cd deployment-server

# Start deployment server only
npm run dev

# Start deployment server in production
npm start

# Install dependencies
npm install
```

### Useful Scripts

```bash
# Clean and restart development
./scripts/clean-dev.sh

# Development with auto-restart
./scripts/dev.sh

# Kill orphaned Next.js processes
pkill -9 -f "next dev|next-server|node.*\.next"

# Kill orphaned nodemon processes
pkill -9 -f nodemon
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
nano .env.local  # or use your preferred editor

# Required variables:
# - GEMINI_API_KEY
# - OPENROUTER_API_KEY
# - NEXT_PUBLIC_POCKETBASE_URL (default: http://localhost:8090)
```

### Quick Development Workflow

```bash
# 1. Start PocketBase and deployment server
cd deployment-server && ./start.sh

# 2. In a new terminal, start the main app
cd /Users/shayan/Desktop/Projects/VB
npm run dev:clean

# 3. Access the application
# - Main app: http://localhost:3000
# - PocketBase admin: http://localhost:8090/_/
# - Deployment server: http://localhost:4000
```

### Troubleshooting Commands

```bash
# Port already in use?
lsof -ti :3000 | xargs kill -9  # Kill process on port 3000
lsof -ti :8090 | xargs kill -9  # Kill process on port 8090
lsof -ti :4000 | xargs kill -9  # Kill process on port 4000

# Clean Next.js cache
rm -rf .next

# Clean node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Reset PocketBase (WARNING: deletes all data)
cd deployment-server
rm -rf pb_data
./pocketbase serve
```

### Package Scripts Reference

#### Main Application (package.json)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with nodemon |
| `npm run dev:direct` | Start Next.js dev server directly |
| `npm run dev:clean` | Clean start (kills orphaned processes) |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run setup:validation-db` | Setup validation database |
| `npm run kill:dev` | Kill all dev processes |

#### Deployment Server (deployment-server/package.json)

| Command | Description |
|---------|-------------|
| `npm start` | Start server in production mode |
| `npm run dev` | Start server with nodemon (auto-restart) |

---

## 🐛 Troubleshooting

### Common Issues

**Issue: Generated code has errors**
- Solution: Check [docs/troubleshooting/AI_GENERATION_ISSUES_AND_FIXES.md](docs/troubleshooting/AI_GENERATION_ISSUES_AND_FIXES.md)

**Issue: Validation fails**
- Solution: See [docs/infrastructure/VALIDATION_SYSTEM_DESIGN.md](docs/infrastructure/VALIDATION_SYSTEM_DESIGN.md)

**Issue: Database not working**
- Solution: Check [docs/architecture/POCKETBASE_SCHEMA.md](docs/architecture/POCKETBASE_SCHEMA.md)

**More help:** [docs/troubleshooting/](docs/troubleshooting/)

---

## 🎓 Learning Resources

### For New Developers
1. [docs/guides/QUICK_START.md](docs/guides/QUICK_START.md)
2. [docs/architecture/AUTHENTICATION_SYSTEM.md](docs/architecture/AUTHENTICATION_SYSTEM.md)
3. [docs/guides/TESTING_GUIDE.md](docs/guides/TESTING_GUIDE.md)

### For Understanding AI Generation
1. [docs/research/AI_GENERATION_RESEARCH_AND_IMPROVEMENTS.md](docs/research/AI_GENERATION_RESEARCH_AND_IMPROVEMENTS.md)
2. [docs/research/V0_DEEP_DIVE_AND_ENHANCEMENTS.md](docs/research/V0_DEEP_DIVE_AND_ENHANCEMENTS.md)
3. [docs/infrastructure/VALIDATION_AND_DEBUGGING_SYSTEM.md](docs/infrastructure/VALIDATION_AND_DEBUGGING_SYSTEM.md)

### For Deployment
1. [docs/guides/DEPLOYMENT_SETUP.md](docs/guides/DEPLOYMENT_SETUP.md)
2. [docs/guides/SECURITY.md](docs/guides/SECURITY.md)

---

## 🔬 Research & Development

### Active Research

- **Multi-Modal AI Generation** - Completed ✅
- **Validation & Debugging System** - Completed ✅
- **Example System** - Completed ✅
- **LangGraph Integration** - In Progress 🚧

See [#notDone_LANGGRAPH_INTEGRATION_PLAN.md](#notDone_LANGGRAPH_INTEGRATION_PLAN.md) for LangGraph plans.

### Completed Research

All completed research is documented in [docs/research/](docs/research/):
- v0.dev analysis and best practices
- Competitive analysis (screenshot-to-code, bolt.new, v0.diy)
- Modern UI trends (2025)
- Component selection strategies

---

## 🤝 Contributing

We welcome contributions! Please:

1. Read the documentation in [docs/](docs/)
2. Follow the coding standards in [docs/architecture/COMPONENT_STANDARDS.md](docs/architecture/COMPONENT_STANDARDS.md)
3. Add tests for new features
4. Update documentation as needed

---

## 📄 License

[Your License Here]

---

## 🙏 Acknowledgments

- **v0.dev** - Inspiration for code generation best practices
- **screenshot-to-code** - Pixel-perfect generation insights
- **bolt.new** - Full-stack generation patterns
- **PocketBase** - Excellent backend-as-a-service
- **Vercel** - v0 components and design system inspiration

---

## 📊 Project Stats

- **Documentation:** 50+ comprehensive markdown files
- **Code Validation:** 6-layer validation system
- **AI Models:** 3+ supported (Gemini, Claude, Puter)
- **Languages:** 3 (English, Persian, Arabic)
- **App Types:** HTML, React, Next.js, React Native
- **Routing Types:** Single-page, Multi-page, React Router, Next.js, Expo

---

## 📞 Support

- **Documentation:** [docs/README.md](docs/README.md)
- **Issues:** [GitHub Issues](https://github.com/yourusername/vb/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/vb/discussions)

---

**Built with ❤️ using AI-powered code generation**
