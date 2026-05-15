import type { SectionComponentProps } from '@/types/registry';
import { validate, zodIssues } from '@/lib/validate';
import { HeroPropsSchema } from '@/schemas/props/hero';
import { SectionError } from '@/components/ui/SectionError';
import { cn } from '@/lib/cn';

/**
 * HeroSection — full-width hero with heading, optional subheading, CTA, and
 * background image.
 *
 * Validation: props are validated against `HeroPropsSchema` on every render.
 * When called via `SectionRenderer` the props will already have passed the
 * pre-flight check, so this is a fast no-op in the happy path. When the
 * component is used standalone (e.g. in Storybook or tests) the validation
 * here is the only guard.
 */
export function HeroSection({ id, props, isPreview }: SectionComponentProps) {
  const result = validate(HeroPropsSchema, props);

  if (!result.ok) {
    return (
      <SectionError
        sectionId={id}
        sectionType="hero"
        issues={zodIssues(result.error)}
        isPreview={isPreview}
      />
    );
  }

  const { heading, subheading, ctaLabel, ctaHref, imageUrl, imageAlt } =
    result.value;

  return (
    <section
      id={id}
      aria-label={`Hero: ${heading}`}
      className={cn(
        'relative flex flex-col items-center justify-center gap-6 px-6 py-24 text-center',
        isPreview && 'outline outline-2 outline-dashed outline-blue-400',
      )}
    >
      {imageUrl && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          {/* next/image would be preferable in production; <img> is used here
              to keep the component free of Next.js-specific dependencies so it
              can be rendered in non-Next environments (tests, Storybook). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={imageAlt ?? ''}
            className="h-full w-full object-cover opacity-20"
          />
        </div>
      )}

      <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        {heading}
      </h1>

      {subheading && (
        <p className="max-w-xl text-lg text-gray-600">{subheading}</p>
      )}

      {ctaLabel && ctaHref && (
        <a
          href={ctaHref}
          className="inline-flex items-center rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {ctaLabel}
        </a>
      )}
    </section>
  );
}
