import { format, parseISO, subDays } from 'date-fns';
import type { Lesson, TimeEntry } from '../../../../types';
import { getLessonDayKey } from '../../../../utils/lessonDate';

export interface OverviewDayBucket {
  dayKey: string;
  lessons: Lesson[];
  timeEntries: TimeEntry[];
}

/**
 * Groups lessons by lesson date and time entries by clock-in calendar day.
 * Returns days sorted newest-first, limited to the last `maxDays` calendar days.
 */
export function groupOverviewByDay(
  lessons: Lesson[],
  timeEntries: TimeEntry[],
  options?: { maxDays?: number }
): OverviewDayBucket[] {
  const maxDays = options?.maxDays ?? 30;
  const cutoff = format(subDays(new Date(), maxDays), 'yyyy-MM-dd');

  const lessonsByDay = new Map<string, Lesson[]>();
  for (const lesson of lessons) {
    const key = getLessonDayKey(lesson);
    if (!key || key < cutoff) continue;
    const list = lessonsByDay.get(key) ?? [];
    list.push(lesson);
    lessonsByDay.set(key, list);
  }

  const entriesByDay = new Map<string, TimeEntry[]>();
  for (const entry of timeEntries) {
    if (!entry.clockIn) continue;
    let key: string;
    try {
      key = format(parseISO(entry.clockIn), 'yyyy-MM-dd');
    } catch {
      continue;
    }
    if (key < cutoff) continue;
    const list = entriesByDay.get(key) ?? [];
    list.push(entry);
    entriesByDay.set(key, list);
  }

  const allKeys = new Set<string>([...lessonsByDay.keys(), ...entriesByDay.keys()]);
  const sortedKeys = [...allKeys].sort((a, b) => b.localeCompare(a));

  return sortedKeys.map((dayKey) => ({
    dayKey,
    lessons: lessonsByDay.get(dayKey) ?? [],
    timeEntries: entriesByDay.get(dayKey) ?? []
  }));
}
