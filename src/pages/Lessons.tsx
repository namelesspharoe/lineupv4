import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Lesson } from '../types';
import { getLessonsByStudent } from '../services/lessons';
import { getUserById } from '../services/users';
import { createConversation } from '../services/messages';
import { Calendar, MapPin, Clock, Star, MessageSquare, User2, Filter, Search, Plus, Heart, Share2, MoreHorizontal, BookOpen, Trophy, TrendingUp, X, Target, Users, Award, CheckCircle, Play, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { InstructorProfileModal } from '../components/instructor/InstructorProfileModal';

interface LessonDetailsModalProps {
  lesson: (Lesson & { instructor?: User }) | null;
  onClose: () => void;
  onLessonUpdate: () => void;
}

function LessonDetailsModal({ lesson, onClose, onLessonUpdate }: LessonDetailsModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!lesson) return null;

  const handleMessageInstructor = async () => {
    if (!lesson.instructor || !user) return;
    
    try {
      const initialMessage = `Hi ${lesson.instructor.name}! I have a question about our lesson on ${new Date(lesson.date).toLocaleDateString()}.`;
      await createConversation(user.id, lesson.instructor.id, initialMessage);
      navigate('/messages');
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Calendar className="w-4 h-4" />;
      case 'in_progress':
        return <Play className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Lesson Details
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Lesson Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{lesson.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(lesson.date).toLocaleDateString()} • {lesson.sessionType === 'morning' ? 'Morning' : lesson.sessionType === 'afternoon' ? 'Afternoon' : 'Full Day'}
                </p>
              </div>
            </div>
            
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              lesson.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
              lesson.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
              lesson.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
              'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {getStatusIcon(lesson.status)}
              {lesson.status.replace('_', ' ')}
            </div>
          </div>

          {/* Instructor Info */}
          {lesson.instructor && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Instructor</h4>
              <div className="flex items-center gap-3">
                <img
                  src={lesson.instructor.avatar}
                  alt={lesson.instructor.name}
                  className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    // This will be handled by the parent component
                    onClose();
                    // Trigger instructor profile modal
                    window.dispatchEvent(new CustomEvent('showInstructorProfile', { 
                      detail: { instructor: lesson.instructor } 
                    }));
                  }}
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{lesson.instructor.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Instructor</p>
                </div>
                <button
                  onClick={handleMessageInstructor}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Message
                </button>
              </div>
            </div>
          )}

          {/* Skills Focus */}
          {lesson.skillsFocus && lesson.skillsFocus.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Skills Focus</h4>
              <div className="flex flex-wrap gap-2">
                {lesson.skillsFocus.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Lesson Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Time</span>
              </div>
              <p className="font-medium text-gray-900 dark:text-white">
                {lesson.sessionType === 'morning' ? 'Morning (9 AM - 12 PM)' :
                 lesson.sessionType === 'afternoon' ? 'Afternoon (12 PM - 5 PM)' :
                 'Full Day (9 AM - 5 PM)'}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Location</span>
              </div>
              <p className="font-medium text-gray-900 dark:text-white">Main Lodge</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Level</span>
              </div>
              <p className="font-medium text-gray-900 dark:text-white">{lesson.skillLevel?.replace('_', ' ') || 'Not specified'}</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
              </div>
              <p className="font-medium text-gray-900 dark:text-white">{lesson.type || 'Private'}</p>
            </div>
          </div>

          {/* Notes */}
          {lesson.notes && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Notes</h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-gray-700 dark:text-gray-300">{lesson.notes}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {lesson.instructor && (
              <button
                onClick={handleMessageInstructor}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Message Instructor
              </button>
            )}
            {lesson.status === 'scheduled' && (
              <button className="flex-1 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                Cancel Lesson
              </button>
            )}
            {lesson.status === 'completed' && (
              <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Write Review
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Lessons() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<(Lesson & { instructor?: User })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [selectedLesson, setSelectedLesson] = useState<(Lesson & { instructor?: User }) | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<User | null>(null);

  useEffect(() => {
    loadLessons();
    
    // Listen for instructor profile modal events
    const handleShowInstructorProfile = (event: CustomEvent) => {
      setSelectedInstructor(event.detail.instructor);
    };
    
    window.addEventListener('showInstructorProfile', handleShowInstructorProfile as EventListener);
    
    return () => {
      window.removeEventListener('showInstructorProfile', handleShowInstructorProfile as EventListener);
    };
  }, []);

  const loadLessons = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const lessonsData = await getLessonsByStudent(user.id);
      
      // Fetch instructor data for each lesson
      const lessonsWithInstructors = await Promise.all(
        lessonsData.map(async (lesson) => {
          try {
            const instructor = await getUserById(lesson.instructorId);
            return { ...lesson, instructor: instructor || undefined };
          } catch (err) {
            console.error('Error fetching instructor:', err);
            return lesson;
          }
        })
      );
      
      setLessons(lessonsWithInstructors);
    } catch (err: any) {
      console.error('Error loading lessons:', err);
      setError(err.message || 'Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessageInstructor = async (instructor: User) => {
    if (!user) return;
    
    try {
      const initialMessage = `Hi ${instructor.name}! I'd like to start a conversation.`;
      await createConversation(user.id, instructor.id, initialMessage);
      navigate('/messages');
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleInstructorClick = (instructor: User) => {
    setSelectedInstructor(instructor);
  };

  const filteredLessons = lessons.filter(lesson => {
    const now = new Date();
    const lessonDate = new Date(lesson.date);
    
    switch (filter) {
      case 'upcoming':
        return lessonDate >= now && lesson.status !== 'cancelled';
      case 'past':
        return lessonDate < now || lesson.status === 'completed';
      default:
        return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your lessons...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadLessons}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Lessons</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredLessons.length} lesson{filteredLessons.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Link
          to="/book-lesson"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Book Lesson</span>
          <span className="sm:hidden">Book</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            All ({lessons.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              filter === 'upcoming'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Upcoming ({lessons.filter(l => new Date(l.date) >= new Date() && l.status !== 'cancelled').length})
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              filter === 'past'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Past ({lessons.filter(l => new Date(l.date) < new Date() || l.status === 'completed').length})
          </button>
        </div>
      </div>

      {/* Lessons Feed */}
      {filteredLessons.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No lessons found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {filter === 'upcoming' 
              ? "You don't have any upcoming lessons scheduled."
              : filter === 'past'
              ? "You haven't completed any lessons yet."
              : "You don't have any lessons yet."
            }
          </p>
          <Link
            to="/book-lesson"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Book Your First Lesson
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLessons.map(lesson => (
            <div
              key={lesson.id}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{lesson.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lesson.status)}`}>
                          {getStatusText(lesson.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <span>{new Date(lesson.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{lesson.sessionType === 'morning' ? 'Morning' : lesson.sessionType === 'afternoon' ? 'Afternoon' : 'Full Day'}</span>
                      </div>
                      {lesson.instructor && (
                        <div className="flex items-center gap-2">
                          <img
                            src={lesson.instructor.avatar}
                            alt={lesson.instructor.name}
                            className="w-6 h-6 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleInstructorClick(lesson.instructor!)}
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{lesson.instructor.name}</span>
                        </div>
                      )}
                      {lesson.skillsFocus && lesson.skillsFocus.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {lesson.skillsFocus.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {lesson.skillsFocus.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                              +{lesson.skillsFocus.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      <Heart className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setSelectedLesson(lesson)}
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                  {lesson.instructor && (
                    <button
                      onClick={() => handleMessageInstructor(lesson.instructor!)}
                      className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </button>
                  )}
                  {lesson.status === 'scheduled' && (
                    <button className="flex-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium">
                      Cancel
                    </button>
                  )}
                  {lesson.status === 'completed' && (
                    <button className="flex-1 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                      <Star className="w-4 h-4" />
                      Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lesson Details Modal */}
      {selectedLesson && (
        <LessonDetailsModal
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
          onLessonUpdate={loadLessons}
        />
      )}

      {/* Instructor Profile Modal */}
      {selectedInstructor && (
        <InstructorProfileModal
          instructor={{
            id: selectedInstructor.id,
            name: selectedInstructor.name,
            image: selectedInstructor.avatar,
                         location: 'Mountain Resort',
            rating: 4.8,
            reviewCount: 127,
            price: 120,
            specialties: ['Skiing', 'Snowboarding', 'Freestyle'],
            experience: 8,
            languages: ['English', 'Spanish'],
            availability: 'Weekdays & Weekends'
          }}
          onClose={() => setSelectedInstructor(null)}
        />
      )}
    </div>
  );
}
