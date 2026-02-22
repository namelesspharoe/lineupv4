import { format, parseISO } from 'date-fns';
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






