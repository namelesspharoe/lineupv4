import React from 'react';
import { Calendar, Clock, Target, MapPin, Plus } from 'lucide-react';
import type { Lesson } from '../../../../types';

interface UpcomingLessonsSectionProps {
  upcomingLessons: Lesson[];
  onCreateLesson: () => void;
  onViewLessonDetails: (lesson: Lesson) => void;
}

export function UpcomingLessonsSection({
  upcomingLessons,
  onCreateLesson,
  onViewLessonDetails
}: UpcomingLessonsSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Lessons</h2>
          <button
            onClick={onCreateLesson}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Lesson
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {upcomingLessons.map(lesson => {
          const lessonDate = new Date(lesson.date);
          const isToday = new Date().toDateString() === lessonDate.toDateString();
          
          return (
            <div
              key={lesson.id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onViewLessonDetails(lesson)}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  isToday ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                    {isToday && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{lesson.startTime && lesson.endTime ? `${lesson.startTime} - ${lesson.endTime}` : lesson.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      <span>{lesson.skillLevel}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>Main Lodge</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {upcomingLessons.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No upcoming lessons scheduled
          </div>
        )}
      </div>
    </div>
  );
}

