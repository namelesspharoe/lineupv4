import { endOfDay, format, parse, parseISO } from 'date-fns';
import { Lesson } from '../types';

type TimestampLike = {
  toDate: () => Date;
};

const DEFAULT_START_TIME = '09:00';

const isTimestampLike = (value: unknown): value is TimestampLike =>
  Boolean(value && typeof (value as TimestampLike).toDate === 'function');

const safeParse = (value: string) => {
  const parsed = parseISO(value);
  return isNaN(parsed.getTime()) ? null : parsed;
};

export function getLessonDate(lesson: Lesson): Date {
  const rawDate: unknown = (lesson as unknown as { date?: unknown }).date;

  if (!rawDate) {
    return new Date(NaN);
  }

  if (rawDate instanceof Date) {
    return rawDate;
  }

  if (isTimestampLike(rawDate)) {
    return rawDate.toDate();
  }

  if (typeof rawDate === 'string') {
    if (rawDate.includes('T')) {
      const parsed = safeParse(rawDate);
      if (parsed) return parsed;
    } else {
      const parsed = safeParse(`${rawDate}T${lesson.startTime || DEFAULT_START_TIME}`);
      if (parsed) return parsed;
    }
  }

  if (typeof rawDate === 'number') {
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const fallback = new Date(rawDate as any);
  if (!isNaN(fallback.getTime())) {
    return fallback;
  }

  return new Date(NaN);
}

export function getLessonDayKey(lesson: Lesson): string {
  const date = getLessonDate(lesson);
  if (isNaN(date.getTime())) {
    return '';
  }
  return format(date, 'yyyy-MM-dd');
}

const TIME_HH_MM = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

function getSessionBucket(lesson: Lesson): 'morning' | 'afternoon' | 'full_day' | null {
  const s = lesson.sessionType;
  if (s === 'morning' || s === 'afternoon' || s === 'full_day') return s;
  const legacy = (lesson as { time?: string }).time;
  if (legacy === 'morning' || legacy === 'afternoon' || legacy === 'full_day') return legacy;
  return null;
}

/** End instant for the lesson day (local), for "still upcoming today" when endTime is missing. */
export function getLessonEndDate(lesson: Lesson): Date {
  const dayKey = getLessonDayKey(lesson);
  if (!dayKey) return new Date(NaN);

  if (lesson.endTime && TIME_HH_MM.test(lesson.endTime)) {
    const parsed = safeParse(`${dayKey}T${lesson.endTime}`);
    if (parsed) return parsed;
  }

  const bucket = getSessionBucket(lesson);
  const endByBucket: Record<string, string> = {
    morning: '12:00',
    afternoon: '17:00',
    full_day: '17:00'
  };
  if (bucket && endByBucket[bucket]) {
    const parsed = safeParse(`${dayKey}T${endByBucket[bucket]}`);
    if (parsed) return parsed;
  }

  const start = getLessonDate(lesson);
  if (lesson.startTime && TIME_HH_MM.test(lesson.startTime) && !isNaN(start.getTime())) {
    return new Date(start.getTime() + 3 * 60 * 60 * 1000);
  }

  const dayStart = parse(dayKey, 'yyyy-MM-dd', new Date());
  if (isNaN(dayStart.getTime())) return new Date(NaN);
  return endOfDay(dayStart);
}

/**
 * Lesson still counts as upcoming until its inferred end time passes.
 * Excludes completed/cancelled. Handles date-only strings and legacy `time` instead of `sessionType`.
 */
export function isLessonUpcoming(lesson: Lesson, now = new Date()): boolean {
  if (lesson.status === 'cancelled' || lesson.status === 'completed') return false;

  const end = getLessonEndDate(lesson);
  if (!isNaN(end.getTime())) {
    return end.getTime() >= now.getTime();
  }

  const start = getLessonDate(lesson);
  if (!isNaN(start.getTime())) {
    return start.getTime() >= now.getTime();
  }

  return lesson.status === 'scheduled' || lesson.status === 'in_progress';
}

/** Matches `getInstructorActiveLessons`: in-progress (any day) or today's row with a live status. */
const INSTRUCTOR_ACTIVE_TODAY_STATUSES = new Set<string>([
  'available',
  'scheduled',
  'in_progress',
  'booked'
]);

export function isLessonOnInstructorActivePanel(lesson: Lesson, now = new Date()): boolean {
  if (lesson.status === 'in_progress') return true;

  const todayKey = format(now, 'yyyy-MM-dd');
  const dayKey = getLessonDayKey(lesson);
  if (!dayKey || dayKey !== todayKey) return false;

  return INSTRUCTOR_ACTIVE_TODAY_STATUSES.has(lesson.status);
}




