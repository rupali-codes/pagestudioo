/**
 * Versioning system barrel export.
 *
 * Import from '@/lib/versioning' for all versioning utilities.
 * Each module is independently importable for tree-shaking.
 *
 * Runtime notes:
 *   - contentHash, snapshotStore, publishService → Node.js only (use crypto/fs)
 *   - diffEngine, semverCalculator, changelogGenerator, snapshotGenerator → universal
 */

// ── Pure / universal ──────────────────────────────────────────────────────────
export { diffPages } from './diffEngine';
export { canonicalPageJson, hashPageContent } from './contentHash';
export {
  changeSeverity,
  highestSeverity,
  calculateNextVersion,
  ensureVersionIncrement,
} from './semverCalculator';
export type { VersionCalculationResult } from './semverCalculator';
export { generateChangelog, formatChangelog } from './changelogGenerator';
export { buildSnapshot, verifySnapshot } from './snapshotGenerator';
export type { SnapshotInput } from './snapshotGenerator';

// ── Node.js runtime only ──────────────────────────────────────────────────────
export {
  loadSnapshot,
  loadLatestSnapshot,
  loadIndex,
  saveSnapshot,
  snapshotPath,
  indexPath,
} from './snapshotStore';
export { publishPage } from './publishService';
export type { PublishInput, PublishResult, PublishStatus } from './publishService';
