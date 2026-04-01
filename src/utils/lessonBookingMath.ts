/** Mirrors `functions/src/pricing.ts` for client-side booking. */

export function lessonHours(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

export function getSessionType(
  startTime: string,
  endTime: string
): 'morning' | 'afternoon' | 'full_day' {
  if (startTime === '09:00' && endTime === '12:00') return 'morning';
  if (startTime === '13:00' && endTime === '16:00') return 'afternoon';
  if (startTime === '09:00' && endTime === '17:00') return 'full_day';
  return 'morning';
}

export function timeRangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  const newStart = new Date(`2000-01-01T${aStart}`);
  const newEnd = new Date(`2000-01-01T${aEnd}`);
  const lessonStart = new Date(`2000-01-01T${bStart}`);
  const lessonEnd = new Date(`2000-01-01T${bEnd}`);
  return (
    (newStart >= lessonStart && newStart < lessonEnd) ||
    (newEnd > lessonStart && newEnd <= lessonEnd) ||
    (newStart <= lessonStart && newEnd >= lessonEnd)
  );
}
