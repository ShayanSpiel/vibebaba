'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/PocketBaseAuthProvider';
import { ProfileButton } from '@/components/auth/ProfileButton';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Footer } from '@/components/Footer';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/lib/language-context';
import type { ProjectData } from '@/lib/project-helpers';
import { listUserProjects } from '@/lib/project-helpers';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();
  const { dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const t = useTranslations('projects');
  const tCommon = useTranslations('common');

  useEffect(() => {
    loadProjects();
  }, [user?.id]);

  const loadProjects = async () => {
    if (!user?.id) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const userProjects = await listUserProjects(user.id);
      setProjects(userProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/project/${projectId}`);
  };

  const deleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        const { pb } = await import('@/lib/database/pocketbase');
        await pb.collection('projects').delete(projectId);

        // Also remove from localStorage
        const pbMapping = localStorage.getItem(`pb_project_map_${projectId}`);
        if (pbMapping) {
          localStorage.removeItem(`project_${pbMapping}`);
          localStorage.removeItem(`pb_project_map_${projectId}`);
        }
        localStorage.removeItem(`project_${projectId}`);

        loadProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'planning':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'building':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'error':
        return 'bg-red-500/10 text-red-500 border-red-500/30';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
    }
  };

  const getStageBadge = (stage: string) => {
    const labels: Record<string, string> = {
      planning: 'Planning',
      building: 'Building',
      completed: 'Completed',
      error: 'Error',
    };
    return labels[stage] || stage;
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background-base flex flex-col">
        {/* Header */}
        <header className="h-16 sticky top-0 z-30 bg-background-base border-b border-light shadow-sm">
          <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">V</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-text-primary">Vibebaba</h1>
                  <p className="text-xs text-text-tertiary">My Projects</p>
                </div>
              </button>
            </div>

            {/* Right Navigation */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Pricing Button */}
              <a
                href="/pricing"
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 text-white text-sm font-semibold rounded-xl hover:from-amber-500 hover:to-yellow-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Pricing
              </a>

              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Profile */}
              <ProfileButton variant="compact" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-text-primary mb-2">My Projects</h1>
                  <p className="text-text-secondary">
                    {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                  </p>
                </div>
                <button
                  onClick={() => router.push('/')}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-500 hover:to-yellow-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all group"
                >
                  <svg
                    className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Project</span>
                </button>
              </div>
            </div>

            {/* Projects Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-6 bg-background-raised border border-light rounded-xl animate-pulse"
                  >
                    <div className="h-4 bg-background-subtle rounded mb-3"></div>
                    <div className="h-3 bg-background-subtle rounded w-2/3 mb-4"></div>
                    <div className="h-3 bg-background-subtle rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-background-subtle flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-text-tertiary"
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
                </div>
                <h2 className="text-xl font-bold text-text-primary mb-2">No projects yet</h2>
                <p className="text-text-secondary mb-6">
                  Start creating your first AI-powered application
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-500 hover:to-yellow-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Create Your First Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleProjectClick(project.id)}
                    className="group p-6 bg-background-raised hover:bg-background-subtle border border-light hover:border-brand-primary/30 rounded-xl cursor-pointer transition-all hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-2">
                          {project.description}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border ${getStageColor(project.stage)}`}
                          >
                            {getStageBadge(project.stage)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteProject(project.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 text-text-secondary hover:text-red-500 rounded-lg transition-all"
                        aria-label="Delete project"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-text-tertiary">
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {formatDate(project.createdAt)}
                      </div>
                      {project.deployUrl && (
                        <div className="flex items-center gap-1 text-green-500">
                          <svg
                            className="w-4 h-4"
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
                          Deployed
                        </div>
                      )}
                    </div>

                    {project.plan && (
                      <div className="mt-4 pt-4 border-t border-light">
                        <p className="text-sm text-text-secondary line-clamp-2">
                          {truncateText(project.plan, 100)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </ProtectedRoute>
  );
}
