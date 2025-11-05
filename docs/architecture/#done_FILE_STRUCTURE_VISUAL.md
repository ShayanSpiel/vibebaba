# Vibebaba Project - Visual File Structure & Component Map

## Complete Project Tree

```
VB (ROOT)
│
├── app/                              # Next.js App Router
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...all]/route.ts              # BetterAuth endpoint
│   │   │                                      # Handles all auth requests
│   │   │
│   │   └── ai/
│   │       ├── plan/route.ts                  # Generate project plan (10 credits)
│   │       ├── backend/route.ts               # Generate DB schema (5 credits)
│   │       ├── prototype/route.ts             # Generate HTML app (50 credits)
│   │       └── chat/route.ts                  # Modify plan/code (15 credits)
│   │
│   ├── layout.tsx                   # Root layout with providers
│   │                                # Contains: LanguageProvider, AuthProvider
│   │
│   ├── page.tsx                     # Homepage / Main app view
│   │                                # Shows: AIChat or sign-in CTA
│   │                                # Shows: ProjectsSidebar (if authenticated)
│   │                                # Shows: ProfileButton (if authenticated)
│   │
│   ├── project/
│   │   └── [id]/page.tsx             # Project workspace
│   │                                 # Displays: Plan view or Prototype preview
│   │                                 # Has: ChatPanel for modifications
│   │
│   ├── settings/page.tsx             # User settings (PROTECTED)
│   │                                 # TODO: Add subscription section here
│   │
│   └── globals.css                  # Global styles
│
├── components/                      # React Components
│   ├── auth/
│   │   ├── AuthProvider.tsx          # Context provider for auth
│   │   │                             # Wraps entire app
│   │   │                             # Provides: useAuth() hook
│   │   │
│   │   ├── AuthModal.tsx             # Sign in/Sign up modal
│   │   │                             # Shows on sign-in button click
│   │   │
│   │   └── ProfileButton.tsx         # User avatar + dropdown menu
│   │                                 # Shows: Settings, Logout options
│   │                                 # TODO: Add "View Credits" option
│   │
│   ├── chat/
│   │   └── AIChat.tsx                # Main chat input textarea
│   │                                 # Only shown to authenticated users
│   │                                 # Creates new project on submit
│   │
│   ├── project/
│   │   ├── ProjectHeader.tsx         # Title and navigation
│   │   ├── PreviewTabs.tsx           # Tab selector (Preview/Code/DB)
│   │   ├── BrowserPreview.tsx        # Shows generated HTML iframe
│   │   ├── CodeEditor.tsx            # Shows generated HTML source
│   │   ├── DatabaseViewer.tsx        # Shows DB schema
│   │   ├── ChatPanelClaude.tsx       # Chat input for modifications
│   │   ├── PlanView.tsx              # Shows project plan markdown
│   │   ├── PrototypeView.tsx         # Shows prototype
│   │   └── FileTree.tsx              # File list (if needed)
│   │
│   ├── ProjectsSidebar.tsx           # Left sidebar with user's projects
│   │                                 # Lists all projects from localStorage
│   │
│   ├── ResizablePanel.tsx            # Resizable panel component
│   ├── Markdown.tsx                  # Markdown renderer
│   ├── LanguageSwitcher.tsx          # Language selector (en/fa/ar)
│   └── ui/                           # Basic UI components
│
├── lib/                             # Utility Functions & Config
│   ├── auth.ts                       # BetterAuth setup
│   │                                 # Database initialization
│   │                                 # TODO: Add subscription tables here
│   │
│   ├── auth-client.ts                # Client-side auth functions
│   │                                 # Exports: signIn, signUp, signOut, useSession
│   │
│   ├── ai.ts                         # AI model functions
│   │                                 # Exports: generateWithFallback(), generatePlan()
│   │                                 # Uses: Gemini API + OpenRouter fallback
│   │
│   ├── html-generator.ts             # HTML code generation utilities
│   │                                 # Generates complete HTML applications
│   │
│   ├── design-system.ts              # Design system utilities
│   ├── design-system-prompt.ts       # AI prompt for design
│   ├── design-components.ts          # Component library
│   ├── moon-design-system.ts         # Moon design system config
│   │
│   ├── language-context.tsx          # i18n context
│   │                                 # Provides: useLanguage() hook
│   │                                 # Supports: English, Farsi, Arabic
│   │
│   ├── i18n.ts                       # i18n configuration
│   ├── rtl-utils.ts                  # RTL language support
│   └── (NEW) credits.ts              # TODO: Credit utility functions
│
├── data/
│   └── auth.db                       # SQLite database
│                                     # Contains: users, sessions, accounts
│                                     # TODO: Will contain: subscriptions, credit_transactions
│
├── messages/                        # i18n Translations
│   ├── en.json                      # English translations
│   ├── fa.json                      # Farsi translations
│   └── ar.json                      # Arabic translations
│
├── public/                          # Static files
│
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── tailwind.config.js               # Tailwind CSS config
├── next.config.js                   # Next.js config
├── postcss.config.js                # PostCSS config
│
└── .env.local                       # Environment variables
                                     # Contains: GEMINI_API_KEY, OPENROUTER_API_KEY
                                     # TODO: Add: STRIPE_API_KEY, etc.
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOME PAGE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ AuthProvider (wraps entire app)                          │  │
│  │ - Manages session state                                 │  │
│  │ - Provides useAuth() hook                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────────┐   │
│  │ Authenticated?   │              │  ProfileButton       │   │
│  │  ├─ YES:         │    or        │  - Shows avatar      │   │
│  │  │  Show AIChat  │              │  - Dropdown menu     │   │
│  │  │  Show Sidebar │              │  - Settings link     │   │
│  │  │  Show Profile │              │  - Logout button     │   │
│  │  ├─ NO:          │              └──────────────────────┘   │
│  │  │  Show CTA     │                                         │
│  │  │  Show SignIn  │              ┌──────────────────────┐   │
│  │  │    Button     │              │ ProjectsSidebar      │   │
│  │  └─              │              │ - Lists all projects │   │
│  └──────────────────┘              │ - From localStorage  │   │
│                                    └──────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    User enters description
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PROJECT PAGE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PLANNING STAGE:                                               │
│  ┌───────────────────────────┬──────────────────────────────┐  │
│  │ 1. Auto-generate plan     │ 2. Display PlanView          │  │
│  │    (call /api/ai/plan)    │    (markdown)                │  │
│  │    └─ Deduct 10 credits   │                              │  │
│  │                           │ 3. Chat panel for feedback   │  │
│  │                           │    (calls /api/ai/chat)      │  │
│  │                           │    └─ Deduct 5 credits each  │  │
│  └───────────────────────────┴──────────────────────────────┘  │
│                                                                 │
│  BUILDING STAGE (when user clicks "Build"):                   │
│  ┌───────────────────────────┬──────────────────────────────┐  │
│  │ 1. Generate backend       │ 2. Display PreviewTabs       │  │
│  │    (call /api/ai/backend) │    ├─ Preview (iframe)      │  │
│  │    └─ Deduct 5 credits    │    ├─ Code (editor)         │  │
│  │                           │    └─ Database (schema)      │  │
│  │ 2. Generate prototype     │                              │  │
│  │    (call /api/ai/proto)   │ 3. Chat panel for mods      │  │
│  │    └─ Deduct 50 credits   │    (calls /api/ai/chat)     │  │
│  │                           │    └─ Deduct 15 credits each│  │
│  │ 3. Inject DB helpers      │                              │  │
│  │    (localStorage API)     │ 4. ProjectHeader            │  │
│  │                           │    ├─ Back button           │  │
│  │                           │    └─ Project title         │  │
│  └───────────────────────────┴──────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Request Flow

```
CLIENT REQUEST
    │
    ├─► /api/ai/plan
    │   ├─ Verify user authenticated
    │   ├─ Check credits (need 10)
    │   ├─ Call generateWithFallback()
    │   │   ├─ Try Gemini models
    │   │   └─ Fallback to OpenRouter
    │   ├─ Deduct credits
    │   └─ Return plan
    │
    ├─► /api/ai/backend
    │   ├─ Verify user authenticated
    │   ├─ Check credits (need 5)
    │   ├─ Call generateWithFallback()
    │   ├─ Parse JSON response
    │   ├─ Validate single collection
    │   ├─ Deduct credits
    │   └─ Return backendConfig
    │
    ├─► /api/ai/prototype
    │   ├─ Verify user authenticated
    │   ├─ Check credits (need 50)
    │   ├─ Generate HTML from plan
    │   ├─ Inject database helpers
    │   ├─ Deduct credits
    │   └─ Return HTML code
    │
    ├─► /api/ai/chat
    │   ├─ Verify user authenticated
    │   ├─ Check credits (need 5-30)
    │   ├─ Determine stage (planning or building)
    │   ├─ If planning: modify plan
    │   ├─ If building: modify HTML
    │   ├─ Deduct credits
    │   └─ Return response
    │
    └─► NEW: /api/credits/balance
        ├─ Verify user authenticated
        ├─ Query subscription table
        └─ Return { creditsRemaining, tier, ... }
```

---

## Authentication State Management

```
┌─────────────────────────────────────────────────────────────────┐
│               BetterAuth Flow                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. User fills AuthModal                                         │
│    ├─ Email                                                    │
│    ├─ Password                                                 │
│    └─ Name (signup only)                                       │
│                                                                 │
│ 2. Submit to /api/auth/[...all]                               │
│    ├─ Hash password (bcryptjs)                                │
│    ├─ Create user record                                      │
│    ├─ Create session                                          │
│    └─ Set session cookie                                      │
│                                                                 │
│ 3. AuthProvider.useSession() detects session                 │
│    ├─ Reads cookie                                            │
│    ├─ Validates session                                       │
│    └─ Updates React state                                     │
│                                                                 │
│ 4. UI updates based on session.data                           │
│    ├─ If authenticated:                                       │
│    │  ├─ Show ProjectsSidebar                                 │
│    │  ├─ Show AIChat                                          │
│    │  └─ Show ProfileButton                                   │
│    ├─ If not:                                                 │
│    │  └─ Show SignIn CTA                                      │
│    │                                                          │
│ 5. Session expires after 7 days                              │
│    └─ Auto-renewed on activity (1 day window)                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Map

```
┌─────────────────────────────────────────────────────────────────┐
│                     CURRENT (auth.db)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  user                   session                account          │
│  ├─ id (PK)            ├─ id (PK)              ├─ id (PK)       │
│  ├─ email (UNIQUE)     ├─ userId (FK)         ├─ userId (FK)   │
│  ├─ emailVerified      ├─ expiresAt           ├─ accountId     │
│  ├─ name               ├─ token (UNIQUE)      ├─ providerId    │
│  ├─ createdAt          ├─ ipAddress           ├─ accessToken   │
│  ├─ updatedAt          ├─ userAgent           ├─ refreshToken  │
│  └─ image              ├─ createdAt           ├─ idToken       │
│                        ├─ updatedAt           ├─ expiresAt     │
│                        └─ (7-day TTL)         ├─ password      │
│                                               ├─ createdAt     │
│                         verification          └─ updatedAt     │
│                         ├─ id (PK)                             │
│                         ├─ identifier                          │
│                         ├─ value                               │
│                         ├─ expiresAt                           │
│                         └─ createdAt                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
              │                   │
              │                   └─► Connect to user.id
              │
              └─► All tables use TEXT primary keys


┌─────────────────────────────────────────────────────────────────┐
│               TO BE ADDED (for credit system)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  subscription                    credit_transaction           │
│  ├─ id (PK)                      ├─ id (PK)                   │
│  ├─ userId (FK, UNIQUE)          ├─ userId (FK)               │
│  ├─ tier ('free'|'pro'|'ent')   ├─ projectId                 │
│  ├─ creditsRemaining             ├─ operationType             │
│  ├─ creditsUsed                  ├─ creditsDeducted           │
│  ├─ renewalDate                  ├─ metadata (JSON)           │
│  ├─ createdAt                    └─ createdAt                 │
│  └─ updatedAt                                                 │
│                                                                 │
│         pricing_plan                                           │
│         ├─ id (PK)                                             │
│         ├─ name ('Free'|'Pro'|'Enterprise')                   │
│         ├─ monthlyCredits                                      │
│         ├─ price                                               │
│         ├─ features (JSON)                                     │
│         └─ createdAt                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
RootLayout
├── LanguageProvider
│   └── AuthProvider
│       ├── HomePage (/page.tsx)
│       │   ├── ProfileButton
│       │   ├── ProjectsSidebar
│       │   └── AIChat
│       │
│       ├── ProjectPage (/project/[id])
│       │   ├── ProjectHeader
│       │   ├── PreviewTabs
│       │   │   ├── BrowserPreview
│       │   │   ├── CodeEditor
│       │   │   └── DatabaseViewer
│       │   ├── ChatPanelClaude
│       │   └── (PlanView or PrototypeView)
│       │
│       └── SettingsPage (/settings)
│           ├── ProfileButton
│           └── (Account Info + Subscription Section)
│
└── AuthModal (when auth needed)
    ├── SignIn Form
    └── SignUp Form
```

---

## File Modification Priority for Credit System

### HIGH PRIORITY (Core functionality)
1. `/lib/auth.ts` - Add subscription & credit_transaction tables
2. `/app/api/ai/plan/route.ts` - Add credit check
3. `/app/api/ai/prototype/route.ts` - Add credit check
4. `/app/api/ai/chat/route.ts` - Add credit check
5. Create `/app/api/credits/deduct` - New endpoint
6. Create `/app/api/credits/balance` - New endpoint

### MEDIUM PRIORITY (UI integration)
7. `/app/settings/page.tsx` - Add subscription section
8. `/app/page.tsx` - Add credit balance widget
9. `/components/auth/ProfileButton.tsx` - Add credits link

### LOW PRIORITY (Nice to have)
10. `/lib/credits.ts` - Create utility functions
11. Create `/app/pricing` page - Show pricing plans
12. Add payment webhook handlers

---

## Environment & Dependencies Reference

### Key Dependencies
- **next** (15.5.6) - Framework
- **better-auth** (1.3.28) - Auth system
- **better-sqlite3** (12.4.1) - Database
- **@google/generative-ai** (0.24.1) - Gemini API
- **tailwindcss** (3.4.18) - Styling

### Environment Variables
```
GEMINI_API_KEY           # Gemini API key
OPENROUTER_API_KEY       # OpenRouter fallback key
STRIPE_SECRET_KEY        # (TODO) Stripe payments
```

---

This visual reference should help you navigate the codebase efficiently!
