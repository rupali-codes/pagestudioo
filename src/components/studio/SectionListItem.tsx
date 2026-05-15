'use client';

/**
 * SectionListItem — a single row in the section list sidebar.
 *
 * Accessibility:
 *  - Move up/down buttons have descriptive aria-labels including the section
 *    type so screen reader users know what they're reordering.
 *  - The remove button has an aria-label and requires a confirmation click
 *    (two-step: first click shows confirm state, second click removes).
 *    This prevents accidental deletion via keyboard navigation.
 *  - The row itself is a <li> with role="listitem" (implicit from <li>).
 *  - Selected state is communicated via aria-current="true".
 */

import { useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import {
  moveSectionUp,
  moveSectionDown,
  removeSection,
} from '@/store/slices/draftPageSlice';
import { selectSection } from '@/store/slices/uiSlice';
import { cn } from '@/lib/cn';
import { getSectionDisplayName } from '@/registry/sectionRegistry';
import { usePermission } from '@/hooks/usePermission';
import type { Section } from '@/types/page';

interface SectionListItemProps {
  section: Section;
  index: number;
  total: number;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
}

export function SectionListItem({
  section,
  isSelected,
  isFirst,
  isLast,
}: SectionListItemProps) {
  const dispatch = useAppDispatch();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const canEdit = usePermission('page:edit');

  function handleSelect() {
    dispatch(selectSection(isSelected ? null : section.id));
  }

  function handleMoveUp(e: React.MouseEvent) {
    e.stopPropagation();
    dispatch(moveSectionUp(section.id));
  }

  function handleMoveDown(e: React.MouseEvent) {
    e.stopPropagation();
    dispatch(moveSectionDown(section.id));
  }

  function handleRemoveClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (confirmRemove) {
      dispatch(removeSection(section.id));
      dispatch(selectSection(null));
    } else {
      setConfirmRemove(true);
    }
  }

  function handleBlur() {
    // Reset confirm state if focus leaves the remove button
    setTimeout(() => setConfirmRemove(false), 200);
  }

  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        aria-current={isSelected ? 'true' : undefined}
        aria-label={`Edit ${section.type} section`}
        onClick={handleSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelect();
          }
        }}
        className={cn(
          'group flex cursor-pointer items-center gap-2 border-b border-gray-100 px-3 py-2.5 text-sm',
          'hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500',
          isSelected && 'bg-blue-50',
        )}
      >
        {/* Section type label — sourced from registry displayName */}
        <span className="min-w-0 flex-1 truncate font-medium text-gray-800">
          {getSectionDisplayName(section.type)}
        </span>

        {/* Reorder controls */}
        {canEdit && (
          <div
            className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <IconButton
              onClick={handleMoveUp}
              disabled={isFirst}
              aria-label={`Move ${section.type} section up`}
              title="Move up"
            >
              <ChevronUpIcon />
            </IconButton>

            <IconButton
              onClick={handleMoveDown}
              disabled={isLast}
              aria-label={`Move ${section.type} section down`}
              title="Move down"
            >
              <ChevronDownIcon />
            </IconButton>

            <IconButton
              onClick={handleRemoveClick}
              onBlur={handleBlur}
              aria-label={
                confirmRemove
                  ? `Confirm remove ${section.type} section`
                  : `Remove ${section.type} section`
              }
              title={confirmRemove ? 'Click again to confirm' : 'Remove'}
              className={cn(
                confirmRemove
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-400 hover:text-red-500',
              )}
            >
              <TrashIcon />
            </IconButton>
          </div>
        )}
      </div>
    </li>
  );
}

// ─── Icon button ──────────────────────────────────────────────────────────────

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

function IconButton({ children, className, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded text-gray-400',
        'hover:bg-gray-200 hover:text-gray-700',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        'disabled:cursor-not-allowed disabled:opacity-30',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Inline SVG icons (no icon library dependency) ───────────────────────────

function ChevronUpIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}
