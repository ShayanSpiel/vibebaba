"use client";

import React from "react";
import { X, AlertTriangle } from "lucide-react";

interface GenerationErrorModalProps {
  errorMessage?: string;
  onRegenerate: () => void;
  onClose?: () => void;
}

export default function GenerationErrorModal({
  errorMessage,
  onRegenerate,
  onClose,
}: GenerationErrorModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md mx-4 animate-slideUp"
        style={{ animationDuration: "300ms" }}
      >
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 z-10 w-10 h-10 rounded-full bg-error/20 border border-error/30 flex items-center justify-center hover:bg-error/30 transition-colors duration-200 backdrop-blur-sm"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-error" />
          </button>
        )}

        {/* Modal body */}
        <div className="relative w-full bg-background-raised backdrop-blur-sm border-2 border-error/30 rounded-xl shadow-2xl overflow-hidden">
          {/* Animated red error background */}
          <div className="absolute inset-0 bg-gradient-to-br from-error/25 via-error/10 to-error/15 animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-tl from-error/15 via-transparent to-error/5 animate-pulse animation-delay-500" />

          {/* Content */}
          <div className="relative p-8 space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="relative w-16 h-16 bg-gradient-error rounded-xl flex items-center justify-center shadow-xl animate-pulse">
                <AlertTriangle className="w-9 h-9 text-white" />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/20" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-text-primary">
                Generation Failed
              </h2>
              <p className="text-sm text-text-secondary">
                Something went wrong during the app generation process
              </p>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-4">
                <p className="text-xs text-text-secondary font-mono break-words">
                  {errorMessage}
                </p>
              </div>
            )}

            {/* Encouragement text */}
            <div className="text-center">
              <p className="text-sm text-text-primary">
                Don't worry! You can try generating the app again.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              {/* Regenerate button */}
              <button
                onClick={onRegenerate}
                className="flex-1 relative group overflow-hidden rounded-xl"
              >
                <div className="absolute inset-0 bg-gradient-error rounded-xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg" />
                <div className="relative px-6 py-3 flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span className="font-medium text-white">
                    Regenerate App
                  </span>
                </div>
              </button>

              {/* Cancel button (if onClose is provided) */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl border border-error/30 text-text-primary hover:bg-error/10 transition-all duration-200"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
