/**
 * Array utilities.
 * Pure functions — no side effects, no imports from the app.
 */

/** Move an item from one index to another (immutable). */
export function reorder<T>(list: T[], from: number, to: number): T[] {
  const result = [...list];
  const [removed] = result.splice(from, 1);
  if (removed !== undefined) result.splice(to, 0, removed);
  return result;
}

/** Group an array of objects by a key. */
export function groupBy<T, K extends PropertyKey>(
  items: T[],
  key: (item: T) => K,
): Partial<Record<K, T[]>> {
  return items.reduce<Partial<Record<K, T[]>>>((acc, item) => {
    const k = key(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {});
}

/** Return unique items by a key selector. */
export function uniqueBy<T, K>(items: T[], key: (item: T) => K): T[] {
  const seen = new Set<K>();
  return items.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
