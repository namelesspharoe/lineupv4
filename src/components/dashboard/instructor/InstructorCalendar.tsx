import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, DollarSign, BookOpen } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, startOfWeek, endOfWeek, parseISO } from 'date-fns';

import { getInstructorDailyLessons } from '../../../services/lessons';
import { getInstructorAvailability } from '../../../services/availability';
import { getTimeEntriesByInstructor } from '../../../services/timesheet';
import { User, Lesson, Availability, TimeEntry } from '../../../types';

interface InstructorCalendarProps {
  user: User;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  lessons: Lesson[];
  availability: Availability[];
  timeEntries: TimeEntry[];
  isAvailable: boolean;
  availableSlots: string[];
  totalEarnings: number;
  totalHours: number;
}

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: CalendarDay | null;
  user: User;
}

const timeSlots = [
  { id: 'morning', label: 'Morning', start: '09:00', end: '12:00', color: 'bg-blue-100 border-blue-300' },
  { id: 'afternoon', label: 'Afternoon', start: '13:00', end: '16:00', color: 'bg-green-100 border-green-300' },
  { id: 'full_day', label: 'Full Day', start: '09:00', end: '17:00', color: 'bg-purple-100 border-purple-300' }
];

function DayDetailsModal({ isOpen, onClose, day }: DayDetailsModalProps) {
  if (!isOpen || !day) return null;

  const formatTime = (timeString: string) => {
    try {
      // Handle different time formats
      if (!timeString) return 'N/A';
      
      // If it's already in HH:MM format, return as is
      if (timeString.match(/^\d{1,2}:\d{2}$/)) {
        return timeString;
      }
      
      // Try to parse as ISO string
      const date = parseISO(timeString);
      if (isNaN(date.getTime())) {
        return 'Invalid time';
      }
      return format(date, 'h:mm a');
    } catch (error) {
      console.error('Error formatting time:', timeString, error);
      return 'Invalid time';
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    try {
      if (!endTime) return 'In Progress';
      
      const start = parseISO(startTime);
      const end = parseISO(endTime);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'Invalid duration';
      }
      
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch (error) {
      console.error('Error formatting duration:', startTime, endTime, error);
      return 'Invalid duration';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {format(day.date, 'EEEE, MMMM d, yyyy')}
                </h2>
                <p className="text-sm text-gray-600">
                  {day.lessons.length} lessons • {day.timeEntries.length} time entries
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Lessons</h3>
                </div>
                <p className="text-2xl font-bold text-blue-900">{day.lessons.length}</p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Hours Worked</h3>
                </div>
                <p className="text-2xl font-bold text-green-900">{day.totalHours.toFixed(1)}h</p>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Earnings</h3>
                </div>
                <p className="text-2xl font-bold text-purple-900">${day.totalEarnings.toFixed(2)}</p>
              </div>
            </div>

            {/* Lessons Section */}
            {day.lessons.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Lessons
                </h3>
                <div className="space-y-3">
                  {day.lessons.map((lesson) => (
                    <div key={lesson.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                          <p className="text-sm text-gray-600">{lesson.sessionType}</p>
                          {lesson.startTime && lesson.endTime && (
                            <p className="text-sm text-gray-600">
                              {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                            </p>
                          )}
                          {lesson.studentIds && lesson.studentIds.length > 0 && (
                            <p className="text-sm text-gray-600">
                              Students: {lesson.studentIds.length}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">${lesson.price}</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            lesson.status === 'completed' ? 'bg-green-100 text-green-800' :
                            lesson.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {lesson.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time Entries Section */}
            {day.timeEntries.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Time Entries
                </h3>
                <div className="space-y-3">
                  {day.timeEntries.map((entry) => (
                    <div key={entry.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">
                              {formatTime(entry.clockIn)} - {entry.clockOut ? formatTime(entry.clockOut) : 'In Progress'}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              entry.status === 'completed' ? 'bg-green-100 text-green-800' :
                              entry.status === 'active' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {entry.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Duration: {formatDuration(entry.clockIn, entry.clockOut)}
                          </p>
                          {entry.hourlyRate && (
                            <p className="text-sm text-gray-600">
                              Rate: ${entry.hourlyRate}/hour
                            </p>
                          )}
                          {entry.breaks && entry.breaks.length > 0 && (
                            <p className="text-sm text-gray-600">
                              Breaks: {entry.breaks.length}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {entry.totalEarnings && (
                            <p className="font-medium text-gray-900">${entry.totalEarnings.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Availability Section */}
            {day.availability.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Availability
                </h3>
                <div className="space-y-3">
                  {day.availability.map((slot) => (
                    <div key={slot.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {slot.startTime} - {slot.endTime}
                          </h4>
                          {slot.source && (
                            <p className="text-sm text-gray-600">
                              Source: {slot.source}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {slot.hourlyRate && (
                            <p className="text-sm text-gray-600">${slot.hourlyRate}/hour</p>
                          )}
                          {slot.totalEarnings && (
                            <p className="font-medium text-gray-900">${slot.totalEarnings.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {day.lessons.length === 0 && day.timeEntries.length === 0 && day.availability.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity</h3>
                <p className="text-gray-600">No lessons, time entries, or availability for this day.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function InstructorCalendar({ user }: InstructorCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate calendar days for current month with proper padding
  const generateCalendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    // Get the start of the week containing the first day of the month
    const calendarStart = startOfWeek(start, { weekStartsOn: 0 }); // Sunday start
    const calendarEnd = endOfWeek(end, { weekStartsOn: 0 }); // Sunday end
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    return days.map(date => ({
      date,
      isCurrentMonth: date.getMonth() === currentMonth.getMonth(),
      isToday: isToday(date),
      lessons: [] as Lesson[],
      availability: [] as Availability[],
      timeEntries: [] as TimeEntry[],
      isAvailable: false,
      availableSlots: [] as string[],
      totalEarnings: 0,
      totalHours: 0
    }));
  }, [currentMonth]);

  // Load data for calendar days
  const loadCalendarData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const days = generateCalendarDays;
      const dataPromises = days.map(async (day) => {
        const dateStr = format(day.date, 'yyyy-MM-dd');
        
        // Load lessons for this day
        const lessons = await getInstructorDailyLessons(user.id, dateStr);
        
        // Load availability for this day
        const availability = await getInstructorAvailability(user.id, dateStr);
        
        // Load time entries for this day
        const timeEntries = await getTimeEntriesByInstructor(user.id, dateStr);
        
        // Calculate total earnings and hours
        const totalEarnings = timeEntries.reduce((sum, entry) => sum + (entry.totalEarnings || 0), 0);
        const totalHours = timeEntries.reduce((sum, entry) => {
          try {
            if (entry.clockOut) {
              const start = parseISO(entry.clockIn);
              const end = parseISO(entry.clockOut);
              
              if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                console.warn('Invalid time entry:', entry);
                return sum;
              }
              
              const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
              return sum + hours;
            }
            return sum;
          } catch (error) {
            console.error('Error calculating hours for entry:', entry, error);
            return sum;
          }
        }, 0);
        
        // Determine available time slots
        const availableSlots = determineAvailableSlots(lessons);
        
        return {
          ...day,
          lessons,
          availability,
          timeEntries,
          isAvailable: availableSlots.length > 0,
          availableSlots,
          totalEarnings,
          totalHours
        };
      });

      const updatedDays = await Promise.all(dataPromises);
      setCalendarDays(updatedDays);
    } catch (err) {
      console.error('Error loading calendar data:', err);
      setError('Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  }, [generateCalendarDays, user?.id]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  const determineAvailableSlots = (lessons: Lesson[]): string[] => {
    const bookedSlots = lessons.map(lesson => lesson.sessionType);
    const availableSlots = timeSlots.filter(slot => !bookedSlots.includes(slot.id as 'morning' | 'afternoon' | 'full_day'));
    return availableSlots.map(slot => slot.id);
  };

  const handleDayClick = (day: CalendarDay) => {
    setSelectedDay(day);
    setShowDayDetails(true);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const getDayContent = (day: CalendarDay) => {
    const hasLessons = day.lessons.length > 0;
    const hasTimeEntries = day.timeEntries.length > 0;
    const hasEarnings = day.totalEarnings > 0;

    return (
      <div className="h-full flex flex-col">
        <div className="text-sm font-medium mb-1">
          {format(day.date, 'd')}
        </div>
        
        {/* Activity Indicators */}
        <div className="flex-1 flex flex-col gap-1">
          {hasLessons && (
            <div className="flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-blue-600" />
              <span className="text-xs text-blue-600">{day.lessons.length}</span>
            </div>
          )}
          
          {hasTimeEntries && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-green-600" />
              <span className="text-xs text-green-600">{day.timeEntries.length}</span>
            </div>
          )}
          
          {hasEarnings && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-purple-600" />
              <span className="text-xs text-purple-600">${day.totalEarnings.toFixed(0)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Calendar</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="px-3 py-3 text-center text-sm font-medium text-gray-900">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              onClick={() => handleDayClick(day)}
              className={`
                min-h-[120px] p-2 border-r border-b border-gray-200 cursor-pointer transition-colors
                ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                hover:bg-gray-50
              `}
            >
              {getDayContent(day)}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Legend</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-600">Lessons</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-600">Time Entries</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-gray-600">Earnings</span>
          </div>
        </div>
      </div>

      {/* Day Details Modal */}
      <DayDetailsModal
        isOpen={showDayDetails}
        onClose={() => setShowDayDetails(false)}
        day={selectedDay}
        user={user}
      />
    </div>
  );
}
