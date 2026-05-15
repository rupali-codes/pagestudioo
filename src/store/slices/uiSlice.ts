/**
 * uiSlice — transient UI state for the studio editor.
 *
 * Kept separate from draftPageSlice because:
 *   - UI state (which panel is open, which section is selected) is ephemeral
 *     and should NOT be persisted to localStorage.
 *   - Mixing UI state into the draft slice would cause unnecessary persistence
 *     writes on every panel open/close.
 *
 * Nothing in this slice affects the page content — it only controls what
 * the editor UI shows.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type EditorPanel = 'sections' | 'add-section' | 'releases';

export interface UiState {
  /** ID of the section currently open in the editor panel. Null = none. */
  selectedSectionId: string | null;
  /** Which sidebar panel is active. */
  activePanel: EditorPanel;
  /** Whether the "add section" drawer is open. */
  isAddSectionOpen: boolean;
  /** Whether the discard-changes confirmation dialog is open. */
  isDiscardDialogOpen: boolean;
}

const initialState: UiState = {
  selectedSectionId: null,
  activePanel: 'sections',
  isAddSectionOpen: false,
  isDiscardDialogOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    selectSection(state, action: PayloadAction<string | null>) {
      state.selectedSectionId = action.payload;
    },

    setActivePanel(state, action: PayloadAction<EditorPanel>) {
      state.activePanel = action.payload;
    },

    openAddSection(state) {
      state.isAddSectionOpen = true;
    },

    closeAddSection(state) {
      state.isAddSectionOpen = false;
    },

    openDiscardDialog(state) {
      state.isDiscardDialogOpen = true;
    },

    closeDiscardDialog(state) {
      state.isDiscardDialogOpen = false;
    },
  },
});

export const {
  selectSection,
  setActivePanel,
  openAddSection,
  closeAddSection,
  openDiscardDialog,
  closeDiscardDialog,
} = uiSlice.actions;

export default uiSlice.reducer;
