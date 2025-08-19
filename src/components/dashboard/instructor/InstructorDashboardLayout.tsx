import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { User } from '../../../types';
import {
  BookOpen,
  Award,
  Calendar,
  Clock,
  Plus
} from 'lucide-react';
import { getAvailabilityByInstructorId } from '../../../services/availability';
import { ClockInOutButton } from '../../timesheet/ClockInOutButton';
import { CreateLessonModal } from './CreateLessonModal';
import { AvailabilityManager } from '../../calendar/AvailabilityManager';
import { AvailabilityCalendar } from '../../calendar/AvailabilityCalendar';

interface InstructorDashboardLayoutProps {
  user: User;
}

export function InstructorDashboardLayout({ user }: InstructorDashboardLayoutProps) {
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAvailabilityManager, setShowAvailabilityManager] = useState(false);


  const loadAvailability = useCallback(async () => {
    try {
      const availability = await getAvailabilityByInstructorId(user.id);
      console.log('Loaded availability:', availability);
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  }, [user.id]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  return (
    <div className="space-y-6">
      {/* Achievement Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-white/20 rounded-xl">
              <Award className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold mb-1">Top Rated Instructor!</h3>
              <p className="text-sm sm:text-base text-blue-100">You're among the highest-rated instructors this season.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowCalendar(true)}
              className="px-4 py-3 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation"
            >
              <Calendar className="w-5 h-5" />
              <span className="sm:hidden">View Calendar</span>
              <span className="hidden sm:inline">Calendar</span>
            </button>
            <button
              onClick={() => setShowAvailabilityManager(true)}
              className="px-4 py-3 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation"
            >
              <Clock className="w-5 h-5" />
              <span className="sm:hidden">Manage Availability</span>
              <span className="hidden sm:inline">Availability</span>
            </button>
            <button
              onClick={() => setShowCreateLesson(true)}
              className="px-4 py-3 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation"
            >
              <Plus className="w-5 h-5" />
              <span className="sm:hidden">Create Lesson</span>
              <span className="hidden sm:inline">Create</span>
            </button>
          </div>
        </div>

        {/* Clock In/Out Button */}
        <div className="mt-4 sm:mt-6 flex justify-center sm:justify-end">
          <ClockInOutButton
            instructorId={user.id}
            onClockIn={() => {}}
            onClockOut={() => {}}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex overflow-x-auto space-x-0 sm:space-x-8 px-4 sm:px-6">
            <NavLink
              to="/dashboard/instructor/lessons"
              className={({ isActive }) => 
                `py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              <div className="flex items-center gap-2 sm:gap-0">
                <BookOpen className="w-4 h-4 sm:hidden" />
                <span>Lessons</span>
              </div>
            </NavLink>
            <NavLink
              to="/dashboard/instructor/timecard"
              className={({ isActive }) => 
                `py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              <div className="flex items-center gap-2 sm:gap-0">
                <Clock className="w-4 h-4 sm:hidden" />
                <span>Time Card</span>
              </div>
            </NavLink>
            <NavLink
              to="/dashboard/instructor/calendar"
              className={({ isActive }) => 
                `py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              <div className="flex items-center gap-2 sm:gap-0">
                <Calendar className="w-4 h-4 sm:hidden" />
                <span>Calendar</span>
              </div>
            </NavLink>
          </nav>
        </div>
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </div>

      {/* Modals */}
      {showCreateLesson && (
        <CreateLessonModal
          isOpen={showCreateLesson}
          onClose={() => setShowCreateLesson(false)}
          onCreated={() => {
            setShowCreateLesson(false);
            // Refresh data if needed
          }}
        />
      )}

      {showCalendar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Calendar</h2>
              <button
                onClick={() => setShowCalendar(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-auto max-h-[calc(90vh-120px)]">
              <AvailabilityCalendar viewMode="instructor" />
            </div>
          </div>
        </div>
      )}

      {showAvailabilityManager && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Manage Availability</h2>
              <button
                onClick={() => setShowAvailabilityManager(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-auto max-h-[calc(90vh-120px)]">
              <AvailabilityManager 
                onClose={() => setShowAvailabilityManager(false)}
                onSaved={() => {
                  setShowAvailabilityManager(false);
                  loadAvailability();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
