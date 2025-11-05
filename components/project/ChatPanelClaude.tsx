"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Markdown from "@/components/Markdown";
import { useTranslations } from "next-intl";
import { ChatBubble, ActionButton } from "@/components/chat/ChatBubble";
import CreditPurchaseModal from "@/components/payment/CreditPurchaseModal";
import WorkflowProgress from "./WorkflowProgress";
import { WorkflowLog } from "@/lib/hooks/useWorkflowLogs";
import { getContextualLoadingMessage, getMaybeRareMessage, getTimeBasedMessage } from "@/lib/loading-messages";
import { FileUploadButton, type UploadedFile } from "./FileUploadButton";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  bubbleType?: "success" | "assistant" | "warning" | "error";
  action?: {
    type: "confirm-plan" | "regenerate";
    label: string;
    onClick: () => void;
  };
  actions?: Array<{
    type: "feature-add";
    featureId: string;
    label: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    disabled?: boolean;
    disabledReason?: string;
  }>;
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

export default function ChatPanelClaude({ projectId, project, onUpdateProject, workflowLogs = [], isGenerating = false, deploymentStatus, deploymentError, onGeneratingChange }: ChatPanelProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Auto");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [fileProgress, setFileProgress] = useState<{
    totalFiles: number;
    createdFiles: string[];
    currentFile?: string;
  }>({ totalFiles: 0, createdFiles: [] });
  const [showInputNotification, setShowInputNotification] = useState(false);
  const [awaitingUserInput, setAwaitingUserInput] = useState(false);
  const [currentThinkingMessage, setCurrentThinkingMessage] = useState("Thinking");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamic thinking messages that rotate
  const thinkingMessages = [
    "Thinking",
    "WhatsApping Engineers",
    "Waking up the PM",
    "Making it Happen"
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

  const t = useTranslations("project");

  // Track file creation progress from workflow logs
  useEffect(() => {
    const filePlanningComplete = workflowLogs.find((log: any) => log.type === 'file:planning:complete');
    const fileCreatedLogs = workflowLogs.filter((log: any) => log.type === 'file:created');
    const fileCreatingLog = workflowLogs.filter((log: any) => log.type === 'file:creating').slice(-1)[0];

    if (filePlanningComplete) {
      const totalFiles = (filePlanningComplete as any).totalFiles || 0;
      const createdFiles = fileCreatedLogs.map((log: any) => log.fileName);
      const currentFile = (fileCreatingLog as any)?.fileName;

      setFileProgress({
        totalFiles,
        createdFiles,
        currentFile
      });
    }
  }, [workflowLogs]);

  // Get random loading message with enhanced dynamic messages
  const getRandomLoadingMessage = () => {
    const stage = project.stage === "building" ? 'building' : 'thinking';
    const timeBasedMsg = getTimeBasedMessage();
    const contextualMsg = getContextualLoadingMessage(stage as any);
    return timeBasedMsg || getMaybeRareMessage(contextualMsg);
  };

  const models = [
    "Auto",
    "Gemini 2.0 Flash Exp",
    "Gemini 2.5 Flash",
    "Gemini 2.0 Flash",
    "Gemini 1.5 Flash",
    "Gemini 1.5 Pro",
    "Gemini 2.0 (OpenRouter)",
    "Llama 3.2 3B",
    "Llama 3.1 8B",
    "Mistral 7B",
  ];

  useEffect(() => {
    if (project.messages) {
      setMessages(project.messages);
    }
  }, [project.messages]);

  // Notify when plan is ready
  useEffect(() => {
    if (project.plan && project.stage === "planning") {
      const lastMessage = messages[messages.length - 1];
      // Check if plan ready message already exists to prevent infinite loop
      const hasPlanReadyMessage = messages.some(msg => msg.content.includes("plan is ready"));
      if (!hasPlanReadyMessage) {
        const planReadyMessage: Message = {
          role: "assistant",
          content: t("planReady"),
        };

        const confirmMessage: Message = {
          role: "system",
          content: "",
          action: {
            type: "confirm-plan",
            label: t("confirmPlanButton"),
            onClick: () => {
              // Remove all action buttons when clicked
              const messagesWithoutActions = messages.filter(msg => !(msg.role === "system" && msg.action));
              setMessages(messagesWithoutActions);
              onUpdateProject({ stage: "building", messages: messagesWithoutActions });
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
    if (project.prototypeCode && project.backendConfig && project.stage === "building" && deploymentStatus === 'deployed') {
      // Check if app ready message already exists to prevent infinite loop
      const hasAppReadyMessage = messages.some(msg => msg.content.includes("app is ready"));
      if (!hasAppReadyMessage) {
        const appReadyMessage: Message = {
          role: "assistant",
          content: t("appReady"),
        };

        const newMessages = [...messages, appReadyMessage];
        setMessages(newMessages);
        onUpdateProject({ messages: newMessages });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.prototypeCode, project.backendConfig, project.stage, deploymentStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for conversational chat messages from SSE (only when workflow is active)
  useEffect(() => {
    // Only connect to SSE when there's an active workflow running
    if (!projectId || !isGenerating) return;

    console.log('[Chat SSE] Connecting to stream for project:', projectId);

    // Track connection state to prevent error loop
    let connectionClosed = false;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const eventSource = new EventSource(`/api/langgraph/stream?projectId=${projectId}`);

    eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle chat:message events
        if (data.type === 'chat:message') {
          console.log('[Chat SSE] Received chat message:', data.message);

          // Add message to chat
          const assistantMessage: Message = {
            role: 'assistant',
            content: data.message
          };

          setMessages(prev => {
            // Avoid duplicates
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.content === data.message) return prev;
            return [...prev, assistantMessage];
          });

          // If it's a question requiring response
          if (data.metadata?.requiresResponse) {
            console.log('[Chat SSE] Question requires user input');
            setAwaitingUserInput(true);
            setShowInputNotification(true);
          }
        }
      } catch (error) {
        console.error('[Chat SSE] Error parsing message:', error);
      }
    });

    eventSource.onopen = () => {
      console.log('[Chat SSE] Connection opened');
      retryCount = 0; // Reset retry count on successful connection
    };

    eventSource.onerror = (error) => {
      // Prevent infinite error loops
      if (connectionClosed) return;

      retryCount++;

      // Only log errors during active workflows and under retry limit
      if (isGenerating && retryCount <= MAX_RETRIES) {
        console.error(`[Chat SSE] Connection error (attempt ${retryCount}/${MAX_RETRIES}):`, error);
      } else if (retryCount > MAX_RETRIES) {
        console.error('[Chat SSE] Max retries exceeded, closing connection');
        connectionClosed = true;
        eventSource.close();
      } else {
        // Silent close if workflow isn't generating
        connectionClosed = true;
        eventSource.close();
      }
    };

    return () => {
      console.log('[Chat SSE] Cleaning up connection');
      connectionClosed = true;
      eventSource.close();
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
      role: 'user',
      content: featureRequest
    };

    let currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setIsLoading(true);

    // Send request to API (will trigger editing workflow)
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: currentMessages,
          currentPlan: project.plan || "",
          stage: project.stage,
          prototypeCode: project.prototypeCode || "",
          files: project.files || null,
          description: project.description || "",
          backendConfig: project.backendConfig || null,
          projectId: project.id,
          context: project.context || null,
          featureAddRequest: featureId // Special flag for feature addition
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response
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
        role: "assistant",
        content: "Sorry, something went wrong while adding the feature. Please try again."
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

  // Fetch uploaded files when component mounts
  useEffect(() => {
    fetchUploadedFiles();
  }, [projectId]);

  const fetchUploadedFiles = async () => {
    try {
      const authToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('pb_auth='))
        ?.split('=')[1];

      const response = await fetch(`/api/files/list/${projectId}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedFiles(data.files || []);
      }
    } catch (error) {
      console.error('[Chat] Failed to fetch uploaded files:', error);
    }
  };

  const handleUploadComplete = (file: UploadedFile) => {
    setUploadedFiles(prev => [...prev, file]);
    // Optionally add a message to chat indicating file was uploaded
    const fileMessage: Message = {
      role: "system",
      content: `📎 Uploaded: **${file.fileName}** - Specify its purpose in your message (e.g., "use as logo" or "extract colors")`
    };
    setMessages(prev => [...prev, fileMessage]);
  };

  const handleSelectFile = (file: UploadedFile) => {
    // Add file reference to input
    setInput(prev => {
      const mention = `[File: ${file.fileName}]`;
      return prev ? `${prev} ${mention}` : mention;
    });
  };

  const handleDeleteFile = async (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // END FILE UPLOAD HANDLERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Hide input notification when user responds
    if (awaitingUserInput) {
      setAwaitingUserInput(false);
      setShowInputNotification(false);
    }

    const userMessage: Message = { role: "user", content: input.trim() };
    let currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput("");
    setIsLoading(true);

    // Set random loading message
    setLoadingMessage(getRandomLoadingMessage());

    // SSE connection is active and will receive:
    // - Conversational messages from editor (emitChatMessage)
    // - Workflow progress events
    // - User input requests when clarification needed

    try {
      console.log('[Chat] 📤 Sending messages to API:', currentMessages.length, 'messages');
      console.log('[Chat] 📝 Last user message:', currentMessages[currentMessages.length - 1]?.content.substring(0, 100));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: currentMessages,
          currentPlan: project.plan || "",
          stage: project.stage,
          prototypeCode: project.prototypeCode || "",
          files: project.files || null,
          description: project.description || "",
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
          role: 'assistant',
          content: data.response
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
        let responseContent = data.response;

        // Add conversational summary header (browser notice already in API response)
        const conversationalResponse = data.updatedCode || data.updatedFiles
          ? `**Here's what I changed:**\n\n${responseContent}`
          : responseContent;

        // IMPORTANT: Display AI metadata if available (model used, thinking process, etc.)
        if (data.aiMetadata) {
          console.log('[Chat] AI Metadata received:', data.aiMetadata);
        }

        const assistantMessage: Message = { role: "assistant", content: conversationalResponse };
        const updatedMessages = [...currentMessages, assistantMessage];
        setMessages(updatedMessages);

        const updates: any = { messages: updatedMessages };
        if (data.updatedPlan) updates.plan = data.updatedPlan;

        // Handle file updates from both building and editing stages
        if (data.updatedFiles || data.files) {
          // Force new array reference AND new object references to trigger React re-render and deployment
          const newFiles = (data.updatedFiles || data.files).map((f: any) => ({
            path: f.path,
            content: f.content
          }));
          updates.files = newFiles;
          console.log('[Chat] ✅ Files updated:', updates.files.length, 'files');
          console.log('[Chat] 📦 First file:', updates.files[0]?.path);
          console.log('[Chat] 📝 File paths:', newFiles.map((f: any) => f.path).join(', '));
          console.log('[Chat] 🔄 Triggering re-deployment with updated files...');
          console.log('[Chat] 🔍 CRITICAL: Files being saved to project:', JSON.stringify(newFiles.slice(0, 2), null, 2));
        }

        if (data.updatedCode) {
          updates.prototypeCode = data.updatedCode;

          // Transition to "editing" stage after first successful code generation
          if (project.stage === "building" && !project.editingStageEnabled) {
            updates.stage = "editing";
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
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: t("error") + "\n\n" + error.message,
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
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold mb-1 text-text-secondary" style={{ fontSize: '0.95rem' }}>{t("yourIdea")}</p>
                <p className="text-sm leading-relaxed text-text-primary">{project.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Progress Display - Below Initial Idea */}
        {workflowLogs.length > 0 && (
          <div className="mb-4">
            <WorkflowProgress
              logs={workflowLogs}
              isGenerating={isGenerating}
              fileProgress={fileProgress}
              deploymentStatus={deploymentStatus}
              deploymentError={deploymentError}
            />
          </div>
        )}

        {/* Chat Messages - Normal order */}
        {messages.filter(msg => msg.role !== "system").map((msg, idx) => (
          <div key={idx} className="mb-4">
            <ChatBubble
              type={msg.bubbleType || msg.role as "user" | "assistant"}
              content={msg.content}
              animate={false}
            />

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
                      ${action.disabled
                        ? 'bg-background-subtle border border-border-light text-text-tertiary cursor-not-allowed opacity-60'
                        : 'bg-background-raised border border-border-light text-text-primary hover:border-amber-400/50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Priority indicator */}
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        action.priority === 'high' ? 'bg-amber-500' :
                        action.priority === 'medium' ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`} />

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">{action.label}</div>
                        <div className="text-xs text-text-secondary truncate">{action.description}</div>
                        {action.disabledReason && (
                          <div className="text-xs text-warning mt-1">⚠️ {action.disabledReason}</div>
                        )}
                      </div>
                    </div>

                    {/* Add button */}
                    {!action.disabled && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-sm">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="mb-4">
            <ChatBubble
              type="thinking"
              content={project.stage === "building" ? loadingMessage : currentThinkingMessage}
              animate={true}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Confirmation Bubble - Show above input when action is needed */}
      {messages.some(msg => msg.role === "system" && msg.action) && (
        <div className="px-4 pb-3">
          {messages.filter(msg => msg.role === "system" && msg.action).map((msg, idx) => (
            <ChatBubble
              key={idx}
              type="confirmation"
              content="Ready to proceed with building?"
              animate={true}
            >
              <ActionButton variant="primary" onClick={msg.action!.onClick}>
                {msg.action!.label}
              </ActionButton>
              <ActionButton variant="secondary" onClick={() => {
                // Keep planning - user can continue chatting
              }}>
                Keep Planning
              </ActionButton>
            </ChatBubble>
          ))}
        </div>
      )}

      {/* Credit Purchase Modal - Show above chat input when out of credits */}
      {showCreditModal && (
        <div className="px-4 pb-3">
          <CreditPurchaseModal
            isOpen={showCreditModal}
            onClose={() => setShowCreditModal(false)}
          />
        </div>
      )}

      {/* Input Notification Dialog - Shows when awaiting user input */}
      {showInputNotification && (
        <div className="px-4 pb-2 relative">
          {/* Matching brand guidelines Information Modal - Subsidiary Golden */}
          <div className="relative bg-background-raised backdrop-blur-sm border-2 border-amber-400/20 rounded-2xl shadow-2xl p-4 overflow-hidden">
            {/* Gradient background overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-amber-400/5 to-yellow-600/10" />

            <div className="relative z-10 flex items-start gap-3">
              {/* Icon matching brand guidelines */}
              <div className="w-9 h-9 bg-gradient-to-br from-amber-400/20 to-yellow-600/20 border-2 border-amber-400/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
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
        <div className={`relative bg-background-raised border rounded-xl focus-within:border-brand-primary transition-colors ${showCreditModal ? 'border-orange-500/50' : awaitingUserInput ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-light'}`}>
          <textarea
            id="chat-input"
            name="message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={showCreditModal ? "⚡ Purchase credits to continue..." : t("chatPlaceholder")}
            className="w-full h-20 px-4 py-3 pr-14 text-sm bg-transparent resize-none focus:outline-none text-text-primary"
            disabled={isLoading || showCreditModal}
          />

          {/* File Upload & Send Buttons */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            {/* File Upload Button */}
            <FileUploadButton
              projectId={projectId}
              userId={project.userId}
              uploadedFiles={uploadedFiles}
              onUploadComplete={handleUploadComplete}
              onSelectFile={handleSelectFile}
              onDeleteFile={handleDeleteFile}
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 bg-gradient-brand text-text-inverse rounded-lg hover:bg-gradient-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title={isLoading ? t("thinking") : t("sendMessage")}
              aria-label={t("sendMessage")}
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
