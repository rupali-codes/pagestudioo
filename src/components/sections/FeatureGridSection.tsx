import type { SectionComponentProps } from '@/types/registry';
import { validate, zodIssues } from '@/lib/validate';
import { FeatureGridPropsSchema } from '@/schemas/props/featureGrid';
import { SectionError } from '@/components/ui/SectionError';
import { cn } from '@/lib/cn';

export function FeatureGridSection({
  id,
  props,
  isPreview,
}: SectionComponentProps) {
  const result = validate(FeatureGridPropsSchema, props);

  if (!result.ok) {
    return (
      <SectionError
        sectionId={id}
        sectionType="featureGrid"
        issues={zodIssues(result.error)}
        isPreview={isPreview}
      />
    );
  }

  const { heading, features } = result.value;

  return (
    <section
      id={id}
      aria-labelledby={heading ? `${id}-heading` : undefined}
      className={cn(
        'px-6 py-16',
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

      <ul
        className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
      >
        {features.map((feature) => (
          <li
            key={feature.id}
            className="rounded-lg border border-gray-200 p-6 shadow-sm"
          >
            {feature.icon && (
              <span aria-hidden="true" className="mb-3 block text-2xl">
                {feature.icon}
              </span>
            )}
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {feature.title}
            </h3>
            <p className="text-sm text-gray-600">{feature.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
