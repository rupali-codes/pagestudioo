'use client';

/**
 * GenericEditor — fallback editor for section types without a dedicated panel.
 *
 * Renders a controlled text input for every top-level string prop.
 * Uses local state with debounced Redux dispatch for fast typing without
 * causing a Redux write + Immer clone on every keystroke.
 *
 * Non-string props (arrays, objects) are shown as read-only JSON so the
 * author can at least see what's there.
 */

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectDraftSectionById } from '@/store/selectors';
import { updateSectionProps } from '@/store/slices/draftPageSlice';
import { useDebounce } from '@/hooks/useDebounce';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';

interface GenericEditorProps {
  sectionId: string;
}

export function GenericEditor({ sectionId }: GenericEditorProps) {
  const dispatch = useAppDispatch();
  const section = useAppSelector(selectDraftSectionById(sectionId));

  const stringProps = Object.entries(section?.props ?? {}).filter(
    ([, v]) => typeof v === 'string',
  ) as [string, string][];

  const complexProps = Object.entries(section?.props ?? {}).filter(
    ([, v]) => typeof v !== 'string',
  );

  // Local state for all string props — initialized once from Redux.
  // Keyed by sectionId so the component remounts on section switch.
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(stringProps),
  );

  const debouncedValues = useDebounce(values, 300);

  // Dispatch debounced values to Redux for preview sync
  useEffect(() => {
    if (!section) return;
    dispatch(updateSectionProps({ sectionId, props: debouncedValues }));
  }, [debouncedValues]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  if (!section) return null;

  return (
    <div className="space-y-4 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {section.type}
      </p>

      {stringProps.length === 0 && complexProps.length === 0 && (
        <p className="text-xs text-gray-500">No editable props.</p>
      )}

      {stringProps.map(([key]) => (
        <FormField key={key} id={`${sectionId}-${key}`} label={key}>
          <Input
            id={`${sectionId}-${key}`}
            value={values[key] ?? ''}
            onChange={(e) => handleChange(key, e.target.value)}
          />
        </FormField>
      ))}

      {complexProps.length > 0 && (
        <div>
          <p className="mb-1 text-xs text-gray-400">
            Complex props (read-only — edit in Contentful):
          </p>
          {complexProps.map(([key, value]) => (
            <div key={key} className="mb-2">
              <p className="mb-0.5 text-xs font-medium text-gray-600">{key}</p>
              <pre className="overflow-auto rounded bg-gray-100 p-2 text-xs text-gray-600">
                {JSON.stringify(value, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
