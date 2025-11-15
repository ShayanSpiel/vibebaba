'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';

interface ResizablePanelProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  minRightWidth?: number;
}

export default function ResizablePanel({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 50,
  minLeftWidth = 30,
  minRightWidth = 30,
}: ResizablePanelProps) {
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('resizable-panel-width');
      return saved ? parseFloat(saved) : defaultLeftWidth;
    }
    return defaultLeftWidth;
  });

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Enforce min/max constraints
      if (newLeftWidth >= minLeftWidth && newLeftWidth <= 100 - minRightWidth) {
        setLeftWidth(newLeftWidth);
        localStorage.setItem('resizable-panel-width', newLeftWidth.toString());
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minLeftWidth, minRightWidth]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  return (
    <div
      ref={containerRef}
      className="h-screen flex flex-col md:flex-row bg-background overflow-hidden"
    >
      {/* Left Panel */}
      <div className="flex-shrink-0 overflow-hidden" style={{ width: `${leftWidth}%` }}>
        {leftPanel}
      </div>

      {/* Resize Handle - Subtle but noticeable */}
      <div
        onMouseDown={handleMouseDown}
        className={`hidden md:flex w-px bg-border-DEFAULT hover:bg-accent cursor-col-resize transition-colors relative group ${
          isDragging ? 'bg-accent' : ''
        }`}
      >
        {/* Visual indicator on hover */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="w-0.5 h-12 bg-accent rounded-full shadow-sm"></div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 overflow-hidden">{rightPanel}</div>

      {/* Overlay during drag to prevent iframe interference */}
      {isDragging && <div className="fixed inset-0 z-50 cursor-col-resize" />}
    </div>
  );
}
