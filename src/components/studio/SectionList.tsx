'use client';

/**
 * SectionList — legacy flat list used by the original /studio shell.
 * The new /studio/[slug] editor uses EditorSidebar + SectionListItem instead.
 * Kept here so the original StudioShell at /studio still compiles.
 */

import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectDraftSections } from '@/store/selectors';
import { updateSectionProps } from '@/store/slices/draftPageSlice';
import type { Section } from '@/types/page';

export function SectionList() {
  const dispatch = useAppDispatch();
  const sections = useAppSelector(selectDraftSections);

  function handlePropChange(section: Section, key: string, value: string) {
    dispatch(updateSectionProps({ sectionId: section.id, props: { [key]: value } }));
  }

  if (sections.length === 0) {
    return <p className="p-4 text-sm text-gray-500">No sections on this page.</p>;
  }

  return (
    <ul role="list" className="divide-y divide-gray-100">
      {sections.map((section: Section) => (
        <li key={section.id} className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {section.type}
            </span>
            <span className="font-mono text-xs text-gray-400">{section.id}</span>
          </div>
          <div className="space-y-2">
            {Object.entries(section.props)
              .filter(([, v]) => typeof v === 'string')
              .map(([key, value]) => (
                <div key={key}>
                  <label
                    htmlFor={`${section.id}-${key}`}
                    className="mb-0.5 block text-xs text-gray-600"
                  >
                    {key}
                  </label>
                  <input
                    id={`${section.id}-${key}`}
                    type="text"
                    defaultValue={value as string}
                    onBlur={(e) => handlePropChange(section, key, e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
