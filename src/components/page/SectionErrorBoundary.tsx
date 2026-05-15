'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  sectionId: string;
  sectionType: string;
  isPreview?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * SectionErrorBoundary — wraps a single section render.
 *
 * Why a separate boundary per section (rather than one for the whole page)?
 *   - A thrown error in one section must not unmount the rest of the page.
 *   - The page-level `PageErrorBoundary` is a last resort; this is the first
 *     line of defence at the section granularity.
 *
 * This must be a class component because React error boundaries cannot be
 * implemented with hooks (as of React 19).
 */
export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // Log with enough context to identify the offending section
    console.error(
      `[SectionErrorBoundary] Render error in section "${this.props.sectionId}" (${this.props.sectionType}):`,
      error,
      info.componentStack,
    );
  }

  override render() {
    if (!this.state.hasError) return this.props.children;

    const { sectionId, sectionType, isPreview } = this.props;
    const isDev = process.env.NODE_ENV !== 'production';
    const showDetails = isDev || isPreview;

    if (!showDetails) {
      // Production: invisible spacer — same as SectionError production mode
      return (
        <div
          aria-hidden="true"
          data-section-id={sectionId}
          data-section-type={sectionType}
          className="py-8"
        />
      );
    }

    return (
      <div
        role="alert"
        aria-label={`Render error in ${sectionType} section`}
        data-section-id={sectionId}
        className="mx-6 my-4 rounded-md border border-red-400 bg-red-50 p-4"
      >
        <p className="text-sm font-semibold text-red-800">
          Unexpected render error in{' '}
          <code className="font-mono font-normal">{sectionType}</code>
        </p>
        <p className="mt-0.5 text-xs text-red-600">
          Section ID: <code className="font-mono">{sectionId}</code>
        </p>
        {this.state.error && (
          <pre className="mt-2 overflow-auto rounded bg-red-100 p-2 text-xs text-red-700">
            {this.state.error.message}
          </pre>
        )}
      </div>
    );
  }
}
