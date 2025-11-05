"use client";

import { useState, useEffect } from "react";

interface CodeEditorProps {
  code: string;
  onSave: (code: string) => void;
  onClose: () => void;
}

export default function CodeEditor({ code, onSave, onClose }: CodeEditorProps) {
  const [editedCode, setEditedCode] = useState(code);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditedCode(code);
    setHasChanges(false);
  }, [code]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedCode(e.target.value);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(editedCode);
    setHasChanges(false);
  };

  return (
    <div className="h-full flex flex-col bg-background-sunken">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-background-raised border-b border-light">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-brand-primary" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
          <span className="text-text-primary font-semibold">index.html</span>
          {hasChanges && <span className="text-xs text-brand-primary">● Unsaved</span>}
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 text-text-inverse rounded-lg hover:bg-gradient-to-r from-amber-500 to-yellow-700 font-semibold transition-colors"
            >
              Save Changes
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-background-subtle text-text-primary rounded-lg hover:bg-background-overlay font-semibold transition-colors"
          >
            ✕ Close Editor
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 relative">
        <textarea
          value={editedCode}
          onChange={handleChange}
          className="w-full h-full p-4 bg-background-sunken text-brand-primary font-mono text-sm resize-none focus:outline-none"
          style={{
            tabSize: 2,
            fontFamily: "'Courier New', Courier, monospace",
            lineHeight: "1.6"
          }}
          spellCheck={false}
        />
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-background-raised border-t border-light flex items-center justify-between text-xs text-text-tertiary">
        <span>HTML • UTF-8</span>
        <span>{editedCode.split('\n').length} lines • {editedCode.length} characters</span>
      </div>
    </div>
  );
}
