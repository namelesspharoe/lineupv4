import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Star,
  Clock,
  Globe2,
  Award,
  Calendar,
  MessageSquare,
  ThumbsUp,
  Users,
  Target,
  Snowflake,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Crown,
  Trophy,
  Medal,
  Eye,
  EyeOff,
  Check,
  X as XIcon,
  Shield,
  GraduationCap,
  BookOpen,
  BarChart3,
  User,
  Mail,
  Phone,
  Home,
  Mountain,
  Activity,
  Zap,
  Heart,
  Bookmark,
  Share2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Lesson, StudentReview, User as UserType, StudentProgress, Achievement } from '../../types';

interface Student {
  id: string;
  name: string;
  image: string;
  email: string;
  level: string;
  bio?: string;
  phone?: string;
  address?: string;
  homeMountain?: string;
  createdAt?: string;
}

interface StudentProfileModalProps {
  student: Student;
  onClose: () => void;
}

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  content: string;
  avatar: string;
  instructorId?: string;
  lessonId?: string;
  originalReview?: StudentReview;
}

interface StudentStats {
  totalLessons: number;
  completedLessons: number;
  averageRating: number;
  currentLevel: string;
  totalAchievements: number;
  lessonsThisMonth: number;
  favoriteInstructors: string[];
  totalSpent: number;
  streakDays: number;
  totalPoints: number;
}

// Level colors and progression
const levelConfig = {
  first_time: { 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-50', 
    icon: User,
    name: 'First Time',
    description: 'Just getting started'
  },
  developing_turns: { 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50', 
    icon: TrendingUp,
    name: 'Developing Turns',
    description: 'Learning the basics'
  },
  linking_turns: { 
    color: 'text-green-600', 
    bgColor: 'bg-green-50', 
    icon: Target,
    name: 'Linking Turns',
    description: 'Connecting movements'
  },
  confident_turns: { 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-50', 
    icon: Zap,
    name: 'Confident Turns',
    description: 'Building confidence'
  },
  consistent_blue: { 
    color: 'text-indigo-600', 
    bgColor: 'bg-indigo-50', 
    icon: Trophy,
    name: 'Consistent Blue',
    description: 'Mastering blue runs'
  }
};

export function StudentProfileModal({ student, onClose }: StudentProfileModalProps) {
  const [showReviews, setShowReviews] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [stats, setStats] = useState<StudentStats>({
    totalLessons: 0,
    completedLessons: 0,
    averageRating: 0,
    currentLevel: student.level,
    totalAchievements: 0,
    lessonsThisMonth: 0,
    favoriteInstructors: [],
    totalSpent: 0,
    streakDays: 0,
    totalPoints: 0
  });
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  // Check if current user is the student
  const isStudent = authUser?.id === student.id;

  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        console.log('📊 Starting to fetch student data for:', student.id);
        
        // Get lessons for this student
        const lessonsQuery = query(
          collection(db, 'lessons'),
          where('studentIds', 'array-contains', student.id)
        );
        
                 const lessonsSnapshot = await getDocs(lessonsQuery);
         const lessons = lessonsSnapshot.docs.map(doc => ({
           id: doc.id,
           ...doc.data()
         })) as Lesson[];
         
         console.log('📚 All lessons fetched:', lessons);
         console.log('📚 Lessons with feedback:', lessons.filter(l => l.feedback && l.feedback.length > 0));

        // Calculate stats
        const completedLessons = lessons.filter(l => l.status === 'completed');
        const thisMonth = new Date();
        thisMonth.setMonth(thisMonth.getMonth() - 1);
        const lessonsThisMonth = lessons.filter(l => 
          new Date(l.date) > thisMonth
        ).length;

        // Get reviews from completed lessons
        const allReviews = completedLessons.flatMap(lesson => 
          (lesson.studentReviews || []).map(review => ({
            ...review,
            lessonId: lesson.id,
            instructorId: lesson.instructorId
          }))
        );

        // Fetch instructor names for reviews
        const reviewsWithNames = await Promise.all(
          allReviews.map(async (review, index) => {
            let authorName = `Instructor ${index + 1}`;
            let avatar = `https://images.unsplash.com/photo-${1500000000000 + index}?w=100`;
            
            if (review.instructorId) {
              try {
                const instructorDoc = await getDoc(doc(db, 'users', review.instructorId));
                if (instructorDoc.exists()) {
                  const instructorData = instructorDoc.data() as UserType;
                  authorName = instructorData.name || authorName;
                  avatar = instructorData.avatar || avatar;
                }
              } catch (error) {
                console.log('Could not fetch instructor name:', error);
              }
            }
            
            return {
              id: `review-${index}`,
              author: authorName,
              rating: review.rating,
              date: review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently',
              content: review.comment || 'Great lesson!',
              avatar,
              instructorId: review.instructorId,
              lessonId: review.lessonId,
              originalReview: review
            };
          })
        );

        // Calculate average rating
        const averageRating = reviewsWithNames.length > 0 
          ? reviewsWithNames.reduce((sum, r) => sum + r.rating, 0) / reviewsWithNames.length 
          : 0;

        // Get favorite instructors (most lessons with)
        const instructorCounts = completedLessons.reduce((acc, lesson) => {
          acc[lesson.instructorId] = (acc[lesson.instructorId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const favoriteInstructors = Object.entries(instructorCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([id]) => id);

        // Calculate total spent
        const totalSpent = completedLessons.reduce((sum, lesson) => sum + (lesson.price || 0), 0);

        setStats({
          totalLessons: lessons.length,
          completedLessons: completedLessons.length,
          averageRating,
          currentLevel: student.level,
          totalAchievements: 0, // Will be fetched separately
          lessonsThisMonth,
          favoriteInstructors,
          totalSpent,
          streakDays: 0, // Will be fetched separately
          totalPoints: 0 // Will be fetched separately
        });

        setReviews(reviewsWithNames);
        setRecentLessons(lessons.slice(0, 5)); // Last 5 lessons

        // Fetch achievements
        try {
          const achievementsQuery = query(
            collection(db, 'achievements'),
            where('studentId', '==', student.id)
          );
          const achievementsSnapshot = await getDocs(achievementsQuery);
          const achievements = achievementsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Achievement[];
          
          setRecentAchievements(achievements.slice(0, 5)); // Last 5 achievements
          setStats(prev => ({
            ...prev,
            totalAchievements: achievements.length
          }));
        } catch (error) {
          console.log('Could not fetch achievements:', error);
        }

      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchStudentData();
  }, [student.id]);

  const handleMessage = () => {
    if (!authUser) {
      const confirmed = window.confirm('Please sign in to message students. Would you like to sign in now?');
      if (confirmed) {
        onClose();
        navigate('/');
      }
      return;
    }

    // Close the modal first
    onClose();

    // Then navigate to messages with student data
    setTimeout(() => {
      navigate('/messages', { 
        state: { 
          selectedStudent: {
            id: student.id,
            name: student.name,
            image: student.image,
            level: student.level
          }
        }
      });
    }, 0);
  };

  const getLevelInfo = (level: string) => {
    return levelConfig[level as keyof typeof levelConfig] || levelConfig.first_time;
  };

  const levelInfo = getLevelInfo(student.level);

  // Helper functions for lesson status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'scheduled':
        return <Calendar className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full overflow-hidden">
          {/* Header Image */}
          <div className="relative h-64">
            <img
              src={student.image}
              alt={student.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Level Badge */}
            <div className={`absolute top-4 left-4 px-3 py-1 rounded-full ${levelInfo.bgColor} ${levelInfo.color} font-medium flex items-center gap-1`}>
              <levelInfo.icon className="w-4 h-4" />
              <span>{levelInfo.name}</span>
            </div>
          </div>

          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Main Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{student.name}</h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <GraduationCap className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{levelInfo.name}</span>
                      </div>
                      {stats.averageRating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-medium">{stats.averageRating.toFixed(1)}</span>
                          <span className="text-gray-500">({reviews.length} reviews)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-medium">{stats.lessonsThisMonth} lessons this month</span>
                  </div>
                </div>

                {/* Progress Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {stats.totalLessons}
                    </div>
                    <div className="text-sm text-gray-600">Total Lessons</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {stats.completedLessons}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <Award className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {stats.totalAchievements}
                    </div>
                    <div className="text-sm text-gray-600">Achievements</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <Target className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      ${stats.totalSpent}
                    </div>
                    <div className="text-sm text-gray-600">Total Spent</div>
                  </div>
                </div>

                {/* Level Progress */}
                <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-3">Current Level: {levelInfo.name}</h3>
                  <p className="text-gray-600 mb-3">{levelInfo.description}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(stats.completedLessons / Math.max(stats.totalLessons, 1)) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>{stats.completedLessons} lessons completed</span>
                    <span>Next level: {getLevelInfo(getNextLevel(student.level)).name}</span>
                  </div>
                </div>

                {/* Recent Achievements */}
                {recentAchievements.length > 0 && (
                  <div className="mb-8">
                    <h3 className="font-medium text-gray-900 mb-3">Recent Achievements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {recentAchievements.map((achievement, index) => (
                        <div
                          key={achievement.id}
                          className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                        >
                          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{achievement.name}</div>
                            <div className="text-sm text-gray-600">{achievement.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                                 {/* Recent Lessons */}
                 {recentLessons.length > 0 && (
                   <div className="mb-8">
                     <h3 className="font-medium text-gray-900 mb-3">Recent Lessons</h3>
                     <div className="space-y-3">
                       {recentLessons.map(lesson => (
                         <div
                           key={lesson.id}
                           className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                                       onClick={() => {
                              console.log('📋 Selected lesson data:', lesson);
                              console.log('📋 Lesson feedback:', lesson.feedback);
                              setSelectedLesson(lesson);
                            }}
                         >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                              <p className="text-sm text-gray-600">
                                {new Date(lesson.date).toLocaleDateString()} • {lesson.skillLevel}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                lesson.status === 'completed' ? 'bg-green-100 text-green-700' :
                                lesson.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {lesson.status}
                              </span>
                              <span className="text-sm font-medium">${lesson.price}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews Section */}
                {reviews.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">
                        Instructor Reviews ({reviews.length})
                      </h3>
                      <button
                        onClick={() => setShowReviews(!showReviews)}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {showReviews ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Hide Reviews
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            Show Reviews
                          </>
                        )}
                      </button>
                    </div>
                    
                    {showReviews && (
                      <div className="space-y-4">
                        {reviews.map(review => (
                          <div 
                            key={review.id} 
                            className="p-4 border border-gray-100 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={review.avatar}
                                  alt={review.author}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div>
                                  <div className="font-medium text-gray-900">{review.author}</div>
                                  <div className="text-sm text-gray-500">{review.date}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="font-medium">{review.rating}</span>
                              </div>
                            </div>
                            <p className="text-gray-600">{review.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* No Reviews Message */}
                {!isLoadingReviews && reviews.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No reviews yet</p>
                    <p className="text-sm">Complete some lessons to get instructor feedback!</p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="w-full md:w-72 space-y-4">
                <button
                  onClick={handleMessage}
                  className="w-full px-4 py-3 border border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  Contact Student
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/profile/${student.id}`);
                  }}
                  className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <User className="w-5 h-5" />
                  View Full Profile
                </button>

                {/* Student Info */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      {student.email}
                    </div>
                    {student.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        {student.phone}
                      </div>
                    )}
                    {student.address && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Home className="w-4 h-4" />
                        {student.address}
                      </div>
                    )}
                    {student.homeMountain && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mountain className="w-4 h-4" />
                        {student.homeMountain}
                      </div>
                    )}
                  </div>
                </div>

                {/* Level Information */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Skill Level</h4>
                  <div className="space-y-2">
                    <div className={`flex items-center gap-2 p-2 rounded-lg ${levelInfo.bgColor}`}>
                      <levelInfo.icon className={`w-4 h-4 ${levelInfo.color}`} />
                      <span className={`font-medium ${levelInfo.color}`}>{levelInfo.name}</span>
                    </div>
                    <p className="text-sm text-gray-600">{levelInfo.description}</p>
                  </div>
                </div>

                {/* Lesson Statistics */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Lesson Statistics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Completion Rate</span>
                      <span className="font-medium">
                        {stats.totalLessons > 0 ? Math.round((stats.completedLessons / stats.totalLessons) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Lessons This Month</span>
                      <span className="font-medium">{stats.lessonsThisMonth}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Average Rating</span>
                      <span className="font-medium">
                        {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Spent</span>
                      <span className="font-medium">${stats.totalSpent}</span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {student.bio && (
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">About</h4>
                    <p className="text-sm text-gray-600">{student.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
                 </div>
       </div>

       {/* Lesson Details Modal */}
       {selectedLesson && (
         <div className="fixed inset-0 z-50 overflow-y-auto">
           <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedLesson(null)} />
           
           <div className="relative min-h-screen flex items-center justify-center p-4">
             <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full">
               <button
                 onClick={() => setSelectedLesson(null)}
                 className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
               >
                 <X className="w-6 h-6" />
               </button>

               <div className="p-6">
                 <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                     <Calendar className="w-6 h-6 text-blue-600" />
                   </div>
                   <div className="flex-1">
                     <h2 className="text-2xl font-bold text-gray-900">{selectedLesson.title}</h2>
                     <p className="text-gray-600">
                       {new Date(selectedLesson.date).toLocaleDateString(undefined, {
                         weekday: 'long',
                         year: 'numeric',
                         month: 'long',
                         day: 'numeric'
                       })}
                     </p>
                   </div>
                   <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(selectedLesson.status)}`}>
                     {getStatusIcon(selectedLesson.status)}
                     {selectedLesson.status.replace('_', ' ')}
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="p-4 bg-gray-50 rounded-lg">
                     <div className="flex items-center gap-2 mb-2">
                       <Clock className="w-5 h-5 text-gray-600" />
                       <h3 className="font-medium text-gray-900">Time</h3>
                     </div>
                     <p className="text-gray-600">
                       {selectedLesson.startTime && selectedLesson.endTime 
                         ? `${selectedLesson.startTime} - ${selectedLesson.endTime}`
                         : selectedLesson.time === 'morning' ? 'Morning (9 AM - 12 PM)' :
                           selectedLesson.time === 'afternoon' ? 'Afternoon (1 PM - 4 PM)' :
                           'Full Day (9 AM - 4 PM)'
                       }
                     </p>
                   </div>
                   
                   <div className="p-4 bg-gray-50 rounded-lg">
                     <div className="flex items-center gap-2 mb-2">
                       <Target className="w-5 h-5 text-gray-600" />
                       <h3 className="font-medium text-gray-900">Skill Level</h3>
                     </div>
                     <p className="text-gray-600">{selectedLesson.skillLevel}</p>
                   </div>
                   
                   <div className="p-4 bg-gray-50 rounded-lg">
                     <div className="flex items-center gap-2 mb-2">
                       <Users className="w-5 h-5 text-gray-600" />
                       <h3 className="font-medium text-gray-900">Type</h3>
                     </div>
                     <p className="text-gray-600 capitalize">{selectedLesson.type}</p>
                   </div>
                   
                   <div className="p-4 bg-gray-50 rounded-lg">
                     <div className="flex items-center gap-2 mb-2">
                       <Award className="w-5 h-5 text-gray-600" />
                       <h3 className="font-medium text-gray-900">Price</h3>
                     </div>
                     <p className="text-gray-600">${selectedLesson.price}</p>
                   </div>
                 </div>

                 {selectedLesson.skillsFocus && selectedLesson.skillsFocus.length > 0 && (
                   <div className="mb-6">
                     <h3 className="font-medium text-gray-900 mb-3">Skills Focus</h3>
                     <div className="flex flex-wrap gap-2">
                       {selectedLesson.skillsFocus.map((skill, index) => (
                         <span
                           key={index}
                           className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium"
                         >
                           {skill}
                         </span>
                       ))}
                     </div>
                   </div>
                 )}

                 {selectedLesson.notes && (
                   <div className="mb-6">
                     <h3 className="font-medium text-gray-900 mb-3">Notes</h3>
                     <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                       {selectedLesson.notes}
                     </p>
                   </div>
                 )}

                                   {selectedLesson.description && (
                    <div className="mb-6">
                      <h3 className="font-medium text-gray-900 mb-3">Description</h3>
                      <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                        {selectedLesson.description}
                      </p>
                    </div>
                  )}

                                                        {/* Show instructor feedback if completed - only for instructors and admins */}
                   {selectedLesson.feedback && selectedLesson.feedback.length > 0 && authUser && (authUser.role === 'instructor' || authUser.role === 'admin') && (
                     <div className="mb-6">
                       <h3 className="font-medium text-gray-900 mb-3">Previous Lesson Feedback</h3>
                       <div className="space-y-4">
                         {selectedLesson.feedback.map((feedback, index) => (
                           <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                             {/* Quick Stats Grid */}
                             {feedback.performance && (
                               <div className="grid grid-cols-5 gap-3 mb-4">
                                 <div className="text-center p-2 bg-white rounded border">
                                   <div className="text-xs text-gray-600 mb-1">Technique</div>
                                   <div className="text-lg font-bold text-blue-600">{feedback.performance.technique}/5</div>
                                 </div>
                                 <div className="text-center p-2 bg-white rounded border">
                                   <div className="text-xs text-gray-600 mb-1">Control</div>
                                   <div className="text-lg font-bold text-blue-600">{feedback.performance.control}/5</div>
                                 </div>
                                 <div className="text-center p-2 bg-white rounded border">
                                   <div className="text-xs text-gray-600 mb-1">Confidence</div>
                                   <div className="text-lg font-bold text-blue-600">{feedback.performance.confidence}/5</div>
                                 </div>
                                 <div className="text-center p-2 bg-white rounded border">
                                   <div className="text-xs text-gray-600 mb-1">Safety</div>
                                   <div className="text-lg font-bold text-blue-600">{feedback.performance.safety}/5</div>
                                 </div>
                                 <div className="text-center p-2 bg-blue-100 rounded border border-blue-200">
                                   <div className="text-xs text-blue-700 mb-1">Overall</div>
                                   <div className="text-lg font-bold text-blue-800">{feedback.performance.overall}/5</div>
                                 </div>
                               </div>
                             )}

                             {/* Key Information Grid */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {/* Current Level */}
                               {feedback.skillAssessment?.currentLevel && (
                                 <div className="bg-white p-3 rounded border">
                                   <div className="text-sm font-medium text-gray-700 mb-1">Current Level</div>
                                   <div className="text-lg font-semibold text-gray-900">{feedback.skillAssessment.currentLevel}</div>
                                 </div>
                               )}

                               {/* Areas of Focus */}
                               {feedback.skillAssessment?.areasOfFocus && feedback.skillAssessment.areasOfFocus.length > 0 && (
                                 <div className="bg-white p-3 rounded border">
                                   <div className="text-sm font-medium text-gray-700 mb-2">Focus Areas</div>
                                   <div className="flex flex-wrap gap-1">
                                     {feedback.skillAssessment.areasOfFocus.slice(0, 3).map((area, areaIndex) => (
                                       <span
                                         key={areaIndex}
                                         className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
                                       >
                                         {area}
                                       </span>
                                     ))}
                                     {feedback.skillAssessment.areasOfFocus.length > 3 && (
                                       <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                         +{feedback.skillAssessment.areasOfFocus.length - 3} more
                                       </span>
                                     )}
                                   </div>
                                 </div>
                               )}

                               {/* Strengths */}
                               {feedback.strengths && feedback.strengths.length > 0 && (
                                 <div className="bg-white p-3 rounded border">
                                   <div className="text-sm font-medium text-gray-700 mb-2">Strengths</div>
                                   <div className="flex flex-wrap gap-1">
                                     {feedback.strengths.slice(0, 3).map((strength, strengthIndex) => (
                                       <span
                                         key={strengthIndex}
                                         className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                                       >
                                         {strength}
                                       </span>
                                     ))}
                                     {feedback.strengths.length > 3 && (
                                       <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                         +{feedback.strengths.length - 3} more
                                       </span>
                                     )}
                                   </div>
                                 </div>
                               )}

                               {/* Areas for Improvement */}
                               {feedback.areasForImprovement && feedback.areasForImprovement.length > 0 && (
                                 <div className="bg-white p-3 rounded border">
                                   <div className="text-sm font-medium text-gray-700 mb-2">Needs Work</div>
                                   <div className="flex flex-wrap gap-1">
                                     {feedback.areasForImprovement.slice(0, 3).map((area, areaIndex) => (
                                       <span
                                         key={areaIndex}
                                         className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium"
                                       >
                                         {area}
                                       </span>
                                     ))}
                                     {feedback.areasForImprovement.length > 3 && (
                                       <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                         +{feedback.areasForImprovement.length - 3} more
                                       </span>
                                     )}
                                   </div>
                                 </div>
                               )}
                             </div>

                             {/* Quick Notes */}
                             {(feedback.instructorNotes || feedback.homework || feedback.skillAssessment?.recommendations) && (
                               <div className="mt-4 space-y-2">
                                 {feedback.instructorNotes && (
                                   <div className="bg-white p-3 rounded border">
                                     <div className="text-sm font-medium text-gray-700 mb-1">Notes</div>
                                     <div className="text-sm text-gray-600">{feedback.instructorNotes}</div>
                                   </div>
                                 )}
                                 {feedback.homework && (
                                   <div className="bg-white p-3 rounded border">
                                     <div className="text-sm font-medium text-gray-700 mb-1">Homework</div>
                                     <div className="text-sm text-gray-600">{feedback.homework}</div>
                                   </div>
                                 )}
                                 {feedback.skillAssessment?.recommendations && (
                                   <div className="bg-white p-3 rounded border">
                                     <div className="text-sm font-medium text-gray-700 mb-1">Recommendations</div>
                                     <div className="text-sm text-gray-600">{feedback.skillAssessment.recommendations}</div>
                                   </div>
                                 )}
                               </div>
                             )}

                             {/* Level Up Celebration */}
                             {feedback.progressUpdate?.levelUp && (
                               <div className="mt-4 p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border border-yellow-200">
                                 <div className="flex items-center gap-2">
                                   <span className="text-2xl">🎉</span>
                                   <div>
                                     <div className="font-medium text-yellow-800">Level Up!</div>
                                     {feedback.progressUpdate.newLevel && (
                                       <div className="text-sm text-yellow-700">New Level: {feedback.progressUpdate.newLevel}</div>
                                     )}
                                   </div>
                                 </div>
                               </div>
                             )}
                           </div>
                         ))}
                       </div>
                     </div>
                                      )}

                   {/* Debug Section - Remove after testing */}
                   {authUser && (authUser.role === 'instructor' || authUser.role === 'admin') && (
                     <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                       <h3 className="font-medium text-yellow-900 mb-2">Debug Info (Instructor/Admin Only)</h3>
                       <div className="text-sm text-yellow-800 space-y-1">
                         <div>User Role: {authUser.role}</div>
                         <div>Has Feedback: {selectedLesson.feedback ? 'Yes' : 'No'}</div>
                         <div>Feedback Length: {selectedLesson.feedback?.length || 0}</div>
                         <div>Should Show Feedback: {(selectedLesson.feedback && selectedLesson.feedback.length > 0 && authUser && (authUser.role === 'instructor' || authUser.role === 'admin')) ? 'Yes' : 'No'}</div>
                         <div>Feedback Data: {JSON.stringify(selectedLesson.feedback, null, 2)}</div>
                       </div>
                     </div>
                   )}

                   {/* Show student reviews if completed */}
                  {selectedLesson.status === 'completed' && selectedLesson.studentReviews && selectedLesson.studentReviews.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Student Reviews</h3>
                      <div className="space-y-3">
                        {selectedLesson.studentReviews.map((review, index) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="font-medium">{review.rating}/5</span>
                              </div>
                              <span className="text-sm text-gray-500">
                                {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently'}
                              </span>
                            </div>
                            {review.comment && (
                              <p className="text-gray-600">{review.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }

// Helper function to get next level
function getNextLevel(currentLevel: string): string {
  const levels = [
    'first_time',
    'developing_turns',
    'linking_turns',
    'confident_turns',
    'consistent_blue'
  ];
  const currentIndex = levels.indexOf(currentLevel);
  return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : currentLevel;
}
