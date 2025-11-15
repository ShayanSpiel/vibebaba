'use client';

import { ChevronRight, FileImage, FileSearch, Paperclip, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface UploadedFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  purpose: 'asset' | 'design-reference' | 'both' | 'pending';
  designAnalysis?: any;
  created?: string;
  updated?: string;
}

interface FileUploadButtonProps {
  projectId: string;
  userId: string;
  uploadedFiles: UploadedFile[];
  onUploadComplete: (file: UploadedFile) => void;
  onSelectFile: (file: UploadedFile) => void;
  onDeleteFile: (fileId: string) => void;
}

export function FileUploadButton({
  projectId,
  userId,
  uploadedFiles,
  onUploadComplete,
  onSelectFile,
  onDeleteFile,
}: FileUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      formData.append('userId', userId);
      formData.append('purpose', 'pending'); // Will be determined from chat message

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Get auth token from cookie or localStorage
      const authToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('pb_auth='))
        ?.split('=')[1];

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const uploadedFile = await response.json();
      onUploadComplete(uploadedFile);

      toast.success(`${file.name} uploaded - specify intent in your message`);

      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Upload failed');
      setUploadProgress(0);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectFromFiles = (file: UploadedFile) => {
    onSelectFile(file);
    setShowFileSelector(false);
    toast.success(`Selected: ${file.fileName}`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`p-2 rounded-lg transition-colors group relative ${
              uploading
                ? 'bg-transparent'
                : 'bg-background-subtle text-text-tertiary hover:bg-background-overlay hover:text-amber-400'
            }`}
            disabled={uploading}
          >
            {/* Fast Tooltip */}
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap">
              {uploading ? 'Uploading...' : 'Upload Design Reference'}
            </span>
            <div className="relative w-4 h-4 overflow-hidden">
              {/* Background icon - always visible */}
              <svg
                className={`w-4 h-4 absolute inset-0 transition-colors ${uploading ? 'text-gray-300 dark:text-gray-600' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>

              {/* Water fill effect - fills from bottom to top */}
              {uploading && (
                <div
                  className="absolute inset-0 overflow-hidden transition-all duration-300 ease-out"
                  style={{
                    clipPath: `inset(${100 - uploadProgress}% 0 0 0)`,
                  }}
                >
                  <svg
                    className="w-4 h-4 absolute inset-0 text-amber-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                  {/* Subtle wave animation at the top of fill */}
                  <div
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 animate-pulse"
                    style={{
                      top: `${100 - uploadProgress}%`,
                      opacity: 0.6,
                    }}
                  />
                </div>
              )}
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="w-4 h-4 mr-2" />
            Upload New File
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowFileSelector(true)}
            disabled={uploadedFiles.length === 0}
          >
            <FileSearch className="w-4 h-4 mr-2" />
            Select from Files
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        multiple={false}
        accept="image/*,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* File Selector Modal */}
      <Dialog open={showFileSelector} onOpenChange={setShowFileSelector}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select from Uploaded Files</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-auto">
            {uploadedFiles.length === 0 ? (
              <p className="text-center text-text-tertiary py-8">No files uploaded yet</p>
            ) : (
              uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleSelectFromFiles(file)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border-light hover:border-amber-400 hover:bg-background-subtle cursor-pointer transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-brand-br flex items-center justify-center flex-shrink-0">
                    {file.fileType.startsWith('image/') ? (
                      <FileImage className="w-5 h-5 text-white" />
                    ) : (
                      <FileSearch className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                      {file.fileName}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {file.purpose === 'asset'
                        ? '📦 Asset'
                        : file.purpose === 'design-reference'
                          ? '🎨 Design Reference'
                          : file.purpose === 'both'
                            ? '📦🎨 Both'
                            : '⏳ Pending'}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-amber-400 flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
