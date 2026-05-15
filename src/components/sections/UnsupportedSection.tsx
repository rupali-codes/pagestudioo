import type { SectionComponentProps } from '@/types/registry';

/**
 * UnsupportedSection — rendered when a section type exists in CMS data but
 * has no entry in the registry.
 *
 * Visibility rules:
 *  - Development / preview: shows a visible warning with the unknown type so
 *    developers notice immediately.
 *  - Production (non-preview): renders nothing. An unknown section should not
 *    crash the page or expose internal type names to end users.
 *
 * This is intentionally a named component (not an inline anonymous function)
 * so it appears clearly in React DevTools and error stack traces.
 */
export function UnsupportedSection({
  id,
  props,
  isPreview,
}: SectionComponentProps) {
  // `props` may contain a `_type` hint injected by the renderer for debugging
  const typeHint =
    typeof props['_type'] === 'string' ? props['_type'] : 'unknown';

  // In production without preview, render nothing — fail silently
  if (process.env.NODE_ENV === 'production' && !isPreview) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-label={`Unsupported section: ${typeHint}`}
      data-section-id={id}
      className="mx-6 my-4 rounded-md border-2 border-dashed border-orange-300 bg-orange-50 p-6"
    >
      <div className="flex items-start gap-3">
        {/* Warning icon — inline SVG avoids an icon library dependency */}
        <svg
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0 text-orange-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>

        <div>
          <p className="text-sm font-semibold text-orange-800">
            Unsupported section type
          </p>
          <p className="mt-1 text-sm text-orange-700">
            Section <code className="font-mono font-normal">{id}</code> has
            type <code className="font-mono font-normal">&quot;{typeHint}&quot;</code>{' '}
            which is not registered. Add an entry to{' '}
            <code className="font-mono font-normal">src/registry/sectionRegistry.ts</code>{' '}
            to render it.
          </p>
        </div>
      </div>
    </div>
  );
}
