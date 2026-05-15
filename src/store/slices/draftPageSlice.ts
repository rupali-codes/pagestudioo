/**
 * draftPageSlice — owns the mutable working copy of a page in the editor.
 *
 * Separation from the existing `pageSlice`:
 *   - `pageSlice` holds the last-fetched CMS snapshot (read-only reference).
 *   - `draftPageSlice` holds the editor's working copy that the user mutates.
 *
 * This separation means:
 *   1. We can always diff draft vs. original to detect changes.
 *   2. Discarding a draft is a single `resetDraft` dispatch — no re-fetch.
 *   3. The preview renderer reads from `draft.present` so it always reflects
 *      the latest edits without any extra wiring.
 *
 * Persistence: the middleware in `persistMiddleware.ts` writes
 * `draft.present` to localStorage on every action so drafts survive reloads.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Page, Section, SectionType } from '@/types/page';

// ─── State ────────────────────────────────────────────────────────────────────

export interface DraftPageState {
  /** The page being edited. Null until loaded from CMS or localStorage. */
  present: Page | null;
  /**
   * The original CMS snapshot this draft was created from.
   * Used to detect whether the draft has diverged from the published version.
   */
  original: Page | null;
  /** True when the draft differs from `original`. */
  isDirty: boolean;
  /** True while the draft is being persisted to the server. */
  isSaving: boolean;
  /** Last error from a save/publish operation. */
  error: string | null;
}

const initialState: DraftPageState = {
  present: null,
  original: null,
  isDirty: false,
  isSaving: false,
  error: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const draftPageSlice = createSlice({
  name: 'draftPage',
  initialState,
  reducers: {
    /**
     * Load a page from the CMS into the draft.
     * If a persisted draft for this pageId exists in localStorage, the
     * persistence middleware will hydrate it before this action runs —
     * so this action only fires when there is no saved draft.
     */
    loadDraft(state, action: PayloadAction<Page>) {
      state.present = action.payload;
      state.original = action.payload;
      state.isDirty = false;
      state.error = null;
    },

    /**
     * Hydrate the draft from a persisted localStorage snapshot.
     * Called by the persistence middleware on mount.
     *
     * Only sets isDirty when the persisted content actually differs from the
     * original CMS snapshot. A "saved" or "discarded" draft that matches the
     * original should not appear as dirty.
     */
    hydrateDraft(state, action: PayloadAction<Page>) {
      state.present = action.payload;
      if (state.original) {
        state.isDirty =
          JSON.stringify(state.present) !== JSON.stringify(state.original);
      } else {
        state.isDirty = true;
      }
    },

    // ── Section prop editing ────────────────────────────────────────────────

    /**
     * Merge partial props into a section.
     * Immer handles immutability — we write as if mutating directly.
     */
    updateSectionProps(
      state,
      action: PayloadAction<{
        sectionId: string;
        props: Record<string, unknown>;
      }>,
    ) {
      if (!state.present) return;
      const section = state.present.sections.find(
        (s) => s.id === action.payload.sectionId,
      );
      if (!section) return;
      // Merge — callers send only the changed keys
      section.props = { ...section.props, ...action.payload.props };
      state.isDirty = true;
    },

    // ── Section ordering ────────────────────────────────────────────────────

    /**
     * Move a section one position up in the list.
     * No-op if the section is already first.
     */
    moveSectionUp(state, action: PayloadAction<string>) {
      if (!state.present) return;
      const idx = state.present.sections.findIndex(
        (s) => s.id === action.payload,
      );
      if (idx <= 0) return;
      const sections = state.present.sections;
      // Swap with previous — Immer makes this safe
      [sections[idx - 1], sections[idx]] = [sections[idx]!, sections[idx - 1]!];
      state.isDirty = true;
    },

    /**
     * Move a section one position down in the list.
     * No-op if the section is already last.
     */
    moveSectionDown(state, action: PayloadAction<string>) {
      if (!state.present) return;
      const sections = state.present.sections;
      const idx = sections.findIndex((s) => s.id === action.payload);
      if (idx === -1 || idx >= sections.length - 1) return;
      [sections[idx], sections[idx + 1]] = [sections[idx + 1]!, sections[idx]!];
      state.isDirty = true;
    },

    /**
     * Reorder sections by providing the full desired ID order.
     * Used when drag-and-drop is implemented later.
     */
    reorderSections(state, action: PayloadAction<string[]>) {
      if (!state.present) return;
      const order = action.payload;
      state.present.sections = order
        .map((id) => state.present!.sections.find((s) => s.id === id))
        .filter((s): s is Section => s !== undefined);
      state.isDirty = true;
    },

    // ── Section add / remove ────────────────────────────────────────────────

    /**
     * Append a new section with default props at the end of the list.
     * The caller provides the full section so this slice stays pure.
     */
    addSection(state, action: PayloadAction<Section>) {
      if (!state.present) return;
      state.present.sections.push(action.payload);
      state.isDirty = true;
    },

    /**
     * Remove a section by ID.
     */
    removeSection(state, action: PayloadAction<string>) {
      if (!state.present) return;
      state.present.sections = state.present.sections.filter(
        (s) => s.id !== action.payload,
      );
      state.isDirty = true;
    },

    // ── Page-level fields ───────────────────────────────────────────────────

    updatePageTitle(state, action: PayloadAction<string>) {
      if (!state.present) return;
      state.present.title = action.payload;
      state.isDirty = true;
    },

    // ── Lifecycle ───────────────────────────────────────────────────────────

    setSaving(state, action: PayloadAction<boolean>) {
      state.isSaving = action.payload;
    },

    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },

    /** Mark the draft as clean (called after a successful save/publish). */
    markClean(state) {
      state.isDirty = false;
    },

    /** Discard all edits and revert to the original CMS snapshot. */
    resetDraft(state) {
      state.present = state.original;
      state.isDirty = false;
      state.error = null;
    },
  },
});

export const {
  loadDraft,
  hydrateDraft,
  updateSectionProps,
  moveSectionUp,
  moveSectionDown,
  reorderSections,
  addSection,
  removeSection,
  updatePageTitle,
  setSaving,
  setError,
  markClean,
  resetDraft,
} = draftPageSlice.actions;

// Expose the section type for use in default-props factories
export type { SectionType };

export default draftPageSlice.reducer;
