import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { createAvailabilityBatch, deleteAvailabilityForDates, getAvailabilityByInstructorId } from '../../services/availability';
import { getLessonsByInstructor } from '../../services/lessons';
import { getUserById } from '../../services/users';
import type { Availability } from '../../services/availability';
import type { Lesson, User } from '../../types';
import { addMonths, subMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parse } from 'date-fns';

interface AvailabilityFormProps {
  instructorId: string;
  existingAvailability?: Availability[];
  onClose: () => void;
  onUpdate?: () => void;
  isAdmin?: boolean;
}

export function AvailabilityForm({ 
  instructorId, 
  existingAvailability = [], 
  onClose,
  onUpdate,
  isAdmin = false
}: AvailabilityFormProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduledLessons, setScheduledLessons] = useState<Lesson[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);
  const [instructor, setInstructor] = useState<User | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Memoize the existing availability dates to prevent infinite loops
  const existingAvailabilityDates = useMemo(() => {
    return existingAvailability.map(slot => slot.date);
  }, [existingAvailability]);

  // Initialize selectedDates with currently available dates
  useEffect(() => {
    const availableDates = existingAvailabilityDates.map(dateStr => parse(dateStr, 'yyyy-MM-dd', new Date()));
    setSelectedDates(availableDates);
  }, [existingAvailabilityDates]);

  // Load instructor details
  useEffect(() => {
    const loadInstructor = async () => {
      try {
        const instructorData = await getUserById(instructorId);
        setInstructor(instructorData);
      } catch (err) {
        console.error('Error loading instructor:', err);
      }
    };

    loadInstructor();
  }, [instructorId]);

  // Load scheduled lessons
  useEffect(() => {
    const loadLessons = async () => {
      try {
        setIsLoadingLessons(true);
        const lessons = await getLessonsByInstructor(instructorId);
        setScheduledLessons(lessons.filter(lesson => lesson.status === 'scheduled'));
      } catch (err) {
        console.error('Error loading lessons:', err);
      } finally {
        setIsLoadingLessons(false);
      }
    };

    loadLessons();
  }, [instructorId]);

  const handleDateClick = (date: Date) => {
    // Don't allow toggling if there's a scheduled lesson on that date
    if (isDateScheduled(date)) {
      return;
    }

    setSelectedDates(prev => {
      const isSelected = prev.some(d => isSameDay(d, date));
      if (isSelected) {
        return prev.filter(d => !isSameDay(d, date));
      } else {
        return [...prev, date];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      console.log('Submitting availability for dates:', selectedDates);

      // Get all currently available dates
      const currentAvailableDates = existingAvailabilityDates;
      
      // Find dates to add (selected but not currently available)
      const datesToAdd = selectedDates.filter(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return !currentAvailableDates.includes(dateStr);
      });
      
      // Find dates to remove (currently available but not selected)
      const datesToRemove = existingAvailability.filter(slot => {
        const slotDate = parse(slot.date, 'yyyy-MM-dd', new Date());
        return !selectedDates.some(date => isSameDay(date, slotDate));
      }).map(slot => parse(slot.date, 'yyyy-MM-dd', new Date()));

      console.log('Dates to add:', datesToAdd);
      console.log('Dates to remove:', datesToRemove);

      // Add new availability
      if (datesToAdd.length > 0) {
        await createAvailabilityBatch(
          instructorId,
          datesToAdd,
          '09:00',
          '17:00'
        );
        console.log('Successfully created availability batch');
      }

      // Remove availability
      if (datesToRemove.length > 0) {
        await deleteAvailabilityForDates(instructorId, datesToRemove);
        console.log('Successfully deleted availability for dates');
      }

      console.log('Calling onUpdate callback');
      onUpdate?.();
      onClose();
    } catch (err) {
      console.error('Error managing availability:', err);
      setError('Failed to update availability');
      setIsSubmitting(false);
    }
  };

  const isDateAvailable = (date: Date): boolean => {
    if (!Array.isArray(existingAvailability)) return false;
    
    return existingAvailability.some(slot => {
      if (!slot?.date || typeof slot.date !== 'string') return false;
      
      try {
        const slotDate = parse(slot.date, 'yyyy-MM-dd', new Date());
        return isSameDay(date, slotDate);
      } catch (err) {
        console.error('Error parsing date:', err);
        return false;
      }
    });
  };

  const isDateScheduled = (date: Date): boolean => {
    return scheduledLessons.some(lesson => {
      if (!lesson.date) return false;
      try {
        const lessonDate = parse(lesson.date, 'yyyy-MM-dd', new Date());
        return isSameDay(date, lessonDate);
      } catch (err) {
        console.error('Error parsing lesson date:', err);
        return false;
      }
    });
  };

  if (isLoadingLessons) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">
              {instructor ? `Manage Availability - ${instructor.name}` : 'Manage Availability'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                  {error}
                </div>
              )}

              {/* Current Availability Display */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Current Availability</h3>
                {existingAvailability && existingAvailability.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      You have {existingAvailability.length} available day{existingAvailability.length !== 1 ? 's' : ''} set up
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {existingAvailability.slice(0, 6).map((slot) => (
                        <div
                          key={slot.id}
                          className="p-2 bg-green-100 border border-green-300 rounded text-xs"
                        >
                          <div className="font-medium text-green-800">
                            {new Date(slot.date).toLocaleDateString()}
                          </div>
                          <div className="text-green-600">
                            {slot.startTime} - {slot.endTime}
                          </div>
                        </div>
                      ))}
                    </div>
                    {existingAvailability.length > 6 && (
                      <p className="text-xs text-gray-500">
                        +{existingAvailability.length - 6} more day{existingAvailability.length - 6 !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No availability set up yet</p>
                )}
              </div>

              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-medium text-gray-900">
                  {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                
                {daysInMonth.map((date, index) => {
                  const isSelected = selectedDates.some(d => isSameDay(d, date));
                  const isAvailable = isDateAvailable(date);
                  const isScheduled = isDateScheduled(date);
                  const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                  const isToday = isSameDay(date, new Date());
                  
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleDateClick(date)}
                      disabled={!isCurrentMonth || isScheduled}
                      className={`
                        p-2 text-sm rounded-lg transition-colors relative
                        ${!isCurrentMonth ? 'text-gray-300' : ''}
                        ${isCurrentMonth && !isScheduled ? 'hover:bg-gray-100' : ''}
                        ${isScheduled ? 'bg-red-50 text-red-400 cursor-not-allowed' : ''}
                        ${isSelected ? 'bg-green-500 text-white' : ''}
                        ${isToday ? 'ring-2 ring-blue-500' : ''}
                      `}
                    >
                      {date.getDate()}
                      {isScheduled && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
                  <span>Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 rounded"></div>
                  <span>Unavailable</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
