import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const fetchStudents = async () => {
        setIsLoading(true);
        try {
          const q = query(
            collection(db, 'users'),
            where('role', '==', 'student'),
            where('name', '>=', searchQuery),
            where('name', '<=', searchQuery + '\uf8ff')
          );
          
          const snapshot = await getDocs(q);
          const fetchedStudents = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as User))
            .filter(student => !currentStudentIds.includes(student.id));
          
          setStudents(fetchedStudents);
        } catch (err) {
          console.error('Error fetching students:', err);
          setError('Failed to fetch students');
        } finally {
          setIsLoading(false);
        }
      };

      fetchStudents();
    } else {
      setStudents([]);
    }
  }, [searchQuery, isOpen, currentStudentIds]);

  const handleAddStudent = async (student: User) => {
    try {
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
      setError(err.message || 'Failed to add student');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Student to Lesson</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
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
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : students.length > 0 ? (
              students.map(student => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
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
                    onClick={() => handleAddStudent(student)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              ))
            ) : searchQuery.length >= 2 ? (
              <p className="text-center text-gray-500 py-4">No students found</p>
            ) : (
              <p className="text-center text-gray-500 py-4">
                Type at least 2 characters to search
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}