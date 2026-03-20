import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import {
  Clock,
  Play,
  CheckCircle,
  Users,
  Target,
  AlertCircle,
  StickyNote,
  Calendar,
  Loader2,
  Plus,
  Minus
} from 'lucide-react';
import { Lesson, User } from '../../types';
import { getInstructorActiveLessons, startLesson, completeLesson, updateLesson } from '../../services/lessons';
import { getLessonDate } from '../../utils/lessonDate';
import { getUserById } from '../../services/users';
import { EnhancedFeedbackForm } from './EnhancedFeedbackForm';
import { ClockInOutButton } from '../timesheet/ClockInOutButton';
import { LessonDetailsModal } from '../dashboard/student/components/LessonDetailsModal';
import { useAuth } from '../../context/AuthContext';
import { StudentSearch } from '../common/StudentSearch';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200&auto=format&fit=crop';

function avatarSrc(user: User | null | undefined): string {
  const src = user?.avatar;
  if (!src || src.startsWith('blob:')) return DEFAULT_AVATAR;
  return src;
}

interface ActiveLessonsProps {
  instructorId: string;
  onLessonComplete: () => void;
  /** When false, hides the clock in/out block (e.g. dashboard already has it in the hero). Default true. */
  showTimeTracking?: boolean;
  /** Increment or change when parent refreshes lesson data so this panel reloads from Firestore. */
  reloadToken?: number | string;
}

export function ActiveLessons({
  instructorId,
  onLessonComplete,
  showTimeTracking = true,
  reloadToken = 0
}: ActiveLessonsProps) {
  const { user: authUser } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentsById, setStudentsById] = useState<Record<string, User | null>>({});
  const [savingNotesLessonId, setSavingNotesLessonId] = useState<string | null>(null);
  const [detailsLesson, setDetailsLesson] = useState<Lesson | null>(null);
  const sessionNotesSaveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastPersistedSessionNotesRef = useRef<Record<string, string>>({});
  const [addStudentLessonId, setAddStudentLessonId] = useState<string | null>(null);

  const loadLessons = useCallback(
    async (opts?: { silent?: boolean }) => {
      try {
        if (!opts?.silent) {
          setIsLoading(true);
        }
        setError(null);

        const list = await getInstructorActiveLessons(instructorId);
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
        setLessons(list);
      } catch (err: unknown) {
        console.error('Error loading lessons:', err);
        setError(err instanceof Error ? err.message : 'Failed to load lessons');
      } finally {
        if (!opts?.silent) {
          setIsLoading(false);
        }
      }
    },
    [instructorId]
  );

  useEffect(() => {
    void loadLessons();
  }, [loadLessons, reloadToken]);

  useEffect(() => {
    let cancelled = false;
    const ids = [...new Set(lessons.flatMap((l) => l.studentIds ?? []))];
    if (ids.length === 0) {
      setStudentsById({});
      return;
    }

    (async () => {
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const u = await getUserById(id);
            return [id, u] as const;
          } catch {
            return [id, null] as const;
          }
        })
      );
      if (!cancelled) {
        setStudentsById(Object.fromEntries(entries));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lessons]);

  useEffect(() => {
    setDetailsLesson((current) => {
      if (!current) return null;
      const fresh = lessons.find((l) => l.id === current.id);
      return fresh ?? null;
    });
  }, [lessons]);

  useEffect(() => {
    for (const l of lessons) {
      const trimmed = l.sessionNotes?.trim() ?? '';
      if (lastPersistedSessionNotesRef.current[l.id] === undefined) {
        lastPersistedSessionNotesRef.current[l.id] = trimmed;
      }
    }
  }, [lessons]);

  useEffect(() => {
    return () => {
      Object.values(sessionNotesSaveTimersRef.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  const clearSessionNotesTimer = (lessonId: string) => {
    const t = sessionNotesSaveTimersRef.current[lessonId];
    if (t) {
      clearTimeout(t);
      delete sessionNotesSaveTimersRef.current[lessonId];
    }
  };

  const persistSessionNotes = useCallback(async (lessonId: string, raw: string) => {
    const next = raw.trim();
    if (lastPersistedSessionNotesRef.current[lessonId] === next) return;
    setSavingNotesLessonId(lessonId);
    try {
      await updateLesson(lessonId, { sessionNotes: next });
      lastPersistedSessionNotesRef.current[lessonId] = next;
    } catch (e) {
      console.error('Failed to save session notes:', e);
      setError('Could not save notes. Try again.');
    } finally {
      setSavingNotesLessonId((id) => (id === lessonId ? null : id));
    }
  }, []);

  const onSessionNotesChange = (lessonId: string, text: string) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === lessonId ? { ...l, sessionNotes: text } : l))
    );
    clearSessionNotesTimer(lessonId);
    sessionNotesSaveTimersRef.current[lessonId] = setTimeout(() => {
      void persistSessionNotes(lessonId, text);
      delete sessionNotesSaveTimersRef.current[lessonId];
    }, 700);
  };

  const onSessionNotesBlur = (lessonId: string, text: string) => {
    clearSessionNotesTimer(lessonId);
    void persistSessionNotes(lessonId, text);
  };

  const toggleAddStudentPanel = (lessonId: string) => {
    setAddStudentLessonId((current) => (current === lessonId ? null : lessonId));
  };

  const handleAddStudentToLesson = async (lesson: Lesson, student: User) => {
    const existingIds = lesson.studentIds ?? [];
    if (existingIds.includes(student.id)) return;
    try {
      const updatedStudentIds = [...existingIds, student.id];
      await updateLesson(lesson.id, { studentIds: updatedStudentIds });
      setLessons((prev) =>
        prev.map((l) => (l.id === lesson.id ? { ...l, studentIds: updatedStudentIds } : l))
      );
      setStudentsById((prev) => ({ ...prev, [student.id]: student }));
    } catch (e) {
      console.error('Failed to add student to lesson:', e);
      setError('Could not add student. Try again.');
    }
  };

  const handleStartLesson = async (lessonId: string) => {
    try {
      await startLesson(lessonId);
      setLessons((prev) =>
        prev.map((lesson) => (lesson.id === lessonId ? { ...lesson, status: 'in_progress' } : lesson))
      );
    } catch (err: unknown) {
      console.error('Error starting lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to start lesson');
    }
  };

  const handleCompleteLesson = async (lessonId: string) => {
    try {
      await completeLesson(lessonId);
      const completedLesson = lessons.find((l) => l.id === lessonId);
      if (completedLesson) {
        setSelectedLesson(completedLesson);
        setShowFeedback(true);
      }
      setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));
      onLessonComplete();
    } catch (err: unknown) {
      console.error('Error completing lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete lesson');
    }
  };

  const handleFeedbackSubmit = () => {
    setShowFeedback(false);
    setSelectedLesson(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error && lessons.length === 0) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 rounded-lg flex items-center gap-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && lessons.length > 0 && (
        <div className="p-3 text-sm bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 rounded-lg border border-amber-200 dark:border-amber-800">
          {error}
          <button
            type="button"
            className="ml-2 underline font-medium"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {showTimeTracking && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Time Tracking</h2>
              <p className="text-gray-600 dark:text-gray-400">Track your working hours</p>
            </div>
            <ClockInOutButton instructorId={instructorId} />
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden dark:bg-gray-900 dark:border-gray-800">
        <div className="px-3 py-3 sm:px-6 sm:py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active &amp; today&apos;s lessons</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            In-progress sessions (any day) and everything scheduled for today.
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
                  <div className="mb-3 sm:mb-4">
                    <button
                      type="button"
                      onClick={() => setDetailsLesson(lesson)}
                      className="group w-full min-w-0 text-left rounded-xl -mx-0.5 sm:-m-1 p-0.5 sm:p-1 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                    >
                      <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300">
                        {lesson.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-4 h-4 shrink-0" />
                          {dateLabel}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-4 h-4 shrink-0" />
                          {lesson.startTime && lesson.endTime
                            ? `${lesson.startTime} – ${lesson.endTime}`
                            : 'Time TBD'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-4 h-4 shrink-0" />
                          {lesson.type}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Target className="w-4 h-4 shrink-0" />
                          {lesson.skillLevel?.replace('_', ' ') ?? '—'}
                        </span>
                      </div>
                      <span className="mt-2 inline-block text-xs font-medium text-blue-600 dark:text-blue-400">
                        View full details
                      </span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                    {(lesson.skillsFocus ?? []).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                      Students
                    </p>
                    {(lesson.studentIds ?? []).length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        No students on this session yet.
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      {(lesson.studentIds ?? []).map((studentId) => {
                        const student = studentsById[studentId];
                        return (
                          <div
                            key={studentId}
                            className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 pl-1 pr-2 sm:pr-3 py-1.5 min-w-0 max-w-full"
                          >
                            <img
                              src={avatarSrc(student ?? undefined)}
                              alt=""
                              className="w-9 h-9 shrink-0 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {student?.name ?? 'Loading…'}
                              </p>
                              {student?.email && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {student.email}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => toggleAddStudentPanel(lesson.id)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800/80 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-950/70 transition-colors"
                      >
                        {addStudentLessonId === lesson.id ? (
                          <Minus className="w-4 h-4 shrink-0" />
                        ) : (
                          <Plus className="w-4 h-4 shrink-0" />
                        )}
                        {addStudentLessonId === lesson.id ? 'Close add student' : 'Add student'}
                      </button>
                    </div>
                    {addStudentLessonId === lesson.id && (
                      <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-2 sm:p-3">
                        <StudentSearch
                          onStudentSelect={(s) => void handleAddStudentToLesson(lesson, s)}
                          selectedStudents={(lesson.studentIds ?? [])
                            .map((id) => studentsById[id])
                            .filter((u): u is User => u != null)}
                          maxStudents={lesson.maxStudents}
                          placeholder="Search students to add to this lesson…"
                          showSelected={false}
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-2 w-full max-w-xl rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950/50 p-2.5 sm:p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <label
                        htmlFor={`session-notes-${lesson.id}`}
                        className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5"
                      >
                        <StickyNote className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        Session note
                      </label>
                      {savingNotesLessonId === lesson.id && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                          Saving…
                        </span>
                      )}
                    </div>
                    <textarea
                      id={`session-notes-${lesson.id}`}
                      value={lesson.sessionNotes ?? ''}
                      onChange={(e) => onSessionNotesChange(lesson.id, e.target.value)}
                      onBlur={(e) => onSessionNotesBlur(lesson.id, e.target.value)}
                      rows={4}
                      placeholder="Technique reminders, safety, homework for next time…"
                      className="w-full rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/80 focus:border-transparent resize-y min-h-[100px]"
                    />
                  </div>

                  <div className="mt-3 sm:mt-4 flex flex-wrap w-full justify-center">
                    {lesson.status === 'scheduled' ? (
                      <button
                        type="button"
                        onClick={() => handleStartLesson(lesson.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                      >
                        <Play className="w-4 h-4" />
                        Start Lesson
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCompleteLesson(lesson.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Complete Lesson
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-3 py-5 sm:p-6 text-center text-gray-500 dark:text-gray-400">
              No in-progress lessons and nothing on your schedule for today.
            </div>
          )}
        </div>
      </div>

      {showFeedback && selectedLesson && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFeedback(false)} />

          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative max-w-4xl w-full">
              <EnhancedFeedbackForm
                lessonId={selectedLesson.id}
                studentId={selectedLesson.studentIds?.[0] ?? ''}
                onFeedbackSubmitted={handleFeedbackSubmit}
                onCancel={() => setShowFeedback(false)}
                isOpen={showFeedback}
              />
            </div>
          </div>
        </div>
      )}

      {detailsLesson && authUser && (
        <LessonDetailsModal
          lesson={{
            ...detailsLesson,
            instructor: authUser
          }}
          onClose={() => setDetailsLesson(null)}
          onLessonUpdate={() => {
            void loadLessons({ silent: true });
          }}
        />
      )}
    </div>
  );
}
