import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Lesson, User } from '../../../types';
import { updateLesson } from '../../../services/lessons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface EditLessonModalProps {
  lesson: Lesson;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function EditLessonModal({ lesson, isOpen, onClose, onUpdate }: EditLessonModalProps) {
  const [formData, setFormData] = useState({
    title: lesson.title,
    type: lesson.type,
    maxStudents: lesson.maxStudents,
    duration: lesson.duration,
    skillLevel: lesson.skillLevel,
    price: lesson.price,
    description: lesson.description,
    date: lesson.date,
    time: lesson.time || '09:00',
    status: lesson.status,
    notes: lesson.notes || '',
    skillsFocus: lesson.skillsFocus,
    studentIds: lesson.studentIds || []
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      } finally {
        setIsLoadingStudents(false);
      }
    };

    loadSelectedStudents();
  }, [formData.studentIds]);

  // Search for available students
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const searchStudents = async () => {
        setIsSearching(true);
        try {
          const q = query(
            collection(db, 'users'),
            where('role', '==', 'student'),
            where('name', '>=', searchQuery),
            where('name', '<=', searchQuery + '\uf8ff')
          );
          
          const snapshot = await getDocs(q);
          const fetchedStudents = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as User[];
          
          // Filter out already selected students
          setStudents(fetchedStudents.filter(student => 
            !selectedStudents.some(selected => selected.id === student.id)
          ));
        } catch (err) {
          console.error('Error searching students:', err);
        } finally {
          setIsSearching(false);
        }
      };

      searchStudents();
    } else {
      setStudents([]);
    }
  }, [searchQuery, selectedStudents]);

  const handleAddStudent = (student: User) => {
    if (selectedStudents.length < formData.maxStudents) {
      setSelectedStudents([...selectedStudents, student]);
      setFormData(prev => ({
        ...prev,
        studentIds: [...prev.studentIds, student.id]
      }));
      setSearchQuery('');
    }
  };

  const handleRemoveStudent = (student: User) => {
    setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
    setFormData(prev => ({
      ...prev,
      studentIds: prev.studentIds.filter(id => id !== student.id)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (formData.type !== 'private' && formData.studentIds.length === 0) {
      setError('Please select at least one student for group lessons');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await updateLesson(lesson.id, formData);
      onUpdate();
      onClose();
    } catch (err: any) {
      console.error('Error updating lesson:', err);
      setError(err.message || 'Failed to update lesson');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Lesson</h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      status: e.target.value as 'available' | 'scheduled' | 'completed' | 'cancelled'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="available">Available</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      type: e.target.value as 'private' | 'group' | 'workshop',
                      maxStudents: e.target.value === 'private' ? 1 : prev.maxStudents
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="private">Private</option>
                    <option value="group">Group</option>
                    <option value="workshop">Workshop</option>
                  </select>
                </div>

                {formData.type !== 'private' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Students
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="20"
                      value={formData.maxStudents}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        maxStudents: parseInt(e.target.value) 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      duration: parseInt(e.target.value) 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                    <option value="120">120 minutes</option>
                    <option value="180">180 minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skill Level
                  </label>
                  <select
                    value={formData.skillLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, skillLevel: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                    Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      price: parseInt(e.target.value) 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                            setFormData(prev => ({ ...prev, skillsFocus: newSkills }));
                          }}
                          className="rounded border-gray-300 text-blue-600"
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
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Additional notes about the lesson..."
                  />
                </div>

                {/* Student Selection */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Students ({selectedStudents.length}/{formData.maxStudents})
                  </label>
                  
                  {/* Selected Students */}
                  {selectedStudents.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {selectedStudents.map(student => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={student.avatar}
                              alt={student.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-medium text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-600">{student.level}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(student)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedStudents.length < formData.maxStudents && (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Search students by name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      {/* Search Results */}
                      {isSearching ? (
                        <div className="mt-2 p-4 text-center text-gray-500">
                          Searching...
                        </div>
                      ) : students.length > 0 ? (
                        <div className="mt-2 border border-gray-200 rounded-lg divide-y">
                          {students.map(student => (
                            <div
                              key={student.id}
                              className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                              onClick={() => handleAddStudent(student)}
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={student.avatar}
                                  alt={student.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div>
                                  <p className="font-medium text-gray-900">{student.name}</p>
                                  <p className="text-sm text-gray-600">{student.level}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : searchQuery.length >= 2 ? (
                        <div className="mt-2 p-4 text-center text-gray-500">
                          No students found
                        </div>
                      ) : null}
                    </>
                  )}
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
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}