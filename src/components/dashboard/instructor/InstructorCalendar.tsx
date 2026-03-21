import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, DollarSign, BookOpen, X, Plus } from 'lucide-react';
import { ResponsiveModalPanel } from '../../common/ResponsiveModalPanel';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, startOfWeek, endOfWeek, parseISO } from 'date-fns';

import { getInstructorDailyLessons } from '../../../services/lessons';
import { getInstructorAvailability } from '../../../services/availability';
import { getTimeEntriesByInstructor } from '../../../services/timesheet';
import { User, Lesson, Availability, TimeEntry } from '../../../types';
import { payCategoryLabel, resolvePayCategory } from '../../../utils/instructorPayroll';
import { useAuth } from '../../../context/AuthContext';
import { CreateLessonModal } from './CreateLessonModal';

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
  /** yyyy-MM-dd — opens create flow with that date pre-filled */
  onScheduleLesson?: (dateKey: string) => void;
}

const timeSlots = [
  { id: 'morning', label: 'Morning', start: '09:00', end: '12:00', color: 'bg-blue-100 border-blue-300' },
  { id: 'afternoon', label: 'Afternoon', start: '13:00', end: '16:00', color: 'bg-green-100 border-green-300' },
  { id: 'full_day', label: 'Full Day', start: '09:00', end: '17:00', color: 'bg-purple-100 border-purple-300' }
];

function DayDetailsModal({ isOpen, onClose, day, onScheduleLesson }: DayDetailsModalProps) {
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
    <ResponsiveModalPanel onClose={onClose} labelledBy="calendar-day-detail-title" maxWidthClass="sm:max-w-4xl">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:inset-x-0 sm:top-0 sm:z-20 sm:border-0 sm:bg-transparent sm:px-6 sm:py-3">
        <div className="min-w-0">
          <h2 id="calendar-day-detail-title" className="text-xl font-bold text-gray-900 dark:text-white">
            {format(day.date, 'EEEE, MMMM d, yyyy')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {day.lessons.length} lessons • {day.timeEntries.length} time entries
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-6 pt-2 sm:px-6 sm:pb-6 sm:pt-20">
        <div className="space-y-6">
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
                          <p className="text-sm text-gray-600">
                            {payCategoryLabel(entry.payCategory ?? resolvePayCategory(entry.lessonId))}
                            {entry.hourlyRate != null && ` · $${entry.hourlyRate}/hr`}
                          </p>
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
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/90 px-4 py-8 text-center dark:border-gray-600 dark:bg-gray-800/50 sm:px-8">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" aria-hidden />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Nothing scheduled for this day
                </h3>
                <p className="mx-auto mt-2 max-w-lg text-sm text-gray-600 dark:text-gray-300">
                  {format(day.date, 'EEEE, MMMM d, yyyy')} doesn&apos;t have any lessons, clocked time, or
                  availability blocks tied to it yet. That usually means a clear day on the mountain or data
                  that hasn&apos;t been added.
                </p>
                <div className="mx-auto mt-6 max-w-md rounded-lg bg-white/80 p-4 text-left text-sm text-gray-600 shadow-sm dark:bg-gray-900/60 dark:text-gray-300">
                  <p className="mb-2 font-medium text-gray-900 dark:text-white">What you can do next</p>
                  <ul className="list-inside list-disc space-y-2 marker:text-blue-500">
                    <li>
                      <span className="-ml-1">Add a lesson on this date so it shows up here and in your active list.</span>
                    </li>
                    <li>
                      <span className="-ml-1">Clock in/out from an in-progress lesson to record hours and earnings.</span>
                    </li>
                    <li>
                      <span className="-ml-1">Update availability from your dashboard so students can book open slots.</span>
                    </li>
                  </ul>
                </div>
                {onScheduleLesson && (
                  <button
                    type="button"
                    onClick={() => onScheduleLesson(format(day.date, 'yyyy-MM-dd'))}
                    className="mt-6 inline-flex min-h-[44px] w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 sm:w-auto"
                  >
                    <Plus className="h-5 w-5 shrink-0" aria-hidden />
                    Schedule lesson
                  </button>
                )}
              </div>
            )}
        </div>
      </div>
    </ResponsiveModalPanel>
  );
}

export function InstructorCalendar({ user }: InstructorCalendarProps) {
  const { user: authUser } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scheduleLessonOpen, setScheduleLessonOpen] = useState(false);
  const [scheduleLessonDate, setScheduleLessonDate] = useState<string | null>(null);

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

  const handleScheduleLessonFromDay = useCallback((dateKey: string) => {
    setShowDayDetails(false);
    setSelectedDay(null);
    setScheduleLessonDate(dateKey);
    setScheduleLessonOpen(true);
  }, []);

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

  const monthDaysForList = useMemo(
    () => calendarDays.filter((d) => d.isCurrentMonth),
    [calendarDays]
  );

  const hasDayActivity = (day: CalendarDay) =>
    day.lessons.length > 0 || day.timeEntries.length > 0 || day.totalEarnings > 0;

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Calendar</h2>
        <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-4">
          <button
            type="button"
            onClick={handlePreviousMonth}
            className="rounded-lg p-2.5 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="min-w-0 flex-1 text-center text-base font-semibold text-gray-900 dark:text-white sm:flex-none sm:text-lg">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            type="button"
            onClick={handleNextMonth}
            className="rounded-lg p-2.5 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile: chronological list of days in the visible month */}
      <div className="md:hidden space-y-2">
        {monthDaysForList.map((day) => {
          const active = hasDayActivity(day);
          return (
            <button
              key={format(day.date, 'yyyy-MM-dd')}
              type="button"
              onClick={() => handleDayClick(day)}
              className={`
                flex w-full min-h-[3.5rem] items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors
                border-gray-200 bg-white active:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:active:bg-gray-800
                ${day.isToday ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-100 dark:ring-offset-gray-950' : ''}
              `}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {format(day.date, 'EEE, MMM d')}
                  </span>
                  {day.isToday && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                      Today
                    </span>
                  )}
                </div>
                {!active && (
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">No scheduled activity</p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm">
                {day.lessons.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <BookOpen className="h-4 w-4" aria-hidden />
                    <span>{day.lessons.length}</span>
                  </span>
                )}
                {day.timeEntries.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                    <Clock className="h-4 w-4" aria-hidden />
                    <span>{day.timeEntries.length}</span>
                  </span>
                )}
                {day.totalEarnings > 0 && (
                  <span className="inline-flex items-center gap-1 font-medium text-purple-600 dark:text-purple-400">
                    <DollarSign className="h-4 w-4" aria-hidden />
                    <span>${day.totalEarnings.toFixed(0)}</span>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* md+: week grid */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/80">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="px-3 py-3 text-center text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              role="button"
              tabIndex={0}
              onClick={() => handleDayClick(day)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleDayClick(day);
                }
              }}
              className={`
                min-h-[120px] cursor-pointer border-b border-r border-gray-200 p-2 transition-colors dark:border-gray-700
                ${day.isCurrentMonth ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-900/60'}
                ${day.isToday ? 'ring-2 ring-inset ring-blue-500' : ''}
                hover:bg-gray-50 dark:hover:bg-gray-800/80
              `}
            >
              {getDayContent(day)}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/60">
        <h4 className="mb-3 font-medium text-gray-900 dark:text-white">Legend</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Lessons</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Time Entries</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Earnings</span>
          </div>
        </div>
      </div>

      {/* Day Details Modal */}
      <DayDetailsModal
        isOpen={showDayDetails}
        onClose={() => setShowDayDetails(false)}
        day={selectedDay}
        user={user}
        onScheduleLesson={handleScheduleLessonFromDay}
      />

      {scheduleLessonOpen && (
        <CreateLessonModal
          isOpen={scheduleLessonOpen}
          initialDate={scheduleLessonDate || undefined}
          isAdmin={authUser?.role === 'admin'}
          prefillInstructor={authUser?.role === 'admin' ? user : undefined}
          onClose={() => {
            setScheduleLessonOpen(false);
            setScheduleLessonDate(null);
          }}
          onCreated={() => {
            void loadCalendarData();
            setScheduleLessonOpen(false);
            setScheduleLessonDate(null);
          }}
        />
      )}
    </div>
  );
}
