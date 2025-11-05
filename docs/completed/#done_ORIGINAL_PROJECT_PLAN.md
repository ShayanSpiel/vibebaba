# AI Vibecoding Platform - Comprehensive Development Plan

## 🎯 Project Overview
Build a platform where users describe app ideas → AI generates full-stack applications with live preview, editable planning, and integrated backend.

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14+** (App Router) - Full-stack React framework
- **Tailwind CSS** - Utility-first styling for minimalistic design
- **Shadcn/ui** - Beautiful, free pre-built components (Radix UI + Tailwind)
- **Poppins Font** - Google Fonts
- **Sandpack** - Live code preview (by CodeSandbox)
- **Monaco Editor** - Code viewer with syntax highlighting

### AI Integration
- **Google Gemini API** - Free tier for AI generation
- Streaming responses for real-time feedback

### Backend/BaaS
- **PocketBase** ✅ RECOMMENDED
  - Single binary, ultra-fast setup
  - Built-in auth, file storage, real-time subscriptions
  - Admin UI for database viewing
  - SQLite-based, perfect for MVP

---

## 📁 Project Structure

```
vibecoding/
├── app/
│   ├── (landing)/
│   │   └── page.tsx              # Landing with AI chatbox
│   ├── project/
│   │   └── [id]/
│   │       ├── page.tsx          # Main project page
│   │       ├── planning/         # Planning stage
│   │       ├── design/           # Design stage
│   │       └── backend/          # Backend stage
│   └── api/
│       └── ai/
│           ├── plan/route.ts     # AI planning endpoint
│           ├── design/route.ts   # AI design generation
│           └── backend/route.ts  # AI backend generation
├── components/
│   ├── chat/
│   │   └── AIChat.tsx            # Main chatbox
│   ├── project/
│   │   ├── ProjectStages.tsx     # Stage indicator
│   │   ├── PlanEditor.tsx        # Editable plan view
│   │   ├── LivePreview.tsx       # Sandpack preview
│   │   ├── CodeViewer.tsx        # File browser + Monaco
│   │   ├── DatabaseViewer.tsx    # Schema inspector
│   │   └── ProjectSettings.tsx   # Settings panel
│   └── ui/                       # Shadcn components
├── lib/
│   ├── ai.ts                     # Gemini API integration
│   ├── prompts.ts                # AI prompt templates
│   └── store.ts                  # State management
└── pocketbase/                   # PocketBase instance (future)
```

---

## 🎨 UI Design (Minimalistic Black & White)

### Color Palette
- **Background**: #FFFFFF (white)
- **Text**: #000000 (black)
- **Gray-100**: #F5F5F5
- **Gray-200**: #E5E5E5
- **Gray-800**: #262626
- **Accent**: #000000 with opacity variations

### Typography
- **Font**: Poppins (Google Fonts)
- **Weights**: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold)

---

## 🚀 Development Phases

### **Phase 1: Foundation (Current)** ⏱️ 2-4 hours
- [x] Document comprehensive plan
- [ ] Next.js project setup with Tailwind + Shadcn/ui
- [ ] Poppins font integration
- [ ] Landing page with minimalistic design
- [ ] AI chatbox component with streaming
- [ ] Google Gemini API integration
- [ ] Basic routing and project creation
- [ ] Planning stage UI

### **Phase 2: Planning Stage (Next)** ⏱️ 4-6 hours
- [ ] AI prompt engineering for app planning
- [ ] Plan generation with features, flows, data models
- [ ] Editable plan interface (rich text/markdown)
- [ ] Confirmation flow and state management
- [ ] Local storage for projects

### **Phase 3: Design/Frontend Stage** ⏱️ 8-12 hours
- [ ] AI generates React + Tailwind components
- [ ] Sandpack integration for live preview
- [ ] "AI is coding..." animation/logs
- [ ] Code viewer with file tree
- [ ] Regenerate/edit capabilities

### **Phase 4: Backend Integration** ⏱️ 8-12 hours
- [ ] PocketBase setup
- [ ] AI generates PocketBase schema
- [ ] Create collections programmatically
- [ ] Full-stack live preview
- [ ] Database schema viewer

### **Phase 5: Project Tools** ⏱️ 4-6 hours
- [ ] Code file viewer with syntax highlighting
- [ ] Database inspector UI
- [ ] Settings panel
- [ ] Project list and management

---

## 🎯 User Flow

1. **Landing Page** → AI chatbox: "Describe your app idea..."
2. **User Input** → AI generates plan → Creates project
3. **Planning Stage** → Edit plan → Confirm
4. **Design Stage** → Live preview + code → Confirm
5. **Backend Stage** → Full-stack app → Ready!
6. **Settings** → View code, database, export

---

## 🔑 API Integration

### Google Gemini API
- **Model**: gemini-1.5-flash (free tier)
- **Features**: Text generation, streaming, JSON output
- **Rate Limits**: 15 requests/minute (free tier)
- **Cost**: Free up to quota

### Key Prompts

**Planning Prompt:**
```
Analyze this app idea: {user_description}
Generate a structured plan with:
- App narrative and value proposition
- Core features (5-7 main features)
- User flows (key interactions)
- Data models (entities and relationships)
Return as JSON with format:
{
  "narrative": "...",
  "features": ["..."],
  "userFlows": ["..."],
  "dataModels": [{name: "...", fields: [...]}]
}
```

**Design Prompt:**
```
Based on this plan: {plan_json}
Generate React components using:
- React 18+ with hooks
- Tailwind CSS (minimalistic black/white design)
- Responsive and modern UI
Create file structure with complete code for:
- App.tsx
- components/*.tsx
- lib/utils.ts
```

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@google/generative-ai": "^0.2.0",
    "@codesandbox/sandpack-react": "^2.13.0",
    "zustand": "^4.5.0",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Add environment variables
echo "GEMINI_API_KEY=AIzaSyCEneo35dnieSYdJjPx69ki3Cd-WH_iRVY" > .env.local

# 3. Run development server
npm run dev

# 4. Open browser
open http://localhost:3000
```

---

## 📝 Notes

- Phase 1 focuses on landing page + basic AI interaction
- Using local storage for MVP (no database yet)
- PocketBase integration in Phase 4
- Mobile responsive from the start
- Dark mode support can be added later

---

## 🎯 Success Criteria (Phase 1)

- ✅ Clean, minimalistic landing page
- ✅ Working AI chatbox with Gemini integration
- ✅ Streaming responses with loading states
- ✅ Project creation flow
- ✅ Basic planning stage UI
- ✅ Responsive design

---

**Last Updated**: 2025-10-19
**Status**: Phase 1 In Progress
