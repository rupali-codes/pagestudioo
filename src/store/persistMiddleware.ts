/**
 * Draft persistence middleware.
 *
 * Writes `draftPage.present` to localStorage after every action that
 * modifies the draft. Reads it back on store creation to hydrate the draft.
 *
 * Why middleware instead of redux-persist?
 *   - redux-persist adds ~15 kB and requires a PersistGate wrapper.
 *   - We only need to persist one slice (`draftPage.present`), not the whole
 *     store. A custom middleware is 30 lines and does exactly what we need.
 *
 * Storage key format: `page-studio:draft:<pageId>`
 * This means each page has its own draft slot — editing page A doesn't
 * overwrite the draft for page B.
 *
 * Failure handling: localStorage writes are wrapped in try/catch. If storage
 * is full or unavailable (private browsing, quota exceeded), the editor
 * continues working — the draft just won't survive a reload.
 */

import type { Middleware } from '@reduxjs/toolkit';
import type { Page } from '@/types/page';

// Minimal slice of RootState needed by this middleware.
// Using a local interface instead of importing RootState from store.ts
// breaks the circular dependency:
//   store.ts → persistMiddleware.ts → RootState → store.ts (cycle)
interface StateWithDraft {
  draftPage: { present: Page | null };
}

// ─── Storage key ──────────────────────────────────────────────────────────────

export function draftStorageKey(pageId: string): string {
  return `page-studio:draft:${pageId}`;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Load a persisted draft from localStorage.
 * Returns null if nothing is stored or the stored value is invalid JSON.
 */
export function loadPersistedDraft(pageId: string): Page | null {
  if (typeof window === 'undefined') return null; // SSR guard
  try {
    const raw = localStorage.getItem(draftStorageKey(pageId));
    if (!raw) return null;
    return JSON.parse(raw) as Page;
  } catch {
    return null;
  }
}

// ─── Write ────────────────────────────────────────────────────────────────────

function saveDraft(page: Page): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(draftStorageKey(page.pageId), JSON.stringify(page));
  } catch {
    // Quota exceeded or storage unavailable — fail silently
  }
}

// ─── Clear ────────────────────────────────────────────────────────────────────

export function clearPersistedDraft(pageId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(draftStorageKey(pageId));
  } catch {
    // ignore
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * After every action, check if `draftPage.present` changed and persist it.
 *
 * We compare references rather than deep-equal to keep this O(1).
 * Immer always produces a new reference when state changes, so reference
 * equality is a reliable change detector here.
 *
 * IMPORTANT: We skip persistence on `loadDraft` because that action sets
 * `present` to the CMS baseline, which would overwrite any previously saved
 * draft in localStorage. The persistence layer is for user-generated edits,
 * not for CMS data that can always be re-fetched.
 */
const LOAD_DRAFT_TYPE = 'draftPage/loadDraft';

export const persistDraftMiddleware: Middleware =
  (store) => (next) => (action) => {
    const prevDraft = (store.getState() as StateWithDraft).draftPage.present;
    const result = next(action);
    const nextDraft = (store.getState() as StateWithDraft).draftPage.present;

    if (
      nextDraft !== prevDraft &&
      nextDraft !== null &&
      (action as { type?: string }).type !== LOAD_DRAFT_TYPE
    ) {
      saveDraft(nextDraft);
    }

    return result;
  };
