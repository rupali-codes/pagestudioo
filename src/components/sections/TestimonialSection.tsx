import type { SectionComponentProps } from '@/types/registry';
import { validate, zodIssues } from '@/lib/validate';
import { TestimonialPropsSchema } from '@/schemas/props/testimonial';
import { SectionError } from '@/components/ui/SectionError';
import { cn } from '@/lib/cn';

export function TestimonialSection({
  id,
  props,
  isPreview,
}: SectionComponentProps) {
  const result = validate(TestimonialPropsSchema, props);

  if (!result.ok) {
    return (
      <SectionError
        sectionId={id}
        sectionType="testimonial"
        issues={zodIssues(result.error)}
        isPreview={isPreview}
      />
    );
  }

  const { heading, testimonials } = result.value;

  return (
    <section
      id={id}
      aria-labelledby={heading ? `${id}-heading` : undefined}
      className={cn(
        'bg-gray-50 px-6 py-16',
        isPreview && 'outline outline-2 outline-dashed outline-blue-400',
      )}
    >
      {heading && (
        <h2
          id={`${id}-heading`}
          className="mb-10 text-center text-3xl font-bold text-gray-900"
        >
          {heading}
        </h2>
      )}

      <ul className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2" role="list">
        {testimonials.map((t) => (
          <li key={t.id} className="rounded-lg bg-white p-6 shadow-sm">
            <blockquote>
              <p className="mb-4 text-gray-700">&ldquo;{t.quote}&rdquo;</p>
              <footer className="flex items-center gap-3">
                {t.avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.avatarUrl}
                    alt={t.avatarAlt ?? `${t.author} avatar`}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <cite className="not-italic font-semibold text-gray-900">
                    {t.author}
                  </cite>
                  {t.role && (
                    <p className="text-sm text-gray-500">{t.role}</p>
                  )}
                </div>
              </footer>
            </blockquote>
          </li>
        ))}
      </ul>
    </section>
  );
}
