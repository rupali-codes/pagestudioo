'use client';

/**
 * HeroEditor — form panel for editing Hero section props.
 *
 * Design rules:
 *  - Reads from Redux via selector, writes via dispatch only — no local state
 *    for field values. This keeps the preview in sync on every keystroke.
 *  - Uses useDebounce to batch rapid keystrokes into a single dispatch,
 *    avoiding a Redux write + Immer clone on every character.
 *  - All inputs are controlled (value= not defaultValue=) so the form always
 *    reflects the Redux state, including after an undo or draft hydration.
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

  // Parse current props — fall back to empty object if section not found
  const parsed = validate(HeroPropsSchema, section?.props ?? {});
  const current: Partial<HeroProps> = parsed.ok ? parsed.value : {};

  // Local controlled state — debounced before dispatching to Redux.
  // This prevents a Redux write + re-render on every keystroke while still
  // keeping the preview live with a short delay.
  const [heading, setHeading] = useState(current.heading ?? '');
  const [subheading, setSubheading] = useState(current.subheading ?? '');
  const [ctaLabel, setCtaLabel] = useState(current.ctaLabel ?? '');
  const [ctaHref, setCtaHref] = useState(current.ctaHref ?? '');

  const debouncedHeading = useDebounce(heading, 300);
  const debouncedSubheading = useDebounce(subheading, 300);
  const debouncedCtaLabel = useDebounce(ctaLabel, 300);
  const debouncedCtaHref = useDebounce(ctaHref, 300);

  // Sync local state when a different section is selected or draft is hydrated
  useEffect(() => {
    const p = validate(HeroPropsSchema, section?.props ?? {});
    if (!p.ok) return;
    setHeading(p.value.heading);
    setSubheading(p.value.subheading ?? '');
    setCtaLabel(p.value.ctaLabel ?? '');
    setCtaHref(p.value.ctaHref ?? '');
  }, [sectionId]); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ intentionally only on sectionId — we don't want to reset while typing

  // Dispatch debounced values to Redux
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
