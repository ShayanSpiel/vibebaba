"use client";

import { useState, useEffect, useRef } from "react";

interface CodeEditorProProps {
  file: { name: string; content: string };
  onSave: (fileName: string, newContent: string) => void;
  onClose?: () => void;
}

export default function CodeEditorPro({ file, onSave, onClose }: CodeEditorProProps) {
  const [code, setCode] = useState(file.content);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCode(file.content);
    setHasChanges(false);
  }, [file.name, file.content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    setHasChanges(e.target.value !== file.content);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate save delay
    onSave(file.name, code);
    setHasChanges(false);
    setIsSaving(false);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      if (hasChanges) {
        handleSave();
      }
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = code.substring(0, start) + "  " + code.substring(end);
      setCode(newValue);
      setHasChanges(true);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const lines = code.split("\n");
  const fileName = file.name.split('/').pop() || file.name;
  const fileExt = fileName.split('.').pop()?.toLowerCase();

  // Get language indicator
  const getLanguageLabel = () => {
    switch (fileExt) {
      case 'html': return 'HTML';
      case 'css': return 'CSS';
      case 'js': return 'JavaScript';
      case 'ts': return 'TypeScript';
      case 'jsx': return 'React JSX';
      case 'tsx': return 'React TSX';
      case 'json': return 'JSON';
      case 'md': return 'Markdown';
      default: return fileExt?.toUpperCase() || 'TEXT';
    }
  };

  return (
    <div className="h-full flex flex-col bg-background-base">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-background-raised to-background-subtle border-b border-light">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* File Icon */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400/10 to-yellow-400/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text-primary truncate">{fileName}</span>
              {hasChanges && !isSaving && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 rounded-full">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-amber-500 font-medium">Modified</span>
                </div>
              )}
              {showSaveSuccess && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-success/10 rounded-full">
                  <svg className="w-3 h-3 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-success font-medium">Saved</span>
                </div>
              )}
            </div>
            <p className="text-xs text-text-tertiary">{file.name}</p>
          </div>

          {/* Language Badge */}
          <div className="px-2 py-1 bg-background-base border border-light rounded-xl">
            <span className="text-xs font-medium text-text-secondary">{getLanguageLabel()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              hasChanges && !isSaving
                ? "bg-gradient-to-r from-amber-400 to-yellow-600 text-white hover:from-amber-500 hover:to-yellow-700 shadow-md hover:shadow-lg"
                : "bg-background-subtle text-text-tertiary cursor-not-allowed"
            }`}
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Save</span>
                {hasChanges && (
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-mono bg-white/10 rounded">
                    ⌘S
                  </kbd>
                )}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Editor with Line Numbers */}
      <div className="flex-1 flex overflow-hidden bg-background-raised">
        {/* Line Numbers */}
        <div className="w-16 bg-background-subtle border-r border-light text-right pr-4 pt-4 overflow-hidden select-none flex-shrink-0">
          {lines.map((_, i) => (
            <div
              key={i + 1}
              className="text-xs text-text-tertiary leading-6 font-mono hover:text-amber-500 transition-colors"
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="flex-1 pl-4 pr-4 py-4 bg-background-raised text-text-primary font-mono text-sm leading-6 resize-none focus:outline-none selection:bg-amber-500/20 custom-scrollbar"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder="Start typing..."
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-background-subtle border-t border-light text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-text-secondary">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>{lines.length} {lines.length === 1 ? 'line' : 'lines'}</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{code.length} characters</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && !isSaving && (
            <div className="flex items-center gap-1.5 text-amber-500">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Unsaved changes</span>
            </div>
          )}
          <div className="text-text-tertiary">
            Press <kbd className="px-1.5 py-0.5 bg-background-overlay border border-light rounded-xl text-xs font-mono">⌘S</kbd> to save
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(163, 163, 163, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(163, 163, 163, 0.5);
        }
      `}</style>
    </div>
  );
}
