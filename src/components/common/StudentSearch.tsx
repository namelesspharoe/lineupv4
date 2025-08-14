import React, { useState, useEffect } from 'react';
import { Search, X, User, Mail, Phone, Plus, Check } from 'lucide-react';
import { collection, query, where, getDocs, or } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User as UserType } from '../../types';

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

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
              setError(null);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Search Results */}
      {isSearching && (
        <div className="p-4 text-center text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          Searching...
        </div>
      )}

      {!isSearching && searchResults.length > 0 && (
        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
          {searchResults.map(student => (
            <button
              key={student.id}
              onClick={() => handleStudentSelect(student)}
              disabled={isStudentSelected(student.id)}
              className={`w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                isStudentSelected(student.id) ? 'bg-gray-50 opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {student.email}
                      </div>
                      {student.level && (
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          {student.level}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {isStudentSelected(student.id) ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Plus className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          No students found matching "{searchQuery}"
        </div>
      )}

      {/* Selected Students */}
      {showSelected && selectedStudents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Selected Students ({selectedStudents.length}{maxStudents ? `/${maxStudents}` : ''})
          </h4>
          <div className="space-y-2">
            {selectedStudents.map(student => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-600">{student.email}</div>
                  </div>
                </div>
                {onStudentRemove && (
                  <button
                    onClick={() => handleStudentRemove(student.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 