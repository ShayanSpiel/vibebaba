// app/api/langgraph/stream/route.ts
import { NextRequest } from "next/server";
import { workflowEvents } from "@/lib/langgraph/events";

// Track active connections per project to prevent duplicates
const activeConnections = new Map<string, number>();

/**
 * Server-Sent Events (SSE) endpoint for real-time workflow logs
 *
 * Usage from client:
 * ```typescript
 * const eventSource = new EventSource(`/api/langgraph/stream?projectId=${projectId}`);
 * eventSource.onmessage = (event) => {
 *   const log = JSON.parse(event.data);
 *   console.log(`[${log.nodeName}] ${log.message}`);
 * };
 * ```
 */
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');

  if (!projectId) {
    return new Response('Missing projectId parameter', { status: 400 });
  }

  // Track this connection
  const currentCount = activeConnections.get(projectId) || 0;
  activeConnections.set(projectId, currentCount + 1);

  console.log(`[SSE] New connection for project ${projectId} (total: ${currentCount + 1})`);

  // Create a TransformStream for SSE
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Track if stream is still open to prevent write-after-close errors
  let streamClosed = false;

  // Helper to send SSE message
  const sendEvent = async (data: any) => {
    // Prevent writes to closed stream
    if (streamClosed) {
      return;
    }

    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch (error) {
      // Mark stream as closed if write fails
      streamClosed = true;
      console.error('[SSE] Failed to write to stream:', error);
    }
  };

  // Send initial connection message
  sendEvent({
    type: 'connected',
    projectId,
    timestamp: new Date().toISOString(),
    message: 'Connected to workflow stream'
  });

  // Subscribe to workflow events
  const onNodeStart = (event: any) => {
    if (event.projectId === projectId) {
      sendEvent({
        type: 'node:start',
        nodeName: event.nodeName,
        projectId: event.projectId,
        stage: event.stage,
        timestamp: event.timestamp,
        thinkingProcess: event.thinkingProcess, // CRITICAL: Pass thinking process through
        message: `Starting ${event.nodeName}...`
      });
    }
  };

  const onNodeComplete = (event: any) => {
    if (event.projectId === projectId) {
      sendEvent({
        type: 'node:complete',
        nodeName: event.nodeName,
        projectId: event.projectId,
        stage: event.stage,
        duration: event.duration,
        timestamp: event.timestamp,
        taskDetails: event.taskDetails, // CRITICAL: Pass task details through
        message: `Completed ${event.nodeName} in ${event.duration}ms`
      });
    }
  };

  const onNodeError = (event: any) => {
    if (event.projectId === projectId) {
      sendEvent({
        type: 'node:error',
        ...event,
        message: `Error in ${event.nodeName}: ${event.error.message}`
      });
    }
  };

  const onWorkflowComplete = (event: any) => {
    if (event.projectId === projectId) {
      // Craft message based on success/failure
      const statusEmoji = event.success ? '✅' : '❌';
      const statusText = event.success ? 'Workflow completed successfully!' : 'Workflow failed';
      const details = event.success
        ? `Generated ${event.filesGenerated} files in ${event.totalDuration}ms`
        : `Errors: ${event.errors?.length || 0}, Validation: ${event.validationStatus}`;

      sendEvent({
        type: 'workflow:complete',
        ...event,
        message: `${statusEmoji} ${statusText} - ${details}`
      });

      // Close stream after workflow completes
      setTimeout(() => {
        streamClosed = true;
        writer.close().catch(() => {});
      }, 1000);
    }
  };

  // NEW: Handle AI call events
  const onAICallStart = (event: any) => {
    if (event.projectId === projectId) {
      sendEvent({
        ...event,
        message: `AI call started: ${event.nodeName} - ${event.callType} (${event.model})`
      });
    }
  };

  const onAICallComplete = (event: any) => {
    if (event.projectId === projectId) {
      sendEvent({
        ...event,
        message: `AI call completed: ${event.nodeName} (${event.duration}ms, ${event.tokens || '?'} tokens)`
      });
    }
  };

  const onAICallError = (event: any) => {
    if (event.projectId === projectId) {
      sendEvent({
        ...event,
        message: `AI call error: ${event.nodeName} - ${event.error}`
      });
    }
  };

  // NEW: Handle AutoGen events
  const onAutoGenAttemptStart = (event: any) => {
    if (event.projectId === projectId) {
      sendEvent({
        ...event,
        message: `AutoGen attempt ${event.attempt}/${event.maxAttempts} starting (${event.initialErrors} errors to fix)`
      });
    }
  };

  const onAutoGenAgentStart = (event: any) => {
    if (event.projectId === projectId) {
      sendEvent({
        ...event,
        message: `AutoGen ${event.agent} agent: ${event.context}`
      });
    }
  };

  const onAutoGenAgentComplete = (event: any) => {
    if (event.projectId === projectId) {
      sendEvent({
        ...event,
        message: `AutoGen ${event.agent} completed in ${event.duration}ms`
      });
    }
  };

  const onAutoGenErrorDiff = (event: any) => {
    if (event.projectId === projectId) {
      const { before, after, analysis } = event;
      sendEvent({
        ...event,
        message: `Error diff: ${before.count} → ${after.count} errors (${analysis.fixed.length} fixed, ${analysis.new.length} new, ${analysis.remaining.length} remaining)`
      });
    }
  };

  // NEW: Handle progress events
  const onProgress = (event: any) => {
    if (event.projectId === projectId) {
      sendEvent({
        ...event,
        message: `[${event.nodeName}] ${event.message}`
      });
    }
  };

  // NEW: Handle conversational chat messages
  const onChatMessage = (event: any) => {
    if (event.projectId === projectId) {
      sendEvent({
        type: 'chat:message',
        message: event.message,
        metadata: event.metadata,
        timestamp: event.timestamp,
        projectId: event.projectId
      });
    }
  };

  // NEW: Handle file events
  const onFilePlanningStart = (event: any) => {
    if (event.projectId === projectId) {
      sendEvent(event);
    }
  };

  const onFilePlanningComplete = (event: any) => {
    if (event.projectId === projectId) {
      sendEvent(event);
    }
  };

  const onFileCreating = (event: any) => {
    if (event.projectId === projectId) {
      sendEvent(event);
    }
  };

  const onFileCreated = (event: any) => {
    if (event.projectId === projectId) {
      sendEvent(event);
    }
  };

  // Attach event listeners
  workflowEvents.on('node:start', onNodeStart);
  workflowEvents.on('node:complete', onNodeComplete);
  workflowEvents.on('node:error', onNodeError);
  workflowEvents.on('workflow:complete', onWorkflowComplete);

  // NEW: Attach AI and AutoGen event listeners
  workflowEvents.on('ai:call:start', onAICallStart);
  workflowEvents.on('ai:call:complete', onAICallComplete);
  workflowEvents.on('ai:call:error', onAICallError);
  workflowEvents.on('autogen:attempt:start', onAutoGenAttemptStart);
  workflowEvents.on('autogen:agent:start', onAutoGenAgentStart);
  workflowEvents.on('autogen:agent:complete', onAutoGenAgentComplete);
  workflowEvents.on('autogen:error:diff', onAutoGenErrorDiff);
  workflowEvents.on('progress', onProgress);

  // NEW: Attach conversational chat message listener
  workflowEvents.on('chat:message', onChatMessage);

  // NEW: Attach file event listeners
  workflowEvents.on('file:planning:start', onFilePlanningStart);
  workflowEvents.on('file:planning:complete', onFilePlanningComplete);
  workflowEvents.on('file:creating', onFileCreating);
  workflowEvents.on('file:created', onFileCreated);

  // Cleanup on stream close
  req.signal.addEventListener('abort', () => {
    // Decrement connection count
    const count = activeConnections.get(projectId) || 1;
    if (count <= 1) {
      activeConnections.delete(projectId);
      console.log(`[SSE] All connections closed for project ${projectId}`);
    } else {
      activeConnections.set(projectId, count - 1);
      console.log(`[SSE] Connection closed for project ${projectId} (remaining: ${count - 1})`);
    }

    workflowEvents.off('node:start', onNodeStart);
    workflowEvents.off('node:complete', onNodeComplete);
    workflowEvents.off('node:error', onNodeError);
    workflowEvents.off('workflow:complete', onWorkflowComplete);

    // NEW: Remove AI and AutoGen event listeners
    workflowEvents.off('ai:call:start', onAICallStart);
    workflowEvents.off('ai:call:complete', onAICallComplete);
    workflowEvents.off('ai:call:error', onAICallError);
    workflowEvents.off('autogen:attempt:start', onAutoGenAttemptStart);
    workflowEvents.off('autogen:agent:start', onAutoGenAgentStart);
    workflowEvents.off('autogen:agent:complete', onAutoGenAgentComplete);
    workflowEvents.off('autogen:error:diff', onAutoGenErrorDiff);
    workflowEvents.off('progress', onProgress);

    // NEW: Remove conversational chat message listener
    workflowEvents.off('chat:message', onChatMessage);

    // NEW: Remove file event listeners
    workflowEvents.off('file:planning:start', onFilePlanningStart);
    workflowEvents.off('file:planning:complete', onFilePlanningComplete);
    workflowEvents.off('file:creating', onFileCreating);
    workflowEvents.off('file:created', onFileCreated);

    streamClosed = true;
    writer.close().catch(() => {});
  });

  // Return SSE response
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
