interface SectionErrorProps {
  sectionId: string;
  sectionType: string;
  /** Structured list of Zod issue strings — shown in dev/preview only */
  issues?: string[];
  isPreview?: boolean;
}

/**
 * SectionError — rendered when a section's props fail Zod validation.
 *
 * Two modes:
 *  - Dev / preview: shows the section ID, type, and every validation issue
 *    so the content author or developer can fix the CMS entry immediately.
 *  - Production (non-preview): renders a neutral placeholder that preserves
 *    page layout without leaking internal schema details to end users.
 *
 * The placeholder is intentionally minimal — it occupies space so the page
 * doesn't collapse, but gives no hint that something is wrong.
 */
export function SectionError({
  sectionId,
  sectionType,
  issues = [],
  isPreview,
}: SectionErrorProps) {
  const isDev = process.env.NODE_ENV !== 'production';
  const showDetails = isDev || isPreview;

  if (!showDetails) {
    // Production fallback: invisible spacer — keeps layout intact
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
      aria-label={`Schema error in ${sectionType} section`}
      data-section-id={sectionId}
      className="mx-6 my-4 rounded-md border border-red-300 bg-red-50 p-4"
    >
      <div className="flex items-start gap-3">
        {/* Error icon */}
        <svg
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374l7.304-12.748c.866-1.5 3.032-1.5 3.898 0l7.304 12.748zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-red-800">
            Invalid props for{' '}
            <code className="font-mono font-normal">{sectionType}</code> section
          </p>
          <p className="mt-0.5 text-xs text-red-600">
            Section ID: <code className="font-mono">{sectionId}</code>
          </p>

          {issues.length > 0 && (
            <ul className="mt-2 space-y-0.5" aria-label="Validation issues">
              {issues.map((issue, i) => (
                <li key={i} className="text-xs text-red-700">
                  <code className="font-mono">{issue}</code>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-2 text-xs text-red-500">
            Fix the CMS entry or update the schema in{' '}
            <code className="font-mono">
              src/schemas/props/{sectionType}.ts
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
