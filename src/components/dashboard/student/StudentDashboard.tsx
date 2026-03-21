import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Lesson, StudentProgress, Achievement } from '../../../types';
import { Calendar, ChevronRight, Star, MessageSquare, X, GraduationCap, Trophy, AlertCircle, CheckCircle, BookOpen, Plus, Heart, MoreHorizontal, Loader2 } from 'lucide-react';
import { getLessonsByStudent } from '../../../services/lessons';
import { isLessonUpcoming } from '../../../utils/lessonDate';
import { getUserById } from '../../../services/users';
import { progressService } from '../../../services/progress';
import { getStudentSkillLevel } from '../../../utils/studentSkillLevel';

import { achievementService } from '../../../services/achievements';
import { AchievementNotification } from '../../gamification/AchievementNotification';
import { ProfilePicturePopup } from '../../common/ProfilePicturePopup';
import { InstructorProfileModal } from '../../instructor/InstructorProfileModal';
import { LessonDetailsModal } from './components/LessonDetailsModal';
import { StudentActiveLessons } from '../../lessons/StudentActiveLessons';

interface StudentDashboardProps {
  user: User;
}

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

export function StudentDashboard({ user }: StudentDashboardProps) {
  const [lessons, setLessons] = useState<(Lesson & { instructor?: User })[]>([]);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<(Lesson & { instructor?: User }) | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<Achievement[] | null>(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<User | null>(null);
  const [activeLessonsReload, setActiveLessonsReload] = useState(0);

  const bumpActiveLessonsPanel = () => setActiveLessonsReload((n) => n + 1);

  const loadProgress = async () => {
    try {
      const progressData = await progressService.getStudentProgress(user.id);
      setProgress(progressData);
    } catch (err) {
      console.error('Error loading progress:', err);
    }
  };

  useEffect(() => {
    loadLessons();
    loadProgress();
    checkAchievements();

    const handleShowInstructorProfile = (event: CustomEvent) => {
      setSelectedInstructor(event.detail.instructor);
    };

    window.addEventListener('showInstructorProfile', handleShowInstructorProfile as EventListener);

    return () => {
      window.removeEventListener('showInstructorProfile', handleShowInstructorProfile as EventListener);
    };
  }, [user.id]);

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
    const refreshRecent = async () => {
      try {
        const list = await achievementService.getStudentAchievements(user.id);
        setRecentAchievements(list.slice(0, 3));
      } catch {
        setRecentAchievements([]);
      }
    };

    try {
      const achievements = await achievementService.checkAndAwardAchievements(user.id);
      if (achievements.length > 0) {
        setNewAchievements(achievements);
      }
      await refreshRecent();
    } catch (err) {
      console.error('Error checking achievements:', err);
      await refreshRecent();
    }
  };

  const allUpcoming = lessons.filter(
    (lesson) => isLessonUpcoming(lesson) && lesson.status !== 'in_progress'
  );
  const allPast = lessons.filter((lesson) => !isLessonUpcoming(lesson));
  const upcomingLessons = allUpcoming.slice(0, 3);
  const completedCount = progress?.completedLessons ?? allPast.length;
  const upcomingCount = allUpcoming.length;

  const displayLevel =
    progress?.level ?? (user ? getStudentSkillLevel(user) : 'first_time');

  const dashboardSkeleton = (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
              <div className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-4">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-3/5 max-w-[200px] animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-full max-w-xs animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-500 dark:text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          Loading your lessons and progress…
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div
          className="flex flex-wrap items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">Couldn&apos;t load dashboard data</p>
            <p className="mt-1 text-sm opacity-90">{error}</p>
            <button
              type="button"
              className="mt-3 text-sm font-semibold underline underline-offset-2 hover:no-underline"
              onClick={() => void loadLessons()}
            >
              Try again
            </button>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg p-1 text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/40"
            aria-label="Dismiss error"
            onClick={() => setError(null)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {isLoading ? (
        dashboardSkeleton
      ) : (
        <>
      <div className="space-y-6">
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">{getLevelDescription(displayLevel)}</p>
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
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/lessons?filter=completed"
                className="block rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-gray-800 dark:hover:bg-gray-700/80 dark:focus-visible:ring-offset-gray-900"
                aria-label="View completed lessons"
              >
                <div className="mb-1 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Completed</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{completedCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Lessons</p>
              </Link>
              <Link
                to="/lessons?filter=upcoming"
                className="block rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-gray-800 dark:hover:bg-gray-700/80 dark:focus-visible:ring-offset-gray-900"
                aria-label="View upcoming lessons"
              >
                <div className="mb-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Upcoming</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{upcomingCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Lessons</p>
              </Link>
            </div>
          </div>
        </div>

        <StudentActiveLessons
          studentId={user.id}
          reloadToken={activeLessonsReload}
          onSelectLesson={(lesson) => setSelectedLesson(lesson)}
        />

        {/* Upcoming Lessons Feed */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Upcoming lessons</h3>
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
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <span>{new Date(lesson.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{lesson.sessionType === 'morning' ? 'Morning' : lesson.sessionType === 'afternoon' ? 'Afternoon' : 'Full Day'}</span>
                      <span>•</span>
                      <span className="font-medium text-gray-600 dark:text-gray-300">
                        {lesson.sport === 'snowboarding' ? 'Snowboard' : 'Ski'}
                      </span>
                    </div>
                    {lesson.instructor && (
                      <div className="flex items-center gap-2">
                        <img
                          src={lesson.instructor.avatar}
                          alt={lesson.instructor.name}
                          className="h-5 w-5 cursor-pointer rounded-full object-cover transition-opacity hover:opacity-80"
                          onClick={() => {
                            window.dispatchEvent(
                              new CustomEvent('showInstructorProfile', {
                                detail: { instructor: lesson.instructor }
                              })
                            );
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
                  {lessons.length > 0 ? 'Book Your Next Lesson' : 'Book Your First Lesson'}
                </Link>
              </div>
            )}
            {allUpcoming.length > 3 && (
              <Link
                to="/lessons"
                className="block py-3 text-center font-medium text-blue-600 dark:text-blue-400"
              >
                View all {allUpcoming.length} lessons
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
            {recentAchievements === null ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3" aria-busy="true">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="achievement-card achievement-card-unlocked animate-pulse"
                  >
                    <div className="mb-3 h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-600" />
                    <div className="mb-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-600" />
                    <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-600" />
                  </div>
                ))}
              </div>
            ) : recentAchievements.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center dark:border-gray-700">
                <Trophy className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No achievements yet — book lessons and hit milestones to unlock badges.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {recentAchievements.map((achievement, index) => {
                  const shell =
                    index % 3 === 0
                      ? 'from-amber-400 to-amber-600'
                      : index % 3 === 1
                        ? 'from-blue-400 to-blue-600'
                        : 'from-violet-400 to-violet-600';
                  return (
                    <div
                      key={achievement.id}
                      className="achievement-card achievement-card-unlocked text-left"
                    >
                      <div
                        className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${shell}`}
                      >
                        <span className="text-2xl leading-none" aria-hidden>
                          {achievement.icon || '🏅'}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {achievement.name}
                      </h4>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {achievement.description}
                      </p>
                      {achievement.unlockedDate && (
                        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                          {new Date(achievement.unlockedDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
        </>
      )}

      {/* Modals */}
      {selectedLesson && (
        <LessonDetailsModal
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
          onLessonUpdate={() => {
            loadLessons();
            loadProgress();
            bumpActiveLessonsPanel();
            void checkAchievements();
          }}
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