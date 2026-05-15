import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PageRelease } from '@/types/page';

interface ReleaseState {
  releases: PageRelease[];
  isPublishing: boolean;
  error: string | null;
}

const initialState: ReleaseState = {
  releases: [],
  isPublishing: false,
  error: null,
};

const releaseSlice = createSlice({
  name: 'release',
  initialState,
  reducers: {
    addRelease(state, action: PayloadAction<PageRelease>) {
      // Immutable append — releases are never mutated after creation
      state.releases.push(action.payload);
    },

    setReleases(state, action: PayloadAction<PageRelease[]>) {
      state.releases = action.payload;
    },

    setPublishing(state, action: PayloadAction<boolean>) {
      state.isPublishing = action.payload;
    },

    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { addRelease, setReleases, setPublishing, setError } =
  releaseSlice.actions;
export default releaseSlice.reducer;
