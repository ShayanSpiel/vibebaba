# Input Detector Intelligence Upgrade Plan

**Status**: Planning
**Goal**: Transform Input Detector from keyword-based to reasoning-based autonomous agent
**Architecture Decision**: Keep Input Detector and Context Analyzer separate

---

## Current Problems

### 1. Hybrid but Disjointed Architecture
- **Search intent detection**: Pure keyword matching (no AI reasoning)
- **Input requirement detection**: AI-powered but constrained by 100+ line prompt
- No unified reasoning layer

### 2. Hardcoded Patterns Everywhere

```typescript
// Hardcoded brand list (only 7 brands)
const knownBrands = ['stripe', 'linear', 'notion', 'vercel', 'airbnb', 'spotify', 'netflix'];

// Hardcoded keyword patterns
const brandMatch = lowerRequest.match(/(?:like|similar to|copy|clone|replicate)\s+(\w+)/i);

// Brittle keyword detection
if (lowerRequest.includes('design') || lowerRequest.includes('inspiration'))
if (lowerRequest.includes('code') || lowerRequest.includes('component'))
if (lowerRequest.includes('api') || lowerRequest.includes('documentation'))
```

**Problems**:
- Can't understand variations: "make it similar to that design tool we discussed" (referring to Figma)
- Breaks on natural language: "I want something with Stripe's vibe"
- Static list can't learn new patterns

### 3. Bloated, Inefficient Prompt

Current prompt: **100+ lines** with redundant rules and examples

```typescript
const prompt = `
⚠️ **CRITICAL - CHECK THESE FIRST (IN ORDER)**:
1. **UPLOADED FILES** - If user uploaded file(s)...
2. **CONVERSATION HISTORY** - If user already provided...

⚠️ **IMPORTANT: STYLING/LAYOUT REQUESTS NEVER NEED INPUT!**
If the request is about:
- Alignment, spacing, padding, margins
- Colors, fonts, sizes, styles
// ... 80 more lines of rules
`;
```

**Problems**:
- Wastes ~400+ tokens on instructions
- Unclear priority (everything marked "CRITICAL" or "IMPORTANT")
- AI may not follow all rules consistently
- Hard to maintain and extend

### 4. No Reasoning Preservation

```typescript
const analysis = JSON.parse(jsonMatch[0]);
// AI's reasoning is immediately discarded ❌

return {
  needsUserInput: true,
  userInputRequest: { type, question }
  // No confidence, no alternatives, no learning
};
```

**Missing**:
- Confidence scores
- Alternative actions considered
- Chain-of-thought reasoning
- Learning from past decisions

### 5. Not Actually a Router

Despite the name "input-detector", it doesn't route to different nodes:
- Only decides: **pause workflow** vs **continue to Context Analyzer**
- Context Analyzer does the actual routing (PM/UX/Backend/Frontend)
- Architectural confusion about responsibilities

---

## Architecture Decision: Keep Separate

### Why Keep Input Detector and Context Analyzer Separate?

**Input Detector** = Universal, domain-agnostic
- Can be reused for ANY agent system (code, content, data, customer support)
- Handles input validation and requirement detection
- Conversational intelligence built-in

**Context Analyzer** → Rename to **Tech Lead** = Domain-specific
- Specific to code editing workflows
- Understands codebase structure
- Routes to code-specific nodes (PM/UX/Backend/Frontend)

### Optimal Architecture

```
┌─────────────────────────────────────────────────┐
│         UNIVERSAL INPUT DETECTOR                │
│  (Reusable across all agent systems)            │
│                                                  │
│  Responsibilities:                               │
│  • Understand user intent with AI reasoning     │
│  • Detect missing requirements (API keys, etc)  │
│  • Converse with user if needed                 │
│  • Classify intent type (task/question/search)  │
│  • Pass enriched context to domain analyzers    │
└─────────────────┬───────────────────────────────┘
                  │
                  ├──────────────┬──────────────┬──────────────┐
                  ↓              ↓              ↓              ↓
         ┌────────────────┐ ┌─────────┐ ┌──────────┐  ┌──────────┐
         │ CODE ANALYZER  │ │CONTENT  │ │  DATA    │  │  FUTURE  │
         │                │ │ANALYZER │ │ANALYZER  │  │ ANALYZERS│
         │ Routes to:     │ │         │ │          │  │          │
         │ PM/UX/Backend/ │ │Routes   │ │Routes    │  │  ...     │
         │ Frontend/Editor│ │to other │ │to other  │  │          │
         └────────────────┘ │agents   │ │agents    │  └──────────┘
                            └─────────┘ └──────────┘
```

### Benefits

1. **Separation of Concerns**: Clear responsibilities between universal input handling and domain-specific routing
2. **Reusability**: Input Detector can be used for future non-code workflows
3. **Maintainability**: Update domain logic without affecting input handling
4. **Scalability**: Add new analyzers (ContentAnalyzer, DataAnalyzer) without touching Input Detector
5. **Intelligence**: Both use AI reasoning, but at different abstraction levels

---

## Implementation Plan

### Phase 1: Upgrade Input Detector to Universal Reasoning Agent

**File**: `lib/langgraph/nodes/input-detector/index.ts`

#### Objectives
- Remove ALL hardcoded patterns (brands, keywords, regex)
- Implement pure AI reasoning with optimized prompt (<50 lines)
- Make domain-agnostic (works for code AND future non-code workflows)
- Preserve reasoning context for downstream analyzers

#### Changes

1. **Remove keyword-based `detectSearchIntent()` function**
   - Current: 80+ lines of hardcoded patterns
   - Replace with: Single AI reasoning call

2. **Simplify main analysis prompt**
   - Current: 100+ lines
   - Target: 40 lines with clear structure
   - Use chain-of-thought reasoning

3. **Add reasoning preservation**
   ```typescript
   {
     canProceed: boolean,
     needsUserInput: boolean,
     intentType: 'question' | 'task' | 'search' | 'clarification',
     reasoningContext: {
       intent: "User wants to add authentication system",
       confidence: 0.95,
       entities: ["authentication", "login", "signup"],
       detectedRequirements: ["database", "sessions", "password-hashing"],
       suggestedAction: "route_to_code_analyzer",
       chainOfThought: [
         "User mentioned 'auth' keyword",
         "This requires user management",
         "Will need database collections",
         "Should route to PM for full planning"
       ],
       alternatives: [
         { action: "use_third_party", confidence: 0.6, reason: "Could suggest Auth0/Clerk" },
         { action: "minimal_auth", confidence: 0.4, reason: "Could start with simple login" }
       ]
     },
     nextAnalyzer: 'tech-lead' | 'content-analyzer' | 'data-analyzer'
   }
   ```

4. **New prompt structure** (~40 lines):
   ```typescript
   const prompt = `
   You are an intelligent input analyzer. Understand user intent and determine if you can proceed.

   REASONING PROCESS:
   1. What is the user trying to accomplish?
   2. What type of request is this? (question/task/search/clarification)
   3. What information is already available?
   4. What information is missing?
   5. What's the best next action?

   CONVERSATION HISTORY:
   ${conversationHistory || 'No previous conversation'}

   UPLOADED FILES:
   ${uploadedFiles.map(f => `• ${f.fileName} (${f.purpose})`).join('\n') || 'None'}

   USER INPUT:
   "${userInput}"

   AVAILABLE CONTEXT:
   ${artifacts ? `Previous analysis: ${artifacts}` : 'First message'}

   ANALYZE AND RETURN JSON:
   {
     "intent": "Brief description of what user wants",
     "intentType": "question" | "task" | "search" | "clarification",
     "confidence": 0.0-1.0,
     "entities": ["keyword1", "keyword2"],
     "missingInfo": ["api_key", "url"] or [],
     "canProceed": boolean,
     "suggestedAction": "answer_question" | "route_to_analyzer" | "ask_for_input",
     "reasoning": "I believe this is a... because...",
     "chainOfThought": ["step 1", "step 2", "step 3"],
     "alternatives": [
       { "action": "alternative approach", "confidence": 0.0-1.0, "reason": "why" }
     ]
   }
   `;
   ```

#### Implementation Steps

1. Create new function `analyzeIntentWithReasoning()`
2. Remove `detectSearchIntent()` function entirely
3. Update main `inputDetectorNodeImpl()` to use reasoning
4. Add reasoning context to state
5. Update workflow to pass reasoning to Tech Lead

---

### Phase 2: Rename Context Analyzer → Tech Lead

**File**: `lib/langgraph/nodes/context-analyzer/index.ts` → `lib/langgraph/nodes/tech-lead/index.ts`

#### Objectives
- Make it explicitly domain-specific (code only)
- Receive enriched context from Input Detector
- Focus ONLY on code routing decisions
- Optimize prompt (~50 lines)

#### Changes

1. **Rename directory and file**
   ```bash
   mv lib/langgraph/nodes/context-analyzer lib/langgraph/nodes/tech-lead
   ```

2. **Update function to receive reasoning context**
   ```typescript
   async function codeAnalyzerNodeImpl(state: AppGenState) {
     // Receive reasoning from Input Detector
     const inputReasoning = state.reasoningContext;

     console.log('[Tech Lead] 📥 Received intent:', inputReasoning.intent);
     console.log('[Tech Lead] 🎯 Confidence:', inputReasoning.confidence);

     // Now focus ONLY on code-specific analysis
     const codeAnalysis = await analyzeCodeChanges({
       userIntent: inputReasoning,
       files: state.files,
       backend: state.backendConfig,
       conversationHistory: await getConversationContext(state.projectId)
     });

     return {
       startNode: codeAnalysis.startNode,
       changeScope: codeAnalysis.scope,
       reasoning: codeAnalysis.explanation
     };
   }
   ```

3. **Simplify prompt** (remove intent detection since Input Detector already did it):
   ```typescript
   const prompt = `
   You are a code analyzer. The user's intent has been pre-analyzed.

   INPUT INTENT (from Input Detector):
   ${JSON.stringify(state.reasoningContext, null, 2)}

   CODEBASE CONTEXT:
   Files: ${files.map(f => `${f.path} (${f.content.length} chars)`).join('\n')}
   Has Database: ${state.backendConfig ? 'Yes' : 'No'}
   Collections: ${state.backendConfig?.collections?.map(c => c.name).join(', ') || 'None'}

   ROUTING DECISION:
   Based on the intent, determine which node should handle this:

   - "pm" → Feature requiring full planning (new system, backend collections)
   - "ux" → Design/style changes only
   - "backend" → Schema changes (add/modify fields)
   - "frontend" → UI changes (text, sections, components)
   - "answer" → Question that needs answering

   Return JSON:
   {
     "startNode": "pm" | "ux" | "backend" | "frontend" | "answer",
     "changeScope": "minor" | "moderate" | "major" | "structural",
     "affectsFeatures": boolean,
     "affectsDesign": boolean,
     "affectsBackend": boolean,
     "affectsFrontend": boolean,
     "reasoning": "Brief explanation of routing decision"
   }
   `;
   ```

4. **Update all imports and references**
   - Update `lib/langgraph/nodes/index.ts`
   - Update `lib/langgraph/workflow.ts`
   - Update type definitions

---

### Phase 3: Optimize Prompts with Chain-of-Thought

#### Input Detector Prompt Structure

```
┌─────────────────────────────────────┐
│ 1. CONTEXT                          │
│    - Conversation history           │
│    - Uploaded files                 │
│    - Available artifacts            │
├─────────────────────────────────────┤
│ 2. REASONING FRAMEWORK              │
│    - Understand: What does user want?│
│    - Classify: What type of request?│
│    - Check: What's missing?         │
│    - Decide: What's next action?    │
├─────────────────────────────────────┤
│ 3. OUTPUT SCHEMA                    │
│    - Structured JSON with reasoning │
│    - Chain-of-thought included      │
│    - Alternatives considered        │
└─────────────────────────────────────┘
```

**Key Improvements**:
- ✅ No hardcoded rules
- ✅ Clear reasoning steps
- ✅ Few-shot learning (3-5 dynamic examples based on context)
- ✅ Confidence scoring
- ✅ Alternative actions

#### Tech Lead Prompt Structure

```
┌─────────────────────────────────────┐
│ 1. PRE-ANALYZED INTENT              │
│    - From Input Detector            │
│    - User's goal already understood │
├─────────────────────────────────────┤
│ 2. CODEBASE CONTEXT                 │
│    - File structure                 │
│    - Database schema                │
│    - Existing features              │
├─────────────────────────────────────┤
│ 3. ROUTING LOGIC                    │
│    - Map intent to node             │
│    - Determine change scope         │
│    - Explain decision               │
└─────────────────────────────────────┘
```

**Key Improvements**:
- ✅ Receive pre-analyzed intent (no duplicate work)
- ✅ Focus on code-specific routing
- ✅ Simpler, more targeted prompt
- ✅ 50% token reduction

---

### Phase 4: Preserve Reasoning in Conversation Memory

#### Add Reasoning to Memory Store

```typescript
// After Input Detector analysis
await saveReasoningToMemory(state.projectId, {
  timestamp: Date.now(),
  node: 'input-detector',
  userInput: state.userDescription,
  reasoning: {
    intent: analysisData.intent,
    confidence: analysisData.confidence,
    entities: analysisData.entities,
    chainOfThought: analysisData.chainOfThought
  },
  decision: {
    canProceed: analysisData.canProceed,
    suggestedAction: analysisData.suggestedAction
  }
});

// After Tech Lead routing
await saveReasoningToMemory(state.projectId, {
  timestamp: Date.now(),
  node: 'tech-lead',
  routing: {
    startNode: analysisData.startNode,
    changeScope: analysisData.changeScope,
    reasoning: analysisData.reasoning
  }
});
```

#### Enable Cross-Request Learning

```typescript
// When analyzing new request, load past decisions
const pastDecisions = await loadPastDecisions(state.projectId);

// Include in prompt for context
const prompt = `
PAST DECISIONS (for context):
${pastDecisions.map(d => `
  User: "${d.userInput}"
  Intent: ${d.reasoning.intent}
  Action: ${d.decision.suggestedAction}
  Result: ${d.outcome}
`).join('\n')}

This helps you understand the user's patterns and preferences.
`;
```

**Benefits**:
- Learn from successful decisions
- Avoid repeating mistakes
- Understand user preferences over time
- Cross-project pattern recognition

---

## Expected Outcomes

### Before (Current State)

```typescript
// Input Detector
if (request.includes('stripe') || request.includes('payment')) {
  // Hardcoded logic
}

// Prompt: 100+ lines of rules
// Output: { needsInput: boolean, question: string }
// Reasoning: ❌ Discarded
```

### After (Reasoning-Based)

```typescript
// Input Detector
const reasoning = await analyzeIntent(userInput, context);
// AI decides: "This is a payment feature request"
// Confidence: 0.95
// Alternatives: ["use Stripe", "use PayPal", "custom solution"]

// Prompt: 40 lines of reasoning framework
// Output: { intent, confidence, chainOfThought, alternatives }
// Reasoning: ✅ Preserved and used downstream
```

### Key Improvements

✅ **Truly autonomous reasoning**: AI thinks "user is asking question → converse" vs "user wants feature → route to PM"
✅ **No hardcoded patterns**: Fully adaptive to new brands, APIs, patterns
✅ **60-70% token reduction**: Optimized prompts (40 lines vs 100+ lines)
✅ **Reasoning preserved**: Context flows through entire workflow
✅ **Domain-agnostic Input Detector**: Reusable for future non-code agents
✅ **Clear separation**: Universal input handling vs code-specific routing
✅ **Scalable architecture**: Easy to add new domain analyzers
✅ **Learning capability**: Can learn from past decisions and user patterns

---

## Implementation Checklist

### Phase 1: Input Detector
- [ ] Create `analyzeIntentWithReasoning()` function
- [ ] Remove `detectSearchIntent()` function
- [ ] Simplify main prompt to 40 lines
- [ ] Add reasoning context to output
- [ ] Update state types for `reasoningContext`
- [ ] Test with various input types
- [ ] Measure token reduction

### Phase 2: Tech Lead
- [ ] Rename directory `context-analyzer` → `tech-lead`
- [ ] Update function to receive reasoning context
- [ ] Simplify prompt to 50 lines
- [ ] Update workflow routing
- [ ] Update all imports
- [ ] Test routing decisions
- [ ] Verify backward compatibility

### Phase 3: Prompt Optimization
- [ ] Implement chain-of-thought structure
- [ ] Add confidence scoring
- [ ] Add alternative actions
- [ ] Test prompt with edge cases
- [ ] Measure response quality
- [ ] A/B test old vs new prompts

### Phase 4: Memory Integration
- [ ] Add reasoning storage to memory system
- [ ] Load past decisions in prompts
- [ ] Implement learning from outcomes
- [ ] Test cross-request learning
- [ ] Monitor improvement over time

---

## Testing Strategy

### Test Cases for Input Detector

1. **Question Detection**
   - "How does authentication work?"
   - "Why isn't my form submitting?"
   - "What's the difference between POST and PUT?"

2. **Task Detection**
   - "Add authentication"
   - "Fix the login button color"
   - "Create a new products page"

3. **Missing Requirements**
   - "Integrate Stripe" → Should ask for API key
   - "Embed YouTube video" → Should ask for URL
   - "Add logo" → Should ask for image file

4. **Natural Language Variations**
   - "Make it look like that popular design tool" (Figma)
   - "I want something with Stripe's vibe"
   - "Copy the approach that Linear uses"

5. **Conversational Context**
   - User: "I want to add a blog"
   - AI: "Do you need authentication?"
   - User: "Yes" ← Should understand this refers to blog + auth

### Test Cases for Tech Lead

1. **Feature Routing** → PM node
   - "Add authentication system"
   - "Add shopping cart"
   - "Add blog with posts"

2. **Design Routing** → UX node
   - "Change primary color to blue"
   - "Make buttons rounded"
   - "Add fade-in animation"

3. **Backend Routing** → Backend node
   - "Add 'bio' field to users"
   - "Make email required"
   - "Add 'published' boolean to posts"

4. **Frontend Routing** → Frontend node
   - "Fix typo on homepage"
   - "Add testimonials section"
   - "Change button text"

### Success Metrics

- **Token Reduction**: 60-70% reduction in prompt tokens
- **Accuracy**: 95%+ correct routing decisions
- **Flexibility**: Handle natural language variations correctly
- **Learning**: Improve accuracy over time with feedback
- **Reasoning Quality**: Chain-of-thought makes sense to humans

---

## Risks and Mitigations

### Risk 1: AI Not Following Reasoning Structure

**Mitigation**:
- Use structured output with JSON schema validation
- Add few-shot examples with correct reasoning
- Test with multiple models (Claude, GPT-4, Gemini)

### Risk 2: Token Cost Increase

**Mitigation**:
- Optimized prompts reduce overall tokens
- Reasoning context is smaller than repetitive rules
- Cache conversation history

### Risk 3: Breaking Existing Workflows

**Mitigation**:
- Implement behind feature flag
- A/B test old vs new approach
- Gradual rollout with fallback to old system
- Comprehensive testing before release

### Risk 4: Reasoning Quality Degradation

**Mitigation**:
- Monitor reasoning output quality
- Human review of edge cases
- Continuous prompt refinement
- Feedback loop from user interactions

---

## Future Enhancements

### 1. Multi-Modal Input Understanding
- Analyze uploaded images (screenshots, designs)
- Extract brand colors from images
- Understand UI mockups

### 2. Proactive Suggestions
```typescript
reasoning: {
  intent: "User wants authentication",
  suggestions: [
    "Would you like to add password reset?",
    "Should I include social login (Google, GitHub)?",
    "Do you need email verification?"
  ]
}
```

### 3. Learning from User Feedback
```typescript
// After task completion
if (userSatisfied) {
  await reinforceLearning(reasoning, 'positive');
} else {
  await reinforceLearning(reasoning, 'negative');
}
```

### 4. Cross-Project Pattern Recognition
- "Most users who add auth also add password reset"
- "This type of e-commerce site usually needs these features"
- Learn industry-specific patterns

---

## References

**Related Files**:
- `lib/langgraph/nodes/input-detector/index.ts` - Current implementation
- `lib/langgraph/nodes/context-analyzer/index.ts` - To be renamed
- `lib/langgraph/workflow.ts` - Workflow routing
- `lib/langgraph/types.ts` - State types
- `lib/memory/conversation-memory.ts` - Memory system

**Related Documentation**:
- [LangGraph Workflow Documentation](./docs/guides/LANGGRAPH_GUIDE.md)
- [Memory System Guide](./docs/guides/MEMORY_GUIDE.md)
- [Node Architecture](./docs/architecture/system-overview.md)
