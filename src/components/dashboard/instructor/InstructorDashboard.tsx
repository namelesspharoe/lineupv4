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
import { ProfilePicturePopup } from '../../common/ProfilePicturePopup';
import { achievementService } from '../../../services/achievements';
import { StudentProfileModal } from '../../student/StudentProfileModal';

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
    try {
      await startLesson(lesson.id);
      // Close the modal after successfully starting the lesson
      onClose();
    } catch (error) {
      console.error('Error starting lesson:', error);
    } finally {
      setIsStarting(false);
    }
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
        <StudentProfileModal
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
  const [activeLessons, setActiveLessons] = useState<ActiveLesson[]>([]);
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
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [localUser, setLocalUser] = useState(user);

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

  // Check if user should see profile picture popup (new users with default avatar)
  useEffect(() => {
    const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
    const shouldShowPopup = user.avatar === defaultAvatar;
    
    // Check URL parameters for immediate popup trigger
    const urlParams = new URLSearchParams(window.location.search);
    const showProfilePopup = urlParams.get('showProfilePopup');
    
    if (showProfilePopup === 'true' && shouldShowPopup) {
      setShowProfilePopup(true);
      // Clean up the URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('showProfilePopup');
      window.history.replaceState({}, '', newUrl.toString());
      return;
    }
    
    // Check if this is a new user (created within last 24 hours)
    const userCreatedTime = new Date(user.createdAt || Date.now()).getTime();
    const isNewUser = Date.now() - userCreatedTime < 24 * 60 * 60 * 1000; // 24 hours
    
    // Also check if user just completed signup (no previous achievements)
    const checkIfNewSignup = async () => {
      try {
        const achievements = await achievementService.getStudentAchievements(user.id);
        const hasAnyAchievements = achievements.length > 0;
        
        if (shouldShowPopup && (isNewUser || !hasAnyAchievements)) {
          setShowProfilePopup(true);
        }
      } catch (error) {
        console.error('Error checking achievements:', error);
        // Fallback to time-based check
        if (shouldShowPopup && isNewUser) {
          setShowProfilePopup(true);
        }
      }
    };
    
    checkIfNewSignup();
  }, [user]);

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

      // Find all active lessons (either in progress or happening now)
      const active = lessons.filter(lesson => {
        // First priority: lessons that are in progress
        if (lesson.status === 'in_progress') {
          return true;
        }
        
        // Second priority: lessons happening now (based on time)
        if (!lesson.startTime || !lesson.endTime || !lesson.date || lesson.date !== todayString) return false;
        
        const isTimeBased = currentTimeString >= lesson.startTime && currentTimeString <= lesson.endTime;
        return isTimeBased;
      });

      // Set upcoming lessons (excluding active lessons)
      const upcoming = lessons.filter(lesson => {
        if (!lesson.date || lesson.status === 'in_progress') return false;
        
        // Check if this lesson is in the active lessons list
        const isActive = active.some(activeLesson => activeLesson.id === lesson.id);
        if (isActive) return false;
        
        const lessonDate = new Date(lesson.date);
        const isToday = lessonDate.toDateString() === now.toDateString();
        
        // If it's today, check if the lesson time is in the future
        if (isToday && lesson.startTime) {
          return currentTimeString < lesson.startTime;
        }
        
        return lessonDate > now;
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Set completed lessons
      const past = lessons.filter(lesson => {
        if (!lesson.date || lesson.status !== 'completed') return false;
        
        // Check if this lesson is in the active lessons list
        const isActive = active.some(activeLesson => activeLesson.id === lesson.id);
        if (isActive) return false;
        
        return true;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Fetch student data for all active lessons
      const activeLessonsWithStudents = await Promise.all(
        active.map(async (lesson) => {
          const studentPromises = lesson.studentIds.map(async (studentId) => {
            const studentDoc = await getDocs(query(
              collection(db, 'users'),
              where('id', '==', studentId)
            ));
            return studentDoc.docs[0]?.data() as User;
          });

          const students = (await Promise.all(studentPromises)).filter(Boolean);

          return {
            ...lesson,
            students
          };
        })
      );

      setActiveLessons(activeLessonsWithStudents);

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

  const handleCompleteLesson = (lesson: ActiveLesson) => {
    setSelectedLesson(lesson);
    // The lesson details modal will handle the completion process
  };

  const confirmRemoveStudent = async () => {
    if (!studentToRemove) return;

    try {
      const lessonRef = doc(db, 'lessons', studentToRemove.lessonId);
      const lesson = selectedLesson || activeLessons.find(l => l.id === studentToRemove.lessonId);
      
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

      {/* Active Lessons */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Active Lessons</h2>
        </div>
        <div className="p-6">
          {activeLessons.length > 0 ? (
            <div className="space-y-6">
              {activeLessons.map((lesson) => (
                <div key={lesson.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <BookOpen className="w-5 h-5 text-green-600" />
                      </div>
                                             <div>
                         <div className="flex items-center gap-2">
                           <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                           <span className="px-2 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">
                             {lesson.status === 'in_progress' ? 'In Progress' : 'Active'}
                           </span>
                         </div>
                         <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                           <span>
                             Time: {lesson.startTime && lesson.endTime ? `${lesson.startTime} - ${lesson.endTime}` : 'TBD'}
                           </span>
                           <span>
                             Duration: {lesson.startTime && lesson.endTime ? calculateDuration(lesson.startTime, lesson.endTime) : 180} minutes
                           </span>
                           <span>Level: {lesson.skillLevel}</span>
                         </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedLesson(lesson)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        View Details
                      </button>
                      {lesson.students.length > 0 && (
                        <button
                          onClick={() => handleCompleteLesson(lesson)}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Complete Lesson
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Student Roster */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-gray-900">
                        <Users className="w-4 h-4" />
                        <h4 className="font-medium text-sm">Students ({lesson.students.length})</h4>
                      </div>
                      {lesson.type !== 'private' && lesson.students.length < lesson.maxStudents && (
                        <button
                          onClick={() => handleAddStudent(lesson.id, lesson.studentIds, lesson.maxStudents)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                        >
                          <UserPlus className="w-3 h-3" />
                          Add Student
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {lesson.students.length > 0 ? (
                        lesson.students.map(student => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => setSelectedStudent(student)}
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={student.avatar}
                                alt={student.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{student.name}</p>
                                <p className="text-xs text-gray-600">Level: {student.level}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <a
                                href={`/messages?student=${student.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </a>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveStudent(lesson.id, student.id, student.name);
                                }}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center p-3 bg-gray-50 rounded-lg text-gray-500 text-sm">
                          No students assigned yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              No active lessons at the moment
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
                        <span>{lesson.startTime && lesson.endTime ? `${lesson.startTime} - ${lesson.endTime}` : lesson.time}</span>
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
            <h2 className="text-lg font-semibold text-gray-900">Completed Lessons</h2>
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
              No completed lessons
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
        <StudentProfileModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {/* Profile Picture Popup */}
      {showProfilePopup && (
        <ProfilePicturePopup
          user={localUser}
          onClose={() => setShowProfilePopup(false)}
          onUpdate={(avatarUrl) => {
            setLocalUser(prev => ({ ...prev, avatar: avatarUrl }));
            // Also update the parent user state if needed
          }}
        />
      )}
    </div>
  );
}

export default InstructorDashboard;