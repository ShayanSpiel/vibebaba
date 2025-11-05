"use client";

import React, { useState } from "react";
import { WorkflowLog } from "@/lib/hooks/useWorkflowLogs";
import Markdown from "@/components/Markdown";

interface WorkflowProgressProps {
  logs: WorkflowLog[];
  isGenerating: boolean;
  fileProgress?: {
    totalFiles: number;
    createdFiles: string[];
    currentFile?: string;
  };
  deploymentStatus?: 'idle' | 'deploying' | 'deployed' | 'failed';
  deploymentError?: string;
}

// Role names mapping
const ROLE_NAMES: Record<string, string> = {
  founder: "Managing Director",
  pm: "Product Manager",
  ux: "UX Designer",
  frontend: "Frontend Engineer",
  backend: "Backend Engineer",
  qa: "QA Manager",
  devops: "DevOps Engineer",
  editor: "Software Engineer",
  "context-analyzer": "Code Analyst"
};

// AutoGen sub-agent roles (user-friendly startup roles)
const AUTOGEN_ROLES: Record<string, string> = {
  analyst: "Tech Lead",
  fixer: "Software Engineer",
  fileops: "DevOps Engineer",
  reviewer: "QA Tester"
};

// Fun, professional messages for each role
const ROLE_START_MESSAGES: Record<string, string> = {
  founder: "Analyzing your vision and setting project direction...",
  pm: "Breaking down requirements and planning features...",
  ux: "Designing the perfect user experience...",
  frontend: "Crafting beautiful, responsive interfaces...",
  backend: "Building robust server architecture...",
  qa: "Ensuring everything works perfectly...",
  devops: "Setting up deployment and infrastructure...",
  editor: "Analyzing your code and applying changes...",
  "context-analyzer": "Analyzing change scope and identifying files to modify..."
};

const ROLE_COMPLETE_MESSAGES: Record<string, string> = {
  founder: "Vision defined! Project scope is crystal clear.",
  pm: "Requirements mapped! Ready for implementation.",
  ux: "Design complete! User flow is optimized.",
  frontend: "UI built! Your app looks amazing.",
  backend: "Backend ready! All APIs are functional.",
  qa: "Quality checked! Everything is working smoothly.",
  devops: "Deployment configured! Your app is production-ready.",
  // editor and context-analyzer use dynamic summaries from backend, no static messages
};

// Helper function to get role-specific static icons
const getRoleIcon = (nodeName: string) => {
  const icons: Record<string, React.ReactElement> = {
    founder: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    pm: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    ux: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    frontend: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    backend: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
    qa: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    devops: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    editor: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    "context-analyzer": (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    )
  };
  return icons[nodeName] || icons.founder;
};

export default function WorkflowProgress({ logs, isGenerating, fileProgress, deploymentStatus, deploymentError }: WorkflowProgressProps) {
  // Separate AutoGen events and main workflow events
  const autoGenLogs = logs.filter(log => log.type.startsWith('autogen:'));
  const filteredLogs = logs.filter(log => !log.type.startsWith('autogen:'));

  // Group logs by node for better organization
  const nodeGroups: Record<string, WorkflowLog[]> = {};

  filteredLogs.forEach(log => {
    // ✅ Filter out AutoGen agent nodes (they're shown nested under QA)
    if (log.nodeName && !log.nodeName.includes('autogen')) {
      if (!nodeGroups[log.nodeName]) {
        nodeGroups[log.nodeName] = [];
      }
      nodeGroups[log.nodeName].push(log);
    }
  });

  return (
    <div className="space-y-3">
      {Object.entries(nodeGroups).map(([nodeName, nodeLogs]) => {
        const startLog = nodeLogs.find(l => l.type === 'node:start');
        const completeLog = nodeLogs.find(l => l.type === 'node:complete');
        const errorLog = nodeLogs.find(l => l.type === 'node:error');
        const progressLogs = nodeLogs.filter(l => l.type === 'progress');
        const latestProgress = progressLogs[progressLogs.length - 1];

        const roleName = ROLE_NAMES[nodeName] || nodeName;

        // Special handling for DevOps node - override completion based on deployment status
        let isActive = startLog && !completeLog && !errorLog;
        let actualCompleteLog = completeLog;
        let actualErrorLog = errorLog;

        if (nodeName === 'devops') {
          if (deploymentStatus === 'deploying') {
            // Override: Keep DevOps active even if backend emitted complete
            isActive = true;
            actualCompleteLog = undefined;
          } else if (deploymentStatus === 'failed') {
            // Override: Show as error if deployment failed
            isActive = false;
            actualCompleteLog = undefined;
            actualErrorLog = {
              type: 'node:error',
              projectId: '',
              timestamp: new Date().toISOString(),
              message: deploymentError || 'Deployment failed'
            };
          } else if (deploymentStatus === 'deployed') {
            // Deployment succeeded - show as complete
            isActive = false;
            actualCompleteLog = completeLog;
          }
        }

        return (
          <div key={nodeName} className="space-y-2">
            {/* Task Card */}
            <div className="bg-background-raised border border-light rounded-xl p-4 shadow-sm">
              {/* Header with role and status */}
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md ${
                  actualErrorLog
                    ? 'bg-gradient-error'
                    : actualCompleteLog
                    ? 'bg-gradient-success'
                    : 'bg-gradient-brand'
                }`}>
                  {getRoleIcon(nodeName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-text-primary">{roleName}</div>
                  <div className="text-xs text-text-tertiary mt-0.5">
                    {actualCompleteLog && `Completed in ${(actualCompleteLog.duration! / 1000).toFixed(1)}s`}
                    {actualErrorLog && "Failed"}
                    {isActive && (
                      nodeName === 'devops' && deploymentStatus === 'deploying'
                        ? "Deploying your app and setting up preview..."
                        : latestProgress?.message || ROLE_START_MESSAGES[nodeName]
                    )}
                  </div>
                </div>
                {actualCompleteLog && (
                  <div className="w-5 h-5 bg-gradient-success rounded-md flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Summary Message */}
              {actualCompleteLog && (
                <div className="text-sm text-text-secondary mb-2 pl-11">
                  {nodeName === 'devops' ? (
                    "The app is ready - you can preview it now! ✨"
                  ) : (
                    <Markdown content={ROLE_COMPLETE_MESSAGES[nodeName] || actualCompleteLog.taskDetails?.summary || "Task completed successfully!"} />
                  )}
                </div>
              )}

              {/* Error Message */}
              {actualErrorLog && (
                <div className="text-sm pl-11">
                  <span className="bg-gradient-error bg-clip-text text-transparent">
                    {actualErrorLog.message || actualErrorLog.error?.message || "An error occurred"}
                  </span>
                </div>
              )}

              {/* Loading Animation - shows when active */}
              {isActive && (
                <div className="mt-3 pl-11 flex items-center gap-1.5">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
                    <div className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }}></div>
                    <div className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }}></div>
                  </div>
                  <span className="text-xs text-text-tertiary">Processing...</span>
                </div>
              )}

              {/* Detailed Thinking Process - Collapsible - shows after completion */}
              {!isActive && startLog?.thinkingProcess && (
                <details className="mt-3 pl-11 group">
                  <summary className="text-xs text-text-tertiary cursor-pointer hover:text-text-secondary transition-colors list-none flex items-center gap-1">
                    <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    View thinking process
                  </summary>
                  <div className="mt-2 pl-4 border-l-2 border-light space-y-3">
                    <div>
                      <div className="text-xs font-medium text-text-tertiary mb-1">Input</div>
                      <div className="text-sm text-text-secondary prose prose-sm max-w-none prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-p:my-1">
                        <Markdown content={startLog.thinkingProcess.userInput} />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-text-tertiary mb-1">Interpretation</div>
                      <div className="text-sm text-text-secondary prose prose-sm max-w-none prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-p:my-1">
                        <Markdown content={startLog.thinkingProcess.interpretation} />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-text-tertiary mb-1">Plan</div>
                      <div className="text-sm text-text-secondary prose prose-sm max-w-none prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-p:my-1">
                        <Markdown content={startLog.thinkingProcess.plan} />
                      </div>
                    </div>
                  </div>
                </details>
              )}

              {/* File Creation Progress - Show for frontend node */}
              {nodeName === 'frontend' && fileProgress && fileProgress.totalFiles > 0 && (
                <div className="mt-3 pl-11 space-y-1">
                  <div className="text-xs font-medium text-text-tertiary mb-2">
                    {errorLog ? `Failed creating files (${fileProgress.createdFiles.length}/${fileProgress.totalFiles})` : `Creating ${fileProgress.totalFiles} files...`}
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {Array.from({ length: fileProgress.totalFiles }).map((_, idx) => {
                      const fileName = fileProgress.createdFiles[idx];
                      const isCreated = idx < fileProgress.createdFiles.length;
                      const isCurrent = !errorLog && fileProgress.currentFile === fileName;

                      return (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          {isCreated ? (
                            <div className="w-3 h-3 bg-gradient-warning rounded flex items-center justify-center flex-shrink-0">
                              <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : isCurrent ? (
                            <div className="w-3 h-3 flex-shrink-0 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-gradient-blue rounded-full animate-pulse"></div>
                            </div>
                          ) : (
                            <div className="w-3 h-3 flex-shrink-0 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-text-tertiary rounded-full opacity-30"></div>
                            </div>
                          )}
                          <span className={`font-mono ${isCreated ? "text-text-secondary" : isCurrent ? "bg-gradient-blue bg-clip-text text-transparent" : "text-text-tertiary opacity-50"}`}>
                            {fileName || `File ${idx + 1}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AutoGen Debugging Team - Show for QA node when debugging */}
              {nodeName === 'qa' && autoGenLogs.length > 0 && (
                <div className="mt-3 pl-11 space-y-2">
                  <div className="text-xs font-medium text-text-tertiary mb-2">
                    🔧 Debugging Team
                  </div>
                  {['analyst', 'fixer', 'fileops', 'reviewer'].map((agentRole) => {
                    // Find logs for this specific agent
                    const agentStartLog = autoGenLogs.find(
                      log => log.type === 'autogen:agent:start' && log.agentRole === agentRole
                    );
                    const agentCompleteLog = autoGenLogs.find(
                      log => log.type === 'autogen:agent:complete' && log.agentRole === agentRole
                    );

                    // Only show agents that have started
                    if (!agentStartLog) return null;

                    const isAgentActive = agentStartLog && !agentCompleteLog;
                    const agentName = AUTOGEN_ROLES[agentRole] || agentRole;

                    return (
                      <div key={agentRole} className="flex items-center gap-2 text-xs">
                        {agentCompleteLog ? (
                          <div className="w-3 h-3 bg-gradient-success rounded flex items-center justify-center flex-shrink-0">
                            <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : isAgentActive ? (
                          <div className="w-3 h-3 flex-shrink-0 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-gradient-blue rounded-full animate-pulse"></div>
                          </div>
                        ) : (
                          <div className="w-3 h-3 flex-shrink-0 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-text-tertiary rounded-full opacity-30"></div>
                          </div>
                        )}
                        <span className={`${
                          agentCompleteLog
                            ? "text-text-secondary"
                            : isAgentActive
                            ? "bg-gradient-blue bg-clip-text text-transparent font-medium"
                            : "text-text-tertiary opacity-50"
                        }`}>
                          {agentName}
                        </span>
                        {isAgentActive && agentStartLog.message && (
                          <span className="text-text-tertiary ml-1">
                            - {agentStartLog.message}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Show loading indicator if generating and no logs yet */}
      {isGenerating && logs.length === 0 && (
        <div className="bg-background-raised border border-light rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-md">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium text-text-primary">Starting your project...</div>
              <div className="text-xs text-text-tertiary mt-0.5">Initializing workflow with AI team</div>
            </div>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
              <div className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }}></div>
              <div className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
