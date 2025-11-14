'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

/**
 * Project Settings from Memory API
 * Centralized state to prevent redundant API calls
 */
interface ProjectSettings {
  projectName?: string;
  initialPrompt?: string;
  stylingConfig?: any;
  brandGuidelines?: any;
  userDescription?: string;
}

interface ProjectSettingsContextValue {
  settings: ProjectSettings | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateSettings: (updates: Partial<ProjectSettings>) => Promise<void>;
}

const ProjectSettingsContext = createContext<ProjectSettingsContextValue | undefined>(undefined);

interface ProjectSettingsProviderProps {
  projectId: string;
  children: ReactNode;
}

/**
 * Provider Component
 * Fetches project settings ONCE and shares across all child components
 */
export function ProjectSettingsProvider({ projectId, children }: ProjectSettingsProviderProps) {
  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch project settings from memory API
  const fetchSettings = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[ProjectSettings] 🔍 Fetching settings for project:', projectId);
      const res = await fetch(`/api/memory/project-settings?projectId=${projectId}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch settings: ${res.status}`);
      }

      const data = await res.json();

      if (data.success && data.data) {
        console.log('[ProjectSettings] ✅ Loaded settings:', data.data);
        setSettings(data.data);
      } else {
        console.log('[ProjectSettings] ⚠️ No settings found, using defaults');
        setSettings(null);
      }
    } catch (err) {
      console.error('[ProjectSettings] ❌ Failed to load settings:', err);
      setError(err as Error);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Initial fetch on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Update settings locally and persist to API
  const updateSettings = useCallback(async (updates: Partial<ProjectSettings>) => {
    console.log('[ProjectSettings] 📝 Updating settings:', updates);

    try {
      // Optimistic update
      setSettings(prev => ({ ...prev, ...updates }));

      // Persist to API
      const res = await fetch('/api/memory/project-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ...updates
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to update settings: ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        console.log('[ProjectSettings] ✅ Settings updated successfully');
        // Optionally refetch to get server state
        // await fetchSettings();
      }
    } catch (err) {
      console.error('[ProjectSettings] ❌ Failed to update settings:', err);
      // Rollback optimistic update
      await fetchSettings();
      throw err;
    }
  }, [projectId, fetchSettings]);

  const value: ProjectSettingsContextValue = {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    updateSettings
  };

  return (
    <ProjectSettingsContext.Provider value={value}>
      {children}
    </ProjectSettingsContext.Provider>
  );
}

/**
 * Hook to access project settings
 * Must be used within ProjectSettingsProvider
 */
export function useProjectSettings() {
  const context = useContext(ProjectSettingsContext);

  if (context === undefined) {
    throw new Error('useProjectSettings must be used within ProjectSettingsProvider');
  }

  return context;
}