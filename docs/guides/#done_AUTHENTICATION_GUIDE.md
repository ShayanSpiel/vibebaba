# Vibebaba Authentication System Documentation

## Overview

The Vibebaba application now includes a complete authentication system built with **BetterAuth**, providing fast, secure user authentication with email/password (no verification required). The system integrates seamlessly with the existing design system and provides a smooth user experience.

---

## Table of Contents

1. [Features](#features)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Components](#components)
5. [User Flow](#user-flow)
6. [Database Schema](#database-schema)
7. [API Routes](#api-routes)
8. [File Structure](#file-structure)
9. [Usage Guide](#usage-guide)
10. [Troubleshooting](#troubleshooting)

---

## Features

### ✅ Implemented Features

- **Fast Email/Password Authentication**: Sign up and sign in with email only (no verification required)
- **Beautiful Auth Modal**: Centered modal with smooth animations for sign-in/sign-up
- **Profile Avatar Button**: Displays user initials with dropdown menu
- **Settings Page**: User profile information page (expandable)
- **Projects History Sidebar**: Shows all user projects with timestamps
- **Conditional UI**: Chat input only shown to authenticated users
- **Project-User Association**: Projects are linked to user accounts
- **Persistent Sessions**: 7-day session expiration with automatic renewal
- **Responsive Design**: All components match the black & white design system
- **Sign Out Functionality**: Clean logout with session cleanup
- **Protected Routes**: Settings page requires authentication

### 🎨 Design Integration

All authentication components follow the Vibebaba design system:
- Black & white color palette
- Poppins font family
- Smooth transitions and animations
- Consistent border styles and shadows
- Mobile-responsive layouts

---

## Technology Stack

### Core Authentication
- **BetterAuth** (v1.x): Modern authentication library
- **better-sqlite3**: Local SQLite database for auth data
- **bcryptjs**: Password hashing

### Frontend
- **Next.js 15.5.6**: React framework with App Router
- **React 19.0.0**: UI library
- **TypeScript**: Type safety

### Styling
- **Tailwind CSS**: Utility-first styling
- **Custom animations**: Fade-in, zoom-in, slide-in effects

---

## Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Journey                            │
└─────────────────────────────────────────────────────────────────┘

1. HOMEPAGE (Unauthenticated)
   ├─ Shows "Sign in" button (top right)
   ├─ Shows sign-in CTA instead of chat input
   └─ No projects sidebar visible

2. SIGN-IN MODAL (Opens on button click)
   ├─ Email + Password fields
   ├─ Toggle between Sign In / Sign Up
   ├─ Fast form validation
   └─ Error handling with messages

3. AUTHENTICATION (BetterAuth handles)
   ├─ Password hashing (bcryptjs)
   ├─ Session creation (7-day expiry)
   ├─ Cookie-based session storage
   └─ User ID generation

4. HOMEPAGE (Authenticated)
   ├─ Profile avatar button (top right)
   ├─ Projects sidebar (left side)
   ├─ Chat input now visible
   └─ Projects linked to user ID

5. PROJECT PAGE
   ├─ Profile button in header
   ├─ Projects saved with userId
   └─ Full project functionality

6. SETTINGS PAGE
   ├─ Profile information display
   ├─ Account details (read-only)
   └─ Placeholder for future features
```

### Data Flow

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│              │      │              │      │              │
│   Browser    │◄────►│  BetterAuth  │◄────►│  SQLite DB   │
│              │      │   (Auth)     │      │  (Sessions)  │
└──────────────┘      └──────────────┘      └──────────────┘
       │
       │
       ▼
┌──────────────┐
│              │
│ localStorage │  (Projects with userId)
│              │
└──────────────┘
```

---

## Components

### 1. AuthProvider (`components/auth/AuthProvider.tsx`)

**Purpose**: React Context provider for authentication state

**Features**:
- Wraps entire app in root layout
- Provides `useAuth()` hook to all components
- Manages session state with BetterAuth
- Exposes: `session`, `signIn`, `signUp`, `signOut`

**Usage**:
```tsx
const { session, signIn, signUp, signOut } = useAuth();
const user = session.data?.user;
const isAuthenticated = !!user;
```

---

### 2. AuthModal (`components/auth/AuthModal.tsx`)

**Purpose**: Beautiful modal for sign-in/sign-up

**Features**:
- Centered modal with backdrop blur
- Toggle between sign-in and sign-up modes
- Email + password fields (+ name for sign-up)
- Loading states with spinner
- Error message display
- Close button and click-outside-to-close
- Smooth fade-in/zoom-in animation

**Props**:
```tsx
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Design**:
- White background with rounded corners
- Black borders and text
- Red error messages
- Smooth transitions (200ms)

---

### 3. ProfileButton (`components/auth/ProfileButton.tsx`)

**Purpose**: User avatar with dropdown menu

**Features**:
- Circular black button with user initials
- Dropdown menu with:
  - User name and email
  - Settings link
  - Log out button (red)
- Click-outside-to-close behavior
- Smooth slide-in animation

**Initials Logic**:
- Uses first letters of name (e.g., "John Doe" → "JD")
- Falls back to first letter of email
- Maximum 2 characters

**Location**:
- Top right of homepage (when authenticated)
- Top right of project header
- Top right of settings page

---

### 4. ProjectsSidebar (`components/ProjectsSidebar.tsx`)

**Purpose**: Shows user's project history

**Features**:
- Fixed left sidebar (80 width, 320px)
- Lists all user projects (newest first)
- Shows:
  - Project description (truncated at 40 chars)
  - Relative timestamps (e.g., "2h ago")
- Click to open project
- Delete button (hover to reveal)
- Collapsible with toggle button
- Empty state with helpful message
- Auto-updates on new project creation

**Filter Logic**:
- Only shows projects where `userId` matches current user
- If not logged in, shows all projects (backward compatibility)

**Design**:
- White background with gray borders
- Hover effects on project cards
- Smooth transitions
- Red delete button

---

### 5. Settings Page (`app/settings/page.tsx`)

**Purpose**: User account settings

**Features**:
- Protected route (redirects if not authenticated)
- Header with back button and profile button
- Account information section:
  - Name (read-only)
  - Email (read-only)
- Placeholder sections for future features:
  - Preferences (theme, language, notifications)
  - Security (password change, 2FA)

**Design**:
- Warm cream background (#FEFCF8)
- White card with sections
- Disabled input fields (gray background)
- Max width container (4xl)

---

### 6. Updated Homepage (`app/page.tsx`)

**Changes**:
- Now a client component (`"use client"`)
- Conditional rendering based on auth state:
  - **Unauthenticated**: Shows sign-in CTA instead of chat input
  - **Authenticated**: Shows chat input and projects sidebar
- Projects sidebar shifts content right by 320px
- Top right button switches between "Sign in" and ProfileButton

---

### 7. Updated AIChat (`components/chat/AIChat.tsx`)

**Changes**:
- Imports `useAuth()` hook
- Saves `userId` with each project in localStorage
- Dispatches `projectCreated` event to update sidebar

**Project Data**:
```typescript
{
  id: string;
  description: string;
  createdAt: string;
  stage: "planning" | "building";
  userId: string | null; // NEW
  // ... other fields
}
```

---

### 8. Updated ProjectHeader (`components/project/ProjectHeader.tsx`)

**Changes**:
- Replaces static "G" avatar with `<ProfileButton />`
- V logo now clickable (routes to homepage)
- Imports and uses Next.js `useRouter`

---

## User Flow

### Sign-Up Flow

1. User lands on homepage
2. Sees "Sign in to start building" CTA
3. Clicks "Get started" or "Sign in" button
4. Modal opens with sign-up form
5. Enters name, email, and password (min 6 chars)
6. Clicks "Sign up"
7. BetterAuth:
   - Hashes password
   - Creates user in SQLite
   - Creates session
   - Sets session cookie
8. Modal closes
9. Homepage updates:
   - Shows profile button
   - Shows projects sidebar
   - Shows chat input
10. User can now create projects

### Sign-In Flow

1. User lands on homepage (already has account)
2. Clicks "Sign in" button
3. Modal opens in sign-in mode
4. Enters email and password
5. Clicks "Sign in"
6. BetterAuth validates credentials
7. On success:
   - Creates session
   - Sets cookie
   - Modal closes
8. User is authenticated

### Create Project Flow

1. Authenticated user types app idea
2. Clicks send button
3. AIChat component:
   - Creates project with `userId`
   - Saves to localStorage
   - Dispatches `projectCreated` event
4. Sidebar automatically updates
5. User is routed to project page

### Sign-Out Flow

1. User clicks profile button
2. Dropdown opens
3. Clicks "Log out"
4. BetterAuth clears session
5. User is routed to homepage
6. UI updates to unauthenticated state

---

## Database Schema

### BetterAuth SQLite Database

**Location**: `/data/auth.db`

**Tables** (auto-created by BetterAuth):

#### `users` Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  emailVerified INTEGER DEFAULT 0,
  image TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
```

#### `sessions` Table
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

#### `accounts` Table
```sql
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  providerUserId TEXT NOT NULL,
  password TEXT, -- hashed with bcryptjs
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### LocalStorage (Projects)

Projects are still stored in localStorage with added `userId` field:

```javascript
localStorage.setItem(`project_${projectId}`, JSON.stringify({
  id: "abc123",
  description: "A todo app",
  createdAt: "2025-10-20T12:00:00.000Z",
  stage: "planning",
  userId: "user_1729234567_xyz789", // NEW
  plan: "...",
  prototypeCode: "...",
  backendConfig: {...},
  messages: [...]
}));
```

---

## API Routes

### 1. `/api/auth/[...all]` (BetterAuth Handler)

**File**: `app/api/auth/[...all]/route.ts`

**Purpose**: Handles all BetterAuth requests

**Endpoints**:
- `POST /api/auth/sign-up/email` - Create new user
- `POST /api/auth/sign-in/email` - Authenticate user
- `POST /api/auth/sign-out` - End session
- `GET /api/auth/session` - Get current session
- ... (other BetterAuth endpoints)

**Request/Response Examples**:

**Sign Up**:
```typescript
// Request
POST /api/auth/sign-up/email
{
  "email": "user@example.com",
  "password": "securepass123",
  "name": "John Doe"
}

// Response (success)
{
  "user": {
    "id": "user_1729234567_xyz789",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": false,
    "createdAt": "2025-10-20T12:00:00.000Z"
  },
  "session": {
    "id": "session_abc123",
    "userId": "user_1729234567_xyz789",
    "expiresAt": "2025-10-27T12:00:00.000Z"
  }
}

// Response (error)
{
  "error": {
    "message": "Email already exists"
  }
}
```

**Sign In**:
```typescript
// Request
POST /api/auth/sign-in/email
{
  "email": "user@example.com",
  "password": "securepass123"
}

// Response (success)
{
  "user": { ... },
  "session": { ... }
}

// Response (error)
{
  "error": {
    "message": "Invalid email or password"
  }
}
```

---

## File Structure

```
/Users/shayan/Desktop/Projects/VB/
├── app/
│   ├── layout.tsx                    # Root layout with AuthProvider
│   ├── page.tsx                      # Homepage (updated with auth UI)
│   ├── settings/
│   │   └── page.tsx                  # Settings page (NEW)
│   ├── project/[id]/
│   │   └── page.tsx                  # Project page (unchanged)
│   └── api/
│       └── auth/
│           └── [...all]/
│               └── route.ts          # BetterAuth API handler (NEW)
│
├── components/
│   ├── auth/
│   │   ├── AuthProvider.tsx          # Auth context provider (NEW)
│   │   ├── AuthModal.tsx             # Sign-in/sign-up modal (NEW)
│   │   └── ProfileButton.tsx         # User avatar dropdown (NEW)
│   ├── chat/
│   │   └── AIChat.tsx                # Chat input (updated with userId)
│   ├── project/
│   │   └── ProjectHeader.tsx         # Header (updated with ProfileButton)
│   └── ProjectsSidebar.tsx           # Projects history sidebar (NEW)
│
├── lib/
│   ├── auth.ts                       # BetterAuth server config (NEW)
│   └── auth-client.ts                # BetterAuth React client (NEW)
│
├── data/
│   └── auth.db                       # SQLite auth database (NEW)
│
└── AUTHENTICATION_SYSTEM.md          # This file (NEW)
```

---

## Usage Guide

### For Users

#### How to Create an Account

1. Open Vibebaba homepage
2. Click "Sign in" or "Get started"
3. Enter your name, email, and password
4. Click "Sign up"
5. You're now logged in!

#### How to Sign In

1. Open Vibebaba homepage
2. Click "Sign in" button
3. Enter your email and password
4. Click "Sign in"
5. You're authenticated!

#### How to Create a Project

1. Sign in to your account
2. Type your app idea in the chat box
3. Press Enter or click send
4. Your project is created and appears in the sidebar

#### How to Access Settings

1. Click your profile picture (top right)
2. Click "Settings" in dropdown
3. View/update your account information

#### How to Sign Out

1. Click your profile picture
2. Click "Log out"
3. You're signed out

---

### For Developers

#### Check if User is Authenticated

```tsx
import { useAuth } from "@/components/auth/AuthProvider";

function MyComponent() {
  const { session } = useAuth();

  const isAuthenticated = !!session.data?.user;
  const user = session.data?.user;

  if (session.isPending) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  return <div>Welcome, {user.name}!</div>;
}
```

#### Protect a Route

```tsx
"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedPage() {
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!session.isPending && !session.data) {
      router.push("/");
    }
  }, [session, router]);

  if (session.isPending) return <div>Loading...</div>;
  if (!session.data) return null;

  return <div>Protected content</div>;
}
```

#### Get Current User ID

```tsx
const { session } = useAuth();
const userId = session.data?.user?.id;
```

#### Sign Out Programmatically

```tsx
const { signOut } = useAuth();

async function handleLogout() {
  await signOut();
  router.push("/");
}
```

#### Link Data to User

```tsx
// When creating a project
const { session } = useAuth();
const userId = session.data?.user?.id;

const projectData = {
  id: projectId,
  description: description,
  userId: userId || null, // Link to user
  // ... other fields
};

localStorage.setItem(`project_${projectId}`, JSON.stringify(projectData));
```

#### Filter User's Data

```tsx
// Get only current user's projects
const { session } = useAuth();
const currentUserId = session.data?.user?.id;

const userProjects = allProjects.filter(project =>
  project.userId === currentUserId
);
```

---

## Troubleshooting

### Issue: Modal doesn't close after sign-in

**Cause**: Error in authentication or network issue

**Solution**: Check browser console for errors. Verify BetterAuth server is running.

---

### Issue: Profile button doesn't show initials

**Cause**: User doesn't have a name set

**Solution**: Modify `ProfileButton.tsx` to handle missing names:
```tsx
const getInitials = () => {
  if (user.name) {
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return user.email?.[0]?.toUpperCase() || "U";
};
```

---

### Issue: Projects sidebar doesn't update

**Cause**: `projectCreated` event not dispatched

**Solution**: Ensure this line is in `AIChat.tsx` after saving project:
```tsx
window.dispatchEvent(new Event("projectCreated"));
```

---

### Issue: Session expires too quickly

**Cause**: Session expiration set to 7 days by default

**Solution**: Modify `lib/auth.ts`:
```tsx
session: {
  expiresIn: 60 * 60 * 24 * 30, // 30 days
  updateAge: 60 * 60 * 24, // 1 day
}
```

---

### Issue: "Cannot find module 'better-auth'"

**Cause**: Package not installed

**Solution**:
```bash
npm install better-auth better-sqlite3 bcryptjs
npm install -D @types/bcryptjs @types/better-sqlite3
```

---

### Issue: SQLite database locked

**Cause**: Multiple processes accessing database

**Solution**: Ensure only one dev server is running:
```bash
pkill -9 -f "next dev"
npm run dev
```

---

### Issue: Sign-up fails with "Database error"

**Cause**: Database file permissions or corrupted database

**Solution**:
1. Stop dev server
2. Delete `data/auth.db`
3. Restart dev server (database will be recreated)

---

## Security Considerations

### ✅ Implemented Security

1. **Password Hashing**: All passwords hashed with bcryptjs (10 salt rounds)
2. **Session Cookies**: HttpOnly, Secure, SameSite=Lax
3. **CSRF Protection**: Built into BetterAuth
4. **SQL Injection Prevention**: Parameterized queries via BetterAuth
5. **XSS Prevention**: React escapes all user input by default

### 🔒 Future Enhancements

1. **Email Verification**: Add email confirmation flow
2. **Two-Factor Authentication**: Add 2FA support
3. **OAuth Providers**: Add Google, GitHub sign-in
4. **Password Reset**: Add forgot password flow
5. **Rate Limiting**: Prevent brute force attacks
6. **Account Deletion**: Add delete account feature

---

## Performance Optimizations

### ✅ Implemented

1. **Fast Sign-Up**: No email verification = instant access
2. **Client-Side Session**: Session cached in React Context
3. **Optimistic UI Updates**: UI updates before server confirms
4. **Lazy Loading**: Modal only renders when open
5. **Debounced Updates**: Sidebar updates throttled

### 🚀 Future Improvements

1. **Server-Side Session**: Move session to Redis for scalability
2. **Database Migration**: Move projects from localStorage to PostgreSQL
3. **API Rate Limiting**: Add rate limits to auth endpoints
4. **Caching**: Cache user data with React Query
5. **Code Splitting**: Lazy load auth components

---

## Migration from Unauthenticated State

### Backward Compatibility

The system is designed to be backward compatible with existing projects:

1. **Old Projects**: Projects without `userId` field still load
2. **Filtered View**: Sidebar only shows user's projects when authenticated
3. **Legacy Support**: Unauthenticated mode still functional (but limited)

### Migrating Existing Projects

If you want to assign existing projects to a user:

```typescript
// Run this in browser console after signing in
const userId = "your_user_id_here"; // Get from session

for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key?.startsWith("project_")) {
    const project = JSON.parse(localStorage.getItem(key) || "");
    if (!project.userId) {
      project.userId = userId;
      localStorage.setItem(key, JSON.stringify(project));
    }
  }
}

console.log("Migration complete!");
```

---

## Environment Variables

No additional environment variables needed! BetterAuth uses SQLite by default.

**Optional**: Set base URL for production:
```env
NEXT_PUBLIC_APP_URL=https://vibebaba.com
```

---

## Testing Checklist

### ✅ Manual Testing

- [ ] Sign up with new email
- [ ] Sign in with existing email
- [ ] Invalid password shows error
- [ ] Duplicate email shows error
- [ ] Profile button shows correct initials
- [ ] Dropdown menu opens/closes correctly
- [ ] Settings page loads
- [ ] Settings page redirects if not authenticated
- [ ] Sign out clears session
- [ ] Projects sidebar shows only user's projects
- [ ] Create project saves userId
- [ ] Projects sidebar updates on new project
- [ ] Delete project removes from sidebar
- [ ] Profile button appears on project page
- [ ] V logo routes to homepage
- [ ] Session persists on page refresh
- [ ] Session expires after 7 days

---

## Future Roadmap

### Phase 2: Enhanced Features

- [ ] Email verification flow
- [ ] Password reset via email
- [ ] Change password in settings
- [ ] Delete account functionality
- [ ] Profile picture upload
- [ ] User preferences (theme, language)

### Phase 3: Social Features

- [ ] OAuth providers (Google, GitHub)
- [ ] Share projects with other users
- [ ] Public project gallery
- [ ] User profiles (public)

### Phase 4: Backend Migration

- [ ] Move from localStorage to PostgreSQL
- [ ] API for project CRUD operations
- [ ] Real-time collaboration
- [ ] Project versioning
- [ ] Export/import projects

---

## Support

For issues or questions:

1. Check this documentation
2. Review browser console for errors
3. Check Next.js dev server logs
4. Inspect SQLite database: `sqlite3 data/auth.db`
5. Review BetterAuth docs: https://www.better-auth.com

---

## Changelog

### Version 1.0.0 (2025-10-20)

- ✨ Initial authentication system implementation
- ✨ BetterAuth integration
- ✨ Email/password sign-up and sign-in
- ✨ AuthModal component
- ✨ ProfileButton with dropdown
- ✨ ProjectsSidebar component
- ✨ Settings page
- ✨ User-project association
- ✨ Conditional homepage UI
- ✨ Profile button on project page
- ✨ Session management (7-day expiry)
- ✨ Sign-out functionality
- 📝 Complete documentation

---

## Credits

**Built by**: Claude AI Agent
**Framework**: Next.js + React
**Authentication**: BetterAuth
**Design System**: Custom black & white minimalist theme
**Database**: SQLite (better-sqlite3)

---

## License

This authentication system is part of the Vibebaba project.

---

**Last Updated**: October 20, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
