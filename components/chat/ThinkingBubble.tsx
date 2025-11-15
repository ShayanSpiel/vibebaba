'use client';

import { useState } from 'react';

interface ThinkingBubbleProps {
  isAnimating?: boolean;
  thinkingProcess?: {
    userInput?: string;
    interpretation?: string;
    plan?: string;
  };
  message?: string; // Dynamic message based on node role
  role?: string; // Node role (founder, pm, ux, frontend, backend, qa, devops, editor)
  fadeOut?: boolean; // Trigger fade-out animation
}

// Default thinking messages by role
const ROLE_THINKING_MESSAGES: Record<string, string> = {
  founder: 'Analyzing your vision...',
  pm: 'Planning features...',
  ux: 'Designing interface...',
  frontend: 'Building components...',
  backend: 'Setting up backend...',
  qa: 'Running quality checks...',
  devops: 'Deploying your app...',
  editor: 'Analyzing changes...',
  'context-analyzer': 'Analyzing code context...',
};

export default function ThinkingBubble({
  isAnimating = true,
  thinkingProcess,
  message,
  role,
  fadeOut = false,
}: ThinkingBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasThinking =
    thinkingProcess &&
    (thinkingProcess.userInput || thinkingProcess.interpretation || thinkingProcess.plan);

  // Determine display message: custom > role-based > default
  const displayMessage = message || (role && ROLE_THINKING_MESSAGES[role]) || 'Thinking...';

  return (
    <div
      className={`flex justify-start mb-4 transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="max-w-[90%]">
        {/* Thinking Bubble - Matching Brand Guidelines */}
        <div
          className={`relative bg-background-raised backdrop-blur-sm border border-amber-400/20 rounded-xl rounded-tl-sm shadow-md overflow-hidden ${hasThinking ? 'cursor-pointer hover:border-amber-400/40 transition-colors' : ''}`}
          onClick={() => hasThinking && setIsExpanded(!isExpanded)}
        >
          {/* Gradient background overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-amber-400/5 to-yellow-600/10" />

          <div className="relative z-10 px-5 py-3">
            <div className="flex items-center gap-3">
              {/* Animated Thinking Icon */}
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                {isAnimating ? (
                  <div className="relative w-4 h-4">
                    {/* Three animated dots */}
                    <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                      <div
                        className="w-1 h-1 bg-white rounded-full"
                        style={{
                          animation: 'thinking-pulse 1.4s ease-in-out infinite',
                          animationDelay: '0s',
                        }}
                      />
                      <div
                        className="w-1 h-1 bg-white rounded-full"
                        style={{
                          animation: 'thinking-pulse 1.4s ease-in-out infinite',
                          animationDelay: '0.2s',
                        }}
                      />
                      <div
                        className="w-1 h-1 bg-white rounded-full"
                        style={{
                          animation: 'thinking-pulse 1.4s ease-in-out infinite',
                          animationDelay: '0.4s',
                        }}
                      />
                    </div>
                  </div>
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
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                )}
              </div>

              {/* Dynamic thinking message with expand arrow */}
              <div className="flex items-center gap-2 flex-1">
                <p className="text-sm font-medium text-text-primary">{displayMessage}</p>
                {hasThinking && (
                  <svg
                    className={`w-4 h-4 text-amber-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Thinking Details - Real AI Process from LangSmith */}
        {isExpanded && hasThinking && (
          <div className="mt-2 ml-10 bg-background-raised/80 backdrop-blur-sm border border-amber-400/20 rounded-lg p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {thinkingProcess.userInput && (
              <div>
                <p className="text-xs font-semibold text-amber-400 mb-1">📝 Your Request</p>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {thinkingProcess.userInput}
                </p>
              </div>
            )}

            {thinkingProcess.interpretation && (
              <div>
                <p className="text-xs font-semibold text-amber-400 mb-1">💡 AI Understanding</p>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {thinkingProcess.interpretation}
                </p>
              </div>
            )}

            {thinkingProcess.plan && (
              <div>
                <p className="text-xs font-semibold text-amber-400 mb-1">📋 Action Plan</p>
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                  {thinkingProcess.plan}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CSS Animation for thinking dots */}
      <style jsx>{`
        @keyframes thinking-pulse {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          30% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}
