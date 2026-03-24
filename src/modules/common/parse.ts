/** Milliseconds from an ISO date string, or 0 if missing or invalid. */
export function parseTimeMsOrZero(iso: string | undefined): number {
  if (!iso || Number.isNaN(Date.parse(iso))) return 0;
  return new Date(iso).getTime();
}

/** 1-based CLI index from an argument string. Null if missing or not a positive integer. */
export function parseOneBasedIndex(raw: string | undefined): number | null {
  if (raw == null || raw === '') return null;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) return null;
  return n;
}
