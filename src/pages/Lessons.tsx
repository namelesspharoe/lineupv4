import { useMemo, useState, useCallback, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, CheckCircle, AlertCircle, Clock, Search, Filter, RefreshCw, Plus, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDataLoader } from '../hooks/useDataLoader';
import { Lesson, User } from '../types';
import { getLessonsByStudent, getLessonsByInstructor, getAllLessons } from '../services/lessons';
import { getUserById } from '../services/users';
import { getLessonDate } from '../utils/lessonDate';
import { LessonDetailsModal } from '../components/dashboard/student/components/LessonDetailsModal';
import { InstructorProfileModal } from '../components/instructor/InstructorProfileModal';
import { buildInstructorProfile } from '../utils/instructorProfile';

type LessonFilter = 'all' | 'upcoming' | 'completed' | 'cancelled';

interface LessonsPayload {
  lessons: Lesson[];
  participants: Record<string, User>;
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200&auto=format&fit=crop';

const statusMeta: Record<
  NonNullable<Lesson['status']>,
  { label: string; color: string; badge: string }
> = {
  available: {
    label: 'Available',
    color: 'text-slate-600',
    badge: 'bg-slate-50 text-slate-700 border border-slate-200'
  },
  scheduled: {
    label: 'Scheduled',
    color: 'text-blue-600',
    badge: 'bg-blue-50 text-blue-700 border border-blue-200'
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-amber-600',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200'
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-600',
    badge: 'bg-red-50 text-red-700 border border-red-200'
  }
};

function sanitizeAvatar(src?: string | null) {
  if (!src || src.startsWith('blob:')) {
    return DEFAULT_AVATAR;
  }
  return src;
}

export function Lessons() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<LessonFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<(Lesson & { instructor?: User }) | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<User | null>(null);

  const loadLessons = useCallback(async (): Promise<LessonsPayload> => {
    if (!user) {
      return { lessons: [], participants: {} };
    }

    let lessons: Lesson[] = [];

    if (user.role === 'student') {
      lessons = await getLessonsByStudent(user.id);
    } else if (user.role === 'instructor') {
      lessons = await getLessonsByInstructor(user.id);
    } else {
      lessons = await getAllLessons();
    }

    const participantIds = new Set<string>();
    lessons.forEach((lesson) => {
      if (lesson.instructorId) {
        participantIds.add(lesson.instructorId);
      }
      (lesson.studentIds || []).forEach((id) => id && participantIds.add(id));
    });

    const participantEntries = await Promise.all(
      Array.from(participantIds).map(async (id) => {
        try {
          const participant = await getUserById(id);
          return participant ? [id, participant] : null;
        } catch (error) {
          console.warn('Failed to load participant', id, error);
          return null;
        }
      })
    );

    const participants = Object.fromEntries(
      participantEntries.filter(Boolean) as [string, User][]
    );

    return { lessons, participants };
  }, [user]);

  const {
    data,
    isLoading,
    error,
    refetch
  } = useDataLoader({
    loadFn: loadLessons,
    dependencies: [loadLessons],
    enabled: Boolean(user)
  });

  const lessons = data?.lessons ?? [];
  const participants = data?.participants ?? {};

  const stats = useMemo(() => {
    const now = Date.now();
    const upcoming = lessons.filter((lesson) => {
      const date = getLessonDate(lesson).getTime();
      return !isNaN(date) && date >= now && lesson.status !== 'cancelled';
    }).length;
    const completed = lessons.filter((lesson) => lesson.status === 'completed').length;
    const cancelled = lessons.filter((lesson) => lesson.status === 'cancelled').length;

    return {
      total: lessons.length,
      upcoming,
      completed,
      cancelled
    };
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    const now = Date.now();

    return lessons
      .filter((lesson) => {
        const date = getLessonDate(lesson).getTime();
        if (isNaN(date)) {
          return filter === 'all' || lesson.status === filter;
        }

        switch (filter) {
          case 'upcoming':
            return date >= now && lesson.status !== 'cancelled';
          case 'completed':
            return lesson.status === 'completed';
          case 'cancelled':
            return lesson.status === 'cancelled';
          default:
            return true;
        }
      })
      .filter((lesson) => {
        if (!searchQuery) return true;
        const target = searchQuery.toLowerCase();
        const instructorName = participants[lesson.instructorId || '']?.name?.toLowerCase() ?? '';
        const studentNames = (lesson.studentIds || [])
          .map((id) => participants[id]?.name?.toLowerCase() ?? '')
          .join(' ');

        return (
          lesson.title?.toLowerCase().includes(target) ||
          instructorName.includes(target) ||
          studentNames.includes(target)
        );
      })
      .sort((a, b) => getLessonDate(b).getTime() - getLessonDate(a).getTime());
  }, [lessons, participants, filter, searchQuery]);

  if (!user) {
    return null;
  }

  const canViewDetails = user.role === 'student' || user.role === 'instructor';

  const roleLabel =
    user.role === 'admin'
      ? 'Admin oversight across every lesson in the system.'
      : user.role === 'instructor'
      ? 'Track every session on your calendar, including past completions.'
      : 'See your booked lessons, their status, and get ready faster.';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Lessons Control
          </p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">Lessons</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400 max-w-2xl">{roleLabel}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={refetch}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          {user.role === 'student' && (
            <Link
              to="/book-lesson"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Book Lesson
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Lessons"
          value={stats.total}
          icon={<BarChart2 className="h-5 w-5 text-blue-600" />}
        />
        <StatCard
          title="Upcoming"
          value={stats.upcoming}
          icon={<Calendar className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={<CheckCircle className="h-5 w-5 text-indigo-600" />}
        />
        <StatCard
          title="Cancelled"
          value={stats.cancelled}
          icon={<AlertCircle className="h-5 w-5 text-red-600" />}
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap gap-2">
          {(['all', 'upcoming', 'completed', 'cancelled'] as LessonFilter[]).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === item
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {item === 'all' ? 'All' : item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, student, or instructor"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-blue-900/40"
            />
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <Filter className="h-4 w-4" />
            {filteredLessons.length} result{filteredLessons.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
          <p className="font-semibold">Unable to load lessons.</p>
          <p className="text-sm opacity-80">{error.message}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="text-gray-500 dark:text-gray-400">Syncing lessons…</p>
          </div>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            No lessons match this view
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Try adjusting filters or booking a new lesson.
          </p>
          {user.role === 'student' && (
            <Link
              to="/book-lesson"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Book a lesson
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLessons.map((lesson) => {
            const date = getLessonDate(lesson);
            const instructor = lesson.instructorId ? participants[lesson.instructorId] : undefined;
            const students =
              lesson.studentIds?.map((id) => participants[id]?.name).filter(Boolean) ?? [];
            const sessionLabel =
              lesson.sessionType === 'morning'
                ? 'Morning'
                : lesson.sessionType === 'afternoon'
                ? 'Afternoon'
                : 'Full Day';

            return (
              <div
                key={lesson.id}
                role={canViewDetails ? 'button' : undefined}
                tabIndex={canViewDetails ? 0 : undefined}
                onClick={
                  canViewDetails
                    ? () =>
                        setSelectedLesson({
                          ...lesson,
                          instructor
                        })
                    : undefined
                }
                onKeyDown={
                  canViewDetails
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedLesson({
                            ...lesson,
                            instructor
                          });
                        }
                      }
                    : undefined
                }
                className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 ${
                  canViewDetails ? 'cursor-pointer' : ''
                }`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {lesson.title || 'Untitled lesson'}
                      </h3>
                      <StatusBadge status={lesson.status} />
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

                    <div className="flex flex-wrap gap-2 text-sm">
                      {user.role !== 'student' && students.length > 0 && (
                        <div className="inline-flex flex-wrap items-center gap-2 rounded-xl bg-gray-100 px-3 py-1 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          <Users className="h-4 w-4" />
                          <span>
                            {students.slice(0, 2).join(', ')}
                            {students.length > 2 ? ` +${students.length - 2}` : ''}
                          </span>
                        </div>
                      )}
                      {instructor && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (user.role === 'student') {
                              setSelectedInstructor(instructor);
                            }
                          }}
                          onKeyDown={(event) => {
                            event.stopPropagation();
                            if ((event.key === 'Enter' || event.key === ' ') && user.role === 'student') {
                              event.preventDefault();
                              setSelectedInstructor(instructor);
                            }
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-1 text-left text-gray-700 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-gray-800 dark:text-gray-300"
                        >
                          <img
                            src={sanitizeAvatar(instructor.avatar)}
                            alt={instructor.name}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                          <span className="font-medium">{instructor.name}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {lesson.price ? `$${lesson.price.toFixed(0)}` : '—'}
                      </p>
                      <p>{lesson.skillLevel?.replace('_', ' ') || 'Any level'}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canViewDetails && selectedLesson && (
        <LessonDetailsModal
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
          onLessonUpdate={() => {
            setSelectedLesson(null);
            refetch();
          }}
        />
      )}

      {user.role === 'student' && selectedInstructor && (
        <InstructorProfileModal
          instructor={buildInstructorProfile(selectedInstructor)}
          onClose={() => setSelectedInstructor(null)}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className="rounded-xl bg-gray-100 p-3 dark:bg-gray-800">{icon}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: NonNullable<Lesson['status']> }) {
  const meta = statusMeta[status] ?? statusMeta.scheduled;
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${meta.badge}`}>
      {meta.label}
    </span>
  );
}

export default Lessons;
