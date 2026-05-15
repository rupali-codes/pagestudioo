import { configureStore } from '@reduxjs/toolkit';
import pageReducer from './slices/pageSlice';
import authReducer from './slices/authSlice';
import releaseReducer from './slices/releaseSlice';
import draftPageReducer from './slices/draftPageSlice';
import uiReducer from './slices/uiSlice';
import publishReducer from './slices/publishSlice';
import { persistDraftMiddleware } from './persistMiddleware';

export const store = configureStore({
  reducer: {
    // ── Existing slices (kept for backward compatibility) ──────────────────
    page: pageReducer,
    auth: authReducer,
    release: releaseReducer,

    // ── New editor slices ──────────────────────────────────────────────────
    /** Mutable working copy of the page being edited */
    draftPage: draftPageReducer,
    /** Transient UI state — panel selection, dialogs */
    ui: uiReducer,
    /** In-flight publish operation state */
    publish: publishReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(persistDraftMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
