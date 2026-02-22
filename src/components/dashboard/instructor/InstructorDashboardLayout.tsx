import { useState, useMemo } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { User } from '../../../types';
import {
  BookOpen,
  Calendar,
  Clock,
  Plus,
  ArrowUpRight
} from 'lucide-react';
import { ClockInOutButton } from '../../timesheet/ClockInOutButton';
import { CreateLessonModal } from './CreateLessonModal';
import { InstructorCalendar } from './InstructorCalendar';
import { useDataLoader } from '../../../hooks/useDataLoader';
import { getLessonsByInstructor } from '../../../services/lessons';
import { getLessonDate } from '../../../utils/lessonDate';

interface InstructorDashboardLayoutProps {
  user: User;
}

export function InstructorDashboardLayout({ user }: InstructorDashboardLayoutProps) {
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const {
    data: instructorLessons,
    isLoading: isLessonsLoading
  } = useDataLoader({
    loadFn: () => getLessonsByInstructor(user.id),
    dependencies: [user.id],
    enabled: true
  });

  const upcomingLessons = useMemo(() => {
    if (!instructorLessons) return [];
    const now = Date.now();

    return instructorLessons
      .filter((lesson) => {
        const timestamp = getLessonDate(lesson).getTime();
        return !isNaN(timestamp) && timestamp >= now && lesson.status !== 'cancelled';
      })
      .sort((a, b) => getLessonDate(a).getTime() - getLessonDate(b).getTime())
      .slice(0, 4);
  }, [instructorLessons]);


  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back</p>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {user.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Quick actions to stay on schedule
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/dashboard/instructor/timecard"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-500/40 dark:text-blue-300 dark:hover:bg-blue-900/20"
            >
              <Clock className="h-4 w-4" />
              Time Card
            </Link>
            <button
              onClick={() => setShowCreateLesson(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create Lesson
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => setShowCalendar(true)}
            className="rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:border-blue-200 hover:bg-blue-50 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-500/40 dark:hover:bg-blue-900/20"
          >
            <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Calendar
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <p className="text-base text-gray-900 dark:text-white">View schedule</p>
          </button>
          <div className="rounded-xl border border-gray-200 px-4 py-3 text-left dark:border-gray-700">
            <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Clock In/Out
            </p>
            <div className="mt-2">
              <ClockInOutButton
                instructorId={user.id}
                onClockIn={() => {}}
                onClockOut={() => {}}
              />
            </div>
          </div>
        </div>
      </div>

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
              return (
                <div
                  key={lesson.id}
                  className="flex flex-col gap-2 rounded-xl border border-gray-100 px-4 py-3 text-sm text-gray-600 shadow-sm dark:border-gray-800 dark:text-gray-300"
                >
                  <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                    <span>{isNaN(date.getTime()) ? 'Date TBD' : date.toLocaleString()}</span>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
                      {lesson.sessionType === 'morning'
                        ? 'Morning'
                        : lesson.sessionType === 'afternoon'
                        ? 'Afternoon'
                        : 'Full Day'}
                    </span>
                  </div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white">
                    {lesson.title || 'Untitled lesson'}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{lesson.skillLevel?.replace('_', ' ') || 'All levels'}</span>
                    <span>•</span>
                    <span>{lesson.studentIds?.length || 0} students</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex overflow-x-auto space-x-0 sm:space-x-8 px-4 sm:px-6">
            <NavLink
              to="/dashboard/instructor/lessons"
              className={({ isActive }) => 
                `py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              <div className="flex items-center gap-2 sm:gap-0">
                <BookOpen className="w-4 h-4 sm:hidden" />
                <span>Lessons</span>
              </div>
            </NavLink>
            <NavLink
              to="/dashboard/instructor/timecard"
              className={({ isActive }) => 
                `py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              <div className="flex items-center gap-2 sm:gap-0">
                <Clock className="w-4 h-4 sm:hidden" />
                <span>Time Card</span>
              </div>
            </NavLink>
            <NavLink
              to="/dashboard/instructor/calendar"
              className={({ isActive }) => 
                `py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              <div className="flex items-center gap-2 sm:gap-0">
                <Calendar className="w-4 h-4 sm:hidden" />
                <span>Calendar</span>
              </div>
            </NavLink>
          </nav>
        </div>
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
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

    </div>
  );
}
