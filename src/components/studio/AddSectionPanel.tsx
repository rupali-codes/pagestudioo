'use client';

/**
 * AddSectionPanel — lets the user pick a section type to append.
 *
 * Accessibility:
 *  - Each option is a <button> so it's keyboard-navigable and announced
 *    correctly by screen readers.
 *  - The panel has role="region" with an aria-label.
 *  - Focus is managed: when the panel opens, focus moves to the first button.
 */

import { useRef, useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { addSection } from '@/store/slices/draftPageSlice';
import { closeAddSection, selectSection } from '@/store/slices/uiSlice';
import { getDefaultSectionProps } from '@/lib/defaultSectionProps';
import { SECTION_TYPES } from '@/constants';
import type { SectionType } from '@/types/page';
import { cn } from '@/lib/cn';
import { getSectionDisplayName } from '@/registry/sectionRegistry';

const SECTION_META: Record<
  SectionType,
  { description: string; icon: string }
> = {
  hero: {
    description: 'Full-width heading with optional CTA button.',
    icon: '🦸',
  },
  featureGrid: {
    description: 'Grid of feature cards with icons and descriptions.',
    icon: '⚡',
  },
  testimonial: {
    description: 'Customer quotes with author attribution.',
    icon: '💬',
  },
  cta: {
    description: 'Prominent section with one or two action buttons.',
    icon: '🎯',
  },
};

export function AddSectionPanel() {
  const dispatch = useAppDispatch();
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  // Move focus to the first option when the panel mounts
  useEffect(() => {
    firstButtonRef.current?.focus();
  }, []);

  function handleAdd(type: SectionType) {
    const newSection = {
      id: crypto.randomUUID(),
      type,
      props: getDefaultSectionProps(type),
    };
    dispatch(addSection(newSection));
    dispatch(selectSection(newSection.id));
    dispatch(closeAddSection());
  }

  function handleClose() {
    dispatch(closeAddSection());
  }

  return (
    <div
      role="region"
      aria-label="Add section"
      className="flex h-full flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Add section</h2>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close add section panel"
          className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Section type options */}
      <ul role="list" className="flex-1 overflow-y-auto p-2">
        {SECTION_TYPES.map((type, i) => {
          const meta = SECTION_META[type];
          return (
            <li key={type}>
              <button
                ref={i === 0 ? firstButtonRef : undefined}
                type="button"
                onClick={() => handleAdd(type)}
                className={cn(
                  'w-full rounded-md px-3 py-3 text-left',
                  'hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                  'transition-colors',
                )}
              >
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="mt-0.5 text-xl leading-none">
                    {meta.icon}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {getSectionDisplayName(type)}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {meta.description}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
