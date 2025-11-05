"use client";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth/PocketBaseAuthProvider";
import { useLanguage } from "@/lib/language-context";
import { useTranslations } from "next-intl";
import { listUserProjects } from "@/lib/project-helpers";

type Project = {
  id: string;
  description: string;
  createdAt: string;
  userId?: string;
};

// Memoized Project Item Component
const ProjectItem = memo(function ProjectItem({
  project,
  onClick,
  onDelete,
  truncateText,
  formatDate,
  tCommon
}: {
  project: Project;
  onClick: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  truncateText: (text: string, maxLength: number) => string;
  formatDate: (date: string) => string;
  tCommon: any;
}) {
  const handleClick = useCallback(() => onClick(project.id), [onClick, project.id]);
  const handleDelete = useCallback((e: React.MouseEvent) => onDelete(project.id, e), [onDelete, project.id]);

  return (
    <div
      onClick={handleClick}
      className="group p-4 mb-2 bg-background-raised hover:bg-background-subtle border border-light hover:border-brand-primary/30 text-text-primary rounded-xl cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary mb-1 truncate">
            {truncateText(project.description, 35)}
          </p>
          <p className="text-xs text-text-tertiary flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDate(project.createdAt)}
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 text-text-secondary hover:text-red-500 rounded-lg transition-all"
          aria-label={tCommon("delete")}
        >
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.project.id === nextProps.project.id &&
         prevProps.project.description === nextProps.project.description &&
         prevProps.project.createdAt === nextProps.project.createdAt;
});

export function ProjectsSidebar() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed by default
  const router = useRouter();
  const { session } = useAuth();
  const { dir } = useLanguage();
  const isRTL = dir === "rtl";
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");

  useEffect(() => {
    // Don't load projects while auth is still loading
    if (session.isLoading) {
      return;
    }

    loadProjects();

    // Listen for new projects
    const handleStorageChange = () => loadProjects();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("projectCreated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("projectCreated", handleStorageChange);
    };
  }, [session.data?.user?.id, session.isLoading]);

  const loadProjects = async () => {
    const userId = session.data?.user?.id;
    if (!userId) {
      setProjects([]);
      return;
    }

    try {
      // Use the helper function which handles auth properly
      const userProjects = await listUserProjects(userId);

      // Also check localStorage for projects (fallback/hybrid approach)
      const localProjects: Project[] = [];
      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('project_')) {
            try {
              const projectData = JSON.parse(localStorage.getItem(key) || '{}');
              if (projectData.userId === userId || !projectData.userId) {
                localProjects.push({
                  id: projectData.id || key.replace('project_', ''),
                  description: projectData.description || 'Untitled Project',
                  createdAt: projectData.createdAt || new Date().toISOString(),
                  userId: projectData.userId
                });
              }
            } catch (e) {
              // Ignore invalid JSON
            }
          }
        }
      }

      // Combine and deduplicate projects (prefer PocketBase data)
      const pbProjectIds = new Set(userProjects.map(p => p.id));
      const combinedProjects = [
        ...userProjects.map((p) => ({
          id: p.id,
          description: p.description,
          createdAt: p.createdAt,
          userId: p.userId || undefined
        })),
        ...localProjects.filter(p => !pbProjectIds.has(p.id))
      ];

      // Sort by creation date (most recent first)
      combinedProjects.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      if (combinedProjects.length > 0) {
        console.log(`[ProjectsSidebar] Loaded ${combinedProjects.length} projects (${userProjects.length} from PB, ${localProjects.length} from localStorage)`);
      }
      setProjects(combinedProjects);
    } catch (error: any) {
      // Only log unexpected errors
      if (error && Object.keys(error).length > 0 && error?.status !== 401 && error?.status !== 403) {
        console.error("Error loading projects:", error);
      }
      setProjects([]);
    }
  };

  // Memoize utility functions
  const truncateText = useCallback((text: string, maxLength: number = 40) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }, []);

  const handleProjectClick = useCallback((projectId: string) => {
    router.push(`/project/${projectId}`);
  }, [router]);

  const deleteProject = useCallback(async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t("deleteConfirm"))) {
      try {
        const { pb, ensureAuth } = await import('@/lib/pocketbase');

        // Ensure auth is loaded before making request
        ensureAuth();

        if (!pb.authStore.isValid || !pb.authStore.token) {
          console.error("Not authenticated");
          return;
        }

        await pb.collection('projects').delete(projectId);
        loadProjects();
      } catch (error: any) {
        console.error("Error deleting project:", error);
        if (error.status === 401 || error.status === 403) {
          console.error("Authentication error - user may need to re-login");
        }
      }
    }
  }, [t, loadProjects]);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className={`fixed ${isRTL ? 'right-6' : 'left-6'} top-3.5 p-2 bg-background-raised hover:bg-background-subtle border border-light rounded-lg shadow-sm hover:shadow-md transition-all z-40 group`}
        aria-label={t("show")}
        title={t("projects")}
      >
        <svg
          className="w-4 h-4 text-text-primary group-hover:text-amber-500 transition-colors"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop - click outside to close */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
        onClick={() => setIsCollapsed(true)}
      />

      <div className={`fixed ${isRTL ? 'right-0 border-l' : 'left-0 border-r'} top-0 h-full w-80 bg-background-base border-light shadow-xl z-40 flex flex-col`}>
      {/* Header */}
      <div className="p-5 border-b border-light flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-md">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-text-primary">{t("projects")}</h2>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-2 hover:bg-background-subtle text-text-secondary hover:text-text-primary rounded-lg transition-all"
          aria-label={t("hide")}
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
              d={isRTL ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
            />
          </svg>
        </button>
      </div>

      {/* New Project Button */}
      <div className="p-4 border-b border-light">
        <button
          onClick={() => {
            setIsCollapsed(true);
            router.push('/');
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-400 to-yellow-600 hover:from-amber-500 hover:to-yellow-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all group"
        >
          <svg
            className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>{t("newProject")}</span>
        </button>
      </div>

      {/* Projects list */}
      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-background-subtle flex items-center justify-center">
              <svg
                className="w-10 h-10 text-text-tertiary"
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
            <p className="text-sm font-semibold text-text-primary mb-1">{t("noProjects")}</p>
            <p className="text-xs text-text-tertiary">
              {t("startCreating")}
            </p>
          </div>
        ) : (
          <div className="p-3">
            {projects.map((project) => (
              <ProjectItem
                key={project.id}
                project={project}
                onClick={handleProjectClick}
                onDelete={deleteProject}
                truncateText={truncateText}
                formatDate={formatDate}
                tCommon={tCommon}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with Settings */}
      <div className="p-4 border-t border-light">
        <a
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-background-raised border border-transparent hover:border-light transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 group-hover:from-brand-primary group-hover:to-yellow-600 flex items-center justify-center transition-all shadow-md">
            <svg
              className="w-5 h-5 text-white transition-transform group-hover:rotate-90 duration-300"
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
          </div>
          <span className="font-semibold text-text-primary group-hover:text-brand-primary transition-colors">
            {t("settings")}
          </span>
        </a>
      </div>
    </div>
    </>
  );
}
