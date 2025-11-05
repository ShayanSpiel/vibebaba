import { NextRequest, NextResponse } from "next/server";
import { generateWithFallback } from "@/lib/ai";
import { getAuthenticatedUser } from "@/lib/pocketbase-middleware";
import { checkAndResetDailyTokens } from "@/lib/pocketbase-credits";
import { getMemoryService, formatMemoryForPrompt, type ConversationMessage } from "@/lib/services/memory-service";
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
    // MEMORY INTEGRATION: Retrieve full context
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const memoryService = getMemoryService();
    const sessionId = `${user.id}_${projectId || 'chat'}_${stage || 'general'}`;

    // Fetch memory in parallel
    const [projectContext, userPreferences, storedConversationHistory] = await Promise.all([
      projectId ? memoryService.getProjectContext(projectId) : null,
      memoryService.getUserPreferences(user.id),
      memoryService.getConversationHistory(sessionId, 20) // Last 20 messages
    ]);

    console.log('[Chat] Memory context retrieved:', {
      hasProjectContext: !!projectContext,
      hasUserPreferences: !!userPreferences,
      storedMessagesCount: storedConversationHistory.length
    });

    // Build conversation context (combine in-memory + stored)
    const conversationHistory = messages.map((msg: any) =>
      `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
    ).join("\n\n");

    // Format memory context for AI
    const memoryContext = formatMemoryForPrompt({
      userPreferences,
      projectContext,
      conversationHistory: storedConversationHistory
    });

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

      // MEMORY: Store conversation
      if (userMessage) {
        await memoryService.storeConversation(sessionId, {
          role: 'user',
          content: userMessage,
          timestamp: Date.now(),
          metadata: { stage: 'planning' }
        });
        await memoryService.storeConversation(sessionId, {
          role: 'assistant',
          content: responseText,
          timestamp: Date.now(),
          metadata: { stage: 'planning' }
        });
        console.log('[Chat] Stored planning conversation in memory');
      }

      // MEMORY: Learn from interaction
      if (responseText.toLowerCase().includes('dark') || userMessage.toLowerCase().includes('dark')) {
        await memoryService.storeUserPreference(user.id, 'learningNotes', `Discussed dark mode in planning on ${new Date().toISOString()}`);
      }

      // MEMORY: Store plan in project context
      if (projectId && updatedPlan) {
        await memoryService.addObservation(`project_${projectId}`, `plan: ${updatedPlan.substring(0, 500)}`);
      }

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

          // Store the question in conversation history
          await memoryService.storeConversation(sessionId, {
            role: 'user',
            content: userRequest,
            timestamp: Date.now(),
            metadata: { stage: stage || 'editing' }
          });

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

        const responseMessage = `✅ Changes applied successfully!

📋 **Details:**
- Roles: ${roles}
- Files Modified: ${workflowResult.files.length}
- Duration: ${workflowResult.aiMetadata.totalDuration}ms
${validationInfo}

🎯 **Changes:**
${fileChangeSummary}

**🌐 The browser** is now showing your updated app with these changes!`;

        // MEMORY: Store conversation
        await memoryService.storeConversation(sessionId, {
          role: 'user',
          content: userRequest,
          timestamp: Date.now(),
          metadata: { stage: stage || 'editing', filesCount: currentFiles.length }
        });
        await memoryService.storeConversation(sessionId, {
          role: 'assistant',
          content: responseMessage,
          timestamp: Date.now(),
          metadata: {
            stage: stage || 'editing',
            changes: workflowResult.changesApplied,
            filesModified: workflowResult.files.length
          }
        });

        // MEMORY: Learn from editing patterns
        if (projectId) {
          await memoryService.addObservation(
            `project_${projectId}`,
            `edit_applied: ${workflowResult.changesApplied.join(', ')} on ${new Date().toISOString()}`
          );
        }

        // Learn user preferences
        if (userRequest.toLowerCase().includes('dark') || responseMessage.toLowerCase().includes('dark')) {
          await memoryService.storeUserPreference(user.id, 'learningNotes', `Worked with dark mode in editing on ${new Date().toISOString()}`);
        }

        console.log('[Chat] Stored editing conversation and learnings in memory');

        return NextResponse.json({
          response: responseMessage,
          updatedCode: workflowResult.updatedCode,
          updatedFiles: workflowResult.files,
          files: workflowResult.files,
          aiMetadata: workflowResult.aiMetadata,
          validation: workflowResult.validationResult?.report
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

          await memoryService.storeConversation(sessionId, {
            role: 'user',
            content: userRequest,
            timestamp: Date.now(),
            metadata: { stage: 'editing' }
          });

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

        const responseMessage = `✅ Changes applied successfully!

📋 **Details:**
- Roles: ${roles2}
- Files Modified: ${workflowResult.files.length}
- Duration: ${workflowResult.aiMetadata.totalDuration}ms
${validationInfo}

🎯 **Changes:**
${fileChangeSummary2}

**🌐 The browser** is now showing your updated app with these changes!`;

        await memoryService.storeConversation(sessionId, {
          role: 'user',
          content: userRequest,
          timestamp: Date.now(),
          metadata: { stage: 'editing', filesCount: currentFiles.length }
        });
        await memoryService.storeConversation(sessionId, {
          role: 'assistant',
          content: responseMessage,
          timestamp: Date.now(),
          metadata: { stage: 'editing', changes: workflowResult.changesApplied, filesModified: workflowResult.files.length }
        });

        if (projectId) {
          await memoryService.addObservation(`project_${projectId}`, `edit: ${workflowResult.changesApplied.join(', ')}`);
        }

        console.log('[Chat] Editing workflow completed successfully');

        return NextResponse.json({
          response: responseMessage,
          updatedCode: workflowResult.updatedCode,
          updatedFiles: workflowResult.files,
          files: workflowResult.files,
          aiMetadata: workflowResult.aiMetadata,
          validation: workflowResult.validationResult?.report
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
