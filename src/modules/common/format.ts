/** Display token for absent or empty values */
export const MISSING = '<missing>';

export function missing(value: unknown): string {
  if (value === null || value === undefined) return MISSING;
  return String(value);
}

export function requireForAction(action: string, fieldLabel: string, value: unknown): void {
  if (value === null || value === undefined || value === '') {
    throw new Error(`${action} couldn't be done since ${fieldLabel} is missing`);
  }
}

/** Returns a non-empty string or throws with the standard message pattern. */
export function requireStringForAction(action: string, fieldLabel: string, value: unknown): string {
  requireForAction(action, fieldLabel, value);
  return String(value);
}

export function displayDateTimeEnGB(iso: string | undefined): string {
  if (!iso || Number.isNaN(Date.parse(iso))) return MISSING;
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function displayDateOnlyEnGB(iso: string | undefined): string {
  if (!iso || Number.isNaN(Date.parse(iso))) return MISSING;
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
