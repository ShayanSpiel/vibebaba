'use client';

import { useEffect, useRef, useState } from 'react';
import { generateScaffold } from '@/deployment-server/nextjs-scaffold';
import { useUploadedFiles } from '@/lib/contexts/UploadedFilesContext';
import { useDeployment } from '@/lib/hooks/useDeployment';
import {
  getContextualLoadingMessage,
  getMaybeRareMessage,
  getTimeBasedMessage,
} from '@/lib/loading-messages';
import BrowserPreview from './BrowserPreview';
import CodeEditorPro from './CodeEditorPro';
import DatabaseViewerPro from './DatabaseViewerPro';
import FileTree, { type UploadedFile } from './FileTree';
import PlanPreview from './PlanPreview';

interface PreviewTabsProps {
  project: any;
  onUpdateProject: (updates: any) => void;
  activeView: 'preview' | 'code' | 'database';
  onDeploymentStatusChange?: (
    status: 'idle' | 'deploying' | 'deployed' | 'failed',
    error?: string
  ) => void;
}

export default function PreviewTabs({
  project,
  onUpdateProject,
  activeView,
  onDeploymentStatusChange,
}: PreviewTabsProps) {
  const [selectedFile, setSelectedFile] = useState<{ name: string; content: string } | null>(null);
  const deployment = useDeployment(project.id);
  const [planningMessage, setPlanningMessage] = useState<string>('');
  const [buildingMessage, setBuildingMessage] = useState<string>('');

  // 🎯 SINGLE SOURCE OF TRUTH: Use centralized uploaded files context (no API call!)
  const { files: uploadedFiles, refetch: fetchUploadedFiles } = useUploadedFiles();

  // Notify parent of deployment status changes
  useEffect(() => {
    console.log('[PreviewTabs] Deployment status changed:', deployment.status);
    if (onDeploymentStatusChange) {
      console.log('[PreviewTabs] Calling onDeploymentStatusChange with status:', deployment.status);
      onDeploymentStatusChange(deployment.status, deployment.error);
    }
  }, [deployment.status, deployment.error, onDeploymentStatusChange]);

  // Generate dynamic loading messages
  useEffect(() => {
    if (project.stage === 'planning' && !project.plan) {
      const timeBasedMsg = getTimeBasedMessage();
      const contextualMsg = getContextualLoadingMessage('thinking');
      const finalMsg = timeBasedMsg || getMaybeRareMessage(contextualMsg);
      setPlanningMessage(finalMsg);
    }
  }, [project.stage, project.plan]);

  useEffect(() => {
    if (project.loadingMessage) {
      const timeBasedMsg = getTimeBasedMessage();
      const contextualMsg = getContextualLoadingMessage('building');
      const finalMsg = timeBasedMsg || getMaybeRareMessage(contextualMsg);
      setBuildingMessage(finalMsg);
    }
  }, [project.loadingMessage]);

  // Debug logging
  useEffect(() => {
    console.log('📊 Deployment State:', {
      status: deployment.status,
      url: deployment.url,
      hasFiles: !!project.files,
      fileCount: project.files?.length || 0,
      projectStage: project.stage,
    });
  }, [deployment.status, deployment.url, project.files, project.stage]);

  // Update project with complete files after successful deployment
  useEffect(() => {
    if (
      deployment.status === 'deployed' &&
      deployment.filesDeployed &&
      deployment.filesDeployed > 0
    ) {
      console.log('📦 Deployment complete with', deployment.filesDeployed, 'files');
      // Files are already in project.files, no need to update
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deployment.status, deployment.filesDeployed]);

  // Smart deployment: handles both initial deploy and re-deploys
  // Use useRef to track if we've already deployed these files to prevent duplicates
  const filesHashRef = useRef<string>('');
  const hasDeployedOnce = useRef<boolean>(false);

  useEffect(() => {
    // Skip if no files
    if (!project.files || project.files.length === 0) {
      return;
    }

    // Create a hash of the files to detect actual changes
    const filesHash = JSON.stringify(
      project.files.map((f: any) => ({ path: f.path, content: f.content }))
    );

    console.log('🔍 [PreviewTabs] Deployment check:', {
      status: deployment.status,
      hasFiles: !!project.files,
      filesCount: project.files?.length || 0,
      hasDeployedOnce: hasDeployedOnce.current,
      filesChanged: filesHash !== filesHashRef.current,
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // DEPLOYMENT FILE PREPARATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // project.files contains only USER-FACING files (frontend code) from PocketBase.
    // Backend infrastructure files (api/*) are NOT stored in PocketBase to keep
    // the Code tab clean and professional.
    //
    // For DEPLOYMENT, we need ALL files including backend infrastructure.
    // Solution: Regenerate scaffold files (including api/*) before deploying.
    //
    // This ensures:
    // 1. Code tab shows clean user-facing code only
    // 2. Deployment receives complete app including backend
    // 3. No infrastructure code visible to users
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Helper function to prepare complete files for deployment
    const prepareDeploymentFiles = () => {
      // Generate scaffold files (includes backend if backendConfig exists)
      const scaffoldFiles = generateScaffold(project.id, project.backendConfig || null);

      // Merge user files with scaffold (user files take precedence)
      const fileMap = new Map();
      scaffoldFiles.forEach((file) => fileMap.set(file.path, file));
      project.files.forEach((file: any) => fileMap.set(file.path, file));

      const allFiles = Array.from(fileMap.values());
      console.log(
        `[PreviewTabs] 📦 Prepared ${allFiles.length} files for deployment (${project.files.length} user + ${scaffoldFiles.length} scaffold)`
      );

      return allFiles;
    };

    // Case 1: Initial deployment (status is idle and never deployed)
    if (deployment.status === 'idle' && !hasDeployedOnce.current) {
      const deploymentFiles = prepareDeploymentFiles();
      console.log(
        '🚀 [PreviewTabs] Initial deployment - deploying',
        deploymentFiles.length,
        'files'
      );
      hasDeployedOnce.current = true;
      filesHashRef.current = filesHash;
      deployment.deploy(deploymentFiles, project.backendConfig).catch((err) => {
        console.warn('⚠️  Auto-deploy failed, but files are still available locally:', err);
      });
      return;
    }

    // Case 2: Re-deployment (already deployed, files changed)
    if (deployment.isDeployed && filesHash !== filesHashRef.current) {
      console.log('✅ [PreviewTabs] Files CHANGED - scheduling re-deploy in 1s');
      filesHashRef.current = filesHash;
      const timer = setTimeout(() => {
        const deploymentFiles = prepareDeploymentFiles();
        console.log('🔄 Re-deploying changes with', deploymentFiles.length, 'files...');
        deployment.deploy(deploymentFiles, project.backendConfig);
      }, 1000);

      return () => clearTimeout(timer);
    }

    console.log('⏭️  [PreviewTabs] No deployment needed');
  }, [
    project.files,
    deployment.status,
    deployment.isDeployed,
    project.backendConfig,
    deployment.deploy,
    project.id,
  ]);

  return (
    <div className="h-full flex flex-col bg-background-base">
      {/* Preview View */}
      <div className={`h-full ${activeView === 'preview' ? '' : 'hidden'}`}>
        <div className="h-full">
          {project.stage === 'planning' && (
            <div className="h-full overflow-auto bg-background-base">
              {!project.plan ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center p-8 max-w-4xl mx-auto w-full">
                    {/* Contextual Icon Badge - matching BrowserPreview style */}
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      {/* Animated ring */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 animate-pulse"></div>
                      <div className="absolute inset-2 rounded-full border-4 border-light border-t-cyan-500 animate-spin"></div>
                      {/* Icon in center */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-xl bg-gradient-cyan flex items-center justify-center shadow-lg">
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
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                    {/* Dynamic planning message */}
                    <h2 className="text-xl font-bold mb-2 text-text-primary">{planningMessage}</h2>
                    <p className="text-sm text-text-tertiary">
                      AI is analyzing your idea and creating a comprehensive plan...
                    </p>
                  </div>
                </div>
              ) : (
                <PlanPreview
                  plan={project.plan}
                  context={project.context}
                  onPlanUpdate={(newPlan) => onUpdateProject({ plan: newPlan })}
                />
              )}
            </div>
          )}

          {/* ✅ FIX 40: Include "completed" stage (was "ready" before Fix 38) */}
          {(project.stage === 'building' || project.stage === 'completed') && (
            <>
              {project.loadingMessage ? (
                <div className="h-full flex items-center justify-center bg-background-base">
                  <div className="text-center max-w-md mx-auto px-4">
                    {/* Contextual Icon Badge - matching BrowserPreview style */}
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      {/* Animated ring */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 animate-pulse"></div>
                      <div className="absolute inset-2 rounded-full border-4 border-light border-t-orange-500 animate-spin"></div>
                      {/* Icon in center */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-xl bg-gradient-orange flex items-center justify-center shadow-lg">
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
                              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                    {/* Dynamic building message */}
                    <h2 className="text-xl font-bold mb-3 text-text-primary">{buildingMessage}</h2>
                    <p className="text-sm text-text-tertiary">
                      Grab a coffee ☕ Your startup is being born!
                    </p>
                  </div>
                </div>
              ) : (
                <BrowserPreview
                  projectId={project.id}
                  deploymentUrl={deployment.url}
                  isDeploying={deployment.isDeploying}
                  files={project.files || []}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Code View */}
      <div className={`h-full ${activeView === 'code' ? '' : 'hidden'}`}>
        <div className="h-full flex">
          {!project.prototypeCode && (!project.files || project.files.length === 0) ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8">
                <svg
                  className="w-16 h-16 text-text-tertiary mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                <p className="text-text-secondary text-lg font-medium">No files generated yet</p>
                <p className="text-sm text-text-tertiary mt-2">Generate a prototype to see code</p>
              </div>
            </div>
          ) : (
            <>
              {/* File Tree Sidebar */}
              <div className="w-52">
                <FileTree
                  files={[
                    // Use project.files if available (multi-file support), otherwise fallback to prototypeCode
                    // SAFETY: Filter out backend infrastructure files (api/*) from Code tab display
                    ...(project.files && project.files.length > 0
                      ? project.files
                          .filter((f: any) => !f.path.startsWith('api/'))
                          .map((f: any) => ({ name: f.path, content: f.content }))
                      : [{ name: 'index.html', content: project.prototypeCode }]),
                    // Add backend config file if exists
                    ...(project.backendConfig
                      ? [
                          {
                            name: 'config/database.json',
                            content: JSON.stringify(project.backendConfig, null, 2),
                          },
                        ]
                      : []),
                  ]}
                  onFileSelect={(file) => setSelectedFile(file)}
                  selectedFile={selectedFile?.name || null}
                  projectId={project.id}
                  uploadedFiles={uploadedFiles as any}
                  onRefreshUploadedFiles={fetchUploadedFiles}
                />
              </div>

              {/* Code Editor */}
              <div className="flex-1">
                {selectedFile ? (
                  <CodeEditorPro
                    file={selectedFile}
                    onSave={(fileName, newContent) => {
                      // Handle database config separately
                      if (fileName.includes('database.json')) {
                        try {
                          const newConfig = JSON.parse(newContent);
                          onUpdateProject({ backendConfig: newConfig });
                        } catch (e) {
                          alert('Invalid JSON format');
                        }
                      }
                      // Handle HTML files - update in files array if it exists
                      else if (project.files && project.files.length > 0) {
                        const updatedFiles = project.files.map((f: any) =>
                          f.path === fileName ? { ...f, content: newContent } : f
                        );
                        onUpdateProject({ files: updatedFiles });
                        // Also update prototypeCode if it's index.html for backward compatibility
                        if (fileName === 'index.html') {
                          onUpdateProject({ prototypeCode: newContent });
                        }
                      }
                      // Fallback to old behavior for backward compatibility
                      else if (fileName.includes('index.html')) {
                        onUpdateProject({ prototypeCode: newContent });
                      }
                      setSelectedFile({ name: fileName, content: newContent });
                    }}
                    onClose={() => setSelectedFile(null)}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-background-raised border-l border-light">
                    <div className="text-center p-8">
                      <svg
                        className="w-20 h-20 mx-auto mb-4 text-text-tertiary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-lg font-semibold text-text-primary">
                        Select a file from the explorer
                      </p>
                      <p className="text-sm text-text-secondary mt-2">
                        Click on any file to start editing
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Database View */}
      <div className={`h-full ${activeView === 'database' ? '' : 'hidden'}`}>
        <div className="h-full">
          {(project.stage === 'building' || project.stage === 'completed') &&
          project.backendConfig ? (
            <DatabaseViewerPro backendConfig={project.backendConfig} projectId={project.id} />
          ) : (
            <div className="h-full flex items-center justify-center bg-background-base">
              <div className="text-center p-8">
                <svg
                  className="w-16 h-16 text-text-tertiary mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                  />
                </svg>
                <p className="text-text-secondary text-lg font-medium">
                  Database not available yet
                </p>
                <p className="text-sm text-text-tertiary mt-2">
                  Confirm the plan to build your app with database
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
