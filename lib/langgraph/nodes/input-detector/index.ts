// @ts-nocheck
import { generateWithLogging } from '../../utils/logging/ai-with-logging';
import type { AppGenState } from '../../types';
import { emitChatMessage, emitNodeStart, emitNodeComplete, emitNodeError } from '../../utils/logging/events';
import { getConversationContext, addAssistantMessage } from '@/lib/memory/conversation-memory';
import { withLangSmithTracing, traceAICall } from '@/lib/langsmith/tracing';

/**
 * Fast search intent detection using keyword heuristics (NO AI call)
 * Returns search intent if external search is needed
 */
function detectSearchIntent(request: string): {
  category: 'design-inspiration' | 'code-search' | 'brand-clone' | 'api-documentation' | 'general';
  searchSources: string[];
  brandName?: string;
  techStack?: string[];
  features?: string[];
} | null {
  const lowerRequest = request.toLowerCase();

  // Brand clone detection (high priority)
  const brandMatch = lowerRequest.match(/(?:like|similar to|copy|clone|replicate)\s+(\w+)/i);
  const knownBrands = ['stripe', 'linear', 'notion', 'vercel', 'airbnb', 'spotify', 'netflix'];
  const detectedBrand = brandMatch?.[1];

  if (detectedBrand && knownBrands.includes(detectedBrand)) {
    return {
      category: 'brand-clone',
      searchSources: ['brand', 'exa'],
      brandName: detectedBrand,
    };
  }

  // Design inspiration detection
  if (
    (lowerRequest.includes('design') || lowerRequest.includes('inspiration') || lowerRequest.includes('modern')) &&
    (lowerRequest.includes('saas') || lowerRequest.includes('dashboard') || lowerRequest.includes('landing'))
  ) {
    return {
      category: 'design-inspiration',
      searchSources: ['exa', 'duckduckgo'],
    };
  }

  // Code search detection
  if (
    lowerRequest.includes('code') ||
    lowerRequest.includes('component') ||
    lowerRequest.includes('example') ||
    lowerRequest.includes('implementation')
  ) {
    // Detect tech stack
    const techStack: string[] = [];
    if (lowerRequest.includes('next') || lowerRequest.includes('nextjs')) techStack.push('nextjs');
    if (lowerRequest.includes('react')) techStack.push('react');
    if (lowerRequest.includes('typescript')) techStack.push('typescript');
    if (lowerRequest.includes('tailwind')) techStack.push('tailwind');

    return {
      category: 'code-search',
      searchSources: ['github', 'exa'],
      techStack: techStack.length > 0 ? techStack : undefined,
    };
  }

  // API documentation detection
  if (
    (lowerRequest.includes('api') || lowerRequest.includes('documentation') || lowerRequest.includes('docs')) &&
    (lowerRequest.includes('how to') || lowerRequest.includes('integrate'))
  ) {
    return {
      category: 'api-documentation',
      searchSources: ['exa', 'duckduckgo'],
    };
  }

  // General search (if user explicitly asks for information)
  if (
    lowerRequest.includes('find') ||
    lowerRequest.includes('search') ||
    lowerRequest.includes('look up') ||
    lowerRequest.includes('what is')
  ) {
    return {
      category: 'general',
      searchSources: ['exa', 'duckduckgo', 'brave'],
    };
  }

  // No search needed
  return null;
}

/**
 * INPUT DETECTOR NODE
 *
 * Analyzes user requests to detect if external input is needed:
 * - API keys (Stripe, OpenAI, etc.)
 * - Code snippets (existing components to integrate)
 * - Environment variables
 * - Clarifications (ambiguous requirements)
 *
 * CONCISE, USER-FRIENDLY PROMPTS - Minimal constraints, enable AI.
 */
async function inputDetectorNodeImpl(state: AppGenState): Promise<Partial<AppGenState>> {
  const startTime = Date.now();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 INPUT DETECTOR - Analyzing user request');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const userRequest = state.editingSession?.userRequest || state.userDescription;

  console.log(`[Input Detector] 📝 User Request: "${userRequest}"`);

  // ✅ EMIT NODE START
  emitNodeStart('input-detector', state, {
    userInput: userRequest,
    interpretation: 'Analyzing user request to detect if external input is needed',
    plan: 'Check for API keys, code snippets, URLs, or clarifications needed'
  });

  try {
    // ✅ PHASE 3: Get conversation context from memory (async)
    console.log('[Input Detector] 💬 Loading conversation memory...');
    const conversationContext = await getConversationContext(state.projectId);
    if (conversationContext) {
      console.log('[Input Detector] ✅ Loaded conversation context - will check if user already answered');
      console.log('[Input Detector] 📝 Context length:', conversationContext.length, 'characters');
      console.log('[Input Detector] 📝 Context preview:', conversationContext.substring(0, 200) + '...');
    } else {
      console.log('[Input Detector] ⚠️ No conversation context found - this might cause repeated questions');
    }

  // SHORT, CONCISE PROMPT - Enable AI with minimal constraints
  const prompt = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CONVERSATION HISTORY (CHECK THIS FIRST!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${conversationContext || 'No previous conversation history'}

⚠️ CRITICAL: If the user already provided information in the conversation above, DO NOT ask for it again!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 CURRENT REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyze this user request and check if external input is needed.

USER REQUEST: "${userRequest}"

EXISTING FILES: ${state.files?.map((f: any) => f.path).join(', ') || 'None'}

📎 UPLOADED FILES: ${state.uploadedFiles?.length || 0} file(s)
${state.uploadedFiles && state.uploadedFiles.length > 0
  ? state.uploadedFiles.map(f => `  • ${f.fileName} (${f.purpose || 'general'}): ${f.fileUrl}`).join('\n')
  : '  • None'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **CRITICAL - CHECK THESE FIRST (IN ORDER)**:
1. **UPLOADED FILES** - If user uploaded file(s) and request references them, DON'T ask for URL/file again!
2. **CONVERSATION HISTORY** - If user already provided information in a previous message, DON'T ask again!

⚠️ **IMPORTANT: STYLING/LAYOUT REQUESTS NEVER NEED INPUT!**
If the request is about:
- Alignment, spacing, padding, margins
- Colors, fonts, sizes, styles
- Layout, positioning, responsive design
- Fixing visual bugs or UI inconsistencies
→ ALWAYS return {"needsInput": false, "canProceed": true}
→ These requests work with EXISTING files and DON'T need external resources!

Check if you need:
- **API keys** (Stripe, OpenAI, Google Maps, etc.)
- **Code snippets** (existing component to integrate)
- **Env variables** (database URL, app name)
- **Embed/iframe content** (YouTube videos, maps, external widgets)
  - "embed youtube video" → MUST ask for specific URL (unless already provided in conversation)
  - "add google map" → MUST ask for location/API key (unless already provided)
  - "embed spotify playlist" → MUST ask for embed URL (unless already provided)
- **Links, URLs, Images** (static resources)
  - "add NEW logo image" → Ask for image URL/file (unless already provided)
  - "link to documentation" → Ask for URL (unless already provided)
- **Clarifications** (ambiguous/vague requests ABOUT NEW FEATURES ONLY)

Return JSON:
{
  "needsInput": true/false,
  "inputType": "api_key" | "code_snippet" | "env_var" | "url" | "file" | "clarification" | null,
  "question": "User-friendly question",
  "canProceed": true/false
}

🚨 MANDATORY RULES (FOLLOW IN ORDER):

1. **CHECK CONVERSATION HISTORY FIRST** ⚠️ MOST IMPORTANT!
   - If user already provided information in previous messages, set canProceed=true and needsInput=false
   - Look for API keys, URLs, design preferences, brand colors, etc. in conversation history
   - DO NOT ask for information that's already in the conversation history above

2. **CHECK UPLOADED FILES SECOND**
   - If files uploaded and request references them (e.g., "this image", "this screenshot", "use this"), set canProceed=true and needsInput=false

3. **Only ask if ESSENTIAL** (cannot proceed without it)
4. Prefer reasonable defaults when possible
5. Questions must be specific & actionable
6. Keep questions friendly & conversational
7. For embeds (YouTube, maps, etc.), ONLY ask for URL if NOT provided in conversation OR uploaded files

**EXAMPLES:**

1. Uploaded file → no input needed
REQUEST: "Based on this screenshot"
UPLOADED: screenshot.png
→ {"needsInput": false, "canProceed": true}

2. API key needed
REQUEST: "Integrate Stripe"
→ {"needsInput": true, "inputType": "api_key", "question": "Please share your Stripe API key", "canProceed": false}

3. URL needed
REQUEST: "Embed YouTube video"
→ {"needsInput": true, "inputType": "url", "question": "Which video URL?", "canProceed": false}

4. Already in conversation
REQUEST: "Use that video"
CONVERSATION: user provided URL before
→ {"needsInput": false, "canProceed": true}

5. Simple edits → no input needed
REQUEST: "Change button color" or "Fix spacing"
→ {"needsInput": false, "canProceed": true}

Return ONLY JSON.`;

  const response = await traceAICall('input-detector-analysis', async () => {
    return await generateWithLogging({
      prompt,
      projectId: state.projectId,
      nodeName: 'input-detector',
      callType: 'detection',
      estimatedTokens: Math.ceil(prompt.length / 4)
    });
  }, {
    userRequest,
    uploadedFilesCount: state.uploadedFiles?.length || 0,
    hasConversationContext: !!conversationContext
  });

  console.log('[Input Detector] 📝 AI RESPONSE:', response.substring(0, 200));

  // Parse response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.log('[Input Detector] ⚠️ Parse failed - proceeding');
    return { needsUserInput: false };
  }

  const analysis = JSON.parse(jsonMatch[0]);

    if (analysis.needsInput && !analysis.canProceed) {
      console.log('[Input Detector] ⚠️ User input required');
      console.log(`[Input Detector]   Type: ${analysis.inputType}`);
      console.log(`[Input Detector]   Question: "${analysis.question}"`);

      // CONVERSATION MEMORY: Track input detector's question
      await addAssistantMessage(state.projectId, analysis.question, 'input-detector');
      console.log('[Input Detector] 💬 Tracked question in conversation memory');

      // Send the question to chat as a conversational message
      emitChatMessage(
        state.projectId,
        analysis.question,
        {
          type: 'question',
          requiresResponse: true,
          inputType: analysis.inputType
        }
      );

      // ✅ EMIT NODE COMPLETE (input required)
      const duration = Date.now() - startTime;
      emitNodeComplete('input-detector', state, duration, {
        taskDescription: 'Analyzed user request for input requirements',
        success: true,
        output: { needsInput: true, inputType: analysis.inputType },
        summary: `Input required: ${analysis.question}`
      });

      return {
        needsUserInput: true,
        userInputRequest: {
          type: analysis.inputType,
          question: analysis.question
        }
      };
    }

    console.log('[Input Detector] ✅ No input needed - proceeding');

    // CONVERSATION MEMORY: Track successful detection (no input needed)
    await addAssistantMessage(state.projectId, 'Analyzed request - no additional input needed', 'input-detector');
    console.log('[Input Detector] 💬 Tracked assistant response in conversation memory');

    // ========== NEW: DETECT SEARCH INTENT USING FAST HEURISTICS ==========
    console.log('[Input Detector] 🔍 Detecting search intent...');
    const searchIntent = detectSearchIntent(userRequest);

    if (searchIntent) {
      console.log(`[Input Detector] ✅ Search intent detected: ${searchIntent.category}`);
      console.log(`[Input Detector]   Sources: ${searchIntent.searchSources.join(', ')}`);
      if (searchIntent.brandName) {
        console.log(`[Input Detector]   Brand: ${searchIntent.brandName}`);
      }
    } else {
      console.log('[Input Detector] ℹ️  No search intent detected');
    }

    // ✅ EMIT NODE COMPLETE (no input needed)
    const duration = Date.now() - startTime;
    emitNodeComplete('input-detector', state, duration, {
      taskDescription: 'Analyzed user request for input requirements',
      success: true,
      output: { needsInput: false, searchIntent },
      summary: 'No input needed - proceeding with generation'
    });

    return {
      needsUserInput: false,
      searchIntent  // NEW: Pass search intent to next nodes
    };
  } catch (error: any) {
    console.error('[Input Detector] ❌ Error:', error);

    // ✅ EMIT NODE ERROR
    emitNodeError('input-detector', state, error, {
      taskDescription: 'Analyzing user request for input requirements',
      output: { error: error.message }
    });

    // Fail safe - proceed without input detection
    return { needsUserInput: false };
  }
}


// Export traced version of input detector node
export const inputDetectorNode = withLangSmithTracing('input-detector', inputDetectorNodeImpl);
