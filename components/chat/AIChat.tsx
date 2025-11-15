'use client';

import { customAlphabet } from 'nanoid';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/PocketBaseAuthProvider';
import { createProject } from '@/lib/project-helpers';

interface UploadedFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
}

export default function AIChat() {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Auto');
  const [showCofounderTags, setShowCofounderTags] = useState(false);
  const [planningEnabled, setPlanningEnabled] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  const models = [
    'Auto',
    'Gemini 2.0 Flash Exp',
    'Gemini 2.5 Flash',
    'Gemini 2.0 Flash',
    'Gemini 1.5 Flash',
    'Gemini 1.5 Pro',
    'Gemini 2.0 (OpenRouter)',
    'Llama 3.2 3B',
    'Llama 3.1 8B',
    'Mistral 7B',
  ];

  const handleCofounderClick = () => {
    setShowCofounderTags(true);
    // Auto-hide tags after 5 seconds
    setTimeout(() => {
      setShowCofounderTags(false);
    }, 5000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if user is authenticated
    if (!user) {
      toast.error('Please log in to upload files');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);
      formData.append('purpose', 'design-reference'); // Homepage uploads are for design inspiration

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

      // Get auth token from cookie
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
      setUploadedFiles((prev) => [...prev, uploadedFile]);

      toast.success('File uploaded successfully!', {
        description: `${file.name} is ready to use in your project`,
        duration: 3000,
      });

      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
    } catch (error: any) {
      console.error('Upload error:', error);

      // Better error messages
      let errorMessage = 'Upload failed';
      if (error.message) {
        if (error.message.includes('Failed to create record')) {
          errorMessage = 'Database error: Please restart PocketBase and try again';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Too many uploads. Please wait a moment';
        } else if (error.message.includes('file too large')) {
          errorMessage = 'File is too large. Maximum size is 10MB';
        } else if (error.message.includes('Invalid file type')) {
          errorMessage = 'Invalid file type. Only images and PDFs are allowed';
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage, {
        duration: 5000,
        description: 'Please check your file and try again',
      });
      setUploadProgress(0);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (fileId: string) => {
    const file = uploadedFiles.find((f) => f.id === fileId);
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    toast.success('File removed', {
      description: file ? `${file.fileName} removed from upload list` : undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isLoading) return;

    setIsLoading(true);

    try {
      // Use custom alphabet (no hyphens for PocketBase compatibility)
      // Use only alphanumeric chars (no hyphens!) - PocketBase collection name requirements
      const nanoid = customAlphabet(
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        15
      );
      const projectId = nanoid(); // Exactly 15 chars, alphanumeric only
      const userId = user?.id;

      // Append uploaded file information to description
      let finalDescription = description.trim();
      if (uploadedFiles.length > 0) {
        finalDescription += '\n\n--- Design References ---\n';
        uploadedFiles.forEach((file) => {
          finalDescription += `\nFile: ${file.fileName}\nURL: ${file.fileUrl}\nType: ${file.fileType}\n`;
        });
        finalDescription +=
          '\nPlease analyze the design references and incorporate their design patterns, layout, and styling into the application.';
      }

      // Use the createProject helper to save to both localStorage and PocketBase
      // If planning is enabled, start in "planning" stage, otherwise go directly to "building"
      await createProject({
        id: projectId,
        description: finalDescription,
        stage: planningEnabled ? 'planning' : 'building',
        userId: userId || null,
      });

      // Dispatch event to update sidebar
      window.dispatchEvent(new Event('projectCreated'));

      router.push(`/project/${projectId}`);
    } catch (error: any) {
      console.error('Error creating project:', error);

      // FIXED: Provide specific error messages based on the error type
      let errorMessage = 'Failed to create project. ';

      if (
        error?.status === 0 ||
        error?.message?.includes('fetch') ||
        error?.message?.includes('network')
      ) {
        errorMessage +=
          'Database connection failed. Make sure PocketBase is running on localhost:8090.';
      } else if (error?.status === 401 || error?.status === 403) {
        errorMessage += 'Authentication error. Please log in and try again.';
      } else if (error?.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }

      alert(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative bg-background-raised border border-light rounded-xl focus-within:border-brand-primary transition-colors">
        {/* Textarea */}
        <textarea
          id="app-idea"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Describe your app idea..."
          className="w-full h-36 px-4 py-4 pr-20 text-base bg-transparent resize-none focus:outline-none text-left text-text-primary"
          disabled={isLoading}
        />

        {/* Cofounder Button - Bottom Left */}
        <div className="absolute left-3 bottom-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleCofounderClick}
            className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
              showCofounderTags
                ? 'bg-background-subtle text-text-primary'
                : 'bg-background-subtle text-text-secondary hover:bg-background-overlay hover:text-text-primary'
            }`}
            title="Cofounder features (coming soon)"
          >
            <svg
              className={`w-5 h-5 ${showCofounderTags ? 'animate-bounce' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </button>

          {/* Animated Tags */}
          {showCofounderTags && (
            <div className="flex items-center gap-2 animate-slideIn">
              <span
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-brand text-white shadow-lg animate-fadeIn"
                style={{ animationDelay: '0ms' }}
              >
                Startup
              </span>
              <span
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-info text-white shadow-lg animate-fadeIn"
                style={{ animationDelay: '100ms' }}
              >
                Magic
              </span>
              <span
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-success text-white shadow-lg animate-fadeIn"
                style={{ animationDelay: '200ms' }}
              >
                Coming
              </span>
              <span
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-error text-white shadow-lg animate-fadeIn"
                style={{ animationDelay: '300ms' }}
              >
                Soon
              </span>
            </div>
          )}
        </div>

        {/* Plan Toggle, File Upload (Design), and Send Button */}
        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          {/* Plan Toggle */}
          <button
            type="button"
            onClick={() => setPlanningEnabled(!planningEnabled)}
            className={`p-2.5 rounded-lg flex items-center justify-center transition-all group relative ${
              planningEnabled
                ? 'bg-yellow-400/20 text-yellow-600 dark:text-yellow-400'
                : 'bg-background-subtle text-text-tertiary hover:bg-background-overlay hover:text-text-secondary'
            }`}
          >
            {/* Fast Tooltip */}
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap">
              Plan First
            </span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </button>

          {/* File Upload Button (Design Inspiration) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`p-2.5 rounded-lg flex items-center justify-center transition-colors group relative ${
              uploading
                ? 'bg-transparent'
                : 'bg-background-subtle text-text-tertiary hover:bg-background-overlay hover:text-amber-400'
            }`}
          >
            {/* Fast Tooltip */}
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap">
              {uploading ? 'Uploading...' : 'Upload Design Reference'}
            </span>
            <div className="relative w-5 h-5 overflow-hidden">
              {/* Background icon - always visible */}
              <svg
                className={`w-5 h-5 absolute inset-0 transition-colors ${uploading ? 'text-gray-300 dark:text-gray-600' : ''}`}
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
                    className="w-5 h-5 absolute inset-0 text-amber-400"
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

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!description.trim() || isLoading}
            className="p-2.5 bg-gradient-to-r from-amber-400 to-yellow-600 text-text-inverse rounded-lg hover:from-amber-500 hover:to-yellow-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title={isLoading ? 'Creating...' : 'Submit'}
            aria-label="Submit"
          >
            {isLoading ? (
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Uploaded Files Display */}
      {uploadedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-2 rounded-lg border border-border-light bg-background-raised hover:border-amber-400 transition-all group"
            >
              <div className="w-8 h-8 rounded bg-gradient-to-r from-amber-400 to-yellow-600 flex items-center justify-center flex-shrink-0">
                {file.fileType.startsWith('image/') ? (
                  <svg
                    className="w-4 h-4 text-white"
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
                ) : (
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">
                  {file.fileName}
                </div>
                <div className="text-xs text-text-tertiary">Design Reference</div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-text-tertiary hover:text-red-600 transition-colors"
                title="Remove file"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bottom disclaimer */}
      <p className="text-center text-xs mt-3 text-text-primary">
        Vibebaba can make mistakes. Please double-check responses.
      </p>
    </form>
  );
}
