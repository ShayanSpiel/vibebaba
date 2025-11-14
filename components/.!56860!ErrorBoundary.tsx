'use client';

/**
 * Error Boundary Component
 *
 * Catches runtime errors in React components and provides fallback UI.
 * Optionally reports errors to parent callback for logging/fixing.
 * Inspired by Bolt.new's error handling patterns.
 */

import React, { Component, ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.reset);
        }
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary-fallback p-8 max-w-2xl mx-auto">
          <div className="bg-error/10 border border-error rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-error"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-semibold text-error mb-2">
                  Something went wrong
                </h2>

                <p className="text-sm text-base-content/70 mb-4">
                  An error occurred while rendering this component.
                </p>

                {this.props.showDetails && this.state.error && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-base-content/80 hover:text-base-content">
                      Error Details
                    </summary>
                    <div className="mt-2 p-4 bg-base-200 rounded text-xs font-mono overflow-auto max-h-64">
                      <div className="text-error font-semibold mb-2">
                        {this.state.error.name}: {this.state.error.message}
                      </div>
                      {this.state.error.stack && (
                        <pre className="text-base-content/60 whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      )}
                      {this.state.errorInfo && this.state.errorInfo.componentStack && (
                        <div className="mt-4">
                          <div className="font-semibold mb-1">Component Stack:</div>
                          <pre className="text-base-content/60 whitespace-pre-wrap">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                <button
                  onClick={this.reset}
                  className="mt-4 btn btn-sm btn-error"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Simple error fallback component
 */
export function SimpleErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): ReactNode {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
