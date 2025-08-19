import React from 'react';
import { History, Calendar, Target, Users, ChevronRight } from 'lucide-react';
import type { Lesson } from '../../../../types';

interface PastLessonsSectionProps {
  pastLessons: Lesson[];
  onViewLessonDetails: (lesson: Lesson) => void;
}

export function PastLessonsSection({
  pastLessons,
  onViewLessonDetails
}: PastLessonsSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Completed Lessons</h2>
          <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {pastLessons.map(lesson => {
          const lessonDate = new Date(lesson.date);
          
          return (
            <div
              key={lesson.id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onViewLessonDetails(lesson)}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 text-gray-600 rounded-lg">
                  <History className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      lesson.status === 'completed'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-gray-50 text-gray-600'
                    }`}>
                      {lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{lessonDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      <span>{lesson.skillLevel}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{lesson.type}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {pastLessons.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No completed lessons
          </div>
        )}
      </div>
    </div>
  );
}

