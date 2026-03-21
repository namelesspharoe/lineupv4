import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Calendar,
  Clock,
  Eye,
  Filter,
  Mountain as MountainIcon,
  Pencil,
  Search,
  Star,
  Users,
  Timer,
  X
} from 'lucide-react';
import type { Lesson, Mountain, TimeEntry, User } from '../../../../types';
import { isNonLessonTimeEntryId } from '../../../../constants/timeEntry';
import { getLessonDayKey } from '../../../../utils/lessonDate';
import { groupOverviewByDay } from '../utils/groupOverviewByDay';
import { getInstructorName, getStudentNames, formatStatus } from '../utils/adminUtils';

function lessonStatusClass(status: string | undefined): string {
  switch (status) {
    case 'completed':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200';
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200';
    case 'in_progress':
      return 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200';
    case 'available':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
  }
}

function timeEntryStatusClass(status: string | undefined): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200';
    case 'active':
      return 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200';
    case 'disputed':
      return 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
  }
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

type LessonWithDayEntries = { lesson: Lesson; entries: TimeEntry[] };

type InstructorDayBlock = {
  instructorId: string;
  lessons: LessonWithDayEntries[];
  standaloneEntries: TimeEntry[];
};

function formatClockSafe(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'p');
  } catch {
    return '—';
  }
}

/** Groups a single day's lessons and time entries by instructor (sorted by name). */
function buildInstructorBlocks(
  dayLessons: Lesson[],
  dayEntries: TimeEntry[],
  users: User[]
): InstructorDayBlock[] {
  const ids = new Set<string>();
  for (const l of dayLessons) ids.add(l.instructorId ?? '');
  for (const e of dayEntries) ids.add(e.instructorId ?? '');

  const sortedIds = [...ids].sort((a, b) =>
    getInstructorName(a, users).toLowerCase().localeCompare(getInstructorName(b, users).toLowerCase())
  );

  return sortedIds.map((instructorId) => {
    const instLessons = dayLessons
      .filter((l) => (l.instructorId ?? '') === instructorId)
      .sort((a, b) => {
        const ta = a.startTime ?? '';
        const tb = b.startTime ?? '';
        if (ta !== tb) return ta.localeCompare(tb);
        return (a.title ?? '').localeCompare(b.title ?? '');
      });
    const instEntries = dayEntries
      .filter((e) => (e.instructorId ?? '') === instructorId)
      .sort((a, b) => (a.clockIn ?? '').localeCompare(b.clockIn ?? ''));

    const assigned = new Set<string>();
    const lessons: LessonWithDayEntries[] = instLessons.map((lesson) => {
      const entries = instEntries.filter((e) => e.lessonId === lesson.id);
      for (const e of entries) assigned.add(e.id);
      return { lesson, entries };
    });
    const standaloneEntries = instEntries.filter((e) => !assigned.has(e.id));

    return { instructorId, lessons, standaloneEntries };
  });
}

function standaloneTimeEntryCaption(entry: TimeEntry, dayKey: string, lessonById: Map<string, Lesson>): string {
  if (isNonLessonTimeEntryId(entry.lessonId)) {
    return 'Non-lesson (resort) time';
  }
  const linked = entry.lessonId ? lessonById.get(entry.lessonId) : undefined;
  if (!linked) {
    const id = entry.lessonId ?? '';
    return id ? `Lesson not in system (${id.length > 14 ? `${id.slice(0, 10)}…` : id})` : 'Lesson not linked';
  }
  const lessonDay = getLessonDayKey(linked);
  if (lessonDay && lessonDay !== dayKey) {
    return `Lesson on other day: ${linked.title}`;
  }
  return linked.title;
}

function instructorMountainId(instructorId: string, users: User[]): string | undefined {
  return users.find((u) => u.id === instructorId)?.mountainId;
}

function lessonMatchesMountain(lesson: Lesson, mountainId: string | 'all', users: User[]): boolean {
  if (mountainId === 'all') return true;
  return instructorMountainId(lesson.instructorId, users) === mountainId;
}

function entryMatchesMountain(entry: TimeEntry, mountainId: string | 'all', users: User[]): boolean {
  if (mountainId === 'all') return true;
  return instructorMountainId(entry.instructorId, users) === mountainId;
}

function dayKeyInRange(dayKey: string, from: string, to: string): boolean {
  if (from && dayKey < from) return false;
  if (to && dayKey > to) return false;
  return true;
}

function lessonInDateRange(lesson: Lesson, from: string, to: string): boolean {
  const k = getLessonDayKey(lesson);
  if (!k) return false;
  return dayKeyInRange(k, from, to);
}

function entryInDateRange(entry: TimeEntry, from: string, to: string): boolean {
  if (!entry.clockIn) return false;
  try {
    const k = format(parseISO(entry.clockIn), 'yyyy-MM-dd');
    return dayKeyInRange(k, from, to);
  } catch {
    return false;
  }
}

function lessonMatchesSearch(lesson: Lesson, users: User[], q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  if (lesson.title?.toLowerCase().includes(s)) return true;
  if (getInstructorName(lesson.instructorId, users).toLowerCase().includes(s)) return true;
  if (getStudentNames(lesson.studentIds || [], users).toLowerCase().includes(s)) return true;
  return false;
}

function entryMatchesSearch(
  entry: TimeEntry,
  users: User[],
  lessonById: Map<string, Lesson>,
  q: string
): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  if (entry.notes?.toLowerCase().includes(s)) return true;
  if (entry.id?.toLowerCase().includes(s)) return true;
  if (getInstructorName(entry.instructorId, users).toLowerCase().includes(s)) return true;
  const linked = entry.lessonId ? lessonById.get(entry.lessonId) : undefined;
  if (linked?.title?.toLowerCase().includes(s)) return true;
  return false;
}

function studentReviewSummary(lesson: Lesson): { avg: number; snippet: string | null } | null {
  const reviews = lesson.studentReviews;
  if (!reviews?.length) return null;
  const sum = reviews.reduce((a, r) => a + (Number(r.rating) || 0), 0);
  const avg = sum / reviews.length;
  const withComment = reviews.find((r) => r.comment?.trim());
  const snippet = withComment?.comment ? truncate(withComment.comment, 64) : null;
  return { avg, snippet };
}

interface AdminOverviewDayCardsProps {
  lessons: Lesson[];
  timeEntries: TimeEntry[];
  users: User[];
  mountains: Mountain[];
  onViewLessonDetail: (lesson: Lesson) => void;
  onEditLesson: (lesson: Lesson) => void;
  onEditTimeEntry: (entry: TimeEntry & { instructor?: User }) => void;
}

const OVERVIEW_LOOKBACK_DAYS = 90;

export function AdminOverviewDayCards({
  lessons,
  timeEntries,
  users,
  mountains,
  onViewLessonDetail,
  onEditLesson,
  onEditTimeEntry
}: AdminOverviewDayCardsProps) {
  const [search, setSearch] = useState('');
  const [lessonType, setLessonType] = useState<'all' | Lesson['type']>('all');
  const [mountainId, setMountainId] = useState<string | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const lessonById = useMemo(() => {
    const m = new Map<string, Lesson>();
    for (const l of lessons) m.set(l.id, l);
    return m;
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    let list = lessons;
    if (lessonType !== 'all') {
      list = list.filter((l) => l.type === lessonType);
    }
    list = list.filter((l) => lessonMatchesMountain(l, mountainId, users));
    if (dateFrom || dateTo) {
      list = list.filter((l) => lessonInDateRange(l, dateFrom, dateTo));
    }
    if (search.trim()) {
      list = list.filter((l) => lessonMatchesSearch(l, users, search));
    }
    return list;
  }, [lessons, lessonType, mountainId, users, dateFrom, dateTo, search]);

  const filteredTimeEntries = useMemo(() => {
    let list = timeEntries;
    list = list.filter((e) => entryMatchesMountain(e, mountainId, users));
    if (dateFrom || dateTo) {
      list = list.filter((e) => entryInDateRange(e, dateFrom, dateTo));
    }
    if (search.trim()) {
      list = list.filter((e) => entryMatchesSearch(e, users, lessonById, search));
    }
    return list;
  }, [timeEntries, mountainId, users, dateFrom, dateTo, search, lessonById]);

  const days = useMemo(
    () => groupOverviewByDay(filteredLessons, filteredTimeEntries, { maxDays: OVERVIEW_LOOKBACK_DAYS }),
    [filteredLessons, filteredTimeEntries]
  );

  const hasActiveFilters =
    search.trim() !== '' ||
    lessonType !== 'all' ||
    mountainId !== 'all' ||
    dateFrom !== '' ||
    dateTo !== '';

  const clearFilters = () => {
    setSearch('');
    setLessonType('all');
    setMountainId('all');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Daily activity</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Each day is grouped by instructor (A–Z), with their lessons and time entries nested underneath. Up to four
            days per row on large screens (last {OVERVIEW_LOOKBACK_DAYS} days of loaded data).
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Filter className="h-4 w-4 text-slate-500 shrink-0" aria-hidden />
          <span>Filters</span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto sm:ml-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
            >
              <X className="h-3.5 w-3.5" />
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <div className="md:col-span-2 xl:col-span-1">
            <label htmlFor="admin-overview-search" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                id="admin-overview-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Instructor, lesson, student, notes…"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-overview-lesson-type" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Lesson type
            </label>
            <select
              id="admin-overview-lesson-type"
              value={lessonType}
              onChange={(e) => setLessonType(e.target.value as typeof lessonType)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            >
              <option value="all">All types</option>
              <option value="private">Private</option>
              <option value="group">Group</option>
              <option value="workshop">Workshop</option>
            </select>
          </div>

          <div>
            <label htmlFor="admin-overview-mountain" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              <span className="inline-flex items-center gap-1">
                <MountainIcon className="h-3.5 w-3.5" aria-hidden />
                Mountain (instructor)
              </span>
            </label>
            <select
              id="admin-overview-mountain"
              value={mountainId}
              onChange={(e) => setMountainId(e.target.value as typeof mountainId)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            >
              <option value="all">All mountains</option>
              {mountains
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Uses each instructor&apos;s home mountain on their profile.
            </p>
          </div>

          <div>
            <label htmlFor="admin-overview-date-from" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              From
            </label>
            <input
              id="admin-overview-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="admin-overview-date-to" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              To
            </label>
            <input
              id="admin-overview-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {days.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 p-10 text-center">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            {hasActiveFilters ? 'No matches for filters' : 'No recent activity'}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {hasActiveFilters
              ? 'Try widening the date range, clearing search, or resetting filters.'
              : `No lessons or time entries in the last ${OVERVIEW_LOOKBACK_DAYS} days. Create lessons from the Lessons tab or refresh after instructors log time.`}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
              Clear filters
            </button>
          )}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {days.map(({ dayKey, lessons: dayLessons, timeEntries: dayEntries }) => {
          let label: string;
          try {
            label = format(parseISO(`${dayKey}T12:00:00`), 'EEEE, MMM d, yyyy');
          } catch {
            label = dayKey;
          }
          const completedCount = dayLessons.filter((l) => l.status === 'completed').length;
          const disputedEntries = dayEntries.filter((e) => e.status === 'disputed').length;
          const instructorBlocks = buildInstructorBlocks(dayLessons, dayEntries, users);

          return (
            <article
              key={dayKey}
              className="flex flex-col min-h-0 h-full rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
            >
              <header className="flex flex-col gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/80 shrink-0">
                <div className="flex items-start gap-2 min-w-0">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <h3 className="font-semibold text-slate-900 dark:text-white text-base leading-snug">{label}</h3>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs font-medium">
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5">
                    {dayLessons.length} lesson{dayLessons.length !== 1 ? 's' : ''}
                  </span>
                  {completedCount > 0 && (
                    <span className="rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-800 dark:text-violet-200 px-2 py-0.5">
                      {completedCount} done
                    </span>
                  )}
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5">
                    {dayEntries.length} entr{dayEntries.length !== 1 ? 'ies' : 'y'}
                  </span>
                  {disputedEntries > 0 && (
                    <span className="rounded-full bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-200 px-2 py-0.5">
                      {disputedEntries} disputed
                    </span>
                  )}
                </div>
              </header>

              <div className="p-2.5 flex-1 min-h-0 overflow-y-auto max-h-[min(70vh,520px)] space-y-2.5">
                {instructorBlocks.map((block) => {
                  const instructorUser = users.find((u) => u.id === block.instructorId);
                  const entryTotal =
                    block.standaloneEntries.length +
                    block.lessons.reduce((acc, { entries }) => acc + entries.length, 0);

                  return (
                    <div
                      key={block.instructorId || '_none'}
                      className="rounded-lg border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/30 p-2.5 space-y-2"
                    >
                      <div className="flex items-center gap-2 min-w-0 pb-1.5 border-b border-slate-200/70 dark:border-slate-700/80">
                        <Users className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" />
                        <span className="font-semibold text-sm text-slate-900 dark:text-white truncate min-w-0 flex-1">
                          {getInstructorName(block.instructorId, users)}
                        </span>
                        <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                          {block.lessons.length}L · {entryTotal}E
                        </span>
                      </div>

                      {block.lessons.length > 0 && (
                      <ul className="space-y-2">
                        {block.lessons.map(({ lesson, entries }) => {
                          const review = studentReviewSummary(lesson);
                          const hasInstructorFeedback =
                            Array.isArray(lesson.feedback) && lesson.feedback.length > 0;
                          const studentsShort = truncate(
                            getStudentNames(lesson.studentIds || [], users),
                            56
                          );

                          return (
                            <li
                              key={lesson.id}
                              className="rounded-md border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40 pl-2 pr-1.5 py-2 border-l-[3px] border-l-blue-400/80 dark:border-l-blue-500/60"
                            >
                              <div className="flex items-start justify-between gap-2 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => onViewLessonDetail(lesson)}
                                  className="min-w-0 flex-1 rounded-md text-left outline-none ring-blue-400/40 transition hover:bg-slate-100/80 focus-visible:ring-2 dark:hover:bg-slate-800/50"
                                  title="View full lesson details"
                                >
                                  <div className="flex items-start gap-1.5">
                                    <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">
                                          {lesson.title}
                                        </span>
                                        <span
                                          className={`text-xs font-medium px-1.5 py-0.5 rounded ${lessonStatusClass(lesson.status)}`}
                                        >
                                          {formatStatus(lesson.status)}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                        {studentsShort}
                                      </p>
                                      {(lesson.startTime || lesson.endTime) && (
                                        <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1">
                                          <Clock className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                          {lesson.startTime ?? '—'}–{lesson.endTime ?? '—'}
                                        </p>
                                      )}
                                      {lesson.status === 'completed' && (
                                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                          {review ? (
                                            <>
                                              <Star className="w-3.5 h-3.5 inline text-amber-500 fill-amber-500 align-text-bottom mr-0.5" />
                                              <span className="font-medium">{review.avg.toFixed(1)}</span>
                                              {review.snippet && (
                                                <span className="text-slate-500"> · {review.snippet}</span>
                                              )}
                                            </>
                                          ) : (
                                            <span className="text-slate-500">No student review</span>
                                          )}
                                        </p>
                                      )}
                                      {hasInstructorFeedback && (
                                        <p className="text-xs text-sky-700 dark:text-sky-300">
                                          Instructor notes · {lesson.feedback!.length}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onEditLesson(lesson)}
                                  className="inline-flex items-center gap-1 shrink-0 px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-200/70 dark:hover:bg-slate-700"
                                  title="Edit lesson"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  Edit
                                </button>
                              </div>

                              {entries.length > 0 && (
                                <ul className="mt-2 ml-0.5 space-y-1.5 border-t border-slate-200/50 dark:border-slate-700/50 pt-2">
                                  {entries.map((entry) => (
                                    <li
                                      key={entry.id}
                                      className="flex flex-wrap items-center justify-between gap-1.5 text-xs"
                                    >
                                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0 min-w-0 text-slate-600 dark:text-slate-400">
                                        <Timer className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 opacity-80" />
                                        <span
                                          className={`font-medium px-1.5 py-0.5 rounded text-[11px] ${timeEntryStatusClass(entry.status)}`}
                                        >
                                          {formatStatus(entry.status)}
                                        </span>
                                        <span>
                                          {formatClockSafe(entry.clockIn)}→{formatClockSafe(entry.clockOut)}
                                        </span>
                                        {entry.totalEarnings != null && (
                                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                                            ${Number(entry.totalEarnings).toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onEditTimeEntry({
                                            ...entry,
                                            instructor: instructorUser ?? undefined
                                          })
                                        }
                                        className="inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40"
                                        title="Edit time entry"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                        Time
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      )}

                      {block.standaloneEntries.length > 0 && (
                        <ul className="space-y-1.5 pt-1.5 border-t border-dashed border-slate-200 dark:border-slate-700">
                          {block.standaloneEntries.map((entry) => {
                            const linkedLesson = entry.lessonId ? lessonById.get(entry.lessonId) : undefined;
                            return (
                              <li
                                key={`solo-${entry.id}`}
                                className="flex flex-wrap items-start justify-between gap-2 rounded-md bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-1.5"
                              >
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                    <span className="font-medium text-emerald-800 dark:text-emerald-200">
                                      Time
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${timeEntryStatusClass(entry.status)}`}
                                    >
                                      {formatStatus(entry.status)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                    {standaloneTimeEntryCaption(entry, dayKey, lessonById)}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {formatClockSafe(entry.clockIn)}→{formatClockSafe(entry.clockOut)}
                                    {entry.totalEarnings != null && (
                                      <span className="font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                        ${Number(entry.totalEarnings).toFixed(2)}
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  title="Edit time entry"
                                  onClick={() =>
                                    onEditTimeEntry({
                                      ...entry,
                                      instructor: instructorUser ?? undefined
                                    })
                                  }
                                  className="inline-flex items-center gap-1 shrink-0 px-2 py-1 rounded-md text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  Time
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
      )}
    </div>
  );
}
