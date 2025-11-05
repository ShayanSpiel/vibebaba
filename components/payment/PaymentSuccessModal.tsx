"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokens: number;
  packageName?: string;
  refId?: string;
}

export function PaymentSuccessModal({
  isOpen,
  onClose,
  tokens,
  packageName,
  refId,
}: PaymentSuccessModalProps) {
  const [celebrating, setCelebrating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCelebrating(true);
    }
  }, [isOpen]);

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`;
    }
    return tokens.toString();
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <>
      <style jsx global>{`
        @keyframes scale-in {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.6;
          }
        }

        @keyframes check-draw {
          0% {
            stroke-dashoffset: 50;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes bounce-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fade-slide-up {
          0% {
            transform: translateY(10px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes confetti {
          0% {
            transform: translateY(-100%) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        .scale-in-animation {
          animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .check-icon {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: check-draw 0.6s ease-out 0.2s forwards;
        }

        .bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .fade-slide-up {
          animation: fade-slide-up 0.5s ease-out forwards;
        }

        .confetti-piece {
          animation: confetti 3s ease-out forwards;
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        {/* Confetti particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="confetti-piece absolute w-2 h-2 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                backgroundColor: i % 3 === 0 ? '#22C55E' : i % 3 === 1 ? '#FCD34D' : '#3B82F6',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div className="bg-background-raised rounded-xl shadow-2xl border-[0.75px] border-border-light p-8 max-w-md w-full mx-4 scale-in-animation relative overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shimmer" />

          {/* Success Icon - Animated */}
          <div className="flex justify-center mb-6 relative">
            <div className="absolute w-24 h-24 bg-success/20 rounded-full pulse-glow"></div>
            <div className="w-20 h-20 bg-gradient-success rounded-full flex items-center justify-center shadow-lg relative z-10 bounce-in">
              <svg
                className="w-10 h-10 text-white check-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Success Message - Animated Typography */}
          <h2 className="text-2xl font-bold text-center mb-2 text-text-primary fade-slide-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
            Payment Successful! 🎉
          </h2>
          <p className="text-center text-text-secondary mb-8 text-sm fade-slide-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
            Your credits have been added to your account
          </p>

          {/* Details - Animated Cards */}
          <div className="space-y-3 mb-8">
            {packageName && (
              <div className="flex items-center justify-between p-4 bg-background-subtle rounded-xl fade-slide-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-brand-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                  <span className="text-sm text-text-secondary">Package</span>
                </div>
                <span className="font-medium text-text-primary">{packageName}</span>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-success/10 rounded-xl border border-success/20 fade-slide-up hover:bg-success/15 transition-colors" style={{ animationDelay: '0.5s', opacity: 0 }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-success/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-text-secondary">Tokens Added</span>
              </div>
              <span className="font-bold text-lg text-success">
                +{formatTokens(tokens)}
              </span>
            </div>

            {refId && (
              <div className="p-3 bg-background-subtle rounded-lg border-[0.75px] border-border-light">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-3.5 h-3.5 text-text-tertiary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-text-tertiary">Reference ID</span>
                </div>
                <span className="font-mono text-xs text-text-secondary">{refId}</span>
              </div>
            )}
          </div>

          {/* Action Buttons - Animated */}
          <div className="space-y-2">
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full px-5 py-3 bg-gradient-success text-white rounded-xl font-medium hover:opacity-90 hover:scale-105 transition-all shadow-md hover:shadow-lg fade-slide-up"
              style={{ animationDelay: '0.6s', opacity: 0 }}
            >
              Start Creating ✨
            </button>
            <button
              onClick={() => (window.location.href = "/settings")}
              className="w-full px-5 py-3 bg-background-subtle border-[0.75px] border-border-light text-text-primary rounded-xl font-medium hover:bg-background-raised hover:border-success/30 transition-all fade-slide-up"
              style={{ animationDelay: '0.7s', opacity: 0 }}
            >
              View Balance
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
