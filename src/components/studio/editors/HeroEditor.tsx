'use client';

/**
 * HeroEditor — form panel for editing Hero section props.
 *
 * Design rules:
 *  - Uses local state for instant typing feedback, debounced before dispatching
 *    to Redux. This avoids a Redux write + Immer clone on every keystroke.
 *  - The editor remounts on section switch via `key={sectionId}` in
 *    SectionEditorPanel, so initial state always matches the selected section.
 *  - All inputs are controlled (value= not defaultValue=) so the form always
 *    reflects the Redux state, including after draft hydration.
 */

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectDraftSectionById } from '@/store/selectors';
import { updateSectionProps } from '@/store/slices/draftPageSlice';
import { validate } from '@/lib/validate';
import { HeroPropsSchema, type HeroProps } from '@/schemas/props/hero';
import { useDebounce } from '@/hooks/useDebounce';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

interface HeroEditorProps {
  sectionId: string;
}

export function HeroEditor({ sectionId }: HeroEditorProps) {
  const dispatch = useAppDispatch();
  const section = useAppSelector(selectDraftSectionById(sectionId));

  const parsed = validate(HeroPropsSchema, section?.props ?? {});
  const current: Partial<HeroProps> = parsed.ok ? parsed.value : {};

  const [heading, setHeading] = useState(current.heading ?? '');
  const [subheading, setSubheading] = useState(current.subheading ?? '');
  const [ctaLabel, setCtaLabel] = useState(current.ctaLabel ?? '');
  const [ctaHref, setCtaHref] = useState(current.ctaHref ?? '');

  const debouncedHeading = useDebounce(heading, 300);
  const debouncedSubheading = useDebounce(subheading, 300);
  const debouncedCtaLabel = useDebounce(ctaLabel, 300);
  const debouncedCtaHref = useDebounce(ctaHref, 300);

  // Dispatch debounced values to Redux
  // Note: the component is keyed by sectionId in SectionEditorPanel so it
  // remounts on section switch — no sync effect needed.
  useEffect(() => {
    if (!section) return;
    dispatch(
      updateSectionProps({
        sectionId,
        props: {
          heading: debouncedHeading,
          subheading: debouncedSubheading || undefined,
          ctaLabel: debouncedCtaLabel || undefined,
          ctaHref: debouncedCtaHref || undefined,
        },
      }),
    );
  }, [debouncedHeading, debouncedSubheading, debouncedCtaLabel, debouncedCtaHref]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!section) return null;

  return (
    <div className="space-y-4 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        Hero
      </p>

      <FormField id={`${sectionId}-heading`} label="Heading" required>
        <Input
          id={`${sectionId}-heading`}
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          placeholder="Enter heading"
          aria-required="true"
        />
      </FormField>

      <FormField
        id={`${sectionId}-subheading`}
        label="Subheading"
        description="Optional supporting text below the heading."
      >
        <Textarea
          id={`${sectionId}-subheading`}
          value={subheading}
          onChange={(e) => setSubheading(e.target.value)}
          placeholder="Enter subheading"
        />
      </FormField>

      <FormField id={`${sectionId}-ctaLabel`} label="CTA label">
        <Input
          id={`${sectionId}-ctaLabel`}
          value={ctaLabel}
          onChange={(e) => setCtaLabel(e.target.value)}
          placeholder="e.g. Get started"
        />
      </FormField>

      <FormField
        id={`${sectionId}-ctaHref`}
        label="CTA URL"
        description="Relative path or absolute URL."
      >
        <Input
          id={`${sectionId}-ctaHref`}
          type="url"
          value={ctaHref}
          onChange={(e) => setCtaHref(e.target.value)}
          placeholder="e.g. /signup or https://…"
        />
      </FormField>
    </div>
  );
}
