import type { RootState } from './store';
import type { Section } from '@/types/page';
import { compareVersions } from '@/lib/semver';

// ─── Page (CMS snapshot) ──────────────────────────────────────────────────────
export const selectCurrentPage = (state: RootState) => state.page.current;
export const selectPageSections = (state: RootState) =>
  state.page.current?.sections ?? [];
export const selectIsDirty = (state: RootState) => state.page.isDirty;
export const selectIsSaving = (state: RootState) => state.page.isSaving;
export const selectPageError = (state: RootState) => state.page.error;

// ─── Draft page ───────────────────────────────────────────────────────────────
export const selectDraft = (state: RootState) => state.draftPage.present;
export const selectDraftOriginal = (state: RootState) =>
  state.draftPage.original;
export const selectDraftSections = (state: RootState): Section[] =>
  state.draftPage.present?.sections ?? [];
export const selectDraftIsDirty = (state: RootState) =>
  state.draftPage.isDirty;
export const selectDraftIsSaving = (state: RootState) =>
  state.draftPage.isSaving;
export const selectDraftError = (state: RootState) => state.draftPage.error;

/** Find a single section in the draft by ID */
export const selectDraftSectionById =
  (sectionId: string) =>
  (state: RootState): Section | null =>
    state.draftPage.present?.sections.find(
      (s: Section) => s.id === sectionId,
    ) ?? null;

// ─── UI ───────────────────────────────────────────────────────────────────────
export const selectSelectedSectionId = (state: RootState) =>
  state.ui.selectedSectionId;
export const selectActivePanel = (state: RootState) => state.ui.activePanel;
export const selectIsAddSectionOpen = (state: RootState) =>
  state.ui.isAddSectionOpen;
export const selectIsDiscardDialogOpen = (state: RootState) =>
  state.ui.isDiscardDialogOpen;

/** The currently selected section object (from the draft) */
export const selectSelectedSection = (state: RootState): Section | null => {
  const id = state.ui.selectedSectionId;
  if (!id) return null;
  return (
    state.draftPage.present?.sections.find((s: Section) => s.id === id) ?? null
  );
};

// ─── Publish ──────────────────────────────────────────────────────────────────
export const selectIsPublishing = (state: RootState) =>
  state.publish.isPublishing;
export const selectPublishError = (state: RootState) => state.publish.error;
export const selectLastPublishedRelease = (state: RootState) =>
  state.publish.lastPublishedRelease;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const selectUser = (state: RootState) => state.auth.user;
export const selectUserRole = (state: RootState) => state.auth.user?.role;
export const selectIsAuthLoading = (state: RootState) => state.auth.isLoading;

// ─── Releases (history) ───────────────────────────────────────────────────────
export const selectReleases = (state: RootState) => state.release.releases;
export const selectReleaseError = (state: RootState) => state.release.error;

export const selectLatestRelease = (state: RootState) => {
  const releases = state.release.releases;
  if (releases.length === 0) return null;
  return [...releases].sort((a, b) =>
    compareVersions(b.version, a.version),
  )[0];
};
