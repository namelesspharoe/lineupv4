import { useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { Users, Calendar, MessageSquare, Award, RefreshCw } from 'lucide-react';
import type { Lesson, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useDataLoader } from '../hooks/useDataLoader';
import { getLessonsByInstructor } from '../services/lessons';
import { getUserById } from '../services/users';
import { getLessonDate, isLessonUpcoming } from '../utils/lessonDate';

interface StudentSummary {
  student: User;
  totalLessons: number;
  upcomingLessons: Lesson[];
  completedLessons: Lesson[];
  nextLesson?: Lesson;
}

const collectStudentIds = (lesson: Lesson): string[] => {
  const ids: string[] = Array.isArray(lesson.studentIds) ? [...lesson.studentIds] : [];

  const singleId = (lesson as unknown as { studentId?: string }).studentId;
  if (singleId) {
    ids.push(singleId);
  }

  const participants = (lesson as unknown as { students?: Array<{ id?: string } | string> }).students;
  if (Array.isArray(participants)) {
    participants.forEach((participant) => {
      if (typeof participant === 'string') {
        ids.push(participant);
      } else if (participant?.id) {
        ids.push(participant.id);
      }
    });
  }

  return ids.filter(Boolean);
};

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200&auto=format&fit=crop';

const getAvatarSrc = (value?: string | null) => {
  if (!value) return DEFAULT_AVATAR;
  if (value.startsWith('blob:')) return DEFAULT_AVATAR;
  return value;
};

async function loadInstructorStudents(instructorId: string): Promise<StudentSummary[]> {
  if (!instructorId) {
    return [];
  }

  const lessons = await getLessonsByInstructor(instructorId);

  const studentLessonMap = lessons.reduce<Record<string, Lesson[]>>((map, lesson) => {
    const ids = collectStudentIds(lesson);
    ids.forEach((id) => {
      if (!map[id]) {
        map[id] = [];
      }
      map[id].push(lesson);
    });
    return map;
  }, {});

  const studentIds = Object.keys(studentLessonMap);

  const studentRecords = await Promise.all(studentIds.map((id) => getUserById(id)));
  const validStudents = studentRecords.filter((record): record is User => Boolean(record));

  return validStudents
    .map((student) => {
      const studentLessons = studentLessonMap[student.id] || [];

      const withDates = studentLessons.map((lesson) => ({
        lesson,
        date: getLessonDate(lesson)
      }));

      const upcomingLessons = withDates
        .filter(
          ({ lesson, date }) =>
            isLessonUpcoming(lesson) &&
            !isNaN(date.getTime()) &&
            ['scheduled', 'in_progress'].includes(lesson.status)
        )
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map(({ lesson }) => lesson);

      const completedLessons = withDates
        .filter(({ lesson, date }) => !isNaN(date.getTime()) && lesson.status === 'completed')
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .map(({ lesson }) => lesson);

      return {
        student,
        totalLessons: studentLessons.length,
        upcomingLessons,
        completedLessons,
        nextLesson: upcomingLessons[0]
      };
    })
    .sort((a, b) => (a.student.name || '').localeCompare(b.student.name || ''));
}

export function StudentsPage() {
  const { user } = useAuth();
  const instructorId = user?.role === 'instructor' ? user.id : null;

  const loadStudents = useCallback(() => {
    if (!instructorId) {
      return Promise.resolve([]);
    }
    return loadInstructorStudents(instructorId);
  }, [instructorId]);

  const {
    data: studentSummaries,
    isLoading,
    error,
    refetch
  } = useDataLoader({
    loadFn: loadStudents,
    dependencies: [instructorId],
    enabled: Boolean(instructorId)
  });

  if (!user) {
    return null;
  }

  if (user.role !== 'instructor') {
    return (
      <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-2xl text-yellow-800">
        <h2 className="text-xl font-semibold mb-2">Instructor Access Only</h2>
        <p>
          The students workspace is only available to instructors so they can track
          progress, prep upcoming lessons, and message families in one place.
        </p>
      </div>
    );
  }

  const totals = useMemo(() => {
    const data = studentSummaries || [];
    const totalStudents = data.length;
    const totalUpcoming = data.reduce((count, summary) => count + summary.upcomingLessons.length, 0);
    const totalCompleted = data.reduce((count, summary) => count + summary.completedLessons.length, 0);
    return { totalStudents, totalUpcoming, totalCompleted };
  }, [studentSummaries]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold">
            Instructor Toolkit
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Student Roster</h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Every student tied to your lessons, organized chronologically with quick entry points
            to messaging, prep notes, and achievements. It mirrors the sidebar link so navigation
            feels identical on mobile and desktop.
          </p>
        </div>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh roster
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">Active Students</p>
              <p className="text-3xl font-semibold text-gray-900">{totals.totalStudents}</p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
          <p className="text-sm text-gray-500">
            Based on everyone scheduled across your upcoming lessons
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">Upcoming Sessions</p>
              <p className="text-3xl font-semibold text-gray-900">{totals.totalUpcoming}</p>
            </div>
            <Calendar className="w-10 h-10 text-emerald-500" />
          </div>
          <p className="text-sm text-gray-500">Scheduled or in-progress lessons</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">Completed Sessions</p>
              <p className="text-3xl font-semibold text-gray-900">{totals.totalCompleted}</p>
            </div>
            <Award className="w-10 h-10 text-amber-500" />
          </div>
          <p className="text-sm text-gray-500">Lessons finished where feedback can be added</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
          {error.message}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            <p>Loading your students…</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(studentSummaries || []).map((summary) => {
            const nextLessonDate = summary.nextLesson ? getLessonDate(summary.nextLesson) : null;
            const nextLessonLabel =
              nextLessonDate && !isNaN(nextLessonDate.getTime())
                ? format(nextLessonDate, 'MMM d, yyyy · h:mm a')
                : 'Date TBD';

            return (
              <div
                key={summary.student.id}
                className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={getAvatarSrc(summary.student.avatar)}
                    alt={summary.student.name}
                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                  />
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{summary.student.name}</p>
                    <p className="text-sm text-gray-500">{summary.student.email}</p>
                  </div>
                </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-2xl font-semibold text-gray-900">{summary.totalLessons}</p>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3">
                  <p className="text-2xl font-semibold text-blue-700">{summary.upcomingLessons.length}</p>
                  <p className="text-xs uppercase tracking-wide text-blue-700">Upcoming</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3">
                  <p className="text-2xl font-semibold text-emerald-700">{summary.completedLessons.length}</p>
                  <p className="text-xs uppercase tracking-wide text-emerald-700">Completed</p>
                </div>
              </div>

                {summary.nextLesson ? (
                  <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                    <p className="text-sm text-gray-500 mb-1">Next session</p>
                    <p className="font-semibold text-gray-900">{summary.nextLesson.title || 'Upcoming lesson'}</p>
                    <p className="text-sm text-gray-600">{nextLessonLabel}</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                    No upcoming sessions yet. Add them from the lessons tab.
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition">
                    <MessageSquare className="w-4 h-4" />
                    Message
                  </button>
                  <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-900 text-white hover:bg-black transition">
                    <Calendar className="w-4 h-4" />
                    Add Note
                  </button>
                </div>
              </div>
            );
          })}

          {!studentSummaries?.length && (
            <div className="col-span-full py-16 text-center text-gray-500 border border-dashed border-gray-200 rounded-2xl">
              No students yet. Once lessons are assigned, everyone shows up here automatically.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentsPage;

