import React from 'react';
import { Award, Calendar, Clock, Plus } from 'lucide-react';
import { ClockInOutButton } from '../../../timesheet/ClockInOutButton';

interface AchievementBannerProps {
  instructorId: string;
  onViewCalendar: () => void;
  onManageAvailability: () => void;
  onCreateLesson: () => void;
  onShowTimesheet: () => void;
}

export function AchievementBanner({
  instructorId,
  onViewCalendar,
  onManageAvailability,
  onCreateLesson,
  onShowTimesheet
}: AchievementBannerProps) {
  return (
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
            onClick={onViewCalendar}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            View Calendar
          </button>
          <button
            onClick={onManageAvailability}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
          >
            <Clock className="w-5 h-5" />
            Manage Availability
          </button>
          <button
            onClick={onCreateLesson}
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
          instructorId={instructorId}
          onClockIn={onShowTimesheet}
          onClockOut={onShowTimesheet}
        />
      </div>
    </div>
  );
}

