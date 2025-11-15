'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { AIStatusIndicator } from '@/components/AIStatusIndicator';
import CreditPurchaseModal from '@/components/payment/CreditPurchaseModal';
import ChatPanelClaude from '@/components/project/ChatPanelClaude';
import GenerationErrorModal from '@/components/project/GenerationErrorModal';
import PreviewTabs from '@/components/project/PreviewTabs';
import ProjectHeader from '@/components/project/ProjectHeader';
import { ProjectSettingsProvider } from '@/lib/contexts/ProjectSettingsContext';
import { UploadedFilesProvider } from '@/lib/contexts/UploadedFilesContext';
import { ensureAuth, pb } from '@/lib/database/pocketbase';
import { useWorkflowLogs } from '@/lib/hooks/useWorkflowLogs';
import { useLanguage } from '@/lib/language-context';
import { getProject, updateProject as updateProjectHelper } from '@/lib/project-helpers';

interface ProjectFile {
  path: string; // e.g., "index.html", "about.html", "css/style.css"
  content: string;
}

interface ProjectData {
  id: string;
  description: string;
  stage: string;
  createdAt: string;
  plan?: string;
  prototypeCode?: string; // Deprecated: kept for backward compatibility
  files?: ProjectFile[]; // New: support multiple files
  backendConfig?: any;
  messages?: Array<{ role: string; content: string }>;
  loadingMessage?: string;
  context?: any;
  deployUrl?: string; // LangGraph workflow deploy URL
  _refreshKey?: number; // Internal: triggers refresh
  workflowLogs?: any[]; // Workflow execution logs with role messages
  allRequestedFeatures?: any[]; // CRITICAL: All features for MVP + follow-up
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeView, setActiveView] = useState<'preview' | 'code' | 'database'>('preview');
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [deploymentStatus, setDeploymentStatus] = useState<
    'idle' | 'deploying' | 'deployed' | 'failed'
  >('idle');
  const [deploymentError, setDeploymentError] = useState<string | undefined>();
  const [lastShownError, setLastShownError] = useState<string | undefined>();

  const t = useTranslations('project');
  const tCommon = useTranslations('common');
  const { dir } = useLanguage();
  const isRTL = dir === 'rtl';

  // 🎯 REMOVED: lastMemoryCheckRef - no longer needed since ProjectSettingsProvider handles all fetching

  // ✨ Real-time workflow logs streaming
  const { logs, currentNode, isComplete } = useWorkflowLogs({
    projectId,
    enabled: isGenerating,
    initialLogs: project?.workflowLogs || [], // Restore logs from previous session
    onComplete: async () => {
      console.log('🎉 Workflow complete! Generation finished.');
      setIsGenerating(false);

      // Add follow-up message with feature actions after initial generation
      if (project && project.allRequestedFeatures && project.allRequestedFeatures.length > 0) {
        // Filter out features already included in MVP
        const queuedFeatures = project.allRequestedFeatures.filter((f: any) => !f.included_in_mvp);

        if (queuedFeatures.length > 0) {
          console.log('[Project] Adding follow-up message with queued features:', queuedFeatures);

          const followUpMessage = {
            role: 'assistant' as const,
            content: `✨ Your app is ready! I've built the core features. ${queuedFeatures.length > 1 ? 'Here are additional features you can add:' : "Here's an additional feature you can add:"}`,
            actions: queuedFeatures.map((f: any) => ({
              type: 'feature-add' as const,
              featureId: f.id,
              label: f.name,
              description: f.description || '',
              priority: f.priority || 'medium',
              disabled: false,
            })),
          };

          // Add message to project
          const currentMessages = project.messages || [];
          const updatedMessages = [...currentMessages, followUpMessage];

          try {
            await updateProjectHelper(projectId, { messages: updatedMessages });
            console.log('[Project] ✅ Follow-up message added successfully');
          } catch (error) {
            console.error('[Project] Failed to add follow-up message:', error);
          }
        }
      }
    },
    onError: (error) => {
      console.error('❌ Workflow error:', error);
    },
  });

  // Persist workflow logs to project whenever they change
  useEffect(() => {
    if (logs.length > 0) {
      updateProjectHelper(projectId, { workflowLogs: logs }).catch((error) => {
        console.warn('Failed to persist workflow logs:', error);
      });
    }
  }, [logs, projectId]);

  // Handle deployment status changes from PreviewTabs
  const handleDeploymentStatusChange = (
    status: 'idle' | 'deploying' | 'deployed' | 'failed',
    error?: string
  ) => {
    setDeploymentStatus(status);
    setDeploymentError(error);

    // Reset error tracking when deployment succeeds or starts
    if (status === 'deployed' || status === 'deploying') {
      setLastShownError(undefined);
    }

    // Show error modal only once per unique error
    if (status === 'failed' && error && error !== lastShownError) {
      setErrorMessage(`Deployment failed: ${error}`);
      setShowErrorModal(true);
      setLastShownError(error);
    }
  };

  // Extract project name from generated files (e.g., from metadata or HTML title)
  const extractProjectName = (files: ProjectFile[]): string | null => {
    if (!files || files.length === 0) return null;

    // Check Next.js layout file for metadata
    const layoutFile = files.find(
      (f) => f.path === 'src/app/layout.tsx' || f.path === 'app/layout.tsx'
    );
    if (layoutFile) {
      // Look for metadata export with title
      const metadataTitleMatch = layoutFile.content.match(/title:\s*['"]([^'"]+)['"]/);
      if (metadataTitleMatch) {
        return metadataTitleMatch[1];
      }
    }

    // Check page.tsx for title in metadata
    const pageFile = files.find((f) => f.path === 'src/app/page.tsx' || f.path === 'app/page.tsx');
    if (pageFile) {
      const metadataTitleMatch = pageFile.content.match(/title:\s*['"]([^'"]+)['"]/);
      if (metadataTitleMatch) {
        return metadataTitleMatch[1];
      }
    }

    // Fallback: Look for <title> tag in any HTML file
    for (const file of files) {
      if (file.path.endsWith('.html')) {
        const titleMatch = file.content.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch) {
          return titleMatch[1];
        }
      }
    }

    return null;
  };

  useEffect(() => {
    const loadProject = async () => {
      try {
        const projectData = await getProject(projectId);
        if (projectData) {
          // 🎯 REMOVED: Redundant API call - ProjectSettingsProvider handles this centrally
          // All project settings are now managed by the context at the page level

          // Extract project name from generated files if needed
          if (projectData.files && projectData.files.length > 0) {
            const extractedName = extractProjectName(projectData.files);
            if (extractedName && extractedName !== projectData.description) {
              projectData.description = extractedName;
            }
          }

          setProject(projectData as any);
        }
      } catch (error: any) {
        if (error?.status !== 404) {
          console.error('Failed to load project:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  useEffect(() => {
    // Generate plan if in planning stage and no plan exists
    if (project && project.stage === 'planning' && !project.plan) {
      generatePlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.stage, project?.plan]);

  // Add feature action buttons for existing completed projects (retroactive)
  const featureMessageAddedRef = useRef(false);
  useEffect(() => {
    const addFeatureActionsIfNeeded = async () => {
      if (!project || featureMessageAddedRef.current) return;

      // Only for projects that are completed (have files) and have queued features
      if (
        project.files &&
        project.files.length > 0 &&
        project.allRequestedFeatures &&
        project.allRequestedFeatures.length > 0
      ) {
        const messages = project.messages || [];

        // Check if we already have a message with actions
        const hasActionMessage = messages.some((m: any) => m.actions && m.actions.length > 0);

        if (!hasActionMessage) {
          const queuedFeatures = project.allRequestedFeatures.filter(
            (f: any) => !f.included_in_mvp
          );

          if (queuedFeatures.length > 0) {
            featureMessageAddedRef.current = true;
            console.log('[Project] Retroactively adding feature actions for existing project');

            const followUpMessage = {
              role: 'assistant' as const,
              content: `✨ Your app is ready! I've built the core features. ${queuedFeatures.length > 1 ? 'Here are additional features you can add:' : "Here's an additional feature you can add:"}`,
              actions: queuedFeatures.map((f: any) => ({
                type: 'feature-add' as const,
                featureId: f.id,
                label: f.name,
                description: f.description || '',
                priority: f.priority || 'medium',
                disabled: false,
              })),
            };

            const updatedMessages = [...messages, followUpMessage];

            try {
              await updateProjectHelper(projectId, { messages: updatedMessages });
              console.log('[Project] ✅ Retroactive feature actions added successfully');
            } catch (error) {
              console.error('[Project] Failed to add retroactive feature actions:', error);
            }
          }
        }
      }
    };

    addFeatureActionsIfNeeded();
  }, [project?.id, project?.files, project?.allRequestedFeatures]);

  // Use ref to track if generation has been triggered
  const generationTriggeredRef = useRef(false);

  useEffect(() => {
    // Generate complete app (prototype + backend) if in building stage
    // Only trigger if we have neither prototypeCode nor backendConfig AND not currently generating
    if (
      project &&
      project.stage === 'building' &&
      !project.prototypeCode &&
      !project.backendConfig &&
      !isGenerating &&
      !generationTriggeredRef.current // Prevent multiple triggers
    ) {
      generationTriggeredRef.current = true;
      generateCompleteApp();
    }

    // Reset the ref when project changes or when generation completes
    if (project?.prototypeCode || project?.backendConfig) {
      generationTriggeredRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.stage, project?.prototypeCode, project?.backendConfig]);

  const updateProject = async (updates: Partial<ProjectData>) => {
    console.log('🔥 updateProject CALLED with updates:', {
      hasFiles: !!updates.files,
      filesCount: updates.files?.length || 0,
      filePaths: updates.files?.map((f: any) => f.path).slice(0, 5),
      hasRefreshKey: !!updates._refreshKey,
    });

    setProject((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };

      console.log('💾 Updating project STATE:', {
        projectId,
        hasFiles: !!updated.files,
        filesCount: updated.files?.length || 0,
        stage: updated.stage,
      });

      // Use the project-helpers updateProject function for consistent saving
      updateProjectHelper(projectId, updates as any)
        .then(() => {
          console.log('✅ updateProjectHelper completed successfully');
        })
        .catch((err) => {
          console.error('❌ Failed to update project:', err);
        });

      return updated;
    });
  };

  const generatePlan = async () => {
    if (!project) return;
    try {
      const response = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: project.description }),
      });

      const data = await response.json();

      // Check for insufficient credits
      if (response.status === 402 || data.insufficientTokens) {
        console.log('[Project] Insufficient credits detected during plan generation');
        setShowCreditModal(true);
        return;
      }

      if (response.ok) {
        updateProject({
          plan: data.plan,
          context: data.context, // Store context for prototype generation
        });
      } else {
        // Plan generation failed - show error modal
        const errorMsg = data.error || 'Failed to generate plan';
        setErrorMessage(errorMsg);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      setErrorMessage(String(error));
      setShowErrorModal(true);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BRAND-ALIGNED MULTI-MESSAGE CONSTRUCTION
  // Creates success, summary, and feature action messages
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const constructCompletionMessages = (workflowData: any, workflowSummary: string) => {
    const messages: any[] = [];

    // 🐛 DEBUG: Check what we're receiving
    console.log('🐛 [constructCompletionMessages] workflowData:', {
      hasAllRequestedFeatures: !!workflowData.allRequestedFeatures,
      featuresCount: workflowData.allRequestedFeatures?.length,
      features: workflowData.allRequestedFeatures,
    });

    // 1. Success message (normal assistant bubble, left-aligned)
    messages.push({
      role: 'assistant',
      content:
        '**Your app is ready!**\n\nTest it in the preview, explore the code, and check out your database.',
    });

    // 2. Features built message (INFORMATIONAL bubble with actual feature list)
    const mvpFeatures =
      workflowData.allRequestedFeatures?.filter((f: any) => f.included_in_mvp) || [];
    console.log('🐛 [constructCompletionMessages] mvpFeatures:', mvpFeatures);

    if (mvpFeatures.length > 0) {
      // Sort features by priority and user-requested first
      // Priority order: user-requested regular features > user-requested infrastructure > suggested features
      const sortedFeatures = [...mvpFeatures].sort((a: any, b: any) => {
        // User-requested features come first
        if (a.userRequested && !b.userRequested) return -1;
        if (!a.userRequested && b.userRequested) return 1;

        // Within user-requested: regular features before infrastructure
        if (a.userRequested && b.userRequested) {
          const aIsRegular = a.classification !== 'infrastructure';
          const bIsRegular = b.classification !== 'infrastructure';
          if (aIsRegular && !bIsRegular) return -1;
          if (!aIsRegular && bIsRegular) return 1;
        }

        // Keep original order for same category
        return 0;
      });

      // Show feature names only (descriptions can hallucinate features not built)
      const featureList = sortedFeatures.map((f: any, i: number) => `${i + 1}. ${f.name}`).join('\n');

      messages.push({
        role: 'assistant',
        content: `I built your app with these features:\n\n${featureList}`,
      });
    } else {
      // Fallback to workflow summary if no features extracted
      messages.push({
        role: 'assistant',
        content: `${workflowSummary}`,
      });
    }

    // 3. Remaining features - Each as a SEPARATE message with its own +Add button
    const remainingFeatures =
      workflowData.allRequestedFeatures?.filter((f: any) => !f.included_in_mvp && !f.completed) ||
      [];

    if (remainingFeatures.length > 0) {
      // Intro message
      messages.push({
        role: 'assistant',
        content: `You also requested **${remainingFeatures.length} more feature${remainingFeatures.length > 1 ? 's' : ''}**. Click +Add below to implement them:`,
      });

      // Each feature as a separate message with its own action button
      remainingFeatures.forEach((f: any) => {
        const unmetDeps = (f.dependencies || []).filter((depId: string) => {
          const dep = workflowData.allRequestedFeatures?.find((af: any) => af.id === depId);
          return dep && !dep.completed && !dep.included_in_mvp;
        });

        messages.push({
          role: 'assistant',
          content: `**${f.name}**\n${f.description}`,
          actions: [
            {
              type: 'feature-add',
              featureId: f.id,
              label: `Add ${f.name}`,
              description: f.description,
              priority: f.priority,
              disabled: unmetDeps.length > 0,
              disabledReason:
                unmetDeps.length > 0
                  ? `Requires: ${unmetDeps.map((id: string) => workflowData.allRequestedFeatures?.find((af: any) => af.id === id)?.name).join(', ')}`
                  : undefined,
            },
          ],
        });
      });
    }

    // 4. Infrastructure feature suggestions (Auth, Payments, Admin, etc.)
    const infrastructureFeatures =
      workflowData.infrastructureFeatures?.filter((f: any) => f.suggested && !f.userRequested) ||
      [];

    if (infrastructureFeatures.length > 0) {
      // Intro message for infrastructure suggestions
      messages.push({
        role: 'assistant',
        content: `💡 **Suggested enhancements** to make your app production-ready:`,
      });

      // Each infrastructure feature as a separate message with its own action button
      infrastructureFeatures.forEach((f: any) => {
        messages.push({
          role: 'assistant',
          content: `**${f.name}**\n${f.description}`,
          actions: [
            {
              type: 'feature-add',
              featureId: f.id,
              label: `Add ${f.name}`,
              description: f.description,
              priority: f.priority || 'medium',
              disabled: false,
            },
          ],
        });
      });
    }

    return messages;
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // END MESSAGE CONSTRUCTION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const generatePrototype = async () => {
    if (!project) return;
    try {
      const response = await fetch('/api/ai/prototype', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: project.plan,
          description: project.description,
          projectId: projectId,
          backendConfig: project.backendConfig,
          context: project.context, // Pass context from planning
        }),
      });

      const data = await response.json();
      if (response.ok) {
        updateProject({
          prototypeCode: data.code, // Backward compatibility
          files: data.files, // New multi-file support
        });
      }
    } catch (error) {
      console.error('Error generating prototype:', error);
    }
  };

  const generateBackend = async () => {
    if (!project) return;
    try {
      const response = await fetch('/api/ai/backend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: project.plan,
          description: project.description,
          prototypeCode: project.prototypeCode,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        updateProject({ backendConfig: data.backendConfig });
      }
    } catch (error) {
      console.error('Error generating backend:', error);
    }
  };

  const generateCompleteApp = async () => {
    if (!project || isGenerating) return;

    setIsGenerating(true);

    // STEP 1: Initial acknowledgment (remove any old "app is ready" messages)
    const cleanMessages = (project.messages || []).filter(
      (m) => !m.content.includes('app is ready') && !m.content.includes('Your app is ready')
    );

    updateProject({
      loadingMessage: '🚀 Starting the LangGraph workflow...',
      messages: cleanMessages, // Don't add the "initiating" message - WorkflowProgress shows this
    });

    try {
      // Use NEW LangGraph workflow endpoint (executes all 7 nodes with thinking processes)
      const workflowResponse = await fetch('/api/langgraph/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: project.description,
          projectId: projectId, // Pass existing projectId so SSE stream can match
        }),
      });

      // Check if response is actually JSON
      const contentType = workflowResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await workflowResponse.text();
        console.error('Error: API returned non-JSON response:', text.substring(0, 200));
        throw new Error(
          `API returned ${contentType || 'unknown content type'} instead of JSON. This might be a server error.`
        );
      }

      const workflowData = await workflowResponse.json();

      // 🐛 DEBUG: Check what API returned
      console.log(
        '🐛 [API Response] workflowData.allRequestedFeatures:',
        workflowData.allRequestedFeatures
      );

      // Check for insufficient credits
      if (workflowResponse.status === 402 || workflowData.insufficientTokens) {
        console.log('[Project] Insufficient credits detected during workflow execution');
        setShowCreditModal(true);
        setIsGenerating(false);
        updateProject({
          loadingMessage: undefined,
          prototypeCode: '<!-- Waiting for credits -->',
        });
        return;
      }

      if (workflowResponse.ok && workflowData.success) {
        console.log('📦 Workflow completed successfully:', {
          filesCount: workflowData.files?.length || 0,
          hasBackend: !!workflowData.backendConfig,
          completedNodes: workflowData.completedNodes,
        });

        // Create workflow summary message from logs
        const roleNames: Record<string, string> = {
          founder: 'Managing Director',
          pm: 'Product Manager',
          ux: 'UX Designer',
          frontend: 'Frontend Engineer',
          backend: 'Backend Engineer',
          qa: 'QA Manager',
          devops: 'DevOps Engineer',
        };

        const completedNodes = logs
          .filter(
            (log) =>
              log.type === 'node:complete' && log.nodeName && !log.nodeName.includes('autogen')
          )
          .map(
            (log) =>
              `✅ **${roleNames[log.nodeName!] || log.nodeName}** - ${log.taskDetails?.summary || 'Completed'}`
          );

        const workflowSummary =
          completedNodes.length > 0
            ? `**Team Workflow Summary:**\n\n${completedNodes.join('\n\n')}\n\n---\n\n`
            : '';

        // Extract project name from generated files
        const extractedName = extractProjectName(workflowData.files || []);
        const updates: any = {
          prototypeCode: workflowData.files?.[0]?.content || '', // Backward compatibility
          files: workflowData.files,
          backendConfig: workflowData.backendConfig,
          allRequestedFeatures: workflowData.allRequestedFeatures, // CRITICAL: Save features for follow-up
          context: workflowData.context,
          plan: workflowData.plan || project.plan,
          workflowLogs: logs, // ✅ Preserve workflow logs with role messages
          loadingMessage: undefined,
          stage: 'completed',
          messages: [
            ...(project.messages || []),
            ...constructCompletionMessages(workflowData, workflowSummary),
          ],
        };

        // Update project title if AI generated a better name
        if (extractedName && extractedName !== project.description) {
          console.log(
            '[Project] Updating title from description to AI-generated name:',
            extractedName
          );
          updates.description = extractedName;
        }

        // Update project with all workflow results and mark as completed
        // ✅ FIX 38: Changed "ready" to "completed" to match database schema
        updateProject(updates);

        // Initialize database with sample data if backend exists
        if (workflowData.backendConfig) {
          await initializeDatabase(workflowData.backendConfig);
        }
      } else {
        // Workflow error - show error modal
        const errorDetails = workflowData.metadata?.errors || workflowData.error || [];
        const errorMsg = Array.isArray(errorDetails)
          ? errorDetails.map((e: any) => `${e.node}: ${e.message}`).join(', ')
          : String(errorDetails);

        console.error('Workflow execution failed:', {
          error: workflowData.error,
          errorDetails,
          metadata: workflowData.metadata,
        });

        // CRITICAL FIX: Stop isGenerating BEFORE updating project to prevent loop
        setIsGenerating(false);

        // Show error modal
        setErrorMessage(errorMsg || 'Workflow execution failed');
        setShowErrorModal(true);

        updateProject({
          loadingMessage: undefined,
          prototypeCode: '<!-- Error: ' + (errorMsg || 'Workflow execution failed') + ' -->',
          messages: [
            ...(project.messages || []),
            {
              role: 'assistant',
              content: `❌ Sorry, something went wrong during the workflow execution: ${errorMsg || 'Unknown error'}. Please try again.`,
            },
          ],
        });
      }
    } catch (error) {
      console.error('Error generating app:', error);

      // Show error modal
      setErrorMessage(String(error));
      setShowErrorModal(true);

      updateProject({
        loadingMessage: undefined,
        prototypeCode: '<!-- Error: ' + String(error) + ' -->', // Set dummy code to prevent retry
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!project) return;

    // Close the error modal
    setShowErrorModal(false);
    setErrorMessage('');

    // Reset the generation trigger ref
    generationTriggeredRef.current = false;

    // Add consistent messaging like the initial generation flow
    const restartMessage = {
      role: 'assistant' as const,
      content:
        "🔄 Restarting the app generation process from the beginning...\n\nI'll re-analyze your idea and create a fresh plan.",
    };

    // Reset the project to initial state and set stage to planning
    await updateProject({
      plan: undefined,
      prototypeCode: undefined,
      files: undefined,
      backendConfig: undefined,
      context: undefined,
      workflowLogs: [], // ✅ Clear workflow logs for fresh start
      loadingMessage: '🔄 Resetting workflow and preparing for fresh generation...',
      stage: 'planning',
      messages: [...(project.messages || []), restartMessage],
    });

    // Wait a bit for the state to update, then trigger planning
    setTimeout(() => {
      // This will trigger the useEffect that generates the plan
      setIsGenerating(false);

      // Update loading message to match planning phase
      updateProject({
        loadingMessage: '🤔 Analyzing your idea and creating a comprehensive plan...',
      });
    }, 100);
  };

  const initializeDatabase = async (backendConfig: any) => {
    // Initialize database with sample data from backend config
    if (!backendConfig?.collections) return;

    console.log('🗄️ Initializing database for', backendConfig.collections.length, 'collections');

    // Ensure auth is loaded before making requests
    ensureAuth();

    // Check if user is authenticated
    if (!pb.authStore.isValid || !pb.authStore.model?.id) {
      console.warn('⚠️  User not authenticated, skipping database initialization in PocketBase');
      // Still create local data for the app to work
    }

    // Get PocketBase project ID
    const pbProjectId = localStorage.getItem(`pb_project_map_${projectId}`);

    // OPTIMIZATION: Batch fetch all project files upfront to avoid N+1 queries
    let existingFilesMap = new Map<string, any>();
    if (pb.authStore.isValid && pbProjectId) {
      try {
        const allProjectFiles = await pb.collection('project_files').getFullList({
          filter: `projectId = "${pbProjectId}"`,
          fields: 'id,path,content',
        });
        existingFilesMap = new Map(allProjectFiles.map((file) => [file.path, file]));
        console.log(`📦 Fetched ${allProjectFiles.length} existing files from PocketBase`);
      } catch (error) {
        console.warn('⚠️  Could not fetch existing files, will create new ones');
      }
    }

    for (const collection of backendConfig.collections) {
      const key = `db_${projectId}_${collection.name}`;

      // Only initialize if empty
      const existing = localStorage.getItem(key);
      if (!existing || existing === '[]') {
        console.log(`  📊 Creating sample data for collection: ${collection.name}`);

        // Generate sample data based on fields
        const sampleData = [];
        const numRecords = collection.name.toLowerCase().includes('user') ? 3 : 5;

        for (let i = 1; i <= numRecords; i++) {
          const record: any = { id: `${Date.now()}_${i}` };

          // Check if fields exist
          if (!collection.fields || collection.fields.length === 0) {
            console.warn(`  ⚠️ No fields found for ${collection.name}, adding default fields`);
            // Add default fields if none exist
            record['name'] = `Sample ${collection.name} ${i}`;
            record['description'] = `This is sample data for ${collection.name} entry ${i}`;
            record['status'] = i % 2 === 0 ? 'Active' : 'Inactive';
            record['created'] = new Date().toISOString().split('T')[0];
          } else {
            console.log(
              `  📝 Processing ${collection.fields.length} fields for ${collection.name}`
            );
            collection.fields.forEach((field: any) => {
              if (field.name === 'id') return;

              console.log(`    - Field: ${field.name} (${field.type})`);

              switch (field.type) {
                case 'text':
                  if (field.name.toLowerCase().includes('name')) {
                    record[field.name] = `Sample ${collection.name} ${i}`;
                  } else if (field.name.toLowerCase().includes('title')) {
                    record[field.name] = `Sample Title ${i}`;
                  } else if (field.name.toLowerCase().includes('description')) {
                    record[field.name] = `This is a sample description for ${collection.name} ${i}`;
                  } else {
                    record[field.name] = `Sample text ${i}`;
                  }
                  break;
                case 'email':
                  record[field.name] = `user${i}@example.com`;
                  break;
                case 'number':
                  record[field.name] = i * 10;
                  break;
                case 'bool':
                case 'boolean':
                  record[field.name] = i % 2 === 0;
                  break;
                case 'date':
                case 'datetime': {
                  const date = new Date();
                  date.setDate(date.getDate() - i);
                  record[field.name] = date.toISOString().split('T')[0];
                  break;
                }
                default:
                  record[field.name] = `Value ${i}`;
              }
            });
          }

          console.log(`  🔹 Created record:`, record);
          sampleData.push(record);
        }

        localStorage.setItem(key, JSON.stringify(sampleData));
        console.log(`  ✅ Created ${sampleData.length} records for ${collection.name}`);

        // Sync to PocketBase (only if authenticated and has project ID)
        if (pb.authStore.isValid && pbProjectId) {
          try {
            const filePath = `database/${collection.name}.json`;
            const fileContent = JSON.stringify(sampleData);

            // OPTIMIZATION: Use the pre-fetched map for O(1) lookup instead of query
            const existingFile = existingFilesMap.get(filePath);

            if (existingFile) {
              // Update existing file
              await pb.collection('project_files').update(existingFile.id, {
                content: fileContent,
                size: fileContent.length,
              });
              console.log(`  ☁️  Updated ${collection.name} in PocketBase`);
            } else {
              // Create new file
              await pb.collection('project_files').create({
                projectId: pbProjectId,
                path: filePath,
                content: fileContent,
                encoding: 'utf-8',
                size: fileContent.length,
              });
              console.log(`  ☁️  Saved ${collection.name} to PocketBase`);
            }
          } catch (pbError: any) {
            // Only log non-404 errors
            if (pbError?.status !== 404) {
              console.error(`  ❌ Failed to sync ${collection.name} to PocketBase:`, pbError);
              console.error('Error details:', {
                status: pbError.status,
                message: pbError.message,
                data: pbError.data,
              });
            }
          }
        } else {
          console.log(`  ⏭️  Skipping PocketBase sync (not authenticated or no project ID)`);
        }
      } else {
        console.log(`  ⏭️  ${collection.name} already has data, skipping`);
      }
    }

    console.log('✅ Database initialization complete');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-base flex items-center justify-center">
        <div className="text-center">
          {/* Contextual Icon Badge - consistent loading style */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            {/* Animated ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full border-4 border-light border-t-brand-primary animate-spin"></div>
            {/* Icon in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-lg">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <p className="text-lg text-text-primary font-bold">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background-base flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4 text-text-primary">{t('projectNotFound')}</h1>
          <a href="/" className="underline text-brand-primary hover:text-brand-primary-hover">
            {t('goBackHome')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <ProjectSettingsProvider projectId={projectId}>
      <UploadedFilesProvider projectId={projectId}>
        <div className="h-screen flex flex-col bg-background-base">
          {/* Top Header */}
          <ProjectHeader
            projectTitle={project.description || t('untitledProject')}
            activeView={activeView}
            onViewChange={setActiveView}
            projectId={projectId}
            deployUrl={project.deployUrl}
            onUpdateDeployUrl={(url) => updateProject({ deployUrl: url })}
            onUpdateTitle={(title) => updateProject({ description: title })}
            deploymentStatus={deploymentStatus}
          />

          {/* Main Content Area - Three Column Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Chat Panel */}
            <div className="w-96 border-r border-light bg-background-raised flex flex-col">
              <ChatPanelClaude
                projectId={projectId}
                project={project}
                onUpdateProject={updateProject}
                workflowLogs={logs}
                isGenerating={isGenerating}
                deploymentStatus={deploymentStatus}
                deploymentError={deploymentError}
                onGeneratingChange={setIsGenerating}
              />
            </div>

            {/* Right: Main Content Area */}
            <div className="flex-1 flex flex-col bg-background-base overflow-hidden">
              <PreviewTabs
                project={project}
                onUpdateProject={updateProject}
                activeView={activeView}
                onDeploymentStatusChange={handleDeploymentStatusChange}
              />
            </div>
          </div>

          {/* AI Status Indicator */}
          <AIStatusIndicator />

          {/* Generation Error Modal - Shows above chatbox */}
          {showErrorModal && (
            <GenerationErrorModal
              errorMessage={errorMessage}
              onRegenerate={handleRegenerate}
              onClose={() => setShowErrorModal(false)}
            />
          )}

          {/* Credit Purchase Modal - Fixed overlay over entire page */}
          {showCreditModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="max-w-2xl w-full mx-4">
                <CreditPurchaseModal
                  isOpen={showCreditModal}
                  onClose={() => setShowCreditModal(false)}
                />
              </div>
            </div>
          )}
        </div>
      </UploadedFilesProvider>
    </ProjectSettingsProvider>
  );
}
