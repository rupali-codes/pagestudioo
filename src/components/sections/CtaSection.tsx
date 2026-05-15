import type { SectionComponentProps } from '@/types/registry';
import { validate, zodIssues } from '@/lib/validate';
import { CtaPropsSchema } from '@/schemas/props/cta';
import { SectionError } from '@/components/ui/SectionError';
import { cn } from '@/lib/cn';

export function CtaSection({ id, props, isPreview }: SectionComponentProps) {
  const result = validate(CtaPropsSchema, props);

  if (!result.ok) {
    return (
      <SectionError
        sectionId={id}
        sectionType="cta"
        issues={zodIssues(result.error)}
        isPreview={isPreview}
      />
    );
  }

  const {
    heading,
    body,
    primaryLabel,
    primaryHref,
    secondaryLabel,
    secondaryHref,
  } = result.value;

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={cn(
        'bg-blue-600 px-6 py-16 text-center text-white',
        isPreview && 'outline outline-2 outline-dashed outline-white',
      )}
    >
      <h2 id={`${id}-heading`} className="mb-4 text-3xl font-bold">
        {heading}
      </h2>

      {body && <p className="mb-8 text-blue-100">{body}</p>}

      <div className="flex flex-wrap items-center justify-center gap-4">
        <a
          href={primaryHref}
          className="inline-flex items-center rounded-md bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {primaryLabel}
        </a>

        {secondaryLabel && secondaryHref && (
          <a
            href={secondaryHref}
            className="inline-flex items-center rounded-md border border-white px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {secondaryLabel}
          </a>
        )}
      </div>
    </section>
  );
}
