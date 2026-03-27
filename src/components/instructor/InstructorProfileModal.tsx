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
  User as UserIcon
} from 'lucide-react';
import { UnifiedLessonModal } from '../lessons/UnifiedLessonModal';
import { InstructorCalendar } from '../dashboard/instructor/InstructorCalendar';
import { ResponsiveModalPanel } from '../common/ResponsiveModalPanel';
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
  /** Legacy; prefer studentLessonRate for student booking (mountain rate). */
  price?: number;
  priceLabel?: string;
  studentLessonRate?: number | null;
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
  bronze: {
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-500/15 dark:bg-amber-500/20 border-amber-200/80 dark:border-amber-700/50',
    icon: Medal
  },
  silver: {
    color: 'text-slate-700 dark:text-slate-200',
    bgColor: 'bg-slate-400/15 dark:bg-slate-500/20 border-slate-200 dark:border-slate-600',
    icon: Medal
  },
  gold: {
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-500/15 dark:bg-yellow-500/20 border-yellow-200 dark:border-yellow-700/50',
    icon: Trophy
  },
  platinum: {
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-500/15 dark:bg-blue-500/20 border-blue-200 dark:border-blue-700/50',
    icon: Crown
  },
  diamond: {
    color: 'text-violet-700 dark:text-violet-300',
    bgColor: 'bg-violet-500/15 dark:bg-violet-500/20 border-violet-200 dark:border-violet-700/50',
    icon: Crown
  }
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
            price: instructor.studentLessonRate ?? instructor.price ?? 0
          }
        }
      });
    }, 0);
  };

  // Calculate completion rate based on stats
  const completionRate = enhancedStats?.completionRate || 95;

  // Get tier configuration
  const tier = enhancedStats?.tier || 'bronze';
  const tierInfo = tierConfig[tier as keyof typeof tierConfig] ?? tierConfig.bronze;

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
      <ResponsiveModalPanel onClose={onClose} labelledBy="instructor-profile-modal-title" maxWidthClass="sm:max-w-4xl">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-slate-50 dark:bg-gray-950">
          {/* Cover + overlap card */}
          <div className="relative">
            <div className="relative h-44 sm:h-52 overflow-hidden">
              <img
                src={instructor.image}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/30" />
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md ring-1 ring-white/20 transition hover:bg-black/50"
                aria-label="Close profile"
              >
                <X className="h-5 w-5" />
              </button>
              {enhancedStats && (() => {
                const TierIcon = tierInfo.icon;
                return (
                  <div
                    className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-md ${tierInfo.bgColor} ${tierInfo.color}`}
                  >
                    <TierIcon className="h-3.5 w-3.5" />
                    <span className="capitalize">{tier}</span>
                  </div>
                );
              })()}
            </div>

            <div className="relative z-10 -mt-14 px-4 pb-2 sm:px-6">
              <div className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
                  <div className="relative -mt-16 shrink-0 self-start sm:-mt-20">
                    <img
                      src={instructor.image}
                      alt={instructor.name}
                      className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-md dark:border-gray-900 sm:h-28 sm:w-28"
                    />
                  </div>
                  <div className="min-w-0 flex-1 sm:pb-0.5">
                    <h2
                      id="instructor-profile-modal-title"
                      className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl"
                    >
                      {instructor.name}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                        {instructor.location}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {instructor.rating.toFixed(1)}
                        </span>
                        <span className="text-gray-500 dark:text-gray-500">
                          ({instructor.reviewCount} reviews)
                        </span>
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800/60">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {completionRate}% completion
                      </span>
                      {instructor.studentLessonRate != null && instructor.studentLessonRate > 0 && (
                        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 ring-1 ring-blue-200/80 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-800/50">
                          From ${instructor.studentLessonRate}/hr
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-6 sm:px-6 sm:py-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
              <div className="min-w-0 flex-1 space-y-8">
                {enhancedStats && (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50 to-white p-4 dark:border-blue-900/50 dark:from-blue-950/40 dark:to-gray-900 sm:p-5">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                        <Target className="h-4 w-4" />
                        Performance
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold tabular-nums text-blue-700 dark:text-blue-300">
                          {enhancedStats.performanceScore}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">/ 100</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-500">Composite score from lessons &amp; feedback</p>
                    </div>
                    <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 to-white p-4 dark:border-violet-900/50 dark:from-violet-950/40 dark:to-gray-900 sm:p-5">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                        <TrendingUp className="h-4 w-4" />
                        Leaderboard
                      </div>
                      <div className="text-3xl font-bold tabular-nums text-violet-700 dark:text-violet-300">
                        #{enhancedStats.ranking}
                      </div>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-500">Season ranking among instructors</p>
                    </div>
                  </div>
                )}

                {enhancedStats?.badges && enhancedStats.badges.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Achievements
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {enhancedStats.badges.map((badge, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 text-sm font-medium text-amber-900 dark:border-amber-800/60 dark:from-amber-950/50 dark:to-orange-950/40 dark:text-amber-100"
                        >
                          <Trophy className="h-3.5 w-3.5 shrink-0 opacity-80" />
                          {badge}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Specialties
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {instructor.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-800 ring-1 ring-blue-100 dark:bg-blue-950/50 dark:text-blue-200 dark:ring-blue-900/60"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Certifications
                  </h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {certifications.map((cert, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/80"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950/60">
                          <Shield className="h-4 w-4 text-green-700 dark:text-green-400" />
                        </div>
                        <span className="text-sm leading-snug text-gray-800 dark:text-gray-200">{cert}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {enhancedStats ? (
                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      By the numbers
                    </h3>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {[
                        {
                          icon: Users,
                          value: `${enhancedStats.totalStudents}+`,
                          label: 'Students',
                          tone: 'text-sky-600 dark:text-sky-400',
                          bg: 'bg-sky-50 dark:bg-sky-950/40'
                        },
                        {
                          icon: Clock,
                          value: `${instructor.experience}+`,
                          label: 'Years exp.',
                          tone: 'text-indigo-600 dark:text-indigo-400',
                          bg: 'bg-indigo-50 dark:bg-indigo-950/40'
                        },
                        {
                          icon: Target,
                          value: String(enhancedStats.totalLessons),
                          label: 'Lessons',
                          tone: 'text-violet-600 dark:text-violet-400',
                          bg: 'bg-violet-50 dark:bg-violet-950/40'
                        },
                        {
                          icon: Award,
                          value: `${enhancedStats.lessonSuccessRate?.toFixed(0) || 0}%`,
                          label: 'Success rate',
                          tone: 'text-emerald-600 dark:text-emerald-400',
                          bg: 'bg-emerald-50 dark:bg-emerald-950/40'
                        }
                      ].map((item, i) => {
                        const StatIcon = item.icon;
                        return (
                          <div
                            key={i}
                            className="rounded-2xl border border-gray-200/90 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-900"
                          >
                            <div
                              className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${item.bg}`}
                            >
                              <StatIcon className={`h-5 w-5 ${item.tone}`} />
                            </div>
                            <div className="text-xl font-bold tabular-nums text-gray-900 dark:text-white">
                              {item.value}
                            </div>
                            <div className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                              {item.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ) : (
                  <InstructorStatsFallback instructor={instructor} />
                )}

                {allReviews.length > 0 && (
                  <section>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {isInstructor ? 'All reviews' : 'Student reviews'}
                        {isInstructor && (
                          <span className="mt-1 block text-[11px] font-normal normal-case text-gray-500 dark:text-gray-500">
                            {publicReviews.length} public · {pendingReviews.length} pending · {hiddenReviews.length}{' '}
                            hidden
                          </span>
                        )}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowReviews(!showReviews)}
                        className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
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
                      <div className="space-y-3">
                        {allReviews.map((review) => (
                          <div
                            key={review.id}
                            className={`rounded-xl border p-4 ${
                              review.isHidden
                                ? 'border-red-200/80 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30'
                                : !review.isApproved
                                  ? 'border-amber-200/80 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/25'
                                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/80'
                            }`}
                          >
                            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex items-center gap-3">
                                <img
                                  src={review.avatar}
                                  alt=""
                                  className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                                />
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {review.author}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {review.date}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {review.rating}
                                  </span>
                                </div>
                                {isInstructor && (
                                  <div className="flex flex-wrap items-center gap-1">
                                    {review.isHidden && (
                                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950/60 dark:text-red-200">
                                        Hidden
                                      </span>
                                    )}
                                    {!review.isApproved && !review.isHidden && (
                                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                                        Pending
                                      </span>
                                    )}
                                    {review.isApproved && !review.isHidden && (
                                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                                        Public
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                              {review.content}
                            </p>

                            {isInstructor && (
                              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-3 dark:border-gray-600">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                  Controls
                                </span>
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
                  </section>
                )}

                {!isLoadingReviews && allReviews.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-300 py-10 text-center dark:border-gray-600">
                    <Star className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
                    <p className="font-medium text-gray-700 dark:text-gray-300">No reviews yet</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                      Be the first to leave a review after a lesson.
                    </p>
                  </div>
                )}
              </div>

              <aside className="w-full shrink-0 space-y-4 lg:sticky lg:top-4 lg:w-72 lg:self-start">
                <button
                  type="button"
                  onClick={() => setShowBooking(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-blue-800"
                >
                  <Calendar className="h-5 w-5" />
                  Book a lesson
                </button>
                <button
                  type="button"
                  onClick={() => setShowCalendar(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-600/80 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <Calendar className="h-5 w-5" />
                  View availability
                </button>
                <button
                  type="button"
                  onClick={handleMessage}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  <MessageSquare className="h-5 w-5" />
                  Message
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/profile/${instructor.id}`);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <UserIcon className="h-5 w-5" />
                  Full profile page
                </button>

                {publicReviews.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      Reviews ({publicReviews.length})
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Average</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {instructor.rating.toFixed(1)} ★
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Public</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {publicReviews.length}
                        </span>
                      </div>
                      {isInstructor && (
                        <>
                          <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Pending</span>
                            <span className="font-medium text-amber-600 dark:text-amber-400">
                              {pendingReviews.length}
                            </span>
                          </div>
                          <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Hidden</span>
                            <span className="font-medium text-red-600 dark:text-red-400">
                              {hiddenReviews.length}
                            </span>
                          </div>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowReviews(!showReviews)}
                        className="mt-2 w-full text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {showReviews ? 'Hide list' : 'Show all'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Languages</h4>
                  <div className="space-y-2">
                    {instructor.languages.map((language, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <Globe2 className="h-4 w-4 shrink-0 text-gray-400" />
                        {language}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Availability</h4>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0" />
                      {instructor.availability}
                    </div>
                    <div className="flex items-center gap-2">
                      <Snowflake className="h-4 w-4 shrink-0" />
                      Winter season
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </ResponsiveModalPanel>

      <UnifiedLessonModal
        isOpen={showBooking}
        onClose={() => setShowBooking(false)}
        mode="book"
        nested
        instructor={{
          id: instructor.id,
          name: instructor.name,
          price: instructor.studentLessonRate ?? instructor.price ?? 0,
          role: 'instructor',
          email: '',
          avatar: instructor.image,
          specialties: instructor.specialties || [],
          // Card often only has location string; modal also loads full user from Firestore
          homeMountain:
            instructor.location && instructor.location !== 'Mountain not specified'
              ? instructor.location
              : undefined
        }}
      />

      {showCalendar && (
        <ResponsiveModalPanel
          onClose={() => setShowCalendar(false)}
          labelledBy="instructor-profile-calendar-title"
          maxWidthClass="sm:max-w-6xl"
          nested
        >
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:inset-x-0 sm:top-0 sm:z-20 sm:border-0 sm:bg-transparent sm:px-6 sm:py-3">
            <h2 id="instructor-profile-calendar-title" className="text-xl font-bold text-gray-900 dark:text-white">
              {instructor.name}&apos;s Availability
            </h2>
            <button
              type="button"
              onClick={() => setShowCalendar(false)}
              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Close calendar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-4 pb-6 pt-2 dark:bg-gray-900 sm:px-6 sm:pb-6 sm:pt-20">
            <InstructorCalendar
              user={{
                id: instructor.id,
                name: instructor.name,
                role: 'instructor',
                email: '',
                avatar: instructor.image,
                price: instructor.studentLessonRate ?? instructor.price ?? 0,
                specialties: instructor.specialties || []
              }}
            />
          </div>
        </ResponsiveModalPanel>
      )}
    </>
  );
}