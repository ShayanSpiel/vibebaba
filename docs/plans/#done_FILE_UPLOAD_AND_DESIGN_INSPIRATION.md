# File Upload System + Design Inspiration Feature
## Comprehensive Integrated Implementation Plan

**Status**: Planning Phase - Ready for Implementation (UPDATED Jan 2025)
**Priority**: High
**Estimated Effort**: 32-33 hours (~4 days full-time) ⬅️ **REDUCED from 37.5-41.5 hours**
**MVP**: 16 hours (~2 days) ⬅️ **REDUCED from 18.5 hours**

**UI/UX Updates (Jan 2025):**
- ✅ Files UI integrated into "Files" tab (renamed from "Codes")
- ✅ Upload icon with dropdown menu (upload new or select existing)
- ✅ Golden gradient progress animation on upload icon
- ✅ Brand-aligned design (rounded-xl, golden gradient, Lucide icons)

---

## ⚡ RECENT UPDATES (January 2025)

**Architectural Simplification:**
- ✅ Integrated file intent detection with existing `lib/input-detection/analyze-input.ts`
- ✅ Removed separate `file-intent-detector.ts` service (no duplication)
- ✅ Changed from modal-based to chat-based intent selection
- ✅ Leverages existing conversation context and analysis infrastructure

**Results:**
- **Time Savings: 5.5-8.5 hours** (15-20% faster)
- **Code Reduction: -3 files, -290 lines of code**
- **Better UX**: Natural conversational flow (no modal interruption)
- **Simpler Architecture**: Single source of truth for all intent detection

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Feature Relationship Analysis](#feature-relationship-analysis)
3. [Architecture Overview](#architecture-overview)
4. [User Experience Flows](#user-experience-flows)
5. [screenshot-to-code Evaluation](#screenshot-to-code-evaluation)
6. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
7. [Complete File Change List](#complete-file-change-list)
8. [Storage Strategy](#storage-strategy)
9. [Risk Assessment](#risk-assessment)
10. [Cost & Performance Analysis](#cost-performance-analysis)
11. [Success Metrics](#success-metrics)
12. [Recommendations](#recommendations)

---

## Executive Summary

This document integrates two complementary features into a unified implementation plan:

1. **File Upload System**: Upload and store assets (logos, images, PDFs) for inclusion in generated apps
2. **Design Inspiration Feature**: Extract design tokens (colors, fonts, patterns) from UI screenshots

### Key Decisions

✅ **Unified Upload Infrastructure**: Single upload system with purpose detection
✅ **Complementary Features**: Different purposes, shared infrastructure
✅ **PocketBase Storage**: Single `uploaded_files` collection for both types
✅ **Design Inspiration as UX Sub-Node**: Enhances existing workflow (as documented)
✅ **Non-Blocking Architecture**: Never crashes workflow on failure
❌ **NO screenshot-to-code Integration**: Incompatible with our architecture (see analysis)

### Current State

**File Upload System**: NOT IMPLEMENTED
- No `uploaded_files` collection exists
- No upload UI in ChatPanelClaude.tsx
- No file storage mechanism

**Design Inspiration Feature**: DOCUMENTED BUT NOT IMPLEMENTED
- Comprehensive plan exists at `docs/plans/#notDone_DESIGN_INSPIRATION_FEATURE.md`
- Would add `state.referenceImage` and `state.referenceUrl`
- Sub-node within UX Node architecture
- Gemini 2.0 Flash for vision analysis

---

## Feature Relationship Analysis

### These are COMPLEMENTARY Features (Not Duplicates)

```
┌─────────────────────────────────────────────────────────────┐
│                    USER UPLOADS IMAGE                       │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐         ┌──────────────────┐
│ FILE UPLOAD   │         │ DESIGN           │
│ SYSTEM        │         │ INSPIRATION      │
├───────────────┤         ├──────────────────┤
│ PURPOSE:      │         │ PURPOSE:         │
│ Store assets  │         │ Extract design   │
│ for inclusion │         │ tokens for UX    │
│               │         │                  │
│ USE CASE:     │         │ USE CASE:        │
│ "Add this     │         │ "Make it look    │
│  logo to the  │         │  like this"      │
│  header"      │         │                  │
│               │         │                  │
│ STORAGE:      │         │ STORAGE:         │
│ Persistent    │         │ Temporary        │
│ PocketBase    │         │ (or cached)      │
│               │         │                  │
│ OUTPUT:       │         │ OUTPUT:          │
│ File URLs for │         │ Design tokens    │
│ code refs     │         │ (colors, fonts)  │
└───────────────┘         └──────────────────┘
```

### Example Scenarios

**Scenario 1: Upload Logo (File Upload System)**
```
User: "Add this logo to the header"
Uploads: company-logo.png
→ Purpose: asset
→ Stored in PocketBase
→ AI generates: <img src="/api/files/abc123" alt="Company Logo" />
→ Design inspiration: NOT triggered
```

**Scenario 2: Upload Design Reference (Design Inspiration)**
```
User: "Make it look like this"
Uploads: stripe-homepage.png
→ Purpose: design-reference
→ UX Node analyzes with Gemini Vision
→ Extracts: #635bff (purple), Inter font, gradient patterns
→ Applies to stylingConfig
→ File reference in code: NOT generated
```

**Scenario 3: Upload Both**
```
User: "Use this design style and add my logo"
Uploads: reference.png, logo.png
→ reference.png → design-reference → Vision analysis
→ logo.png → asset → Included in generated code
→ Both functions work independently
```

**Scenario 4: File with "Both" Purpose**
```
User uploads: brand-screenshot.png
Selects: "Both"
→ UX Node analyzes for colors/fonts
→ Frontend Node also includes image in app
→ Result: Inspired by screenshot + screenshot embedded
```

---

## Architecture Overview

### Unified Upload Infrastructure

**ONE UPLOAD BUTTON** with **PURPOSE DETECTION**

```typescript
// Unified upload system with dual purpose
interface UploadedFile {
  id: string;
  projectId: string;
  userId: string;
  fileName: string;
  fileUrl: string; // PocketBase URL
  fileType: 'image' | 'document' | 'video';
  purpose: 'asset' | 'design-reference' | 'both'; // KEY DIFFERENTIATOR
  uploadedAt: Date;

  // For design references only (cached analysis)
  designAnalysis?: {
    colors: ColorPalette;
    typography: Typography;
    patterns: string[];
    quality: number;
  };
}
```

### State Management Strategy

**UNIFIED STATE** (Single source of truth)

```typescript
// In lib/langgraph/types.ts - AppGenState
export interface AppGenState {
  // ... existing fields ...

  // NEW: Unified file management
  uploadedFiles: UploadedFile[];  // All uploaded files

  // NEW: Design inspiration (processed from uploadedFiles)
  designInspiration?: DesignInspiration;
}
```

**Why unified?**
- ✅ Single source of truth
- ✅ Easier to implement "use uploaded image for inspiration" later
- ✅ Clean data flow: Upload → Store → Optionally Analyze
- ✅ No duplicate image storage
- ✅ Can switch file purpose after upload

### Complete Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 1: Upload & Store (File Upload System)                    │
├──────────────────────────────────────────────────────────────────┤
│ 1. User uploads file via ChatPanel                              │
│ 2. File sent to /api/files/upload                               │
│ 3. Stored in PocketBase collection: uploaded_files              │
│ 4. File URL returned to frontend                                │
│ 5. Added to state.uploadedFiles[]                               │
│ 6. AI can reference by filename in generated code               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 2: Analysis (Design Inspiration - Optional)               │
├──────────────────────────────────────────────────────────────────┤
│ 7. UX Node checks: any files with purpose='design-reference'?   │
│ 8. If YES: Fetch file, pass to Gemini Vision                    │
│ 9. Extract design tokens (colors, fonts, patterns)              │
│ 10. Store in state.designInspiration                            │
│ 11. Merge with AI-generated styling in UX Node                  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ PHASE 3: Code Generation (Frontend Node)                        │
├──────────────────────────────────────────────────────────────────┤
│ 12. Frontend Node receives:                                     │
│     - state.uploadedFiles (asset URLs for <img src=...>)        │
│     - state.designInspiration (colors/fonts for CSS)            │
│ 13. Generates code with correct references                      │
└──────────────────────────────────────────────────────────────────┘
```

### Workflow Integration

**Enhanced LangGraph Workflow:**

```
Founder → PM → UX (ENHANCED) → Backend → Frontend (ENHANCED) → QA → DevOps

UX Node Enhancement:
  1. Design System Selection (existing)
  2. AI Styling Extraction (existing)
  3. Design Inspiration Analysis (NEW)
     ├─ Check trigger conditions
     ├─ If triggered: Analyze with Gemini Vision
     ├─ Extract: colors, fonts, patterns
     ├─ Validate & format tokens
     └─ Merge with AI styling

Frontend Node Enhancement:
  1. File Planning (existing)
  2. File References (NEW)
     ├─ Include uploadedFiles (purpose='asset') in context
     └─ Generate code with file URLs
```

---

## User Experience Flows

### Upload Intent Detection

**UPDATED APPROACH: Chat-Based Intent Selection (Recommended)**

The system will detect intent from natural language in the chat message, not via modal popup.

```
User Flow:
┌─────────────────────────────────────┐
│  Type message...                    │
│  "Use this as my logo"              │
│                                     │
│  [📎 Upload File]  [Send]          │
└─────────────────────────────────────┘

1. User uploads file (logo.png)
2. User types: "use this as my logo" in chatbox
3. Input detection analyzes message + file context
4. Detects intent: "asset"
5. File stored with purpose='asset'
6. No modal interruption
```

**Why chat-based approach?**
- ✅ Natural conversation flow (fits conversational editor paradigm)
- ✅ No UI interruption (no modal blocking workflow)
- ✅ Leverages existing chat interface (no new UI components)
- ✅ Supports complex instructions ("use this logo but make background transparent")
- ✅ Can handle multiple files with different intents in one message
- ✅ More powerful than modal (e.g., "use colors from this but don't include the image")

**Common Intent Detection Patterns:**

```typescript
// Asset keywords
"use this as my logo"
"add this image to the header"
"include this file in the app"
"use this icon for the button"

// Design inspiration keywords
"make it look like this"
"use this style"
"extract colors from this"
"design inspiration from this screenshot"

// Both
"use this design and include the logo"
"extract colors and add the image"
```

**Fallback for Ambiguous Cases:**

If intent cannot be determined from the message:
```
Assistant: "I see you uploaded a file. Would you like to use it as an asset
(included in the app) or for design inspiration (extract colors/fonts)?
You can say something like 'use as logo' or 'extract colors'."
```

**Alternative Approach (Original Plan): Modal Intent Selector**

```
After upload, show intent selector modal:
┌─────────────────────────────────────┐
│ ✓ logo.png uploaded                 │
│                                     │
│ What's this for?                    │
│ ○ Use as asset in the app          │
│ ● Use for design inspiration        │
│ ○ Both                             │
│                                     │
│ [Confirm]                           │
└─────────────────────────────────────┘
```

**Why modal approach is less preferred:**
- ❌ Interrupts workflow (blocks UI)
- ❌ Extra click required (slower)
- ❌ Less natural for conversational editor
- ❌ Doesn't leverage existing chat context
- ✅ But simpler to implement (~2 hours vs ~4-5 hours)

**Implementation Comparison:**

| Aspect | Chat-Based | Modal-Based |
|--------|-----------|-------------|
| Implementation Time | ~4-5 hours | ~2 hours |
| User Experience | Natural, conversational | Explicit, clear |
| Complexity | Medium-high (NLP) | Low (radio buttons) |
| Flexibility | High (supports nuanced instructions) | Low (3 fixed options) |
| Error Handling | Clarification in chat | Form validation |
| Code Changes | 5-6 files | 2 files |

**Decision: Implement chat-based approach** for better UX alignment with conversational editor paradigm.

### Complete User Flows

**Flow 1: Upload Logo (Asset)**
```
1. User types: "Add this logo to the header"
2. Clicks upload button
3. Selects: company-logo.png
4. Intent selector appears
5. User selects: "Use as asset in the app"
6. File stored with purpose='asset'
7. Design inspiration NOT triggered
8. Frontend Node generates:
   <img src="/api/files/abc123" alt="Company Logo" />
9. Logo appears in deployed app
```

**Flow 2: Upload Design Reference**
```
1. User types: "Make it look like this"
2. Clicks upload button
3. Selects: stripe-homepage.png
4. Intent selector appears
5. User selects: "Use for design inspiration"
6. File stored with purpose='design-reference'
7. UX Node triggers Gemini Vision analysis
8. Extracted: #635bff (purple), Inter font, gradient patterns
9. Merged into stylingConfig
10. File NOT referenced in generated code
11. App deployed with Stripe-inspired colors/fonts
```

**Flow 3: Upload Both Types**
```
1. User types: "Use this design style and add my logo"
2. Uploads: reference.png (first)
3. Selects: "Design inspiration"
4. Uploads: logo.png (second)
5. Selects: "Asset"
6. UX Node analyzes reference.png
7. Frontend Node includes logo.png
8. App deployed with inspired design + logo
```

**Flow 4: Select "Both"**
```
1. User uploads: brand-screenshot.png
2. Selects: "Both"
3. UX Node analyzes for design tokens
4. Frontend Node also includes image as asset
5. Result: Colors/fonts inspired by screenshot + screenshot embedded
```

### UI Components

**UPDATED UI/UX DESIGN:**

**1. Files Tab (Renamed from "Codes"):**
The uploaded files UI will be integrated into the project sidebar in a renamed "Files" tab:

```tsx
// In ProjectSidebar - Files Tab
<div className="flex flex-col h-full">
  {/* Generated files section (top) */}
  <div className="flex-1 overflow-auto p-3">
    <h4 className="text-sm font-semibold mb-2 text-text-primary">Generated Files</h4>
    {/* Existing code files list */}
  </div>

  {/* Uploaded files section (bottom) */}
  <div className="border-t border-border-light p-3 bg-background-subtle">
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
        <Upload className="w-4 h-4 text-amber-400" />
        Uploaded Files
      </h4>
      <span className="text-xs text-text-tertiary">{uploadedFiles.length}</span>
    </div>

    {uploadedFiles.length === 0 ? (
      <p className="text-xs text-text-tertiary text-center py-4">
        No files uploaded yet
      </p>
    ) : (
      uploadedFiles.map(file => (
        <div
          key={file.id}
          className="flex items-center gap-2 p-2 rounded-xl hover:bg-background-base transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-brand-br flex items-center justify-center">
            {file.fileType.startsWith('image/') ? (
              <FileImage className="w-4 h-4 text-white" />
            ) : (
              <FilePdf className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate text-text-primary">{file.fileName}</div>
            <div className="text-xs text-text-tertiary">
              {file.purpose === 'asset' ? '📦 Asset' :
               file.purpose === 'design-reference' ? '🎨 Design' : '📦🎨 Both'}
            </div>
          </div>
          <button
            onClick={() => deleteFile(file.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))
    )}
  </div>
</div>
```

**2. Chatbox Upload Button with Dropdown Menu:**

```tsx
// Upload button with dropdown menu in ChatPanel
<Dropdown
  menu={{
    items: [
      {
        key: 'upload',
        label: 'Upload New File',
        icon: <Upload className="w-4 h-4" />,
        onClick: () => fileInputRef.current?.click()
      },
      {
        key: 'select',
        label: 'Select from Files',
        icon: <FileSearch className="w-4 h-4" />,
        onClick: () => setShowFileSelector(true),
        disabled: uploadedFiles.length === 0
      }
    ]
  }}
  placement="topRight"
>
  <button
    className={`
      relative p-2 rounded-lg transition-all
      ${uploading
        ? 'bg-gradient-brand-br animate-pulse'
        : 'text-text-secondary hover:text-amber-400 hover:bg-background-subtle'
      }
    `}
    disabled={uploading}
  >
    {/* Upload icon with golden gradient progress */}
    <div className="relative w-5 h-5">
      {uploading ? (
        <>
          {/* Background icon (grayed out) */}
          <Upload className="w-5 h-5 text-gray-400 absolute inset-0" />

          {/* Golden gradient progress fill (fills from bottom to top) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              clipPath: `inset(${100 - uploadProgress}% 0 0 0)`
            }}
          >
            <Upload className="w-5 h-5 text-transparent bg-gradient-brand-br bg-clip-text"
                    style={{ WebkitBackgroundClip: 'text' }} />
          </div>
        </>
      ) : (
        <Upload className="w-5 h-5" />
      )}
    </div>
  </button>
</Dropdown>

<input
  ref={fileInputRef}
  type="file"
  multiple
  accept="image/*,.pdf"
  onChange={handleFileUpload}
  className="hidden"
/>
```

**3. File Selector Modal (for selecting from existing files):**

```tsx
<Modal
  title="Select from Uploaded Files"
  open={showFileSelector}
  onCancel={() => setShowFileSelector(false)}
  footer={null}
  className="rounded-2xl"
>
  <div className="space-y-2 max-h-96 overflow-auto">
    {uploadedFiles.map(file => (
      <div
        key={file.id}
        onClick={() => handleSelectFile(file)}
        className="
          flex items-center gap-3 p-3 rounded-xl
          border border-border-light
          hover:border-amber-400 hover:bg-background-subtle
          cursor-pointer transition-all
          group
        "
      >
        <div className="w-10 h-10 rounded-lg bg-gradient-brand-br flex items-center justify-center">
          {file.fileType.startsWith('image/') ? (
            <FileImage className="w-5 h-5 text-white" />
          ) : (
            <FilePdf className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-text-primary">{file.fileName}</div>
          <div className="text-xs text-text-tertiary">
            {file.purpose === 'asset' ? '📦 Asset' : '🎨 Design Reference'}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-amber-400" />
      </div>
    ))}
  </div>
</Modal>
```

**4. Golden Gradient Progress Animation:**

The upload icon will feature a gradient fill animation that fills from bottom to top:

```tsx
// CSS for golden gradient progress (in component or globals.css)
@keyframes fillGradient {
  from { clip-path: inset(100% 0 0 0); }
  to { clip-path: inset(0% 0 0 0); }
}

.upload-progress-icon {
  position: relative;
  animation: fillGradient 2s ease-in-out;
  background: linear-gradient(to bottom, #FCD34D, #D97706);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## screenshot-to-code Evaluation

### What is screenshot-to-code?

**Repository:** https://github.com/abi/screenshot-to-code (70.8k+ stars)

**How it works:**
```
Screenshot → Vision Model (GPT-4V/Claude) → Complete HTML/React Code
```

**Example:**
- Input: Screenshot of Stripe homepage
- Output: Full React component with all elements, styling, layout

### Comparison with Our Design Inspiration

| Feature | screenshot-to-code | Our Design Inspiration |
|---------|-------------------|------------------------|
| **Input** | UI Screenshot | UI Screenshot |
| **Output** | Complete code (HTML/React) | Design tokens (JSON) |
| **Process** | Direct screenshot → code | Screenshot → tokens → our pipeline → code |
| **Control** | Low (generates what it sees) | High (AI customizes with user requirements) |
| **Workflow** | Bypasses our entire pipeline | Enhances existing UX Node |
| **Customization** | Hard (edit generated code) | Easy (tokens merge with user description) |
| **Backend** | No database integration | Integrated with PocketBase |
| **Design Systems** | Generic HTML/CSS | Shadcn, Ant Design, Tailwind |
| **Use Case** | Clone existing UI exactly | Extract style, apply to custom app |

### Integration Feasibility Analysis

**Option 1: Replace our pipeline (NOT RECOMMENDED)**
```
User input + Screenshot → screenshot-to-code → Done
```
❌ **Why NOT:**
- Bypasses PM Node (no business logic)
- Bypasses Backend Node (no database integration)
- Bypasses QA Node (no validation)
- Loses our custom features (design systems, Shadcn, PocketBase)
- Would be a completely different product

**Option 2: Use as UX Node alternative (POSSIBLE BUT LIMITED)**
```
PM Node → screenshot-to-code generates UI → Backend Node adds API layer → QA
```
❌ **Why LIMITED:**
- Still bypasses our styling system
- No Tailwind variable support
- No design system integration
- Inconsistent with our architecture

**Option 3: Hybrid approach (INTERESTING BUT COMPLEX)**
```
Design Inspiration: Extract tokens from screenshot
screenshot-to-code: Generate component structure
Merge: Apply our tokens to their structure
```
❌ **Why COMPLEX:**
- Two AI calls per screenshot (2x cost)
- Duplicate work (both analyzing same image)
- Hard to merge outputs cleanly
- Gemini ($0.00035) + GPT-4V ($0.0063) = $0.00665 per analysis

### RECOMMENDATION: DO NOT INTEGRATE screenshot-to-code

**Why Design Inspiration is better for VibeBaba:**

1. **Follows our architecture**: Fits cleanly into UX Node
2. **Maintains control**: AI still generates code our way
3. **Flexibility**: User can say "Stripe colors but dashboard layout"
4. **Cost**: 1 Gemini call ($0.00035) vs 1 GPT-4V call ($0.0063) = **94% cheaper**
5. **Integration**: Works with our design systems (Shadcn, Ant Design)
6. **Customization**: Merges with user requirements, not just clones
7. **Backend**: Integrates with PocketBase and our API layer

**When screenshot-to-code makes sense:**
- Rapid prototyping tool (not production)
- Cloning exact UIs (we customize)
- Standalone product (we're a platform)

**Our differentiation:**
```
screenshot-to-code: "Copy this UI exactly"
VibeBaba Design Inspiration: "Extract this style, apply to MY requirements"
```

**Example:**
```
User: "Build a task management app with Stripe's color scheme"

screenshot-to-code approach:
→ Would generate Stripe's homepage code
→ User has to manually adapt for task management
→ Loses custom features

Our approach:
→ Extract #635bff (purple), Inter font from Stripe
→ Generate task management app with those colors/fonts
→ Custom layout, PocketBase integration, our design system
→ User gets what they asked for
```

---

## Phase-by-Phase Implementation

### Phase 1: Core File Upload Infrastructure ⭐ CRITICAL

**Goal:** Users can upload files, files are stored and accessible

**Duration:** 6.5 hours (~1 day) - REDUCED from 9 hours

**Time Savings:** 2.5 hours saved by integrating with existing input detection

#### Tasks

**1. Database Schema (1 hour)**

Create PocketBase `uploaded_files` collection:

```typescript
// Migration: pb_migrations/001_create_uploaded_files.js
{
  name: "uploaded_files",
  schema: [
    {
      name: "projectId",
      type: "relation",
      required: true,
      options: {
        collectionId: "projects",
        cascadeDelete: true
      }
    },
    {
      name: "userId",
      type: "relation",
      required: true,
      options: {
        collectionId: "users",
        cascadeDelete: false
      }
    },
    {
      name: "fileName",
      type: "text",
      required: true
    },
    {
      name: "fileType",
      type: "text",
      required: true
    },
    {
      name: "purpose",
      type: "select",
      required: true,
      options: {
        values: ["asset", "design-reference", "both"]
      }
    },
    {
      name: "file",
      type: "file",
      required: true,
      options: {
        maxSelect: 1,
        maxSize: 10485760, // 10MB
        mimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]
      }
    },
    {
      name: "designAnalysis",
      type: "json",
      required: false
    }
  ],
  indexes: [
    "CREATE INDEX idx_uploaded_files_project ON uploaded_files(projectId)",
    "CREATE INDEX idx_uploaded_files_user ON uploaded_files(userId)"
  ],
  listRule: "userId = @request.auth.id",
  viewRule: "userId = @request.auth.id",
  createRule: "userId = @request.auth.id",
  updateRule: "userId = @request.auth.id",
  deleteRule: "userId = @request.auth.id"
}
```

**2. API Endpoints (2 hours)**

**File Upload Endpoint:**

```typescript
// app/api/files/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const purpose = formData.get('purpose') as string;
    const userId = formData.get('userId') as string;

    // Validate
    if (!file || !projectId || !purpose) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large (max 10MB)' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Upload to PocketBase
    const pb = new PocketBase(process.env.POCKETBASE_URL);
    const record = await pb.collection('uploaded_files').create({
      projectId,
      userId,
      fileName: file.name,
      fileType: file.type,
      purpose,
      file: file
    });

    return NextResponse.json({
      id: record.id,
      fileName: record.fileName,
      fileUrl: pb.getFileUrl(record, record.file),
      purpose: record.purpose
    });

  } catch (error) {
    console.error('[File Upload] Error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
```

**File Retrieval Endpoint:**

```typescript
// app/api/files/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pb = new PocketBase(process.env.POCKETBASE_URL);
    const record = await pb.collection('uploaded_files').getOne(params.id);

    // Get file URL from PocketBase
    const fileUrl = pb.getFileUrl(record, record.file);

    // Redirect to PocketBase file URL
    return NextResponse.redirect(fileUrl);

  } catch (error) {
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pb = new PocketBase(process.env.POCKETBASE_URL);
    await pb.collection('uploaded_files').delete(params.id);

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    );
  }
}
```

**3. Frontend Upload UI (1.5 hours)** - REDUCED from 3 hours

**UPDATED: Chat-Based Intent Detection Implementation**

**File Upload Button Component (Simplified - No Modal):**

```typescript
// components/project/FileUploadButton.tsx
'use client';

import { useState, useRef } from 'react';
import { message } from 'antd';
import { PaperClipOutlined } from '@ant-design/icons';

interface FileUploadButtonProps {
  projectId: string;
  userId: string;
  onUploadComplete: (file: UploadedFile) => void;
}

export function FileUploadButton({ projectId, userId, onUploadComplete }: FileUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      formData.append('userId', userId);
      formData.append('purpose', 'pending'); // Will be determined from chat message

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const uploadedFile = await response.json();
      onUploadComplete(uploadedFile);
      message.success(`${file.name} uploaded - specify intent in your message`);

    } catch (error) {
      console.error('Upload error:', error);
      message.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="p-2 text-text-secondary hover:text-brand-primary disabled:opacity-50"
        title="Upload file"
      >
        <PaperClipOutlined className="text-lg" />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
}
```

**UPDATED: Integrate with Existing Input Detection (SIMPLIFIED)**

Instead of creating a separate service, enhance the existing input detection:

```typescript
// lib/input-detection/analyze-input.ts (MODIFY EXISTING FILE)

import type { UploadedFile } from '@/lib/langgraph/types';

// ADD to existing analyzeInput function
export async function analyzeInput(params: {
  message: string;
  uploadedFiles?: UploadedFile[];  // NEW PARAMETER
  conversationHistory?: Message[];
  // ... existing parameters
}) {
  // ... existing analysis logic ...

  // NEW: Detect file intents if files are uploaded
  let fileIntents: Record<string, FileIntent> = {};

  if (params.uploadedFiles && params.uploadedFiles.length > 0) {
    const pendingFiles = params.uploadedFiles.filter(f => f.purpose === 'pending');

    for (const file of pendingFiles) {
      fileIntents[file.id] = detectFileIntent(
        params.message,
        file.fileName,
        file.fileType,
        params.conversationHistory
      );
    }
  }

  return {
    ...existingAnalysis,  // Your existing detection results
    fileIntents           // NEW: Include file intent detection
  };
}

// ADD new helper function to existing file
function detectFileIntent(
  message: string,
  fileName: string,
  fileType: string,
  conversationHistory?: Message[]
): { purpose: 'asset' | 'design-reference' | 'both' | 'pending'; confidence: number } {

  // Only images can be design references
  if (!fileType.startsWith('image/')) {
    return { purpose: 'asset', confidence: 100 };
  }

  const lowerMsg = message.toLowerCase();
  const lowerName = fileName.toLowerCase();

  // ASSET KEYWORDS
  const assetKeywords = ['use this as my logo', 'add this logo', 'include this image', 'use this icon'];
  if (assetKeywords.some(kw => lowerMsg.includes(kw))) {
    return { purpose: 'asset', confidence: 95 };
  }

  // DESIGN INSPIRATION KEYWORDS
  const inspirationKeywords = ['make it look like this', 'design inspiration', 'use this style', 'extract colors'];
  if (inspirationKeywords.some(kw => lowerMsg.includes(kw))) {
    return { purpose: 'design-reference', confidence: 95 };
  }

  // BOTH KEYWORDS
  if (lowerMsg.includes('use this design and add') || lowerMsg.includes('extract colors and include')) {
    return { purpose: 'both', confidence: 90 };
  }

  // FILENAME HEURISTICS
  if (lowerName.includes('logo') || lowerName.includes('icon')) {
    return { purpose: 'asset', confidence: 70 };
  }

  if (lowerName.includes('screenshot') || lowerName.includes('reference') || lowerName.includes('inspiration')) {
    return { purpose: 'design-reference', confidence: 70 };
  }

  // UNCLEAR - needs clarification
  return { purpose: 'pending', confidence: 0 };
}
```

**Why this is better:**
- ✅ Uses existing input detection infrastructure (no duplication)
- ✅ Single source of truth for all intent detection
- ✅ Leverages existing conversation context
- ✅ Files are just another input type (like text)
- ✅ **Reduces implementation time** (see timing update below)

**Uploaded Files List Component:**

```typescript
// components/project/UploadedFilesList.tsx
'use client';

import { FileImageOutlined, FilePdfOutlined, DeleteOutlined } from '@ant-design/icons';
import { message, Popconfirm } from 'antd';

interface UploadedFilesListProps {
  files: UploadedFile[];
  onDelete: (id: string) => void;
}

export function UploadedFilesList({ files, onDelete }: UploadedFilesListProps) {
  if (files.length === 0) return null;

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/files/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');

      onDelete(id);
      message.success('File deleted');
    } catch (error) {
      message.error('Failed to delete file');
    }
  };

  return (
    <div className="border-t border-light p-3 mt-4">
      <h4 className="text-sm font-semibold mb-2">Uploaded Files</h4>

      {files.map(file => (
        <div
          key={file.id}
          className="flex items-center gap-2 p-2 rounded hover:bg-background-subtle"
        >
          {file.fileType.startsWith('image/') ? (
            <FileImageOutlined className="text-lg" />
          ) : (
            <FilePdfOutlined className="text-lg" />
          )}

          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{file.fileName}</div>
            <div className="text-xs text-text-tertiary">
              {file.purpose === 'asset' ? '📦 Asset' :
               file.purpose === 'design-reference' ? '🎨 Design Reference' :
               '📦🎨 Both'}
            </div>
          </div>

          <Popconfirm
            title="Delete this file?"
            onConfirm={() => handleDelete(file.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <button className="text-text-tertiary hover:text-red-500">
              <DeleteOutlined />
            </button>
          </Popconfirm>
        </div>
      ))}
    </div>
  );
}
```

**SIMPLIFIED: Integrate into ChatPanel (Minimal Changes)**

```typescript
// components/project/ChatPanelClaude.tsx (modifications)
import { FileUploadButton } from './FileUploadButton';
import { UploadedFilesList } from './UploadedFilesList';
import { analyzeInput } from '@/lib/input-detection/analyze-input';  // USE EXISTING

export function ChatPanelClaude({ projectId, userId }: Props) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [message, setMessage] = useState('');

  const handleUploadComplete = (file: UploadedFile) => {
    setUploadedFiles(prev => [...prev, file]);
    // No modal, no clarification - just add to state
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // USE EXISTING analyzeInput - just pass uploaded files
    const analysis = await analyzeInput({
      message,
      uploadedFiles,  // NEW: Pass files to existing function
      conversationHistory: messages  // Your existing history
    });

    // If file intents detected, update file purposes
    if (analysis.fileIntents) {
      for (const [fileId, intent] of Object.entries(analysis.fileIntents)) {
        if (intent.confidence >= 70) {
          await fetch(`/api/files/${fileId}`, {
            method: 'PATCH',
            body: JSON.stringify({ purpose: intent.purpose })
          });
        }
      }
    }

    // Continue with normal workflow (existing code)
    await sendToWorkflow(analysis);
    setMessage('');
  };

  const handleDeleteFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-auto">
        {/* ... existing messages ... */}
      </div>

      {/* Uploaded files list */}
      <UploadedFilesList
        files={uploadedFiles}
        onDelete={handleDeleteFile}
      />

      {/* Input area */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <FileUploadButton
            projectId={projectId}
            userId={userId}
            onUploadComplete={handleUploadComplete}
          />

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message... (e.g., 'use this as my logo')"
            className="flex-1 resize-none"
          />

          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}
```

**Key simplification:**
- ❌ No separate `file-intent-detector.ts` service
- ❌ No duplicate detection logic in ChatPanel
- ✅ Just pass `uploadedFiles` to existing `analyzeInput()`
- ✅ Minimal changes to ChatPanel (10-15 lines)
- ✅ Single source of truth for all intent detection

**4. Input Detection Integration (1 hour)** - RENAMED (was "State Integration")

Add file intent detection to existing `analyze-input.ts`:

```typescript
// lib/langgraph/types.ts
export interface AppGenState {
  // ... existing fields ...

  // NEW: Uploaded files
  uploadedFiles?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    purpose: 'asset' | 'design-reference' | 'both';
  }>;
}
```

**5. State Integration (30 minutes)** - REDUCED from 1 hour

Update AppGenState types:

```typescript
// lib/langgraph/types.ts
export interface AppGenState {
  // ... existing fields ...

  // NEW: Uploaded files
  uploadedFiles?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    purpose: 'asset' | 'design-reference' | 'both' | 'pending';
  }>;
}
```

**6. Frontend Code Generation (2 hours)**

```typescript
// lib/langgraph/nodes/frontend-node.ts (modifications)

export async function frontendNode(state: AppGenState): Promise<FrontendNodeOutput> {
  // ... existing code ...

  // NEW: Include uploaded files in context
  const assetFiles = state.uploadedFiles?.filter(
    f => f.purpose === 'asset' || f.purpose === 'both'
  ) || [];

  const fileContext = assetFiles.length > 0
    ? `\n\nUser has uploaded the following assets to include in the app:
${assetFiles.map(f => `- ${f.fileName} (available at: /api/files/${f.id})`).join('\n')}

When the user mentions these files or their functionality requires them, reference them using:
<img src="/api/files/${f.id}" alt="${f.fileName}" />
`
    : '';

  const prompt = `
${existingPrompt}
${fileContext}
`;

  // ... rest of generation ...
}
```

#### Phase 1 Deliverables

- ✅ Users can upload files (images, PDFs)
- ✅ Files stored in PocketBase with proper metadata
- ✅ Chat-based intent detection (no modal interruption)
- ✅ File preview in chat sidebar
- ✅ AI can reference uploaded assets in generated code
- ✅ Delete functionality for uploaded files
- ✅ Intent detection integrated with existing `analyze-input.ts`

#### Phase 1 Testing Checklist

- [ ] Upload image < 10MB (success)
- [ ] Upload image > 10MB (rejected)
- [ ] Upload invalid file type (rejected)
- [ ] Select "asset" purpose
- [ ] Select "design-reference" purpose
- [ ] Select "both" purpose
- [ ] Delete uploaded file
- [ ] Generate app with uploaded logo (appears in code)
- [ ] File persists across page refresh

---

### Phase 2: Design Inspiration Analysis ⭐ HIGH PRIORITY

**Goal:** Extract design tokens from uploaded screenshots

**Duration:** 9.5 hours (~1-2 days)

#### Tasks

**1. Design Inspiration Service (4 hours)**

```typescript
// lib/services/design-inspiration.ts

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface DesignInspiration {
  source: 'screenshot' | 'brand' | 'url';

  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
  };

  typography: {
    headingFont: string;
    bodyFont: string;
    scale: string[];
  };

  patterns: string[];
  spacing: number[];
  borderRadius: string;
  components: string[];
  suggestions: string;
  quality: number;
}

/**
 * Analyze design inspiration from uploaded screenshot
 */
export async function analyzeDesignInspiration(params: {
  imageUrl: string;
  context: {
    appType: string;
    designStyle?: string;
    visualTone?: string;
  };
}): Promise<DesignInspiration | null> {
  try {
    console.log('[Design Inspiration] Starting analysis...');
    console.log('[Design Inspiration] Image URL:', params.imageUrl);

    // Fetch image from PocketBase URL
    const imageResponse = await fetch(params.imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image');
    }

    // Convert to base64
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/png';

    // Analyze with Gemini Vision
    const result = await analyzeWithGemini(base64Image, mimeType, params.context);

    // Validate and return
    if (result && result.quality > 50) {
      console.log('[Design Inspiration] ✅ Analysis complete');
      console.log(`[Design Inspiration]   - Primary color: ${result.colors.primary}`);
      console.log(`[Design Inspiration]   - Quality: ${result.quality}/100`);
      return result;
    }

    console.warn('[Design Inspiration] ⚠️  Low quality analysis, skipping');
    return null;

  } catch (error) {
    console.error('[Design Inspiration] ❌ Analysis failed:', error);
    return null; // Non-blocking
  }
}

/**
 * Analyze with Gemini 2.0 Flash (Vision)
 */
async function analyzeWithGemini(
  base64Image: string,
  mimeType: string,
  context: { appType: string; designStyle?: string; visualTone?: string }
): Promise<DesignInspiration | null> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = buildAnalysisPrompt(context);

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ]);

    const response = result.response.text();

    // Parse JSON response
    const parsed = parseDesignTokens(response);

    // Validate WCAG compliance
    if (parsed) {
      parsed.colors = validateColorPalette(parsed.colors);
    }

    return parsed;

  } catch (error) {
    console.error('[Gemini Vision] Error:', error);
    throw error;
  }
}

/**
 * Build analysis prompt
 */
function buildAnalysisPrompt(context: {
  appType: string;
  designStyle?: string;
  visualTone?: string;
}): string {
  return `Analyze this UI design screenshot and extract design tokens.

Context:
- App Type: ${context.appType}
- Design Style: ${context.designStyle || 'modern'}
- Visual Tone: ${context.visualTone || 'professional'}

Extract the following:

1. COLOR PALETTE (provide hex values):
   - Primary color (most prominent brand color)
   - Secondary color (complementary color)
   - Accent color (call-to-action, highlights)
   - Background color (main background)
   - Surface color (cards, panels)

2. TYPOGRAPHY:
   - Heading font family (detect or infer)
   - Body font family
   - Font size scale (5-6 common sizes in px)

3. UI PATTERNS (identify which are present):
   - Layout: hero-centered, hero-split, dashboard, landing-page, sidebar-layout
   - Components: card-grid-3-col, feature-list, testimonial-carousel, pricing-table
   - Styles: glassmorphism, neumorphism, gradient-backgrounds, minimal-flat

4. SPACING & BORDERS:
   - Spacing scale (e.g., [8, 16, 24, 32, 48, 64])
   - Border radius value (e.g., "8px", "12px", "rounded")

5. COMPONENTS (describe key elements):
   - Navigation structure
   - Hero section layout
   - Content sections
   - Footer structure

6. SUGGESTIONS:
   - 2-3 sentences describing the overall design aesthetic
   - Key visual characteristics

7. QUALITY SCORE:
   - 0-100 based on how clearly you can extract design elements
   - Lower score if image is blurry, partial, or unclear

Return ONLY valid JSON in this exact format:
{
  "colors": {
    "primary": "#hexcode",
    "secondary": "#hexcode",
    "accent": "#hexcode",
    "background": "#hexcode",
    "surface": "#hexcode"
  },
  "typography": {
    "headingFont": "Font Name",
    "bodyFont": "Font Name",
    "scale": ["14px", "16px", "20px", "24px", "32px", "48px"]
  },
  "patterns": ["pattern1", "pattern2", "pattern3"],
  "spacing": [8, 16, 24, 32, 48],
  "borderRadius": "8px",
  "components": ["description1", "description2"],
  "suggestions": "Overall design aesthetic description",
  "quality": 85
}`;
}

/**
 * Parse AI response into DesignInspiration object
 */
function parseDesignTokens(response: string): DesignInspiration | null {
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
                     response.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[1]);

    return {
      source: 'screenshot',
      colors: parsed.colors,
      typography: parsed.typography,
      patterns: parsed.patterns || [],
      spacing: parsed.spacing || [8, 16, 24, 32],
      borderRadius: parsed.borderRadius || '8px',
      components: parsed.components || [],
      suggestions: parsed.suggestions || '',
      quality: parsed.quality || 0
    };

  } catch (error) {
    console.error('[Parse] Failed to parse design tokens:', error);
    return null;
  }
}

/**
 * Validate color palette for WCAG compliance
 */
function validateColorPalette(colors: any): any {
  // Use colord library for color contrast validation
  const { colord } = require('colord');

  // Validate primary/background contrast
  const primaryColor = colord(colors.primary);
  const bgColor = colord(colors.background);

  const contrast = primaryColor.contrast(bgColor);

  if (contrast < 4.5) {
    // Adjust primary color for better contrast
    console.warn('[WCAG] Primary color contrast too low, adjusting...');

    // Darken or lighten primary to achieve AA compliance
    colors.primary = bgColor.isLight()
      ? primaryColor.darken(0.2).toHex()
      : primaryColor.lighten(0.2).toHex();
  }

  return colors;
}

/**
 * Detect brand mention in user description
 */
export function detectBrandInDescription(description: string): string | null {
  const SUPPORTED_BRANDS = [
    'stripe', 'linear', 'notion', 'figma', 'vercel',
    'slack', 'discord', 'spotify', 'netflix', 'airbnb',
    'openai', 'anthropic', 'midjourney', 'twitter', 'github'
  ];

  const lowerDesc = description.toLowerCase();

  for (const brand of SUPPORTED_BRANDS) {
    if (lowerDesc.includes(brand)) {
      return brand;
    }
  }

  return null;
}
```

**2. UX Node Integration (2 hours)**

```typescript
// lib/langgraph/nodes/ux-node.ts (modifications)

import { analyzeDesignInspiration } from '@/lib/services/design-inspiration';

export async function uxNode(state: AppGenState): Promise<UXNodeOutput> {
  console.log('[UX] 🎨 Starting UX design node...');

  const { userDescription, context, uploadedFiles } = state;
  const { appType, designStyle, visualTone } = context;

  // ... existing design system selection code ...

  // ... existing AI-based styling extraction ...

  // NEW: Conditional design inspiration analysis
  let designInspiration: DesignInspiration | null = null;

  // Check for design reference files
  const designRefFiles = uploadedFiles?.filter(
    f => f.purpose === 'design-reference' || f.purpose === 'both'
  ) || [];

  if (designRefFiles.length > 0) {
    try {
      console.log('[UX] 📸 Analyzing design inspiration...');
      console.log(`[UX]   - Found ${designRefFiles.length} design reference(s)`);

      designInspiration = await analyzeDesignInspiration({
        imageUrl: designRefFiles[0].fileUrl, // Use first reference
        context: {
          appType,
          designStyle: designStyle || 'modern',
          visualTone: visualTone || 'professional'
        }
      });

      if (designInspiration) {
        console.log('[UX] ✅ Design inspiration extracted');
        console.log(`[UX]   - Source: ${designInspiration.source}`);
        console.log(`[UX]   - Primary color: ${designInspiration.colors.primary}`);
        console.log(`[UX]   - Patterns: ${designInspiration.patterns.join(', ')}`);
        console.log(`[UX]   - Quality: ${designInspiration.quality}/100`);
      } else {
        console.log('[UX] ⚠️  Design inspiration analysis returned null');
      }

    } catch (error) {
      console.warn('[UX] ⚠️  Design inspiration analysis failed:', error);
      console.log('[UX] → Continuing with AI-generated styling');
      // designInspiration stays null - non-blocking
    }
  }

  // ... existing styling config generation ...

  // NEW: Merge inspiration with AI styling if available
  if (designInspiration) {
    stylingConfig = mergeDesignInspiration(stylingConfig, designInspiration);
    console.log('[UX] 🎨 Merged design inspiration with AI styling');
  }

  return {
    ...state,
    stylingConfig,
    designInspiration // NEW: Include in output
  };
}

/**
 * Merge design inspiration with AI-generated styling
 */
function mergeDesignInspiration(
  aiStyling: StylingConfig,
  inspiration: DesignInspiration
): StylingConfig {
  return {
    ...aiStyling,

    // Override colors with extracted palette
    colorTheme: {
      ...aiStyling.colorTheme,
      primary: inspiration.colors.primary,
      secondary: inspiration.colors.secondary,
      accent: inspiration.colors.accent,
      background: inspiration.colors.background,
      surface: inspiration.colors.surface
    },

    // Override typography with extracted fonts
    typography: {
      ...aiStyling.typography,
      fontFamily: inspiration.typography.headingFont,
      // Keep AI-generated sizes but note inspiration
      sizes: aiStyling.typography.sizes
    },

    // Keep AI-generated spacing but reference inspiration
    spacing: aiStyling.spacing,

    // Add inspiration patterns to metadata (for frontend reference)
    metadata: {
      ...aiStyling.metadata,
      inspirationPatterns: inspiration.patterns,
      inspirationComponents: inspiration.components,
      inspirationSuggestions: inspiration.suggestions
    }
  };
}
```

**3. Vision Model Configuration (1 hour)**

```typescript
// lib/ai-config.ts (modifications)

export const AI_MODES = {
  server: {
    name: 'Server-Side AI (Mistral + Gemini + OpenRouter + Groq)',
    providers: ['mistral', 'gemini', 'openrouter', 'groq'] as AIProvider[],
    defaultModel: 'gemini-2.0-flash-exp',
    features: {
      streaming: false,
      vision: true, // CHANGE: Enable vision (was false)
      textToImage: false
    }
  }
};

// Add Gemini vision model configuration
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // ... existing models ...

  // Gemini 2.0 Flash (already exists, but ensure vision: true)
  'gemini-2.0-flash-exp': {
    provider: 'gemini',
    displayName: 'Gemini 2.0 Flash Experimental',
    contextWindow: 1000000,
    maxOutput: 8192,
    supports: {
      streaming: true,
      vision: true, // ENSURE THIS IS TRUE
      functionCalling: true
    },
    pricing: {
      input: 0.10, // $0.10 per 1M tokens (paid tier)
      output: 0.40  // $0.40 per 1M tokens (paid tier)
    }
  }
};
```

**4. State Updates (30 minutes)**

```typescript
// lib/langgraph/types.ts (modifications)

export interface AppGenState {
  // ... existing fields ...

  // NEW: Design inspiration output
  designInspiration?: DesignInspiration;
}

// NEW: Design inspiration type definition
export interface DesignInspiration {
  source: 'screenshot' | 'brand' | 'url';

  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
  };

  typography: {
    headingFont: string;
    bodyFont: string;
    scale: string[];
  };

  patterns: string[];
  spacing: number[];
  borderRadius: string;
  components: string[];
  suggestions: string;
  quality: number;
}
```

**5. Testing (2 hours)**

```typescript
// lib/services/__tests__/design-inspiration.test.ts

import { analyzeDesignInspiration, detectBrandInDescription } from '../design-inspiration';

describe('Design Inspiration Service', () => {
  describe('analyzeDesignInspiration', () => {
    it('should extract colors from screenshot', async () => {
      const result = await analyzeDesignInspiration({
        imageUrl: 'https://example.com/stripe-screenshot.png',
        context: { appType: 'landing-page', designStyle: 'modern' }
      });

      expect(result).toBeTruthy();
      expect(result.colors.primary).toMatch(/^#[0-9a-f]{6}$/i);
      expect(result.quality).toBeGreaterThan(50);
    });

    it('should return null on failure (non-blocking)', async () => {
      const result = await analyzeDesignInspiration({
        imageUrl: 'https://example.com/invalid.png',
        context: { appType: 'landing-page' }
      });

      expect(result).toBeNull();
    });

    it('should validate WCAG color contrast', async () => {
      const result = await analyzeDesignInspiration({
        imageUrl: 'https://example.com/screenshot.png',
        context: { appType: 'dashboard' }
      });

      if (result) {
        const { colord } = require('colord');
        const contrast = colord(result.colors.primary).contrast(
          colord(result.colors.background)
        );
        expect(contrast).toBeGreaterThanOrEqual(4.5); // WCAG AA
      }
    });
  });

  describe('detectBrandInDescription', () => {
    it('should detect brand mentions', () => {
      expect(detectBrandInDescription('Build an app like Stripe')).toBe('stripe');
      expect(detectBrandInDescription('Similar to Linear')).toBe('linear');
      expect(detectBrandInDescription('Modern dashboard')).toBeNull();
    });
  });
});
```

#### Phase 2 Deliverables

- ✅ Gemini Vision integration for design token extraction
- ✅ Color palette extraction with WCAG AA validation
- ✅ Typography detection (fonts, sizes)
- ✅ UI pattern identification
- ✅ Non-blocking integration (never crashes workflow)
- ✅ Styling merge with AI preferences
- ✅ Quality scoring (skip low-quality analyses)

#### Phase 2 Testing Checklist

- [ ] Upload Stripe screenshot → extract #635bff purple
- [ ] Upload Linear screenshot → extract #5e6ad2 purple
- [ ] Upload Notion screenshot → extract design tokens
- [ ] Verify WCAG AA compliance for all colors
- [ ] Test with invalid image (non-blocking)
- [ ] Test with network failure (non-blocking)
- [ ] Generate app with inspired design (colors match)
- [ ] Verify quality score > 50 threshold

---

### Phase 3: Advanced Features 🚀 MEDIUM PRIORITY

**Goal:** Enhanced UX and optional capabilities

**Duration:** 7-8 hours (~1-2 days) - REDUCED from 10-14 hours

**Time Savings:** 3-6 hours saved (intent detection already in Phase 1)

#### Tasks

~~**1. Intent Detection AI (3 hours)**~~ ❌ **REMOVED** - Already integrated in Phase 1

~~Smart purpose detection from user message + filename:~~

```typescript
// lib/services/file-intent-detector.ts

export async function detectFilePurpose(params: {
  fileName: string;
  userMessage?: string;
  fileType: string;
}): Promise<'asset' | 'design-reference' | 'both' | 'unknown'> {

  const { fileName, userMessage, fileType } = params;

  // Only images can be design references
  if (!fileType.startsWith('image/')) {
    return 'asset';
  }

  // Keyword detection in user message
  if (userMessage) {
    const lowerMsg = userMessage.toLowerCase();

    // Strong design reference indicators
    if (
      lowerMsg.includes('make it look like') ||
      lowerMsg.includes('design inspiration') ||
      lowerMsg.includes('use this style') ||
      lowerMsg.includes('copy this design')
    ) {
      return 'design-reference';
    }

    // Strong asset indicators
    if (
      lowerMsg.includes('add this logo') ||
      lowerMsg.includes('include this image') ||
      lowerMsg.includes('use this icon') ||
      lowerMsg.includes('add my logo')
    ) {
      return 'asset';
    }

    // Both indicators
    if (
      lowerMsg.includes('use this design and add') ||
      lowerMsg.includes('style and include')
    ) {
      return 'both';
    }
  }

  // Filename heuristics
  const lowerName = fileName.toLowerCase();

  if (
    lowerName.includes('logo') ||
    lowerName.includes('icon') ||
    lowerName.includes('avatar') ||
    lowerName.includes('profile')
  ) {
    return 'asset';
  }

  if (
    lowerName.includes('screenshot') ||
    lowerName.includes('reference') ||
    lowerName.includes('inspiration') ||
    lowerName.includes('mockup') ||
    lowerName.includes('design')
  ) {
    return 'design-reference';
  }

  // Default: ask user
  return 'unknown';
}
```

**1. Drag & Drop Upload (2 hours)** - RENUMBERED

```typescript
// components/project/ChatPanelClaude.tsx (modifications)

export function ChatPanelClaude({ projectId }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);

    for (const file of files) {
      // Detect intent
      const intent = await detectFilePurpose({
        fileName: file.name,
        userMessage: message,
        fileType: file.type
      });

      if (intent === 'unknown') {
        // Show intent selector
        setSelectedFile(file);
        setShowIntentModal(true);
      } else {
        // Auto-upload with detected purpose
        await uploadFile(file, intent);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={isDragging ? 'border-2 border-dashed border-brand-primary' : ''}
    >
      {/* ... existing content ... */}
    </div>
  );
}
```

**2. File Management UI (3 hours)** - RENUMBERED

Enhanced file list with actions:

```typescript
// components/project/UploadedFilesList.tsx (enhanced)

export function UploadedFilesList({ files, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleChangePurpose = async (id: string, newPurpose: string) => {
    try {
      await fetch(`/api/files/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ purpose: newPurpose })
      });

      onUpdate();
      message.success('Purpose updated');
    } catch (error) {
      message.error('Failed to update');
    }
  };

  const handleReanalyze = async (id: string) => {
    try {
      await fetch(`/api/files/${id}/analyze`, { method: 'POST' });
      message.success('Re-analyzing design...');
    } catch (error) {
      message.error('Analysis failed');
    }
  };

  return (
    <div>
      {files.map(file => (
        <div key={file.id} className="file-item">
          {/* File info */}
          <div className="flex-1">
            <div>{file.fileName}</div>
            <Select
              value={file.purpose}
              onChange={(v) => handleChangePurpose(file.id, v)}
              size="small"
            >
              <Option value="asset">📦 Asset</Option>
              <Option value="design-reference">🎨 Design Reference</Option>
              <Option value="both">📦🎨 Both</Option>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {file.purpose !== 'asset' && (
              <Button
                size="small"
                onClick={() => handleReanalyze(file.id)}
              >
                Re-analyze
              </Button>
            )}

            <Button
              size="small"
              danger
              onClick={() => onDelete(file.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**3. URL Screenshot Capture (Optional - 4 hours)** - RENUMBERED

```typescript
// lib/services/screenshot-capture.ts

import { mcp } from '@/lib/mcp-client';

export async function captureWebsiteScreenshot(
  url: string,
  options?: {
    width?: number;
    height?: number;
    fullPage?: boolean;
    timeout?: number;
  }
): Promise<string | null> {
  try {
    console.log('[Screenshot] Capturing:', url);

    // Use Puppeteer MCP to screenshot
    const result = await mcp.puppeteer.screenshot({
      url,
      width: options?.width || 1280,
      height: options?.height || 800,
      fullPage: options?.fullPage || false,
      encoded: true // Get base64
    });

    if (result.error) {
      throw new Error(result.error);
    }

    console.log('[Screenshot] ✅ Captured successfully');
    return result.data; // base64 image

  } catch (error) {
    console.error('[Screenshot] ❌ Failed:', error);
    return null; // Non-blocking
  }
}

// In ux-node.ts - add URL screenshot support
if (state.referenceUrl && !designRefFiles.length) {
  console.log('[UX] 📸 Capturing screenshot from URL...');

  const screenshot = await captureWebsiteScreenshot(state.referenceUrl);

  if (screenshot) {
    // Analyze screenshot
    designInspiration = await analyzeDesignInspiration({
      imageUrl: `data:image/png;base64,${screenshot}`,
      context: { appType, designStyle, visualTone }
    });
  }
}
```

**4. Multi-Reference Analysis (2 hours)** - RENUMBERED

Blend colors from multiple references:

```typescript
// lib/services/design-inspiration.ts (enhancement)

export async function analyzeMultipleReferences(
  imageUrls: string[],
  context: any
): Promise<DesignInspiration | null> {
  const results = await Promise.all(
    imageUrls.map(url => analyzeDesignInspiration({ imageUrl: url, context }))
  );

  const validResults = results.filter(r => r !== null);

  if (validResults.length === 0) return null;
  if (validResults.length === 1) return validResults[0];

  // Blend colors by averaging
  const blendedColors = {
    primary: averageColors(validResults.map(r => r.colors.primary)),
    secondary: averageColors(validResults.map(r => r.colors.secondary)),
    accent: averageColors(validResults.map(r => r.colors.accent)),
    background: averageColors(validResults.map(r => r.colors.background)),
    surface: averageColors(validResults.map(r => r.colors.surface))
  };

  return {
    ...validResults[0],
    colors: blendedColors,
    patterns: [...new Set(validResults.flatMap(r => r.patterns))],
    quality: Math.round(validResults.reduce((sum, r) => sum + r.quality, 0) / validResults.length)
  };
}

function averageColors(colors: string[]): string {
  const { colord } = require('colord');

  const rgb = colors.map(c => colord(c).toRgb());

  const avgR = Math.round(rgb.reduce((sum, c) => sum + c.r, 0) / rgb.length);
  const avgG = Math.round(rgb.reduce((sum, c) => sum + c.g, 0) / rgb.length);
  const avgB = Math.round(rgb.reduce((sum, c) => sum + c.b, 0) / rgb.length);

  return colord({ r: avgR, g: avgG, b: avgB }).toHex();
}
```

#### Phase 3 Deliverables

- ~~✅ Smart intent detection (auto-suggest purpose)~~ ✅ **MOVED TO PHASE 1**
- ✅ Drag & drop file upload
- ✅ Enhanced file management UI (change purpose, re-analyze)
- ⚪ URL screenshot capture (optional)
- ⚪ Multi-reference blending (optional)

#### Phase 3 Testing Checklist

- [ ] Upload "logo.png" → auto-detect "asset"
- [ ] Upload "stripe-screenshot.png" → auto-detect "design-reference"
- [ ] Drag & drop multiple files
- [ ] Change file purpose after upload
- [ ] Re-analyze design reference
- [ ] Capture screenshot from URL (if implemented)
- [ ] Blend colors from 2+ references (if implemented)

---

### Phase 4: Polish & Optimization ✨ HIGH PRIORITY

**Goal:** Production-ready quality

**Duration:** 9 hours (~1-2 days)

#### Tasks

**1. Performance Optimization (2 hours)**

- Image compression before upload
- Lazy loading for file previews
- Cache Gemini Vision responses (10 min TTL)
- Debounce re-analysis requests

**2. Error Handling (2 hours)**

- User-friendly error messages
- Retry logic for failed uploads
- Fallback for vision API failures
- Network error recovery

**3. Documentation (2 hours)**

- Update CRITICAL_LANGGRAPH_WORKFLOW_DOCUMENTATION.md
- API documentation for file endpoints
- User guide for design inspiration feature

**4. Testing & QA (3 hours)**

- E2E test: Upload logo → appears in generated app
- E2E test: Upload design ref → colors match
- Edge case testing (corrupted images, huge files, etc.)
- Load testing (100+ files per project)

#### Phase 4 Deliverables

- ✅ Production-ready error handling
- ✅ Comprehensive documentation
- ✅ Full test coverage
- ✅ Performance optimized

---

## Complete File Change List

### New Files (7 files) - REDUCED from 9

1. **`pocketbase/pb_migrations/001_create_uploaded_files.js`**
   - PocketBase schema migration
   - ~50 lines

2. **`app/api/files/upload/route.ts`**
   - File upload endpoint
   - ~150 lines

3. **`app/api/files/[id]/route.ts`**
   - File retrieval/deletion/update
   - ~100 lines (added PATCH for purpose update)

4. **`lib/services/design-inspiration.ts`**
   - Gemini Vision integration
   - ~300 lines

5. **`lib/services/screenshot-capture.ts`** (Phase 3 - Optional)
   - Puppeteer MCP wrapper
   - ~100 lines

6. **`components/project/FileUploadButton.tsx`**
   - Upload button (NO MODAL - simplified)
   - ~50 lines (REDUCED from 150)

7. **`components/project/UploadedFilesList.tsx`**
   - File list with actions
   - ~120 lines

~~8. **`lib/services/file-intent-detector.ts`**~~ ❌ **REMOVED** (integrated into existing `analyze-input.ts`)

~~9. **`lib/services/__tests__/design-inspiration.test.ts`**~~ (moved to Phase 4)

### Modified Files (6 files) - UPDATED

1. **`lib/input-detection/analyze-input.ts`** ⭐ **NEW** (replaces separate service)
   - Add file intent detection helper function
   - Add `uploadedFiles` parameter to existing function
   - ~60 new lines

2. **`lib/langgraph/types.ts`**
   - Add `uploadedFiles` and `designInspiration` fields
   - ~60 new lines

3. **`lib/langgraph/nodes/ux-node.ts`**
   - Integrate design inspiration analysis
   - ~100 new lines

4. **`lib/langgraph/nodes/frontend-node.ts`**
   - Include uploaded assets in context
   - ~40 new lines

5. **`components/project/ChatPanelClaude.tsx`**
   - Add upload dropdown button with menu
   - Add file selector modal
   - Golden gradient progress animation
   - ~80 new lines (includes dropdown menu and progress UI)

6. **`components/project/ProjectSidebar.tsx`** ⭐ **NEW**
   - Rename "Codes" tab to "Files"
   - Add uploaded files section at bottom
   - Golden gradient file icons
   - ~50 new lines for uploaded files section

~~6. **`lib/ai-config.ts`**~~ ❌ **NOT NEEDED** (vision already enabled)

~~7. **`lib/mcp-config.ts`**~~ (Phase 3 - Optional)

### Configuration Files

- **`.env.local`**: No changes needed (Gemini API key already exists)

**TOTAL:** 7 new files + 5 modified files = **12 files affected** (was 15)

**REDUCTION:** -3 files, -290 lines of code

---

## Storage Strategy

### PocketBase Collection: `uploaded_files`

**Schema:**

```typescript
{
  id: string;              // Auto-generated
  projectId: relation;     // → projects (cascade delete)
  userId: relation;        // → users
  fileName: string;        // "logo.png"
  fileType: string;        // "image/png"
  purpose: enum;           // 'asset' | 'design-reference' | 'both'
  file: file;              // PocketBase file field
  designAnalysis: json;    // Cached DesignInspiration object
  created: datetime;
  updated: datetime;
}
```

**File URLs:**
```
/api/files/[id] → Redirects to PocketBase file URL
```

**Storage Locations:**
```
pb_data/storage/uploaded_files/[recordId]/[filename]
```

**Size Limits:**
- Images: 10MB max
- PDFs: 10MB max
- Total per project: Unlimited (monitor usage)

**Cleanup Policy:**

| Purpose | Retention | Policy |
|---------|-----------|--------|
| `asset` | Permanent | Keep until project deleted |
| `design-reference` | 7 days | Auto-delete after 7 days |
| `both` | Permanent | Keep until project deleted |

**Cleanup Cron Job:**

```typescript
// Run daily
async function cleanupOldDesignReferences() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const oldRefs = await pb.collection('uploaded_files').getFullList({
    filter: `purpose = 'design-reference' && created < '${sevenDaysAgo.toISOString()}'`
  });

  for (const ref of oldRefs) {
    await pb.collection('uploaded_files').delete(ref.id);
  }
}
```

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Vision API quota exhausted** | Medium | High | Use Gemini free tier (1,500/day), add Pixtral fallback |
| **Large file uploads slow** | High | Medium | Image compression, 10MB limit, progress indicator |
| **PocketBase storage fills up** | Low | High | Monitor storage, cleanup old files, S3 migration path |
| **Design token quality poor** | Medium | Medium | WCAG validation, quality score threshold (>50), user override |
| **File upload fails silently** | Low | High | Comprehensive error handling, retry logic, user notifications |
| **Puppeteer blocked by sites** | High | Low | Manual upload as primary, Puppeteer as optional fallback |

### Architecture Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **State bloat from file metadata** | Low | Medium | Only store minimal metadata in state, full data in PocketBase |
| **UX Node timeout with vision** | Medium | Medium | 30-second timeout, non-blocking, skip on failure |
| **Inconsistent file references** | Medium | High | Validate all file URLs before code generation |

### User Experience Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Confusing upload purpose** | High | Medium | Clear UI labels, intent selector, help tooltips, auto-detection |
| **Design inspiration doesn't match** | High | Medium | Preview extracted colors, allow manual override, quality scoring |
| **File not appearing in app** | Medium | High | Clear messaging "File will appear in [section]" |

### Security Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Malicious file upload** | Medium | Critical | File type validation, size limits, virus scanning (Phase 4) |
| **Unauthorized file access** | Low | Critical | PocketBase API rules, user authentication checks |
| **XSS via filenames** | Low | High | Sanitize filenames, escape in HTML output |

---

## Cost & Performance Analysis

### API Costs Per Generation

**With Design Inspiration:**

| Component | Cost | Notes |
|-----------|------|-------|
| File Upload | $0 | PocketBase storage ~$0.001/GB |
| Vision Analysis (Gemini Free) | $0 | 1,500 requests/day limit |
| Vision Analysis (Gemini Paid) | $0.00035 | $0.10/M input + $0.40/M output |
| Storage (PocketBase) | $0.00001 | ~10KB metadata per file |

**Monthly Costs (1,000 generations):**
- Free tier: $0 (if under 1,500/day)
- Paid tier: $0.35/month

**Comparison:**
- screenshot-to-code (GPT-4V): $0.0063 per analysis
- Our cost: $0.00035 per analysis
- **Savings: 94% cheaper** (18x less expensive)

### Performance Impact

| Operation | Time Added | Total Time |
|-----------|-----------|------------|
| File upload (1MB image) | +0.5-1s | User action (not blocking) |
| Design inspiration analysis | +1-2s | UX Node: 5s → 6-7s |
| File reference in code | +0s | Just template generation |

**Complete Workflow Timeline:**

```
Before: 45-60 seconds (planning → building → deployment)
After:  46-62 seconds (+1-2s for design inspiration)
```

**Impact:** ~2% increase (negligible)

### Storage Requirements

| Project Type | Average Files | Storage Size |
|--------------|---------------|--------------|
| Simple landing page | 1-2 files | 1-5MB |
| Medium dashboard | 3-5 files | 5-15MB |
| Complex app | 5-10 files | 15-30MB |

**Estimated storage for 1,000 projects:** 10-30GB total

---

## Success Metrics

### Phase 1: File Upload Success Criteria

- [ ] Upload success rate > 95%
- [ ] Average upload time < 2 seconds
- [ ] File URLs accessible in generated apps
- [ ] Zero data loss incidents
- [ ] User can delete uploaded files

### Phase 2: Design Inspiration Success Criteria

- [ ] Color extraction accuracy > 85%
- [ ] WCAG AA compliance for all extracted colors
- [ ] Non-blocking (workflow never crashes)
- [ ] Analysis time < 3 seconds (p95)
- [ ] Quality score > 50 for accepted analyses
- [ ] User satisfaction with inspired designs > 70%

### Phase 3: Advanced Features Success Criteria

- [ ] Intent detection accuracy > 80%
- [ ] Drag & drop working on all browsers
- [ ] File management UI usable without docs
- [ ] Multi-file upload success rate > 90%

### Phase 4: Production Readiness Criteria

- [ ] Zero critical bugs
- [ ] Documentation complete and accurate
- [ ] Test coverage > 80%
- [ ] Performance benchmarks met
- [ ] Security audit passed

---

## Recommendations

### Immediate Actions (Start Now)

1. **Create PocketBase `uploaded_files` collection**
   - Run migration script
   - Configure API rules
   - Test CRUD operations

2. **Implement Phase 1: File Upload (Days 1-2)**
   - Build upload API endpoints
   - Create upload UI components
   - Integrate with ChatPanel
   - Test end-to-end upload flow

3. **Implement Phase 2: Design Inspiration (Days 3-4)**
   - Gemini Vision integration
   - UX Node enhancement
   - Test with real screenshots

**Why this order?**
- File upload is foundation for design inspiration
- Enables independent testing of each feature
- Delivers immediate user value (upload files → see in apps)
- Builds momentum with visible progress

### Long-Term Strategy

**DO:**
- ✅ Enhance design inspiration with better pattern detection
- ✅ Add multi-reference blending for complex projects
- ✅ Support video uploads for animation extraction (Phase 5)
- ✅ Implement design system matching (detect Shadcn, MUI, etc.)

**DON'T:**
- ❌ Integrate screenshot-to-code (incompatible architecture)
- ❌ Generate complete code from screenshots (bypasses our pipeline)
- ❌ Use expensive vision models when Gemini works well

### Feature Prioritization

**Phase 1-2 (MVP):** 16 hours - REDUCED from 18.5 hours
- Core file upload (6.5 hours)
- Design inspiration (9.5 hours)
- **Target: 2 days**

**Phase 3 (Enhancement):** 7-8 hours - REDUCED from 10-14 hours
- Drag & drop (2 hours)
- File management UI (3 hours)
- Multi-reference blending (2-3 hours optional)
- **Target: 1 day**

**Phase 4 (Polish):** 9 hours
- Error handling
- Documentation
- Testing
- **Target: 1 day**

**UPDATED TOTALS:**
- **MVP (Phase 1-2): 16 hours (~2 days)** ⬅️ REDUCED from 18.5 hours
- **Full Feature (All Phases): 32-33 hours (~4 days)** ⬅️ REDUCED from 37.5-41.5 hours

**TIME SAVINGS: 5.5-8.5 hours** by integrating with existing infrastructure!

---

## Implementation Checklist

### Pre-Implementation

- [ ] Review this document thoroughly
- [ ] Confirm architecture decisions
- [ ] Set up development environment
- [ ] Create feature branch in git

### Phase 1: File Upload

- [ ] Create PocketBase migration
- [ ] Implement upload API endpoint
- [ ] Implement file retrieval endpoint
- [ ] Build FileUploadButton component
- [ ] Build UploadedFilesList component
- [ ] Integrate into ChatPanelClaude
- [ ] Update AppGenState types
- [ ] Enhance frontend-node with file references
- [ ] Test upload flow end-to-end
- [ ] Test file deletion
- [ ] Test file in generated app

### Phase 2: Design Inspiration

- [ ] Implement design-inspiration.ts service
- [ ] Integrate Gemini Vision API
- [ ] Enhance ux-node.ts
- [ ] Update ai-config.ts (enable vision)
- [ ] Add DesignInspiration types
- [ ] Implement WCAG color validation
- [ ] Write unit tests
- [ ] Test with Stripe screenshot
- [ ] Test with Linear screenshot
- [ ] Test non-blocking behavior
- [ ] Verify styling merge

### Phase 3: Advanced Features

- [ ] Implement file-intent-detector.ts
- [ ] Add drag & drop support
- [ ] Enhance file management UI
- [ ] Add re-analysis feature
- [ ] Implement URL screenshot (optional)
- [ ] Implement multi-reference blending (optional)
- [ ] Test intent detection accuracy
- [ ] Test drag & drop

### Phase 4: Polish

- [ ] Add image compression
- [ ] Implement lazy loading
- [ ] Add Gemini response caching
- [ ] Enhance error messages
- [ ] Add retry logic
- [ ] Update documentation
- [ ] Write E2E tests
- [ ] Performance testing
- [ ] Security audit
- [ ] User acceptance testing

### Post-Implementation

- [ ] Deploy to staging
- [ ] Monitor logs for errors
- [ ] Collect user feedback
- [ ] Iterate based on feedback
- [ ] Deploy to production

---

## Appendix: Example Workflows

### Workflow 1: Upload Logo as Asset

```
1. User types: "Build a landing page with my company logo"
2. Clicks upload button
3. Selects: acme-logo.png (200KB)
4. Intent selector appears
5. Selects: "Use as asset in the app"
6. File uploads successfully
7. Shows in sidebar: acme-logo.png [📦 Asset]

8. User clicks "Generate"
9. PM Node: Plans landing page
10. UX Node: Generates styling (no design inspiration)
11. Backend Node: Skipped (no backend needed)
12. Frontend Node:
    - Sees uploadedFiles: [{ fileName: 'acme-logo.png', fileUrl: '/api/files/abc123' }]
    - Generates code with: <img src="/api/files/abc123" alt="Acme Logo" />
13. QA Node: Validates
14. DevOps Node: Deploys

Result: Landing page with company logo in header
```

### Workflow 2: Upload Design Reference

```
1. User types: "Build a SaaS dashboard with this design style"
2. Uploads: stripe-homepage-screenshot.png (1.5MB)
3. Intent selector appears
4. Selects: "Use for design inspiration"
5. File uploads successfully
6. Shows in sidebar: stripe-homepage-screenshot.png [🎨 Design Reference]

7. User clicks "Generate"
8. PM Node: Plans SaaS dashboard
9. UX Node:
   - Generates base styling
   - Detects design reference file
   - Calls analyzeDesignInspiration()
   - Gemini Vision extracts:
     * Primary: #635bff (Stripe purple)
     * Secondary: #0a2540 (dark blue)
     * Font: Inter
     * Patterns: gradient-backgrounds, card-grid-3-col
   - Merges with base styling
10. Backend Node: Creates collections
11. Frontend Node:
    - Uses extracted colors in Tailwind config
    - Generates UI with Stripe-inspired design
    - Does NOT include screenshot in code
12. QA Node: Validates
13. DevOps Node: Deploys

Result: SaaS dashboard with Stripe's color scheme and visual style
```

### Workflow 3: Upload Both

```
1. User types: "Use this design and add my logo"
2. Uploads two files:
   - design-ref.png → Selects "Design inspiration"
   - company-logo.png → Selects "Asset"
3. Both show in sidebar

4. User clicks "Generate"
5. UX Node: Analyzes design-ref.png for colors/fonts
6. Frontend Node: Includes company-logo.png in code

Result: App with inspired design + logo included
```

---

**Last Updated:** January 2025
**Status:** Ready for Implementation
**Next Steps:**
1. Review and approve architecture
2. Create PocketBase migration
3. Begin Phase 1 implementation
4. Target MVP completion: 2-3 days