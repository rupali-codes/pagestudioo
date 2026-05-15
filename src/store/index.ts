/**
 * Store barrel export.
 *
 * Components and hooks import from '@store' rather than deep paths.
 * The store internals (slice files) are not re-exported here — only the
 * public surface that the rest of the app needs.
 */
export { store } from './store';
export type { RootState, AppDispatch } from './store';
export { useAppDispatch, useAppSelector } from './hooks';
export * from './selectors';

// Slice actions — grouped by slice for clarity at the call site
export {
  setPage,
  updateSectionProps,
  reorderSections,
  setSaving,
  setError as setPageError,
  clearDirty,
} from './slices/pageSlice';

export { setUser, setLoading as setAuthLoading } from './slices/authSlice';

export {
  addRelease,
  setReleases,
  setPublishing,
  setError as setReleaseError,
} from './slices/releaseSlice';
