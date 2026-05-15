import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Page } from '@/types/page';

interface PageState {
  current: Page | null;
  isDirty: boolean;
  isSaving: boolean;
  error: string | null;
}

const initialState: PageState = {
  current: null,
  isDirty: false,
  isSaving: false,
  error: null,
};

const pageSlice = createSlice({
  name: 'page',
  initialState,
  reducers: {
    setPage(state, action: PayloadAction<Page>) {
      state.current = action.payload;
      state.isDirty = false;
      state.error = null;
    },

    updateSectionProps(
      state,
      action: PayloadAction<{ sectionId: string; props: Record<string, unknown> }>,
    ) {
      if (!state.current) return;
      const section = state.current.sections.find(
        (s) => s.id === action.payload.sectionId,
      );
      if (section) {
        section.props = { ...section.props, ...action.payload.props };
        state.isDirty = true;
      }
    },

    reorderSections(state, action: PayloadAction<string[]>) {
      if (!state.current) return;
      const order = action.payload;
      state.current.sections = order
        .map((id) => state.current!.sections.find((s) => s.id === id))
        .filter((s): s is NonNullable<typeof s> => s !== undefined);
      state.isDirty = true;
    },

    setSaving(state, action: PayloadAction<boolean>) {
      state.isSaving = action.payload;
    },

    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },

    clearDirty(state) {
      state.isDirty = false;
    },
  },
});

export const {
  setPage,
  updateSectionProps,
  reorderSections,
  setSaving,
  setError,
  clearDirty,
} = pageSlice.actions;

export default pageSlice.reducer;
