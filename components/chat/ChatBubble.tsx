"use client";

import { ReactNode } from "react";
import Markdown from "@/components/Markdown";

export type BubbleType =
  | "user"
  | "assistant"
  | "confirmation"
  | "warning"
  | "success"
  | "error"
  | "edit"
  | "thinking"
  | "plan";

interface ChatBubbleProps {
  type: BubbleType;
  content: string;
  children?: ReactNode;
  animate?: boolean;
}

export function ChatBubble({ type, content, children, animate = true }: ChatBubbleProps) {
  // User messages - enhanced with gradient
  if (type === "user") {
    return (
      <div className={`flex justify-end ${animate ? "animate-slideUp" : ""}`}>
        <div className="max-w-[90%] bg-gradient-brand rounded-xl rounded-tr-sm px-5 py-3 shadow-lg">
          <p className="text-sm leading-relaxed text-white font-medium break-words overflow-wrap-anywhere">{content}</p>
        </div>
      </div>
    );
  }

  // Assistant messages - contextual icons based on content
  if (type === "assistant") {
    // Detect context from message content and return icon + background color
    const getContextualIconAndBg = () => {
      const lowerContent = content.toLowerCase();

      // CRITICAL: Check for edit success messages FIRST - always show as success (green)
      if (
        lowerContent.includes("here's what i changed") ||
        lowerContent.includes("here's what changed") ||
        (lowerContent.includes("edited files") || lowerContent.includes("added features"))
      ) {
        return {
          icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ),
          bgClass: "bg-gradient-success",
          isSuccess: true,
          isError: false,
          isInfo: false
        };
      }

      // Error/Failure related - RED (Check AFTER edit success is ruled out)
      if (
        lowerContent.includes("error") ||
        lowerContent.includes("failed") ||
        lowerContent.includes("failure") ||
        lowerContent.includes("something went wrong") ||
        lowerContent.includes("couldn't") ||
        lowerContent.includes("could not") ||
        lowerContent.includes("unable to") ||
        lowerContent.includes("failed to")
      ) {
        return {
          icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          bgClass: "bg-gradient-to-br from-red-500 to-red-600",
          isError: true,
          isSuccess: false,
          isInfo: false
        };
      }

      // Success/Completion related - GREEN
      if (
        lowerContent.includes("done") ||
        lowerContent.includes("completed") ||
        lowerContent.includes("ready") ||
        lowerContent.includes("successfully") ||
        lowerContent.includes("success!") ||
        lowerContent.includes("applied") ||
        lowerContent.includes("finished") ||
        lowerContent.includes("all set")
      ) {
        return {
          icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ),
          bgClass: "bg-gradient-success",
          isSuccess: true,
          isError: false,
          isInfo: false
        };
      }

      // Questions/Clarification needed - YELLOW/AMBER (Check BEFORE generic warnings)
      if (
        lowerContent.includes("question") ||
        lowerContent.includes("clarify") ||
        lowerContent.includes("clarification") ||
        lowerContent.includes("which ") ||
        lowerContent.includes("what ") ||
        lowerContent.includes("please provide") ||
        lowerContent.includes("please share") ||
        lowerContent.includes("could you") ||
        lowerContent.includes("can you") ||
        lowerContent.includes("would you like") ||
        lowerContent.includes("??") ||
        (lowerContent.includes("need") && lowerContent.includes("?")) ||
        (lowerContent.includes("require") && lowerContent.includes("?"))
      ) {
        return {
          icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          bgClass: "bg-gradient-to-br from-amber-500 to-yellow-600",
          isSuccess: false,
          isError: false,
          isInfo: false,
          isWarning: true
        };
      }

      // Warning related - YELLOW/AMBER
      if (
        lowerContent.includes("warning") ||
        lowerContent.includes("caution") ||
        lowerContent.includes("be careful") ||
        lowerContent.includes("watch out")
      ) {
        return {
          icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          bgClass: "bg-gradient-to-br from-amber-500 to-yellow-600",
          isSuccess: false,
          isError: false,
          isInfo: false,
          isWarning: true
        };
      }

      // Info/Note related - BLUE
      if (
        lowerContent.includes("note:") ||
        lowerContent.includes("important:") ||
        lowerContent.includes("please note") ||
        lowerContent.includes("fyi") ||
        lowerContent.includes("info:") ||
        lowerContent.includes("tip:")
      ) {
        return {
          icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgClass: "bg-gradient-to-br from-blue-500 to-blue-600",
          isSuccess: false,
          isError: false,
          isInfo: true
        };
      }

      // Database/Backend related - BLUE
      if (lowerContent.includes("database") || lowerContent.includes("schema") || lowerContent.includes("backend") || lowerContent.includes("data")) {
        return {
          icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          ),
          bgClass: "bg-gradient-blue",
          isSuccess: false,
          isError: false,
          isInfo: false
        };
      }

      // UI/Design related - PURPLE
      if (lowerContent.includes("design") || lowerContent.includes("ui") || lowerContent.includes("interface") || lowerContent.includes("layout") || lowerContent.includes("styling")) {
        return {
          icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          ),
          bgClass: "bg-gradient-purple",
          isSuccess: false,
          isError: false,
          isInfo: false
        };
      }

      // Code/Building related - ORANGE
      if (lowerContent.includes("code") || lowerContent.includes("building") || lowerContent.includes("writing") || lowerContent.includes("updating") || lowerContent.includes("component")) {
        return {
          icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          ),
          bgClass: "bg-gradient-orange",
          isSuccess: false,
          isError: false,
          isInfo: false
        };
      }

      // Analysis/Thinking related - CYAN
      if (lowerContent.includes("analyz") || lowerContent.includes("understanding") || lowerContent.includes("thinking") || lowerContent.includes("planning")) {
        return {
          icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          ),
          bgClass: "bg-gradient-cyan",
          isSuccess: false,
          isError: false,
          isInfo: false
        };
      }

      // Starting/Acknowledgment - AMBER
      if (lowerContent.includes("got it") || lowerContent.includes("perfect") || lowerContent.includes("on it") || lowerContent.includes("starting")) {
        return {
          icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ),
          bgClass: "bg-gradient-brand-br",
          isSuccess: false,
          isError: false,
          isInfo: false
        };
      }

      // Default AI icon - INFO (blue)
      return {
        icon: (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        ),
        bgClass: "bg-gradient-info",
        isSuccess: false,
        isError: false,
        isInfo: false
      };
    };

    const { icon, bgClass, isSuccess, isError, isInfo, isWarning } = getContextualIconAndBg();

    return (
      <div className={`flex justify-start ${animate ? "animate-slideUp" : ""}`}>
        <div className={`max-w-[90%] rounded-xl rounded-tl-sm px-5 py-3 shadow-md ${
          isError
            ? "bg-red-50/80 dark:bg-red-950/30 border border-red-500/30"
            : isSuccess
            ? "bg-success/10 border border-success/40"
            : isWarning
            ? "bg-amber-50/80 dark:bg-amber-950/30 border border-amber-500/30"
            : isInfo
            ? "bg-blue-50/80 dark:bg-blue-950/30 border border-blue-500/30"
            : "bg-background-raised border border-light"
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-7 h-7 rounded-lg ${bgClass} flex items-center justify-center flex-shrink-0 shadow-md`}>
              {icon}
            </div>
            <div className={`flex-1 min-w-0 text-sm leading-relaxed prose prose-sm max-w-none break-words overflow-wrap-anywhere ${
              isError ? "text-red-900 dark:text-red-300" : isWarning ? "text-amber-900 dark:text-amber-300" : isInfo ? "text-blue-900 dark:text-blue-300" : "text-text-primary"
            }`}>
              <Markdown content={content} />
            </div>
          </div>
        </div>
      </div>
    );
  }

// Thinking indicator - improved with static light bulb icon and animated dots
  if (type === "thinking") {
    return (
      <div className="flex justify-start animate-fadeIn">
        <div className="flex items-center gap-2.5 px-2 py-1">
          {/* Static light bulb icon */}
          <div className="w-4 h-4 text-text-tertiary">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>

          {/* Dynamic text with content prop */}
          <span className="text-sm text-text-secondary font-medium">
            {content}
          </span>

          {/* Slower 3-dot animation - bouncing up and down */}
          <div className="flex items-center gap-0.5 ml-0.5">
            <div className="w-1 h-1 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
            <div className="w-1 h-1 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1s' }}></div>
            <div className="w-1 h-1 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Plan display - with colored icon
  if (type === "plan") {
    return (
      <div className={`flex justify-start ${animate ? "animate-slideUp" : ""}`}>
        <div className="max-w-[95%] bg-background-raised border border-light rounded-xl rounded-tl-sm px-5 py-4 shadow-md">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-purple flex items-center justify-center flex-shrink-0 shadow-md">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-secondary mb-2">Generated Plan</div>
              <div className="text-sm leading-relaxed prose prose-sm max-w-none text-text-primary">
                <Markdown content={content} />
              </div>
            </div>
          </div>
          {children && <div className="flex gap-2 mt-4 pt-3 border-t border-light">{children}</div>}
        </div>
      </div>
    );
  }

  // Confirmation - with colored icon
  if (type === "confirmation") {
    return (
      <div className={`flex justify-center ${animate ? "animate-slideUp" : ""}`}>
        <div className="bg-background-raised border border-light rounded-xl px-6 py-4 shadow-md max-w-[95%] w-full">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-warning flex items-center justify-center flex-shrink-0 shadow-md">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-text-primary font-medium">
                <Markdown content={content} />
              </div>
            </div>
          </div>
          {children && <div className="flex gap-3 justify-end">{children}</div>}
        </div>
      </div>
    );
  }

  // Success - with colored icon
  if (type === "success") {
    return (
      <div className={`flex justify-center ${animate ? "animate-slideUp" : ""}`}>
        <div className="bg-success/5 border border-success rounded-xl px-6 py-4 shadow-md max-w-[95%]">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-success flex items-center justify-center flex-shrink-0 shadow-md">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 text-sm text-text-primary font-medium">
              <Markdown content={content} />
            </div>
          </div>
          {children && <div className="mt-3 flex gap-3 justify-end pt-3 border-t border-light">{children}</div>}
        </div>
      </div>
    );
  }

  // Error - Brand guideline failure notification with red background, border, and icon
  if (type === "error") {
    return (
      <div className={`flex justify-start ${animate ? "animate-slideUp" : ""}`}>
        <div className="max-w-[90%] relative overflow-hidden rounded-xl rounded-tl-sm shadow-lg">
          {/* Subtle gradient overlay matching brand style */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-600/5 to-red-700/10" />

          <div className="relative bg-red-50/80 dark:bg-red-950/30 border border-red-500/30 px-5 py-3 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              {/* Error icon with red gradient background */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0 shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
                  Error
                </div>
                <div className="text-sm leading-relaxed text-red-900 dark:text-red-300 break-words overflow-wrap-anywhere">
                  <Markdown content={content} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Warning - with colored icon
  if (type === "warning") {
    return (
      <div className={`flex justify-center ${animate ? "animate-slideUp" : ""}`}>
        <div className="bg-background-raised border border-light rounded-xl px-6 py-4 shadow-md max-w-[95%]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-warning flex items-center justify-center flex-shrink-0 shadow-md">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 text-sm text-text-primary font-medium">
              <Markdown content={content} />
            </div>
          </div>
          {children && <div className="mt-3 flex gap-3 justify-end pt-3 border-t border-light">{children}</div>}
        </div>
      </div>
    );
  }

  // Edit notification - with colored icon
  if (type === "edit") {
    return (
      <div className={`flex justify-center ${animate ? "animate-slideUp" : ""}`}>
        <div className="bg-background-raised border border-light rounded-xl px-6 py-4 shadow-md max-w-[95%]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-blue flex items-center justify-center flex-shrink-0 shadow-md">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="flex-1 text-sm text-text-primary font-medium">
              <Markdown content={content} />
            </div>
          </div>
          {children && <div className="mt-3 flex gap-3 justify-end pt-3 border-t border-light">{children}</div>}
        </div>
      </div>
    );
  }

  return null;
}

// Enhanced Action Button Component
interface ActionButtonProps {
  variant?: "primary" | "secondary" | "success";
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}

export function ActionButton({ variant = "primary", onClick, children, disabled = false }: ActionButtonProps) {
  const getVariantClasses = () => {
    if (variant === "success") {
      return "bg-gradient-success text-white hover:opacity-90 shadow-lg hover:shadow-xl";
    }
    if (variant === "primary") {
      return "bg-gradient-brand text-white hover:opacity-90 shadow-lg hover:shadow-xl";
    }
    return "bg-background-subtle text-text-primary hover:bg-background-overlay border border-light";
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-5 py-2.5 rounded-xl text-sm font-medium transition-all
        ${getVariantClasses()}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {children}
    </button>
  );
}
