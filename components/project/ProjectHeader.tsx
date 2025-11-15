'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/auth/PocketBaseAuthProvider';
import { ProfileButton } from '@/components/auth/ProfileButton';
import { useProjectSettings } from '@/lib/contexts/ProjectSettingsContext';
import ProjectSettingsModal from './ProjectSettingsModal';
import PublishModal from './PublishModal';

interface ProjectHeaderProps {
  projectTitle: string;
  activeView: 'preview' | 'code' | 'database';
  onViewChange: (view: 'preview' | 'code' | 'database') => void;
  projectId: string;
  deployUrl?: string;
  onUpdateDeployUrl?: (url: string) => void;
  onUpdateTitle?: (title: string) => void;
  deploymentStatus?: 'idle' | 'deploying' | 'deployed' | 'failed';
}

// Truncate title to max 4 words
const truncateTitle = (title: string, maxWords: number = 4): string => {
  const words = title.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return title;
  }
  return words.slice(0, maxWords).join(' ') + '...';
};

export default function ProjectHeader({
  projectTitle,
  activeView,
  onViewChange,
  projectId,
  deployUrl,
  onUpdateDeployUrl,
  onUpdateTitle,
  deploymentStatus = 'idle',
}: ProjectHeaderProps) {
  const router = useRouter();
  const t = useTranslations('project');
  const { user } = useAuth();
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(projectTitle);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);
  const projectMenuRef = useRef<HTMLDivElement>(null);

  // 🎯 SINGLE SOURCE OF TRUTH: Use centralized project settings context
  const { settings: projectSettings } = useProjectSettings();

  const displayTitle = truncateTitle(projectTitle);

  // Close download modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadRef.current && !downloadRef.current.contains(event.target as Node)) {
        setShowDownloadModal(false);
      }
    };

    if (showDownloadModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadModal]);

  // Close project menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
        setShowProjectMenu(false);
      }
    };

    if (showProjectMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProjectMenu]);

  // Check if user has active subscription
  const hasActiveSubscription =
    user?.packageId && user?.packageExpiry ? new Date(user.packageExpiry) > new Date() : false;

  const isPublished = !!deployUrl;

  const handleDownload = () => {
    setShowDownloadModal(!showDownloadModal);
  };

  const handleActualDownload = async () => {
    // Get project files from localStorage
    const projectData = localStorage.getItem(`project_${projectId}`);
    if (!projectData) {
      alert('No project data found');
      return;
    }

    const project = JSON.parse(projectData);
    const files = project.files || [];

    if (files.length === 0) {
      alert('No files to download');
      return;
    }

    // Create a simple zip-like structure by creating individual files
    // For now, we'll download as a single text file with all code
    let allCode = '';
    files.forEach((file: any) => {
      allCode += `// File: ${file.path}\n`;
      allCode += `${'='.repeat(50)}\n`;
      allCode += file.content;
      allCode += '\n\n';
    });

    // Create blob and download
    const blob = new Blob([allCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_code.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowDownloadModal(false);
  };

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const handlePublish = () => {
    setShowPublishModal(true);
  };

  const handlePublishSubmit = () => {
    // PublishModal handles the actual publishing logic
    // This callback is called after successful publish
    console.log('Project published successfully');
  };

  const handleShare = async () => {
    if (!deployUrl) return;

    try {
      await navigator.clipboard.writeText(`https://${deployUrl}`);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== projectTitle && onUpdateTitle) {
      onUpdateTitle(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditedTitle(projectTitle);
    setIsEditingTitle(false);
  };

  const handleDuplicateProject = async () => {
    setShowProjectMenu(false);
    try {
      // Get project data from localStorage
      const projectData = localStorage.getItem(`project_${projectId}`);
      if (!projectData) {
        alert('No project data found');
        return;
      }

      const project = JSON.parse(projectData);

      // Create a new project ID
      const newProjectId = `proj_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Duplicate project with new ID and modified name
      const duplicatedProject = {
        ...project,
        id: newProjectId,
        description: `${projectTitle} (Copy)`,
        createdAt: new Date().toISOString(),
        deployUrl: undefined, // Clear deploy URL for duplicate
      };

      // Save to localStorage
      localStorage.setItem(`project_${newProjectId}`, JSON.stringify(duplicatedProject));

      // Save to PocketBase
      const { pb } = await import('@/lib/database/pocketbase');
      await pb.collection('projects').create({
        userId: user?.id,
        description: duplicatedProject.description,
        plan: duplicatedProject.plan,
        stage: duplicatedProject.stage,
        files: duplicatedProject.files,
        context: duplicatedProject.context,
        stylingConfig: duplicatedProject.stylingConfig,
        backendConfig: duplicatedProject.backendConfig,
      });

      // Navigate to the new project
      router.push(`/project/${newProjectId}`);
    } catch (error) {
      console.error('Failed to duplicate project:', error);
      alert('Failed to duplicate project. Please try again.');
    }
  };

  const handleUpdateProject = async (updates: any) => {
    try {
      // Get current project data
      const projectData = localStorage.getItem(`project_${projectId}`);
      if (!projectData) return;

      const project = JSON.parse(projectData);

      // Update project
      const updatedProject = {
        ...project,
        ...updates,
      };

      // Save to localStorage
      localStorage.setItem(`project_${projectId}`, JSON.stringify(updatedProject));

      // Update in PocketBase
      const { pb } = await import('@/lib/database/pocketbase');
      const records = await pb.collection('projects').getFullList({
        filter: `userId = "${user?.id}"`,
      });

      const projectRecord = records.find((r: any) => {
        const storedId = r.projectId || r.id;
        return storedId === projectId;
      });

      if (projectRecord) {
        await pb.collection('projects').update(projectRecord.id, updates);
      }

      // Update title if changed
      if (updates.description && onUpdateTitle) {
        onUpdateTitle(updates.description);
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  };

  // Get project data for settings modal - merge localStorage with centralized settings
  const [projectData, setProjectData] = useState<any>(null);

  useEffect(() => {
    const loadProjectData = () => {
      const data = localStorage.getItem(`project_${projectId}`);
      if (data) {
        const parsed = JSON.parse(data);

        // 🎯 SINGLE SOURCE OF TRUTH: Merge with centralized settings from context
        if (projectSettings) {
          console.log('[ProjectHeader] ✅ Using centralized settings from context');

          if (projectSettings.stylingConfig) {
            parsed.stylingConfig = projectSettings.stylingConfig;
          }

          if (projectSettings.projectName) {
            parsed.projectName = projectSettings.projectName;
            // Update the title callback if project name changed
            if (onUpdateTitle && projectSettings.projectName !== projectTitle) {
              onUpdateTitle(projectSettings.projectName);
            }
          }
        }

        setProjectData(parsed);
      }
    };

    loadProjectData();

    // Re-load when localStorage changes or when settings are saved
    const handleStorageChange = () => {
      console.log('[ProjectHeader] Storage event detected, reloading project data');
      loadProjectData();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [projectId, onUpdateTitle, projectTitle, projectSettings]);

  return (
    <header className="h-16 bg-background-base border-b border-light flex items-center px-6 shadow-sm">
      {/* Left: Logo & Title - Fixed width to match chat panel */}
      <div className="flex items-center gap-4 w-96 flex-shrink-0">
        <button
          onClick={() => router.push('/')}
          className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center hover:shadow-lg transition-all shadow-md group"
          title="Back to Home"
        >
          <span className="text-white font-bold text-xl group-hover:scale-110 transition-transform">
            V
          </span>
        </button>
        <div className="h-8 w-px bg-border-light"></div>
        <div className="flex-1 min-w-0 flex items-center gap-2 group">
          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') handleTitleCancel();
                }}
                className="flex-1 px-2 py-1 bg-background-raised border border-amber-400 rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                autoFocus
              />
              <button
                onClick={handleTitleSave}
                className="p-1 hover:bg-background-subtle rounded transition-colors"
                title="Save"
              >
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
              <button
                onClick={handleTitleCancel}
                className="p-1 hover:bg-background-subtle rounded transition-colors"
                title="Cancel"
              >
                <svg
                  className="w-4 h-4 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-base font-bold text-text-primary truncate" title={projectTitle}>
                {displayTitle}
              </h1>
              <div className="relative flex-shrink-0" ref={projectMenuRef}>
                <button
                  onClick={() => setShowProjectMenu(!showProjectMenu)}
                  className="p-1 hover:bg-background-subtle rounded transition-colors opacity-100"
                  title="Project options"
                >
                  <svg
                    className="w-4 h-4 text-text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Project Dropdown Menu */}
                {showProjectMenu && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-background-raised border border-light rounded-lg shadow-xl z-50 overflow-hidden">
                    <button
                      onClick={() => {
                        setShowProjectMenu(false);
                        setShowSettingsModal(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-background-subtle transition-colors flex items-center gap-3"
                    >
                      <svg
                        className="w-4 h-4 text-text-secondary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Settings
                    </button>
                    <button
                      onClick={handleDuplicateProject}
                      className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-background-subtle transition-colors flex items-center gap-3 border-t border-light"
                    >
                      <svg
                        className="w-4 h-4 text-text-secondary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Duplicate
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Middle: View Toggle Buttons - Aligned with preview section */}
      <div className="flex-1 flex items-center px-6">
        <div className="flex items-center gap-1 bg-background-raised border border-light rounded-xl p-1 shadow-sm">
          <button
            onClick={() => onViewChange('preview')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeView === 'preview'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-600 text-white shadow-lg'
                : 'text-text-secondary hover:bg-background-subtle hover:text-text-primary'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {t('preview')}
            </div>
          </button>
          <button
            onClick={() => onViewChange('code')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeView === 'code'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-600 text-white shadow-lg'
                : 'text-text-secondary hover:bg-background-subtle hover:text-text-primary'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              Files
            </div>
          </button>
          <button
            onClick={() => onViewChange('database')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeView === 'database'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-600 text-white shadow-lg'
                : 'text-text-secondary hover:bg-background-subtle hover:text-text-primary'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                />
              </svg>
              {t('database')}
            </div>
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Download Code Button - Neutral Color with Dropdown */}
        <div className="relative" ref={downloadRef}>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-background-raised border border-light text-text-primary text-sm font-semibold rounded-xl hover:bg-background-subtle transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            title="Download Code"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download
          </button>

          {/* Download Dropdown Modal */}
          {showDownloadModal && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-background-raised border border-light rounded-xl shadow-2xl z-50 overflow-hidden">
              {hasActiveSubscription ? (
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-text-primary">Download Your Code</h3>
                    <p className="text-xs text-text-secondary">
                      Download all your project files in a convenient format.
                    </p>
                  </div>
                  <button
                    onClick={handleActualDownload}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-600 text-white text-sm font-semibold rounded-lg hover:from-amber-500 hover:to-yellow-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download Code Files
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary">Upgrade to Download</h3>
                    <p className="text-xs text-text-secondary">
                      Download your code files by upgrading to a premium plan. Get unlimited access
                      to all your projects!
                    </p>
                  </div>
                  <button
                    onClick={handleUpgrade}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-600 text-white text-sm font-semibold rounded-lg hover:from-amber-500 hover:to-yellow-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Upgrade Now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upgrade Button - Only show if no active subscription */}
        {!hasActiveSubscription && (
          <button
            onClick={handleUpgrade}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 text-white text-sm font-semibold rounded-xl hover:from-amber-500 hover:to-yellow-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            title="Upgrade Subscription"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Upgrade
          </button>
        )}

        {/* Publish Button - Success Gradient */}
        <button
          onClick={() => {
            if (deploymentStatus !== 'deployed') {
              alert(
                'Your project must be deployed before publishing. Please wait for the deployment to complete.'
              );
            } else {
              handlePublish();
            }
          }}
          disabled={deploymentStatus !== 'deployed'}
          className={`px-4 py-2 text-white text-sm font-semibold rounded-xl transition-all shadow-md flex items-center gap-2 ${
            deploymentStatus === 'deployed'
              ? 'bg-gradient-success hover:opacity-90 hover:shadow-lg cursor-pointer'
              : 'bg-gray-400 cursor-not-allowed opacity-60'
          }`}
          title={
            deploymentStatus === 'deployed'
              ? 'Publish Project'
              : deploymentStatus === 'deploying'
                ? 'Deploying... Please wait'
                : deploymentStatus === 'failed'
                  ? 'Deployment failed. Please fix errors first'
                  : 'Waiting for deployment...'
          }
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          {t('publish')}
        </button>

        {/* Share Button - Only show if published */}
        {isPublished && (
          <button
            onClick={handleShare}
            className="relative w-10 h-10 bg-background-raised border border-light rounded-xl hover:bg-background-subtle transition-all shadow-sm hover:shadow-md flex items-center justify-center group"
            title={copySuccess ? 'Copied!' : 'Copy Share Link'}
          >
            {copySuccess ? (
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-text-secondary group-hover:text-text-primary transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            )}
          </button>
        )}

        <ProfileButton variant="compact" />
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <PublishModal
          projectId={projectId}
          projectName={projectTitle}
          defaultName={projectTitle}
          currentDeployUrl={deployUrl}
          isPublished={isPublished}
          onPublish={handlePublishSubmit}
          onClose={() => setShowPublishModal(false)}
        />
      )}

      {/* Project Settings Modal */}
      {showSettingsModal && projectData && (
        <ProjectSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          projectId={projectId}
          projectName={projectTitle}
          initialPrompt={projectData.userDescription || projectData.description || ''}
          stylingConfig={projectData.stylingConfig}
          onUpdateProject={handleUpdateProject}
        />
      )}
    </header>
  );
}
