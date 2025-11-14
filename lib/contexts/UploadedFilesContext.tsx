'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

/**
 * Uploaded file from API
 */
export interface UploadedFile {
  path: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface UploadedFilesContextValue {
  files: UploadedFile[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  addFile: (file: UploadedFile) => void;
}

const UploadedFilesContext = createContext<UploadedFilesContextValue | undefined>(undefined);

interface UploadedFilesProviderProps {
  projectId: string;
  children: ReactNode;
}

/**
 * Provider Component - Single source of truth for uploaded files
 * Fetches files ONCE on mount and shares across all child components
 */
export function UploadedFilesProvider({ projectId, children }: UploadedFilesProviderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch uploaded files from API
  const fetchFiles = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[UploadedFiles] 🔍 Fetching files for project:', projectId);

      // Get auth token from cookies (for API authentication)
      const authToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('pb_auth='))
        ?.split('=')[1];

      const response = await fetch(`/api/files/list/${projectId}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Project not found or no files - not an error, just empty
          console.log('[UploadedFiles] ℹ️ No files found for project');
          setFiles([]);
          return;
        }
        throw new Error(`Failed to fetch files: ${response.status}`);
      }

      const data = await response.json();
      const fetchedFiles = data.files || [];

      console.log('[UploadedFiles] ✅ Loaded files:', fetchedFiles.length);
      setFiles(fetchedFiles);
    } catch (err) {
      console.error('[UploadedFiles] ❌ Failed to load files:', err);
      setError(err as Error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Initial fetch on mount
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Add a file to the list (optimistic update)
  const addFile = useCallback((file: UploadedFile) => {
    console.log('[UploadedFiles] ➕ Adding file:', file.name);
    setFiles(prev => [...prev, file]);
  }, []);

  const value: UploadedFilesContextValue = {
    files,
    loading,
    error,
    refetch: fetchFiles,
    addFile
  };

  return (
    <UploadedFilesContext.Provider value={value}>
      {children}
    </UploadedFilesContext.Provider>
  );
}

/**
 * Hook to access uploaded files
 * Must be used within UploadedFilesProvider
 */
export function useUploadedFiles() {
  const context = useContext(UploadedFilesContext);

  if (context === undefined) {
    throw new Error('useUploadedFiles must be used within UploadedFilesProvider');
  }

  return context;
}
