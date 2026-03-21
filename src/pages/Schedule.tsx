import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { CalendarDays, Clock, Users, Compass, AlertCircle } from 'lucide-react';
import type { Lesson, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { InstructorCalendarWrapper } from '../components/dashboard/instructor/InstructorCalendarWrapper';
import { InstructorCalendar } from '../components/dashboard/instructor/InstructorCalendar';
import { useAdminData } from '../components/dashboard/admin/hooks/useAdminData';
import { useDataLoader } from '../hooks/useDataLoader';
import { getLessonsByStudent } from '../services/lessons';
import { getLessonDate, getLessonDayKey, isLessonUpcoming } from '../utils/lessonDate';

const withLessonDate = (lesson: Lesson) => ({
  lesson,
  date: getLessonDate(lesson)
});

function StudentScheduleView({ userId }: { userId: string }) {
  const { data: lessons, isLoading, error, refetch } = useDataLoader({
    loadFn: () => getLessonsByStudent(userId),
    dependencies: [userId],
    enabled: Boolean(userId)
  });

  const lessonList = lessons || [];
  const entries = lessonList.map(withLessonDate);

  const upcoming = entries
    .filter(
      ({ lesson, date }) =>
        isLessonUpcoming(lesson) &&
        !isNaN(date.getTime()) &&
        ['scheduled', 'in_progress'].includes(lesson.status)
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const past = entries
    .filter(({ lesson, date }) => !isNaN(date.getTime()) && lesson.status === 'completed')
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold">
          Student Planner
        </p>
        <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
        <p className="text-gray-600 max-w-2xl">
          Lessons, achievements, and availability all route back to this page on the sidebar so you
          always know where to go on mobile or desktop.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <div className="flex-1">
            <p className="font-medium">We couldn&apos;t load your lessons.</p>
            <button onClick={refetch} className="text-sm underline">
              Try again
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Lessons</h2>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          {isLoading ? (
            <div className="py-10 text-center text-gray-500">Loading lessons…</div>
          ) : upcoming.length ? (
            <div className="space-y-4">
              {upcoming.map(({ lesson, date }) => (
                <div key={lesson.id} className="rounded-2xl border border-gray-200 p-4 hover:border-blue-200 transition">
                  <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                    {(lesson.sessionType || 'session').replace('_', ' ')}
                  </p>
                  <p className="text-lg font-semibold text-gray-900">{lesson.title}</p>
                  <p className="text-sm text-gray-600">
                    {isNaN(date.getTime()) ? 'Date TBD' : format(date, 'MMM d, yyyy · h:mm a')}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Focus: {lesson.skillsFocus?.join(', ') || 'General technique'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-gray-500">
              No upcoming lessons yet. Head to the lessons tab to book one.
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Previous Lessons</h2>
            <CalendarDays className="w-5 h-5 text-emerald-500" />
          </div>
          {isLoading ? (
            <div className="py-10 text-center text-gray-500">Loading history…</div>
          ) : past.length ? (
            <div className="space-y-3">
              {past.slice(0, 6).map(({ lesson, date }) => (
                <div key={lesson.id} className="flex items-center justify-between border border-gray-200 rounded-2xl px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{lesson.title}</p>
                    <p className="text-sm text-gray-500">
                      {isNaN(date.getTime()) ? 'Date TBD' : format(date, 'MMM d')}
                    </p>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    Completed
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-gray-500">
              Lessons you finish will show up here for easy reference.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InstructorScheduleView() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold">
          Instructor Planner
        </p>
        <h1 className="text-3xl font-bold text-gray-900">My Teaching Schedule</h1>
        <p className="text-gray-600 max-w-2xl">
          This page mirrors the sidebar navigation item so you can jump into the calendar fast,
          adjust availability, and stay aligned with booking demand.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900">
        <InstructorCalendarWrapper />
      </div>
    </div>
  );
}

function AdminScheduleView() {
  const {
    users,
    lessons,
    isLoading,
    error,
    handleRefresh
  } = useAdminData();

  const instructors = useMemo(
    () => users.filter((user) => user.role === 'instructor'),
    [users]
  );

  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedInstructorId && instructors.length) {
      setSelectedInstructorId(instructors[0].id);
    }
  }, [instructors, selectedInstructorId]);

  const selectedInstructor = instructors.find((instructor) => instructor.id === selectedInstructorId) || null;

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todayLessons = useMemo(
    () =>
      lessons
        .map((lesson) => ({ lesson, date: getLessonDate(lesson), day: getLessonDayKey(lesson) }))
        .filter(({ day, date }) => day === todayKey && !isNaN(date.getTime()))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map(({ lesson }) => lesson),
    [lessons, todayKey]
  );

  const coverageRate = useMemo(() => {
    const totalScheduled = lessons.filter((lesson) => lesson.status !== 'cancelled').length;
    const totalCapacity = instructors.length * 4 || 1; // Rough daily capacity
    return Math.min(100, Math.round((totalScheduled / totalCapacity) * 100));
  }, [lessons, instructors.length]);

  if (isLoading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          <p>Loading resort schedule…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold">
            Operations Hub
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Mountain Schedule</h1>
          <p className="text-gray-600 max-w-3xl">
            Track resort coverage, drill into any instructor&apos;s availability, and keep schedule oversight aligned
            with what the navigation promises.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
        >
          <Clock className="w-4 h-4" />
          Refresh snapshots
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Instructors Active</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-3xl font-semibold text-gray-900">{instructors.length}</p>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Pulls straight from the admin roster so navigation stays coherent.
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Coverage Readiness</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-3xl font-semibold text-gray-900">{coverageRate}%</p>
            <Compass className="w-10 h-10 text-emerald-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Based on scheduled lessons vs. daily capacity.
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Lessons Today</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-3xl font-semibold text-gray-900">{todayLessons.length}</p>
            <CalendarDays className="w-10 h-10 text-amber-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Filter of all lessons scheduled for {format(new Date(), 'MMM d')}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 mb-3">Select instructor</p>
            <select
              value={selectedInstructorId || ''}
              onChange={(event) => setSelectedInstructorId(event.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </option>
              ))}
            </select>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 mb-3">Today&apos;s lessons</p>
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
              {todayLessons.length ? (
                todayLessons.map((lesson) => {
                  const date = getLessonDate(lesson);
                  const displayTime = isNaN(date.getTime()) ? 'TBD' : format(date, 'h:mm a');

                  return (
                  <div key={lesson.id} className="border border-gray-200 rounded-xl px-4 py-3">
                    <p className="text-sm text-gray-500">
                      {displayTime}
                    </p>
                    <p className="font-medium text-gray-900">{lesson.title}</p>
                    <p className="text-sm text-gray-500 capitalize">{lesson.sessionType}</p>
                  </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">
                  No lessons scheduled for today yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          {selectedInstructor ? (
            <InstructorCalendar user={selectedInstructor as User} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select an instructor to load their availability.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SchedulePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  if (user.role === 'instructor') {
    return <InstructorScheduleView />;
  }

  if (user.role === 'admin') {
    return <AdminScheduleView />;
  }

  return <StudentScheduleView userId={user.id} />;
}

export default SchedulePage;

