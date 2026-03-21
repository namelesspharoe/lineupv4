import { useState, useEffect } from 'react';
import { X, Search, UserPlus, AlertCircle, Users, UserX } from 'lucide-react';
import { Lesson, User } from '../../../types';
import { updateLesson } from '../../../services/lessons';
import { resolveLessonPriceFromMountain } from '../../../services/mountains';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { ResponsiveModalPanel } from '../../common/ResponsiveModalPanel';

interface EditLessonModalProps {
  lesson: Lesson;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  isAdmin?: boolean;
}

interface FormErrors {
  title?: string;
  date?: string;
  sessionType?: string;
  price?: string;
  maxStudents?: string;
}

export function EditLessonModal({ lesson, isOpen, onClose, onUpdate, isAdmin = false }: EditLessonModalProps) {
  const [formData, setFormData] = useState({
    title: lesson.title || '',
    type: lesson.type || 'private',
    sport: lesson.sport ?? 'skiing',
    maxStudents: lesson.maxStudents || 1,
    skillLevel: lesson.skillLevel || 'first_time',
    price: lesson.price || 0,
    description: lesson.description || '',
    date: lesson.date || '',
    sessionType: lesson.sessionType || 'morning', // Replace time with sessionType
    status: lesson.status || 'available',
    notes: lesson.notes || '',
    skillsFocus: lesson.skillsFocus || [],
    studentIds: lesson.studentIds || [],
    instructorId: lesson.instructorId || ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<User[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingInstructors, setIsLoadingInstructors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isResolvingPrice, setIsResolvingPrice] = useState(false);

  // Update form data when lesson prop changes; fill price from mountain when stored price is 0
  useEffect(() => {
    let cancelled = false;

    setFormData({
      title: lesson.title || '',
      type: lesson.type || 'private',
      sport: lesson.sport ?? 'skiing',
      maxStudents: lesson.maxStudents || 1,
      skillLevel: lesson.skillLevel || 'first_time',
      price: lesson.price || 0,
      description: lesson.description || '',
      date: lesson.date || '',
      sessionType: lesson.sessionType || 'morning',
      status: lesson.status || 'available',
      notes: lesson.notes || '',
      skillsFocus: lesson.skillsFocus || [],
      studentIds: lesson.studentIds || [],
      instructorId: lesson.instructorId || ''
    });
    setFormErrors({});
    setError(null);

    const needMountainPrice = (lesson.price ?? 0) <= 0;
    if (!needMountainPrice) {
      setIsResolvingPrice(false);
      return;
    }

    setIsResolvingPrice(true);
    void (async () => {
      try {
        const resolved = await resolveLessonPriceFromMountain(lesson);
        if (cancelled || resolved == null || resolved <= 0) return;
        setFormData((prev) => ({ ...prev, price: resolved }));
      } catch {
        /* keep 0 */
      } finally {
        if (!cancelled) setIsResolvingPrice(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lesson]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load initial selected students
  useEffect(() => {
    const loadSelectedStudents = async () => {
      if (!formData.studentIds || formData.studentIds.length === 0) {
        setIsLoadingStudents(false);
        return;
      }

      try {
        setIsLoadingStudents(true);
        const promises = formData.studentIds.map(id => 
          getDocs(query(collection(db, 'users'), where('id', '==', id)))
        );
        
        const snapshots = await Promise.all(promises);
        const loadedStudents = snapshots
          .map(snapshot => {
            const doc = snapshot.docs[0];
            return doc ? { id: doc.id, ...doc.data() } as User : null;
          })
          .filter((doc): doc is User => doc !== null);
        
        setSelectedStudents(loadedStudents);
      } catch (err) {
        console.error('Error loading selected students:', err);
        setError('Failed to load selected students');
      } finally {
        setIsLoadingStudents(false);
      }
    };

    loadSelectedStudents();
  }, [formData.studentIds]);

  // Load instructors for admin selection
  useEffect(() => {
    const loadInstructors = async () => {
      if (!isAdmin) return;

      try {
        setIsLoadingInstructors(true);
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'instructor'),
          orderBy('name'),
          limit(50)
        );
        
        const snapshot = await getDocs(q);
        const fetchedInstructors = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
        
        setInstructors(fetchedInstructors);
      } catch (err) {
        console.error('Error loading instructors:', err);
        setError('Failed to load instructors');
      } finally {
        setIsLoadingInstructors(false);
      }
    };

    loadInstructors();
  }, [isAdmin]);

  // Search for available students
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchStudents();
    } else {
      setStudents([]);
    }
  }, [debouncedQuery, selectedStudents]);

  const searchStudents = async () => {
    setIsSearching(true);
    setError(null);
    
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        orderBy('name'),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      const fetchedStudents = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User))
        .filter(student => 
          !selectedStudents.some(selected => selected.id === student.id) &&
          student.name?.toLowerCase().includes(debouncedQuery.toLowerCase())
        );
      
      setStudents(fetchedStudents);
    } catch (err) {
      console.error('Error searching students:', err);
      setError('Failed to search students. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.date) {
      errors.date = 'Date is required';
    }

    if (!formData.sessionType) {
      errors.sessionType = 'Session type is required';
    }

    if (formData.price < 0) {
      errors.price = 'Price cannot be negative';
    }

    if (formData.type !== 'private' && formData.maxStudents < 2) {
      errors.maxStudents = 'Group lessons must allow at least 2 students';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddStudent = (student: User) => {
    if (selectedStudents.length < formData.maxStudents) {
      setSelectedStudents([...selectedStudents, student]);
      setFormData(prev => ({
        ...prev,
        studentIds: [...prev.studentIds, student.id]
      }));
      setSearchQuery('');
      setStudents([]);
    }
  };

  const handleRemoveStudent = (student: User) => {
    setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
    setFormData(prev => ({
      ...prev,
      studentIds: prev.studentIds.filter(id => id !== student.id)
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    if (formData.type !== 'private' && formData.studentIds.length === 0) {
      setError('Please select at least one student for group lessons');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Prepare lesson data with proper defaults
      const lessonData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        notes: formData.notes.trim(),
        skillsFocus: formData.skillsFocus || [],
        studentIds: formData.studentIds || [],
        sessionType: formData.sessionType, // Include session type
        updatedAt: new Date().toISOString()
      };

      await updateLesson(lesson.id, lessonData);
      onUpdate();
      onClose();
    } catch (err: any) {
      console.error('Error updating lesson:', err);
      setError(err.message || 'Failed to update lesson. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setStudents([]);
    setError(null);
    setFormErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ResponsiveModalPanel
      onClose={handleClose}
      labelledBy="edit-lesson-title"
      maxWidthClass="sm:max-w-4xl"
    >
      <div className="flex shrink-0 items-center justify-end border-b border-gray-200 bg-white px-2 py-2 dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:inset-x-0 sm:top-0 sm:z-20 sm:border-0 sm:bg-transparent sm:px-4 sm:py-3">
        <button
          type="button"
          onClick={handleClose}
          className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-6 pt-2 sm:px-6 sm:pb-6 sm:pt-16">
        <h2
          id="edit-lesson-title"
          className="mb-4 text-xl font-bold text-gray-900 dark:text-white sm:mb-6 sm:text-2xl"
        >
          Edit Lesson
        </h2>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="available">Available</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {isAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructor
                    </label>
                    {isLoadingInstructors ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500">Loading instructors...</span>
                      </div>
                    ) : (
                      <select
                        value={formData.instructorId}
                        onChange={(e) => handleInputChange('instructorId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select an instructor</option>
                        {instructors.map(instructor => (
                          <option key={instructor.id} value={instructor.id}>
                            {instructor.name || 'Unknown Instructor'}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value as 'private' | 'group' | 'workshop';
                      handleInputChange('type', newType);
                      if (newType === 'private') {
                        handleInputChange('maxStudents', 1);
                      } else if (formData.maxStudents === 1) {
                        handleInputChange('maxStudents', 2);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="private">Private</option>
                    <option value="group">Group</option>
                    <option value="workshop">Workshop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discipline
                  </label>
                  <select
                    value={formData.sport}
                    onChange={(e) => handleInputChange('sport', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="skiing">Skiing</option>
                    <option value="snowboarding">Snowboarding</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Used when saving instructor feedback and student progress.</p>
                </div>

                {formData.type !== 'private' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Students *
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="20"
                      value={formData.maxStudents}
                      onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.maxStudents ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.maxStudents && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.maxStudents}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.date ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {formErrors.date && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Type *
                  </label>
                  <select
                    value={formData.sessionType}
                    onChange={(e) => handleInputChange('sessionType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="morning">Morning (9:00 - 12:00)</option>
                    <option value="afternoon">Afternoon (13:00 - 16:00)</option>
                    <option value="full_day">Full Day (9:00 - 16:00)</option>
                  </select>
                  {formErrors.sessionType && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.sessionType}</p>
                  )}
                </div>



                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skill Level
                  </label>
                  <select
                    value={formData.skillLevel}
                    onChange={(e) => handleInputChange('skillLevel', e.target.value)}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    disabled={isResolvingPrice}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${
                      formErrors.price ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {isResolvingPrice && (
                    <p className="mt-1 text-xs text-gray-500">Loading resort rate from mountain…</p>
                  )}
                  {!isResolvingPrice && (lesson.price ?? 0) <= 0 && formData.price > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      Filled from the instructor&apos;s mountain (private / group rate by lesson type).
                    </p>
                  )}
                  {formErrors.price && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe what this lesson will cover..."
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills Focus
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      'Carving',
                      'Edge Control',
                      'Speed Control',
                      'Moguls',
                      'Off-Piste',
                      'Park',
                      'Racing',
                      'Basic Turns',
                      'Advanced Turns'
                    ].map((skill) => (
                      <label key={skill} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.skillsFocus.includes(skill)}
                          onChange={(e) => {
                            const newSkills = e.target.checked
                              ? [...formData.skillsFocus, skill]
                              : formData.skillsFocus.filter(s => s !== skill);
                            handleInputChange('skillsFocus', newSkills);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes about the lesson..."
                  />
                </div>

                {/* Student Selection */}
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Students ({selectedStudents.length}/{formData.maxStudents})
                    </label>
                    {selectedStudents.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        {selectedStudents.length} enrolled
                      </div>
                    )}
                  </div>
                  
                  {/* Selected Students */}
                  {isLoadingStudents ? (
                    <div className="mb-4 p-4 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-gray-500">Loading students...</p>
                    </div>
                  ) : selectedStudents.length > 0 ? (
                    <div className="mb-4 space-y-2">
                      {selectedStudents.map(student => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={student.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                              alt={student.name}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                              }}
                            />
                            <div>
                              <p className="font-medium text-gray-900">{student.name || 'Unknown Student'}</p>
                              <p className="text-sm text-gray-600">
                                {student.level ? `${student.level} level` : 'No level specified'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(student)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Remove student"
                          >
                            <UserX className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                      <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No students enrolled yet</p>
                    </div>
                  )}

                  {/* Add Students Section */}
                  {selectedStudents.length < formData.maxStudents && (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Search students by name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isSearching}
                        />
                      </div>

                      {/* Search Results */}
                      {isSearching ? (
                        <div className="p-4 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-gray-500">Searching students...</p>
                        </div>
                      ) : students.length > 0 ? (
                        <div className="border border-gray-200 rounded-lg divide-y max-h-48 overflow-y-auto">
                          {students.map(student => (
                            <div
                              key={student.id}
                              className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => handleAddStudent(student)}
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={student.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                                  alt={student.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                                  }}
                                />
                                <div>
                                  <p className="font-medium text-gray-900">{student.name || 'Unknown Student'}</p>
                                  <p className="text-sm text-gray-600">
                                    {student.level ? `${student.level} level` : 'No level specified'}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                title="Add student"
                              >
                                <UserPlus className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : searchQuery.length >= 2 ? (
                        <div className="p-4 text-center">
                          <UserPlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">No students found</p>
                          <p className="text-sm text-gray-400">Try a different search term</p>
                        </div>
                      ) : (
                        <div className="p-4 text-center">
                          <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">
                            Type at least 2 characters to search for students
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedStudents.length >= formData.maxStudents && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800">
                        <strong>Maximum capacity reached!</strong> ({formData.maxStudents} students)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 dark:border-gray-800 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="w-full rounded-lg px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800 sm:w-auto sm:py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 sm:w-auto sm:py-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
      </div>
    </ResponsiveModalPanel>
  );
}