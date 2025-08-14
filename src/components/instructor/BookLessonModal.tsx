import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, Target, DollarSign, Info, Check, AlertCircle } from 'lucide-react';
import { createLesson } from '../../services/lessons';
import { getAvailabilityByInstructorId } from '../../services/availability';
import { useAuth } from '../../context/AuthContext';
import { parse, format, isSameDay } from 'date-fns';

interface BookLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructor: {
    id: string;
    name: string;
    price: number;
    specialties: string[];
  };
}

interface BookingForm {
  type: 'private' | 'group';
  date: string;
  time: 'morning' | 'afternoon' | 'full_day';
  participants: number;
  skillLevel: 'first_time' | 'developing_turns' | 'linking_turns' | 'confident_turns' | 'consistent_blue';
  focus: string[];
  notes: string;
}

interface Availability {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

export function BookLessonModal({ isOpen, onClose, instructor }: BookLessonModalProps) {
  const { user } = useAuth();
  
  console.log('BookLessonModal - User:', user);
  console.log('BookLessonModal - User role:', user?.role);
  console.log('BookLessonModal - User ID:', user?.id);
  console.log('BookLessonModal - Instructor:', instructor);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<BookingForm>({
    type: 'private',
    date: '',
    time: 'morning',
    participants: 1,
    skillLevel: 'first_time',
    focus: [],
    notes: ''
  });

  // Fetch instructor availability
  useEffect(() => {
    const loadAvailability = async () => {
      if (!instructor.id) return;
      
      try {
        setIsLoadingAvailability(true);
        const slots = await getAvailabilityByInstructorId(instructor.id);
        setAvailability(slots);
      } catch (err) {
        console.error('Error loading availability:', err);
        setError('Failed to load instructor availability');
      } finally {
        setIsLoadingAvailability(false);
      }
    };

    if (isOpen) {
      loadAvailability();
    }
  }, [instructor.id, isOpen]);

  // Update available times when date changes
  useEffect(() => {
    if (!formData.date) {
      setAvailableTimes([]);
      return;
    }

    const selectedDateSlots = availability.filter(slot => {
      try {
        if (typeof slot?.date !== 'string') return false;
        const slotDate = parse(slot.date, 'yyyy-MM-dd', new Date());
        const selectedDate = parse(formData.date, 'yyyy-MM-dd', new Date());
        return isSameDay(slotDate, selectedDate);
      } catch (err) {
        console.error('Error parsing date:', err);
        return false;
      }
    });

    // Map availability times to lesson time format
    const times = selectedDateSlots.map(slot => {
      const startHour = parseInt(slot.startTime.split(':')[0]);
      if (startHour < 12) return 'morning';
      if (startHour < 17) return 'afternoon';
      return 'full_day';
    });
    
    // Remove duplicates
    const uniqueTimes = [...new Set(times)];
    setAvailableTimes(uniqueTimes);

    // Reset time if current selection is not available
    if (uniqueTimes.length > 0 && !uniqueTimes.includes(formData.time)) {
      setFormData(prev => ({ ...prev, time: uniqueTimes[0] as 'morning' | 'afternoon' | 'full_day' }));
    }
  }, [formData.date, availability]);

  const calculateTotal = () => {
    const basePrice = instructor.price || 0;
    console.log('Instructor price:', instructor.price, 'Base price:', basePrice);
    return formData.type === 'private' 
      ? basePrice 
      : basePrice * formData.participants;
  };

  const isDateAvailable = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') return false;
    
    try {
      const date = parse(dateStr, 'yyyy-MM-dd', new Date());
      return availability.some(slot => {
        if (typeof slot?.date !== 'string') return false;
        try {
          const slotDate = parse(slot.date, 'yyyy-MM-dd', new Date());
          return isSameDay(slotDate, date);
        } catch {
          return false;
        }
      });
    } catch (err) {
      console.error('Error checking date availability:', err);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('User:', user);
    console.log('Instructor:', instructor);
    
    if (!user) {
      setError('Please sign in to book a lesson');
      return;
    }

    if (!isDateAvailable(formData.date)) {
      setError('Selected date is not available');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);

      // Map time to start/end times
      const getTimeRange = (time: string) => {
        switch (time) {
          case 'morning':
            return { startTime: '09:00', endTime: '12:00' };
          case 'afternoon':
            return { startTime: '12:00', endTime: '17:00' };
          case 'full_day':
            return { startTime: '09:00', endTime: '17:00' };
          default:
            return { startTime: '09:00', endTime: '12:00' };
        }
      };

      const timeRange = getTimeRange(formData.time);

      // Create lesson with studentIds array
      const lessonData = {
        title: `${formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} Lesson with ${instructor.name}`,
        instructorId: instructor.id,
        studentIds: [user.id],
        date: formData.date,
        time: formData.time,
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
        status: 'scheduled' as const,
        notes: formData.notes || '',
        skillsFocus: formData.focus,
        type: formData.type,
        maxStudents: Number(formData.participants),
        skillLevel: formData.skillLevel,
        price: calculateTotal(),
        description: `${formData.type} lesson focusing on ${formData.focus.join(', ')}`
      };

      console.log('Lesson data being sent:', lessonData);
      console.log('Instructor data:', instructor);

      await createLesson(lessonData);
      setSuccess(true);
    } catch (err: any) {
      console.error('Error booking lesson:', err);
      setError(err.message || 'Failed to book lesson');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {success ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
              <p className="text-gray-600 mb-6">
                Your lesson has been successfully booked with {instructor.name}.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Book a Lesson</h2>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {isLoadingAvailability ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Lesson Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lesson Type
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {['private', 'group'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            type: type as 'private' | 'group',
                            participants: type === 'private' ? 1 : prev.participants
                          }))}
                          className={`p-4 border rounded-lg text-left ${
                            formData.type === type
                              ? 'border-blue-600 bg-blue-50 text-blue-600'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium mb-1">
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {type === 'private' 
                              ? '1-on-1 personalized instruction'
                              : 'Learn with others at similar skill level'
                            }
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        id="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.date}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          if (!isDateAvailable(newDate)) {
                            setError('Selected date is not available');
                          } else {
                            setError(null);
                          }
                          setFormData(prev => ({ ...prev, date: newDate }));
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          formData.date && !isDateAvailable(formData.date)
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300'
                        }`}
                      />
                      {formData.date && !isDateAvailable(formData.date) && (
                        <p className="mt-1 text-sm text-red-600">
                          Instructor is not available on this date
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                        Time
                      </label>
                      <select
                        id="time"
                        required
                        value={formData.time}
                        onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value as 'morning' | 'afternoon' | 'full_day' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!formData.date || availableTimes.length === 0}
                      >
                        <option value="">Select a time</option>
                        {availableTimes.map(time => (
                          <option key={time} value={time}>
                            {time === 'morning' ? 'Morning (9 AM - 12 PM)' :
                             time === 'afternoon' ? 'Afternoon (12 PM - 5 PM)' :
                             'Full Day (9 AM - 5 PM)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Duration and Participants */}
                  <div className="grid grid-cols-2 gap-4">
                    {formData.type === 'group' && (
                      <div>
                        <label htmlFor="participants" className="block text-sm font-medium text-gray-700 mb-2">
                          Number of Participants
                        </label>
                        <input
                          type="number"
                          id="participants"
                          min="2"
                          max="6"
                          value={formData.participants}
                          onChange={(e) => setFormData(prev => ({ ...prev, participants: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>

                  {/* Skill Level */}
                  <div>
                    <label htmlFor="skillLevel" className="block text-sm font-medium text-gray-700 mb-2">
                      Skill Level
                    </label>
                    <select
                      id="skillLevel"
                      value={formData.skillLevel}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        skillLevel: e.target.value as 'first_time' | 'developing_turns' | 'linking_turns' | 'confident_turns' | 'consistent_blue'
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="first_time">First Time</option>
                      <option value="developing_turns">Developing Turns</option>
                      <option value="linking_turns">Linking Turns</option>
                      <option value="confident_turns">Confident Turns</option>
                      <option value="consistent_blue">Consistent Blue</option>
                    </select>
                  </div>

                  {/* Areas of Focus */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Areas of Focus
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {instructor.specialties.map((specialty) => (
                        <label key={specialty} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.focus.includes(specialty)}
                            onChange={(e) => {
                              const newFocus = e.target.checked
                                ? [...formData.focus, specialty]
                                : formData.focus.filter(f => f !== specialty);
                              setFormData(prev => ({ ...prev, focus: newFocus }));
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-gray-700">{specialty}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Any specific goals or concerns..."
                    />
                  </div>

                  {/* Price Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Base Rate</span>
                      <span className="font-medium">${instructor.price}/hour</span>
                    </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600">Participants</span>
                        <span className="font-medium">{formData.participants}</span>
                      </div>
                    <div className="border-t border-gray-200 mt-2 pt-2 flex items-center justify-between">
                      <span className="font-medium">Total</span>
                      <span className="text-lg font-bold">${calculateTotal()}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.date || !isDateAvailable(formData.date)}
                      className={`px-6 py-2 bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 ${
                        (isSubmitting || !formData.date || !isDateAvailable(formData.date))
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-blue-700'
                      }`}
                    >
                      {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}