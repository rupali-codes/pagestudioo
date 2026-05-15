/**
 * Store barrel export.
 *
 * Components and hooks import from '@store' rather than deep paths.
 * Slice internals are not re-exported — only the public surface.
 */

// ─── Core ─────────────────────────────────────────────────────────────────────
export { store } from './store';
export type { RootState, AppDispatch } from './store';
export { useAppDispatch, useAppSelector } from './hooks';
export * from './selectors';

// ─── Persistence helpers ──────────────────────────────────────────────────────
export {
  loadPersistedDraft,
  clearPersistedDraft,
  draftStorageKey,
} from './persistMiddleware';

// ─── pageSlice (CMS snapshot — read-only reference) ──────────────────────────
export {
  setPage,
  updateSectionProps,
  reorderSections,
  setSaving,
  setError as setPageError,
  clearDirty,
} from './slices/pageSlice';

// ─── draftPageSlice (mutable editor working copy) ────────────────────────────
export {
  loadDraft,
  hydrateDraft,
  updateSectionProps as updateDraftSectionProps,
  moveSectionUp,
  moveSectionDown,
  reorderSections as reorderDraftSections,
  addSection,
  removeSection,
  updatePageTitle,
  setSaving as setDraftSaving,
  setError as setDraftError,
  markClean,
  resetDraft,
} from './slices/draftPageSlice';

// ─── uiSlice (transient editor UI state) ─────────────────────────────────────
export {
  selectSection,
  setActivePanel,
  openAddSection,
  closeAddSection,
  openDiscardDialog,
  closeDiscardDialog,
  setDraftRestored,
  clearDraftRestored,
} from './slices/uiSlice';

// ─── publishSlice (in-flight publish operation) ───────────────────────────────
export {
  startPublish,
  publishSuccess,
  publishFailure,
  clearPublishError,
} from './slices/publishSlice';

// ─── authSlice ────────────────────────────────────────────────────────────────
export { setUser, setLoading as setAuthLoading } from './slices/authSlice';

// ─── releaseSlice (immutable release history) ─────────────────────────────────
export {
  addRelease,
  setReleases,
  setPublishing,
  setError as setReleaseError,
} from './slices/releaseSlice';
