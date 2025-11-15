'use client';

import { useState, useCallback } from 'react';
import { TypingText } from '@/components/chat/TypingText';
import Markdown from '@/components/Markdown';

interface WorkflowMessageProps {
  role: string;
  thinkingMessage?: string;
  successMessage?: string;
  details?: string;
  isThinking?: boolean;
  enableTyping?: boolean;
}

const getRoleIcon = (role: string) => {
  const roleLower = role.toLowerCase();

  if (roleLower.includes('product manager') || roleLower.includes('pm')) {
    return (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }

  if (roleLower.includes('frontend engineer') || roleLower.includes('frontend')) {
    return (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    );
  }

  if (roleLower.includes('backend engineer') || roleLower.includes('backend')) {
    return (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    );
  }

  if (roleLower.includes('ux designer') || roleLower.includes('designer')) {
    return (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    );
  }

  if (roleLower.includes('devops') || roleLower.includes('deployment')) {
    return (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    );
  }

  if (roleLower.includes('qa engineer') || roleLower.includes('quality')) {
    return (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }

  if (roleLower.includes('editor')) {
    return (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    );
  }

  // Default icon
  return (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
};

export function WorkflowMessage({
  role,
  thinkingMessage,
  successMessage,
  details,
  isThinking = false,
  enableTyping = false,
}: WorkflowMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [typingComplete, setTypingComplete] = useState(false);

  const handleTypingComplete = useCallback(() => {
    setTypingComplete(true);
  }, []);

  // Thinking message (neutral with typing animation)
  if (isThinking && thinkingMessage) {
    return (
      <div className="flex justify-start animate-slideUp">
        <div className="max-w-[90%] bg-background-raised border border-border-light rounded-xl rounded-tl-sm px-4 py-3 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start gap-3">
            {/* Single-gradient golden icon for thinking */}
            <div className="w-7 h-7 rounded-lg bg-gradient-brand-br flex items-center justify-center flex-shrink-0 shadow-sm">
              {getRoleIcon(role)}
            </div>
            <div className="flex-1 min-w-0">
              {/* Role name */}
              <div className="text-xs font-semibold text-text-secondary mb-1">{role}</div>
              {/* Thinking message with typing animation */}
              <div className="text-sm leading-relaxed text-text-primary">
                {enableTyping ? (
                  <>
                    <TypingText
                      text={thinkingMessage}
                      speed={60}
                      showCursor={false}
                      onComplete={handleTypingComplete}
                    />
                    {typingComplete && (
                      <span className="inline-block w-0.5 h-4 bg-current ml-1 animate-pulse" />
                    )}
                  </>
                ) : (
                  <>
                    {thinkingMessage}
                    {/* Show cursor even without typing animation */}
                    <span className="inline-block w-0.5 h-4 bg-current ml-1 animate-pulse" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success message with expandable details
  if (successMessage) {
    const hasDetails = details && details.trim().length > 0;

    return (
      <div className="flex justify-start animate-slideUp">
        <div className="max-w-[90%] bg-success/5 border border-success/40 rounded-xl rounded-tl-sm shadow-sm transition-all hover:shadow-md">
          {/* Main success message */}
          <div
            className={`px-4 py-3 ${hasDetails ? 'cursor-pointer' : ''}`}
            onClick={() => hasDetails && setIsExpanded(!isExpanded)}
          >
            <div className="flex items-start gap-3">
              {/* Green gradient icon for success */}
              <div className="w-7 h-7 rounded-lg bg-gradient-success flex items-center justify-center flex-shrink-0 shadow-sm">
                {getRoleIcon(role)}
              </div>
              <div className="flex-1 min-w-0">
                {/* Role name */}
                <div className="text-xs font-semibold text-success mb-1">{role}</div>
                {/* Success summary */}
                <div className="text-sm leading-relaxed text-text-primary font-medium">
                  {successMessage}
                </div>
              </div>
              {/* Expand icon */}
              {hasDetails && (
                <div className="flex-shrink-0 mt-1">
                  <svg
                    className={`w-4 h-4 text-text-tertiary transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Expandable details */}
          {hasDetails && isExpanded && (
            <div className="px-4 pb-3 pt-2 border-t border-success/20 animate-slideDown">
              <div className="text-sm leading-relaxed text-text-primary prose prose-sm max-w-none prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2 prose-li:my-1 prose-strong:font-semibold prose-strong:text-text-primary">
                <Markdown content={details} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
