import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, DollarSign, Target, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createLesson } from '../../services/lessons';
import { User, Lesson } from '../../types';
import { format } from 'date-fns';
import { StudentSearch } from '../common/StudentSearch';

interface UnifiedLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'book'; // 'create' for admin/instructor, 'book' for student
  instructor?: User; // Required for booking mode
  existingLesson?: Lesson; // For editing existing lessons
}

interface LessonFormData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'private' | 'group' | 'workshop';
  maxStudents: number;
  skillLevel: 'first_time' | 'developing_turns' | 'linking_turns' | 'confident_turns' | 'consistent_blue';
  price: number;
  description: string;
  skillsFocus: string[];
  notes: string;
  selectedStudents: User[];
}

const timeSlots = [
  { label: 'Morning (9:00 AM - 12:00 PM)', start: '09:00', end: '12:00' },
  { label: 'Afternoon (1:00 PM - 4:00 PM)', start: '13:00', end: '16:00' },
  { label: 'Full Day (9:00 AM - 5:00 PM)', start: '09:00', end: '17:00' },
  { label: 'Custom', start: '', end: '' }
];

const skillLevels = [
  { value: 'first_time', label: 'First Time' },
  { value: 'developing_turns', label: 'Developing Turns' },
  { value: 'linking_turns', label: 'Linking Turns' },
  { value: 'confident_turns', label: 'Confident Turns' },
  { value: 'consistent_blue', label: 'Consistent Blue Runs' }
];

const skillOptions = [
  'Basic Stance', 'Turning', 'Speed Control', 'Edge Control',
  'Carving', 'Freestyle', 'Terrain Park', 'Powder Riding',
  'Safety Awareness', 'Mountain Navigation'
];

export function UnifiedLessonModal({ 
  isOpen, 
  onClose, 
  mode, 
  instructor, 
  existingLesson 
}: UnifiedLessonModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(0);
  const [customStartTime, setCustomStartTime] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');

  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '12:00',
    type: 'private',
    maxStudents: 1,
    skillLevel: 'first_time',
    price: instructor?.price || 0,
    description: '',
    skillsFocus: [],
    notes: '',
    selectedStudents: []
  });

  useEffect(() => {
    if (existingLesson) {
      setFormData({
        title: existingLesson.title,
        date: existingLesson.date,
        startTime: existingLesson.startTime || '09:00',
        endTime: existingLesson.endTime || '12:00',
        type: existingLesson.type,
        maxStudents: existingLesson.maxStudents,
        skillLevel: existingLesson.skillLevel,
        price: existingLesson.price,
        description: existingLesson.description,
        skillsFocus: existingLesson.skillsFocus,
        notes: existingLesson.notes || '',
        selectedStudents: []
      });
    } else if (instructor) {
      setFormData(prev => ({
        ...prev,
        price: instructor.price || 0,
        selectedStudents: []
      }));
    }
  }, [existingLesson, instructor]);

  const handleTimeSlotChange = (index: number) => {
    setSelectedTimeSlot(index);
    if (index < 3) {
      const slot = timeSlots[index];
      setFormData(prev => ({
        ...prev,
        startTime: slot.start,
        endTime: slot.end
      }));
    }
  };

  const handleCustomTimeChange = () => {
    if (customStartTime && customEndTime) {
      setFormData(prev => ({
        ...prev,
        startTime: customStartTime,
        endTime: customEndTime
      }));
    }
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skillsFocus: prev.skillsFocus.includes(skill)
        ? prev.skillsFocus.filter(s => s !== skill)
        : [...prev.skillsFocus, skill]
    }));
  };

  const handleStudentSelect = (student: User) => {
    setFormData(prev => ({
      ...prev,
      selectedStudents: [...prev.selectedStudents, student]
    }));
  };

  const handleStudentRemove = (studentId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedStudents: prev.selectedStudents.filter(s => s.id !== studentId)
    }));
  };

  const calculateTotal = () => {
    const hours = calculateHours();
    return formData.price * hours;
  };

  const calculateHours = () => {
    const start = new Date(`2000-01-01T${formData.startTime}`);
    const end = new Date(`2000-01-01T${formData.endTime}`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to create lessons');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Determine session type based on start/end times
      const getSessionType = (startTime: string, endTime: string): 'morning' | 'afternoon' | 'full_day' => {
        if (startTime === '09:00' && endTime === '12:00') return 'morning';
        if (startTime === '13:00' && endTime === '16:00') return 'afternoon';
        if (startTime === '09:00' && endTime === '17:00') return 'full_day';
        return 'morning'; // default
      };

      const lessonData = {
        title: formData.title,
        instructorId: mode === 'book' && instructor ? instructor.id : user.id,
        studentIds: mode === 'book' ? [user.id] : formData.selectedStudents.map(s => s.id),
        date: formData.date,
        sessionType: getSessionType(formData.startTime, formData.endTime),
        startTime: formData.startTime,
        endTime: formData.endTime,
        status: (mode === 'book' ? 'scheduled' : 'available') as 'available' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
        type: formData.type,
        maxStudents: formData.maxStudents,
        skillLevel: formData.skillLevel,
        price: formData.price,
        description: formData.description,
        skillsFocus: formData.skillsFocus,
        notes: formData.notes
      };

      console.log('Creating lesson with data:', lessonData);
      const lessonId = await createLesson(lessonData);
      console.log('Lesson created successfully:', lessonId);
      
      onClose();
      // You might want to show a success message or redirect
    } catch (err) {
      console.error('Error creating lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to create lesson');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {mode === 'create' ? 'Create New Lesson' : 'Book Lesson'}
                {existingLesson && ' - Edit'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Lesson Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Beginner Ski Lesson"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lesson Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      type: e.target.value as 'private' | 'group' | 'workshop',
                      maxStudents: e.target.value === 'private' ? 1 : prev.maxStudents,
                      selectedStudents: e.target.value === 'private' ? prev.selectedStudents.slice(0, 1) : prev.selectedStudents
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="private">Private Lesson</option>
                    <option value="group">Group Lesson</option>
                    <option value="workshop">Workshop</option>
                  </select>
                </div>
              </div>

              {formData.type === 'group' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Students
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="8"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxStudents: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Student Selection - Only show for create mode */}
            {mode === 'create' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Assign Students</h3>
                <StudentSearch
                  onStudentSelect={handleStudentSelect}
                  onStudentRemove={handleStudentRemove}
                  selectedStudents={formData.selectedStudents}
                  maxStudents={formData.maxStudents}
                  placeholder="Search students by name or email..."
                  disabled={formData.type === 'private' && formData.selectedStudents.length >= 1}
                />
              </div>
            )}

            {/* Time Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Time Selection</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {timeSlots.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleTimeSlotChange(index)}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      selectedTimeSlot === index
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">{slot.label}</div>
                    {index < 3 && (
                      <div className="text-sm text-gray-600">
                        {slot.start} - {slot.end}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {selectedTimeSlot === 3 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={customStartTime}
                      onChange={(e) => {
                        setCustomStartTime(e.target.value);
                        handleCustomTimeChange();
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={customEndTime}
                      onChange={(e) => {
                        setCustomEndTime(e.target.value);
                        handleCustomTimeChange();
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Skill Level and Focus */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Skill Level & Focus</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Level
                </label>
                <select
                  value={formData.skillLevel}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    skillLevel: e.target.value as any 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {skillLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills to Focus On
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {skillOptions.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillToggle(skill)}
                      className={`p-2 text-sm border rounded-lg transition-colors ${
                        formData.skillsFocus.includes(skill)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Pricing</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total Cost</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${calculateTotal().toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {calculateHours()} hours × ${formData.price}/hour
                  </div>
                </div>
              </div>
            </div>

            {/* Description and Notes */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what this lesson will cover..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any special requirements or notes..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creating...' : mode === 'create' ? 'Create Lesson' : 'Book Lesson'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 