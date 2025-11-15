'use client';

import { FileImage, FileText, Trash2, Upload as UploadIcon } from 'lucide-react';
import { useState } from 'react';
import type { UploadedFile } from './FileUploadButton';

interface UploadedFilesListProps {
  files: UploadedFile[];
  onDelete: (id: string) => Promise<void>;
  onRefresh?: () => void;
}

export function UploadedFilesList({ files, onDelete, onRefresh }: UploadedFilesListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this file? This action cannot be undone.')) {
      return;
    }

    setDeleting(id);

    try {
      // Get auth token from cookie
      const authToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('pb_auth='))
        ?.split('=')[1];

      const response = await fetch(`/api/files/${id}`, {
        method: 'DELETE',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      await onDelete(id);

      console.log('✅ File deleted successfully');

      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(error.message || 'Failed to delete file');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="border-t border-border-light p-3 bg-background-subtle">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <UploadIcon className="w-4 h-4 text-amber-400" />
          Uploaded Files
        </h4>
        <span className="text-xs text-text-tertiary">{files.length}</span>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-xs text-text-tertiary">No files uploaded yet</p>
          <p className="text-xs text-text-tertiary mt-1">
            Use the upload button in chat to add files
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-background-base transition-all group"
            >
              {/* File Icon */}
              <div className="w-8 h-8 rounded-lg bg-gradient-brand-br flex items-center justify-center flex-shrink-0 shadow-md">
                {file.fileType.startsWith('image/') ? (
                  <FileImage className="w-4 h-4 text-white" />
                ) : file.fileType === 'application/pdf' ? (
                  <FileText className="w-4 h-4 text-white" />
                ) : (
                  <FileImage className="w-4 h-4 text-white" />
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate text-text-primary font-medium">
                  {file.fileName}
                </div>
                <div className="text-xs text-text-tertiary flex items-center gap-1">
                  {file.purpose === 'asset' ? (
                    <span>📦 Asset</span>
                  ) : file.purpose === 'design-reference' ? (
                    <span>🎨 Design</span>
                  ) : file.purpose === 'both' ? (
                    <span>📦🎨 Both</span>
                  ) : (
                    <span>⏳ Pending</span>
                  )}
                  {file.designAnalysis && <span className="ml-1 text-amber-400">✨</span>}
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleDelete(file.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={deleting === file.id}
                title="Delete file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
