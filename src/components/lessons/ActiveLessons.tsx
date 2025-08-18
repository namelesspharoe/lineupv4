import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Play, CheckCircle, Users, Target, MessageSquare, AlertCircle } from 'lucide-react';
import { Lesson, User } from '../../types';
import { getInstructorDailyLessons, startLesson, completeLesson } from '../../services/lessons';
import { EnhancedFeedbackForm } from './EnhancedFeedbackForm';
import { ClockInOutButton } from '../timesheet/ClockInOutButton';

interface ActiveLessonsProps {
  instructorId: string;
  onLessonComplete: () => void;
}

export function ActiveLessons({ instructorId, onLessonComplete }: ActiveLessonsProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLessons = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const today = format(new Date(), 'yyyy-MM-dd');
        const todaysLessons = await getInstructorDailyLessons(instructorId, today);
        
        setLessons(todaysLessons);
      } catch (err: any) {
        console.error('Error loading lessons:', err);
        setError(err.message || 'Failed to load lessons');
      } finally {
        setIsLoading(false);
      }
    };

    loadLessons();
  }, [instructorId]);

  const handleStartLesson = async (lessonId: string) => {
    try {
      await startLesson(lessonId);
      setLessons(prev => prev.map(lesson => 
        lesson.id === lessonId 
          ? { ...lesson, status: 'in_progress' }
          : lesson
      ));
    } catch (err: any) {
      console.error('Error starting lesson:', err);
      setError(err.message || 'Failed to start lesson');
    }
  };

  const handleCompleteLesson = async (lessonId: string) => {
    try {
      await completeLesson(lessonId);
      const completedLesson = lessons.find(l => l.id === lessonId);
      if (completedLesson) {
        setSelectedLesson(completedLesson);
        setShowFeedback(true);
      }
      setLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
      onLessonComplete();
    } catch (err: any) {
      console.error('Error completing lesson:', err);
      setError(err.message || 'Failed to complete lesson');
    }
  };

  const handleFeedbackSubmit = () => {
    setShowFeedback(false);
    setSelectedLesson(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clock In/Out Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Time Tracking</h2>
            <p className="text-gray-600">Track your working hours</p>
          </div>
          <ClockInOutButton instructorId={instructorId} />
        </div>
      </div>

      {/* Active Lessons */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Today's Lessons</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {lessons.length > 0 ? (
            lessons.map(lesson => (
              <div key={lesson.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{lesson.startTime} - {lesson.endTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{lesson.type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>{lesson.skillLevel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {lesson.status === 'scheduled' ? (
                      <button
                        onClick={() => handleStartLesson(lesson.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Start Lesson
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCompleteLesson(lesson.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Complete Lesson
                      </button>
                    )}
                  </div>
                </div>

                {/* Skills Focus */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {lesson.skillsFocus.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Students */}
                <div className="flex items-center gap-2">
                  {lesson.studentIds.map((studentId, index) => (
                    <div
                      key={studentId}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600"
                    >
                      {index + 1}
                    </div>
                  ))}
                  <a
                    href={`/messages?students=${lesson.studentIds.join(',')}`}
                    className="ml-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No active lessons for today
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedback && selectedLesson && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFeedback(false)} />
          
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative max-w-4xl w-full">
              <EnhancedFeedbackForm
                lessonId={selectedLesson.id}
                studentId={selectedLesson.studentIds[0]}
                onFeedbackSubmitted={handleFeedbackSubmit}
                onCancel={() => setShowFeedback(false)}
                isOpen={showFeedback}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}