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
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 md:px-6 py-4 rounded-t-2xl z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  {instructor ? `Manage Availability` : 'Manage Availability'}
                </h2>
                {instructor && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {instructor.name}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 md:p-6">
            <div className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl">
                  {error}
                </div>
              )}

              {/* Current Availability Display */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Current Availability</h3>
                </div>
                {existingAvailability && existingAvailability.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You have <span className="font-semibold text-gray-900 dark:text-white">{existingAvailability.length}</span> available day{existingAvailability.length !== 1 ? 's' : ''} set up
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {existingAvailability.slice(0, 6).map((slot) => (
                        <div
                          key={slot.id}
                          className="p-2.5 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg text-xs"
                        >
                          <div className="font-semibold text-green-800 dark:text-green-300">
                            {format(parse(slot.date, 'yyyy-MM-dd', new Date()), 'MMM d')}
                          </div>
                          <div className="text-green-600 dark:text-green-400 mt-0.5">
                            {slot.startTime} - {slot.endTime}
                          </div>
                        </div>
                      ))}
                    </div>
                    {existingAvailability.length > 6 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        +{existingAvailability.length - 6} more day{existingAvailability.length - 6 !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No availability set up yet</p>
                )}
              </div>

              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                  {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-xs md:text-sm font-semibold text-gray-500 dark:text-gray-400">
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
                        aspect-square p-1 md:p-2 text-xs md:text-sm rounded-lg transition-all relative
                        ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-700' : 'text-gray-900 dark:text-gray-100'}
                        ${isCurrentMonth && !isScheduled ? 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105' : ''}
                        ${isScheduled ? 'bg-red-50 dark:bg-red-900/20 text-red-400 dark:text-red-400 cursor-not-allowed opacity-60' : ''}
                        ${isSelected ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md scale-105 font-semibold' : ''}
                        ${isToday && !isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
                      `}
                    >
                      {date.getDate()}
                      {isScheduled && (
                        <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 dark:bg-blue-500 rounded"></div>
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded"></div>
                  <span>Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 rounded"></div>
                  <span>Unavailable</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm hover:shadow-md"
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
