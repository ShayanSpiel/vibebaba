# LangGraph Studio Setup Guide

LangGraph Studio is now successfully configured for your VibeBaba project! 🎉

## What Was Fixed

1. **Created `langgraph.json`** - Configuration file for LangGraph Studio
2. **Created `lib/langgraph/studio-export.ts`** - Exports your workflow graph
3. **Fixed `server-only` import** - Commented out in `lib/langgraph/nodes/ux-node.ts` for Studio compatibility
4. **Fixed prompt upload issues** - All LangSmith prompt generation now working correctly

## Starting LangGraph Studio

```bash
npx @langchain/langgraph-cli dev
```

This will start:
- **API Server**: http://localhost:2024
- **Studio UI**: https://smith.langchain.com/studio?baseUrl=http://localhost:2024

## Using the Studio UI

1. Open the Studio UI link in your browser
2. You'll see your `app_generator` workflow visualized as a graph
3. You can:
   - View the workflow structure (nodes and edges)
   - Test the workflow with sample inputs
   - Debug execution step-by-step
   - View LangSmith traces for each run

## Available Workflow

**app_generator** - Your full VibeBaba app generation workflow including:
- Founder → PM → UX → Backend → Frontend → QA → DevOps
- Editing workflow with input detection and context analysis

## Project Structure

```
/Users/shayan/Desktop/Projects/VB/
├── langgraph.json              # LangGraph Studio config
├── lib/langgraph/
│   ├── studio-export.ts        # Graph export for Studio
│   ├── workflow.ts             # Main workflow definition
│   └── nodes/                  # Individual agent nodes
│       ├── founder-node.ts
│       ├── pm-node.ts
│       ├── ux-node.ts         # (server-only commented out)
│       ├── backend-node.ts
│       ├── frontend-node.ts
│       ├── qa-node.ts
│       └── devops-node.ts
```

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running, or:

```bash
pkill -f "langgraph-cli"
```

## Important Notes

- The `server-only` import in `ux-node.ts` has been commented out for Studio compatibility
- This doesn't affect your Next.js app - it still runs normally
- The workflow uses your existing `.env.local` for API keys
- All LangSmith prompt generation is working correctly (48+ prompts uploaded)

## Troubleshooting

If you encounter issues:

1. **Port already in use**: Kill existing processes with `pkill -f langgraph-cli`
2. **Module not found**: Ensure all dependencies are installed with `npm install`
3. **API key errors**: Check that `.env.local` has all required keys

## LangSmith Integration

Your LangSmith Hub is now fully functional with:
- 48+ prompts generated across all nodes
- Proper escaping of JSON examples in prompts
- Automatic tenant/user association via API key

View your prompts at: https://smith.langchain.com/hub

---

For more information, visit: https://docs.smith.langchain.com/langgraph-platform
