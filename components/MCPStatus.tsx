"use client";

import { useState, useEffect } from "react";

interface MCPStatusProps {
  show?: boolean;
}

export function MCPStatus({ show = false }: MCPStatusProps) {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    setIsVisible(show);
  }, [show]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-black text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
        <div className="relative">
          <div className="w-2 h-2 bg-gradient-success rounded-full animate-pulse"></div>
        </div>
        <span className="font-medium">MCP Tools Active</span>
        <div className="text-xs opacity-70">Enhanced AI</div>
      </div>
    </div>
  );
}

interface MCPToolCallIndicatorProps {
  toolName?: string;
  serverName?: string;
  show?: boolean;
}

export function MCPToolCallIndicator({
  toolName,
  serverName,
  show = false,
}: MCPToolCallIndicatorProps) {
  if (!show) return null;

  return (
    <div className="fixed top-20 right-4 z-50">
      <div className="bg-background-raised border border-light rounded-lg shadow-lg p-3 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
          <span className="font-semibold text-sm">Using MCP Tool</span>
        </div>
        {serverName && (
          <div className="text-xs text-text-secondary">
            Server: <span className="font-mono font-medium">{serverName}</span>
          </div>
        )}
        {toolName && (
          <div className="text-xs text-text-secondary">
            Tool: <span className="font-mono font-medium">{toolName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple badge to show MCP is available
export function MCPBadge() {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1 bg-success/10 border border-success/30 rounded-xl text-xs font-medium text-success"
      title="AI enhanced with Model Context Protocol tools"
    >
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
      <span>MCP Enhanced</span>
    </div>
  );
}
