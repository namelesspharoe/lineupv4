import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { User } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { UnifiedLessonModal } from '../../lessons/UnifiedLessonModal';

interface CreateLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  isAdmin?: boolean;
}

export function CreateLessonModal({ isOpen, onClose, onCreated, isAdmin = false }: CreateLessonModalProps) {
  const { user } = useAuth();
  const [selectedInstructor, setSelectedInstructor] = useState<User | null>(null);
  const [instructorSearchQuery, setInstructorSearchQuery] = useState('');
  const [instructors, setInstructors] = useState<User[]>([]);
  const [isSearchingInstructors, setIsSearchingInstructors] = useState(false);
  const [showUnifiedModal, setShowUnifiedModal] = useState(false);

  useEffect(() => {
    if (instructorSearchQuery.length >= 2) {
      const searchInstructors = async () => {
        setIsSearchingInstructors(true);
        try {
          // First, get all instructors
          const q = query(
            collection(db, 'users'),
            where('role', '==', 'instructor')
          );
          
          const snapshot = await getDocs(q);
          const allInstructors = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as User[];
          
          // Then filter by search query (case-insensitive)
          const searchTerm = instructorSearchQuery.toLowerCase();
          const filteredInstructors = allInstructors.filter(instructor => 
            instructor.name?.toLowerCase().includes(searchTerm) ||
            instructor.email?.toLowerCase().includes(searchTerm) ||
            instructor.specialties?.some(specialty => 
              specialty.toLowerCase().includes(searchTerm)
            )
          );
          
          setInstructors(filteredInstructors);
        } catch (err) {
          console.error('Error searching instructors:', err);
          setInstructors([]);
        } finally {
          setIsSearchingInstructors(false);
        }
      };

      searchInstructors();
    } else {
      setInstructors([]);
    }
  }, [instructorSearchQuery]);

  useEffect(() => {
    if (user && user.role === 'instructor' && !isAdmin) {
      setSelectedInstructor(user);
    }
  }, [user, isAdmin]);

  const handleInstructorSelect = (instructor: User) => {
    setSelectedInstructor(instructor);
    setInstructors([]);
    setInstructorSearchQuery(instructor.name || '');
  };

  const handleClearSelection = () => {
    setSelectedInstructor(null);
    setInstructorSearchQuery('');
    setInstructors([]);
  };

  const handleCreateLesson = () => {
    if (selectedInstructor || user?.role === 'instructor' || isAdmin) {
      setShowUnifiedModal(true);
    }
  };

  const handleUnifiedModalClose = () => {
    setShowUnifiedModal(false);
    onCreated();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Lesson</h2>

            <div className="space-y-6">
              {/* Instructor Selection */}
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  {user?.role === 'instructor' 
                    ? 'You will create a lesson for yourself. Students can be assigned in the next step.'
                    : 'Select an instructor to create a lesson for them. Students can be assigned in the next step.'
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Instructor
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search for instructor..."
                    value={instructorSearchQuery}
                    onChange={(e) => setInstructorSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={user?.role === 'instructor'}
                  />
                </div>

                {user?.role === 'instructor' && (
                  <p className="mt-2 text-sm text-gray-600">
                    You will be assigned as the instructor for this lesson.
                  </p>
                )}

                {isSearchingInstructors && (
                  <div className="mt-2 p-3 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    Searching instructors...
                  </div>
                )}

                {!isSearchingInstructors && instructors.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                    {instructors.map(instructor => (
                      <button
                        key={instructor.id}
                        onClick={() => handleInstructorSelect(instructor)}
                        className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{instructor.name || 'Unknown Instructor'}</div>
                        <div className="text-sm text-gray-600">
                          {instructor.email}
                        </div>
                        {instructor.specialties && instructor.specialties.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {instructor.specialties.join(', ')}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {!isSearchingInstructors && instructorSearchQuery.length >= 2 && instructors.length === 0 && (
                  <div className="mt-2 p-3 text-center text-gray-500 bg-gray-50 rounded-lg">
                    No instructors found matching "{instructorSearchQuery}"
                  </div>
                )}

                {selectedInstructor && user?.role !== 'instructor' && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-blue-900">
                          Selected: {selectedInstructor.name || 'Unknown Instructor'}
                        </div>
                        <div className="text-sm text-blue-700">
                          {selectedInstructor.email}
                        </div>
                        {selectedInstructor.specialties && selectedInstructor.specialties.length > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            {selectedInstructor.specialties.join(', ')}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleClearSelection}
                        className="ml-2 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                        title="Clear selection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Create Lesson Button */}
              <div className="pt-4">
                <button
                  onClick={handleCreateLesson}
                  disabled={!selectedInstructor && user?.role !== 'instructor' && !isAdmin}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {user?.role === 'instructor' 
                    ? 'Create Lesson for Yourself' 
                    : selectedInstructor 
                      ? `Create Lesson for ${selectedInstructor.name || 'Selected Instructor'}`
                      : isAdmin
                        ? 'Create Lesson (Select Instructor in Next Step)'
                        : 'Select an Instructor First'
                  }
                </button>
              </div>
            </div>
            </div>
        </div>
      </div>

      {/* Unified Lesson Modal */}
      <UnifiedLessonModal
        isOpen={showUnifiedModal}
        onClose={handleUnifiedModalClose}
        mode="create"
        instructor={selectedInstructor || undefined}
        isAdmin={isAdmin}
      />
    </>
  );
}