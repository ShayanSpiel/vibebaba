"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreditPurchaseModal({ isOpen, onClose }: CreditPurchaseModalProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Delay to trigger animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePurchase = () => {
    router.push("/pricing");
  };

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4"
      }`}
    >
      {/* Modal Container - Positioned above chatbox */}
      <div className="relative w-full bg-background-raised backdrop-blur-sm border-2 border-warning/30 rounded-xl shadow-2xl overflow-hidden">

        {/* Animated background gradient - RED/GOLD urgency */}
        <div className="absolute inset-0 bg-gradient-to-br from-error/20 via-warning/15 to-error/10 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-tl from-warning/10 via-transparent to-error/5 animate-pulse animation-delay-500" />

        {/* Sparkle effect overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-4 left-4 w-2 h-2 bg-warning rounded-full animate-ping" />
          <div className="absolute top-8 right-8 w-1.5 h-1.5 bg-warning rounded-full animate-ping animation-delay-200" />
          <div className="absolute bottom-6 left-12 w-2 h-2 bg-warning rounded-full animate-ping animation-delay-400" />
        </div>

        {/* Content */}
        <div className="relative p-6">
          <div className="flex items-start gap-4">
            {/* Icon Container */}
            <div className="flex-shrink-0">
              <div className="relative">
                {/* Pulsing ring effect */}
                <div className="absolute inset-0 bg-warning rounded-xl animate-pulse opacity-50 blur-lg" />

                {/* Icon background */}
                <div className="relative w-14 h-14 bg-gradient-warning rounded-xl flex items-center justify-center shadow-xl">
                  {/* Zap/Lightning icon */}
                  <svg
                    className="w-7 h-7 text-white animate-bounce"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-warning mb-2">
                Out of Credits!
              </h3>
              <p className="text-sm text-text-primary mb-1 leading-relaxed">
                You've run out of AI credits and can't continue this conversation.
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Unlock unlimited creativity and keep building amazing apps!
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-background-overlay transition-colors group"
              aria-label="Close"
            >
              <svg
                className="w-4 h-4 text-text-tertiary group-hover:text-text-primary transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-5">
            {/* Primary CTA - Purchase Credits */}
            <button
              onClick={handlePurchase}
              className="flex-1 relative group overflow-hidden rounded-xl"
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-warning rounded-xl transition-all duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-warning rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Shine effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>

              {/* Button content */}
              <div className="relative px-6 py-3 flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5 text-white group-hover:scale-110 transition-transform"
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
                <span className="font-medium text-white text-sm">
                  Get More Credits
                </span>
                <svg
                  className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Secondary - Maybe Later */}
            <button
              onClick={onClose}
              className="px-5 py-3 text-sm font-medium text-text-secondary hover:text-text-primary border border-light hover:border-default rounded-xl transition-all duration-200 hover:bg-background-overlay"
            >
              Maybe Later
            </button>
          </div>

          {/* Extra encouragement text */}
          <div className="mt-4 pt-4 border-t border-subtle">
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <svg
                className="w-4 h-4 text-warning"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span>Join thousands of creators building with unlimited AI power</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
