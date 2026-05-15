import { configureStore, type Middleware } from '@reduxjs/toolkit';
import pageReducer from './slices/pageSlice';
import authReducer from './slices/authSlice';
import releaseReducer from './slices/releaseSlice';
import draftPageReducer from './slices/draftPageSlice';
import uiReducer from './slices/uiSlice';
import publishReducer from './slices/publishSlice';
import { persistDraftMiddleware } from './persistMiddleware';

// Declare the reducer map explicitly so RootState can be derived without
// a circular reference through the store instance.
const rootReducer = {
  page: pageReducer,
  auth: authReducer,
  release: releaseReducer,
  draftPage: draftPageReducer,
  ui: uiReducer,
  publish: publishReducer,
};

// RootState is derived from the reducer map, not from store.getState(),
// which breaks the circular dependency:
//   store → persistMiddleware → RootState → store (cycle)
export type RootState = {
  [K in keyof typeof rootReducer]: ReturnType<(typeof rootReducer)[K]>;
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(persistDraftMiddleware as Middleware),
});

export type AppDispatch = typeof store.dispatch;
