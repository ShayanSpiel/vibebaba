# Vibebaba Credit System Implementation Guide

## Project Architecture Overview

This document provides a comprehensive overview of the Vibebaba project structure to guide the implementation of a credit system.

---

## 1. PROJECT STRUCTURE

### Directory Layout
```
/Users/shayan/Desktop/Projects/VB/
├── app/                           # Next.js App Router (13+)
│   ├── api/                       # API routes
│   │   ├── auth/[...all]/         # BetterAuth handler
│   │   └── ai/
│   │       ├── chat/route.ts       # Chat modifications
│   │       ├── plan/route.ts       # Generate project plan
│   │       ├── backend/route.ts    # Generate database schema
│   │       └── prototype/route.ts  # Generate HTML prototype
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Homepage (authenticated check)
│   ├── project/[id]/page.tsx       # Project workspace
│   ├── settings/page.tsx           # User settings (protected)
│   └── globals.css                # Global styles
│
├── components/                    # React components
│   ├── auth/
│   │   ├── AuthProvider.tsx        # Auth context provider
│   │   ├── AuthModal.tsx           # Sign in/Sign up modal
│   │   └── ProfileButton.tsx       # User profile dropdown
│   ├── chat/
│   │   └── AIChat.tsx              # Main chat input component
│   ├── project/                    # Project workspace components
│   │   ├── ProjectHeader.tsx
│   │   ├── ChatPanelClaude.tsx
│   │   ├── PreviewTabs.tsx
│   │   ├── DatabaseViewer.tsx
│   │   └── CodeEditor.tsx
│   ├── ProjectsSidebar.tsx        # Projects list sidebar
│   └── ui/                        # Basic UI components
│
├── lib/                           # Utility functions
│   ├── auth.ts                    # BetterAuth configuration
│   ├── auth-client.ts             # Client-side auth
│   ├── ai.ts                      # AI/LLM utilities
│   ├── html-generator.ts          # HTML code generation
│   ├── design-system.ts           # Design utilities
│   ├── language-context.tsx       # i18n context
│   └── rtl-utils.ts               # RTL support
│
├── data/
│   └── auth.db                    # SQLite auth database
│
├── messages/                      # i18n translations
│   ├── en.json
│   ├── fa.json
│   └── ar.json
│
└── package.json                   # Dependencies
```

---

## 2. CURRENT DATABASE SCHEMA

### Technology: SQLite with BetterAuth

**Database Location**: `/data/auth.db`

### Tables

#### `user` table
```sql
CREATE TABLE user (
  id TEXT PRIMARY KEY,                    -- User ID
  email TEXT UNIQUE NOT NULL,             -- Email address
  emailVerified INTEGER DEFAULT 0,        -- Email verification status
  name TEXT,                              -- User name
  createdAt INTEGER NOT NULL,             -- Creation timestamp
  updatedAt INTEGER NOT NULL,             -- Update timestamp
  image TEXT                              -- User avatar (optional)
);
```

#### `session` table
```sql
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);
```

#### `account` table
```sql
CREATE TABLE account (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  expiresAt INTEGER,
  password TEXT,                          -- Hashed password (bcryptjs)
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);
```

#### `verification` table
```sql
CREATE TABLE verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER NOT NULL
);
```

### Additional Data Storage

**Projects**: Stored in browser `localStorage`
- Key: `project_{projectId}`
- Structure:
```typescript
{
  id: string;
  description: string;
  stage: "planning" | "building";
  createdAt: string (ISO);
  plan?: string;
  prototypeCode?: string;
  backendConfig?: {
    collections: Array<{
      name: string;
      fields: Array<{ name: string; type: string }>;
    }>;
  };
  messages?: Array<{ role: string; content: string }>;
  userId?: string;
}
```

---

## 3. AUTHENTICATION SYSTEM

### Framework: BetterAuth v1.3.28

**Location**: `/lib/auth.ts` and `/lib/auth-client.ts`

### Features
- Email/Password authentication (no email verification required)
- 7-day session expiration with 1-day update age
- Password hashing with bcryptjs
- Session management via cookies
- Next.js integration with `nextCookies()` plugin

### Authentication Flow
```
1. User clicks "Sign in" button
   ↓
2. AuthModal opens (signin/signup tabs)
   ↓
3. Submit email + password
   ↓
4. BetterAuth processes request
   ↓
5. Session created + stored in database
   ↓
6. Session cookie set in browser
   ↓
7. useAuth() hook detects session
   ↓
8. UI updates (sidebar, profile button visible)
```

### Key Components

**AuthProvider** (`/components/auth/AuthProvider.tsx`)
- Creates React context for authentication
- Uses `authClient.useSession()` hook
- Provides `signIn`, `signUp`, `signOut` functions

**AuthModal** (`/components/auth/AuthModal.tsx`)
- Modal for sign-in/sign-up
- Form validation and error handling
- Toggle between modes

**ProfileButton** (`/components/auth/ProfileButton.tsx`)
- Shows user initials in avatar
- Dropdown menu with Settings + Logout
- Click-outside detection

---

## 4. AI API INTEGRATION

### Models Used

#### Gemini API (Priority)
- Models: gemini-2.0-flash-exp, gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash, gemini-1.5-pro
- API Key: `process.env.GEMINI_API_KEY`

#### OpenRouter Fallback
- Free models: DeepSeek, Llama, Google models, Nvidia, Qwen
- API Key: `process.env.OPENROUTER_API_KEY`

### API Routes

#### 1. `/api/ai/plan` - Generate Project Plan
```typescript
POST /api/ai/plan
Body: { description: string }
Response: { plan: string, context: object }

Purpose: Creates initial project plan/architecture from user description
Prompt: Ask AI to structure plan with features, user flow, data models, UI/UX
```

#### 2. `/api/ai/backend` - Generate Database Schema
```typescript
POST /api/ai/backend
Body: { plan: string, description: string, prototypeCode?: string }
Response: { backendConfig: { collections: Array<{ name: string, fields: Array }> } }

Purpose: Creates minimal database schema
Rules: Only ONE collection, 3-5 fields max, no user/auth tables
```

#### 3. `/api/ai/prototype` - Generate HTML Application
```typescript
POST /api/ai/prototype
Body: { 
  plan: string, 
  description: string, 
  projectId: string,
  backendConfig?: object,
  context?: object 
}
Response: { code: string }

Purpose: Generates complete multi-page HTML application
Output: Standalone HTML with embedded CSS/JS
```

#### 4. `/api/ai/chat` - Modify Application
```typescript
POST /api/ai/chat
Body: {
  messages: Array<{ role: string, content: string }>,
  currentPlan: string,
  stage: "planning" | "building",
  prototypeCode?: string,
  description: string,
  backendConfig?: object
}
Response: { response: string, updatedPlan?: string, updatedCode?: string }

Purpose: Interactive chat to modify plan or generated code
Two stages:
- planning: Modify project plan based on user feedback
- building: Modify generated HTML code
```

### AI Utility Functions

**Location**: `/lib/ai.ts`

```typescript
generateWithFallback(prompt: string): Promise<string>
// Tries Gemini models first, falls back to OpenRouter
// Returns generated text

generatePlan(appDescription: string)
// Generates structured project plan
// Returns markdown with features, data models, UI highlights
```

---

## 5. ENVIRONMENT VARIABLES

**File**: `.env.local`

```
GEMINI_API_KEY=AIzaSyBU4Fn5a5xI_UIAzHjjjiQOpg3EoWQqVnA
OPENROUTER_API_KEY=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
```

---

## 6. APPLICATION FLOW

### Stage 1: Homepage
```
Unauthenticated User:
├─ Sees "Vibebaba" title
├─ Sees sign-in CTA
├─ Can click "Sign in" button
└─ No projects sidebar

Authenticated User:
├─ Sees "Vibebaba" title
├─ Sees chat input textarea
├─ Can enter app description
├─ Projects sidebar on left (all their projects)
└─ Profile button top-right
```

### Stage 2: Project Creation (Chat Page)
```
1. User enters app description and presses Enter
2. App creates project with random ID
3. Project stored in localStorage
4. Navigate to /project/{id}
```

### Stage 3: Project Workspace
```
Location: /project/[id]/page.tsx

Workflow:
1. Load project from localStorage
2. Auto-generate plan if in "planning" stage
3. Display PlanView component showing plan
4. When user clicks "Build", change stage to "building"
5. Auto-generate backend config and prototype code
6. Display BrowserPreview of generated HTML
7. Chat panel for iterative modifications
```

### Stage 4: Iteration
```
User provides feedback in chat:
├─ If in planning: AI updates plan
└─ If in building: AI updates HTML code

All modifications are:
- Generated by AI
- Updated in real-time preview
- Stored in localStorage
- Accumulated in message history
```

---

## 7. HOMEPAGE & LAYOUT FILES

### Root Layout (`/app/layout.tsx`)
```typescript
Providers:
- LanguageProvider (i18n)
- AuthProvider (authentication context)

Features:
- Google Fonts (Poppins)
- Responsive meta tags
- Global styles
```

### Homepage (`/app/page.tsx`)
```typescript
Logic:
- Check if user authenticated
- Show appropriate UI based on auth status

Unauthenticated:
- Sign-in CTA button
- Message about signing in

Authenticated:
- AIChat component (textarea)
- ProjectsSidebar (left panel)
- ProfileButton (top-right)
```

### Project Page (`/app/project/[id]/page.tsx`)
```typescript
Features:
- Load project from localStorage
- Auto-generate plan/backend/prototype
- Display different views (preview/code/database)
- Chat panel for modifications

Components Used:
- ProjectHeader: Title + navigation
- PreviewTabs: Tabs for view selection
- BrowserPreview: HTML preview
- CodeEditor: View generated code
- DatabaseViewer: View database schema
- ChatPanelClaude: Chat input for modifications
```

### Settings Page (`/app/settings/page.tsx`)
```typescript
Features:
- Protected (requires authentication)
- Displays user name and email (read-only)
- Placeholder for preferences/security
- Back button to homepage

Currently:
- Account Information section
- Preferences (coming soon)
- Security (coming soon)
```

---

## 8. SETTINGS & PROFILE PAGES

### Settings Page (`/app/settings/page.tsx`)
- Route: `/settings`
- Protected by authentication check
- Displays user profile info
- Expandable for preferences, security

### Profile Dropdown (`/components/auth/ProfileButton.tsx`)
- Shows user initials in avatar
- Dropdown menu:
  - Settings link
  - Logout button

---

## 9. KEY DEPENDENCIES

```json
{
  "next": "^15.5.6",
  "react": "^19.0.0",
  "typescript": "^5.9.3",
  
  "better-auth": "^1.3.28",           // Authentication
  "better-sqlite3": "^12.4.1",        // Database
  "bcryptjs": "^3.0.2",               // Password hashing
  
  "@google/generative-ai": "^0.24.1", // Gemini API
  
  "next-intl": "^4.3.12",             // i18n
  "react-markdown": "^10.1.0",        // Markdown rendering
  
  "@moondesignsystem/react": "^2.5.18", // UI components
  "@moondesignsystem/ui": "^3.7.2",
  
  "tailwindcss": "^3.4.18",           // Styling
  "daisyui": "^5.3.7"                 // Tailwind components
}
```

---

## 10. IMPLEMENTATION POINTS FOR CREDIT SYSTEM

### Where to Add Credit Tables
**Location**: `/lib/auth.ts` - Extend database initialization

```sql
-- Add these tables to db.exec() call

CREATE TABLE IF NOT EXISTS subscription (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  tier TEXT NOT NULL,              -- 'free' | 'pro' | 'enterprise'
  creditsRemaining INTEGER,
  creditsUsed INTEGER DEFAULT 0,
  renewalDate INTEGER,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS credit_transaction (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  amount INTEGER,                  -- Credits used (negative) or granted (positive)
  type TEXT,                       -- 'plan_generation' | 'prototype_generation' | 'chat_modification'
  projectId TEXT,
  metadata TEXT,                   -- JSON with details
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);
```

### Where to Deduct Credits
1. **Plan Generation**: `/app/api/ai/plan/route.ts`
   - Deduct ~10 credits
   
2. **Prototype Generation**: `/app/api/ai/prototype/route.ts`
   - Deduct ~50 credits
   
3. **Chat Modifications**: `/app/api/ai/chat/route.ts`
   - Deduct ~5-20 credits based on modification type

### Where to Display Credits
1. **Settings Page**: `/app/settings/page.tsx`
   - Add section showing remaining credits
   - Show subscription tier
   - Add upgrade button

2. **Homepage**: `/app/page.tsx`
   - Show credit balance in top bar
   - Warning when low on credits

3. **Project Page**: `/app/project/[id]/page.tsx`
   - Show credit cost before operations
   - Prevent operations if insufficient credits

### API Route for Credit Management
Create new route: `/app/api/credits/deduct`
```typescript
// POST /api/credits/deduct
// Body: { userId: string, projectId: string, operationType: string, amount: number }
// Returns: { success: boolean, remainingCredits: number }
```

---

## 11. MIDDLEWARE & CONTEXT

### Language Context (`/lib/language-context.tsx`)
- Handles RTL/LTR languages
- Currently supports: English, Farsi, Arabic

### Auth Context (`/components/auth/AuthProvider.tsx`)
- Exposes auth functions
- Session management

### Project Data Flow
- Stored in localStorage
- Synced with AI responses
- No backend persistence (yet)

---

## 12. DESIGN SYSTEM

### Colors
- Primary: Black (`#000`)
- Secondary: White (`#fff`)
- Accents: Grays for subtle effects

### Typography
- Font: Poppins (300, 400, 500, 600 weights)
- Sizes: Follow Tailwind scale

### Components
- Buttons: Black bg, white text, hover effects
- Inputs: Border-based, focus rings
- Modals: Centered with backdrop blur
- Sidebar: Left-aligned, scrollable

---

## 13. COMMON PATTERNS

### Project Management
```typescript
// Create project
const projectId = Date.now().toString(36) + Math.random().toString(36).substr(2);
localStorage.setItem(`project_${projectId}`, JSON.stringify(projectData));

// Load project
const projectData = localStorage.getItem(`project_${projectId}`);

// Update project
localStorage.setItem(`project_${projectId}`, JSON.stringify(updatedData));
```

### API Calls
```typescript
// Standard fetch pattern
const response = await fetch("/api/endpoint", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});

const data = await response.json();
if (response.ok) {
  // Success
} else {
  // Error
}
```

### Component State Management
- useState for local state
- Context API for global state
- localStorage for persistence
- No Redux/Zustand

---

## SUMMARY FOR CREDIT SYSTEM IMPLEMENTATION

To implement a credit system:

1. **Add database tables** in `/lib/auth.ts`
   - subscription (tracks user tier and credits)
   - credit_transaction (logs all credit usage)

2. **Add middleware** to deduct credits:
   - Wrap AI API routes with credit checking
   - Create `/api/credits/deduct` endpoint
   - Add pre-flight credit validation

3. **Add UI components**:
   - Credit balance widget in header
   - Credit usage history in settings
   - Plan/pricing page for upgrades
   - Payment processing integration

4. **Add new API routes**:
   - `/api/subscription/current` - Get user's current subscription
   - `/api/subscription/upgrade` - Upgrade plan
   - `/api/credits/balance` - Check remaining credits

5. **Modify existing pages**:
   - Settings: Add subscription section
   - Homepage: Show credit balance
   - Project page: Show credit costs

6. **Payment Integration**:
   - Stripe/Paddle API for payments
   - Webhook handlers for payment confirmation
   - Recurring billing setup

This architecture is ready for credit system integration!
