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
  Shield
} from 'lucide-react';
import { UnifiedLessonModal } from '../lessons/UnifiedLessonModal';
import { AvailabilityCalendar } from '../calendar/AvailabilityCalendar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, query, getDocs, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Lesson, StudentReview, User } from '../../types';
import { instructorStatsService, InstructorStats as EnhancedInstructorStats } from '../../services/instructorStats';
import { InstructorStatsFallback } from './InstructorStatsFallback';

interface BasicInstructorStats {
  totalLessons: number;
  averageRating: number;
  totalStudents: number;
  totalReviews: number;
}

interface Instructor {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  reviewCount: number;
  price: number;
  specialties: string[];
  experience: number;
  languages: string[];
  availability: string;
  stats?: BasicInstructorStats;
}

interface InstructorProfileModalProps {
  instructor: Instructor;
  onClose: () => void;
}

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  content: string;
  avatar: string;
  studentId?: string;
  lessonId?: string;
  isApproved?: boolean;
  isHidden?: boolean;
  originalReview?: StudentReview;
}

const certifications = [
  'PSIA Level 3 Certified',
  'Avalanche Safety Level 2',
  'First Aid & CPR',
  'Freestyle Specialist 2'
];

// Tier colors and icons
const tierConfig = {
  bronze: { color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Medal },
  silver: { color: 'text-gray-600', bgColor: 'bg-gray-50', icon: Medal },
  gold: { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Trophy },
  platinum: { color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Crown },
  diamond: { color: 'text-purple-600', bgColor: 'bg-purple-50', icon: Crown }
};

export function InstructorProfileModal({ instructor, onClose }: InstructorProfileModalProps) {
  const [showBooking, setShowBooking] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [enhancedStats, setEnhancedStats] = useState<EnhancedInstructorStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  // Check if current user is the instructor
  const isInstructor = authUser?.id === instructor.id;

  // Fetch enhanced instructor stats
  useEffect(() => {
    const fetchEnhancedStats = async () => {
      try {
        console.log('📊 Starting to fetch enhanced stats for instructor:', instructor.id);
        setIsLoadingStats(true);
        const stats = await instructorStatsService.getInstructorStats(instructor.id);
        console.log('✅ Enhanced stats fetched:', stats);
        setEnhancedStats(stats);
      } catch (error) {
        console.error('❌ Error fetching enhanced stats:', error);
        // Don't show error to user, just continue without enhanced stats
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchEnhancedStats();
  }, [instructor.id]);

  // Fetch real reviews for this instructor
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        console.log('🔍 Starting to fetch reviews for instructor:', instructor.id);
        console.log('👤 Current auth user:', authUser?.id || 'Not signed in');
        setIsLoadingReviews(true);
        
        // Get lessons taught by this instructor (public data, no auth required)
        const lessonsQuery = query(
          collection(db, 'lessons'),
          where('instructorId', '==', instructor.id),
          where('status', '==', 'completed')
        );
        
        console.log('📋 Executing lessons query...');
        const lessonsSnapshot = await getDocs(lessonsQuery);
        console.log('📊 Found lessons:', lessonsSnapshot.size);
        
        const lessons = lessonsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Lesson[];

        console.log('📝 Lessons data:', lessons.map(l => ({
          id: l.id,
          instructorId: l.instructorId,
          status: l.status,
          studentReviews: l.studentReviews?.length || 0,
          studentIds: l.studentIds?.length || 0
        })));

        // Extract all student reviews
        const allReviews = lessons.flatMap(lesson => 
          (lesson.studentReviews || []).map(review => ({
            ...review,
            lessonId: lesson.id,
            studentIds: lesson.studentIds || []
          }))
        );
        
        console.log('⭐ Total reviews found:', allReviews.length);
        console.log('📋 Reviews data:', allReviews.map(r => ({
          rating: r.rating,
          comment: r.comment?.substring(0, 50) + '...',
          studentIds: r.studentIds,
          isApproved: r.isApproved,
          isHidden: r.isHidden
        })));
        
        // Fetch student names for reviews
        const reviewsWithNames = await Promise.all(
          allReviews.map(async (review, index) => {
            let authorName = `Student ${index + 1}`;
            let avatar = `https://images.unsplash.com/photo-${1500000000000 + index}?w=100`;
            
            // Try to get the first student's name from the lesson
            if (review.studentIds && review.studentIds.length > 0) {
              try {
                console.log('👤 Fetching student name for ID:', review.studentIds[0]);
                const studentDoc = await getDoc(doc(db, 'users', review.studentIds[0]));
                if (studentDoc.exists()) {
                  const studentData = studentDoc.data() as User;
                  authorName = studentData.name || authorName;
                  avatar = studentData.avatar || avatar;
                  console.log('✅ Found student name:', authorName);
                } else {
                  console.log('❌ Student document does not exist');
                }
              } catch (error) {
                console.log('❌ Could not fetch student name, using default:', error);
              }
            } else {
              console.log('⚠️ No student IDs found for review');
            }
            
            return {
              id: `review-${index}`,
              author: authorName,
              rating: review.rating,
              date: review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently',
              content: review.comment || 'Great lesson experience!',
              avatar,
              studentId: review.studentIds?.[0],
              lessonId: review.lessonId,
              isApproved: review.isApproved ?? true, // Default to approved for existing reviews (backward compatibility)
              isHidden: review.isHidden ?? false,
              originalReview: review
            };
          })
        );

        console.log('🎯 Final reviews with names:', reviewsWithNames.map(r => ({
          id: r.id,
          author: r.author,
          rating: r.rating,
          isApproved: r.isApproved,
          isHidden: r.isHidden
        })));

        setReviews(reviewsWithNames);
      } catch (error) {
        console.error('❌ Error fetching reviews:', error);
        // Don't show error to user, just set empty reviews
        setReviews([]);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [instructor.id]);

  // Handle review approval/hiding
  const handleReviewAction = async (reviewId: string, action: 'approve' | 'hide') => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      if (!review || !review.lessonId) return;

      // Update the review in the lesson document
      const lessonRef = doc(db, 'lessons', review.lessonId);
      const lessonDoc = await getDoc(lessonRef);
      
      if (lessonDoc.exists()) {
        const lessonData = lessonDoc.data() as Lesson;
        const updatedReviews = lessonData.studentReviews?.map(r => {
          // Match by studentId and rating to find the correct review
          if (r.studentId === review.studentId && r.rating === review.rating) {
            return {
              ...r,
              isApproved: action === 'approve',
              isHidden: action === 'hide'
            };
          }
          return r;
        });

        await updateDoc(lessonRef, {
          studentReviews: updatedReviews
        });

        console.log('✅ Review updated in database:', {
          reviewId,
          action,
          isApproved: action === 'approve',
          isHidden: action === 'hide'
        });

        // Update local state
        setReviews(prev => prev.map(r => 
          r.id === reviewId 
            ? { ...r, isApproved: action === 'approve', isHidden: action === 'hide' }
            : r
        ));
      }
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  const handleMessage = () => {
    if (!authUser) {
      const confirmed = window.confirm('Please sign in to message instructors. Would you like to sign in now?');
      if (confirmed) {
        onClose();
        navigate('/');
      }
      return;
    }

    // Close the modal first
    onClose();

    // Then navigate to messages with instructor data
    setTimeout(() => {
      navigate('/messages', { 
        state: { 
          selectedInstructor: {
            id: instructor.id,
            name: instructor.name,
            image: instructor.image,
            location: instructor.location,
            specialties: instructor.specialties || [],
            languages: instructor.languages || [],
            experience: instructor.experience || 0,
            price: instructor.price || 0
          }
        }
      });
    }, 0);
  };

  // Calculate completion rate based on stats
  const completionRate = enhancedStats?.completionRate || 95;

  // Get tier configuration
  const tier = enhancedStats?.tier || 'bronze';
  const tierInfo = tierConfig[tier];

  // Filter reviews based on user type
  const publicReviews = reviews.filter(review => review.isApproved && !review.isHidden);
  const pendingReviews = reviews.filter(review => !review.isApproved && !review.isHidden);
  const hiddenReviews = reviews.filter(review => review.isHidden);
  const allReviews = isInstructor ? reviews : publicReviews;

  console.log('🔍 Review filtering results:', {
    totalReviews: reviews.length,
    publicReviews: publicReviews.length,
    allReviews: allReviews.length,
    pendingReviews: pendingReviews.length,
    hiddenReviews: hiddenReviews.length,
    isInstructor: isInstructor,
    authUserId: authUser?.id,
    instructorId: instructor.id
  });

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative min-h-screen flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full overflow-hidden">
            {/* Header Image */}
            <div className="relative h-64">
              <img
                src={instructor.image}
                alt={instructor.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              {/* Tier Badge */}
              {enhancedStats && (
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full ${tierInfo.bgColor} ${tierInfo.color} font-medium flex items-center gap-1`}>
                  <tierInfo.icon className="w-4 h-4" />
                  <span className="capitalize">{tier}</span>
                </div>
              )}
            </div>

            <div className="p-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Main Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{instructor.name}</h2>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">{instructor.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-medium">{instructor.rating.toFixed(1)}</span>
                          <span className="text-gray-500">({instructor.reviewCount} reviews)</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="w-5 h-5 text-green-600" />
                      <span className="text-green-600 font-medium">{completionRate}% completion rate</span>
                    </div>
                  </div>

                  {/* Performance Score and Ranking */}
                  {enhancedStats && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">Performance Score</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-blue-600">{enhancedStats.performanceScore}</span>
                            <span className="text-sm text-gray-600">/ 100</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <h3 className="font-semibold text-gray-900 mb-1">Ranking</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-purple-600">#{enhancedStats.ranking}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Badges */}
                  {enhancedStats?.badges && enhancedStats.badges.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-medium text-gray-900 mb-3">Achievements</h3>
                      <div className="flex flex-wrap gap-2">
                        {enhancedStats.badges.map((badge, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 rounded-full text-sm font-medium border border-orange-200"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Specialties */}
                  <div className="mb-8">
                    <h3 className="font-medium text-gray-900 mb-3">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {instructor.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div className="mb-8">
                    <h3 className="font-medium text-gray-900 mb-3">Certifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {certifications.map((cert, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                        >
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-gray-700">{cert}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced Stats */}
                  {enhancedStats ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {enhancedStats.totalStudents}+
                        </div>
                        <div className="text-sm text-gray-600">Students Taught</div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900 mb-1">{instructor.experience}+</div>
                        <div className="text-sm text-gray-600">Years Experience</div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {enhancedStats.totalLessons}
                        </div>
                        <div className="text-sm text-gray-600">Lessons Taught</div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <Award className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {enhancedStats.lessonSuccessRate?.toFixed(0) || 0}%
                        </div>
                        <div className="text-sm text-gray-600">Success Rate</div>
                      </div>
                    </div>
                  ) : (
                    <InstructorStatsFallback instructor={instructor} />
                  )}

                  {/* Reviews Section */}
                  {allReviews.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-gray-900">
                          {isInstructor ? 'All Reviews' : 'Student Reviews'}
                          {isInstructor && (
                            <span className="ml-2 text-sm text-gray-500">
                              ({publicReviews.length} public, {pendingReviews.length} pending, {hiddenReviews.length} hidden)
                            </span>
                          )}
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
                              Show Reviews ({allReviews.length})
                            </>
                          )}
                        </button>
                      </div>
                      
                      {showReviews && (
                        <div className="space-y-4">
                          {allReviews.map(review => (
                            <div 
                              key={review.id} 
                              className={`p-4 border rounded-lg ${
                                review.isHidden 
                                  ? 'border-red-200 bg-red-50' 
                                  : !review.isApproved 
                                    ? 'border-yellow-200 bg-yellow-50' 
                                    : 'border-gray-100 bg-gray-50'
                              }`}
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
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    <span className="font-medium">{review.rating}</span>
                                  </div>
                                  {isInstructor && (
                                    <div className="flex items-center gap-1">
                                      {review.isHidden && (
                                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                                          Hidden
                                        </span>
                                      )}
                                      {!review.isApproved && !review.isHidden && (
                                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                                          Pending
                                        </span>
                                      )}
                                      {review.isApproved && !review.isHidden && (
                                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                                          Public
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <p className="text-gray-600">{review.content}</p>
                              
                              {/* Review Actions for Instructors */}
                              {isInstructor && (
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                                  <span className="text-sm text-gray-500">Review Controls:</span>
                                  {!review.isApproved && !review.isHidden && (
                                    <>
                                      <button
                                        onClick={() => handleReviewAction(review.id, 'approve')}
                                        className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                      >
                                        <Check className="w-3 h-3" />
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleReviewAction(review.id, 'hide')}
                                        className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                      >
                                        <XIcon className="w-3 h-3" />
                                        Hide
                                      </button>
                                    </>
                                  )}
                                  {review.isApproved && !review.isHidden && (
                                    <button
                                      onClick={() => handleReviewAction(review.id, 'hide')}
                                      className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                    >
                                      <XIcon className="w-3 h-3" />
                                      Hide
                                    </button>
                                  )}
                                  {review.isHidden && (
                                    <button
                                      onClick={() => handleReviewAction(review.id, 'approve')}
                                      className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                    >
                                      <Check className="w-3 h-3" />
                                      Show
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* No Reviews Message */}
                  {!isLoadingReviews && allReviews.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No reviews yet</p>
                      <p className="text-sm">Be the first to leave a review!</p>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="w-full md:w-72 space-y-4">
                  <button
                    onClick={() => setShowBooking(true)}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-5 h-5" />
                    Book a Lesson
                  </button>
                  <button
                    onClick={() => setShowCalendar(true)}
                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-5 h-5" />
                    View Availability
                  </button>
                  <button
                    onClick={handleMessage}
                    className="w-full px-4 py-3 border border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Contact Instructor
                  </button>

                  {/* Reviews Summary */}
                  {publicReviews.length > 0 && (
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        Reviews ({publicReviews.length})
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Average Rating</span>
                          <span className="font-medium">{instructor.rating.toFixed(1)} ⭐</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Public Reviews</span>
                          <span className="font-medium">{publicReviews.length}</span>
                        </div>
                        {isInstructor && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Pending Approval</span>
                              <span className="font-medium text-yellow-600">{pendingReviews.length}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Hidden Reviews</span>
                              <span className="font-medium text-red-600">{hiddenReviews.length}</span>
                            </div>
                          </>
                        )}
                        <button
                          onClick={() => setShowReviews(!showReviews)}
                          className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {showReviews ? 'Hide Reviews' : 'View All Reviews'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Languages</h4>
                    <div className="space-y-2">
                      {instructor.languages.map((language, index) => (
                        <div key={index} className="flex items-center gap-2 text-gray-600">
                          <Globe2 className="w-4 h-4" />
                          {language}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Availability</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        {instructor.availability}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Snowflake className="w-4 h-4" />
                        Winter Season 2024
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Stats Sidebar */}
                  {enhancedStats ? (
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Response Time</span>
                          <span className="font-medium">{enhancedStats.responseTime}h avg</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Repeat Students</span>
                          <span className="font-medium">{enhancedStats.repeatStudentRate}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Earnings</span>
                          <span className="font-medium">${enhancedStats.totalEarnings?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Response Time</span>
                          <span className="font-medium text-gray-400">TBD</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Repeat Students</span>
                          <span className="font-medium text-gray-400">TBD</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Earnings</span>
                          <span className="font-medium text-gray-400">TBD</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Metrics will be available after first lesson
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UnifiedLessonModal
        isOpen={showBooking}
        onClose={() => setShowBooking(false)}
        mode="book"
        instructor={{
          id: instructor.id,
          name: instructor.name,
          price: instructor.price || 0,
          role: 'instructor',
          email: '',
          avatar: instructor.image,
          specialties: instructor.specialties || []
        }}
      />

      {showCalendar && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCalendar(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">{instructor.name}'s Availability</h2>
                  <button
                    onClick={() => setShowCalendar(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <AvailabilityCalendar
                  instructor={{
                    id: instructor.id,
                    name: instructor.name,
                    role: 'instructor',
                    email: '',
                    avatar: instructor.image,
                    price: instructor.price || 0,
                    specialties: instructor.specialties || []
                  }}
                  viewMode="student"
                  onLessonCreated={() => {
                    setShowCalendar(false);
                    setShowBooking(true);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}