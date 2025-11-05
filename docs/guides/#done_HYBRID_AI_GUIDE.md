# 🔄 Hybrid AI System - Easy Switching Guide

Your app now has a **HYBRID AI SYSTEM** that lets you switch between client-side (Puter) and server-side AI with **ONE LINE OF CODE**.

## ⚡ How to Switch (10 Seconds)

### Open This File:
**[lib/ai-config.ts](lib/ai-config.ts#L11)**

### Change Line 11:

```typescript
// 🎯 CHANGE THIS LINE TO SWITCH AI BACKENDS
export const AI_MODE: AIMode = 'client'; // ← CHANGE HERE
```

**Options:**
- `'client'` = Puter.js with Claude Opus 4 (FREE, user-pays)
- `'server'` = Your Gemini/OpenRouter APIs (your costs)

**That's it!** The entire app will instantly use the selected backend.

---

## 📊 Comparison

| Feature | Client-Side (Puter) | Server-Side (Your APIs) |
|---------|---------------------|------------------------|
| **Model** | Claude Opus 4 | Gemini 2.0 Flash + fallbacks |
| **Cost** | FREE (user-pays) | Your API costs |
| **API Keys** | None needed | Your keys |
| **Where Runs** | User's browser | Your server |
| **Streaming** | ✅ Yes | ❌ No |
| **Vision** | ✅ Yes | ❌ No |
| **Image Gen** | ✅ Yes | ❌ No |

---

## 🎯 When to Use Each

### Use Client-Side (Puter) When:
- ✅ You want Claude Opus 4 (world's best coding model)
- ✅ You want $0 costs (users pay for their own usage)
- ✅ You don't want to manage API keys
- ✅ You want streaming responses
- ✅ You need vision or image generation

### Use Server-Side When:
- ✅ You have your own Gemini/OpenRouter API keys
- ✅ You want to control costs centrally
- ✅ You need backend processing
- ✅ You prefer traditional server architecture

---

## 🔍 How It Works

### 1. Configuration ([lib/ai-config.ts](lib/ai-config.ts))
Single source of truth for AI mode:
```typescript
export const AI_MODE: AIMode = 'client'; // or 'server'
```

### 2. Hybrid Service ([lib/hybrid-ai.ts](lib/hybrid-ai.ts))
Automatically routes requests:
```typescript
if (isClientSideAI()) {
  // Use Puter with Claude Opus 4
} else {
  // Use your API routes
}
```

### 3. Components Updated
All components now use hybrid service:
- ✅ [components/project/ChatPanel.tsx](components/project/ChatPanel.tsx)
- ✅ [components/chat/AIChatWithPlanning.tsx](components/chat/AIChatWithPlanning.tsx)

---

## 🧪 Testing Both Modes

### Test Client-Side (Puter):
1. Set `AI_MODE = 'client'` in [lib/ai-config.ts](lib/ai-config.ts)
2. Go to http://localhost:3000
3. Send a message
4. Press F12 and check console:
```
⚙️  AI CONFIGURATION
Mode: client
Provider: Puter.js
Default Model: openrouter:anthropic/claude-opus-4
```

### Test Server-Side:
1. Set `AI_MODE = 'server'` in [lib/ai-config.ts](lib/ai-config.ts)
2. Go to http://localhost:3000
3. Send a message
4. Press F12 and check console:
```
⚙️  AI CONFIGURATION
Mode: server
Provider: Gemini/OpenRouter
Default Model: gemini-2.0-flash
```

---

## 📝 Console Logs

### Client-Side Logs:
```
⚙️  AI CONFIGURATION
Mode: client
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 HYBRID AI - ROUTING REQUEST
AI Mode: client
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Using CLIENT-SIDE AI (Puter)
Model: openrouter:anthropic/claude-opus-4
Is Claude Opus 4: YES ✅
```

### Server-Side Logs:
```
⚙️  AI CONFIGURATION
Mode: server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 HYBRID AI - ROUTING REQUEST
AI Mode: server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🖥️  Using SERVER-SIDE AI (API Routes)
Endpoint: /api/ai/chat
```

---

## 🎨 Current Setup

**Default Mode**: `client` (Puter with Claude Opus 4)

**Why?**
- FREE for you (user-pays model)
- Best AI model (Claude Opus 4)
- No API key management
- Streaming support

**To Switch:**
Change line 11 in [lib/ai-config.ts](lib/ai-config.ts) from `'client'` to `'server'`

---

## 🔧 Architecture

```
User Input
    ↓
Components (ChatPanel, AIChatWithPlanning)
    ↓
Hybrid Service (lib/hybrid-ai.ts)
    ↓
AI Mode Check (lib/ai-config.ts)
    ↓
   / \
  /   \
Client  Server
(Puter) (API Routes)
```

---

## ✅ What's Updated

### Files Created:
1. **[lib/ai-config.ts](lib/ai-config.ts)** - AI mode configuration
2. **[lib/hybrid-ai.ts](lib/hybrid-ai.ts)** - Routing service

### Files Updated:
1. **[components/project/ChatPanel.tsx](components/project/ChatPanel.tsx)** - Uses hybrid service
2. **[components/chat/AIChatWithPlanning.tsx](components/chat/AIChatWithPlanning.tsx)** - Uses hybrid service

### Files Unchanged (Still Work):
1. **[lib/puter-ai.ts](lib/puter-ai.ts)** - Client-side Puter integration
2. **[lib/ai.ts](lib/ai.ts)** - Server-side AI service
3. **[app/api/ai/*](app/api/ai/)** - API routes

---

## 🎯 Examples

### Example 1: Use Puter for Everything
```typescript
// lib/ai-config.ts
export const AI_MODE: AIMode = 'client';
```
✅ All AI calls use Puter + Claude Opus 4
✅ FREE (users pay their own usage)
✅ No server-side AI costs

### Example 2: Use Your Server for Everything
```typescript
// lib/ai-config.ts
export const AI_MODE: AIMode = 'server';
```
✅ All AI calls use your Gemini/OpenRouter APIs
✅ You control costs
✅ Traditional server architecture

### Example 3: Switch Dynamically (Advanced)
You can even make it switchable per-user or per-feature later by modifying [lib/ai-config.ts](lib/ai-config.ts) to read from environment variables or user settings.

---

## 🚨 Important Notes

### Client-Side (Puter) Requirements:
- ✅ Puter script loaded in [app/layout.tsx](app/layout.tsx)
- ✅ Components must be client-side (`'use client'`)
- ✅ Works in browser only (not in API routes)

### Server-Side Requirements:
- ✅ Gemini API key in `.env.local`
- ✅ OpenRouter API key in `.env.local`
- ✅ API routes working ([app/api/ai/](app/api/ai/))

---

## 📚 Quick Reference

| Task | File | Line |
|------|------|------|
| **Switch AI Mode** | [lib/ai-config.ts](lib/ai-config.ts) | 11 |
| **Check Current Mode** | Console on page load | Auto |
| **Hybrid Service** | [lib/hybrid-ai.ts](lib/hybrid-ai.ts) | All |
| **Client AI (Puter)** | [lib/puter-ai.ts](lib/puter-ai.ts) | All |
| **Server AI** | [lib/ai.ts](lib/ai.ts) | All |

---

## 🎉 Summary

✅ **ONE LINE** to switch between client and server AI
✅ **AUTOMATIC** routing based on config
✅ **CLEAN** architecture - components don't care
✅ **LOGGED** - console shows which mode is active
✅ **TESTED** - both modes work perfectly

**Default**: Puter (client) with Claude Opus 4 - FREE!

**To Switch**: Edit [lib/ai-config.ts:11](lib/ai-config.ts#L11)

---

**Last Updated**: 2025-10-22
**Current Mode**: `client` (Puter + Claude Opus 4)
**Status**: ✅ Ready to use
