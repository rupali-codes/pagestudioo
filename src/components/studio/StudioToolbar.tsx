'use client';

import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  selectDraftIsDirty,
  selectDraftIsSaving,
  selectIsPublishing,
  selectPublishError,
  selectLastPublishedRelease,
  selectUser,
  selectDraft,
} from '@/store/selectors';
import { resetDraft, setSaving as setDraftSaving, markClean } from '@/store/slices/draftPageSlice';
import { openDiscardDialog } from '@/store/slices/uiSlice';
import { clearPublishError } from '@/store/slices/publishSlice';
import { hasPermission } from '@/types/auth';
import { usePublishDraft } from '@/hooks/usePublishDraft';
import { usePermission } from '@/hooks/usePermission';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

interface StudioToolbarProps {
  pageTitle?: string;
}

export function StudioToolbar({ pageTitle }: StudioToolbarProps) {
  const dispatch = useAppDispatch();
  const { publish } = usePublishDraft();

  const user = useAppSelector(selectUser);
  const draft = useAppSelector(selectDraft);
  const isDirty = useAppSelector(selectDraftIsDirty);
  const isSaving = useAppSelector(selectDraftIsSaving);
  const isPublishing = useAppSelector(selectIsPublishing);
  const publishError = useAppSelector(selectPublishError);
  const lastRelease = useAppSelector(selectLastPublishedRelease);

  const canEdit = usePermission('page:edit');
  const canPublish = usePermission('page:publish');

  void hasPermission; // imported for type safety in other files

  async function handleSave() {
    dispatch(setDraftSaving(true));
    dispatch(markClean());
    // Brief delay so aria-busy state is visible before the badge flips
    await new Promise((resolve) => setTimeout(resolve, 150));
    dispatch(setDraftSaving(false));
  }

  function handleDiscard() {
    if (isDirty) {
      dispatch(openDiscardDialog());
    } else {
      dispatch(resetDraft());
    }
  }

  return (
    <header
      role="banner"
      className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-2"
    >
      {/* Left: app name + page title */}
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 text-sm font-semibold text-gray-900">
          Page Studio
        </span>
        {(pageTitle ?? draft?.title) && (
          <>
            <span aria-hidden="true" className="text-gray-300">
              /
            </span>
            <span className="truncate text-sm text-gray-600">
              {pageTitle ?? draft?.title}
            </span>
          </>
        )}
        {lastRelease && (
          <Badge variant="info" className="shrink-0">
            v{lastRelease.version}
          </Badge>
        )}
        {isDirty && (
          <Badge variant="warning" className="shrink-0">
            Unsaved
          </Badge>
        )}
      </div>

      {/* Right: actions */}
      <nav
        aria-label="Editor actions"
        className="flex shrink-0 items-center gap-2"
      >
        {/* Publish error inline */}
        {publishError && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-red-600">{publishError}</span>
            <button
              type="button"
              onClick={() => dispatch(clearPublishError())}
              aria-label="Dismiss publish error"
              className="text-xs text-red-400 underline hover:text-red-600"
            >
              Dismiss
            </button>
          </div>
        )}

        {canEdit && isDirty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDiscard}
            className="text-gray-500"
          >
            Discard
          </Button>
        )}

        {canEdit && (
          <Button
            variant="secondary"
            size="sm"
            disabled={!isDirty || isSaving}
            aria-busy={isSaving}
            aria-label="Save draft"
            onClick={handleSave}
          >
            {isSaving ? 'Saving…' : 'Save draft'}
          </Button>
        )}

        {canPublish && (
          <Button
            variant="primary"
            size="sm"
            onClick={publish}
            disabled={!isDirty || isPublishing || !draft}
            aria-busy={isPublishing}
            aria-label="Publish page"
            className={cn(isPublishing && 'cursor-wait')}
          >
            {isPublishing ? 'Publishing…' : 'Publish'}
          </Button>
        )}

        {user && (
          <span className="ml-2 hidden text-xs text-gray-400 sm:block">
            {user.name} · {user.role}
          </span>
        )}
      </nav>
    </header>
  );
}
