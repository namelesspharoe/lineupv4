import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, History, Plus, Filter } from 'lucide-react';
import { StudentBookingInterface } from '../components/booking/StudentBookingInterface';
import { ActiveLessons } from '../components/lessons/ActiveLessons';
import { useAuth } from '../context/AuthContext';
import { getLessonsByStudent, getLessonsByInstructor } from '../services/lessons';
import { Lesson } from '../types';
import { format } from 'date-fns';

type TabType = 'book' | 'active' | 'history';

export function BookLesson() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('book');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && (activeTab === 'active' || activeTab === 'history')) {
      loadLessons();
    }
  }, [user, activeTab]);

  const loadLessons = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      let userLessons: Lesson[];
      if (user.role === 'student') {
        userLessons = await getLessonsByStudent(user.id);
      } else if (user.role === 'instructor') {
        userLessons = await getLessonsByInstructor(user.id);
      } else {
        setError('Invalid user role');
        return;
      }

      // Filter lessons based on active tab
      const today = format(new Date(), 'yyyy-MM-dd');
      if (activeTab === 'active') {
        userLessons = userLessons.filter(lesson => 
          lesson.status === 'scheduled' || lesson.status === 'in_progress'
        );
      } else if (activeTab === 'history') {
        userLessons = userLessons.filter(lesson => 
          lesson.status === 'completed' || lesson.status === 'cancelled'
        );
      }

      setLessons(userLessons);
    } catch (err: any) {
      console.error('Error loading lessons:', err);
      setError(err.message || 'Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingComplete = () => {
    console.log('Booking completed successfully!');
    // Refresh lessons if on active tab
    if (activeTab === 'active') {
      loadLessons();
    }
  };

  const handleLessonComplete = () => {
    // Refresh lessons after completion
    loadLessons();
  };

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case 'book':
        return <Plus className="w-5 h-5" />;
      case 'active':
        return <Clock className="w-5 h-5" />;
      case 'history':
        return <History className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const getTabLabel = (tab: TabType) => {
    switch (tab) {
      case 'book':
        return 'Book Lesson';
      case 'active':
        return 'Active Lessons';
      case 'history':
        return 'Lesson History';
      default:
        return 'Lessons';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold mb-2">Ski Lessons</h1>
          <p className="text-blue-100">
            {user?.role === 'student' 
              ? 'Book lessons with expert instructors and track your progress'
              : 'Manage your lessons and track student progress'
            }
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            {(['book', 'active', 'history'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {getTabIcon(tab)}
                {getTabLabel(tab)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Book Lesson Tab */}
        {activeTab === 'book' && (
          <StudentBookingInterface onBookingComplete={handleBookingComplete} />
        )}

        {/* Active Lessons Tab */}
        {activeTab === 'active' && (
          <div className="space-y-6">
            {user?.role === 'instructor' ? (
              <ActiveLessons 
                instructorId={user.id} 
                onLessonComplete={handleLessonComplete}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : lessons.length > 0 ? (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">Your Active Lessons</h2>
                    <div className="grid gap-6">
                      {lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="bg-gray-50 rounded-xl p-6 border border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{lesson.title}</h3>
                              <p className="text-gray-600">{lesson.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">
                                {lesson.date} • {lesson.startTime} - {lesson.endTime}
                              </div>
                              <div className="text-sm font-medium text-blue-600">
                                ${lesson.price}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{lesson.type}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{lesson.skillLevel}</span>
                            </div>
                          </div>

                          {lesson.skillsFocus && lesson.skillsFocus.length > 0 && (
                            <div className="mt-4">
                              <div className="text-sm font-medium text-gray-700 mb-2">Skills Focus:</div>
                              <div className="flex flex-wrap gap-2">
                                {lesson.skillsFocus.map((skill, index) => (
                                  <span
                                    key={index}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Lessons</h3>
                    <p className="text-gray-600 mb-6">
                      You don't have any active lessons scheduled. Book a lesson to get started!
                    </p>
                    <button
                      onClick={() => setActiveTab('book')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Book a Lesson
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Lesson History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : lessons.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Lesson History</h2>
                <div className="grid gap-6">
                  {lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="bg-gray-50 rounded-xl p-6 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{lesson.title}</h3>
                          <p className="text-gray-600">{lesson.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            {lesson.date} • {lesson.startTime} - {lesson.endTime}
                          </div>
                          <div className={`text-sm font-medium ${
                            lesson.status === 'completed' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {lesson.status === 'completed' ? 'Completed' : 'Cancelled'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{lesson.type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{lesson.skillLevel}</span>
                        </div>
                        <div className="text-sm font-medium text-blue-600">
                          ${lesson.price}
                        </div>
                      </div>

                                             {lesson.feedback && lesson.feedback.length > 0 && (
                         <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                           <div className="text-sm font-medium text-gray-700 mb-2">Feedback:</div>
                           {lesson.feedback.map((feedback, index) => (
                             <div key={index} className="text-sm text-gray-600">
                               <div className="font-medium">Performance: {feedback.performance?.overall}/5</div>
                               {feedback.instructorNotes && (
                                 <div className="mt-1">{feedback.instructorNotes}</div>
                               )}
                             </div>
                           ))}
                         </div>
                       )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Lesson History</h3>
                <p className="text-gray-600">
                  Complete your first lesson to see your history here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}