import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Lesson, LessonFeedback, StudentReview } from '../../../types';
import { Calendar, MapPin, Clock, ChevronRight, Star, ThermometerSnowflake, Wind, Sun, MessageSquare, User2, Search, X, Target, Users, GraduationCap, Award, TrendingUp, Trophy, Edit, Trash2, AlertCircle, CheckCircle, Play, Pause, BookOpen, Plus } from 'lucide-react';
import { resortData } from '../../../data/resortData';
import { getLessonsByStudent, updateLesson, addStudentReview } from '../../../services/lessons';
import { getUserById } from '../../../services/users';

import { StudentReviewForm } from '../../lessons/StudentReviewForm';
import { achievementService } from '../../../services/achievements';
import { AchievementNotification } from '../../gamification/AchievementNotification';
import { ProfilePicturePopup } from '../../common/ProfilePicturePopup';

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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Cancel Lesson</h2>
                <p className="text-gray-600">Are you sure you want to cancel this lesson?</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">{lesson.title}</h3>
              <p className="text-sm text-gray-600">
                {new Date(lesson.date).toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              {lesson.instructor && (
                <p className="text-sm text-gray-600 mt-1">
                  with {lesson.instructor.name}
                </p>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Keep Lesson
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Lesson'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LessonDetailsModal({ lesson, onClose, onLessonUpdate }: LessonDetailsModalProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  if (!lesson) return null;

  const canCancel = lesson.status === 'scheduled';
  const canReview = lesson.status === 'completed' && !lesson.studentReviews?.some((r: StudentReview) => r.studentId === lesson.studentIds[0]);
  const hasFeedback = lesson.feedback && lesson.feedback.length > 0;

  return (
    <>
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
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
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
                <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(lesson.status)}`}>
                  {getStatusIcon(lesson.status)}
                  {lesson.status.replace('_', ' ')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Clock className="w-4 h-4" />
                    <span>Time</span>
                  </div>
                  <p className="text-lg font-medium text-gray-900">
                    {lesson.time === 'morning' ? 'Morning (9 AM - 12 PM)' :
                     lesson.time === 'afternoon' ? 'Afternoon (12 PM - 5 PM)' :
                     'Full Day (9 AM - 5 PM)'}
                  </p>
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

              {lesson.instructor && (
                <div className="border-t border-gray-100 pt-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructor</h3>
                  <div className="flex items-center gap-4">
                    <img
                      src={lesson.instructor.avatar}
                      alt={lesson.instructor.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{lesson.instructor.name}</p>
                      <p className="text-gray-600">{lesson.instructor.bio}</p>
                    </div>
                  </div>
                </div>
              )}

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

              {hasFeedback && (
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructor Feedback</h3>
                  {lesson.feedback?.map((feedback: LessonFeedback, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-6 mb-4">
                      {/* Performance Assessment */}
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-3">Performance Assessment</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <span className="text-sm text-gray-600 block mb-1">Technique</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= feedback.performance.technique ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
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
                                  className={`w-4 h-4 ${star <= feedback.performance.control ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
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
                                  className={`w-4 h-4 ${star <= feedback.performance.confidence ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
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
                                  className={`w-4 h-4 ${star <= feedback.performance.safety ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
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
                                  className={`w-4 h-4 ${star <= feedback.performance.overall ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Skill Assessment */}
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-3">Skill Assessment</h4>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm text-gray-600">Current Level:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {feedback.skillAssessment.currentLevel.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                          
                          {feedback.skillAssessment.recommendations && (
                            <div>
                              <span className="text-sm text-gray-600 block mb-1">Recommendations:</span>
                              <p className="text-gray-900 bg-white p-3 rounded border">{feedback.skillAssessment.recommendations}</p>
                            </div>
                          )}

                          {feedback.skillAssessment.nextSteps && feedback.skillAssessment.nextSteps.length > 0 && (
                            <div>
                              <span className="text-sm text-gray-600 block mb-2">Next Steps:</span>
                              <ul className="list-disc list-inside space-y-1">
                                {feedback.skillAssessment.nextSteps.map((step, stepIndex) => (
                                  <li key={stepIndex} className="text-gray-900 bg-white p-2 rounded border">{step}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {feedback.skillAssessment.areasOfFocus && feedback.skillAssessment.areasOfFocus.length > 0 && (
                            <div>
                              <span className="text-sm text-gray-600 block mb-2">Areas of Focus:</span>
                              <ul className="list-disc list-inside space-y-1">
                                {feedback.skillAssessment.areasOfFocus.map((area, areaIndex) => (
                                  <li key={areaIndex} className="text-gray-900 bg-white p-2 rounded border">{area}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Detailed Feedback */}
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-3">Detailed Feedback</h4>
                        <div className="space-y-3">
                          {feedback.strengths && feedback.strengths.length > 0 && (
                            <div>
                              <span className="text-sm text-gray-600 block mb-2">Strengths:</span>
                              <ul className="list-disc list-inside space-y-1">
                                {feedback.strengths.map((strength, strengthIndex) => (
                                  <li key={strengthIndex} className="text-green-700 bg-green-50 p-2 rounded border">{strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {feedback.areasForImprovement && feedback.areasForImprovement.length > 0 && (
                            <div>
                              <span className="text-sm text-gray-600 block mb-2">Areas for Improvement:</span>
                              <ul className="list-disc list-inside space-y-1">
                                {feedback.areasForImprovement.map((area, areaIndex) => (
                                  <li key={areaIndex} className="text-orange-700 bg-orange-50 p-2 rounded border">{area}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {feedback.instructorNotes && (
                            <div>
                              <span className="text-sm text-gray-600 block mb-1">Instructor Notes:</span>
                              <p className="text-gray-900 bg-white p-3 rounded border">{feedback.instructorNotes}</p>
                            </div>
                          )}

                          {feedback.homework && (
                            <div>
                              <span className="text-sm text-gray-600 block mb-1">Homework:</span>
                              <p className="text-gray-900 bg-white p-3 rounded border">{feedback.homework}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress Update */}
                      {feedback.progressUpdate && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Progress Update</h4>
                          <div className="space-y-3">
                            {feedback.progressUpdate.skillsImproved && feedback.progressUpdate.skillsImproved.length > 0 && (
                              <div>
                                <span className="text-sm text-gray-600 block mb-2">Skills Improved:</span>
                                <ul className="list-disc list-inside space-y-1">
                                  {feedback.progressUpdate.skillsImproved.map((skill, skillIndex) => (
                                    <li key={skillIndex} className="text-blue-700 bg-blue-50 p-2 rounded border">{skill}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {feedback.progressUpdate.newSkillsLearned && feedback.progressUpdate.newSkillsLearned.length > 0 && (
                              <div>
                                <span className="text-sm text-gray-600 block mb-2">New Skills Learned:</span>
                                <ul className="list-disc list-inside space-y-1">
                                  {feedback.progressUpdate.newSkillsLearned.map((skill, skillIndex) => (
                                    <li key={skillIndex} className="text-purple-700 bg-purple-50 p-2 rounded border">{skill}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {feedback.progressUpdate.levelUp && (
                              <div className="bg-green-100 border border-green-200 rounded-lg p-3">
                                <span className="text-green-800 font-medium">🎉 Level Up!</span>
                                {feedback.progressUpdate.newLevel && (
                                  <span className="ml-2 text-green-700">New level: {feedback.progressUpdate.newLevel}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sport Information */}
                      {feedback.sport && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <span className="text-sm text-gray-600">Sport Focus: </span>
                          <span className="font-medium text-gray-900 capitalize">{feedback.sport}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Student Reviews */}
              {lesson.studentReviews && lesson.studentReviews.length > 0 && (
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Reviews</h3>
                  <div className="space-y-4">
                    {lesson.studentReviews.map((review: StudentReview, index: number) => (
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

              <div className="border-t border-gray-100 pt-6 mt-6">
                <div className="flex flex-wrap gap-3">
                  {lesson.instructor && (
                    <Link
                      to={`/messages?instructor=${lesson.instructor.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Message Instructor
                    </Link>
                  )}
                  
                  {canCancel && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-5 h-5" />
                      Cancel Lesson
                    </button>
                  )}
                  
                  {canReview && (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Star className="w-5 h-5" />
                      Rate Lesson
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <CancelLessonModal
          lesson={lesson}
          onClose={() => setShowCancelModal(false)}
          onCancel={() => {
            setShowCancelModal(false);
            onClose();
            onLessonUpdate();
          }}
        />
      )}

      {showReviewForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowReviewForm(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative max-w-md w-full">
              <StudentReviewForm
                lessonId={lesson.id}
                studentId={lesson.studentIds[0]}
                onSubmit={() => {
                  setShowReviewForm(false);
                  onClose();
                  onLessonUpdate();
                }}
                onClose={() => setShowReviewForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function StudentDashboard({ user }: StudentDashboardProps) {
  const [upcomingLessons, setUpcomingLessons] = useState<(Lesson & { instructor?: User })[]>([]);
  const [pastLessons, setPastLessons] = useState<(Lesson & { instructor?: User })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<(Lesson & { instructor?: User }) | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons'>('overview');
  const [newAchievements, setNewAchievements] = useState<any[]>([]);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [localUser, setLocalUser] = useState(user);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'first_time':
        return 'bg-gray-50 text-gray-600';
      case 'developing_turns':
        return 'bg-blue-50 text-blue-600';
      case 'linking_turns':
        return 'bg-green-50 text-green-600';
      case 'confident_turns':
        return 'bg-purple-50 text-purple-600';
      case 'consistent_blue':
        return 'bg-indigo-50 text-indigo-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  const getNextLevel = (currentLevel: string) => {
    const levels = [
      'first_time',
      'developing_turns',
      'linking_turns',
      'confident_turns',
      'consistent_blue'
    ];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : currentLevel;
  };

  // Calculate real progress based on completed lessons
  const calculateProgress = (): number => {
    if (pastLessons.length === 0) return 0;
    
    const totalLessons = pastLessons.length;
    const completedLessons = pastLessons.filter(lesson => lesson.status === 'completed');
    
    if (completedLessons.length === 0) return 0;
    
    // Calculate average performance from feedback
    let totalPerformance = 0;
    let feedbackCount = 0;
    
    completedLessons.forEach(lesson => {
      // Check if feedback exists and is an array
      if (lesson.feedback && Array.isArray(lesson.feedback) && lesson.feedback.length > 0) {
        lesson.feedback.forEach((feedback: any) => {
          // Check if feedback has the expected structure
          if (feedback && feedback.performance && typeof feedback.performance === 'object') {
            const { technique, control, confidence, safety } = feedback.performance;
            
            // Ensure all performance values are numbers
            if (typeof technique === 'number' && typeof control === 'number' && 
                typeof confidence === 'number' && typeof safety === 'number') {
              const avg = (technique + control + confidence + safety) / 4;
              totalPerformance += avg;
              feedbackCount++;
            } else {
              console.warn('Invalid performance values:', { technique, control, confidence, safety });
            }
          } else {
            console.warn('Invalid feedback structure:', feedback);
          }
        });
      }
    });
    
    if (feedbackCount === 0) return Math.min(totalLessons * 10, 100);
    
    const averagePerformance = totalPerformance / feedbackCount;
    return Math.min((averagePerformance / 5) * 100, 100);
  };

  const loadLessons = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const lessons = await getLessonsByStudent(user.id);

      const now = new Date();
      const upcoming: (Lesson & { instructor?: User })[] = [];
      const past: (Lesson & { instructor?: User })[] = [];

      for (const lesson of lessons) {
        const instructor = await getUserById(lesson.instructorId);
        const enrichedLesson = { ...lesson, instructor: instructor || undefined };
        
        if (new Date(lesson.date) >= now) {
          upcoming.push(enrichedLesson);
        } else {
          past.push(enrichedLesson);
        }
      }

      upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setUpcomingLessons(upcoming);
      setPastLessons(past);

      // Check for new achievements after loading lessons
      try {
        const newAchievements = await achievementService.checkAndAwardAchievements(user.id);
        if (newAchievements.length > 0) {
          setNewAchievements(newAchievements);
        }
      } catch (err) {
        console.error('Error checking achievements:', err);
      }
    } catch (err) {
      console.error('Error loading lessons:', err);
      setError('Failed to load your lessons. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
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

  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link 
          to="/find-instructor"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-gray-600"
        >
          <Search className="w-4 h-4" />
          <span>Find Instructors</span>
        </Link>
        
        <Link 
          to="/book-lesson"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Book New Lesson</span>
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('lessons')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'lessons'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Lessons
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Resort Banner */}
      <div className="relative h-80 rounded-2xl overflow-hidden">
        <img
          src={resortData.image}
          alt={resortData.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
        <div className="absolute inset-0 p-8 flex flex-col justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{resortData.name}</h1>
            <p className="text-white/80 text-lg">Today's Conditions</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="glass-card p-4">
              <ThermometerSnowflake className="w-5 h-5 text-white mb-2" />
              <p className="text-lg font-semibold text-white">{resortData.weather.temperature}</p>
              <p className="text-sm text-white/70">Temperature</p>
            </div>
            <div className="glass-card p-4">
              <Star className="w-5 h-5 text-white mb-2" />
              <p className="text-lg font-semibold text-white">{resortData.weather.condition}</p>
              <p className="text-sm text-white/70">Conditions</p>
            </div>
            <div className="glass-card p-4">
              <ThermometerSnowflake className="w-5 h-5 text-white mb-2" />
              <p className="text-lg font-semibold text-white">{resortData.weather.snowDepth}</p>
              <p className="text-sm text-white/70">Snow Depth</p>
            </div>
            <div className="glass-card p-4">
              <Wind className="w-5 h-5 text-white mb-2" />
              <p className="text-lg font-semibold text-white">{resortData.weather.wind}</p>
              <p className="text-sm text-white/70">Wind Speed</p>
            </div>
            <div className="glass-card p-4">
              <Sun className="w-5 h-5 text-white mb-2" />
              <p className="text-lg font-semibold text-white">{resortData.weather.visibility}</p>
              <p className="text-sm text-white/70">Visibility</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Progress</h2>
            <Link
              to="/progress"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View Details
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {getLevelDescription(user.level || 'first_time')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Next: {getLevelDescription(getNextLevel(user.level || 'first_time'))}
                  </p>
                </div>
              </div>
            </div>

            <div className="col-span-2">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300">Overall Progress</span>
                    <span className="text-gray-600 dark:text-gray-400">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Completed Lessons:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {pastLessons.filter(l => l.status === 'completed').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Upcoming Lessons:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {upcomingLessons.length}
                    </span>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link
                    to="/book-lesson"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Book Lesson
                  </Link>
                  <Link
                    to="/find-instructor"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full text-xs font-medium hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors"
                  >
                    <Search className="w-3 h-3" />
                    Find Instructor
                  </Link>
                  <Link
                    to="/messages"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Messages
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Achievements</h2>
            <Link
              to="/achievements"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Welcome Achievement */}
            <Link
              to="/achievements"
              className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/10 rounded-lg">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium">Welcome to SlopesMaster!</h3>
                  <p className="text-sm text-white/80">Account Created</p>
                </div>
              </div>
              <p className="text-sm text-white/90">
                You've taken your first step towards mastering the slopes.
              </p>
              <div className="mt-4 flex items-center gap-2 text-white/80 text-sm">
                <span>View all achievements</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </Link>

            {/* First Lesson Achievement */}
            {pastLessons.filter(l => l.status === 'completed').length > 0 ? (
              <Link
                to="/achievements"
                className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 cursor-pointer"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/10 rounded-lg">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">First Lesson Completed!</h3>
                    <p className="text-sm text-white/80">Lesson Milestone</p>
                  </div>
                </div>
                <p className="text-sm text-white/90">
                  You've completed your first lesson. Keep up the great work!
                </p>
                <div className="mt-4 flex items-center gap-2 text-white/80 text-sm">
                  <span>View all achievements</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            ) : (
              <div className="bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl p-6 text-white opacity-60">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/10 rounded-lg">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">First Lesson Achievement</h3>
                    <p className="text-sm text-white/80">Complete your first lesson to unlock</p>
                  </div>
                </div>
                <p className="text-sm text-white/90">
                  Book and complete your first lesson to earn this achievement!
                </p>
                <Link
                  to="/book-lesson"
                  className="mt-4 inline-flex items-center gap-2 text-white/80 text-sm hover:text-white transition-colors"
                >
                  <span>Book a lesson</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Progress Achievement */}
            {progress >= 50 ? (
              <Link
                to="/progress"
                className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 cursor-pointer"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/10 rounded-lg">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">Making Great Progress!</h3>
                    <p className="text-sm text-white/80">Progress Milestone</p>
                  </div>
                </div>
                <p className="text-sm text-white/90">
                  You've reached {Math.round(progress)}% progress. You're doing amazing!
                </p>
                <div className="mt-4 flex items-center gap-2 text-white/80 text-sm">
                  <span>View detailed progress</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            ) : (
              <div className="bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl p-6 text-white opacity-60">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/10 rounded-lg">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">Progress Achievement</h3>
                    <p className="text-sm text-white/80">Reach 50% progress to unlock</p>
                  </div>
                </div>
                <p className="text-sm text-white/90">
                  Complete more lessons to reach 50% progress and unlock this achievement!
                </p>
                <Link
                  to="/progress"
                  className="mt-4 inline-flex items-center gap-2 text-white/80 text-sm hover:text-white transition-colors"
                >
                  <span>View progress</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>



        </>
      )}

      {activeTab === 'lessons' && (
        <div className="space-y-6">
          {/* Upcoming Lessons */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="border-b border-white/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upcoming Lessons</h2>
                <div className="flex gap-2">
                  <Link
                    to="/find-instructor"
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Find Instructor
                  </Link>
                  <Link
                    to="/book-lesson"
                    className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Book Lesson
                  </Link>
                </div>
              </div>
            </div>
            
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading your lessons...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={loadLessons}
                  className="mt-2 text-blue-600 hover:text-blue-700"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {upcomingLessons.map(lesson => (
                  <div
                    key={lesson.id}
                    className="p-6 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedLesson(lesson)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{lesson.title}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(lesson.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>Main Lodge</span>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(lesson.status)}`}>
                              {getStatusIcon(lesson.status)}
                              {lesson.status.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                      </div>
                      {lesson.instructor && (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={lesson.instructor.avatar}
                              alt={lesson.instructor.name}
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
                            />
                            <div className="text-right">
                              <p className="font-medium text-gray-900 dark:text-white">{lesson.instructor.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Instructor</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              to={`/messages?instructor=${lesson.instructor.id}`}
                              className="glass-button p-2 rounded-lg"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MessageSquare className="w-5 h-5" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {upcomingLessons.length === 0 && (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No upcoming lessons scheduled</p>
                    <Link
                      to="/find-instructor"
                      className="mt-2 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      Book your first lesson
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Past Lessons */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="border-b border-white/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Past Lessons</h2>
                <Link
                  to="/progress"
                  className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  View Progress
                </Link>
              </div>
            </div>
            <div className="divide-y divide-white/10">
              {pastLessons.map(lesson => (
                <div
                  key={lesson.id}
                  className="p-6 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => setSelectedLesson(lesson)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{lesson.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {new Date(lesson.date).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {lesson.skillsFocus.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                        <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(lesson.status)}`}>
                          {getStatusIcon(lesson.status)}
                          {lesson.status.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    {lesson.instructor && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={lesson.instructor.avatar}
                            alt={lesson.instructor.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
                          />
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-white">{lesson.instructor.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Instructor</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            to={`/messages?instructor=${lesson.instructor.id}`}
                            className="glass-button p-2 rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MessageSquare className="w-5 h-5" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {pastLessons.length === 0 && (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No past lessons</p>
                  <p className="text-sm">Complete your first lesson to see it here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <LessonDetailsModal
        lesson={selectedLesson}
        onClose={() => setSelectedLesson(null)}
        onLessonUpdate={loadLessons}
      />

      {/* Achievement Notifications */}
      {newAchievements.map((achievement, index) => (
        <AchievementNotification
          key={`${achievement.id}-${index}`}
          achievement={achievement}
          onClose={() => {
            setNewAchievements(prev => prev.filter(a => a.id !== achievement.id));
          }}
          autoClose={true}
          autoCloseDelay={5000}
        />
      ))}

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