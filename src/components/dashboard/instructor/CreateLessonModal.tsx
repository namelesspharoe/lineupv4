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
}

export function CreateLessonModal({ isOpen, onClose, onCreated }: CreateLessonModalProps) {
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
          const q = query(
            collection(db, 'users'),
            where('role', '==', 'instructor'),
            where('name', '>=', instructorSearchQuery),
            where('name', '<=', instructorSearchQuery + '\uf8ff')
          );
          
          const snapshot = await getDocs(q);
          const fetchedInstructors = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as User[];
          
          setInstructors(fetchedInstructors);
        } catch (err) {
          console.error('Error searching instructors:', err);
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
    if (user && user.role === 'instructor') {
      setSelectedInstructor(user);
    }
  }, [user]);

  const handleInstructorSelect = (instructor: User) => {
    setSelectedInstructor(instructor);
    setInstructors([]);
    setInstructorSearchQuery(instructor.name);
  };

  const handleCreateLesson = () => {
    if (selectedInstructor || user?.role === 'instructor') {
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

                {instructors.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                    {instructors.map(instructor => (
                      <button
                        key={instructor.id}
                        onClick={() => handleInstructorSelect(instructor)}
                        className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium">{instructor.name}</div>
                        <div className="text-sm text-gray-600">
                          {instructor.specialties?.join(', ')}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedInstructor && user?.role !== 'instructor' && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="font-medium text-blue-900">
                      Selected: {selectedInstructor.name}
                      </div>
                    <div className="text-sm text-blue-700">
                      {selectedInstructor.specialties?.join(', ')}
                    </div>
                  </div>
                )}
              </div>

              {/* Create Lesson Button */}
              <div className="pt-4">
                        <button
                  onClick={handleCreateLesson}
                  disabled={!selectedInstructor && user?.role !== 'instructor'}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {user?.role === 'instructor' 
                    ? 'Create Lesson for Yourself' 
                    : selectedInstructor 
                      ? `Create Lesson for ${selectedInstructor.name}`
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
      />
    </>
  );
}