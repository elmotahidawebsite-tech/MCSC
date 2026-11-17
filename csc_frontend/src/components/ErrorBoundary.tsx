import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleGoHome = (): void => {
    this.setState(
      {
        hasError: false,
        error: null,
      },
      () => {
        window.location.href = "/";
      }
    );
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
          <div className="w-full max-w-lg">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-br from-rose-500 to-rose-600 px-8 py-8 text-white">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <AlertTriangle size={28} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Something went wrong</h1>
                    <p className="text-sm text-rose-50 mt-1">
                      The application encountered an unexpected error
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-8 py-8 space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    An unexpected error occurred while processing your request. This could be due
                    to a temporary issue or invalid data. Please try again.
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    What you can do:
                  </p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="text-[#005588] mt-0.5">•</span>
                      <span>Refresh the page to try again</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#005588] mt-0.5">•</span>
                      <span>Return to the home page</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#005588] mt-0.5">•</span>
                      <span>Contact support if the problem persists</span>
                    </li>
                  </ul>
                </div>

                {process.env.NODE_ENV === "development" && this.state.error && (
                  <details className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <summary className="cursor-pointer text-xs font-semibold text-amber-900 uppercase tracking-wider">
                      Error Details (Development Only)
                    </summary>
                    <pre className="mt-3 text-xs text-amber-800 overflow-x-auto whitespace-pre-wrap break-words">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 px-8 py-6 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 h-11 px-5 rounded-xl border border-slate-200 bg-white text-gray-700 inline-flex items-center justify-center gap-2 text-sm font-semibold hover:bg-slate-100 transition"
                >
                  <Home size={16} />
                  Go Home
                </button>
                <button
                  onClick={this.handleReset}
                  className="flex-1 h-11 px-5 rounded-xl bg-[#005588] text-white inline-flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#004670] shadow-lg shadow-[#005588]/20 transition"
                >
                  <RefreshCw size={16} />
                  Try Again
                </button>
              </div>
            </div>

            {/* Footer Note */}
            <p className="text-center text-xs text-slate-400 mt-6">
              Your work is safe. No data was lost.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
