'use client';

/**
 * EditorSidebar — the left panel of the studio editor.
 *
 * Three states:
 *  1. Add-section panel open → shows AddSectionPanel
 *  2. A section is selected → shows SectionEditorPanel for that section
 *  3. No selection → shows the section list with reorder/remove controls
 *
 * The sidebar never shows both the list and an editor at the same time —
 * selecting a section replaces the list with the editor. This keeps the
 * panel narrow and focused.
 */

import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  selectDraftSections,
  selectSelectedSectionId,
  selectSelectedSection,
  selectIsAddSectionOpen,
} from '@/store/selectors';
import { selectSection } from '@/store/slices/uiSlice';
import { openAddSection } from '@/store/slices/uiSlice';
import { SectionListItem } from './SectionListItem';
import { SectionEditorPanel } from './editors/SectionEditorPanel';
import { AddSectionPanel } from './AddSectionPanel';
import { Button } from '@/components/ui/Button';
import { usePermission } from '@/hooks/usePermission';
import { getSectionDisplayName } from '@/registry/sectionRegistry';
import type { Section, SectionType } from '@/types/page';

export function EditorSidebar() {
  const dispatch = useAppDispatch();
  const sections = useAppSelector(selectDraftSections);
  const selectedId = useAppSelector(selectSelectedSectionId);
  const selectedSection = useAppSelector(selectSelectedSection);
  const isAddOpen = useAppSelector(selectIsAddSectionOpen);
  const canEdit = usePermission('page:edit');

  // ── Add section panel ────────────────────────────────────────────────────
  if (isAddOpen) {
    return <AddSectionPanel />;
  }

  // ── Section editor panel (viewers see read-only display) ─────────────────
  if (selectedId && selectedSection) {
    return (
      <div className="flex h-full flex-col">
        {/* Back button */}
        <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2">
          <button
            type="button"
            onClick={() => dispatch(selectSection(null))}
            aria-label="Back to section list"
            className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700">
            {canEdit ? 'Edit section' : 'Section details'}
          </span>
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto">
          {canEdit ? (
            <SectionEditorPanel
              sectionId={selectedId}
              sectionType={selectedSection.type as SectionType}
            />
          ) : (
            <ReadOnlySectionView section={selectedSection} />
          )}
        </div>
      </div>
    );
  }

  // ── Section list ─────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Sections
        </h2>
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch(openAddSection())}
            aria-label="Add a new section"
            className="h-7 gap-1 px-2 text-xs"
          >
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Add
          </Button>
        )}
      </div>

      {/* List */}
      {sections.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm text-gray-500">No sections yet.</p>
          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => dispatch(openAddSection())}
            >
              Add first section
            </Button>
          )}
        </div>
      ) : (
        <ul role="list" className="flex-1 overflow-y-auto">
          {sections.map((section: Section, i: number) => (
            <SectionListItem
              key={section.id}
              section={section}
              index={i}
              total={sections.length}
              isSelected={section.id === selectedId}
              isFirst={i === 0}
              isLast={i === sections.length - 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Read-only section view ────────────────────────────────────────────────────

interface ReadOnlySectionViewProps {
  section: Section;
}

function ReadOnlySectionView({ section }: ReadOnlySectionViewProps) {
  return (
    <div className="space-y-4 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {getSectionDisplayName(section.type)}
      </p>

      {Object.keys(section.props).length === 0 && (
        <p className="text-xs text-gray-500">No props configured.</p>
      )}

      {Object.entries(section.props).map(([key, value]) => (
        <div key={key}>
          <p className="mb-0.5 text-xs font-medium text-gray-600 capitalize">
            {key}
          </p>
          <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-800">
            {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
          </p>
        </div>
      ))}
    </div>
  );
}
