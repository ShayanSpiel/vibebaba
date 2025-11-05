// @ts-nocheck
import { generateWithLogging } from '@/lib/langgraph/ai-with-logging';
import type { AppGenState } from '../types';
import { emitChatMessage } from '../events';
import { getConversationContext, addAssistantMessage } from '@/lib/memory/conversation-memory';

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
export async function inputDetectorNode(state: AppGenState): Promise<Partial<AppGenState>> {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 INPUT DETECTOR - Analyzing user request');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const userRequest = state.editingSession?.userRequest || state.userDescription;

  console.log(`[Input Detector] 📝 User Request: "${userRequest}"`);

  // CONVERSATION MEMORY: Get conversation context for better input detection
  console.log('[Input Detector] 💬 Loading conversation memory...');
  const conversationContext = getConversationContext(state.projectId);
  if (conversationContext) {
    console.log('[Input Detector] 💬 Conversation context loaded - checking previous messages');
  }

  // SHORT, CONCISE PROMPT - Enable AI with minimal constraints
  const prompt = `${conversationContext || ''}

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

Check if you need:
- **API keys** (Stripe, OpenAI, Google Maps, etc.)
- **Code snippets** (existing component to integrate)
- **Env variables** (database URL, app name)
- **Embed/iframe content** (YouTube videos, maps, external widgets)
  - "embed youtube video" → MUST ask for specific URL (unless already provided in conversation)
  - "add google map" → MUST ask for location/API key (unless already provided)
  - "embed spotify playlist" → MUST ask for embed URL (unless already provided)
- **Links, URLs, Images** (static resources)
  - "add logo image" → Ask for image URL/file (unless already provided)
  - "link to documentation" → Ask for URL (unless already provided)
- **Clarifications** (ambiguous/vague requests)

Return JSON:
{
  "needsInput": true/false,
  "inputType": "api_key" | "code_snippet" | "env_var" | "url" | "file" | "clarification" | null,
  "question": "User-friendly question",
  "canProceed": true/false
}

RULES:
1. **CHECK UPLOADED FILES FIRST** - If files uploaded and request references them (e.g., "this image", "this screenshot", "use this"), set canProceed=true and needsInput=false
2. CHECK CONVERSATION HISTORY - if user already answered, set canProceed=true and needsInput=false
3. Only ask if ESSENTIAL (cannot proceed without it)
4. Prefer reasonable defaults when possible
5. Questions must be specific & actionable
6. Keep questions friendly & conversational
7. For embeds (YouTube, maps, etc.), ALWAYS ask for URL if not provided IN THE CONVERSATION

**FILE UPLOAD EXAMPLES:**

REQUEST: "Create a landing page based on this screenshot"
UPLOADED FILES: 1 file (screenshot.png)
→ {"needsInput": false, "canProceed": true}
REASON: User provided file, no need to ask

REQUEST: "Make my site look like this design"
UPLOADED FILES: 0 files
→ {"needsInput": true, "inputType": "file", "question": "I'd love to help! Please upload the design reference image you'd like me to use.", "canProceed": false}

REQUEST: "Use these brand assets"
UPLOADED FILES: 2 files (logo.png, colors.png)
→ {"needsInput": false, "canProceed": true}
REASON: User already provided assets

REQUEST: "Add my company logo"
UPLOADED FILES: 1 file (logo.svg)
→ {"needsInput": false, "canProceed": true}
REASON: Logo file already uploaded

REQUEST: "Based on this mockup, create the homepage"
UPLOADED FILES: 1 file (mockup.png)
→ {"needsInput": false, "canProceed": true}
REASON: Mockup file already uploaded

**OTHER EXAMPLES:**

EXAMPLES:

REQUEST: "Integrate Stripe"
CONVERSATION: None
→ {"needsInput": true, "inputType": "api_key", "question": "I'll add Stripe payments! Please share your Stripe API key (sk_test_... or sk_live_...)", "canProceed": false}

REQUEST: "Embed a YouTube video"
CONVERSATION: None
→ {"needsInput": true, "inputType": "url", "question": "Which YouTube video would you like to embed? Please share the video URL (e.g., https://youtube.com/watch?v=...)", "canProceed": false}

REQUEST: "Embed a YouTube video"
CONVERSATION: assistant: "Which YouTube video...", user: "https://youtube.com/watch?v=abc123"
→ {"needsInput": false, "inputType": null, "question": null, "canProceed": true}

REQUEST: "Add a contact form"
CONVERSATION: None
→ {"needsInput": false, "inputType": null, "question": null, "canProceed": true}

REQUEST: "Change button color"
CONVERSATION: None
→ {"needsInput": false, "inputType": null, "question": null, "canProceed": true}

REQUEST: "Embed Google Maps"
CONVERSATION: None
→ {"needsInput": true, "inputType": "url", "question": "I'll add a Google Map! What location or embed URL should I use?", "canProceed": false}

Return ONLY JSON.`;

  const response = await generateWithLogging({
    prompt,
    projectId: state.projectId,
    nodeName: 'input-detector',
    callType: 'detection',
    estimatedTokens: Math.ceil(prompt.length / 4)
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
    addAssistantMessage(state.projectId, analysis.question, 'input-detector');
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
  addAssistantMessage(state.projectId, 'Analyzed request - no additional input needed', 'input-detector');
  console.log('[Input Detector] 💬 Tracked assistant response in conversation memory');

  return { needsUserInput: false };
}
