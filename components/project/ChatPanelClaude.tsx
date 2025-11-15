'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { ActionButton, ChatBubble } from '@/components/chat/ChatBubble';
import ThinkingBubble from '@/components/chat/ThinkingBubble';
import { WorkflowMessage } from '@/components/chat/WorkflowMessage';
import Markdown from '@/components/Markdown';
import CreditPurchaseModal from '@/components/payment/CreditPurchaseModal';
import { type UploadedFile, useUploadedFiles } from '@/lib/contexts/UploadedFilesContext';
// WorkflowProgress removed - using conversational chat bubbles instead
import type { WorkflowLog } from '@/lib/hooks/useWorkflowLogs';
import {
  getContextualLoadingMessage,
  getMaybeRareMessage,
  getTimeBasedMessage,
} from '@/lib/loading-messages';
import {
  generateWorkflowSummary,
  type WorkflowCompleteData,
} from '@/lib/messaging/workflow-summary';
import { FileUploadButton } from './FileUploadButton';

interface Message {
  role: 'user' | 'assistant' | 'system' | 'workflow';
  content: string;
  bubbleType?: 'success' | 'assistant' | 'warning' | 'error';
  action?: {
    type: 'confirm-plan' | 'regenerate';
    label: string;
    onClick: () => void;
  };
  actions?: Array<{
    type: 'feature-add';
    featureId: string;
    label: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    disabled?: boolean;
    disabledReason?: string;
  }>;
  // Workflow-specific fields
  workflowRole?: string;
  workflowType?: 'thinking' | 'success';
  workflowDetails?: string;
  details?: string; // NEW: Expandable details from unified messages
}

interface ChatPanelProps {
  projectId: string;
  project: any;
  onUpdateProject: (updates: any) => void;
  workflowLogs?: WorkflowLog[];
  isGenerating?: boolean;
  deploymentStatus?: 'idle' | 'deploying' | 'deployed' | 'failed';
  deploymentError?: string;
  onGeneratingChange?: (isGenerating: boolean) => void; // NEW: Callback to control isGenerating
}

// Helper function to map node names to human-readable role names
const getRoleName = (nodeName: string): string => {
  const roleMap: Record<string, string> = {
    'pm': 'Product Manager',
    'ux': 'UX Designer',
    'frontend': 'Frontend Engineer',
    'backend': 'Backend Engineer',
    'devops': 'DevOps Engineer',
    'editor': 'Editor',
    'qa': 'QA Engineer',
    'founder': 'Founder',
    'input-detector': 'Input Detector',
    'context-analyzer': 'Context Analyzer',
  };

  return roleMap[nodeName] || nodeName;
};

export default function ChatPanelClaude({
  projectId,
  project,
  onUpdateProject,
  workflowLogs = [],
  isGenerating = false,
  deploymentStatus,
  deploymentError,
  onGeneratingChange,
}: ChatPanelProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Auto');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [fileProgress, setFileProgress] = useState<{
    totalFiles: number;
    createdFiles: string[];
    currentFile?: string;
  }>({ totalFiles: 0, createdFiles: [] });
  const [showInputNotification, setShowInputNotification] = useState(false);
  const [awaitingUserInput, setAwaitingUserInput] = useState(false);
  const [currentThinkingMessage, setCurrentThinkingMessage] = useState('Thinking');
  const [lastCheckpointId, setLastCheckpointId] = useState<string | null>(null);
  const [lastFileChanges, setLastFileChanges] = useState<string[] | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 🎯 SINGLE SOURCE OF TRUTH: Use centralized uploaded files context (no API call!)
  const { files: uploadedFiles, addFile: addUploadedFile } = useUploadedFiles();

  // ✅ FIX: Track last persisted message count to avoid infinite loop
  const lastPersistedCountRef = useRef(0);

  // Persist messages when new ones are added (not on initial load)
  useEffect(() => {
    // Only persist if we have MORE messages than last time
    // This prevents infinite loop when parent updates project.messages
    if (messages.length > lastPersistedCountRef.current && messages.length > 0) {
      lastPersistedCountRef.current = messages.length;

      // Persist OUTSIDE render cycle
      const timeoutId = setTimeout(() => {
        onUpdateProject({ messages });
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [messages, onUpdateProject]);

  // ✅ IMPROVED DEDUPLICATION: Content-hash based with 30s TTL
  const seenMessagesRef = useRef<Map<string, number>>(new Map());

  const messageHash = (content: string): string => {
    // Simple hash function for message content
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  };

  const isMessageSeen = (content: string): boolean => {
    const hash = messageHash(content);
    const now = Date.now();
    const seenTime = seenMessagesRef.current.get(hash);

    if (seenTime && (now - seenTime < 30000)) {
      // Seen within last 30 seconds
      return true;
    }

    // Mark as seen
    seenMessagesRef.current.set(hash, now);

    // Cleanup old entries (keep map size manageable)
    if (seenMessagesRef.current.size > 100) {
      const entries = Array.from(seenMessagesRef.current.entries());
      entries.sort((a, b) => a[1] - b[1]);
      // Remove oldest 50 entries
      for (let i = 0; i < 50; i++) {
        seenMessagesRef.current.delete(entries[i][0]);
      }
    }

    return false;
  };

  // Dynamic thinking messages that rotate
  const thinkingMessages = [
    'Thinking',
    'WhatsApping Engineers',
    'Waking up the PM',
    'Making it Happen',
  ];

  // DEBUG: Log state changes
  useEffect(() => {
    console.log('[Chat Debug] showCreditModal state changed:', showCreditModal);
  }, [showCreditModal]);

  // Rotate thinking messages when loading
  useEffect(() => {
    if (!isLoading) {
      // Reset to first message when not loading
      setCurrentThinkingMessage(thinkingMessages[0]);
      return;
    }

    // Start with first message
    setCurrentThinkingMessage(thinkingMessages[0]);
    let messageIndex = 0;

    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % thinkingMessages.length;
      setCurrentThinkingMessage(thinkingMessages[messageIndex]);
    }, 3000); // Change message every 3 seconds

    return () => clearInterval(interval);
  }, [isLoading, thinkingMessages]);

  const t = useTranslations('project');

  // Track file creation progress from workflow logs
  useEffect(() => {
    const filePlanningComplete = workflowLogs.find(
      (log: any) => log.type === 'file:planning:complete'
    );
    const fileCreatedLogs = workflowLogs.filter((log: any) => log.type === 'file:created');
    const fileCreatingLog = workflowLogs
      .filter((log: any) => log.type === 'file:creating')
      .slice(-1)[0];

    if (filePlanningComplete) {
      const totalFiles = (filePlanningComplete as any).totalFiles || 0;
      const createdFiles = fileCreatedLogs.map((log: any) => log.fileName);
      const currentFile = (fileCreatingLog as any)?.fileName;

      setFileProgress({
        totalFiles,
        createdFiles,
        currentFile,
      });
    }
  }, [workflowLogs]);

  // Get random loading message with enhanced dynamic messages
  const getRandomLoadingMessage = () => {
    const stage = project.stage === 'building' ? 'building' : 'thinking';
    const timeBasedMsg = getTimeBasedMessage();
    const contextualMsg = getContextualLoadingMessage(stage as any);
    return timeBasedMsg || getMaybeRareMessage(contextualMsg);
  };

  const models = [
    'Auto',
    'Gemini 2.0 Flash Exp',
    'Gemini 2.5 Flash',
    'Gemini 2.0 Flash',
    'Gemini 1.5 Flash',
    'Gemini 1.5 Pro',
    'Gemini 2.0 (OpenRouter)',
    'Llama 3.2 3B',
    'Llama 3.1 8B',
    'Mistral 7B',
  ];

  useEffect(() => {
    if (project.messages) {
      setMessages(project.messages);
    }
  }, [project.messages]);

  // Notify when plan is ready
  useEffect(() => {
    if (project.plan && project.stage === 'planning') {
      const lastMessage = messages[messages.length - 1];
      // Check if plan ready message already exists to prevent infinite loop
      const hasPlanReadyMessage = messages.some((msg) => msg.content.includes('plan is ready'));
      if (!hasPlanReadyMessage) {
        const planReadyMessage: Message = {
          role: 'assistant' as const,
          content: t('planReady'),
        };

        const confirmMessage: Message = {
          role: 'system' as const,
          content: '',
          action: {
            type: 'confirm-plan',
            label: t('confirmPlanButton'),
            onClick: () => {
              // Remove all action buttons when clicked
              const messagesWithoutActions = messages.filter(
                (msg) => !(msg.role === 'system' && msg.action)
              );
              setMessages(messagesWithoutActions);
              onUpdateProject({ stage: 'building', messages: messagesWithoutActions });
            },
          },
        };

        const newMessages = [...messages, planReadyMessage, confirmMessage];
        setMessages(newMessages);
        onUpdateProject({ messages: newMessages });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.plan, project.stage]);

  // Notify when app is ready - ONLY after deployment completes
  useEffect(() => {
    // Wait for deployment to complete before showing "app is ready" message
    if (
      project.prototypeCode &&
      project.backendConfig &&
      project.stage === 'building' &&
      deploymentStatus === 'deployed'
    ) {
      // Check if app ready message already exists to prevent infinite loop
      const hasAppReadyMessage = messages.some((msg) => msg.content.includes('app is ready'));
      if (!hasAppReadyMessage) {
        const appReadyMessage: Message = {
          role: 'assistant' as const,
          content: t('appReady'),
        };

        const newMessages = [...messages, appReadyMessage];
        setMessages(newMessages);
        onUpdateProject({ messages: newMessages });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.prototypeCode, project.backendConfig, project.stage, deploymentStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ IMPROVED SSE CONNECTION: Track connection state to prevent overlaps
  const sseConnectionRef = useRef<{
    eventSource: EventSource | null;
    isConnecting: boolean;
    isClosed: boolean;
  }>({ eventSource: null, isConnecting: false, isClosed: false });

  // Listen for conversational chat messages from SSE (only when workflow is active)
  useEffect(() => {
    // Only connect to SSE when there's an active workflow running
    if (!projectId || !isGenerating) return;

    console.log('[Chat SSE] Connecting to stream for project:', projectId);

    let eventSource: EventSource | null = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 3;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let connectionClosed = false;

    // Exponential backoff calculator
    const getBackoffDelay = (attempt: number) => {
      return Math.min(1000 * 2 ** attempt, 10000); // Max 10 seconds
    };

    const closeConnection = () => {
      if (connectionClosed) return;
      connectionClosed = true;

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      // Update ref state
      sseConnectionRef.current = {
        eventSource: null,
        isConnecting: false,
        isClosed: true,
      };
    };

    const connect = () => {
      if (connectionClosed) return;

      // ✅ Prevent overlapping connections
      if (sseConnectionRef.current.isConnecting || sseConnectionRef.current.eventSource) {
        console.log('[Chat SSE] Connection already exists, skipping...');
        return;
      }

      sseConnectionRef.current.isConnecting = true;

      eventSource = new EventSource(`/api/langgraph/stream?projectId=${projectId}`);
      sseConnectionRef.current.eventSource = eventSource;

      eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle chat:message events
          if (data.type === 'chat:message') {
            console.log('[Chat SSE] Received chat message:', data.message);

            // ✅ IMPROVED: Hash-based deduplication
            if (isMessageSeen(data.message)) {
              console.log('[Chat SSE] Duplicate message detected, skipping');
              return;
            }

            // Check if this is a workflow message (has nodeId metadata)
            const isWorkflowMessage = data.metadata?.metadata?.nodeId;
            const nodeId = data.metadata?.metadata?.nodeId;

            // Add message to chat
            const assistantMessage: Message = {
              role: isWorkflowMessage ? ('workflow' as const) : ('assistant' as const),
              content: data.message,
              bubbleType: data.metadata?.bubbleType || data.metadata?.type,
              details: data.metadata?.metadata?.details, // NEW: Extract details from metadata
              workflowRole: isWorkflowMessage ? getRoleName(nodeId) : undefined,
              workflowType: isWorkflowMessage ? 'success' : undefined,
              workflowDetails: data.metadata?.metadata?.details, // For backward compatibility
            };

            setMessages((prev) => [...prev, assistantMessage]);

            // If it's a question requiring response
            if (data.metadata?.requiresResponse) {
              console.log('[Chat SSE] Question requires user input');
              setAwaitingUserInput(true);
              setShowInputNotification(true);
            }
          }

          // ✅ WORKFLOW THINKING MESSAGE: Display when node starts
          if (data.type === 'node:start') {
            console.log('[Chat SSE] Node started:', data.nodeName);

            // Build concise thinking message (2-5 lines max)
            let thinkingMessage = '';
            if (data.thinkingProcess?.interpretation) {
              // Clean up thinking message: remove emojis, keep it concise
              thinkingMessage = data.thinkingProcess.interpretation
                .replace(/[^\w\s.,!?-]/g, '') // Remove emojis and special chars
                .split('\n')
                .slice(0, 3) // Max 3 lines
                .join('\n')
                .trim();
            } else {
              thinkingMessage = `Working on your request...`;
            }

            // Create workflow thinking message
            const thinkingMsg: Message = {
              role: 'workflow' as const,
              content: thinkingMessage,
              workflowRole: getRoleName(data.nodeName),
              workflowType: 'thinking' as const,
            };

            // Add with animation
            setMessages((prev) => [...prev, thinkingMsg]);
          }

          // ✅ WORKFLOW SUCCESS MESSAGE: Display when node completes
          if (data.type === 'node:complete') {
            console.log('[Chat SSE] Node completed:', data.nodeName);

            // Build success summary and details
            let successSummary = '';
            let details = '';

            if (data.taskDetails) {
              // Extract summary (title only, no details)
              if (data.taskDetails.summary) {
                successSummary = data.taskDetails.summary
                  .replace(/[^\w\s.,!?-]/g, '') // Remove emojis
                  .split('\n')[0] // First line only
                  .trim();
              }

              // Build detailed breakdown (for expandable section)
              if (data.taskDetails.output) {
                const output = data.taskDetails.output;
                const detailLines: string[] = [];

                // Format output as user-friendly bullet points
                Object.entries(output).forEach(([key, value]) => {
                  const friendlyKey = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())
                    .trim();

                  if (typeof value === 'object' && value !== null) {
                    detailLines.push(`**${friendlyKey}:**`);
                    Object.entries(value).forEach(([subKey, subValue]) => {
                      const friendlySubKey = subKey
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, (str) => str.toUpperCase())
                        .trim();
                      detailLines.push(`  • ${friendlySubKey}: ${subValue}`);
                    });
                  } else if (typeof value === 'boolean') {
                    detailLines.push(`• ${friendlyKey}: ${value ? 'Yes' : 'No'}`);
                  } else if (value) {
                    detailLines.push(`• ${friendlyKey}: ${value}`);
                  }
                });

                details = detailLines.join('\n');
              }
            }

            // Only create success message if we have a summary
            if (successSummary) {
              const successMsg: Message = {
                role: 'workflow' as const,
                content: successSummary,
                workflowRole: getRoleName(data.nodeName),
                workflowType: 'success' as const,
                workflowDetails: details || undefined,
              };

              // Add success message BELOW thinking message (both persist)
              setMessages((prev) => [...prev, successMsg]);
            }
          }

          // Handle workflow:complete events
          if (data.type === 'workflow:complete') {
            console.log('[Chat SSE] Workflow complete:', data);
            console.log('[Chat SSE] allRequestedFeatures:', data.allRequestedFeatures);

            const workflowData: WorkflowCompleteData = {
              projectId: data.projectId,
              success: data.success,
              duration: data.duration || 0,
              addedFeatures: data.addedFeatures,
              fileChanges: data.fileChanges,
              allRequestedFeatures: data.allRequestedFeatures,
              metadata: data.metadata,
            };

            // Generate dynamic summary
            const { message, suggestedFeatures } = generateWorkflowSummary(workflowData);
            console.log('[Chat SSE] Generated summary message:', message);
            console.log('[Chat SSE] Suggested features count:', suggestedFeatures.length);

            // Create summary message
            const summaryMessage: Message = {
              role: 'assistant' as const,
              content: message,
              bubbleType: 'success' as const,
            };

            // Create suggested features message with +Add buttons
            const featuresMessage: Message | null =
              suggestedFeatures.length > 0
                ? {
                    role: 'system' as const,
                    content: '', // Empty content, just actions
                    actions: suggestedFeatures.map((f) => ({
                      type: 'feature-add' as const,
                      featureId: f.featureId,
                      label: f.label,
                      description: f.description,
                      priority: f.priority,
                      disabled: false,
                    })),
                  }
                : null;

            console.log('[Chat SSE] Features message:', featuresMessage);

            // CRITICAL: Append to messages WITHOUT deduplication check
            // workflow:complete is a unique event that should always be added
            // MUST preserve all previous messages (workflow role messages, chat messages, etc.)
            setMessages((prev) => {
              console.log('[Chat SSE] Current message count before workflow:complete:', prev.length);
              console.log('[Chat SSE] Previous messages:', prev.map(m => `${m.role}:${m.content.substring(0, 50)}`));

              // CRITICAL: Spread prev array to preserve ALL existing messages
              const newMessages = [...prev, summaryMessage];
              if (featuresMessage) {
                newMessages.push(featuresMessage);
                console.log('[Chat SSE] Added features message with', featuresMessage.actions?.length, 'features');
              }

              console.log('[Chat SSE] New message count after workflow:complete:', newMessages.length);
              console.log('[Chat SSE] Final messages:', newMessages.map(m => `${m.role}:${m.content.substring(0, 50)}`));

              // Sanity check: Ensure we didn't lose messages
              if (newMessages.length < prev.length) {
                console.error('[Chat SSE] ❌ MESSAGE LOSS DETECTED! prev:', prev.length, 'new:', newMessages.length);
                // Return prev to prevent message loss
                return prev;
              }

              return newMessages;
            });
          }
        } catch (error) {
          console.error('[Chat SSE] Error parsing message:', error);
        }
      });

      eventSource.onopen = () => {
        console.log('[Chat SSE] Connection opened');
        reconnectAttempts = 0; // Reset on successful connection
        sseConnectionRef.current.isConnecting = false; // Connection established
      };

      eventSource.onerror = (error) => {
        // Only log errors that are unexpected (not normal disconnections)
        const readyState = eventSource?.readyState;
        if (readyState === EventSource.CONNECTING || readyState === EventSource.OPEN) {
          console.warn('[Chat SSE] Connection error during active state:', readyState);
        }
        // Silent for CLOSED state - this is expected when workflow isn't running

        // Close current connection
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        // Only retry if not manually closed and under retry limit
        if (!connectionClosed && reconnectAttempts < MAX_RECONNECT_ATTEMPTS && isGenerating) {
          reconnectAttempts++;
          const delay = getBackoffDelay(reconnectAttempts);

          console.log(
            `[Chat SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`
          );

          reconnectTimeout = setTimeout(() => {
            if (!connectionClosed) {
              connect(); // Retry connection
            }
          }, delay);
        } else {
          // Max retries exceeded or connection closed - silent, this is normal
          if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.log(
              '[Chat SSE] Connection closed after max retries (workflow likely not active)'
            );
          }
          closeConnection();
        }
      };
    };

    // Start initial connection
    connect();

    // Cleanup on unmount
    return () => {
      console.log('[Chat SSE] Cleaning up connection');
      closeConnection();
    };
  }, [projectId, isGenerating]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FEATURE ADDITION HANDLER
  // Triggers editing workflow when user clicks +Add button
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const handleFeatureAdd = async (featureId: string) => {
    // Find the feature in project data
    const feature = project.allRequestedFeatures?.find((f: any) => f.id === featureId);
    if (!feature) {
      console.error('[Chat] Feature not found:', featureId);
      return;
    }

    // Create special editing request
    const featureRequest = `Add ${feature.name}`;

    // Add user message to chat
    const userMessage: Message = {
      role: 'user' as const,
      content: featureRequest,
    };

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setIsLoading(true);

    // Send request to API (will trigger editing workflow)
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages,
          currentPlan: project.plan || '',
          stage: project.stage,
          prototypeCode: project.prototypeCode || '',
          files: project.files || null,
          description: project.description || '',
          backendConfig: project.backendConfig || null,
          projectId: project.id,
          context: project.context || null,
          featureAddRequest: featureId, // Special flag for feature addition
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          role: 'assistant' as const,
          content: data.response,
        };

        const updatedMessages = [...currentMessages, assistantMessage];
        setMessages(updatedMessages);

        // Update project with changes
        const updates: any = { messages: updatedMessages };
        if (data.updatedFiles) {
          updates.files = data.updatedFiles;
          updates._refreshKey = Date.now();
        }

        onUpdateProject(updates);
      }
    } catch (error) {
      console.error('[Chat] Feature add error:', error);
      const errorMessage: Message = {
        role: 'assistant' as const,
        content: 'Sorry, something went wrong while adding the feature. Please try again.',
      };
      setMessages([...currentMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // END FEATURE ADDITION HANDLER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FILE UPLOAD HANDLERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // 🎯 REMOVED: No longer fetching files here - context handles it!

  const handleUploadComplete = (file: UploadedFile) => {
    addUploadedFile(file); // Add to centralized context
    // Optionally add a message to chat indicating file was uploaded
    const fileMessage: Message = {
      role: 'system' as const,
      content: `📎 Uploaded: **${file.name}** - Specify its purpose in your message (e.g., "use as logo" or "extract colors")`,
    };
    setMessages((prev) => [...prev, fileMessage]);
  };

  const handleSelectFile = (file: UploadedFile) => {
    // Add file reference to input
    setInput((prev) => {
      const mention = `[File: ${file.name}]`;
      return prev ? `${prev} ${mention}` : mention;
    });
  };

  const handleDeleteFile = async (filePath: string) => {
    // File deletion not implemented in context yet - stub for now
    console.log('[ChatPanel] File deletion not yet implemented:', filePath);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // END FILE UPLOAD HANDLERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // 🔄 ROLLBACK HANDLER: Undo last edit changes
  const handleRollback = async () => {
    if (!lastCheckpointId || isRollingBack) return;

    try {
      setIsRollingBack(true);
      console.log('[Chat] 🔄 Rolling back to checkpoint:', lastCheckpointId);

      const response = await fetch('/api/ai/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          checkpointId: lastCheckpointId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('[Chat] ✅ Rollback successful');

        // Build detailed rollback success message
        const fileCount = data.files?.length || 0;
        const rollbackMessage = `✅ **Success!** Your app has been rolled back to the previous checkpoint.

📋 **Restored:**
   • ${fileCount} file${fileCount !== 1 ? 's' : ''} reverted to previous state

🎉 **Your app is ready to preview!**`;

        // Update project with restored files and success message
        const updates: any = {
          files: data.files,
          messages: [
            ...messages,
            {
              role: 'assistant' as const,
              content: rollbackMessage,
              bubbleType: 'assistant' as const, // This will get green success styling
            },
          ],
        };

        onUpdateProject(updates);
        setMessages(updates.messages);
        setLastCheckpointId(null);
        setLastFileChanges(null);
      } else {
        throw new Error(data.error || 'Rollback failed');
      }
    } catch (error: any) {
      console.error('[Chat] ❌ Rollback failed:', error);
      alert('Failed to rollback changes: ' + error.message);
    } finally {
      setIsRollingBack(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Hide input notification when user responds
    if (awaitingUserInput) {
      setAwaitingUserInput(false);
      setShowInputNotification(false);
    }

    const userMessage: Message = { role: 'user' as const, content: input.trim() };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);

    // Set random loading message
    setLoadingMessage(getRandomLoadingMessage());

    // SSE connection is active and will receive:
    // - Conversational messages from editor (emitChatMessage)
    // - Workflow progress events
    // - User input requests when clarification needed

    try {
      console.log('[Chat] 📤 Sending messages to API:', currentMessages.length, 'messages');
      console.log(
        '[Chat] 📝 Last user message:',
        currentMessages[currentMessages.length - 1]?.content.substring(0, 100)
      );

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages,
          currentPlan: project.plan || '',
          stage: project.stage,
          prototypeCode: project.prototypeCode || '',
          files: project.files || null,
          description: project.description || '',
          backendConfig: project.backendConfig || null,
          projectId: project.id,
          context: project.context || null,
        }),
      });

      const data = await response.json();

      // Check for insufficient credits error
      console.log('[Chat Debug] Response status:', response.status);
      console.log('[Chat Debug] Response data:', data);

      // NEW: Check for user input request (workflow paused)
      if (data.needsUserInput && data.response) {
        console.log('[Chat] ⏸️  Workflow paused - user input required');
        console.log('[Chat]   Input type:', data.inputType);
        console.log('[Chat]   Question:', data.response);

        // Add the question to chat
        const questionMessage: Message = {
          role: 'assistant' as const,
          content: data.response,
        };

        const updatedMessagesWithQuestion = [...currentMessages, questionMessage];
        setMessages(updatedMessagesWithQuestion);
        setAwaitingUserInput(true);
        setShowInputNotification(true);
        setIsLoading(false);

        // Update project with the question message
        onUpdateProject({ messages: updatedMessagesWithQuestion });

        return; // Don't process as normal response
      }

      if (response.status === 402 || data.insufficientTokens) {
        console.log('[Chat Debug] Insufficient credits detected! Showing modal...');
        setShowCreditModal(true);
        setIsLoading(false);
        setMessages(messages);
        return;
      }

      if (response.ok) {
        const responseContent = data.response;

        // 🔄 ROLLBACK SUPPORT: Capture checkpoint data for undo functionality
        if (data.lastCheckpointId) {
          console.log('[Chat] 💾 Checkpoint available for rollback:', data.lastCheckpointId);
          setLastCheckpointId(data.lastCheckpointId);
          setLastFileChanges(data.fileChanges || data.changesApplied || null);
        }

        // Add conversational summary header (browser notice already in API response)
        const conversationalResponse =
          data.updatedCode || data.updatedFiles
            ? `**Here's what I changed:**\n\n${responseContent}`
            : responseContent;

        // IMPORTANT: Display AI metadata if available (model used, thinking process, etc.)
        if (data.aiMetadata) {
          console.log('[Chat] AI Metadata received:', data.aiMetadata);
        }

        const assistantMessage: Message = { role: 'assistant' as const, content: conversationalResponse };
        const updatedMessages = [...currentMessages, assistantMessage];
        setMessages(updatedMessages);

        const updates: any = { messages: updatedMessages };
        if (data.updatedPlan) updates.plan = data.updatedPlan;

        // Handle file updates from both building and editing stages
        if (data.updatedFiles || data.files) {
          // Force new array reference AND new object references to trigger React re-render and deployment
          const newFiles = (data.updatedFiles || data.files).map((f: any) => ({
            path: f.path,
            content: f.content,
          }));
          updates.files = newFiles;
          console.log('[Chat] ✅ Files updated:', updates.files.length, 'files');
          console.log('[Chat] 📦 First file:', updates.files[0]?.path);
          console.log('[Chat] 📝 File paths:', newFiles.map((f: any) => f.path).join(', '));
          console.log('[Chat] 🔄 Triggering re-deployment with updated files...');
          console.log(
            '[Chat] 🔍 CRITICAL: Files being saved to project:',
            JSON.stringify(newFiles.slice(0, 2), null, 2)
          );

          // 🔍 DEBUG: Verify content is actually different
          const currentFiles = project.files || [];
          console.log('[Chat] 🔍 COMPARING FILES:');
          console.log('[Chat]   - Current files count:', currentFiles.length);
          console.log('[Chat]   - New files count:', newFiles.length);
          if (currentFiles.length > 0 && newFiles.length > 0) {
            const firstCurrentFile = currentFiles[0];
            const firstNewFile = newFiles[0];
            console.log('[Chat]   - First current file path:', firstCurrentFile?.path);
            console.log('[Chat]   - First new file path:', firstNewFile?.path);
            if (firstCurrentFile && firstNewFile && firstCurrentFile.path === firstNewFile.path) {
              const contentChanged = firstCurrentFile.content !== firstNewFile.content;
              console.log('[Chat]   - Content changed:', contentChanged);
              if (contentChanged) {
                console.log(
                  '[Chat]   - Old content length:',
                  firstCurrentFile.content?.length || 0
                );
                console.log('[Chat]   - New content length:', firstNewFile.content?.length || 0);
                console.log(
                  '[Chat]   - Old content preview:',
                  firstCurrentFile.content?.substring(0, 100)
                );
                console.log(
                  '[Chat]   - New content preview:',
                  firstNewFile.content?.substring(0, 100)
                );
              } else {
                console.log(
                  '[Chat]   ⚠️  WARNING: Files are identical! Edit may not have been applied!'
                );
              }
            }
          }
        }

        if (data.updatedCode) {
          updates.prototypeCode = data.updatedCode;

          // Transition to "editing" stage after first successful code generation
          if (project.stage === 'building' && !project.editingStageEnabled) {
            updates.stage = 'editing';
            updates.editingStageEnabled = true;
            console.log('[Chat] Transitioning to editing stage for future modifications');
          }
        }

        // Always update and trigger refresh if files changed
        if (updates.files) {
          onUpdateProject({ ...updates, _refreshKey: Date.now() });
        } else {
          onUpdateProject(updates);
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant' as const,
        content: t('error') + '\n\n' + error.message,
      };
      setMessages([...currentMessages, errorMessage]);
      onUpdateProject({ messages: [...currentMessages, errorMessage] });
    } finally {
      setIsLoading(false);
      // SSE is not used for chat endpoint, so no need to disable it
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-background-base">
      {/* Chat Messages Area - Normal flex-col flow (not reversed) */}
      <div className="flex-1 overflow-auto p-4 flex flex-col bg-background-base">
        {/* Initial Idea - Always at the top */}
        <div className="flex justify-start mb-4">
          <div className="max-w-[90%] bg-background-raised border border-light rounded-xl rounded-tl-sm px-5 py-3 shadow-md">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-semibold mb-1 text-text-secondary"
                  style={{ fontSize: '0.95rem' }}
                >
                  {t('yourIdea')}
                </p>
                <p className="text-sm leading-relaxed text-text-primary">
                  {project.userDescription || project.initialPrompt || project.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* All workflow updates now appear as conversational chat bubbles below */}

        {/* Chat Messages - Normal order */}
        {messages
          .filter((msg) => msg.role !== 'system')
          .map((msg, idx) => {
            // Enable typing animation for the last message only (during generation)
            const isLastMessage = idx === messages.filter((m) => m.role !== 'system').length - 1;
            const shouldType = isGenerating && isLastMessage;

            return (
              <div key={idx} className="mb-3">
                {/* Workflow messages use custom component */}
                {msg.role === 'workflow' ? (
                  <WorkflowMessage
                    role={msg.workflowRole || 'AI'}
                    thinkingMessage={msg.workflowType === 'thinking' ? msg.content : undefined}
                    successMessage={msg.workflowType === 'success' ? msg.content : undefined}
                    details={msg.workflowDetails}
                    isThinking={msg.workflowType === 'thinking'}
                    enableTyping={shouldType && msg.workflowType === 'thinking'}
                  />
                ) : (
                  <ChatBubble
                    type={msg.bubbleType || (msg.role as 'user' | 'assistant')}
                    content={msg.content}
                    animate={false}
                    enableTyping={shouldType && msg.role === 'assistant'}
                    typingSpeed={50}
                  />
                )}

                {/* 🔄 ROLLBACK BUTTON: Show after successful edits - Matching feature +Add button style */}
                {lastCheckpointId &&
                  idx === messages.length - 1 &&
                  msg.role === 'assistant' &&
                  (msg.content.includes('**Success!**') ||
                    msg.content.includes('I updated') ||
                    msg.content.includes('I created') ||
                    msg.content.includes('I removed')) && (
                    <div className="mt-3 ml-12">
                      <button
                        onClick={handleRollback}
                        disabled={isRollingBack}
                        className={`
                    flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left w-full
                    transition-all shadow-sm hover:shadow-md
                    ${
                      isRollingBack
                        ? 'bg-background-subtle border border-border-light text-text-tertiary cursor-not-allowed opacity-60'
                        : 'bg-background-raised border border-border-light text-text-primary hover:border-amber-400/50'
                    }
                  `}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Status indicator dot */}
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              isRollingBack ? 'bg-gray-400' : 'bg-blue-500'
                            }`}
                          />

                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold">
                              {isRollingBack
                                ? 'Rolling back changes...'
                                : 'Rollback to previous checkpoint'}
                            </div>
                            <div className="text-xs text-text-secondary truncate">
                              {isRollingBack
                                ? 'Please wait while we restore your files'
                                : lastFileChanges && lastFileChanges.length > 0
                                  ? `Undo changes to ${lastFileChanges.length} ${lastFileChanges.length === 1 ? 'file' : 'files'}`
                                  : 'Restore your code to the previous state'}
                            </div>
                          </div>
                        </div>

                        {/* Rollback icon with golden gradient - animated on click */}
                        {!isRollingBack ? (
                          <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-sm">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                              />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-sm">
                            <svg
                              className="w-4 h-4 text-white animate-spin-reverse"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    </div>
                  )}

                {/* NEW: Feature Action Buttons */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-col gap-2 mt-3 ml-12">
                    {msg.actions.map((action, actionIdx) => (
                      <button
                        key={actionIdx}
                        onClick={() => handleFeatureAdd(action.featureId)}
                        disabled={action.disabled}
                        className={`
                      flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left
                      transition-all shadow-sm hover:shadow-md
                      ${
                        action.disabled
                          ? 'bg-background-subtle border border-border-light text-text-tertiary cursor-not-allowed opacity-60'
                          : 'bg-background-raised border border-border-light text-text-primary hover:border-amber-400/50'
                      }
                    `}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Priority indicator */}
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              action.priority === 'high'
                                ? 'bg-amber-500'
                                : action.priority === 'medium'
                                  ? 'bg-blue-500'
                                  : 'bg-gray-400'
                            }`}
                          />

                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold">{action.label}</div>
                            <div className="text-xs text-text-secondary truncate">
                              {action.description}
                            </div>
                            {action.disabledReason && (
                              <div className="text-xs text-warning mt-1">
                                ⚠️ {action.disabledReason}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Add button */}
                        {!action.disabled && (
                          <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-sm">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        {isLoading &&
          (() => {
            // Extract the latest thinking process from workflow logs
            const latestThinking = workflowLogs
              .filter((log) => log.type === 'node:start' && log.thinkingProcess)
              .slice(-1)[0]?.thinkingProcess;

            return <ThinkingBubble isAnimating={true} thinkingProcess={latestThinking} />;
          })()}

        <div ref={messagesEndRef} />
      </div>

      {/* Confirmation Bubble - Show above input when action is needed */}
      {messages.some((msg) => msg.role === 'system' && msg.action) && (
        <div className="px-4 pb-3">
          {messages
            .filter((msg) => msg.role === 'system' && msg.action)
            .map((msg, idx) => (
              <ChatBubble
                key={idx}
                type="confirmation"
                content="Ready to proceed with building?"
                animate={true}
              >
                <ActionButton variant="primary" onClick={msg.action!.onClick}>
                  {msg.action!.label}
                </ActionButton>
                <ActionButton
                  variant="secondary"
                  onClick={() => {
                    // Keep planning - user can continue chatting
                  }}
                >
                  Keep Planning
                </ActionButton>
              </ChatBubble>
            ))}
        </div>
      )}

      {/* Credit Purchase Modal - Show above chat input when out of credits */}
      {showCreditModal && (
        <div className="px-4 pb-3">
          <CreditPurchaseModal isOpen={showCreditModal} onClose={() => setShowCreditModal(false)} />
        </div>
      )}

      {/* Input Notification Dialog - Shows when awaiting user input */}
      {showInputNotification && (
        <div className="px-4 pb-2 relative">
          {/* Matching brand guidelines Information Modal - Subsidiary Golden */}
          <div className="relative bg-background-raised backdrop-blur-sm border border-amber-400/20 rounded-2xl shadow-2xl p-4 overflow-hidden">
            {/* Gradient background overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-amber-400/5 to-yellow-600/10" />

            <div className="relative z-10 flex items-start gap-3">
              {/* Icon matching brand guidelines */}
              <div className="w-9 h-9 bg-gradient-to-br from-amber-400/20 to-yellow-600/20 border border-amber-400/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              {/* Message */}
              <div className="flex-1">
                <p className="text-sm text-text-primary font-semibold">
                  Please provide your input below
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  Type your response in the chat field and press Enter
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowInputNotification(false)}
                className="text-text-secondary hover:text-amber-400 transition-colors"
                aria-label="Close"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Pointing arrow - updated colors */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2">
            <div className="w-3 h-3 bg-gradient-to-br from-amber-400/10 to-yellow-600/10 border-b-2 border-r-2 border-amber-400/20 rotate-45"></div>
          </div>
        </div>
      )}

      {/* Chat Input - Simplified */}
      <div className="border-t border-light p-4 bg-background-base">
        <div
          className={`relative bg-background-raised border rounded-xl focus-within:border-brand-primary transition-colors ${showCreditModal ? 'border-orange-500/50' : awaitingUserInput ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-light'}`}
        >
          <textarea
            id="chat-input"
            name="message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              showCreditModal ? '⚡ Purchase credits to continue...' : t('chatPlaceholder')
            }
            className="w-full h-20 px-4 py-3 pr-14 text-sm bg-transparent resize-none focus:outline-none text-text-primary"
            disabled={isLoading || showCreditModal}
          />

          {/* File Upload & Send Buttons */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            {/* File Upload Button */}
            <FileUploadButton
              projectId={projectId}
              userId={project.userId}
              uploadedFiles={uploadedFiles as any}
              onUploadComplete={handleUploadComplete as any}
              onSelectFile={handleSelectFile as any}
              onDeleteFile={handleDeleteFile}
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 bg-gradient-brand text-text-inverse rounded-lg hover:bg-gradient-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title={isLoading ? t('thinking') : t('sendMessage')}
              aria-label={t('sendMessage')}
            >
              {isLoading ? (
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
