import React, { useState, useEffect } from 'react';
import { User, Lesson, StudentReview } from '../../types';
import {
  User as UserIcon,
  Edit,
  Save,
  X,
  Star,
  Calendar,
  Clock,
  Award,
  MapPin,
  Languages,
  GraduationCap,
  DollarSign,
  Phone,
  Mail,
  Globe,
  Camera,
  Trophy,
  TrendingUp,
  TrendingDown,
  Crown,
  Medal,
  Eye,
  EyeOff,
  Check,
  X as XIcon
} from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { instructorStatsService, InstructorStats } from '../../services/instructorStats';
import { AvatarUpload } from '../common/AvatarUpload';

interface InstructorProfileProps {
  instructor: User;
  onUpdate?: (updatedInstructor: User) => void;
  isEditable?: boolean;
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

// Tier colors and icons
const tierConfig = {
  bronze: { color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Medal },
  silver: { color: 'text-gray-600', bgColor: 'bg-gray-50', icon: Medal },
  gold: { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Trophy },
  platinum: { color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Crown },
  diamond: { color: 'text-purple-600', bgColor: 'bg-purple-50', icon: Crown }
};

export const InstructorProfile: React.FC<InstructorProfileProps> = ({
  instructor,
  onUpdate,
  isEditable = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<User>(instructor);
  const [isLoading, setIsLoading] = useState(false);
  const [enhancedStats, setEnhancedStats] = useState<InstructorStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [showReviews, setShowReviews] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [basicStats, setBasicStats] = useState({
    totalLessons: 0,
    averageRating: 0,
    totalStudents: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    loadInstructorStats();
    loadEnhancedStats();
    loadReviews();
  }, [instructor.id]);

  // Reset editedProfile when instructor prop changes
  useEffect(() => {
    setEditedProfile(instructor);
  }, [instructor]);

  const loadEnhancedStats = async () => {
    try {
      setIsLoadingStats(true);
      const stats = await instructorStatsService.getInstructorStats(instructor.id);
      setEnhancedStats(stats);
    } catch (error) {
      console.error('Error loading enhanced stats:', error);
      // Don't show error to user, just continue without enhanced stats
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadReviews = async () => {
    try {
      console.log('🔍 [InstructorProfile] Starting to fetch reviews for instructor:', instructor.id);
      setIsLoadingReviews(true);
      
      // Get lessons taught by this instructor (public data, no auth required)
      const lessonsQuery = query(
        collection(db, 'lessons'),
        where('instructorId', '==', instructor.id),
        where('status', '==', 'completed')
      );
      
      console.log('📋 [InstructorProfile] Executing lessons query...');
      const lessonsSnapshot = await getDocs(lessonsQuery);
      console.log('📊 [InstructorProfile] Found lessons:', lessonsSnapshot.size);
      
      const lessons = lessonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lesson[];

      console.log('📝 [InstructorProfile] Lessons data:', lessons.map(l => ({
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
      
      console.log('⭐ [InstructorProfile] Total reviews found:', allReviews.length);
             console.log('📋 [InstructorProfile] Reviews data:', allReviews.map(r => ({
         rating: r.rating,
         comment: r.comment?.substring(0, 50) + '...',
         studentIds: r.studentIds,
         isApproved: r.isApproved,
         isHidden: r.isHidden,
         rawIsApproved: r.isApproved,
         rawIsHidden: r.isHidden
       })));
      
      // Fetch student names for reviews
      const reviewsWithNames = await Promise.all(
        allReviews.map(async (review, index) => {
          let authorName = `Student ${index + 1}`;
          let avatar = `https://images.unsplash.com/photo-${1500000000000 + index}?w=100`;
          
          // Try to get the first student's name from the lesson
          if (review.studentIds && review.studentIds.length > 0) {
            try {
              console.log('👤 [InstructorProfile] Fetching student name for ID:', review.studentIds[0]);
              const studentDoc = await getDoc(doc(db, 'users', review.studentIds[0]));
              if (studentDoc.exists()) {
                const studentData = studentDoc.data() as User;
                authorName = studentData.name || authorName;
                avatar = studentData.avatar || avatar;
                console.log('✅ [InstructorProfile] Found student name:', authorName);
              } else {
                console.log('❌ [InstructorProfile] Student document does not exist');
              }
            } catch (error) {
              console.log('❌ [InstructorProfile] Could not fetch student name, using default:', error);
            }
          } else {
            console.log('⚠️ [InstructorProfile] No student IDs found for review');
          }
          
                     const processedReview = {
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
           
           console.log(`🎯 [InstructorProfile] Processing review ${index}:`, {
             rawIsApproved: review.isApproved,
             rawIsHidden: review.isHidden,
             processedIsApproved: processedReview.isApproved,
             processedIsHidden: processedReview.isHidden
           });
           
           return processedReview;
        })
      );

      console.log('🎯 [InstructorProfile] Final reviews with names:', reviewsWithNames.map(r => ({
        id: r.id,
        author: r.author,
        rating: r.rating,
        isApproved: r.isApproved,
        isHidden: r.isHidden
      })));

      // Verify that we're reading the correct data from the database
      console.log('🔍 [InstructorProfile] Verifying database data on load...');
      for (const lesson of lessons) {
        if (lesson.studentReviews && lesson.studentReviews.length > 0) {
          console.log(`📊 [InstructorProfile] Lesson ${lesson.id} reviews from database:`, 
            lesson.studentReviews.map(r => ({
              studentId: r.studentId,
              rating: r.rating,
              isApproved: r.isApproved,
              isHidden: r.isHidden
            }))
          );
        }
      }

      setReviews(reviewsWithNames);
    } catch (error) {
      console.error('❌ [InstructorProfile] Error loading reviews:', error);
      setReviews([]);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // Handle review approval/hiding
  const handleReviewAction = async (reviewId: string, action: 'approve' | 'hide') => {
    try {
      console.log('🔄 [InstructorProfile] handleReviewAction called:', { reviewId, action });
      
      const review = reviews.find(r => r.id === reviewId);
      if (!review || !review.lessonId) {
        console.log('❌ [InstructorProfile] Review not found or missing lessonId:', { reviewId, lessonId: review?.lessonId });
        return;
      }

      console.log('📋 [InstructorProfile] Found review to update:', {
        reviewId,
        lessonId: review.lessonId,
        studentId: review.studentId,
        rating: review.rating,
        currentIsApproved: review.isApproved,
        currentIsHidden: review.isHidden
      });

      // Update the review in the lesson document
      const lessonRef = doc(db, 'lessons', review.lessonId);
      const lessonDoc = await getDoc(lessonRef);
      
      if (lessonDoc.exists()) {
        const lessonData = lessonDoc.data() as Lesson;
        console.log('📊 [InstructorProfile] Current lesson data studentReviews:', lessonData.studentReviews?.map(r => ({
          studentId: r.studentId,
          rating: r.rating,
          isApproved: r.isApproved,
          isHidden: r.isHidden
        })));
        
        const updatedReviews = lessonData.studentReviews?.map(r => {
          // Match by studentId and rating to find the correct review
          if (r.studentId === review.studentId && r.rating === review.rating) {
            console.log('✅ [InstructorProfile] Matching review found, updating:', {
              studentId: r.studentId,
              rating: r.rating,
              oldIsApproved: r.isApproved,
              oldIsHidden: r.isHidden,
              newIsApproved: action === 'approve',
              newIsHidden: action === 'hide'
            });
            return {
              ...r,
              isApproved: action === 'approve',
              isHidden: action === 'hide'
            };
          }
          return r;
        });

        console.log('💾 [InstructorProfile] Updating lesson document with new reviews');
        await updateDoc(lessonRef, {
          studentReviews: updatedReviews
        });

        console.log('✅ [InstructorProfile] Database update successful');

        // Verify the update by reading the document back
        console.log('🔍 [InstructorProfile] Verifying database update...');
        const verifyDoc = await getDoc(lessonRef);
        if (verifyDoc.exists()) {
          const verifyData = verifyDoc.data() as Lesson;
          const updatedReview = verifyData.studentReviews?.find(r => 
            r.studentId === review.studentId && r.rating === review.rating
          );
          console.log('✅ [InstructorProfile] Database verification successful:', {
            studentId: updatedReview?.studentId,
            rating: updatedReview?.rating,
            isApproved: updatedReview?.isApproved,
            isHidden: updatedReview?.isHidden
          });
        } else {
          console.log('❌ [InstructorProfile] Could not verify database update - document not found');
        }

        // Update local state
        setReviews(prev => prev.map(r => 
          r.id === reviewId 
            ? { ...r, isApproved: action === 'approve', isHidden: action === 'hide' }
            : r
        ));
        
        console.log('🔄 [InstructorProfile] Local state updated');
      } else {
        console.log('❌ [InstructorProfile] Lesson document does not exist');
      }
    } catch (error) {
      console.error('❌ [InstructorProfile] Error updating review:', error);
    }
  };

  const loadInstructorStats = async () => {
    try {
      // Get lessons taught by this instructor (simplified query to avoid index issues)
      const lessonsQuery = query(
        collection(db, 'lessons'),
        where('instructorId', '==', instructor.id)
      );
      
      const lessonsSnapshot = await getDocs(lessonsQuery);
      const lessons = lessonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lesson[];

      // Filter completed lessons in memory
      const completedLessons = lessons.filter(lesson => lesson.status === 'completed');

      // Calculate stats
      const totalLessons = completedLessons.length;
      const totalStudents = new Set(completedLessons.flatMap(lesson => lesson.studentIds || [])).size;
      const totalEarnings = completedLessons.reduce((sum, lesson) => sum + (lesson.price || 0), 0);
      
      // Calculate average rating from student reviews
      const allReviews = completedLessons.flatMap(lesson => lesson.studentReviews || []);
      const averageRating = allReviews.length > 0 
        ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length 
        : 0;

      setBasicStats({
        totalLessons,
        averageRating: Math.round(averageRating * 10) / 10,
        totalStudents,
        totalEarnings
      });
    } catch (error) {
      console.error('Error loading instructor stats:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const userRef = doc(db, 'users', instructor.id);
      
      // Filter out undefined values to prevent Firebase errors
      const updateData: any = {};
      const fieldsToUpdate = [
        'name', 'bio', 'phone', 'address', 'homeMountain', 'specialties', 'certifications', 'languages', 
        'yearsOfExperience', 'price', 'hourlyRate', 'preferredLocations', 'qualifications', 'avatar'
      ];
      
      fieldsToUpdate.forEach(field => {
        if (editedProfile[field as keyof User] !== undefined) {
          updateData[field] = editedProfile[field as keyof User];
        }
      });

      await updateDoc(userRef, updateData);

      // Update the local instructor state to reflect changes immediately
      const updatedInstructor = { ...instructor, ...editedProfile };
      onUpdate?.(updatedInstructor);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(instructor);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof User, value: any) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarUpdate = async (avatarUrl: string) => {
    console.log('Avatar updated:', avatarUrl);
    setEditedProfile(prev => ({
      ...prev,
      avatar: avatarUrl
    }));
    
    // Automatically save the avatar update to the database
    try {
      const userRef = doc(db, 'users', instructor.id);
      await updateDoc(userRef, {
        avatar: avatarUrl
      });
      console.log('Avatar saved to database successfully');
      
      // Update the local instructor state
      const updatedInstructor = { ...instructor, avatar: avatarUrl };
      onUpdate?.(updatedInstructor);
    } catch (error) {
      console.error('Error saving avatar to database:', error);
    }
  };

  const handleArrayChange = (field: keyof User, value: string) => {
    const currentArray = (editedProfile[field] as string[]) || [];
    const newArray = value.split(',').map(item => item.trim()).filter(item => item);
    setEditedProfile(prev => ({
      ...prev,
      [field]: newArray
    }));
  };

  // Get tier configuration
  const tier = enhancedStats?.tier || 'bronze';
  const tierInfo = tierConfig[tier];

  // Filter reviews for display
  const publicReviews = reviews.filter(review => review.isApproved && !review.isHidden);
  const pendingReviews = reviews.filter(review => !review.isApproved && !review.isHidden);
  const hiddenReviews = reviews.filter(review => review.isHidden);

  console.log('🔍 [InstructorProfile] Review filtering results:', {
    totalReviews: reviews.length,
    publicReviews: publicReviews.length,
    pendingReviews: pendingReviews.length,
    hiddenReviews: hiddenReviews.length,
    isEditable: isEditable
  });

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {isEditable ? (
            <AvatarUpload
              currentAvatar={editedProfile.avatar}
              userId={instructor.id}
              onAvatarUpdate={handleAvatarUpdate}
              size="md"
            />
          ) : (
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                {instructor.avatar ? (
                  <img 
                    src={instructor.avatar} 
                    alt={instructor.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-10 h-10 text-white" />
                )}
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {instructor.name}
              </h1>
              {enhancedStats && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${tierInfo.bgColor} ${tierInfo.color}`}>
                  <tierInfo.icon className="w-3 h-3 inline mr-1" />
                  {tier}
                </span>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              {instructor.specialties?.join(', ') || 'Ski Instructor'}
            </p>
            {instructor.yearsOfExperience && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {instructor.yearsOfExperience} years of experience
              </p>
            )}
          </div>
        </div>
        
        {isEditable && (
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isLoading ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Performance Score and Ranking */}
      {enhancedStats && (
        <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Performance Score</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{enhancedStats.performanceScore}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">/ 100</span>
              </div>
            </div>
            <div className="text-right">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Ranking</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">#{enhancedStats.ranking}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Badges */}
      {enhancedStats?.badges && enhancedStats.badges.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Achievements</h3>
          <div className="flex flex-wrap gap-2">
            {enhancedStats.badges.map((badge, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 text-orange-800 dark:text-orange-200 rounded-full text-sm font-medium border border-orange-200 dark:border-orange-800"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Total Lessons</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {enhancedStats?.totalLessons || basicStats.totalLessons}
          </p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Avg Rating</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {(enhancedStats?.averageRating || basicStats.averageRating).toFixed(1)}
          </p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <UserIcon className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Students</span>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {enhancedStats?.totalStudents || basicStats.totalStudents}
          </p>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Earnings</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            ${(enhancedStats?.totalEarnings || basicStats.totalEarnings).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Enhanced Stats Row */}
      {enhancedStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-indigo-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Success Rate</span>
            </div>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {enhancedStats.lessonSuccessRate?.toFixed(0) || 0}%
            </p>
          </div>
          
          <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-teal-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Response Time</span>
            </div>
            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {enhancedStats.responseTime}h
            </p>
          </div>
          
          <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <UserIcon className="w-5 h-5 text-pink-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Repeat Rate</span>
            </div>
            <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
              {enhancedStats.repeatStudentRate}%
            </p>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Completion</span>
            </div>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {enhancedStats.completionRate}%
            </p>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              All Reviews
              <span className="ml-2 text-sm text-gray-500">
                ({publicReviews.length} public, {pendingReviews.length} pending, {hiddenReviews.length} hidden)
              </span>
            </h3>
            <button
              onClick={() => setShowReviews(!showReviews)}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              {showReviews ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hide Reviews
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Show Reviews ({reviews.length})
                </>
              )}
            </button>
          </div>
          
          {showReviews && (
            <div className="space-y-4">
              {reviews.map(review => (
                <div 
                  key={review.id} 
                  className={`p-4 border rounded-lg ${
                    review.isHidden 
                      ? 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20' 
                      : !review.isApproved 
                        ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20' 
                        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
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
                        <div className="font-medium text-gray-900 dark:text-white">{review.author}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{review.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-medium text-gray-900 dark:text-white">{review.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {review.isHidden && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded-full">
                            Hidden
                          </span>
                        )}
                        {!review.isApproved && !review.isHidden && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                            Pending
                          </span>
                        )}
                        {review.isApproved && !review.isHidden && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 rounded-full">
                            Public
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{review.content}</p>
                  
                  {/* Review Actions - Always show for instructors */}
                  {isEditable && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Review Controls:</span>
                      {!review.isApproved && !review.isHidden && (
                        <>
                          <button
                            onClick={() => handleReviewAction(review.id, 'approve')}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewAction(review.id, 'hide')}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                          >
                            <XIcon className="w-3 h-3" />
                            Hide
                          </button>
                        </>
                      )}
                      {review.isApproved && !review.isHidden && (
                        <button
                          onClick={() => handleReviewAction(review.id, 'hide')}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                        >
                          <XIcon className="w-3 h-3" />
                          Hide
                        </button>
                      )}
                      {review.isHidden && (
                        <button
                          onClick={() => handleReviewAction(review.id, 'approve')}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
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
      {!isLoadingReviews && reviews.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 mb-8">
          <Star className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p>No reviews yet</p>
          <p className="text-sm">Be the first to leave a review!</p>
        </div>
      )}

      {/* Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Bio */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              About Me
            </h3>
            {isEditing ? (
              <textarea
                value={editedProfile.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={4}
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300">
                {instructor.bio || 'No bio available.'}
              </p>
            )}
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Contact Information
            </h3>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editedProfile.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Address
                  </label>
                  <textarea
                    value={editedProfile.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Enter your full address..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Home Mountain
                  </label>
                  <input
                    type="text"
                    value={editedProfile.homeMountain || ''}
                    onChange={(e) => handleInputChange('homeMountain', e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Vail, Aspen, Breckenridge"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {instructor.phone && (
                  <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                    <Phone className="w-4 h-4" />
                    <span>{instructor.phone}</span>
                  </div>
                )}
                {instructor.address && (
                  <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span>{instructor.address}</span>
                  </div>
                )}
                {instructor.homeMountain && (
                  <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span><strong>Home Mountain:</strong> {instructor.homeMountain}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Specialties */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Specialties
            </h3>
            {isEditing ? (
              <input
                type="text"
                value={editedProfile.specialties?.join(', ') || ''}
                onChange={(e) => handleArrayChange('specialties', e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Beginner lessons, Advanced techniques, Freestyle"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {instructor.specialties?.map((specialty, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                  >
                    {specialty}
                  </span>
                )) || <span className="text-gray-500 dark:text-gray-400">No specialties listed</span>}
              </div>
            )}
          </div>

          {/* Certifications */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <GraduationCap className="w-5 h-5 mr-2" />
              Certifications
            </h3>
            {isEditing ? (
              <input
                type="text"
                value={editedProfile.certifications?.join(', ') || ''}
                onChange={(e) => handleArrayChange('certifications', e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., PSIA Level 2, AASI Level 1"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {instructor.certifications?.map((cert, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm"
                  >
                    {cert}
                  </span>
                )) || <span className="text-gray-500 dark:text-gray-400">No certifications listed</span>}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Languages */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Languages className="w-5 h-5 mr-2" />
              Languages
            </h3>
            {isEditing ? (
              <input
                type="text"
                value={editedProfile.languages?.join(', ') || ''}
                onChange={(e) => handleArrayChange('languages', e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., English, Spanish, French"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {instructor.languages?.map((lang, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm"
                  >
                    {lang}
                  </span>
                )) || <span className="text-gray-500 dark:text-gray-400">No languages listed</span>}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Pricing
            </h3>
            <div className="space-y-2">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                      Hourly Rate
                    </label>
                    <input
                      type="number"
                      value={editedProfile.hourlyRate || ''}
                      onChange={(e) => handleInputChange('hourlyRate', Number(e.target.value))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                      Lesson Price
                    </label>
                    <input
                      type="number"
                      value={editedProfile.price || ''}
                      onChange={(e) => handleInputChange('price', Number(e.target.value))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                </>
              ) : (
                <>
                  {instructor.hourlyRate && (
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Hourly Rate:</span> ${instructor.hourlyRate}/hour
                    </p>
                  )}
                  {instructor.price && (
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Lesson Price:</span> ${instructor.price}/lesson
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Preferred Locations */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Preferred Locations
            </h3>
            {isEditing ? (
              <input
                type="text"
                value={editedProfile.preferredLocations?.join(', ') || ''}
                onChange={(e) => handleArrayChange('preferredLocations', e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Main Lodge, North Peak, Backcountry"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {instructor.preferredLocations?.map((location, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm"
                  >
                    {location}
                  </span>
                )) || <span className="text-gray-500 dark:text-gray-400">No preferred locations listed</span>}
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Contact Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                <Mail className="w-4 h-4" />
                <span>{instructor.email}</span>
              </div>
              {instructor.phone && (
                <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <Phone className="w-4 h-4" />
                  <span>{instructor.phone}</span>
                </div>
              )}
              {instructor.address && (
                <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>{instructor.address}</span>
                </div>
              )}
              {instructor.homeMountain && (
                <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span><strong>Home Mountain:</strong> {instructor.homeMountain}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
