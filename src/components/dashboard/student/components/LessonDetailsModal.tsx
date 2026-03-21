import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Target, Users, MapPin, Star, MessageSquare, Edit, Trash2, Plus, Play, StickyNote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, Lesson, LessonFeedback, StudentReview } from '../../../../types';
import { EnhancedFeedbackForm } from '../../../lessons/EnhancedFeedbackForm';
import { InstructorProfileModal } from '../../../instructor/InstructorProfileModal';
import { buildInstructorProfile } from '../../../../utils/instructorProfile';
import { useAuth } from '../../../../context/AuthContext';
import { completeLesson, startLesson } from '../../../../services/lessons';
import { getLessonDayKey, isLessonUpcoming } from '../../../../utils/lessonDate';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { StudentProfileModal } from '../../../student/StudentProfileModal';
import { StudentSearch } from '../../../common/StudentSearch';
import { ResponsiveModalPanel } from '../../../common/ResponsiveModalPanel';
import { StudentReviewForm } from '../../../lessons/StudentReviewForm';
import { CancelLessonModal } from './CancelLessonModal';
import { formatSkillLabel, getSkillDescription } from '../../../../utils/skillDescriptions';

interface LessonDetailsModalProps {
  lesson: (Lesson & { instructor?: User }) | null;
  onClose: () => void;
  onLessonUpdate: () => void;
}

export function LessonDetailsModal({ lesson, onClose, onLessonUpdate }: LessonDetailsModalProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showStudentReviewForm, setShowStudentReviewForm] = useState(false);
  const [showCancelLessonModal, setShowCancelLessonModal] = useState(false);
  const [feedbackStudentId, setFeedbackStudentId] = useState<string | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<User | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<any | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isBeginningLesson, setIsBeginningLesson] = useState(false);
  const [feedbackDetails, setFeedbackDetails] = useState<LessonFeedback[] | null>(null);
  const [studentIdsWithFeedback, setStudentIdsWithFeedback] = useState<Set<string>>(new Set());
  const [feedbackToEdit, setFeedbackToEdit] = useState<LessonFeedback | null>(null);
  const [skillTipModal, setSkillTipModal] = useState<{ title: string; body: string } | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const openSkillDescription = (raw: string) => {
    setSkillTipModal({
      title: formatSkillLabel(raw),
      body: getSkillDescription(raw)
    });
  };

  useEffect(() => {
    setSkillTipModal(null);
  }, [lesson?.id]);

  const handleMessageInstructor = () => {
    if (!lesson?.instructor) return;

    if (!user) {
      const confirmed = window.confirm('Please sign in to message instructors. Would you like to sign in now?');
      if (confirmed) {
        onClose();
        navigate('/');
      }
      return;
    }

    onClose();

    const profile = buildInstructorProfile(lesson.instructor as User);

    setTimeout(() => {
      navigate('/messages', {
        state: {
          selectedInstructor: {
            id: lesson.instructor?.id,
            name: lesson.instructor?.name,
            image: profile.image,
            location: profile.location,
            specialties: profile.specialties,
            languages: profile.languages,
            experience: profile.experience,
            price: profile.price
          }
        }
      });
    }, 0);
  };

  useEffect(() => {
    const loadStudents = async () => {
      if (!lesson || !lesson.studentIds || lesson.studentIds.length === 0) {
        setStudents([]);
        setIsLoadingStudents(false);
        return;
      }

      setIsLoadingStudents(true);
      try {
        const studentPromises = lesson.studentIds.map(async (studentId) => {
          const snapshot = await getDocs(
            query(
              collection(db, 'users'),
              where('id', '==', studentId)
            )
          );
          const doc = snapshot.docs[0];
          return doc ? ({ id: doc.id, ...doc.data() } as User) : null;
        });

        const loaded = (await Promise.all(studentPromises)).filter(
          (s): s is User => Boolean(s)
        );
        setStudents(loaded);
      } catch (error) {
        console.error('Error loading lesson students:', error);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    loadStudents();
  }, [lesson]);

  // Load feedback documents when lesson.feedback is array of IDs (e.g. from instructor dashboard)
  useEffect(() => {
    const feedback = lesson?.feedback;
    if (!lesson || !feedback || !Array.isArray(feedback)) {
      setFeedbackDetails(null);
      setStudentIdsWithFeedback(new Set());
      return;
    }
    const first = feedback[0];
    if (typeof first === 'string') {
      const ids = feedback as unknown as string[];
      let cancelled = false;
      (async () => {
        try {
          const list = await Promise.all(
            ids.map(async (id) => {
              const snap = await getDoc(doc(db, 'lessonFeedback', id));
              if (!snap.exists()) return null;
              return { id: snap.id, ...snap.data() } as LessonFeedback;
            })
          );
          const valid = list.filter((f): f is LessonFeedback => f != null);
          if (!cancelled) {
            setFeedbackDetails(valid);
            setStudentIdsWithFeedback(new Set(valid.map((f) => f.studentId).filter(Boolean)));
          }
        } catch (e) {
          console.error('Error loading feedback:', e);
          if (!cancelled) setFeedbackDetails([]);
        }
      })();
      return () => { cancelled = true; };
    }
    const asList = feedback as LessonFeedback[];
    setFeedbackDetails(asList);
    setStudentIdsWithFeedback(new Set(asList.map((f) => f.studentId).filter(Boolean)));
  }, [lesson?.id, lesson?.feedback]);

  if (!lesson) return null;

  const canCancel = lesson.status === 'scheduled';
  const studentCount = lesson.studentIds?.length ?? 0;
  const feedbackCount = Array.isArray(lesson.feedback) ? lesson.feedback.length : 0;
  const hasFeedbackForAllStudents = studentCount > 0 && feedbackCount >= studentCount;
  const canCompleteLesson =
    user?.role === 'instructor' &&
    (lesson.status === 'scheduled' || lesson.status === 'in_progress') &&
    hasFeedbackForAllStudents;
  const lessonInstructorDocId = lesson.instructorId ?? lesson.instructor?.id;
  const viewerIsLessonInstructor =
    user?.role === 'instructor' &&
    Boolean(user.id && lessonInstructorDocId && String(user.id) === String(lessonInstructorDocId));
  const canStartLessonStatus =
    lesson.status === 'scheduled' ||
    (lesson.status === 'available' && (lesson.studentIds?.length ?? 0) > 0);
  /** Upcoming window, or date not parseable (still allow instructor to start). */
  const lessonStillOpenOnCalendar =
    isLessonUpcoming(lesson) || getLessonDayKey(lesson) === '';
  const canBeginLesson =
    viewerIsLessonInstructor && canStartLessonStatus && lessonStillOpenOnCalendar;
  const canLeaveFeedback =
    user?.role === 'instructor' &&
    (lesson.status === 'in_progress' || lesson.status === 'completed') &&
    studentCount > 0;
  const studentIdForReview = user?.role === 'student' && user?.id ? user.id : null;
  const enrolledAsStudent = Boolean(
    studentIdForReview && (lesson.studentIds ?? []).includes(studentIdForReview)
  );
  const alreadyLeftStudentReview = Boolean(
    studentIdForReview &&
      (lesson.studentReviews ?? []).some((r) => r.studentId === studentIdForReview)
  );
  const canLeaveStudentReview = Boolean(
    studentIdForReview &&
      enrolledAsStudent &&
      lesson.status === 'completed' &&
      !alreadyLeftStudentReview
  );
  const hasFeedback = lesson.feedback && lesson.feedback.length > 0;

  // Students only see their own feedback; instructors see all
  const displayFeedbackList =
    user?.role === 'student' && user?.id
      ? (feedbackDetails ?? []).filter((f) => f.studentId === user.id)
      : (feedbackDetails ?? []);

  const handleCompleteLesson = async () => {
    if (!lesson || user?.role !== 'instructor') return;
    setIsCompleting(true);
    try {
      await completeLesson(lesson.id);
      onLessonUpdate();
      onClose();
    } catch (err) {
      console.error('Error completing lesson:', err);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleBeginLesson = async () => {
    if (!lesson || !canBeginLesson) return;
    setIsBeginningLesson(true);
    try {
      await startLesson(lesson.id);
      onLessonUpdate();
    } catch (err) {
      console.error('Error starting lesson:', err);
    } finally {
      setIsBeginningLesson(false);
    }
  };

  const openFeedbackForStudent = (studentId: string) => {
    setFeedbackStudentId(studentId);
    setFeedbackToEdit(null);
    setShowReviewForm(true);
  };

  const openFeedbackForEdit = (feedback: LessonFeedback) => {
    setFeedbackToEdit(feedback);
    setFeedbackStudentId(feedback.studentId);
    setShowReviewForm(true);
  };

  const handleRemoveStudentFromLesson = async (student: User) => {
    if (!user || user.role !== 'instructor') return;
    const confirmed = window.confirm(
      `Are you sure you want to remove ${student.name} from this lesson?\n\nThis will remove them from the roster for this session.`
    );
    if (!confirmed) return;

    try {
      const lessonRef = doc(db, 'lessons', lesson.id);
      const updatedStudentIds = (lesson.studentIds || []).filter(id => id !== student.id);
      await updateDoc(lessonRef, { studentIds: updatedStudentIds });
      setStudents(prev => prev.filter(s => s.id !== student.id));
      onLessonUpdate();
    } catch (error) {
      console.error('Error removing student from lesson:', error);
    }
  };

  const handleAddStudentToLesson = async (student: User) => {
    if (!user || user.role !== 'instructor') return;
    if (!lesson) return;

    const existingIds = lesson.studentIds || [];
    if (existingIds.includes(student.id)) {
      return;
    }

    try {
      const lessonRef = doc(db, 'lessons', lesson.id);
      const updatedStudentIds = [...existingIds, student.id];
      await updateDoc(lessonRef, { studentIds: updatedStudentIds });
      setStudents(prev => [...prev, student]);
      setIsAddingStudent(false);
      onLessonUpdate();
    } catch (error) {
      console.error('Error adding student to lesson:', error);
    }
  };

  return (
    <>
      <ResponsiveModalPanel onClose={onClose} labelledBy="lesson-details-title">
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
                    id="lesson-details-title"
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
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                    {lesson.sport === 'snowboarding' ? 'Snowboard' : 'Ski'}
                  </p>
                </div>
              </div>

              {/* Lesson Details Grid — 2×2 on all breakpoints; compact on small screens */}
              <div className="mb-6 grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800 sm:p-3 md:p-4">
                  <div className="mb-0.5 flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 sm:mb-1 sm:gap-2 sm:text-sm">
                    <Clock className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                    <span>Time</span>
                  </div>
                  <p className="break-words text-sm font-medium leading-snug text-gray-900 dark:text-gray-100 sm:text-base md:text-lg">
                    {lesson.startTime && lesson.endTime ? `${lesson.startTime} - ${lesson.endTime}` : 'Time not specified'}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800 sm:p-3 md:p-4">
                  <div className="mb-0.5 flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 sm:mb-1 sm:gap-2 sm:text-sm">
                    <Target className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                    <span className="leading-tight">Skill level</span>
                  </div>
                  <p className="break-words text-sm font-medium leading-snug text-gray-900 dark:text-gray-100 sm:text-base md:text-lg">
                    {lesson.skillLevel?.replace(/_/g, ' ') ?? '—'}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800 sm:p-3 md:p-4">
                  <div className="mb-0.5 flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 sm:mb-1 sm:gap-2 sm:text-sm">
                    <Users className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                    <span>Type</span>
                  </div>
                  <p className="break-words text-sm font-medium capitalize leading-snug text-gray-900 dark:text-gray-100 sm:text-base md:text-lg">
                    {lesson.type}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800 sm:p-3 md:p-4">
                  <div className="mb-0.5 flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 sm:mb-1 sm:gap-2 sm:text-sm">
                    <MapPin className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                    <span>Location</span>
                  </div>
                  <p className="break-words text-sm font-medium leading-snug text-gray-900 dark:text-gray-100 sm:text-base md:text-lg">
                    Main Lodge
                  </p>
                </div>
              </div>

              {lesson.instructor && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Instructor</h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (user?.role === 'student') {
                        setSelectedInstructor(lesson.instructor as User);
                      }
                    }}
                    onKeyDown={(event) => {
                      if ((event.key === 'Enter' || event.key === ' ') && user?.role === 'student') {
                        event.preventDefault();
                        setSelectedInstructor(lesson.instructor as User);
                      }
                    }}
                    className="flex items-center gap-4 rounded-xl px-3 py-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                  >
                    <img
                      src={lesson.instructor.avatar}
                      alt={lesson.instructor.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{lesson.instructor.name}</p>
                      <p className="text-gray-600 dark:text-gray-400">{lesson.instructor.bio}</p>
                      {user?.role === 'student' && (
                        <span className="mt-2 inline-block text-sm font-medium text-blue-600 dark:text-blue-400">
                          View instructor profile
                        </span>
                      )}
                    </div>
                  </button>

                  {((lesson.studentIds?.length ?? 0) > 0 || user?.role === 'instructor') && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Students
                      </h4>
                      {isLoadingStudents ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading roster...</p>
                      ) : students.length > 0 ? (
                        <ul className="space-y-2">
                          {students.map((student) => (
                            <li
                              key={student.id}
                              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/60"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  const profileStudent = {
                                    id: student.id,
                                    name: student.name,
                                    image: (student as any).avatar || (student as any).image || '',
                                    email: student.email || '',
                                    level: (student as any).level || 'Unknown',
                                  };
                                  setSelectedStudentForProfile(profileStudent);
                                }}
                                className="flex items-center gap-3 text-left"
                              >
                                <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  {((student as any).avatar || (student as any).image) ? (
                                    <img
                                      src={(student as any).avatar || (student as any).image}
                                      alt={student.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                      {student.name?.charAt(0) || '?'}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {student.name}
                                  </p>
                                  {student.email && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {student.email}
                                    </p>
                                  )}
                                </div>
                              </button>
                              <div className="flex items-center gap-2">
                                {user?.role === 'instructor' && canLeaveFeedback && (
                                  studentIdsWithFeedback.has(student.id) ? (
                                    <span className="p-2 text-gray-400 dark:text-gray-500 text-sm font-medium cursor-default" title="Feedback already submitted">
                                      Leave feedback
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openFeedbackForStudent(student.id);
                                      }}
                                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-sm font-medium"
                                    >
                                      Leave feedback
                                    </button>
                                  )
                                )}
                                <a
                                  href={`/messages?student=${student.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                  title="Message student"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </a>
                                {user?.role === 'instructor' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveStudentFromLesson(student);
                                    }}
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No students enrolled yet.
                        </p>
                      )}

                      {user?.role === 'instructor' && (
                        <div className="mt-4 space-y-3">
                          <button
                            type="button"
                            onClick={() => setIsAddingStudent(prev => !prev)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            {isAddingStudent ? 'Close Add Students' : 'Add Students'}
                          </button>

                          {isAddingStudent && (
                            <div className="mt-2">
                              <StudentSearch
                                onStudentSelect={handleAddStudentToLesson}
                                selectedStudents={students}
                                placeholder="Search and add students to this lesson..."
                                showSelected={false}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {lesson.notes && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notes</h3>
                  <p className="text-gray-600 dark:text-gray-400">{lesson.notes}</p>
                </div>
              )}

              {user?.role === 'instructor' && lesson.sessionNotes?.trim() && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <StickyNote className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    Session notes
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    From your active lesson panel — visible only to you.
                  </p>
                  <div className="rounded-lg border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/30 px-4 py-3 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {lesson.sessionNotes}
                  </div>
                </div>
              )}

              {hasFeedback && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Instructor Feedback</h3>
                  {feedbackDetails === null ? (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-4 text-center text-gray-500 dark:text-gray-400">
                      Loading feedback…
                    </div>
                  ) : displayFeedbackList.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-4 text-gray-700 dark:text-gray-300">
                      {user?.role === 'student'
                        ? "Your feedback for this lesson hasn't been submitted yet."
                        : feedbackCount > 0
                          ? 'Feedback submitted for this lesson.'
                          : 'No feedback yet.'}
                    </div>
                  ) : displayFeedbackList.map((feedback: LessonFeedback, index: number) => {
                    const perf = feedback?.performance;
                    const studentName = feedback?.studentId && students.find((s) => s.id === feedback.studentId)?.name;
                    const hasAnyContent = perf || (feedback.strengths && feedback.strengths.length > 0) || (feedback.areasForImprovement && feedback.areasForImprovement.length > 0) || feedback.instructorNotes || feedback.homework || feedback.progressUpdate || feedback.sport;
                    return (
                    <div key={feedback?.id ?? index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-4">
                      {!hasAnyContent && (
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-gray-700 dark:text-gray-300">
                            Feedback submitted{studentName ? ` for ${studentName}` : ''}.
                          </p>
                          {user?.role === 'instructor' && (
                            <button
                              type="button"
                              onClick={() => openFeedbackForEdit(feedback)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:text-blue-400 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                      {hasAnyContent && (
                        <>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        {studentName && (
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {studentName}
                          </p>
                        )}
                        {user?.role === 'instructor' && (
                          <button
                            type="button"
                            onClick={() => openFeedbackForEdit(feedback)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:text-blue-400 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                      </div>
                      {(Boolean(feedback.strengths?.length) ||
                        Boolean(feedback.areasForImprovement?.length) ||
                        Boolean(feedback.progressUpdate?.skillsImproved?.length) ||
                        Boolean(feedback.progressUpdate?.newSkillsLearned?.length)) && (
                        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                          Tap any skill below for a short description.
                        </p>
                      )}
                      {perf && (
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Performance Assessment</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Technique</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= (perf.technique ?? 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Control</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= (perf.control ?? 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Confidence</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= (perf.confidence ?? 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Safety</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= (perf.safety ?? 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Overall</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= (perf.overall ?? 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      )}

                      <div className="space-y-4">
                        {feedback.strengths && feedback.strengths.length > 0 && (
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Strengths:</span>
                            <ul className="list-none space-y-1 pl-0">
                              {feedback.strengths.map((strength, strengthIndex) => (
                                <li key={strengthIndex}>
                                  <button
                                    type="button"
                                    onClick={() => openSkillDescription(strength)}
                                    className="w-full rounded border border-green-100 bg-green-50 p-2 text-left text-green-700 transition hover:ring-2 hover:ring-green-400/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-green-800/60 dark:bg-green-900/20 dark:text-green-200 dark:hover:ring-green-600/35"
                                  >
                                    {strength}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {feedback.areasForImprovement && feedback.areasForImprovement.length > 0 && (
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Areas for Improvement:</span>
                            <ul className="list-none space-y-1 pl-0">
                              {feedback.areasForImprovement.map((area, areaIndex) => (
                                <li key={areaIndex}>
                                  <button
                                    type="button"
                                    onClick={() => openSkillDescription(area)}
                                    className="w-full rounded border border-orange-100 bg-orange-50 p-2 text-left text-orange-700 transition hover:ring-2 hover:ring-orange-400/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-orange-800/60 dark:bg-orange-900/20 dark:text-orange-200 dark:hover:ring-orange-600/35"
                                  >
                                    {area}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {feedback.instructorNotes && (
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Instructor Notes:</span>
                            <p className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900/40 p-3 rounded border border-gray-200 dark:border-gray-700">{feedback.instructorNotes}</p>
                          </div>
                        )}

                        {feedback.homework && (
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">Homework:</span>
                            <p className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900/40 p-3 rounded border border-gray-200 dark:border-gray-700">{feedback.homework}</p>
                          </div>
                        )}
                      </div>

                      {feedback.progressUpdate && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Progress Update</h4>
                          <div className="space-y-3">
                            {feedback.progressUpdate.skillsImproved && feedback.progressUpdate.skillsImproved.length > 0 && (
                              <div>
                                <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Skills Improved:</span>
                                <ul className="list-none space-y-1 pl-0">
                                  {feedback.progressUpdate.skillsImproved.map((skill, skillIndex) => (
                                    <li key={skillIndex}>
                                      <button
                                        type="button"
                                        onClick={() => openSkillDescription(skill)}
                                        className="w-full rounded border border-blue-100 bg-blue-50 p-2 text-left text-blue-700 transition hover:ring-2 hover:ring-blue-400/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-200 dark:hover:ring-blue-600/35"
                                      >
                                        {skill}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {feedback.progressUpdate.newSkillsLearned && feedback.progressUpdate.newSkillsLearned.length > 0 && (
                              <div>
                                <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">New Skills Learned:</span>
                                <ul className="list-none space-y-1 pl-0">
                                  {feedback.progressUpdate.newSkillsLearned.map((skill, skillIndex) => (
                                    <li key={skillIndex}>
                                      <button
                                        type="button"
                                        onClick={() => openSkillDescription(skill)}
                                        className="w-full rounded border border-purple-100 bg-purple-50 p-2 text-left text-purple-700 transition hover:ring-2 hover:ring-purple-400/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-purple-800/60 dark:bg-purple-900/20 dark:text-purple-200 dark:hover:ring-purple-600/35"
                                      >
                                        {skill}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {feedback.progressUpdate.levelUp && (
                              <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                <span className="text-green-800 dark:text-green-200 font-medium">🎉 Level Up!</span>
                                {feedback.progressUpdate.newLevel && (
                                  <span className="ml-2 text-green-700 dark:text-green-200">New level: {feedback.progressUpdate.newLevel}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {feedback.sport && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Sport Focus: </span>
                          <span className="font-medium text-gray-900 dark:text-white capitalize">{feedback.sport}</span>
                        </div>
                      )}
                        </>
                      )}
                    </div>
                  );
                  })}
                </div>
              )}

              {/* Student Reviews */}
              {lesson.studentReviews && lesson.studentReviews.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Student Reviews</h3>
                  <div className="space-y-4">
                    {lesson.studentReviews.map((review: StudentReview, index: number) => (
                      <div key={index} className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{review.rating}/5</span>
                        </div>
                        <p className="text-gray-900 dark:text-gray-100">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 border-t border-gray-100 pt-6 dark:border-gray-800">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                  {canBeginLesson && (
                    <button
                      type="button"
                      onClick={handleBeginLesson}
                      disabled={isBeginningLesson}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-white transition-colors hover:bg-amber-700 disabled:opacity-50 sm:w-auto sm:py-2"
                    >
                      <Play className="w-4 h-4" />
                      {isBeginningLesson ? 'Starting…' : 'Begin lesson'}
                    </button>
                  )}
                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => setShowCancelLessonModal(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-white transition-colors hover:bg-red-700 sm:w-auto sm:py-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Cancel Lesson
                    </button>
                  )}
                  
                  {canLeaveFeedback && (
                    <button
                      type="button"
                      onClick={() => {
                        setFeedbackStudentId(null);
                        setShowReviewForm(true);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-white transition-colors hover:bg-blue-700 sm:w-auto sm:py-2"
                    >
                      <Edit className="w-4 h-4" />
                      Leave Feedback
                    </button>
                  )}

                  {canCompleteLesson && (
                    <button
                      type="button"
                      onClick={handleCompleteLesson}
                      disabled={isCompleting}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 sm:w-auto sm:py-2"
                    >
                      {isCompleting ? 'Completing...' : 'Complete Lesson'}
                    </button>
                  )}

                  {user?.role === 'student' && (
                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                      <button
                        type="button"
                        onClick={handleMessageInstructor}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-600 px-4 py-2.5 text-white transition-colors hover:bg-gray-700 sm:w-auto sm:py-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Message Instructor
                      </button>
                      {canLeaveStudentReview && (
                        <button
                          type="button"
                          onClick={() => setShowStudentReviewForm(true)}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-white transition-colors hover:bg-green-700 sm:w-auto sm:py-2"
                        >
                          <Star className="w-4 h-4" />
                          Leave review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
        </div>
      </ResponsiveModalPanel>

      {skillTipModal && (
        <ResponsiveModalPanel
          nested
          onClose={() => setSkillTipModal(null)}
          labelledBy="lesson-skill-tip-title"
          maxWidthClass="sm:max-w-lg"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h2
              id="lesson-skill-tip-title"
              className="pr-2 text-lg font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {skillTipModal.title}
            </h2>
            <button
              type="button"
              onClick={() => setSkillTipModal(null)}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto p-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {skillTipModal.body}
          </div>
        </ResponsiveModalPanel>
      )}

      {showCancelLessonModal && lesson && (
        <CancelLessonModal
          lesson={lesson}
          onClose={() => setShowCancelLessonModal(false)}
          onCancel={() => {
            setShowCancelLessonModal(false);
            onLessonUpdate();
            onClose();
          }}
        />
      )}

      {showStudentReviewForm && user?.id && lesson && (
        <ResponsiveModalPanel
          onClose={() => setShowStudentReviewForm(false)}
          labelledBy="student-lesson-review-title"
        >
          <h2 id="student-lesson-review-title" className="sr-only">
            Rate your lesson
          </h2>
          <div className="max-h-[min(90dvh,40rem)] overflow-y-auto px-4 pb-6 pt-4 sm:px-6 sm:pt-6">
            <StudentReviewForm
              lessonId={lesson.id}
              studentId={user.id}
              onClose={() => setShowStudentReviewForm(false)}
              onSubmit={() => {
                setShowStudentReviewForm(false);
                onLessonUpdate();
              }}
            />
          </div>
        </ResponsiveModalPanel>
      )}

      {/* Instructor feedback */}
      {showReviewForm && (
        <EnhancedFeedbackForm
          lessonId={lesson.id}
          studentId={feedbackStudentId ?? lesson.studentIds?.[0] ?? ''}
          isOpen={true}
          existingFeedback={feedbackToEdit}
          defaultSport={lesson.sport ?? 'skiing'}
          onCancel={() => {
            setShowReviewForm(false);
            setFeedbackStudentId(null);
            setFeedbackToEdit(null);
          }}
          onFeedbackSubmitted={() => {
            setShowReviewForm(false);
            setFeedbackStudentId(null);
            setFeedbackToEdit(null);
            onLessonUpdate();
          }}
        />
      )}

      {user?.role === 'student' && selectedInstructor && (
        <InstructorProfileModal
          instructor={buildInstructorProfile(selectedInstructor)}
          onClose={() => setSelectedInstructor(null)}
        />
      )}

      {selectedStudentForProfile && (
        <StudentProfileModal
          student={selectedStudentForProfile}
          onClose={() => setSelectedStudentForProfile(null)}
        />
      )}
    </>
  );
}


