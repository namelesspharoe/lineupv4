import { useState, useEffect } from 'react';
import { X, Search, UserPlus, AlertCircle } from 'lucide-react';
import { ResponsiveModalPanel } from '../../common/ResponsiveModalPanel';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { User } from '../../../types';
import { updateLesson } from '../../../services/lessons';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  currentStudentIds: string[];
  maxStudents: number;
}

export function AddStudentModal({ isOpen, onClose, lessonId, currentStudentIds, maxStudents }: AddStudentModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      fetchStudents();
    } else {
      setStudents([]);
    }
  }, [debouncedQuery, isOpen, currentStudentIds]);

  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create a more flexible search query
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        orderBy('name'),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      const fetchedStudents = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as User))
        .filter(student => 
          !currentStudentIds.includes(student.id) &&
          student.name?.toLowerCase().includes(debouncedQuery.toLowerCase())
        );
      
      setStudents(fetchedStudents);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to fetch students. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudent = async (student: User) => {
    if (isAddingStudent) return; // Prevent multiple clicks
    
    try {
      setIsAddingStudent(student.id);
      setError(null);
      
      // Check if we've reached the maximum number of students
      if (currentStudentIds.length >= maxStudents) {
        setError(`Cannot add more students. Maximum capacity (${maxStudents}) reached.`);
        return;
      }

      // Add the new student to the existing students array
      const updatedStudentIds = [...currentStudentIds, student.id];
      
      await updateLesson(lessonId, {
        studentIds: updatedStudentIds
      });
      
      onClose();
    } catch (err: any) {
      console.error('Error adding student:', err);
      setError(err.message || 'Failed to add student. Please try again.');
    } finally {
      setIsAddingStudent(null);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setStudents([]);
    setError(null);
    setIsAddingStudent(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ResponsiveModalPanel onClose={handleClose} labelledBy="add-student-title" maxWidthClass="sm:max-w-md">
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
        <h2 id="add-student-title" className="mb-4 text-2xl font-bold text-gray-900 dark:text-white sm:mb-6">
          Add Student to Lesson
        </h2>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search students by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Searching students...</p>
              </div>
            ) : students.length > 0 ? (
              students.map(student => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
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
                    onClick={() => handleAddStudent(student)}
                    disabled={isAddingStudent === student.id}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1 text-sm"
                  >
                    {isAddingStudent === student.id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Add
                      </>
                    )}
                  </button>
                </div>
              ))
            ) : searchQuery.length >= 2 ? (
              <div className="text-center py-8">
                <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No students found</p>
                <p className="text-sm text-gray-400">Try a different search term</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">
                  Type at least 2 characters to search
                </p>
              </div>
            )}
          </div>

        {currentStudentIds.length > 0 && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/40">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>{currentStudentIds.length}</strong> of <strong>{maxStudents}</strong> students currently enrolled
            </p>
          </div>
        )}
      </div>
    </ResponsiveModalPanel>
  );
}