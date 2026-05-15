'use client';

/**
 * DiscardDialog — confirmation before discarding unsaved changes.
 *
 * Uses Radix UI Dialog (already installed) for accessible modal behaviour:
 *  - Focus is trapped inside the dialog while open.
 *  - Pressing Escape closes it.
 *  - Screen readers announce the dialog title automatically.
 */

import * as Dialog from '@radix-ui/react-dialog';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectIsDiscardDialogOpen, selectDraft } from '@/store/selectors';
import { closeDiscardDialog } from '@/store/slices/uiSlice';
import { resetDraft } from '@/store/slices/draftPageSlice';
import { clearPersistedDraft } from '@/store/persistMiddleware';
import { Button } from '@/components/ui/Button';

export function DiscardDialog() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsDiscardDialogOpen);
  const draft = useAppSelector(selectDraft);

  function handleConfirm() {
    // Reset Redux draft state to the original CMS snapshot
    dispatch(resetDraft());
    // Clear the persisted localStorage entry so the next reload also sees
    // a clean draft (the middleware will re-save the reset draft, but we
    // explicitly remove it here to guarantee a fresh start).
    if (draft) {
      clearPersistedDraft(draft.pageId);
    }
    dispatch(closeDiscardDialog());
  }

  function handleCancel() {
    dispatch(closeDiscardDialog());
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Panel */}
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby="discard-desc"
        >
          <Dialog.Title className="text-base font-semibold text-gray-900">
            Discard changes?
          </Dialog.Title>

          <p id="discard-desc" className="mt-2 text-sm text-gray-600">
            All unsaved edits will be lost and the page will revert to the last
            published version. This cannot be undone.
          </p>

          <div className="mt-5 flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={handleCancel}>
              Keep editing
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirm}>
              Discard changes
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
