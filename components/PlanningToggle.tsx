"use client";

import { useState } from "react";

interface PlanningToggleProps {
  isEnabled: boolean;
  isDisabled?: boolean;
  onChange: (enabled: boolean) => void;
}

export function PlanningToggle({ isEnabled, isDisabled = false, onChange }: PlanningToggleProps) {
  return (
    <button
      onClick={() => !isDisabled && onChange(!isEnabled)}
      disabled={isDisabled}
      className={`
        flex items-center gap-2 rounded-lg font-semibold transition-all duration-300 ease-out
        ${isEnabled
          ? 'px-5 py-3 bg-gradient-to-r from-amber-400 to-yellow-600 text-white shadow-lg hover:shadow-xl hover:from-amber-500 hover:to-yellow-700 scale-110'
          : 'px-4 py-2 bg-background-raised border border-light text-text-secondary hover:bg-background-subtle hover:text-text-primary hover:border-amber-400/30 shadow-sm'
        }
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={isDisabled ? "Planning completed" : isEnabled ? "Planning mode active - Click to disable" : "Enable planning mode"}
    >
      {/* Icon */}
      <svg
        className={`transition-all duration-300 ${isEnabled ? 'w-5 h-5' : 'w-4 h-4'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      </svg>

      {/* Label */}
      <span className={`transition-all duration-300 ${isEnabled ? 'text-sm font-bold' : 'text-sm'}`}>
        {isEnabled ? 'Planning Active' : 'Planning'}
      </span>

      {/* Active Indicator */}
      {isEnabled && (
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Hover Effect Glow */}
      {!isDisabled && (
        <div className={`absolute inset-0 rounded-lg transition-opacity duration-300 ${
          isEnabled
            ? 'bg-gradient-to-r from-amber-400/20 to-yellow-600/20 opacity-0 group-hover:opacity-100'
            : ''
        }`} />
      )}
    </button>
  );
}
