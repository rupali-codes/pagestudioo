'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectDraftSectionById } from '@/store/selectors';
import { updateSectionProps } from '@/store/slices/draftPageSlice';
import { validate } from '@/lib/validate';
import { CtaPropsSchema, type CtaProps } from '@/schemas/props/cta';
import { useDebounce } from '@/hooks/useDebounce';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

interface CtaEditorProps {
  sectionId: string;
}

export function CtaEditor({ sectionId }: CtaEditorProps) {
  const dispatch = useAppDispatch();
  const section = useAppSelector(selectDraftSectionById(sectionId));

  const parsed = validate(CtaPropsSchema, section?.props ?? {});
  const current: Partial<CtaProps> = parsed.ok ? parsed.value : {};

  const [heading, setHeading] = useState(current.heading ?? '');
  const [body, setBody] = useState(current.body ?? '');
  const [primaryLabel, setPrimaryLabel] = useState(current.primaryLabel ?? '');
  const [primaryHref, setPrimaryHref] = useState(current.primaryHref ?? '');
  const [secondaryLabel, setSecondaryLabel] = useState(current.secondaryLabel ?? '');
  const [secondaryHref, setSecondaryHref] = useState(current.secondaryHref ?? '');

  const dHeading = useDebounce(heading, 300);
  const dBody = useDebounce(body, 300);
  const dPrimaryLabel = useDebounce(primaryLabel, 300);
  const dPrimaryHref = useDebounce(primaryHref, 300);
  const dSecondaryLabel = useDebounce(secondaryLabel, 300);
  const dSecondaryHref = useDebounce(secondaryHref, 300);

  // Note: the component is keyed by sectionId in SectionEditorPanel so it
  // remounts on section switch — no sync effect needed.

  useEffect(() => {
    if (!section) return;
    dispatch(
      updateSectionProps({
        sectionId,
        props: {
          heading: dHeading,
          body: dBody || undefined,
          primaryLabel: dPrimaryLabel,
          primaryHref: dPrimaryHref,
          secondaryLabel: dSecondaryLabel || undefined,
          secondaryHref: dSecondaryHref || undefined,
        },
      }),
    );
  }, [dHeading, dBody, dPrimaryLabel, dPrimaryHref, dSecondaryLabel, dSecondaryHref]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!section) return null;

  return (
    <div className="space-y-4 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        Call to Action
      </p>

      <FormField id={`${sectionId}-heading`} label="Heading" required>
        <Input
          id={`${sectionId}-heading`}
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          placeholder="Ready to get started?"
          aria-required="true"
        />
      </FormField>

      <FormField
        id={`${sectionId}-body`}
        label="Body text"
        description="Optional supporting paragraph."
      >
        <Textarea
          id={`${sectionId}-body`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a supporting sentence…"
        />
      </FormField>

      <fieldset className="space-y-3 rounded-md border border-gray-200 p-3">
        <legend className="px-1 text-xs font-medium text-gray-600">
          Primary button
        </legend>

        <FormField id={`${sectionId}-primaryLabel`} label="Label" required>
          <Input
            id={`${sectionId}-primaryLabel`}
            value={primaryLabel}
            onChange={(e) => setPrimaryLabel(e.target.value)}
            placeholder="e.g. Get started"
            aria-required="true"
          />
        </FormField>

        <FormField id={`${sectionId}-primaryHref`} label="URL" required>
          <Input
            id={`${sectionId}-primaryHref`}
            type="url"
            value={primaryHref}
            onChange={(e) => setPrimaryHref(e.target.value)}
            placeholder="/signup"
            aria-required="true"
          />
        </FormField>
      </fieldset>

      <fieldset className="space-y-3 rounded-md border border-gray-200 p-3">
        <legend className="px-1 text-xs font-medium text-gray-600">
          Secondary button (optional)
        </legend>

        <FormField id={`${sectionId}-secondaryLabel`} label="Label">
          <Input
            id={`${sectionId}-secondaryLabel`}
            value={secondaryLabel}
            onChange={(e) => setSecondaryLabel(e.target.value)}
            placeholder="e.g. Learn more"
          />
        </FormField>

        <FormField id={`${sectionId}-secondaryHref`} label="URL">
          <Input
            id={`${sectionId}-secondaryHref`}
            type="url"
            value={secondaryHref}
            onChange={(e) => setSecondaryHref(e.target.value)}
            placeholder="/pricing"
          />
        </FormField>
      </fieldset>
    </div>
  );
}
