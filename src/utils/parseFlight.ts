/**
 * Parse Remix/React Router flight data format.
 * The response is a serialized array where objects use _N keys to reference data[index].
 */
export function parseFlight<T = unknown>(data: unknown): T[] {
  if (!Array.isArray(data)) return [];
  const arr: unknown[] = data;

  function resolve(index: number | null | undefined): unknown {
    if (index == null || index < 0) return null;

    const value = arr[index];

    // primitive
    if (typeof value !== 'object' || value === null) {
      return value;
    }

    // array
    if (Array.isArray(value)) {
      // Date format ["D", timestamp]
      if (value[0] === 'D') {
        return new Date(value[1] as number);
      }
      return value.map((v) => (typeof v === 'number' ? resolve(v) : v));
    }

    // object - keys like _0, _1 reference data[index] for key names
    const result: Record<string, unknown> = {};
    for (const rawKey in value) {
      const keyIndex = Number((rawKey as string).slice(1));
      if (Number.isNaN(keyIndex)) continue;
      const actualKey = arr[keyIndex];
      const valueIndex = (value as Record<string, unknown>)[rawKey];
      result[String(actualKey)] = typeof valueIndex === 'number' ? resolve(valueIndex) : valueIndex;
    }
    return result;
  }

  return arr.map((_, i) => resolve(i) as T);
}
