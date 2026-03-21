import { format } from 'date-fns';

type TimestampLike = { toDate: () => Date };

function isTimestampLike(value: unknown): value is TimestampLike {
  return Boolean(value && typeof (value as TimestampLike).toDate === 'function');
}

function isSecondsTimestamp(value: unknown): value is { seconds: number; nanoseconds?: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    typeof (value as { seconds: unknown }).seconds === 'number'
  );
}

/** Normalize Firestore Timestamp, plain `{ seconds, nanoseconds }`, ISO string, or Date. */
export function coerceFirestoreDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (isTimestampLike(value)) {
    try {
      const d = value.toDate();
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    } catch {
      return null;
    }
  }
  if (isSecondsTimestamp(value)) {
    const ms = value.seconds * 1000 + Math.floor((Number(value.nanoseconds) || 0) / 1e6);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function formatFirestoreDate(value: unknown, pattern: string, empty = '—'): string {
  const d = coerceFirestoreDate(value);
  if (!d) return empty;
  try {
    return format(d, pattern);
  } catch {
    return empty;
  }
}
