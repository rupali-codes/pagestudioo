/**
 * publishSlice — state for the publish flow.
 *
 * Separated from draftPageSlice because publishing is a distinct async
 * operation with its own loading/error state, and from releaseSlice because
 * releaseSlice owns the immutable release history while this slice owns the
 * in-flight publish operation.
 *
 * Flow:
 *   1. User clicks "Publish" → dispatch `startPublish`
 *   2. `usePublishDraft` hook calls POST /api/publish
 *   3. On success → dispatch `publishSuccess` (stores the new release)
 *   4. On failure → dispatch `publishFailure`
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PageRelease } from '@/types/page';

export interface PublishState {
  isPublishing: boolean;
  lastPublishedRelease: PageRelease | null;
  error: string | null;
}

const initialState: PublishState = {
  isPublishing: false,
  lastPublishedRelease: null,
  error: null,
};

const publishSlice = createSlice({
  name: 'publish',
  initialState,
  reducers: {
    startPublish(state) {
      state.isPublishing = true;
      state.error = null;
    },

    publishSuccess(state, action: PayloadAction<PageRelease>) {
      state.isPublishing = false;
      state.lastPublishedRelease = action.payload;
      state.error = null;
    },

    publishFailure(state, action: PayloadAction<string>) {
      state.isPublishing = false;
      state.error = action.payload;
    },

    clearPublishError(state) {
      state.error = null;
    },
  },
});

export const {
  startPublish,
  publishSuccess,
  publishFailure,
  clearPublishError,
} = publishSlice.actions;

export default publishSlice.reducer;
