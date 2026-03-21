import type { TimeEntry, User } from '../types';
import { isNonLessonTimeEntryId } from '../constants/timeEntry';

export type TimeEntryPayCategory = 'teaching' | 'non_lesson';

export function resolvePayCategory(lessonId: string | undefined): TimeEntryPayCategory {
  return isNonLessonTimeEntryId(lessonId) ? 'non_lesson' : 'teaching';
}

/**
 * Lesson-linked time uses teach rate; resort / non-lesson time uses base rate.
 * Falls back to legacy `hourlyRate` / `price` when `instructorPay` is absent or incomplete.
 */
export function resolveHourlyRateForEntry(lessonId: string | undefined, instructor: User | undefined): number {
  const legacy = instructor?.hourlyRate ?? instructor?.price ?? 50;
  const pay = instructor?.instructorPay;
  if (!pay || (pay.baseRatePerHour == null && pay.teachRatePerHour == null)) {
    return legacy;
  }
  const base = pay.baseRatePerHour ?? legacy;
  const teach = pay.teachRatePerHour ?? legacy;
  return resolvePayCategory(lessonId) === 'teaching' ? teach : base;
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Billable hours for a completed entry: wall time minus recorded break minutes (same rule as clock-out). */
export function computeBillableHours(
  clockInIso: string,
  clockOutIso: string | undefined,
  breaks: TimeEntry['breaks'] | undefined
): number {
  if (!clockOutIso) return 0;
  const totalWorkTimeMs = new Date(clockOutIso).getTime() - new Date(clockInIso).getTime();
  const totalBreakTimeMs =
    breaks?.reduce((total, breakPeriod) => {
      if (breakPeriod.duration) {
        return total + breakPeriod.duration * 60 * 1000;
      }
      return total;
    }, 0) || 0;
  const actualWorkTimeMs = Math.max(0, totalWorkTimeMs - totalBreakTimeMs);
  return actualWorkTimeMs / (1000 * 60 * 60);
}

export function computeEarningsFromHours(hours: number, ratePerHour: number): number {
  return roundMoney(hours * ratePerHour);
}

export function payCategoryLabel(category: TimeEntryPayCategory | undefined): string {
  if (category === 'teaching') return 'Lesson (teaching)';
  if (category === 'non_lesson') return 'Resort / non-lesson';
  return '—';
}
