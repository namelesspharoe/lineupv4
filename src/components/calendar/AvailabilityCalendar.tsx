import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, User, MapPin } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { getInstructorDailyLessons } from '../../services/lessons';
import { getInstructorAvailability } from '../../services/availability';
import { User as UserType, Lesson, Availability } from '../../types';
import { DayDetailsModal } from './DayDetailsModal';

interface AvailabilityCalendarProps {
  instructor?: UserType;
  onLessonCreated?: () => void;
  viewMode?: 'instructor' | 'admin' | 'student';
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  lessons: Lesson[];
  availability: Availability[];
  isAvailable: boolean;
  availableSlots: string[];
}

const timeSlots = [
  { id: 'morning', label: 'Morning', start: '09:00', end: '12:00', color: 'bg-blue-100 border-blue-300' },
  { id: 'afternoon', label: 'Afternoon', start: '13:00', end: '16:00', color: 'bg-green-100 border-green-300' },
  { id: 'full_day', label: 'Full Day', start: '09:00', end: '17:00', color: 'bg-purple-100 border-purple-300' }
];

export function AvailabilityCalendar({ 
  instructor, 
  onLessonCreated,
  viewMode = 'instructor' 
}: AvailabilityCalendarProps) {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get the instructor ID based on view mode
  const instructorId = useMemo(() => {
    if (viewMode === 'instructor') return user?.id;
    if (instructor) return instructor.id;
    return null;
  }, [viewMode, user?.id, instructor?.id, instructor]);

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
      isAvailable: false,
      availableSlots: [] as string[]
    }));
  }, [currentMonth]);

  // Load data for calendar days
  const loadCalendarData = useCallback(async () => {
    if (!instructorId) return;

    setIsLoading(true);
    setError(null);

    try {
      const days = generateCalendarDays;
              const dataPromises = days.map(async (day) => {
          const dateStr = format(day.date, 'yyyy-MM-dd');
          
          // Load lessons for this day
          const lessons = await getInstructorDailyLessons(instructorId, dateStr);
          
          // Load availability for this day
          const availability = await getInstructorAvailability(instructorId, dateStr);
          

          
          // Determine available time slots
          const availableSlots = determineAvailableSlots(lessons, availability);
          
          return {
            ...day,
            lessons,
            availability,
            isAvailable: availableSlots.length > 0,
            availableSlots
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
  }, [instructorId, generateCalendarDays]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  const determineAvailableSlots = (lessons: Lesson[], availability: Availability[]): string[] => {
    // Start with all time slots
    let availableSlots = [...timeSlots.map(slot => slot.id)];
    
    // Remove slots that have lessons (regardless of status, except cancelled)
    lessons.forEach(lesson => {
      // Skip cancelled lessons as they don't block the time slot
      if (lesson.status === 'cancelled') return;
      
      if (lesson.sessionType === 'morning') {
        const index = availableSlots.indexOf('morning');
        if (index > -1) availableSlots.splice(index, 1);
      } else if (lesson.sessionType === 'afternoon') {
        const index = availableSlots.indexOf('afternoon');
        if (index > -1) availableSlots.splice(index, 1);
      } else if (lesson.sessionType === 'full_day') {
        // Full day lessons block morning, afternoon, and full day slots
        const fullDayIndex = availableSlots.indexOf('full_day');
        const morningIndex = availableSlots.indexOf('morning');
        const afternoonIndex = availableSlots.indexOf('afternoon');
        
        // Remove full day slot
        if (fullDayIndex > -1) availableSlots.splice(fullDayIndex, 1);
        // Remove morning slot
        if (morningIndex > -1) availableSlots.splice(morningIndex, 1);
        // Remove afternoon slot
        if (afternoonIndex > -1) availableSlots.splice(afternoonIndex, 1);
      }
    });

    // Additional check: if there are both morning and afternoon lessons, also block full day
    const hasMorningLesson = lessons.some(lesson => 
      lesson.status !== 'cancelled' && lesson.sessionType === 'morning'
    );
    const hasAfternoonLesson = lessons.some(lesson => 
      lesson.status !== 'cancelled' && lesson.sessionType === 'afternoon'
    );
    
    if (hasMorningLesson && hasAfternoonLesson) {
      const fullDayIndex = availableSlots.indexOf('full_day');
      if (fullDayIndex > -1) availableSlots.splice(fullDayIndex, 1);
    }

    // If availability is set, filter by availability records
    if (availability.length > 0) {
      const availabilitySlots: string[] = [];
      
      availability.forEach(avail => {
        const startHour = parseInt(avail.startTime.split(':')[0]);
        const endHour = parseInt(avail.endTime.split(':')[0]);
        
        // Determine which time slots this availability covers
        if (startHour <= 9 && endHour >= 12) {
          availabilitySlots.push('morning');
        }
        if (startHour <= 13 && endHour >= 16) {
          availabilitySlots.push('afternoon');
        }
        if (startHour <= 9 && endHour >= 17) {
          availabilitySlots.push('full_day');
        }
      });

      // Only show slots that are both available and not booked
      availableSlots = availableSlots.filter(slot => availabilitySlots.includes(slot));
    }

    return availableSlots;
  };

  const handleDateClick = (day: CalendarDay) => {
    setSelectedDay(day);
    setShowDayDetails(true);
  };

  const handleTimeSlotClick = (day: CalendarDay, timeSlot: string) => {
    setSelectedDay({
      ...day,
      availableSlots: [timeSlot] // Focus on the specific time slot clicked
    });
    setShowDayDetails(true);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleLessonCreated = () => {
    setShowDayDetails(false);
    setSelectedDay(null);
    onLessonCreated?.();
    // Reload calendar data properly instead of page reload
    loadCalendarData();
  };

  const getDayClasses = (day: CalendarDay) => {
    let classes = 'min-h-[120px] p-2 border border-gray-200 transition-colors';
    
    if (!day.isCurrentMonth) {
      classes += ' bg-gray-50 text-gray-400';
    } else if (day.isToday) {
      classes += ' bg-blue-50 border-blue-300';
    } else if (day.isAvailable) {
      classes += ' hover:bg-green-50 hover:border-green-300 cursor-pointer';
    } else {
      classes += ' bg-gray-50 text-gray-500';
    }
    
    return classes;
  };

  const getTimeSlotClasses = (slotId: string) => {
    const slot = timeSlots.find(s => s.id === slotId);
    return `text-xs px-2 py-1 rounded border ${slot?.color} text-gray-700 font-medium hover:bg-opacity-80 transition-colors`;
  };

  if (!instructorId) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No instructor selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {viewMode === 'instructor' ? 'My Availability' : `${instructor?.name}'s Availability`}
          </h2>
          {instructor && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{instructor.name}</span>
              {instructor.preferredLocations?.[0] && (
                <>
                  <MapPin className="w-4 h-4" />
                  <span>{instructor.preferredLocations[0]}</span>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 min-w-[120px] text-center">
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

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
          <span>Morning (9AM-12PM)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
          <span>Afternoon (1PM-4PM)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
          <span>Full Day (9AM-5PM)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 text-red-700 text-xs px-1 rounded"></div>
          <span>Lesson Count</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadCalendarData}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Calendar Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center font-medium text-gray-700 bg-gray-50">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={getDayClasses(day)}
              onClick={() => handleDateClick(day)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium ${day.isToday ? 'text-blue-600' : ''}`}>
                  {format(day.date, 'd')}
                </span>
                {day.lessons.length > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-1 rounded" title={`${day.lessons.length} lesson(s)`}>
                    {day.lessons.length}
                  </span>
                )}
              </div>

              {/* Available Time Slots */}
              <div className="space-y-1">
                {day.availableSlots.map(slotId => (
                  <button
                    key={slotId}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTimeSlotClick(day, slotId);
                    }}
                    className={`w-full text-left ${getTimeSlotClasses(slotId)}`}
                  >
                    {timeSlots.find(s => s.id === slotId)?.label}
                  </button>
                ))}
              </div>

              {/* Existing Lessons */}
              {day.lessons.map(lesson => (
                <div
                  key={lesson.id}
                  className={`text-xs px-1 py-0.5 rounded mt-1 truncate ${
                    lesson.status === 'completed' 
                      ? 'bg-green-200 text-green-700' 
                      : lesson.status === 'cancelled'
                      ? 'bg-red-200 text-red-700'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                  title={`${lesson.title} - ${lesson.sessionType} (${lesson.status})`}
                >
                  {lesson.title || 'Untitled Lesson'}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Click on available time slots to create lessons
        </div>
        
        {viewMode === 'instructor' && (
          <button
            onClick={() => setShowDayDetails(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Lesson
          </button>
        )}
      </div>

      {/* Day Details Modal */}
      {showDayDetails && selectedDay && (
        <DayDetailsModal
          isOpen={showDayDetails}
          onClose={() => {
            setShowDayDetails(false);
            setSelectedDay(null);
          }}
          date={selectedDay.date}
          lessons={selectedDay.lessons}
          availability={selectedDay.availability}
          availableSlots={selectedDay.availableSlots}
          instructor={instructor}
          instructorId={instructorId}
          onLessonCreated={handleLessonCreated}
        />
      )}
    </div>
  );
} 