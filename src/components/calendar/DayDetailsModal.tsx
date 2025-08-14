import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, MapPin, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { Lesson, Availability, User as UserType } from '../../types';
import { createLesson } from '../../services/lessons';

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  lessons: Lesson[];
  availability: Availability[];
  availableSlots?: string[];
  instructor?: UserType;
  instructorId?: string;
  onLessonCreated?: () => void;
}

export function DayDetailsModal({
  isOpen,
  onClose,
  date,
  lessons,
  availability,
  availableSlots = [],
  instructor,
  instructorId,
  onLessonCreated
}: DayDetailsModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: '',
    time: 'morning' as 'morning' | 'afternoon' | 'full_day',
    skillLevel: 'first_time' as 'first_time' | 'developing_turns' | 'linking_turns' | 'confident_turns' | 'consistent_blue',
    maxStudents: 1,
    price: 50
  });

  if (!isOpen) return null;

  const timeSlots = [
    { id: 'morning', label: 'Morning', start: '09:00', end: '12:00' },
    { id: 'afternoon', label: 'Afternoon', start: '13:00', end: '16:00' },
    { id: 'full_day', label: 'Full Day', start: '09:00', end: '17:00' }
  ];

  const getLessonsForTimeSlot = (timeSlot: string) => {
    return lessons.filter(lesson => lesson.time === timeSlot);
  };

  const isAvailableForTimeSlot = (timeSlot: string) => {
    // Check if the slot is in availableSlots (from calendar calculation)
    if (availableSlots.includes(timeSlot)) {
      return true;
    }
    
    // Fallback to availability records
    return availability.some(avail => 
      avail.startTime === timeSlots.find(ts => ts.id === timeSlot)?.start &&
      avail.endTime === timeSlots.find(ts => ts.id === timeSlot)?.end
    );
  };

  const handleCreateLesson = async () => {
    if (!instructorId || !user) return;

    setIsLoading(true);
    try {
      // Map time slot to start and end times
      const timeSlot = timeSlots.find(ts => ts.id === newLesson.time);
      if (!timeSlot) {
        throw new Error('Invalid time slot');
      }

      const lessonData = {
        title: newLesson.title,
        instructorId,
        date: format(date, 'yyyy-MM-dd'),
        startTime: timeSlot.start,
        endTime: timeSlot.end,
        time: newLesson.time, // Keep the time slot for reference
        skillLevel: newLesson.skillLevel,
        maxStudents: newLesson.maxStudents,
        price: newLesson.price,
        status: 'scheduled' as const,
        studentIds: [],
        skillsFocus: [],
        notes: '',
        type: 'private' as const,
        description: newLesson.title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await createLesson(lessonData);
      setShowCreateForm(false);
      setNewLesson({
        title: '',
        time: 'morning',
        skillLevel: 'first_time',
        maxStudents: 1,
        price: 50
      });
      onLessonCreated?.();
    } catch (error) {
      console.error('Error creating lesson:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {format(date, 'EEEE, MMMM d, yyyy')}
                </h2>
                {instructor && (
                  <p className="text-gray-600">
                    Schedule for {instructor.name}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {timeSlots.map((timeSlot) => {
                const slotLessons = getLessonsForTimeSlot(timeSlot.id);
                const isAvailable = isAvailableForTimeSlot(timeSlot.id);

                return (
                  <div key={timeSlot.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{timeSlot.label}</span>
                        <span className="text-sm text-gray-500">
                          ({timeSlot.start} - {timeSlot.end})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAvailable && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Available
                          </span>
                        )}
                        {slotLessons.length > 0 && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {slotLessons.length} lesson{slotLessons.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {slotLessons.length > 0 ? (
                      <div className="space-y-2">
                        {slotLessons.map((lesson) => (
                          <div key={lesson.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                                <p className="text-sm text-gray-600">
                                  {lesson.studentIds.length} student{lesson.studentIds.length !== 1 ? 's' : ''} • {lesson.skillLevel}
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                lesson.status === 'completed' ? 'bg-green-100 text-green-800' :
                                lesson.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                lesson.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {lesson.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        {isAvailable ? 'No lessons scheduled' : 'Not available'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {user?.role === 'instructor' && availableSlots.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                {!showCreateForm ? (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Lesson
                  </button>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Create New Lesson</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={newLesson.title}
                          onChange={(e) => setNewLesson(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Lesson title"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Time Slot
                        </label>
                        <select
                          value={newLesson.time}
                          onChange={(e) => setNewLesson(prev => ({ ...prev, time: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {availableSlots.map(slot => (
                            <option key={slot} value={slot}>
                              {timeSlots.find(ts => ts.id === slot)?.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Skill Level
                        </label>
                        <select
                          value={newLesson.skillLevel}
                          onChange={(e) => setNewLesson(prev => ({ ...prev, skillLevel: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="first_time">First Time</option>
                          <option value="developing_turns">Developing Turns</option>
                          <option value="linking_turns">Linking Turns</option>
                          <option value="confident_turns">Confident Turns</option>
                          <option value="consistent_blue">Consistent Blue</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Students
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={newLesson.maxStudents}
                          onChange={(e) => setNewLesson(prev => ({ ...prev, maxStudents: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newLesson.price}
                          onChange={(e) => setNewLesson(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={handleCreateLesson}
                        disabled={isLoading || !newLesson.title.trim()}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Creating...' : 'Create Lesson'}
                      </button>
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
