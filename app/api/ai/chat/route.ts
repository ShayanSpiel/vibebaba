import { NextRequest, NextResponse } from "next/server";
import { generateWithFallback } from "@/lib/ai/ai";
import { getAuthenticatedUser } from "@/lib/database/pocketbase-middleware";
import { checkAndResetDailyTokens } from "@/lib/database/pocketbase-credits";
import { conversationMemoryStore } from "@/lib/memory/conversation-memory";
// PHASE 3: Accurate token estimation and reservation
import { getTokenEstimator } from "@/lib/credits/token-estimator";
import { initializeWorkflowWithCreditCheck, trackNodeExecution, finalizeWorkflow, cancelWorkflow } from "@/lib/langgraph/credit-aware-workflow";

/**
 * Determines if request qualifies for quick edit (skips context analysis)
 */
function shouldUseQuickEdit(
  userRequest: string,
  files: Array<{ path: string; content: string }>,
  stage: string
): boolean {
  const request = userRequest.toLowerCase();

  // Must be short request
  if (userRequest.split(' ').length > 15) return false;

  // Must be single file
  if (files.length > 1) return false;

  // Must be simple action keywords
  const simpleActions = ['change', 'update', 'fix', 'modify', 'adjust', 'set'];
  const hasSimpleAction = simpleActions.some(action => request.includes(action));
  if (!hasSimpleAction) return false;

  // Must NOT be complex actions
  const complexActions = ['add', 'create', 'new', 'remove', 'delete', 'rename', 'move', 'restructure'];
  const hasComplexAction = complexActions.some(action => request.includes(action));
  if (hasComplexAction) return false;

  // Must be minor change keywords
  const minorKeywords = ['color', 'font', 'size', 'text', 'title', 'heading', 'button', 'link'];
  const hasMinorKeyword = minorKeywords.some(kw => request.includes(kw));

  return hasMinorKeyword;
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, currentPlan, stage, prototypeCode, files, description, context, backendConfig, projectId } = await req.json();

    // PHASE 3: Accurate token estimation using tiktoken
    const estimator = getTokenEstimator();
    const userRequest = messages[messages.length - 1]?.content || "";

    // Build workflow context for estimation
    const workflowNodes = [
      {
        name: stage === 'planning' ? 'pm' : stage === 'frontend' ? 'frontend' : stage === 'backend' ? 'backend' : 'chat',
        context: {
          messages,
          plan: currentPlan,
          code: prototypeCode,
          files: files || []
        }
      }
    ];

    // Initialize workflow with credit check and reservation
    const creditCheck = await initializeWorkflowWithCreditCheck({
      userId: user.id,
      nodes: workflowNodes
    });

    if (!creditCheck.canProceed) {
      return NextResponse.json(
        {
          error: creditCheck.insufficientCredits
            ? "Insufficient tokens. Please purchase more credits."
            : creditCheck.error || "Failed to reserve credits",
          insufficientTokens: creditCheck.insufficientCredits,
          estimatedCost: creditCheck.estimatedCost,
          breakdown: creditCheck.breakdown
        },
        { status: 402 }
      );
    }

    const reservationId = creditCheck.reservationId!;
    const estimatedTokens = creditCheck.estimatedCost;

    console.log(`[Chat] Reserved ${estimatedTokens} tokens (reservation: ${reservationId})`)

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ PHASE 2: Load conversation memory from PocketBase
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('[Chat] 📦 Loading project memory...');
    const memory = projectId ? await conversationMemoryStore.loadMemory(projectId) : null;

    if (memory) {
      console.log('[Chat] ✅ Loaded memory:');
      console.log(`  - Messages: ${memory.messages.length}`);
      console.log(`  - Files: ${memory.projectConfig?.files?.length || 0}`);
      console.log(`  - Backend: ${memory.projectConfig?.backendConfig ? 'YES' : 'NO'}`);
    } else {
      console.log('[Chat] ℹ️  No memory found (first interaction or no projectId)');
    }

    // Extract project context and user preferences from memory
    const projectContext = memory?.projectConfig || null;
    const userPreferences = (projectContext as any)?.userPreferences || {
      colorScheme: 'modern',
      complexity: 'balanced',
      features: []
    };
    const storedConversationHistory = memory?.messages || [];

    // Build conversation context from current messages
    const conversationHistory = messages.map((msg: any) =>
      `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
    ).join("\n\n");

    const memoryContext = conversationHistory; // Current messages for now

    // Different behavior based on stage
    if (stage === "planning") {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // USE PM NODE FOR PLANNING (FULLY AGENTIC)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      console.log('[Chat] 🚀 Using pmNode for planning (fully agentic)');

      const { pmNode } = await import('@/lib/langgraph/nodes');

      // Create temp state for PM node
      const tempState: any = {
        userDescription: description || messages[messages.length - 1]?.content || '',
        userId: user.id,
        projectId: projectId || 'chat-session',
        plan: currentPlan,
        completedNodes: [],
        errors: [],
        artifacts: new Map(),
        stage: 'planning'
      };

      // Execute PM node
      const pmResult = await pmNode(tempState);
      const updatedPlan = pmResult.plan || currentPlan;

      // Build conversational response
      const userMessage = messages[messages.length - 1]?.content || '';
      const responseText = `I've updated the plan based on your request. Here's the refined development plan:

${updatedPlan}

Let me know if you'd like to make any adjustments!`;

      // PHASE 3: Finalize reservation (credits already consumed from reservation during workflow)
      await finalizeWorkflow(reservationId);

      // Store conversation in memory (already handled by conversationMemoryStore)
      console.log('[Chat] Conversation stored in memory via conversationMemoryStore');

      return NextResponse.json({ response: responseText, updatedPlan });
    }

    else if (stage === "building" || stage === "editing" || (stage === "complete" && files && files.length > 0)) {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // NEW: USE LANGGRAPH EDITING WORKFLOW (AGENTIC & ROLE-BASED)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      console.log('[Chat] 🚀 Using LangGraph editing workflow (role-based agents)');

      const userRequest = messages[messages.length - 1].content;
      const currentFiles = files || [{ path: 'index.html', content: prototypeCode }];

      // Detect if this qualifies as a quick edit
      const isQuickEdit = shouldUseQuickEdit(userRequest, currentFiles, stage);
      console.log(`[Chat] 🔍 Edit type: ${isQuickEdit ? 'QUICK' : 'FULL'}`);

      // Import appropriate workflow
      const { editingWorkflow, quickEditWorkflow } = await import('@/lib/langgraph/workflows/editing-workflow');
      const workflowFn = isQuickEdit ? quickEditWorkflow : editingWorkflow;

      try {
        // Execute workflow with memory-enhanced context
        const enhancedProjectContext = {
          projectId: projectId || 'chat-session',
          userId: user.id,
          plan: currentPlan || projectContext?.plan,
          description: description,
          backendConfig,
          context,
          stage,
          // Add memory context
          userPreferences,
          projectMemory: projectContext,
          conversationMemory: storedConversationHistory
        };

        // Use detected workflow (quick or full)
        const workflowResult = await workflowFn({
          files: currentFiles,
          userRequest,
          projectContext: enhancedProjectContext,
          conversationHistory: messages
        });

        // PHASE 3: Finalize reservation (credits already consumed during workflow)
        await finalizeWorkflow(reservationId);

        // NEW: Check if workflow is paused waiting for user input
        if (workflowResult.needsUserInput && workflowResult.userInputRequest) {
          console.log('[Chat] ⏸️  Workflow paused - user input required');
          console.log(`[Chat]   Type: ${workflowResult.userInputRequest.type}`);
          console.log(`[Chat]   Question: "${workflowResult.userInputRequest.question}"`);

          // The question has already been sent to chat via emitChatMessage in input-detector-node
          // Just return a response indicating we're waiting
          return NextResponse.json({
            response: workflowResult.userInputRequest.question,
            needsUserInput: true,
            inputType: workflowResult.userInputRequest.type,
            files: currentFiles, // Return original files (unchanged)
            updatedCode: currentFiles[0]?.content || '',
            updatedFiles: currentFiles
          });
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🚨 [Chat API] EDITING WORKFLOW COMPLETED - BUILDING RESPONSE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Build response message with role-based execution
        const roleMapping: Record<string, string> = {
          'input-detector': 'Input Validator',
          'context-analyzer': 'Team Lead',
          'editor': 'Engineer',
          'qa': 'QA'
        };

        const roles = workflowResult.aiMetadata.nodesExecuted
          .map(node => roleMapping[node] || node)
          .join(' → ');

        // Build file changes summary
        const fileChangeSummary = workflowResult.fileChanges && workflowResult.fileChanges.length > 0
          ? workflowResult.fileChanges.map(fc => {
              const action = fc.changeType === 'added' ? '➕ Added' : fc.changeType === 'deleted' ? '🗑️ Deleted' : '✏️ Edited';
              return `${action}: **${fc.path}**`;
            }).join('\n')
          : workflowResult.changesApplied.map(c => `- ${c}`).join('\n');

        const validationInfo = workflowResult.validationResult ? `
- Errors: ${workflowResult.validationResult.report?.errors?.length || 0}
- Warnings: ${workflowResult.validationResult.report?.warnings?.length || 0}
- Auto-Fixed: ${workflowResult.validationResult.report?.fixed?.length || 0}
${workflowResult.debugAttempts ? `- Debug Attempts: ${workflowResult.debugAttempts}` : ''}
` : '';

        // Use editor's formatted message if available, otherwise fall back to generic message
        console.log('[Chat] 🔍 WORKFLOW RESULT RECEIVED:');
        console.log('[Chat]    - editorMessage exists:', !!workflowResult.editorMessage);
        console.log('[Chat]    - editorMessage preview:', workflowResult.editorMessage ? workflowResult.editorMessage.substring(0, 100) + '...' : 'MISSING');
        console.log('[Chat]    - lastCheckpointId:', workflowResult.lastCheckpointId);

        const responseMessage = workflowResult.editorMessage || `✅ Changes applied successfully!

📋 **Details:**
- Roles: ${roles}
- Files Modified: ${workflowResult.files.length}
- Duration: ${workflowResult.aiMetadata.totalDuration}ms
${validationInfo}

🎯 **Changes:**
${fileChangeSummary}

**🌐 The browser** is now showing your updated app with these changes!`;

        // Store conversation in memory
        if (projectId) {
          // Memory storage handled by conversationMemoryStore
        }

        console.log('[Chat] Editing conversation stored in memory via conversationMemoryStore');
        console.log('[Chat] 🔍 FINAL RESPONSE TO FRONTEND:');
        console.log('[Chat]    - response message (first 100 chars):', responseMessage.substring(0, 100) + '...');
        console.log('[Chat]    - lastCheckpointId:', workflowResult.lastCheckpointId);
        console.log('[Chat]    - fileChanges count:', workflowResult.fileChanges?.length || 0);

        return NextResponse.json({
          response: responseMessage,
          updatedCode: workflowResult.updatedCode,
          updatedFiles: workflowResult.files,
          files: workflowResult.files,
          aiMetadata: workflowResult.aiMetadata,
          validation: workflowResult.validationResult?.report,
          // CRITICAL: Pass through data for enhanced UI (revert button, file lists, features)
          fileChanges: workflowResult.fileChanges,
          changesApplied: workflowResult.changesApplied,
          lastCheckpointId: workflowResult.lastCheckpointId
        });

      } catch (error: any) {
        console.error('[Chat] LangGraph workflow error:', error);

        // Fallback error response
        return NextResponse.json(
          {
            error: `Failed to apply changes: ${error.message}`,
            details: 'The editing system encountered an error. Please try rephrasing your request or try again.'
          },
          { status: 500 }
        );
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FALLBACK: If files present but stage not specified, treat as editing
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    else if (files && files.length > 0) {
      console.log('[Chat] ⚠️ No stage specified but files present - treating as editing request');

      const userRequest = messages[messages.length - 1].content;
      const currentFiles = files;

      // Detect if this qualifies as a quick edit
      const isQuickEdit = shouldUseQuickEdit(userRequest, currentFiles, 'editing');
      console.log(`[Chat] 🔍 Edit type: ${isQuickEdit ? 'QUICK' : 'FULL'}`);

      // Import appropriate workflow
      const { editingWorkflow, quickEditWorkflow } = await import('@/lib/langgraph/workflows/editing-workflow');
      const workflowFn = isQuickEdit ? quickEditWorkflow : editingWorkflow;

      try {
        const enhancedProjectContext = {
          projectId: projectId || 'chat-session',
          userId: user.id,
          plan: currentPlan || projectContext?.plan,
          description: description,
          backendConfig,
          context,
          stage: 'editing',
          userPreferences,
          projectMemory: projectContext,
          conversationMemory: storedConversationHistory
        };

        const workflowResult = await workflowFn({
          files: currentFiles,
          userRequest,
          projectContext: enhancedProjectContext,
          conversationHistory: messages
        });

        // PHASE 3: Finalize reservation (credits already consumed during workflow)
        await finalizeWorkflow(reservationId);

        // NEW: Check if workflow is paused waiting for user input
        if (workflowResult.needsUserInput && workflowResult.userInputRequest) {
          console.log('[Chat] ⏸️  Workflow paused - user input required');

          return NextResponse.json({
            response: workflowResult.userInputRequest.question,
            needsUserInput: true,
            inputType: workflowResult.userInputRequest.type,
            files: currentFiles,
            updatedCode: currentFiles[0]?.content || '',
            updatedFiles: currentFiles
          });
        }

        // Build response message with role-based execution (Quick Edit)
        const roleMapping2: Record<string, string> = {
          'input-detector': 'Input Validator',
          'context-analyzer': 'Team Lead',
          'editor': 'Engineer',
          'qa': 'QA'
        };

        const roles2 = workflowResult.aiMetadata.nodesExecuted
          .map(node => roleMapping2[node] || node)
          .join(' → ');

        // Build file changes summary
        const fileChangeSummary2 = workflowResult.fileChanges && workflowResult.fileChanges.length > 0
          ? workflowResult.fileChanges.map(fc => {
              const action = fc.changeType === 'added' ? '➕ Added' : fc.changeType === 'deleted' ? '🗑️ Deleted' : '✏️ Edited';
              return `${action}: **${fc.path}**`;
            }).join('\n')
          : workflowResult.changesApplied.map((c: string) => `- ${c}`).join('\n');

        const validationInfo = workflowResult.validationResult ? `
- Errors: ${workflowResult.validationResult.report?.errors?.length || 0}
- Warnings: ${workflowResult.validationResult.report?.warnings?.length || 0}
- Auto-Fixed: ${workflowResult.validationResult.report?.fixed?.length || 0}
${workflowResult.debugAttempts ? `- Debug Attempts: ${workflowResult.debugAttempts}` : ''}
` : '';

        // Use editor's formatted message if available, otherwise fall back to generic message
        const responseMessage = workflowResult.editorMessage || `✅ Changes applied successfully!

📋 **Details:**
- Roles: ${roles2}
- Files Modified: ${workflowResult.files.length}
- Duration: ${workflowResult.aiMetadata.totalDuration}ms
${validationInfo}

🎯 **Changes:**
${fileChangeSummary2}

**🌐 The browser** is now showing your updated app with these changes!`;

        // Store conversation in memory
        console.log('[Chat] Editing workflow completed successfully');

        return NextResponse.json({
          response: responseMessage,
          updatedCode: workflowResult.updatedCode,
          updatedFiles: workflowResult.files,
          files: workflowResult.files,
          aiMetadata: workflowResult.aiMetadata,
          validation: workflowResult.validationResult?.report,
          // CRITICAL: Pass through data for enhanced UI (revert button, file lists, features)
          fileChanges: workflowResult.fileChanges,
          changesApplied: workflowResult.changesApplied,
          lastCheckpointId: workflowResult.lastCheckpointId
        });

      } catch (error: any) {
        console.error('[Chat] Editing workflow error:', error);
        return NextResponse.json(
          { error: `Failed to apply changes: ${error.message}`, details: error.stack },
          { status: 500 }
        );
      }
    }

    // No action - return acknowledgment
    console.log('[Chat] ⚠️ No matching condition - stage:', stage, 'files:', files?.length || 0);
    return NextResponse.json({ response: "I'm ready to help! Please let me know what you'd like to do." });
  } catch (error: any) {
    console.error("Error in chat:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
