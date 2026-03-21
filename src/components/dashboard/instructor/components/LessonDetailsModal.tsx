import { useEffect, useState } from 'react';
import { Users, Calendar, Clock, Target, MapPin, X, MessageSquare, Trash2, Plus } from 'lucide-react';
import type { User, Lesson } from '../../../../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { completeLesson, startLesson } from '../../../../services/lessons';
import { ResponsiveModalPanel } from '../../../common/ResponsiveModalPanel';

interface LessonDetailsModalProps {
  lesson: Lesson | null;
  onClose: () => void;
  onAddStudent: (lessonId: string, currentStudentIds: string[], maxStudents: number) => void;
  onRemoveStudent: (lessonId: string, studentId: string, studentName: string) => void;
}

export function LessonDetailsModal({ lesson, onClose, onAddStudent, onRemoveStudent }: LessonDetailsModalProps) {
  const [students, setStudents] = useState<User[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackStudentIndex, setFeedbackStudentIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [feedbackComplete, setFeedbackComplete] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const loadStudents = async () => {
      if (!lesson) return;
      setIsLoadingStudents(true);
      try {
        const studentPromises = lesson.studentIds.map(async (studentId) => {
          const studentDoc = await getDocs(query(
            collection(db, 'users'),
            where('id', '==', studentId)
          ));
          return studentDoc.docs[0]?.data() as User;
        });
        const loadedStudents = (await Promise.all(studentPromises)).filter(Boolean);
        setStudents(loadedStudents);
      } catch (error) {
        console.error('Error loading students:', error);
      } finally {
        setIsLoadingStudents(false);
      }
    };
    loadStudents();
  }, [lesson]);

  if (!lesson) return null;

  const getLevelDescription = (level: string) => {
    switch (level) {
      case 'first_time':
        return 'Level 1: First Time on Snow';
      case 'developing_turns':
        return 'Level 2: Developing Basic Turns';
      case 'linking_turns':
        return 'Level 3: Linking Turns';
      case 'confident_turns':
        return 'Level 4: Confident Turn Control';
      case 'consistent_blue':
        return 'Level 5: Consistent Blue Runs';
      default:
        return level;
    }
  };

  const canStart = lesson.status === 'scheduled' || lesson.status === 'available';
  const canComplete = lesson.status === 'in_progress';

  const handleStartLesson = async () => {
    setIsStarting(true);
    try {
      await startLesson(lesson.id);
      onClose();
    } catch (error) {
      console.error('Error starting lesson:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleCompleteLesson = () => {
    setShowFeedbackForm(true);
    setFeedbackStudentIndex(0);
    setFeedbackComplete(false);
  };

  const handleFeedbackSubmitted = async () => {
    if (feedbackStudentIndex < students.length - 1) {
      setFeedbackStudentIndex(feedbackStudentIndex + 1);
    } else {
      setShowFeedbackForm(false);
      setIsCompleting(true);
      await completeLesson(lesson.id);
      setIsCompleting(false);
      setFeedbackComplete(true);
    }
  };

  return (
    <ResponsiveModalPanel onClose={onClose} labelledBy="instructor-lesson-details-title">
      <div className="flex shrink-0 items-center justify-end border-b border-gray-200 bg-white px-2 py-2 dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:inset-x-0 sm:top-0 sm:z-20 sm:border-0 sm:bg-transparent sm:px-4 sm:py-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-6 pt-2 sm:px-6 sm:pb-6 sm:pt-16">
        <div className="mb-5 flex items-start gap-3 sm:mb-6 sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 sm:h-12 sm:w-12">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="instructor-lesson-details-title"
              className="break-words text-xl font-bold leading-tight text-gray-900 dark:text-white sm:text-2xl"
            >
              {lesson.title}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
              {new Date(lesson.date).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <div className="mb-1 flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Session Type</span>
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{lesson.sessionType || 'morning'}</p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <div className="mb-1 flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Target className="h-4 w-4" />
              <span>Level</span>
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{getLevelDescription(lesson.skillLevel)}</p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <div className="mb-1 flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4" />
              <span>Type</span>
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{lesson.type}</p>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <div className="mb-1 flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4" />
              <span>Location</span>
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Main Lodge</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 dark:border-gray-800">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Students</h3>
            {lesson.type !== 'private' && students.length < lesson.maxStudents && (
              <button
                type="button"
                onClick={() => onAddStudent(lesson.id, lesson.studentIds, lesson.maxStudents)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm text-white transition-colors hover:bg-blue-700 sm:w-auto sm:py-1.5"
              >
                <Plus className="h-4 w-4" />
                Add Student
              </button>
            )}
          </div>

          {isLoadingStudents ? (
            <div className="py-4 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          ) : students.length > 0 ? (
            <div className="space-y-3">
              {students.map(student => (
                <div
                  key={student.id}
                  role="button"
                  tabIndex={0}
                  className="flex cursor-pointer items-center justify-between rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700/80"
                  onClick={() => setSelectedStudent(student)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedStudent(student);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{student.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Level: {student.level}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/messages?student=${student.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-200"
                    >
                      <MessageSquare className="h-5 w-5" />
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveStudent(lesson.id, student.id, student.name);
                      }}
                      className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950/50"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {students.length} of {lesson.maxStudents} students
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 p-4 text-center text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              No students assigned yet
            </div>
          )}
        </div>

        {(lesson.skillsFocus?.length ?? 0) > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-6 dark:border-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Skills Focus</h3>
            <div className="flex flex-wrap gap-2">
              {(lesson.skillsFocus ?? []).map((skill, index) => (
                <span
                  key={index}
                  className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {lesson.notes && (
          <div className="mt-6 border-t border-gray-100 pt-6 dark:border-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Notes</h3>
            <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {lesson.notes}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 border-t border-gray-100 pt-6 dark:border-gray-800 sm:flex-row sm:justify-end sm:gap-3">
          {canStart && (
            <button
              type="button"
              onClick={handleStartLesson}
              disabled={isStarting}
              className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-white transition-colors hover:bg-green-700 disabled:opacity-50 sm:w-auto sm:py-2"
            >
              {isStarting ? 'Starting...' : 'Start Lesson'}
            </button>
          )}

          {canComplete && (
            <button
              type="button"
              onClick={handleCompleteLesson}
              disabled={isCompleting}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 sm:w-auto sm:py-2"
            >
              {isCompleting ? 'Completing...' : 'Complete Lesson'}
            </button>
          )}
        </div>
      </div>
    </ResponsiveModalPanel>
  );
}



