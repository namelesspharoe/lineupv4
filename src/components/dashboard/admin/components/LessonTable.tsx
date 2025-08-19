import React, { useState } from 'react';
import { Lesson, User } from '../../../../types';
import { Search, Filter, MoreVertical, Edit, Calendar, CheckCircle, XCircle, Trash, Clock, Target } from 'lucide-react';
import { getStatusColor, formatStatus, getInstructorName, getStudentNames } from '../utils/adminUtils';

interface LessonTableProps {
  lessons: Lesson[];
  users: User[];
  onEditLesson: (lesson: Lesson) => void;
  onUpdateLessonStatus: (lessonId: string, status: 'available' | 'scheduled' | 'completed' | 'cancelled') => void;
  onDeleteLesson: (lessonId: string) => void;
}

export function LessonTable({
  lessons,
  users,
  onEditLesson,
  onUpdateLessonStatus,
  onDeleteLesson
}: LessonTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'available' | 'scheduled' | 'completed' | 'cancelled'>('all');
  const [showActions, setShowActions] = useState<string | null>(null);

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = (lesson.title?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || lesson.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Lesson Management</h2>
      </div>

      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Lessons Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lesson
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLessons.length > 0 ? (
                filteredLessons.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onEditLesson(lesson)}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{lesson.title || 'Untitled Lesson'}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {lesson.date ? new Date(lesson.date).toLocaleDateString() : 'No date'}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            {lesson.sessionType || 'morning'}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Target className="w-4 h-4" />
                            {lesson.skillLevel || 'Any level'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{getInstructorName(lesson.instructorId, users)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{getStudentNames(lesson.studentIds || [], users)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lesson.status)}`}>
                        {formatStatus(lesson.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowActions(showActions === lesson.id ? null : lesson.id);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {showActions === lesson.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditLesson(lesson);
                                setShowActions(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Lesson
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateLessonStatus(lesson.id, 'scheduled');
                                setShowActions(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Calendar className="w-4 h-4" />
                              Mark Scheduled
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateLessonStatus(lesson.id, 'completed');
                                setShowActions(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Mark Completed
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateLessonStatus(lesson.id, 'cancelled');
                                setShowActions(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Mark Cancelled
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteLesson(lesson.id);
                                setShowActions(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash className="w-4 h-4" />
                              Delete Lesson
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {searchQuery || selectedStatus !== 'all' ? 'No lessons found matching your criteria' : 'No lessons found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
