import React, { useState, useEffect, useMemo } from 'react';
import { User, Lesson } from '../../../types';
import {
  Users,
  BookOpen,
  Award,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Shield,
  UserPlus,
  History,
  ChevronRight,
  X,
  MessageSquare,
  Trash2,
  Star,
  GraduationCap,
  Calendar,
  Clock,
  Target,
  MapPin,
  Plus
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, onSnapshot, updateDoc, doc, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { getAvailabilityByInstructorId } from '../../../services/availability';
import type { Availability } from '../../../services/availability';
import { ClockInOutButton } from '../../timesheet/ClockInOutButton';
import { InstructorTimesheet } from '../../timesheet/InstructorTimesheet';
import { CreateLessonModal } from './CreateLessonModal';
import { AddStudentModal } from '../admin/AddStudentModal';
import { AvailabilityForm } from '../../instructor/AvailabilityForm';
import { AvailabilityCalendar } from '../../calendar/AvailabilityCalendar';
import { AvailabilityManager } from '../../calendar/AvailabilityManager';
import { EnhancedFeedbackForm } from '../../lessons/EnhancedFeedbackForm';
import { completeLesson, startLesson } from '../../../services/lessons';

// Helper function to calculate lesson duration in minutes
const calculateDuration = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
};


interface ActiveLesson extends Lesson {
  students: User[];
}

interface LessonDetailsModalProps {
  lesson: Lesson | null;
  onClose: () => void;
  onAddStudent: (lessonId: string, currentStudentIds: string[], maxStudents: number) => void;
  onRemoveStudent: (lessonId: string, studentId: string, studentName: string) => void;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

interface StudentDetailsModalProps {
  student: User;
  onClose: () => void;
}

function StudentDetailsModal({ student, onClose }: StudentDetailsModalProps) {
  const [pastLessons, setPastLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPastLessons = async () => {
      try {
        setIsLoading(true);
        const q = query(
          collection(db, 'lessons'),
          where('studentIds', 'array-contains', student.id),
          where('status', '==', 'completed'),
          orderBy('date', 'desc'),
          limit(5)
        );
        
        const snapshot = await getDocs(q);
        setPastLessons(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Lesson[]);
      } catch (error) {
        console.error('Error loading past lessons:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPastLessons();
  }, [student.id]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-6">
            {/* Student Header */}
            <div className="flex items-center gap-6 mb-8">
              <img
                src={student.avatar}
                alt={student.name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-50"
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{student.name}</h2>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-1">
                    <GraduationCap className="w-4 h-4" />
                    <span>{student.level}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>10 lessons completed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-gray-900">Current Level</h3>
                </div>
                <p className="text-lg font-semibold text-blue-600">{student.level}</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium text-gray-900">Average Rating</h3>
                </div>
                <p className="text-lg font-semibold text-green-600">4.8/5.0</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  <h3 className="font-medium text-gray-900">Achievements</h3>
                </div>
                <p className="text-lg font-semibold text-purple-600">5 earned</p>
              </div>
            </div>

            {/* Past Lessons */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Lessons</h3>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : pastLessons.length > 0 ? (
                <div className="space-y-4">
                  {pastLessons.map(lesson => (
                    <div key={lesson.id} className="p-4 border border-gray-100 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                        <span className="text-sm text-gray-500">
                          {new Date(lesson.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{lesson.startTime && lesson.endTime ? calculateDuration(lesson.startTime, lesson.endTime) : 180} mins</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          <span>{lesson.skillLevel}</span>
                        </div>
                      </div>
                      {lesson.notes && (
                        <p className="mt-2 text-sm text-gray-600">{lesson.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No past lessons found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          </div>
          
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Remove Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LessonDetailsModal({ lesson, onClose, onAddStudent, onRemoveStudent }: LessonDetailsModalProps) {
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
        return 'First Time on Snow';
      case 'developing_turns':
        return 'Developing Basic Turns';
      case 'linking_turns':
        return 'Linking Turns Together';
      case 'confident_turns':
        return 'Confident Turn Control';
      case 'consistent_blue':
        return 'Consistent on Blue Runs';
      default:
        return level;
    }
  };

  const canStart = lesson.status === 'scheduled' || lesson.status === 'available';
  const canComplete = lesson.status === 'in_progress';
  


  const handleStartLesson = async () => {
    console.log('Starting lesson:', lesson.id);
    setIsStarting(true);
    await startLesson(lesson.id);
    setIsStarting(false);
    // Optionally, refresh lesson state here
    window.location.reload(); // quick fix for now
  };
  const handleCompleteLesson = () => {
    console.log('Completing lesson:', lesson.id);
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
    <div className="fixed inset-0 z-40 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{lesson.title}</h2>
                <p className="text-gray-600">
                  {new Date(lesson.date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Duration</span>
                </div>
                                        <p className="text-lg font-medium text-gray-900">{lesson.startTime && lesson.endTime ? calculateDuration(lesson.startTime, lesson.endTime) : 180} minutes</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Target className="w-4 h-4" />
                  <span>Level</span>
                </div>
                <p className="text-lg font-medium text-gray-900">{getLevelDescription(lesson.skillLevel)}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Users className="w-4 h-4" />
                  <span>Type</span>
                </div>
                <p className="text-lg font-medium text-gray-900">{lesson.type}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span>Location</span>
                </div>
                <p className="text-lg font-medium text-gray-900">Main Lodge</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Students</h3>
                {lesson.type !== 'private' && students.length < lesson.maxStudents && (
                  <button
                    onClick={() => onAddStudent(lesson.id, lesson.studentIds, lesson.maxStudents)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Student
                  </button>
                )}
              </div>
              
              {isLoadingStudents ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : students.length > 0 ? (
                <div className="space-y-3">
                  {students.map(student => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-600">Level: {student.level}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/messages?student=${student.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveStudent(lesson.id, student.id, student.name);
                          }}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="text-sm text-gray-600 mt-2">
                    {students.length} of {lesson.maxStudents} students
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-lg text-gray-500">
                  No students assigned yet
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Focus</h3>
              <div className="flex flex-wrap gap-2">
                {lesson.skillsFocus.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {lesson.notes && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                <p className="text-gray-600">{lesson.notes}</p>
              </div>
            )}

            {/* Instructor Feedback */}
            {lesson.feedback && lesson.feedback.length > 0 && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructor Feedback</h3>
                <div className="space-y-4">
                  {lesson.feedback.map((feedback: any, index: number) => (
                    <div key={index} className="bg-green-50 rounded-lg p-4">
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-900 mb-2">Performance Assessment</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div>
                            <span className="text-sm text-gray-600 block mb-1">Technique</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= feedback.performance?.technique ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 block mb-1">Control</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= feedback.performance?.control ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 block mb-1">Confidence</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= feedback.performance?.confidence ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 block mb-1">Safety</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= feedback.performance?.safety ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 block mb-1">Overall</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= feedback.performance?.overall ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {feedback.skillAssessment?.recommendations && (
                        <div className="mb-3">
                          <span className="text-sm text-gray-600 block mb-1">Recommendations:</span>
                          <p className="text-gray-900 bg-white p-3 rounded border">{feedback.skillAssessment.recommendations}</p>
                        </div>
                      )}
                      
                      {feedback.instructorNotes && (
                        <div>
                          <span className="text-sm text-gray-600 block mb-1">Instructor Notes:</span>
                          <p className="text-gray-900 bg-white p-3 rounded border">{feedback.instructorNotes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Student Reviews */}
            {lesson.studentReviews && lesson.studentReviews.length > 0 && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Reviews</h3>
                <div className="space-y-4">
                  {lesson.studentReviews.map((review: any, index: number) => (
                    <div key={index} className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-gray-900">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}



            {/* Start Lesson Button */}
            {canStart && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleStartLesson}
                  className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                  disabled={isStarting}
                >
                  {isStarting ? 'Starting...' : 'Start Lesson'}
                </button>
              </div>
            )}

            {/* Complete Lesson Button */}
            {canComplete && students.length > 0 && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleCompleteLesson}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  disabled={isCompleting}
                >
                  {isCompleting ? 'Completing...' : 'Complete Lesson'}
                </button>
              </div>
            )}

            {/* Feedback Form Modal */}
            {showFeedbackForm && students[feedbackStudentIndex] && (
              <EnhancedFeedbackForm
                lessonId={lesson.id}
                studentId={students[feedbackStudentIndex].id}
                isOpen={showFeedbackForm}
                onFeedbackSubmitted={handleFeedbackSubmitted}
                onCancel={() => setShowFeedbackForm(false)}
              />
            )}

            {/* Feedback Complete Message */}
            {feedbackComplete && (
              <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg text-center">
                Feedback submitted and lesson marked as completed!
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}

export function InstructorDashboard({ user }: { user: User }) {
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [activeLesson, setActiveLesson] = useState<ActiveLesson | null>(null);
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  const [pastLessons, setPastLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedLessonForStudent, setSelectedLessonForStudent] = useState<{
    id: string;
    studentIds: string[];
    maxStudents: number;
  } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<{
    lessonId: string;
    studentId: string;
    studentName: string;
  } | null>(null);
  const [showTimesheet, setShowTimesheet] = useState(false);
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAvailabilityManager, setShowAvailabilityManager] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);

  // Memoize availability to prevent infinite loops in child components
  const memoizedAvailability = useMemo(() => availability, [availability]);

    const loadAvailability = async () => {
      try {
      console.log('Loading availability for instructor:', user.id);
        setIsLoadingAvailability(true);
        const slots = await getAvailabilityByInstructorId(user.id);
      console.log('Loaded availability slots:', slots);
        setAvailability(slots);
      } catch (error) {
        console.error('Error loading availability:', error);
      } finally {
        setIsLoadingAvailability(false);
      }
    };

  useEffect(() => {
    loadAvailability();
  }, [user.id]);

  useEffect(() => {
    // Listen for lessons
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for proper comparison

    const lessonQuery = query(
      collection(db, 'lessons'),
      where('instructorId', '==', user.id),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(lessonQuery, async (snapshot) => {
      const lessons = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lesson[];

      // Find current lesson and upcoming lessons
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
      const todayString = now.toISOString().split('T')[0];

      // Find active lesson (happening now)
      const current = lessons.find(lesson => {
        if (!lesson.time || !lesson.date || lesson.date !== todayString) return false;
        
        const [lessonHour, lessonMinutes] = lesson.time.split(':').map(Number);
        if (isNaN(lessonHour) || isNaN(lessonMinutes)) return false;
        
        const duration = lesson.startTime && lesson.endTime ? calculateDuration(lesson.startTime, lesson.endTime) : 180; // Default 3 hours
        const lessonEndHour = lessonHour + Math.floor(duration / 60);
        const lessonEndMinutes = lessonMinutes + (duration % 60);
        
        const lessonTimeString = lesson.time;
        const lessonEndTimeString = `${lessonEndHour.toString().padStart(2, '0')}:${lessonEndMinutes.toString().padStart(2, '0')}`;
        
        return currentTimeString >= lessonTimeString && currentTimeString <= lessonEndTimeString;
      });

      // Set upcoming lessons (excluding current lesson)
      const upcoming = lessons.filter(lesson => {
        if (!lesson.date || lesson.id === current?.id) return false;
        
        const lessonDate = new Date(lesson.date);
        return lessonDate >= now;
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Set past lessons
      const past = lessons.filter(lesson => {
        if (!lesson.date || lesson.id === current?.id) return false;
        
        const lessonDate = new Date(lesson.date);
        return lessonDate < now;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // If there's a current lesson, fetch student data
      if (current) {
        const studentPromises = current.studentIds.map(async (studentId) => {
          const studentDoc = await getDocs(query(
            collection(db, 'users'),
            where('id', '==', studentId)
          ));
          return studentDoc.docs[0]?.data() as User;
        });

        const students = (await Promise.all(studentPromises)).filter(Boolean);

        setActiveLesson({
          ...current,
          students
        });
      } else {
        setActiveLesson(null);
      }

      setUpcomingLessons(upcoming);
      setPastLessons(past.slice(0, 5)); // Only show last 5 past lessons
    });

    return () => unsubscribe();
  }, [user.id]);

  const handleAddStudent = (lessonId: string, currentStudentIds: string[], maxStudents: number) => {
    setSelectedLessonForStudent({
      id: lessonId,
      studentIds: currentStudentIds,
      maxStudents
    });
    setShowAddStudent(true);
    setSelectedLesson(null); // Close the lesson details modal
  };

  const handleRemoveStudent = async (lessonId: string, studentId: string, studentName: string) => {
    setStudentToRemove({ lessonId, studentId, studentName });
    setShowConfirmation(true);
  };

  const confirmRemoveStudent = async () => {
    if (!studentToRemove) return;

    try {
      const lessonRef = doc(db, 'lessons', studentToRemove.lessonId);
      const lesson = selectedLesson || activeLesson;
      
      if (!lesson) return;

      const updatedStudentIds = lesson.studentIds.filter(id => id !== studentToRemove.studentId);
      await updateDoc(lessonRef, {
        studentIds: updatedStudentIds
      });

      // Close the modal if it was the last student in a private lesson
      if (lesson.type === 'private' && updatedStudentIds.length === 0) {
        setSelectedLesson(null);
      }
    } catch (error) {
      console.error('Error removing student:', error);
    } finally {
      setStudentToRemove(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Achievement Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Top Rated Instructor!</h3>
              <p className="text-blue-100">You're among the highest-rated instructors this season.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCalendar(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              View Calendar
            </button>
            <button
              onClick={() => setShowAvailabilityManager(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
            >
              <Clock className="w-5 h-5" />
              Manage Availability
            </button>
            <button
              onClick={() => setShowCreateLesson(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Lesson
            </button>
          </div>
        </div>

        {/* Clock In/Out Button */}
        <div className="mt-6 flex justify-end">
          <ClockInOutButton
            instructorId={user.id}
            onClockIn={() => setShowTimesheet(true)}
            onClockOut={() => setShowTimesheet(true)}
          />
        </div>
      </div>

      {/* Timesheet Section */}
      {showTimesheet && (
        <InstructorTimesheet instructorId={user.id} />
      )}

      {/* Current Lesson Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Current Lesson</h2>
        </div>
        <div className="p-6">
          {activeLesson ? (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">{activeLesson.title}</h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Duration: {activeLesson.startTime && activeLesson.endTime ? calculateDuration(activeLesson.startTime, activeLesson.endTime) : 180} minutes
                  </span>
                  <span className="text-sm text-gray-600">
                    Level: {activeLesson.skillLevel}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Main Lodge</span>
                </div>
              </div>

              {/* Student Roster */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-gray-900">
                    <Users className="w-5 h-5" />
                    <h3 className="font-medium">Student Roster</h3>
                  </div>
                  {activeLesson.type !== 'private' && activeLesson.students.length < activeLesson.maxStudents && (
                    <button
                      onClick={() => handleAddStudent(activeLesson.id, activeLesson.studentIds, activeLesson.maxStudents)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Student
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {activeLesson.students.length > 0 ? (
                    activeLesson.students.map(student => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => setSelectedStudent(student)}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-600">Level: {student.level}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`/messages?student=${student.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <MessageSquare className="w-5 h-5" />
                          </a>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveStudent(activeLesson.id, student.id, student.name);
                            }}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4 bg-gray-50 rounded-lg text-gray-500">
                      No students assigned yet
                    </div>
                  )}

                  {activeLesson.type !== 'private' && (
                    <div className="text-sm text-gray-600 mt-2">
                      {activeLesson.students.length} of {activeLesson.maxStudents} students
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              No active lesson at the moment
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Lessons */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Lessons</h2>
            <button
              onClick={() => setShowCreateLesson(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              New Lesson
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {upcomingLessons.map(lesson => {
            const lessonDate = new Date(lesson.date);
            const isToday = new Date().toDateString() === lessonDate.toDateString();
            
            return (
              <div
                key={lesson.id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedLesson(lesson)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    isToday ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                      {isToday && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{lesson.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>{lesson.skillLevel}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>Main Lodge</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {upcomingLessons.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No upcoming lessons scheduled
            </div>
          )}
        </div>
      </div>

      {/* Past Lessons */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Past Lessons</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {pastLessons.map(lesson => {
            const lessonDate = new Date(lesson.date);
            
            return (
              <div
                key={lesson.id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedLesson(lesson)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 text-gray-600 rounded-lg">
                    <History className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        lesson.status === 'completed'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-gray-50 text-gray-600'
                      }`}>
                        {lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{lessonDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>{lesson.skillLevel}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{lesson.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {pastLessons.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No past lessons
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateLesson && (
        <CreateLessonModal
          isOpen={showCreateLesson}
          onClose={() => setShowCreateLesson(false)}
          onCreated={() => setShowCreateLesson(false)}
        />
      )}
      
      {selectedLessonForStudent && (
        <AddStudentModal
          isOpen={showAddStudent}
          onClose={() => {
            setShowAddStudent(false);
            setSelectedLessonForStudent(null);
          }}
          lessonId={selectedLessonForStudent.id}
          currentStudentIds={selectedLessonForStudent.studentIds}
          maxStudents={selectedLessonForStudent.maxStudents}
        />
      )}

      {selectedLesson && (
        <LessonDetailsModal
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
          onAddStudent={handleAddStudent}
          onRemoveStudent={handleRemoveStudent}
        />
      )}

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setStudentToRemove(null);
        }}
        onConfirm={confirmRemoveStudent}
        title="Remove Student"
        message={`Are you sure you want to remove ${studentToRemove?.studentName} from this lesson?`}
      />

      {showAvailabilityForm && (
        <AvailabilityForm
          instructorId={user.id}
          existingAvailability={memoizedAvailability}
          onClose={() => setShowAvailabilityForm(false)}
          onUpdate={loadAvailability}
        />
      )}

      {showCalendar && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCalendar(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">My Availability Calendar</h2>
                  <button
                    onClick={() => setShowCalendar(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <AvailabilityCalendar
                  viewMode="instructor"
                  onLessonCreated={() => {
                    setShowCalendar(false);
                    // Refresh lessons
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showAvailabilityManager && (
        <AvailabilityManager
          onClose={() => setShowAvailabilityManager(false)}
          onSaved={() => {
            setShowAvailabilityManager(false);
            loadAvailability();
          }}
        />
      )}

      {selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}

export default InstructorDashboard;