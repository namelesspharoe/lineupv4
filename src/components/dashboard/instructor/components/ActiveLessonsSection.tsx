import React from 'react';
import { BookOpen } from 'lucide-react';
import type { ActiveLesson } from '../../../../types';

interface ActiveLessonsSectionProps {
  activeLessons: ActiveLesson[];
  onViewLessonDetails: (lesson: ActiveLesson) => void;
  onCompleteLesson: (lesson: ActiveLesson) => void;
}

export function ActiveLessonsSection({
  activeLessons,
  onViewLessonDetails,
  onCompleteLesson
}: ActiveLessonsSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Active Lessons</h2>
      </div>
      <div className="p-6">
        {activeLessons.length > 0 ? (
          <div className="space-y-6">
            {activeLessons.map((lesson) => (
              <div key={lesson.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <BookOpen className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                        <span className="px-2 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">
                          {lesson.status === 'in_progress' ? 'In Progress' : 'Active'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>
                          Time: {lesson.startTime && lesson.endTime ? `${lesson.startTime} - ${lesson.endTime}` : 'TBD'}
                        </span>
                        <span>
                          Session: {lesson.sessionType || 'morning'}
                        </span>
                        <span>Level: {lesson.skillLevel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewLessonDetails(lesson)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      View Details
                    </button>
                    {lesson.students.length > 0 && (
                      <button
                        onClick={() => onCompleteLesson(lesson)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>

                {/* Students List */}
                {lesson.students.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Students:</h4>
                    <div className="flex flex-wrap gap-2">
                      {lesson.students.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-sm text-gray-700">{student.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No Active Lessons</p>
            <p className="text-sm">You don't have any lessons in progress right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}

