import { doc, getDoc, setDoc, updateDoc, increment, collection, query, getDocs, orderBy, limit as firestoreLimit, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Lesson, StudentReview } from '../types';

export interface InstructorStats {
  totalLessons: number;
  averageRating: number;
  totalStudents: number;
  totalReviews: number;
  lastUpdated: string;
  // New ranking metrics
  performanceScore: number;
  ranking: number;
  totalEarnings: number;
  completionRate: number;
  responseTime: number; // Average response time in hours
  repeatStudentRate: number; // Percentage of students who book again
  lessonSuccessRate: number; // Percentage of lessons with 4+ star ratings
  seasonalStats: {
    currentSeason: {
      lessons: number;
      earnings: number;
      rating: number;
    };
    previousSeason: {
      lessons: number;
      earnings: number;
      rating: number;
    };
  };
  badges: string[]; // Achievement badges
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

export interface InstructorRanking {
  instructorId: string;
  instructorName: string;
  instructorAvatar: string;
  stats: InstructorStats;
  rank: number;
  previousRank: number;
  rankChange: number;
}

export const instructorStatsService = {
  // Get instructor stats
  async getInstructorStats(instructorId: string): Promise<InstructorStats | null> {
    try {
      const statsDoc = await getDoc(doc(db, 'instructorStats', instructorId));
      if (statsDoc.exists()) {
        return statsDoc.data() as InstructorStats;
      }
      return null;
    } catch (error) {
      console.error('Error fetching instructor stats:', error);
      return null;
    }
  },

  // Initialize instructor stats
  async initializeInstructorStats(instructorId: string): Promise<void> {
    try {
      const initialStats: InstructorStats = {
        totalLessons: 0,
        averageRating: 0,
        totalStudents: 0,
        totalReviews: 0,
        lastUpdated: new Date().toISOString(),
        performanceScore: 0,
        ranking: 0,
        totalEarnings: 0,
        completionRate: 100,
        responseTime: 0,
        repeatStudentRate: 0,
        lessonSuccessRate: 0,
        seasonalStats: {
          currentSeason: {
            lessons: 0,
            earnings: 0,
            rating: 0
          },
          previousSeason: {
            lessons: 0,
            earnings: 0,
            rating: 0
          }
        },
        badges: [],
        tier: 'bronze'
      };
      
      await setDoc(doc(db, 'instructorStats', instructorId), initialStats);
    } catch (error) {
      console.error('Error initializing instructor stats:', error);
    }
  },

  // Calculate performance score based on multiple factors
  calculatePerformanceScore(stats: Partial<InstructorStats>): number {
    const {
      averageRating = 0,
      totalLessons = 0,
      completionRate = 100,
      repeatStudentRate = 0,
      lessonSuccessRate = 0,
      responseTime = 0
    } = stats;

    // Rating weight: 30%
    const ratingScore = (averageRating / 5) * 30;
    
    // Experience weight: 20% (based on total lessons)
    const experienceScore = Math.min((totalLessons / 100) * 20, 20);
    
    // Completion rate weight: 15%
    const completionScore = (completionRate / 100) * 15;
    
    // Repeat student rate weight: 15%
    const repeatScore = (repeatStudentRate / 100) * 15;
    
    // Lesson success rate weight: 10%
    const successScore = (lessonSuccessRate / 100) * 10;
    
    // Response time weight: 10% (faster is better)
    const responseScore = Math.max((24 - responseTime) / 24, 0) * 10;

    return Math.round(ratingScore + experienceScore + completionScore + repeatScore + successScore + responseScore);
  },

  // Determine tier based on performance score
  calculateTier(performanceScore: number): 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' {
    if (performanceScore >= 90) return 'diamond';
    if (performanceScore >= 80) return 'platinum';
    if (performanceScore >= 70) return 'gold';
    if (performanceScore >= 60) return 'silver';
    return 'bronze';
  },

  // Get top ranked instructors
  async getTopInstructors(limit: number = 10): Promise<InstructorRanking[]> {
    try {
      const statsQuery = query(
        collection(db, 'instructorStats'),
        orderBy('performanceScore', 'desc'),
        firestoreLimit(limit)
      );
      
      const snapshot = await getDocs(statsQuery);
      const rankings: InstructorRanking[] = [];
      
      for (let i = 0; i < snapshot.docs.length; i++) {
        const docSnapshot = snapshot.docs[i];
        const stats = docSnapshot.data() as InstructorStats;
        
        // Get instructor details
        const instructorDoc = await getDoc(doc(db, 'users', docSnapshot.id));
        const instructorData = instructorDoc.data() as any;
        
        rankings.push({
          instructorId: docSnapshot.id,
          instructorName: instructorData?.name || 'Unknown Instructor',
          instructorAvatar: instructorData?.avatar || '',
          stats,
          rank: i + 1,
          previousRank: stats.ranking || i + 1,
          rankChange: (stats.ranking || i + 1) - (i + 1)
        });
      }
      
      return rankings;
    } catch (error) {
      console.error('Error fetching top instructors:', error);
      return [];
    }
  },

  // Update instructor ranking
  async updateInstructorRanking(instructorId: string): Promise<void> {
    try {
      const allInstructors = await this.getTopInstructors(1000); // Get all instructors
      const instructorIndex = allInstructors.findIndex(instructor => instructor.instructorId === instructorId);
      
      if (instructorIndex !== -1) {
        const newRank = instructorIndex + 1;
        const statsRef = doc(db, 'instructorStats', instructorId);
        
        await updateDoc(statsRef, {
          ranking: newRank,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating instructor ranking:', error);
    }
  },

  // Update stats when a lesson is completed
  async updateStatsOnLessonCompletion(lesson: Lesson): Promise<void> {
    try {
      const instructorId = lesson.instructorId;
      const statsRef = doc(db, 'instructorStats', instructorId);
      
      // Get current stats
      const currentStats = await this.getInstructorStats(instructorId);
      
      if (!currentStats) {
        // Initialize stats if they don't exist
        await this.initializeInstructorStats(instructorId);
      }

      // Calculate new stats
      const newTotalLessons = (currentStats?.totalLessons || 0) + 1;
      const newTotalStudents = (currentStats?.totalStudents || 0) + (lesson.studentIds?.length || 0);
      const newTotalEarnings = (currentStats?.totalEarnings || 0) + (lesson.price || 0);
      
      // Calculate new average rating
      const lessonReviews = lesson.studentReviews || [];
      const newTotalReviews = (currentStats?.totalReviews || 0) + lessonReviews.length;
      
      let newAverageRating = currentStats?.averageRating || 0;
      if (lessonReviews.length > 0) {
        const totalRating = (currentStats?.averageRating || 0) * (currentStats?.totalReviews || 0);
        const lessonRating = lessonReviews.reduce((sum, review) => sum + review.rating, 0);
        newAverageRating = (totalRating + lessonRating) / newTotalReviews;
      }

      // Calculate lesson success rate
      const successfulLessons = lessonReviews.filter(review => review.rating >= 4).length;
      const newLessonSuccessRate = newTotalReviews > 0 
        ? (successfulLessons / newTotalReviews) * 100 
        : 0;

      // Calculate performance score
      const newPerformanceScore = this.calculatePerformanceScore({
        averageRating: newAverageRating,
        totalLessons: newTotalLessons,
        completionRate: currentStats?.completionRate || 100,
        repeatStudentRate: currentStats?.repeatStudentRate || 0,
        lessonSuccessRate: newLessonSuccessRate,
        responseTime: currentStats?.responseTime || 0
      });

      // Determine tier
      const newTier = this.calculateTier(newPerformanceScore);

      // Update the stats document
      await updateDoc(statsRef, {
        totalLessons: newTotalLessons,
        averageRating: Math.round(newAverageRating * 10) / 10,
        totalStudents: newTotalStudents,
        totalReviews: newTotalReviews,
        totalEarnings: newTotalEarnings,
        lessonSuccessRate: Math.round(newLessonSuccessRate * 10) / 10,
        performanceScore: newPerformanceScore,
        tier: newTier,
        lastUpdated: new Date().toISOString()
      });

      // Update ranking
      await this.updateInstructorRanking(instructorId);
    } catch (error) {
      console.error('Error updating instructor stats:', error);
    }
  },

  // Update stats when a review is added
  async updateStatsOnReviewAdded(instructorId: string, review: StudentReview): Promise<void> {
    try {
      const statsRef = doc(db, 'instructorStats', instructorId);
      
      // Get current stats
      const currentStats = await this.getInstructorStats(instructorId);
      
      if (!currentStats) {
        // Initialize stats if they don't exist
        await this.initializeInstructorStats(instructorId);
      }

      // Calculate new average rating
      const newTotalReviews = (currentStats?.totalReviews || 0) + 1;
      const totalRating = (currentStats?.averageRating || 0) * (currentStats?.totalReviews || 0);
      const newAverageRating = (totalRating + review.rating) / newTotalReviews;

      // Recalculate lesson success rate
      const successfulLessons = newTotalReviews > 0 
        ? Math.round((newTotalReviews * (currentStats?.lessonSuccessRate || 0) / 100) + (review.rating >= 4 ? 1 : 0))
        : 0;
      const newLessonSuccessRate = newTotalReviews > 0 
        ? (successfulLessons / newTotalReviews) * 100 
        : 0;

      // Recalculate performance score
      const newPerformanceScore = this.calculatePerformanceScore({
        averageRating: newAverageRating,
        totalLessons: currentStats?.totalLessons || 0,
        completionRate: currentStats?.completionRate || 100,
        repeatStudentRate: currentStats?.repeatStudentRate || 0,
        lessonSuccessRate: newLessonSuccessRate,
        responseTime: currentStats?.responseTime || 0
      });

      // Determine tier
      const newTier = this.calculateTier(newPerformanceScore);

      // Update the stats document
      await updateDoc(statsRef, {
        averageRating: Math.round(newAverageRating * 10) / 10,
        totalReviews: newTotalReviews,
        lessonSuccessRate: Math.round(newLessonSuccessRate * 10) / 10,
        performanceScore: newPerformanceScore,
        tier: newTier,
        lastUpdated: new Date().toISOString()
      });

      // Update ranking
      await this.updateInstructorRanking(instructorId);
    } catch (error) {
      console.error('Error updating instructor stats on review:', error);
    }
  },

  // Recalculate all stats for an instructor (useful for data migration)
  async recalculateInstructorStats(instructorId: string, lessons: Lesson[]): Promise<void> {
    try {
      const completedLessons = lessons.filter(lesson => lesson.status === 'completed');
      
      const totalLessons = completedLessons.length;
      const totalStudents = new Set(completedLessons.flatMap(lesson => lesson.studentIds || [])).size;
      const totalEarnings = completedLessons.reduce((sum, lesson) => sum + (lesson.price || 0), 0);
      
      const allReviews = completedLessons.flatMap(lesson => lesson.studentReviews || []);
      const totalReviews = allReviews.length;
      const averageRating = totalReviews > 0 
        ? allReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;

      const lessonSuccessRate = totalReviews > 0 
        ? (allReviews.filter(review => review.rating >= 4).length / totalReviews) * 100 
        : 0;

      const performanceScore = this.calculatePerformanceScore({
        averageRating,
        totalLessons,
        lessonSuccessRate
      });

      const tier = this.calculateTier(performanceScore);

      const stats: InstructorStats = {
        totalLessons,
        averageRating: Math.round(averageRating * 10) / 10,
        totalStudents,
        totalReviews,
        totalEarnings,
        lessonSuccessRate: Math.round(lessonSuccessRate * 10) / 10,
        performanceScore,
        tier,
        ranking: 0, // Will be updated by updateInstructorRanking
        completionRate: 100,
        responseTime: 0,
        repeatStudentRate: 0,
        seasonalStats: {
          currentSeason: {
            lessons: 0,
            earnings: 0,
            rating: 0
          },
          previousSeason: {
            lessons: 0,
            earnings: 0,
            rating: 0
          }
        },
        badges: [],
        lastUpdated: new Date().toISOString()
      };

      await setDoc(doc(db, 'instructorStats', instructorId), stats);
      await this.updateInstructorRanking(instructorId);
    } catch (error) {
      console.error('Error recalculating instructor stats:', error);
    }
  },

  // Get instructor badges based on achievements
  async calculateInstructorBadges(instructorId: string): Promise<string[]> {
    try {
      const stats = await this.getInstructorStats(instructorId);
      if (!stats) return [];

      const badges: string[] = [];

      // Lesson count badges
      if (stats.totalLessons >= 1000) badges.push('Lesson Master');
      else if (stats.totalLessons >= 500) badges.push('Experienced Guide');
      else if (stats.totalLessons >= 100) badges.push('Dedicated Instructor');

      // Rating badges
      if (stats.averageRating >= 4.8) badges.push('Excellence Award');
      else if (stats.averageRating >= 4.5) badges.push('High Performer');
      else if (stats.averageRating >= 4.0) badges.push('Quality Instructor');

      // Student count badges
      if (stats.totalStudents >= 500) badges.push('Student Favorite');
      else if (stats.totalStudents >= 200) badges.push('Popular Instructor');
      else if (stats.totalStudents >= 50) badges.push('Growing Following');

      // Earnings badges
      if (stats.totalEarnings >= 50000) badges.push('Top Earner');
      else if (stats.totalEarnings >= 25000) badges.push('High Earner');
      else if (stats.totalEarnings >= 10000) badges.push('Established');

      // Performance badges
      if (stats.performanceScore >= 90) badges.push('Elite Instructor');
      else if (stats.performanceScore >= 80) badges.push('Premium Guide');
      else if (stats.performanceScore >= 70) badges.push('Professional');

      return badges;
    } catch (error) {
      console.error('Error calculating instructor badges:', error);
      return [];
    }
  }
};
