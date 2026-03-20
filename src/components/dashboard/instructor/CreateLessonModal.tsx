import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { User } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { UnifiedLessonModal } from '../../lessons/UnifiedLessonModal';
import { ResponsiveModalPanel } from '../../common/ResponsiveModalPanel';

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
      <ResponsiveModalPanel onClose={onClose} labelledBy="create-lesson-title">
        <div className="flex shrink-0 items-center justify-end border-b border-gray-200 bg-white px-2 py-2 dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:inset-x-0 sm:top-0 sm:z-20 sm:border-0 sm:bg-transparent sm:px-4 sm:py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-6 pt-2 sm:px-6 sm:pb-6 sm:pt-16">
          <h2
            id="create-lesson-title"
            className="mb-4 text-xl font-bold text-gray-900 dark:text-white sm:mb-6 sm:text-2xl"
          >
            Create New Lesson
          </h2>

          <div className="space-y-6">
              {/* Instructor Selection */}
              <div>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  {user?.role === 'instructor' 
                    ? 'You will create a lesson for yourself. Students can be assigned in the next step.'
                    : 'Select an instructor to create a lesson for them. Students can be assigned in the next step.'
                  }
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Assign Instructor
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search for instructor..."
                    value={instructorSearchQuery}
                    onChange={(e) => setInstructorSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                    disabled={user?.role === 'instructor'}
                  />
                </div>

                {user?.role === 'instructor' && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    You will be assigned as the instructor for this lesson.
                  </p>
                )}

                {isSearchingInstructors && (
                  <div className="mt-2 p-3 text-center text-gray-500 dark:text-gray-400">
                    <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    Searching instructors...
                  </div>
                )}

                {!isSearchingInstructors && instructors.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600">
                    {instructors.map(instructor => (
                      <button
                        key={instructor.id}
                        type="button"
                        onClick={() => handleInstructorSelect(instructor)}
                        className="w-full border-b border-gray-100 p-3 text-left transition-colors last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                      >
                        <div className="font-medium text-gray-900 dark:text-gray-100">{instructor.name || 'Unknown Instructor'}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {instructor.email}
                        </div>
                        {instructor.specialties && instructor.specialties.length > 0 && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                            {instructor.specialties.join(', ')}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {!isSearchingInstructors && instructorSearchQuery.length >= 2 && instructors.length === 0 && (
                  <div className="mt-2 rounded-lg bg-gray-50 p-3 text-center text-gray-500 dark:bg-gray-800/80 dark:text-gray-400">
                    No instructors found matching "{instructorSearchQuery}"
                  </div>
                )}

                {selectedInstructor && user?.role !== 'instructor' && (
                  <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/40">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-blue-900 dark:text-blue-200">
                          Selected: {selectedInstructor.name || 'Unknown Instructor'}
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          {selectedInstructor.email}
                        </div>
                        {selectedInstructor.specialties && selectedInstructor.specialties.length > 0 && (
                          <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                            {selectedInstructor.specialties.join(', ')}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="shrink-0 rounded p-1 text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/50 dark:hover:text-blue-200"
                        title="Clear selection"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Create Lesson Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleCreateLesson}
                  disabled={!selectedInstructor && user?.role !== 'instructor' && !isAdmin}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
      </ResponsiveModalPanel>

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