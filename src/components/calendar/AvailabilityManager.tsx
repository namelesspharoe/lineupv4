import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Save, X, Plus, Trash2 } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { createAvailabilityBatch, deleteAvailabilityForDates, getAvailabilityByInstructorId } from '../../services/availability';
import { Availability } from '../../types';

interface AvailabilityManagerProps {
  onClose: () => void;
  onSaved?: () => void;
}

interface AvailabilityPattern {
  days: string[];
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const daysOfWeek = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

const timeSlots = [
  { label: 'Morning (9:00 AM - 12:00 PM)', start: '09:00', end: '12:00' },
  { label: 'Afternoon (1:00 PM - 4:00 PM)', start: '13:00', end: '16:00' },
  { label: 'Full Day (9:00 AM - 5:00 PM)', start: '09:00', end: '17:00' },
  { label: 'Custom', start: '', end: '' }
];

export function AvailabilityManager({ onClose, onSaved }: AvailabilityManagerProps) {
  const { user } = useAuth();
  const [patterns, setPatterns] = useState<AvailabilityPattern[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadExistingAvailability();
    }
  }, [user]);

  const loadExistingAvailability = async () => {
    try {
      const availability = await getAvailabilityByInstructorId(user!.id);
      // Convert availability to patterns (simplified for now)
      console.log('Existing availability:', availability);
    } catch (err) {
      console.error('Error loading availability:', err);
    }
  };

  const addPattern = () => {
    setPatterns([
      ...patterns,
      {
        days: [],
        startTime: '09:00',
        endTime: '12:00',
        isActive: true
      }
    ]);
  };

  const updatePattern = (index: number, updates: Partial<AvailabilityPattern>) => {
    setPatterns(patterns.map((pattern, i) => 
      i === index ? { ...pattern, ...updates } : pattern
    ));
  };

  const removePattern = (index: number) => {
    setPatterns(patterns.filter((_, i) => i !== index));
  };

  const toggleDay = (patternIndex: number, day: string) => {
    const pattern = patterns[patternIndex];
    const newDays = pattern.days.includes(day)
      ? pattern.days.filter(d => d !== day)
      : [...pattern.days, day];
    
    updatePattern(patternIndex, { days: newDays });
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  };

  const isDateSelected = (date: Date) => {
    return selectedDates.some(selected => 
      format(selected, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const toggleDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setSelectedDates(prev => {
      const isSelected = prev.some(d => format(d, 'yyyy-MM-dd') === dateStr);
      if (isSelected) {
        return prev.filter(d => format(d, 'yyyy-MM-dd') !== dateStr);
      } else {
        return [...prev, date];
      }
    });
  };

  const handleSavePatterns = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Generate dates for the next 3 months based on patterns
      const dates: Date[] = [];
      const startDate = new Date();
      const endDate = addDays(startDate, 90); // 3 months

      // Group dates by pattern to use correct times
      const patternGroups: { [key: string]: Date[] } = {};

      for (let date = new Date(startDate); date <= endDate; date = addDays(date, 1)) {
        const dayOfWeek = format(date, 'EEEE').toLowerCase();
        
        // Check if this date matches any pattern
        const matchingPattern = patterns.find(pattern => 
          pattern.isActive && pattern.days.includes(dayOfWeek)
        );

        if (matchingPattern) {
          const patternKey = `${matchingPattern.startTime}-${matchingPattern.endTime}`;
          if (!patternGroups[patternKey]) {
            patternGroups[patternKey] = [];
          }
          patternGroups[patternKey].push(date);
        }
      }

      // Create availability for each pattern group
      let totalCreated = 0;
      for (const [patternKey, patternDates] of Object.entries(patternGroups)) {
        const [startTime, endTime] = patternKey.split('-');
        await createAvailabilityBatch(user.id, patternDates, startTime, endTime);
        totalCreated += patternDates.length;
      }

      if (totalCreated > 0) {
        setSuccess(`Created availability for ${totalCreated} days`);
      } else {
        setSuccess('No availability patterns to save');
      }

      onSaved?.();
    } catch (err) {
      console.error('Error saving availability:', err);
      setError('Failed to save availability');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSelectedDates = async () => {
    if (!user || selectedDates.length === 0) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Use default time slots for selected dates
      await createAvailabilityBatch(user.id, selectedDates, '09:00', '17:00');
      setSuccess(`Created availability for ${selectedDates.length} selected dates`);
      setSelectedDates([]);
      onSaved?.();
    } catch (err) {
      console.error('Error saving selected dates:', err);
      setError('Failed to save selected dates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSelectedDates = async () => {
    if (!user || selectedDates.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      await deleteAvailabilityForDates(user.id, selectedDates);
      setSuccess(`Deleted availability for ${selectedDates.length} dates`);
      setSelectedDates([]);
      onSaved?.();
    } catch (err) {
      console.error('Error deleting dates:', err);
      setError('Failed to delete selected dates');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Manage Availability</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Error/Success Messages */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600">{success}</p>
              </div>
            )}

            {/* Pattern-Based Availability */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Weekly Patterns</h3>
                <button
                  onClick={addPattern}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Pattern
                </button>
              </div>

              {patterns.length === 0 ? (
                <div className="p-6 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No availability patterns set</p>
                  <p className="text-sm">Click "Add Pattern" to create your first availability pattern</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {patterns.map((pattern, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Pattern {index + 1}</h4>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={pattern.isActive}
                              onChange={(e) => updatePattern(index, { isActive: e.target.checked })}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-600">Active</span>
                          </label>
                          <button
                            onClick={() => removePattern(index)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Days Selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Days of Week
                        </label>
                        <div className="grid grid-cols-7 gap-2">
                          {daysOfWeek.map(day => (
                            <label key={day.value} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={pattern.days.includes(day.value)}
                                onChange={() => toggleDay(index, day.value)}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm text-gray-700">{day.label.slice(0, 3)}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Time Selection */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={pattern.startTime}
                            onChange={(e) => updatePattern(index, { startTime: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Time
                          </label>
                          <input
                            type="time"
                            value={pattern.endTime}
                            onChange={(e) => updatePattern(index, { endTime: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Date Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Quick Date Selection</h3>
              
              {/* Week Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ← Previous Week
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM d')} - {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM d, yyyy')}
                </span>
                <button
                  onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Next Week →
                </button>
              </div>

              {/* Week Grid */}
              <div className="grid grid-cols-7 gap-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-700 bg-gray-50">
                    {day}
                  </div>
                ))}
                {getWeekDays().map((date, index) => (
                  <button
                    key={index}
                    onClick={() => toggleDate(date)}
                    className={`p-4 text-center border border-gray-200 rounded-lg transition-colors ${
                      isDateSelected(date)
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{format(date, 'd')}</div>
                    <div className="text-xs text-gray-500">{format(date, 'MMM')}</div>
                  </button>
                ))}
              </div>

              {/* Selected Dates Actions */}
              {selectedDates.length > 0 && (
                <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm text-blue-700">
                    {selectedDates.length} date(s) selected
                  </span>
                  <button
                    onClick={handleSaveSelectedDates}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                  >
                    Set Available
                  </button>
                  <button
                    onClick={handleDeleteSelectedDates}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePatterns}
                disabled={isLoading || patterns.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving...' : 'Save Patterns'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 