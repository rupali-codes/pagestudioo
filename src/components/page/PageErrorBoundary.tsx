'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that catches rendering errors from invalid page schemas.
 * Prevents a single broken section from crashing the entire page.
 */
export class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PageErrorBoundary]', error, info.componentStack);
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center"
        >
          <h2 className="text-xl font-semibold text-gray-900">
            Something went wrong rendering this page
          </h2>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <pre className="max-w-xl overflow-auto rounded bg-gray-100 p-4 text-left text-xs text-gray-700">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
