import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  StudentProgress, 
  SkillProgress, 
  Achievement, 
  LessonFeedback 
} from '../types';

// Progress Tracking Service
export const progressService = {
  // Get student progress
  async getStudentProgress(studentId: string): Promise<StudentProgress | null> {
    try {
      const progressRef = collection(db, 'studentProgress');
      const q = query(progressRef, where('studentId', '==', studentId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as StudentProgress;
    } catch (error) {
      console.error('Error getting student progress:', error);
      throw error;
    }
  },

  // Create or update student progress
  async updateStudentProgress(progress: Partial<StudentProgress>): Promise<string> {
    try {
      const progressRef = collection(db, 'studentProgress');
      
      if (progress.id) {
        // Update existing progress
        const docRef = doc(db, 'studentProgress', progress.id);
        await updateDoc(docRef, {
          ...progress,
          lastUpdated: new Date().toISOString()
        });
        return progress.id;
      } else {
        // Create new progress
        const docRef = await addDoc(progressRef, {
          ...progress,
          lastUpdated: new Date().toISOString(),
          createdAt: serverTimestamp()
        });
        return docRef.id;
      }
    } catch (error) {
      console.error('Error updating student progress:', error);
      throw error;
    }
  },

  // Get skill progress for a student
  async getSkillProgress(studentId: string): Promise<SkillProgress[]> {
    try {
      const skillProgressRef = collection(db, 'skillProgress');
      const q = query(
        skillProgressRef, 
        where('studentId', '==', studentId),
        orderBy('progressDate', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as SkillProgress[];
    } catch (error) {
      console.error('Error getting skill progress:', error);
      throw error;
    }
  },

  // Add skill progress assessment
  async addSkillProgress(skillProgress: Omit<SkillProgress, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const skillProgressRef = collection(db, 'skillProgress');
      const docRef = await addDoc(skillProgressRef, {
        ...skillProgress,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding skill progress:', error);
      throw error;
    }
  },

  // Get student achievements
  async getStudentAchievements(studentId: string): Promise<Achievement[]> {
    try {
      const achievementsRef = collection(db, 'achievements');
      const q = query(
        achievementsRef, 
        where('studentId', '==', studentId),
        orderBy('unlockedDate', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Achievement[];
    } catch (error) {
      console.error('Error getting student achievements:', error);
      throw error;
    }
  },

  // Add achievement for student
  async addAchievement(achievement: Omit<Achievement, 'id'>): Promise<string> {
    try {
      const achievementsRef = collection(db, 'achievements');
      const docRef = await addDoc(achievementsRef, achievement);
      return docRef.id;
    } catch (error) {
      console.error('Error adding achievement:', error);
      throw error;
    }
  },

  // Calculate overall progress from lessons and feedback
  async calculateProgress(studentId: string): Promise<Partial<StudentProgress>> {
    try {
      // Get all completed lessons for the student
      const lessonsRef = collection(db, 'lessons');
      const lessonsQuery = query(
        lessonsRef,
        where('studentIds', 'array-contains', studentId),
        where('status', '==', 'completed')
      );
      const lessonsSnapshot = await getDocs(lessonsQuery);
      
      // Get all feedback for the student
      const feedbackRef = collection(db, 'lessonFeedback');
      const feedbackQuery = query(
        feedbackRef,
        where('studentId', '==', studentId)
      );
      const feedbackSnapshot = await getDocs(feedbackQuery);
      
      const completedLessons = lessonsSnapshot.docs.length;
      const feedbacks = feedbackSnapshot.docs.map(doc => doc.data() as LessonFeedback);
      
      // Calculate average rating
      const totalRating = feedbacks.reduce((sum, feedback) => 
        sum + feedback.performance.overall, 0
      );
      const averageRating = feedbacks.length > 0 ? totalRating / feedbacks.length : 0;
      
      // Determine overall level based on most recent feedback
      let overallLevel = 'first_time';
      if (feedbacks.length > 0) {
        const latestFeedback = feedbacks.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        overallLevel = latestFeedback.skillAssessment.currentLevel;
      }
      
      // Calculate skills breakdown
      const skillsBreakdown: { [key: string]: any } = {};
      const skillProgress = await this.getSkillProgress(studentId);
      
      skillProgress.forEach(progress => {
        skillsBreakdown[progress.skillName] = {
          currentLevel: progress.currentLevel,
          lastAssessed: progress.progressDate,
          improvement: progress.currentLevel - progress.previousLevel
        };
      });
      
      return {
        studentId,
        level: overallLevel, // Changed from overallLevel to level to match interface
        totalLessons: completedLessons,
        completedLessons,
        // Removed averageRating and skillsBreakdown as they don't exist in the interface
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calculating progress:', error);
      throw error;
    }
  },

  // Update progress after lesson completion
  async updateProgressAfterLesson(lessonId: string, studentId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Calculate new progress
      const newProgress = await this.calculateProgress(studentId);
      
      // Get existing progress or create new
      const existingProgress = await this.getStudentProgress(studentId);
      
      if (existingProgress) {
        const progressRef = doc(db, 'studentProgress', existingProgress.id);
        batch.update(progressRef, newProgress);
      } else {
        const progressRef = doc(collection(db, 'studentProgress'));
        batch.set(progressRef, { ...newProgress, id: progressRef.id });
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error updating progress after lesson:', error);
      throw error;
    }
  },

  // Get progress analytics for dashboard
  async getProgressAnalytics(studentId: string): Promise<{
    recentProgress: SkillProgress[];
    achievements: Achievement[];
    lessonHistory: any[];
    improvementTrend: number;
  }> {
    try {
      const [recentProgress, achievements] = await Promise.all([
        this.getSkillProgress(studentId),
        this.getStudentAchievements(studentId)
      ]);
      
      // Get recent lessons
      const lessonsRef = collection(db, 'lessons');
      const lessonsQuery = query(
        lessonsRef,
        where('studentIds', 'array-contains', studentId),
        orderBy('date', 'desc'),
        limit(10)
      );
      const lessonsSnapshot = await getDocs(lessonsQuery);
      const lessonHistory = lessonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Calculate improvement trend (last 3 months vs previous 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const recentSkills = recentProgress.filter(
        progress => new Date(progress.progressDate) >= threeMonthsAgo
      );
      
      const improvementTrend = recentSkills.length > 0 
        ? recentSkills.reduce((sum, skill) => sum + (skill.currentLevel - skill.previousLevel), 0) / recentSkills.length
        : 0;
      
      return {
        recentProgress: recentProgress.slice(0, 5), // Last 5 assessments
        achievements,
        lessonHistory,
        improvementTrend
      };
    } catch (error) {
      console.error('Error getting progress analytics:', error);
      throw error;
    }
  }
}; 