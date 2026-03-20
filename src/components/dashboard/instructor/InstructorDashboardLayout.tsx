import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../../../types';
import { Clock, Plus, Calendar, Users } from 'lucide-react';
import { ClockInOutButton } from '../../timesheet/ClockInOutButton';
import { CreateLessonModal } from './CreateLessonModal';
import { InstructorCalendar } from './InstructorCalendar';
import { useDataLoader } from '../../../hooks/useDataLoader';
import { getLessonsByInstructor } from '../../../services/lessons';
import { getLessonDate, isLessonOnInstructorActivePanel, isLessonUpcoming } from '../../../utils/lessonDate';
import { LessonDetailsModal } from '../student/components/LessonDetailsModal';
import { ActiveLessons } from '../../lessons/ActiveLessons';

interface InstructorDashboardLayoutProps {
  user: User;
}

export function InstructorDashboardLayout({ user }: InstructorDashboardLayoutProps) {
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [activeLessonsReloadKey, setActiveLessonsReloadKey] = useState(0);

  const {
    data: instructorLessons,
    isLoading: isLessonsLoading,
    refetch
  } = useDataLoader({
    loadFn: () => getLessonsByInstructor(user.id),
    dependencies: [user.id],
    enabled: true
  });

  const upcomingLessons = useMemo(() => {
    if (!instructorLessons) return [];

    return instructorLessons
      .filter(
        (lesson) =>
          lesson.instructorId === user.id &&
          isLessonUpcoming(lesson) &&
          !isLessonOnInstructorActivePanel(lesson)
      )
      .sort((a, b) => getLessonDate(a).getTime() - getLessonDate(b).getTime())
      .slice(0, 4);
  }, [instructorLessons, user.id]);

  const completedLessons = useMemo(() => {
    if (!instructorLessons) return [];
    return instructorLessons
      .filter((lesson) => {
        if (lesson.instructorId !== user.id) return false;
        return lesson.status === 'completed';
      })
      .sort((a, b) => getLessonDate(b).getTime() - getLessonDate(a).getTime())
      .slice(0, 4)
      .map((lesson) => {
        const feedbackIds = lesson.feedback;
        const hasFeedback =
          Array.isArray(feedbackIds) &&
          feedbackIds.length > 0 &&
          feedbackIds.some((id: unknown) => id != null && String(id).trim() !== '');
        return { ...lesson, needsFeedback: !hasFeedback };
      });
  }, [instructorLessons, user.id]);

  const today = new Date();
  const formattedDate = today.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
  const snowReport = user.homeMountain
    ? `Daily snow report for ${user.homeMountain}: check conditions before your lessons.`
    : 'Daily snow report: check conditions before your lessons.';

  return (
    <div className="space-y-6">
      {/* Hero section with home mountain background */}
      <div
        className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-r from-blue-900 via-blue-700 to-sky-500 shadow-sm dark:border-gray-800"
      >
        <div
          className="absolute inset-0 opacity-40 mix-blend-soft-light"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1600&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="relative p-6 sm:p-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-100/90 uppercase tracking-wide">
              Instructor Dashboard
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-semibold text-white">
              Welcome back, {user.name}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-blue-100/90">
              Teaching on{' '}
              <span className="font-semibold">
                {user.homeMountain || 'your mountain'}
              </span>
            </p>
            <p className="mt-3 text-xs sm:text-sm text-blue-100/90">
              {formattedDate}
            </p>
            <p className="mt-1 text-xs sm:text-sm text-blue-100/90">
              {snowReport}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 lg:items-end">
            <div className="flex flex-wrap gap-3 justify-start lg:justify-end">
              <Link
                to="/dashboard/instructor/timecard"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20 border border-white/20"
              >
                <Clock className="h-4 w-4" />
                Time Card
              </Link>
              <button
                onClick={() => setShowCreateLesson(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Create Lesson
              </button>
            </div>
            <ClockInOutButton
              instructorId={user.id}
              onClockIn={() => {}}
              onClockOut={() => {}}
            />
          </div>
        </div>
      </div>

      <section aria-label="Active and today's lessons">
        <ActiveLessons
          instructorId={user.id}
          showTimeTracking={false}
          reloadToken={activeLessonsReloadKey}
          onLessonComplete={() => {
            void refetch();
            setActiveLessonsReloadKey((k) => k + 1);
          }}
        />
      </section>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming lessons
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isLessonsLoading
                ? 'Syncing schedule...'
                : upcomingLessons.length
                ? `Next ${upcomingLessons.length} on your calendar`
                : 'No upcoming lessons right now'}
            </p>
          </div>
          <Link
            to="/dashboard/instructor/lessons"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            View all
          </Link>
        </div>
        {isLessonsLoading ? (
          <div className="flex items-center justify-center py-10 text-gray-500 dark:text-gray-400">
            Loading lessons...
          </div>
        ) : upcomingLessons.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            No lessons scheduled. Use the button above to create one.
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingLessons.map((lesson) => {
              const date = getLessonDate(lesson);
              const sessionLabel =
                lesson.sessionType === 'morning'
                  ? 'Morning'
                  : lesson.sessionType === 'afternoon'
                  ? 'Afternoon'
                  : 'Full Day';
              return (
                <div
                  key={lesson.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedLesson({ ...lesson, instructor: user })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedLesson({ ...lesson, instructor: user });
                    }
                  }}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {lesson.title || 'Untitled lesson'}
                        </h3>
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300">
                          Upcoming
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {isNaN(date.getTime()) ? 'Date TBD' : date.toLocaleDateString()}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {sessionLabel}
                        </span>
                        {lesson.type && (
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{lesson.skillLevel?.replace('_', ' ') || 'All levels'}</span>
                        <span>•</span>
                        <span>{lesson.studentIds?.length || 0} students</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Completed lessons
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isLessonsLoading
                ? 'Loading history...'
                : completedLessons.length
                ? `Last ${completedLessons.length} lessons you completed`
                : 'No completed lessons yet'}
            </p>
          </div>
          <Link
            to="/dashboard/instructor/lessons"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            View all
          </Link>
        </div>
        {isLessonsLoading ? (
          <div className="flex items-center justify-center py-10 text-gray-500 dark:text-gray-400">
            Loading lessons...
          </div>
        ) : completedLessons.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Once you complete lessons, they will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {completedLessons.map((lesson) => {
              const date = getLessonDate(lesson);
              const sessionLabel =
                lesson.sessionType === 'morning'
                  ? 'Morning'
                  : lesson.sessionType === 'afternoon'
                  ? 'Afternoon'
                  : 'Full Day';
              return (
                <div
                  key={lesson.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedLesson({ ...lesson, instructor: user })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedLesson({ ...lesson, instructor: user });
                    }
                  }}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {lesson.title || 'Untitled lesson'}
                        </h3>
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300">
                          Completed
                        </span>
                        {lesson.needsFeedback && (
                          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-200">
                            Needs feedback
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {isNaN(date.getTime()) ? 'Date unknown' : date.toLocaleDateString()}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {sessionLabel}
                        </span>
                        {lesson.type && (
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{lesson.skillLevel?.replace('_', ' ') || 'All levels'}</span>
                        <span>•</span>
                        <span>{lesson.studentIds?.length || 0} students</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateLesson && (
        <CreateLessonModal
          isOpen={showCreateLesson}
          onClose={() => setShowCreateLesson(false)}
          onCreated={() => {
            setShowCreateLesson(false);
            // Refresh data if needed
          }}
        />
      )}

      {showCalendar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Calendar</h2>
              <button
                onClick={() => setShowCalendar(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-auto max-h-[calc(90vh-120px)]">
              <InstructorCalendar user={user} />
            </div>
          </div>
        </div>
      )}

      {selectedLesson && (
        <LessonDetailsModal
          lesson={{
            ...(instructorLessons?.find((l) => l.id === selectedLesson.id) ?? selectedLesson),
            instructor: selectedLesson.instructor ?? user
          }}
          onClose={() => setSelectedLesson(null)}
          onLessonUpdate={() => {
            void refetch();
            setActiveLessonsReloadKey((k) => k + 1);
          }}
        />
      )}

    </div>
  );
}
