import React, { useState, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useDataLoader } from '../../../hooks/useDataLoader';
import { useUrlState } from '../../../hooks/useUrlState';
import { User, Lesson, Availability, ActiveLesson } from '../../../types';
import { achievementService } from '../../../services/achievements';
import { getAvailabilityByInstructorId } from '../../../services/availability';
import { getInstructorLessons } from '../../../services/lessons';
import { LoadingSpinner } from '../LoadingSpinner';
import { ErrorBoundary } from '../ErrorBoundary';

// Import components from the new feature-based structure
import {
  CreateLessonModal,
  EditLessonModal,
  ActiveLessons,
  AvailabilityManager,
  AvailabilityCalendar,
  ProfilePicturePopup,
  InstructorTimesheet
} from '../../features';

interface InstructorDashboardProps {
  user: User;
}

export function InstructorDashboardRefactored({ user }: InstructorDashboardProps) {
  // URL-based state management
  const [modals, updateModals] = useUrlState({
    showCreateLesson: false,
    showAddStudent: false,
    showTimesheet: false,
    showAvailabilityForm: false,
    showCalendar: false,
    showAvailabilityManager: false,
    showProfilePopup: false
  });

  // Data loading with custom hooks
  const { 
    data: availability, 
    isLoading: isLoadingAvailability, 
    error: availabilityError,
    refetch: refetchAvailability 
  } = useDataLoader({
    loadFn: () => getAvailabilityByInstructorId(user.id),
    dependencies: [user.id],
    onError: (error) => console.error('Error loading availability:', error)
  });

  const { 
    data: lessons, 
    isLoading: isLoadingLessons, 
    error: lessonsError,
    refetch: refetchLessons 
  } = useDataLoader({
    loadFn: () => getInstructorLessons(user.id),
    dependencies: [user.id],
    onError: (error) => console.error('Error loading lessons:', error)
  });

  // Local state for UI interactions
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [studentToRemove, setStudentToRemove] = useState<{
    lessonId: string;
    studentId: string;
    studentName: string;
  } | null>(null);

  // Check if user should see profile picture popup
  const checkProfilePopup = useCallback(async () => {
    const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
    const shouldShowPopup = user.avatar === defaultAvatar;
    
    if (!shouldShowPopup) return;

    // Check if this is a new user (created within last 24 hours)
    const userCreatedTime = new Date(user.createdAt || Date.now()).getTime();
    const isNewUser = Date.now() - userCreatedTime < 24 * 60 * 60 * 1000;
    
    if (isNewUser) {
      updateModals({ showProfilePopup: true });
      return;
    }

    // Check if user just completed signup (no previous achievements)
    try {
      const achievements = await achievementService.getStudentAchievements(user.id);
      const hasAnyAchievements = achievements.length > 0;
      
      if (!hasAnyAchievements) {
        updateModals({ showProfilePopup: true });
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
      // Fallback to time-based check
      if (isNewUser) {
        updateModals({ showProfilePopup: true });
      }
    }
  }, [user, updateModals]);

  // Check profile popup on mount
  React.useEffect(() => {
    checkProfilePopup();
  }, [checkProfilePopup]);

  // Event handlers
  const handleCreateLesson = useCallback(() => {
    updateModals({ showCreateLesson: true });
  }, [updateModals]);

  const handleCloseCreateLesson = useCallback(() => {
    updateModals({ showCreateLesson: false });
    refetchLessons(); // Refresh lessons after creating
  }, [updateModals, refetchLessons]);

  const handleEditLesson = useCallback((lesson: Lesson) => {
    setSelectedLesson(lesson);
    updateModals({ showAddStudent: true });
  }, [updateModals]);

  const handleCloseEditLesson = useCallback(() => {
    setSelectedLesson(null);
    updateModals({ showAddStudent: false });
    refetchLessons(); // Refresh lessons after editing
  }, [updateModals, refetchLessons]);

  const handleShowTimesheet = useCallback(() => {
    updateModals({ showTimesheet: true });
  }, [updateModals]);

  const handleCloseTimesheet = useCallback(() => {
    updateModals({ showTimesheet: false });
  }, [updateModals]);

  const handleShowAvailabilityForm = useCallback(() => {
    updateModals({ showAvailabilityForm: true });
  }, [updateModals]);

  const handleCloseAvailabilityForm = useCallback(() => {
    updateModals({ showAvailabilityForm: false });
    refetchAvailability(); // Refresh availability after updating
  }, [updateModals, refetchAvailability]);

  const handleShowCalendar = useCallback(() => {
    updateModals({ showCalendar: true });
  }, [updateModals]);

  const handleCloseCalendar = useCallback(() => {
    updateModals({ showCalendar: false });
  }, [updateModals]);

  const handleShowAvailabilityManager = useCallback(() => {
    updateModals({ showAvailabilityManager: true });
  }, [updateModals]);

  const handleCloseAvailabilityManager = useCallback(() => {
    updateModals({ showAvailabilityManager: false });
    refetchAvailability(); // Refresh availability after managing
  }, [updateModals, refetchAvailability]);

  const handleCloseProfilePopup = useCallback(() => {
    updateModals({ showProfilePopup: false });
  }, [updateModals]);

  // Loading states
  if (isLoadingAvailability || isLoadingLessons) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  // Error states
  if (availabilityError || lessonsError) {
    return (
      <div className="text-center p-6">
        <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600 mb-4">
          {availabilityError?.message || lessonsError?.message}
        </p>
        <button
          onClick={() => {
            refetchAvailability();
            refetchLessons();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Separate lessons by status
  const activeLessons = lessons?.filter(lesson => lesson.status === 'in_progress') || [];
  const upcomingLessons = lessons?.filter(lesson => lesson.status === 'scheduled') || [];
  const pastLessons = lessons?.filter(lesson => lesson.status === 'completed') || [];

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={handleCreateLesson}
            className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <h3 className="font-semibold">Create Lesson</h3>
            <p className="text-sm opacity-90">Schedule a new lesson</p>
          </button>

          <button
            onClick={handleShowAvailabilityForm}
            className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <h3 className="font-semibold">Set Availability</h3>
            <p className="text-sm opacity-90">Update your schedule</p>
          </button>

          <button
            onClick={handleShowCalendar}
            className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <h3 className="font-semibold">View Calendar</h3>
            <p className="text-sm opacity-90">See your schedule</p>
          </button>

          <button
            onClick={handleShowTimesheet}
            className="p-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <h3 className="font-semibold">Timesheet</h3>
            <p className="text-sm opacity-90">Track your hours</p>
          </button>
        </div>

        {/* Active Lessons */}
        {activeLessons.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Active Lessons</h2>
            <ActiveLessons
              instructorId={user.id}
              onLessonComplete={refetchLessons}
            />
          </div>
        )}

        {/* Upcoming Lessons */}
        {upcomingLessons.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Upcoming Lessons</h2>
            <div className="space-y-3">
              {upcomingLessons.map(lesson => (
                <div key={lesson.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div>
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(lesson.startTime).toLocaleDateString()} at {new Date(lesson.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleEditLesson(lesson)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Availability Summary */}
        {availability && availability.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Availability</h2>
              <button
                onClick={handleShowAvailabilityManager}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Manage
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availability.slice(0, 3).map(slot => (
                <div key={slot.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <p className="font-medium">{new Date(slot.date).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {slot.startTime} - {slot.endTime}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modals */}
        {modals.showCreateLesson && (
          <CreateLessonModal
            instructorId={user.id}
            onClose={handleCloseCreateLesson}
          />
        )}

        {modals.showAddStudent && selectedLesson && (
          <EditLessonModal
            lesson={selectedLesson}
            onClose={handleCloseEditLesson}
          />
        )}

        {modals.showTimesheet && (
          <InstructorTimesheet
            instructorId={user.id}
            onClose={handleCloseTimesheet}
          />
        )}

        {modals.showAvailabilityForm && (
          <AvailabilityManager
            instructorId={user.id}
            onClose={handleCloseAvailabilityForm}
          />
        )}

        {modals.showCalendar && (
          <AvailabilityCalendar
            instructorId={user.id}
            onClose={handleCloseCalendar}
          />
        )}

        {modals.showAvailabilityManager && (
          <AvailabilityManager
            instructorId={user.id}
            onClose={handleCloseAvailabilityManager}
          />
        )}

        {modals.showProfilePopup && (
          <ProfilePicturePopup
            user={user}
            onClose={handleCloseProfilePopup}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
