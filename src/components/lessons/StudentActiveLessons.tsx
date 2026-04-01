import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  Target,
  AlertCircle,
  Loader2,
  RefreshCw,
  MessageSquare,
  GraduationCap,
  Play,
  CheckCircle,
  Headset,
  Phone
} from 'lucide-react';
import { Lesson, User } from '../../types';
import { resortData } from '../../data/resortData';
import { getStudentActiveLessons } from '../../services/lessons';
import { getLessonDate } from '../../utils/lessonDate';
import { getUserById } from '../../services/users';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200&auto=format&fit=crop';

function avatarSrc(user: User | null | undefined): string {
  const src = user?.avatar;
  if (!src || src.startsWith('blob:')) return DEFAULT_AVATAR;
  return src;
}

const supportLinkClass =
  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors';

function LessonSupportActions() {
  const { supportContacts } = resortData;
  const supervisorInApp = supportContacts.lessonSupervisorUserId;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {supervisorInApp ? (
        <Link
          to={`/messages?instructor=${supervisorInApp}`}
          onClick={(e) => e.stopPropagation()}
          className={`${supportLinkClass} border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100 dark:border-violet-800/80 dark:bg-violet-950/40 dark:text-violet-100 dark:hover:bg-violet-950/70`}
        >
          <Headset className="h-4 w-4 shrink-0" />
          Message supervisor
        </Link>
      ) : (
        <a
          href={supportContacts.lessonSupervisorMailto}
          onClick={(e) => e.stopPropagation()}
          className={`${supportLinkClass} border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100 dark:border-violet-800/80 dark:bg-violet-950/40 dark:text-violet-100 dark:hover:bg-violet-950/70`}
        >
          <Headset className="h-4 w-4 shrink-0" />
          Message supervisor
        </a>
      )}
      <a
        href={supportContacts.skiPatrolTelHref}
        onClick={(e) => e.stopPropagation()}
        className={`${supportLinkClass} border-red-200 bg-red-50 text-red-900 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100 dark:hover:bg-red-950/60`}
      >
        <Phone className="h-4 w-4 shrink-0" />
        Contact ski patrol
      </a>
    </div>
  );
}

export interface StudentActiveLessonsProps {
  studentId: string;
  onSelectLesson: (lesson: Lesson & { instructor?: User }) => void;
  reloadToken?: number | string;
}

export function StudentActiveLessons({
  studentId,
  onSelectLesson,
  reloadToken = 0
}: StudentActiveLessonsProps) {
  const [lessons, setLessons] = useState<(Lesson & { instructor?: User })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLessons = useCallback(
    async (opts?: { silent?: boolean }) => {
      try {
        if (!opts?.silent) setIsLoading(true);
        setError(null);

        const list = await getStudentActiveLessons(studentId);
        list.sort((a, b) => {
          const ta = getLessonDate(a).getTime();
          const tb = getLessonDate(b).getTime();
          const aOk = !Number.isNaN(ta);
          const bOk = !Number.isNaN(tb);
          if (aOk && bOk && ta !== tb) return ta - tb;
          if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
          if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
          return 0;
        });

        const withInstructors = await Promise.all(
          list.map(async (lesson) => {
            try {
              const instructor = await getUserById(lesson.instructorId);
              return { ...lesson, instructor: instructor || undefined };
            } catch {
              return lesson;
            }
          })
        );
        setLessons(withInstructors);
      } catch (err: unknown) {
        console.error('Error loading student active lessons:', err);
        setError(err instanceof Error ? err.message : 'Failed to load lessons');
      } finally {
        if (!opts?.silent) setIsLoading(false);
      }
    },
    [studentId]
  );

  useEffect(() => {
    void loadLessons();
  }, [loadLessons, reloadToken]);

  const statusBadge = (status: string) => {
    if (status === 'in_progress') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          <Play className="h-3 w-3 shrink-0" />
          In progress
        </span>
      );
    }
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950/50 dark:text-green-200">
          <CheckCircle className="h-3 w-3 shrink-0" />
          Completed
        </span>
      );
    }
    return (
      <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900" aria-busy="true" aria-live="polite">
        <div className="border-b border-gray-100 px-3 py-3 dark:border-gray-800 sm:px-6 sm:py-4">
          <div className="h-5 w-56 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-2 h-4 max-w-md animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3 px-3 py-4 sm:px-6 sm:py-6">
              <div className="h-5 w-2/3 max-w-sm animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-24 max-w-xl animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 border-t border-gray-100 py-3 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          Loading today&apos;s lessons…
        </div>
      </div>
    );
  }

  if (error && lessons.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-950/40 dark:text-red-300">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <p className="text-sm">{error}</p>
        <button
          type="button"
          className="ml-auto text-sm font-medium underline"
          onClick={() => void loadLessons()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      {error && lessons.length > 0 && (
        <div className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {error}
          <button type="button" className="ml-2 font-medium underline" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="border-b border-gray-100 px-3 py-3 dark:border-gray-800 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Today &amp; live lessons</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Sessions in progress and anything on your schedule for today.
        </p>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {lessons.length > 0 ? (
          lessons.map((lesson) => {
            const lessonDate = getLessonDate(lesson);
            const dateLabel = Number.isNaN(lessonDate.getTime())
              ? 'Date TBD'
              : format(lessonDate, 'MMM d, yyyy');
            return (
              <div key={lesson.id} className="px-3 py-4 sm:px-6 sm:py-6">
                <button
                  type="button"
                  onClick={() => onSelectLesson(lesson)}
                  className="group w-full min-w-0 rounded-xl p-0.5 text-left transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:hover:bg-gray-800/60 dark:focus-visible:ring-offset-gray-900 sm:-m-1 sm:p-1"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                      {lesson.title}
                    </h3>
                    {statusBadge(lesson.status)}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-4 w-4 shrink-0" />
                      {dateLabel}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4 shrink-0" />
                      {lesson.startTime && lesson.endTime
                        ? `${lesson.startTime} – ${lesson.endTime}`
                        : 'Time TBD'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Target className="h-4 w-4 shrink-0" />
                      {lesson.skillLevel?.replace('_', ' ') ?? '—'}
                    </span>
                  </div>
                  {(() => {
                    const names =
                      lesson.participantChildNames?.length
                        ? lesson.participantChildNames
                        : lesson.participantChildName
                          ? [lesson.participantChildName]
                          : [];
                    if (names.length === 0) return null;
                    return (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-900 dark:bg-violet-950/50 dark:text-violet-100">
                          <span aria-hidden>👧</span>
                          For: {names.join(', ')}
                        </span>
                      </div>
                    );
                  })()}
                  <span className="mt-2 inline-block text-xs font-medium text-blue-600 dark:text-blue-400">
                    Tap for details, cancel, or review
                  </span>
                </button>

                {lesson.instructor && (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <div className="flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-1.5 pl-1 pr-2 dark:border-gray-700 dark:bg-gray-800/60 sm:pr-3">
                      <img
                        src={avatarSrc(lesson.instructor)}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-full border border-gray-200 object-cover dark:border-gray-600"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1 truncate text-sm font-medium text-gray-900 dark:text-white">
                          <GraduationCap className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                          {lesson.instructor.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Instructor</p>
                      </div>
                    </div>
                    <Link
                      to={`/messages?instructor=${lesson.instructor.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800 transition-colors hover:bg-blue-100 dark:border-blue-800/80 dark:bg-blue-950/40 dark:text-blue-100 dark:hover:bg-blue-950/70"
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      Message instructor
                    </Link>
                  </div>
                )}

                <LessonSupportActions />

                {(lesson.skillsFocus ?? []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(lesson.skillsFocus ?? []).map((skill, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

              </div>
            );
          })
        ) : (
          <div className="px-3 py-10 text-center sm:px-6 sm:py-12">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="text-base font-medium text-gray-900 dark:text-white">Nothing live right now</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
              No in-progress lessons and nothing scheduled for you today. Book a session or check your full lesson list.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <Link
                to="/book-lesson"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Book a lesson
              </Link>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700/80"
                onClick={() => void loadLessons()}
              >
                <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
