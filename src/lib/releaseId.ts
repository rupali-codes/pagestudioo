/**
 * Generate a deterministic release ID from pageId + version.
 * Format: `{pageId}@{version}` — stable, human-readable, URL-safe.
 */
export function buildReleaseId(pageId: string, version: string): string {
  return `${pageId}@${version}`;
}
