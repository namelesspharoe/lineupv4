import { format, parseISO } from 'date-fns';
import { getLessonDate } from '../../../utils/lessonDate';
import { formatFirestoreDate } from '../../../utils/firestoreDate';
import {
  X,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Star,
  MessageSquare,
  ClipboardList,
  Timer,
  Pencil,
  DollarSign,
  Tag
} from 'lucide-react';
import { ResponsiveModalPanel } from '../../common/ResponsiveModalPanel';
import type { Lesson, LessonFeedback, TimeEntry, User } from '../../../types';
import { formatStatus, getInstructorName, getStudentNames } from './utils/adminUtils';

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

function formatLessonScheduleDate(lesson: Lesson): string {
  const d = getLessonDate(lesson);
  return Number.isNaN(d.getTime()) ? '—' : format(d, 'EEEE, MMMM d, yyyy');
}

function formatClockSafe(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'p');
  } catch {
    return '—';
  }
}

interface AdminOverviewLessonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson | null;
  users: User[];
  /** All time entries linked to this lesson (caller filters). */
  timeEntriesForLesson: TimeEntry[];
  onEditLesson: (lesson: Lesson) => void;
  onEditTimeEntry: (entry: TimeEntry & { instructor?: User }) => void;
}

export function AdminOverviewLessonDetailModal({
  isOpen,
  onClose,
  lesson,
  users,
  timeEntriesForLesson,
  onEditLesson,
  onEditTimeEntry
}: AdminOverviewLessonDetailModalProps) {
  if (!isOpen || !lesson) return null;

  const instructor = users.find((u) => u.id === lesson.instructorId);
  const students =
    lesson.studentIds?.map((id) => users.find((u) => u.id === id)).filter(Boolean) as User[] | undefined;
  const reviews = lesson.studentReviews ?? [];
  const feedbackList = lesson.feedback ?? [];
  const sortedEntries = [...timeEntriesForLesson].sort((a, b) =>
    (a.clockIn ?? '').localeCompare(b.clockIn ?? '')
  );

  const reviewAvg =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length
      : null;

  return (
    <ResponsiveModalPanel
      onClose={onClose}
      labelledBy="admin-overview-lesson-detail-title"
      maxWidthClass="sm:max-w-3xl"
    >
      <div className="flex shrink-0 items-center justify-end border-b border-slate-200 bg-white px-2 py-2 dark:border-slate-800 dark:bg-slate-900 sm:absolute sm:inset-x-0 sm:top-0 sm:z-20 sm:border-0 sm:bg-transparent sm:px-4 sm:py-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-8 pt-2 sm:px-6 sm:pb-8 sm:pt-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2
              id="admin-overview-lesson-detail-title"
              className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl"
            >
              {lesson.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Lesson ID: <code className="text-xs">{lesson.id}</code>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${lessonStatusClass(lesson.status)}`}
            >
              {formatStatus(lesson.status)}
            </span>
            <button
              type="button"
              onClick={() => {
                onEditLesson(lesson);
                onClose();
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Pencil className="h-4 w-4" />
              Edit lesson
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/50">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Schedule & format
            </h3>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Date</dt>
                <dd className="mt-0.5 text-slate-900 dark:text-slate-100">{formatLessonScheduleDate(lesson)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Session</dt>
                <dd className="mt-0.5 capitalize text-slate-900 dark:text-slate-100">
                  {lesson.sessionType?.replace('_', ' ') ?? '—'} · {lesson.type ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Time window</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                  <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                  {lesson.startTime ?? '—'} – {lesson.endTime ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Sport</dt>
                <dd className="mt-0.5 capitalize text-slate-900 dark:text-slate-100">{lesson.sport ?? 'skiing'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Skill level</dt>
                <dd className="mt-0.5 text-slate-900 dark:text-slate-100">
                  {lesson.skillLevel?.replace(/_/g, ' ') ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Price / capacity</dt>
                <dd className="mt-0.5 text-slate-900 dark:text-slate-100">
                  ${Number(lesson.price ?? 0).toFixed(2)} · max {lesson.maxStudents ?? '—'} students
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
              <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              People
            </h3>
            <div className="mt-3 space-y-2 text-sm">
              <p>
                <span className="font-medium text-slate-700 dark:text-slate-300">Instructor: </span>
                {instructor?.name ?? getInstructorName(lesson.instructorId, users)}
                {instructor?.email && (
                  <span className="text-slate-500 dark:text-slate-400"> · {instructor.email}</span>
                )}
              </p>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300">Students</p>
                {students && students.length > 0 ? (
                  <ul className="mt-1 list-inside list-disc space-y-1 text-slate-600 dark:text-slate-400">
                    {students.map((s) => (
                      <li key={s.id}>
                        {s.name}
                        {s.email && <span className="text-slate-500"> ({s.email})</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-slate-500">{getStudentNames(lesson.studentIds || [], users)}</p>
                )}
              </div>
            </div>
          </section>

          {(lesson.description || lesson.notes || lesson.sessionNotes || (lesson.skillsFocus?.length ?? 0) > 0) && (
            <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80">
              <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                <BookOpen className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                Description & notes
              </h3>
              {lesson.description ? (
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                  {lesson.description}
                </p>
              ) : null}
              {lesson.skillsFocus && lesson.skillsFocus.length > 0 && (
                <div className="mt-3">
                  <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Tag className="h-3.5 w-3.5" />
                    Skills focus
                  </p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    {lesson.skillsFocus.join(', ')}
                  </p>
                </div>
              )}
              {lesson.notes ? (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lesson notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                    {lesson.notes}
                  </p>
                </div>
              ) : null}
              {lesson.sessionNotes ? (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Session notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                    {lesson.sessionNotes}
                  </p>
                </div>
              ) : null}
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
              <Star className="h-5 w-5 text-amber-500" />
              Student reviews
              {reviewAvg != null && (
                <span className="text-sm font-normal text-slate-500">
                  (avg {reviewAvg.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''})
                </span>
              )}
            </h3>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No student reviews on this lesson.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {reviews.map((r, i) => {
                  const sid = r.studentId;
                  const student = sid ? users.find((u) => u.id === sid) : undefined;
                  const reviewDateLabel = formatFirestoreDate(r.createdAt, 'MMM d, yyyy', '');
                  return (
                    <li
                      key={`${sid ?? 'anon'}-${i}`}
                      className="rounded-lg border border-slate-100 bg-amber-50/50 p-3 dark:border-slate-700 dark:bg-amber-950/20"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {Number(r.rating).toFixed(1)} ★
                        </span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {student?.name ?? (sid ? `Student ${sid.slice(0, 8)}…` : 'Student')}
                        </span>
                        {reviewDateLabel ? (
                          <span className="text-xs text-slate-500">{reviewDateLabel}</span>
                        ) : null}
                      </div>
                      {r.comment?.trim() ? (
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {r.comment}
                        </p>
                      ) : null}
                      {(r.isHidden || r.isApproved === false) && (
                        <p className="mt-2 text-xs text-slate-500">
                          {r.isHidden && 'Hidden from public · '}
                          {r.isApproved === false && 'Not approved for display'}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
              <MessageSquare className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              Instructor feedback
            </h3>
            {feedbackList.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                No structured instructor feedback stored on this lesson document.
              </p>
            ) : (
              <ul className="mt-3 space-y-4">
                {feedbackList.map((fb: LessonFeedback) => (
                  <li
                    key={fb.id}
                    className="rounded-lg border border-slate-100 bg-sky-50/40 p-3 dark:border-slate-700 dark:bg-sky-950/20"
                  >
                    <p className="text-xs text-slate-500">
                      {fb.date ? formatFirestoreDate(fb.date, 'EEEE, MMM d, yyyy') : ''}
                      {fb.sport && ` · ${fb.sport}`}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                      Performance (overall {fb.performance?.overall ?? '—'}/5)
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Technique {fb.performance?.technique ?? '—'} · Control {fb.performance?.control ?? '—'} ·
                      Confidence {fb.performance?.confidence ?? '—'} · Safety {fb.performance?.safety ?? '—'}
                    </p>
                    {fb.skillAssessment?.recommendations && (
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        <span className="font-medium">Recommendations: </span>
                        {fb.skillAssessment.recommendations}
                      </p>
                    )}
                    {fb.instructorNotes?.trim() && (
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        <span className="font-medium">Instructor notes: </span>
                        {fb.instructorNotes}
                      </p>
                    )}
                    {(fb.strengths?.length ?? 0) > 0 && (
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-medium">Strengths: </span>
                        {fb.strengths!.join('; ')}
                      </p>
                    )}
                    {(fb.areasForImprovement?.length ?? 0) > 0 && (
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-medium">Areas for improvement: </span>
                        {fb.areasForImprovement!.join('; ')}
                      </p>
                    )}
                    {fb.homework?.trim() && (
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        <span className="font-medium">Homework: </span>
                        {fb.homework}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
              <Timer className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Time entries ({sortedEntries.length})
            </h3>
            {sortedEntries.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No time entries linked to this lesson.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {sortedEntries.map((entry) => {
                  const inst = users.find((u) => u.id === entry.instructorId);
                  return (
                    <li
                      key={entry.id}
                      className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-emerald-50/30 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-emerald-950/15"
                    >
                      <div className="min-w-0 flex-1 space-y-1 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${timeEntryStatusClass(entry.status)}`}
                          >
                            {formatStatus(entry.status)}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {formatClockSafe(entry.clockIn)} → {formatClockSafe(entry.clockOut)}
                          </span>
                          {entry.totalEarnings != null && (
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
                              <DollarSign className="h-3.5 w-3.5" />
                              {Number(entry.totalEarnings).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{inst?.name ?? 'Unknown instructor'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onEditTimeEntry({ ...entry, instructor: inst ?? undefined });
                          onClose();
                        }}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-sm font-medium text-emerald-900 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-800 dark:text-emerald-200 dark:hover:bg-emerald-950/40"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit time entry
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {(lesson.createdAt != null || lesson.updatedAt != null) && (
            <section className="text-xs text-slate-500 dark:text-slate-400">
              <p className="flex flex-wrap items-center gap-1">
                <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                {lesson.createdAt != null && (
                  <span>Created {formatFirestoreDate(lesson.createdAt, 'PPp')}</span>
                )}
                {lesson.createdAt != null && lesson.updatedAt != null && <span aria-hidden> · </span>}
                {lesson.updatedAt != null && (
                  <span>Updated {formatFirestoreDate(lesson.updatedAt, 'PPp')}</span>
                )}
              </p>
            </section>
          )}
        </div>
      </div>
    </ResponsiveModalPanel>
  );
}
