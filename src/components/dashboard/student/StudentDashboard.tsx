import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Lesson, LessonFeedback, StudentReview } from '../../../types';
import { Calendar, MapPin, Clock, ChevronRight, Star, ThermometerSnowflake, Wind, Sun, MessageSquare, User2, Search, X, Target, Users, GraduationCap, Award, TrendingUp, Trophy, Edit, Trash2, AlertCircle, CheckCircle, Play, Pause, BookOpen, Plus, Heart, Share2, MoreHorizontal } from 'lucide-react';
import { resortData } from '../../../data/resortData';
import { getLessonsByStudent, updateLesson, addStudentReview } from '../../../services/lessons';
import { getUserById } from '../../../services/users';

import { StudentReviewForm } from '../../lessons/StudentReviewForm';
import { achievementService } from '../../../services/achievements';
import { AchievementNotification } from '../../gamification/AchievementNotification';
import { ProfilePicturePopup } from '../../common/ProfilePicturePopup';
import { InstructorProfileModal } from '../../instructor/InstructorProfileModal';

interface StudentDashboardProps {
  user: User;
}

interface LessonDetailsModalProps {
  lesson: (Lesson & { instructor?: User }) | null;
  onClose: () => void;
  onLessonUpdate: () => void;
}

interface CancelLessonModalProps {
  lesson: (Lesson & { instructor?: User }) | null;
  onClose: () => void;
  onCancel: () => void;
}

// Move the function outside of both components so it can be shared
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-50 text-blue-600';
    case 'in_progress':
      return 'bg-yellow-50 text-yellow-600';
    case 'completed':
      return 'bg-green-50 text-green-600';
    case 'cancelled':
      return 'bg-red-50 text-red-600';
    default:
      return 'bg-gray-50 text-gray-600';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'scheduled':
      return <Calendar className="w-4 h-4" />;
    case 'in_progress':
      return <Play className="w-4 h-4" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4" />;
    case 'cancelled':
      return <X className="w-4 h-4" />;
    default:
      return <Calendar className="w-4 h-4" />;
  }
};

function CancelLessonModal({ lesson, onClose, onCancel }: CancelLessonModalProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!lesson) return;
    
    try {
      setIsCancelling(true);
      setError(null);
      
      await updateLesson(lesson.id, { status: 'cancelled' });
      onCancel();
    } catch (err: any) {
      console.error('Error cancelling lesson:', err);
      setError(err.message || 'Failed to cancel lesson');
    } finally {
      setIsCancelling(false);
    }
  };

  if (!lesson) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Cancel Lesson
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to cancel your lesson with {lesson.instructor?.name} on {new Date(lesson.date).toLocaleDateString()}?
        </p>
        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Keep Lesson
          </button>
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Lesson'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LessonDetailsModal({ lesson, onClose, onLessonUpdate }: LessonDetailsModalProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  if (!lesson) return null;

  const handleCancel = () => {
    setShowCancelModal(false);
    onLessonUpdate();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Lesson Details
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Lesson Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{lesson.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(lesson.date).toLocaleDateString()} • {lesson.sessionType === 'morning' ? 'Morning' : lesson.sessionType === 'afternoon' ? 'Afternoon' : 'Full Day'}
                  </p>
                </div>
              </div>
              
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lesson.status)}`}>
                {getStatusIcon(lesson.status)}
                {lesson.status.replace('_', ' ')}
              </div>
            </div>

            {/* Instructor Info */}
            {lesson.instructor && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Instructor</h4>
                <div className="flex items-center gap-3">
                  <img
                    src={lesson.instructor.avatar}
                    alt={lesson.instructor.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                                     <div>
                     <p className="font-medium text-gray-900 dark:text-white">{lesson.instructor.name}</p>
                     <p className="text-sm text-gray-600 dark:text-gray-400">Instructor</p>
                   </div>
                  <Link
                    to={`/messages?instructor=${lesson.instructor.id}`}
                    className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Message
                  </Link>
                </div>
              </div>
            )}

            {/* Skills Focus */}
            {lesson.skillsFocus && lesson.skillsFocus.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Skills Focus</h4>
                <div className="flex flex-wrap gap-2">
                  {lesson.skillsFocus.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              {lesson.status === 'scheduled' && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="flex-1 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  Cancel Lesson
                </button>
              )}
                             {lesson.status === 'completed' && (
                 <button
                   onClick={() => setShowReviewForm(true)}
                   className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                 >
                   Write Review
                 </button>
               )}
            </div>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <CancelLessonModal
          lesson={lesson}
          onClose={() => setShowCancelModal(false)}
          onCancel={handleCancel}
        />
      )}

      {showReviewForm && (
                 <StudentReviewForm
           lessonId={lesson.id}
           studentId={lesson.studentIds[0]}
           onClose={() => setShowReviewForm(false)}
           onSubmit={onLessonUpdate}
         />
      )}
    </>
  );
}

export function StudentDashboard({ user }: StudentDashboardProps) {
  const [lessons, setLessons] = useState<(Lesson & { instructor?: User })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<(Lesson & { instructor?: User }) | null>(null);
  const [newAchievements, setNewAchievements] = useState<any[]>([]);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<User | null>(null);

  useEffect(() => {
    loadLessons();
    checkAchievements();
    
    // Listen for instructor profile modal events
    const handleShowInstructorProfile = (event: CustomEvent) => {
      setSelectedInstructor(event.detail.instructor);
    };
    
    window.addEventListener('showInstructorProfile', handleShowInstructorProfile as EventListener);
    
    return () => {
      window.removeEventListener('showInstructorProfile', handleShowInstructorProfile as EventListener);
    };
  }, []);

  const loadLessons = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const lessonsData = await getLessonsByStudent(user.id);
      
      // Fetch instructor data for each lesson
      const lessonsWithInstructors = await Promise.all(
        lessonsData.map(async (lesson) => {
          try {
            const instructor = await getUserById(lesson.instructorId);
            return { ...lesson, instructor: instructor || undefined };
          } catch (err) {
            console.error('Error fetching instructor:', err);
            return lesson;
          }
        })
      );
      
      setLessons(lessonsWithInstructors);
    } catch (err: any) {
      console.error('Error loading lessons:', err);
      setError(err.message || 'Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAchievements = async () => {
    try {
      const achievements = await achievementService.checkAndAwardAchievements(user.id);
      if (achievements.length > 0) {
        setNewAchievements(achievements);
      }
    } catch (err) {
      console.error('Error checking achievements:', err);
    }
  };

  const upcomingLessons = lessons.filter(lesson => {
    const now = new Date();
    const lessonDate = new Date(lesson.date);
    return lessonDate >= now && lesson.status !== 'cancelled';
  }).slice(0, 3);

  const pastLessons = lessons.filter(lesson => {
    const now = new Date();
    const lessonDate = new Date(lesson.date);
    return lessonDate < now || lesson.status === 'completed';
  }).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Mobile Stories-like Progress Section */}
      <div className="lg:hidden overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 pb-4">
          <div className="story-circle flex-shrink-0">
            <div className="story-circle-inner bg-gradient-to-br from-blue-500 to-blue-600">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs text-center mt-2">Progress</p>
            <p className="text-xs font-semibold text-center">75%</p>
          </div>
          <div className="story-circle flex-shrink-0">
            <div className="story-circle-inner bg-gradient-to-br from-green-500 to-green-600">
              <ThermometerSnowflake className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs text-center mt-2">Weather</p>
            <p className="text-xs font-semibold text-center">28°F</p>
          </div>
          <div className="story-circle flex-shrink-0">
            <div className="story-circle-inner bg-gradient-to-br from-purple-500 to-purple-600">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs text-center mt-2">Lessons</p>
            <p className="text-xs font-semibold text-center">{upcomingLessons.length}</p>
          </div>
          <div className="story-circle flex-shrink-0">
            <div className="story-circle-inner bg-gradient-to-br from-yellow-500 to-yellow-600">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs text-center mt-2">Achievements</p>
            <p className="text-xs font-semibold text-center">12</p>
          </div>
        </div>
      </div>

      {/* Mobile Quick Actions Bar */}
      <div className="lg:hidden">
        <div className="quick-actions-grid">
          <Link to="/book-lesson" className="quick-action-item bg-gradient-to-br from-blue-500 to-blue-600">
            <BookOpen className="w-6 h-6 text-white" />
            <span className="text-white font-medium">Book</span>
          </Link>
          <Link to="/find-instructor" className="quick-action-item bg-gradient-to-br from-green-500 to-green-600">
            <Search className="w-6 h-6 text-white" />
            <span className="text-white font-medium">Find</span>
          </Link>
          <Link to="/messages" className="quick-action-item bg-gradient-to-br from-purple-500 to-purple-600">
            <MessageSquare className="w-6 h-6 text-white" />
            <span className="text-white font-medium">Chat</span>
          </Link>
          <Link to="/progress" className="quick-action-item bg-gradient-to-br from-yellow-500 to-yellow-600">
            <TrendingUp className="w-6 h-6 text-white" />
            <span className="text-white font-medium">Stats</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Resort Card - Instagram-like */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="relative h-48 sm:h-64">
            <img
              src={resortData.image}
              alt={resortData.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{resortData.name}</h1>
              <div className="flex items-center gap-4 text-white/90">
                <div className="flex items-center gap-1">
                  <ThermometerSnowflake className="w-4 h-4" />
                  <span className="text-sm">{resortData.weather.temperature}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  <span className="text-sm">{resortData.weather.condition}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Weather Stats Grid */}
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <ThermometerSnowflake className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{resortData.weather.snowDepth}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Snow</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Wind className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{resortData.weather.wind}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Wind</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Sun className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{resortData.weather.visibility}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Visibility</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Card - Social Media Style */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">My Progress</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{getLevelDescription(user.level || 'first_time')}</p>
                </div>
              </div>
              <Link
                to="/progress"
                className="text-blue-600 dark:text-blue-400 text-sm font-medium"
              >
                View Details
              </Link>
            </div>
          </div>
          
          <div className="p-4">
            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Level Progress</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">75%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>

              {/* Progress Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Completed</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{pastLessons.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Lessons</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Upcoming</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{upcomingLessons.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Lessons</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Lessons Feed */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Upcoming Lessons</h3>
              <Link
                to="/lessons"
                className="text-blue-600 dark:text-blue-400 text-sm font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {upcomingLessons.map(lesson => (
              <div
                key={lesson.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => setSelectedLesson(lesson)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{lesson.title}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lesson.status)}`}>
                        {lesson.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <span>{new Date(lesson.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{lesson.sessionType === 'morning' ? 'Morning' : lesson.sessionType === 'afternoon' ? 'Afternoon' : 'Full Day'}</span>
                    </div>
                                         {lesson.instructor && (
                       <div className="flex items-center gap-2">
                         <img
                           src={lesson.instructor.avatar}
                           alt={lesson.instructor.name}
                           className="w-5 h-5 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                           onClick={() => {
                             // Trigger instructor profile modal
                             window.dispatchEvent(new CustomEvent('showInstructorProfile', { 
                               detail: { instructor: lesson.instructor } 
                             }));
                           }}
                         />
                         <span className="text-sm text-gray-600 dark:text-gray-400">{lesson.instructor.name}</span>
                       </div>
                     )}
                    {lesson.skillsFocus && lesson.skillsFocus.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {lesson.skillsFocus.slice(0, 2).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {lesson.skillsFocus.length > 2 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                            +{lesson.skillsFocus.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      <Heart className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  {lesson.instructor && (
                    <Link
                      to={`/messages?instructor=${lesson.instructor.id}`}
                      className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </Link>
                  )}
                  {lesson.status === 'scheduled' && (
                    <button 
                      className="flex-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLesson(lesson);
                      }}
                    >
                      Cancel
                    </button>
                  )}
                  {lesson.status === 'completed' && (
                    <button className="flex-1 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                      <Star className="w-4 h-4" />
                      Review
                    </button>
                  )}
                </div>
              </div>
            ))}
            {upcomingLessons.length === 0 && (
              <div className="p-6 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">No upcoming lessons</p>
                <Link
                  to="/book-lesson"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Book Your First Lesson
                </Link>
              </div>
            )}
            {upcomingLessons.length > 3 && (
              <Link
                to="/lessons"
                className="block text-center py-3 text-blue-600 dark:text-blue-400 font-medium"
              >
                View all {upcomingLessons.length} lessons
              </Link>
            )}
          </div>
        </div>

        {/* Achievements Feed */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Achievements</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="achievement-card achievement-card-unlocked">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center mb-3">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">First Lesson</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Complete your first lesson</p>
              </div>
              <div className="achievement-card achievement-card-unlocked">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-3">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Progress Maker</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Complete 5 lessons</p>
              </div>
              <div className="achievement-card achievement-card-locked">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center mb-3">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-medium text-gray-500 dark:text-gray-400 text-sm">Mountain Master</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Reach 50% progress to unlock</p>
              </div>
            </div>
            <Link
              to="/progress"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium mt-4"
            >
              View progress
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedLesson && (
        <LessonDetailsModal
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
          onLessonUpdate={loadLessons}
        />
      )}

      {/* Achievement Notifications */}
      {newAchievements.map((achievement, index) => (
        <AchievementNotification
          key={achievement.id}
          achievement={achievement}
          onClose={() => {
            setNewAchievements(prev => prev.filter((_, i) => i !== index));
          }}
        />
      ))}

      {/* Profile Picture Popup */}
      {showProfilePopup && (
        <ProfilePicturePopup
          user={user}
          onClose={() => setShowProfilePopup(false)}
          onUpdate={(avatarUrl) => {
            // Update user avatar if needed
            console.log('Avatar updated:', avatarUrl);
          }}
        />
      )}

      {/* Instructor Profile Modal */}
      {selectedInstructor && (
        <InstructorProfileModal
          instructor={{
            id: selectedInstructor.id,
            name: selectedInstructor.name,
            image: selectedInstructor.avatar,
            location: 'Mountain Resort',
            rating: 4.8,
            reviewCount: 127,
            price: 120,
            specialties: ['Skiing', 'Snowboarding', 'Freestyle'],
            experience: 8,
            languages: ['English', 'Spanish'],
            availability: 'Weekdays & Weekends'
          }}
          onClose={() => setSelectedInstructor(null)}
        />
      )}
    </div>
  );
}