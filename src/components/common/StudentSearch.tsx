import React, { useState, useEffect } from 'react';
import { Search, X, User, Mail, Plus, Check, Eye } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User as UserType } from '../../types';
import { StudentProfileModal } from '../student/StudentProfileModal';

interface StudentSearchProps {
  onStudentSelect: (student: UserType) => void;
  onStudentRemove?: (studentId: string) => void;
  selectedStudents?: UserType[];
  maxStudents?: number;
  placeholder?: string;
  disabled?: boolean;
  showSelected?: boolean;
}

export function StudentSearch({
  onStudentSelect,
  onStudentRemove,
  selectedStudents = [],
  maxStudents,
  placeholder = "Search students by name, email, or phone...",
  disabled = false,
  showSelected = true
}: StudentSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<UserType | null>(null);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const searchStudents = async () => {
        setIsSearching(true);
        setError(null);
        
        try {
          // Create queries for different search fields
          const nameQuery = query(
            collection(db, 'users'),
            where('role', '==', 'student'),
            where('name', '>=', searchQuery),
            where('name', '<=', searchQuery + '\uf8ff')
          );

          const emailQuery = query(
            collection(db, 'users'),
            where('role', '==', 'student'),
            where('email', '>=', searchQuery),
            where('email', '<=', searchQuery + '\uf8ff')
          );

          // Execute both queries
          const [nameSnapshot, emailSnapshot] = await Promise.all([
            getDocs(nameQuery),
            getDocs(emailQuery)
          ]);

          // Combine and deduplicate results
          const allStudents = new Map<string, UserType>();
          
          nameSnapshot.docs.forEach(doc => {
            const student = { id: doc.id, ...doc.data() } as UserType;
            allStudents.set(doc.id, student);
          });
          
          emailSnapshot.docs.forEach(doc => {
            const student = { id: doc.id, ...doc.data() } as UserType;
            allStudents.set(doc.id, student);
          });

          // Filter out already selected students
          const filteredStudents = Array.from(allStudents.values()).filter(
            student => !selectedStudents.some(selected => selected.id === student.id)
          );

          setSearchResults(filteredStudents);
        } catch (err) {
          console.error('Error searching students:', err);
          setError('Failed to search students. Please try again.');
        } finally {
          setIsSearching(false);
        }
      };

      // Debounce search
      const timeoutId = setTimeout(searchStudents, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, selectedStudents]);

  const handleStudentSelect = (student: UserType) => {
    if (maxStudents && selectedStudents.length >= maxStudents) {
      setError(`Maximum ${maxStudents} students allowed`);
      return;
    }
    
    onStudentSelect(student);
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  };

  const handleStudentRemove = (studentId: string) => {
    onStudentRemove?.(studentId);
  };

  const isStudentSelected = (studentId: string) => {
    return selectedStudents.some(student => student.id === studentId);
  };

  const formatLevel = (level: string) => level.replace(/_/g, ' ');

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search Input — min 16px text on small screens avoids iOS zoom; comfortable touch height */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5 pointer-events-none" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled}
          className="w-full min-h-[44px] sm:min-h-[42px] pl-10 pr-12 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
              setError(null);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
            aria-label="Clear search"
          >
            <X className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Search Results */}
      {isSearching && (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm sm:text-base">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2" />
          Searching…
        </div>
      )}

      {!isSearching && searchResults.length > 0 && (
        <div className="max-h-[min(16rem,50dvh)] sm:max-h-60 overflow-y-auto overscroll-contain border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950/50 touch-pan-y">
          {searchResults.map(student => (
            <div
              key={student.id}
              className={`w-full p-3 sm:p-3 text-left border-b border-gray-100 dark:border-gray-800 last:border-b-0 transition-colors ${
                isStudentSelected(student.id)
                  ? 'bg-gray-50 dark:bg-gray-900 opacity-60'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/80 active:bg-gray-100 dark:active:bg-gray-800'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 sm:w-10 sm:h-10 shrink-0 bg-blue-100 dark:bg-blue-950/80 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 dark:text-white break-words">{student.name}</div>
                    <div className="mt-1 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-start gap-1.5 min-w-0">
                        <Mail className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400 dark:text-gray-500" />
                        <span className="break-all sm:break-words">{student.email}</span>
                      </div>
                      {student.level && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                          <span className="capitalize">{formatLevel(student.level)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end sm:justify-start gap-1 sm:gap-2 shrink-0 pt-0.5 sm:pt-0 border-t border-gray-100 dark:border-gray-800 sm:border-0 -mx-3 px-3 sm:mx-0 sm:px-0 mt-1 sm:mt-0">
                  {!isStudentSelected(student.id) && (
                    <button
                      type="button"
                      onClick={() => handleStudentSelect(student)}
                      className="min-h-[44px] min-w-[44px] sm:min-h-9 sm:min-w-9 inline-flex items-center justify-center rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/60 active:bg-blue-200 dark:active:bg-blue-900/50 transition-colors"
                      title="Add student"
                      aria-label={`Add ${student.name}`}
                    >
                      <Plus className="w-5 h-5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                    </button>
                  )}
                  {isStudentSelected(student.id) && (
                    <span className="min-h-[44px] min-w-[44px] sm:min-h-9 sm:min-w-9 inline-flex items-center justify-center" aria-hidden>
                      <Check className="w-6 h-6 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStudentForProfile(student);
                    }}
                    className="min-h-[44px] min-w-[44px] sm:min-h-9 sm:min-w-9 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
                    title="View profile"
                    aria-label={`View profile for ${student.name}`}
                  >
                    <Eye className="w-5 h-5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm px-2">
          No students found matching &quot;{searchQuery}&quot;
        </div>
      )}

      {/* Selected Students */}
      {showSelected && selectedStudents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Selected students ({selectedStudents.length}{maxStudents ? `/${maxStudents}` : ''})
          </h4>
          <div className="space-y-2">
            {selectedStudents.map(student => (
              <div
                key={student.id}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-lg"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 shrink-0 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white break-words">{student.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 break-all sm:break-words">{student.email}</div>
                  </div>
                </div>
                {onStudentRemove && (
                  <button
                    type="button"
                    onClick={() => handleStudentRemove(student.id)}
                    className="self-end sm:self-center min-h-[44px] min-w-[44px] sm:min-h-9 sm:min-w-9 inline-flex items-center justify-center text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    aria-label={`Remove ${student.name}`}
                  >
                    <X className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedStudentForProfile && (
        <StudentProfileModal
          student={selectedStudentForProfile}
          onClose={() => setSelectedStudentForProfile(null)}
        />
      )}
    </div>
  );
} 