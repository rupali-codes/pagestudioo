'use client';

/**
 * GenericEditor — fallback editor for section types without a dedicated panel.
 *
 * Renders a controlled text input for every top-level string prop.
 * Non-string props (arrays, objects) are shown as read-only JSON so the
 * author can at least see what's there.
 *
 * This is intentionally minimal — it's a safety net, not a polished UI.
 * Add a dedicated editor (like HeroEditor) for any section type that needs
 * structured editing.
 */

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectDraftSectionById } from '@/store/selectors';
import { updateSectionProps } from '@/store/slices/draftPageSlice';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';

interface GenericEditorProps {
  sectionId: string;
}

export function GenericEditor({ sectionId }: GenericEditorProps) {
  const dispatch = useAppDispatch();
  const section = useAppSelector(selectDraftSectionById(sectionId));

  if (!section) return null;

  const stringProps = Object.entries(section.props).filter(
    ([, v]) => typeof v === 'string',
  );

  const complexProps = Object.entries(section.props).filter(
    ([, v]) => typeof v !== 'string',
  );

  function handleChange(key: string, value: string) {
    dispatch(updateSectionProps({ sectionId, props: { [key]: value } }));
  }

  return (
    <div className="space-y-4 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {section.type}
      </p>

      {stringProps.length === 0 && complexProps.length === 0 && (
        <p className="text-xs text-gray-500">No editable props.</p>
      )}

      {stringProps.map(([key, value]) => (
        <FormField key={key} id={`${sectionId}-${key}`} label={key}>
          <Input
            id={`${sectionId}-${key}`}
            defaultValue={value as string}
            onBlur={(e) => handleChange(key, e.target.value)}
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
