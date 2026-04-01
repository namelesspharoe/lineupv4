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
  LessonFeedback,
  Lesson,
  StudentSkillLevel,
  AchievementDefinition,
  KidProgressStats
} from '../types';
import { parseStudentSkillLevel, studentSkillLevelUserFields } from '../utils/studentSkillLevel';
import { isGeneratedDisciplineAvatar } from '../utils/disciplineAvatar';

export type { AchievementDefinition } from '../types';

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'welcome_to_slopes',
    name: 'Welcome to SlopesMaster!',
    description: 'Created your account and joined the community',
    icon: '🎿',
    category: 'milestone',
    criteria: { type: 'account_created', value: 1, condition: 'eq' },
    rarity: 'common',
    points: 10
  },
  {
    id: 'profile_picture',
    name: 'Picture Perfect',
    description: 'Added a profile picture to personalize your account',
    icon: '📸',
    category: 'social',
    criteria: { type: 'profile_picture_added', value: 1, condition: 'eq' },
    rarity: 'common',
    points: 15
  },
  {
    id: 'first_lesson',
    name: 'First Steps',
    description: 'Completed your first lesson',
    icon: '🎯',
    category: 'milestone',
    criteria: { type: 'lessons_completed', value: 1, condition: 'eq' },
    rarity: 'common',
    points: 25
  },
  {
    id: 'dual_sport',
    name: 'Dual Sport',
    description: 'Completed at least one ski lesson and one snowboard lesson',
    icon: '⛷️🏂',
    category: 'milestone',
    criteria: { type: 'dual_sport', value: 1, condition: 'eq' },
    rarity: 'rare',
    points: 80
  },
  {
    id: 'five_lessons',
    name: 'Getting the Hang of It',
    description: 'Completed 5 lessons',
    icon: '⛷️',
    category: 'milestone',
    criteria: { type: 'lessons_completed', value: 5, condition: 'eq' },
    rarity: 'common',
    points: 50
  },
  {
    id: 'ten_lessons',
    name: 'Dedicated Learner',
    description: 'Completed 10 lessons',
    icon: '🏂',
    category: 'milestone',
    criteria: { type: 'lessons_completed', value: 10, condition: 'eq' },
    rarity: 'rare',
    points: 100
  },
  {
    id: 'twenty_five_lessons',
    name: 'Seasoned Skier',
    description: 'Completed 25 lessons',
    icon: '🏔️',
    category: 'milestone',
    criteria: { type: 'lessons_completed', value: 25, condition: 'eq' },
    rarity: 'epic',
    points: 250
  },
  {
    id: 'fifty_lessons',
    name: 'Mountain Master',
    description: 'Completed 50 lessons',
    icon: '👑',
    category: 'milestone',
    criteria: { type: 'lessons_completed', value: 50, condition: 'eq' },
    rarity: 'legendary',
    points: 500
  },
  {
    id: 'developing_turns',
    name: 'Turn Developer',
    description: 'Reached developing turns level',
    icon: '🔄',
    category: 'skill',
    criteria: { type: 'skill_level', value: 1, condition: 'eq' },
    rarity: 'common',
    points: 30
  },
  {
    id: 'linking_turns',
    name: 'Turn Linker',
    description: 'Reached linking turns level',
    icon: '🔗',
    category: 'skill',
    criteria: { type: 'skill_level', value: 2, condition: 'eq' },
    rarity: 'rare',
    points: 75
  },
  {
    id: 'confident_turns',
    name: 'Confident Carver',
    description: 'Reached confident turns level',
    icon: '💪',
    category: 'skill',
    criteria: { type: 'skill_level', value: 3, condition: 'eq' },
    rarity: 'epic',
    points: 150
  },
  {
    id: 'consistent_blue',
    name: 'Blue Run Champion',
    description: 'Reached consistent blue runs level',
    icon: '🏆',
    category: 'skill',
    criteria: { type: 'skill_level', value: 4, condition: 'eq' },
    rarity: 'legendary',
    points: 300
  },
  {
    id: 'five_star_rating',
    name: 'Perfect Performance',
    description: 'Achieved a 5-star rating on a lesson',
    icon: '⭐',
    category: 'skill',
    criteria: { type: 'rating_achieved', value: 5, condition: 'eq' },
    rarity: 'rare',
    points: 100
  },
  {
    id: 'high_achiever',
    name: 'High Achiever',
    description: 'Maintained an average rating of 4.5+ across 5 lessons',
    icon: '🌟',
    category: 'skill',
    criteria: { type: 'rating_achieved', value: 4.5, condition: 'gte' },
    rarity: 'epic',
    points: 200
  },
  {
    id: 'first_feedback',
    name: 'First Feedback',
    description: 'Received your first instructor feedback',
    icon: '📝',
    category: 'social',
    criteria: { type: 'feedback_count', value: 1, condition: 'eq' },
    rarity: 'common',
    points: 20
  },
  {
    id: 'feedback_collector',
    name: 'Feedback Collector',
    description: 'Received feedback on 10 lessons',
    icon: '📚',
    category: 'social',
    criteria: { type: 'feedback_count', value: 10, condition: 'eq' },
    rarity: 'rare',
    points: 75
  },
  {
    id: 'three_day_streak',
    name: 'Weekend Warrior',
    description: 'Completed lessons on 3 consecutive days',
    icon: '🔥',
    category: 'streak',
    criteria: { type: 'streak_days', value: 3, condition: 'eq' },
    rarity: 'common',
    points: 50
  },
  {
    id: 'seven_day_streak',
    name: 'Week Warrior',
    description: 'Completed lessons on 7 consecutive days',
    icon: '🔥🔥',
    category: 'streak',
    criteria: { type: 'streak_days', value: 7, condition: 'eq' },
    rarity: 'rare',
    points: 150
  }
];

/** Kid-scoped badges (stored in `achievements` with `kidProfileId` set). */
export const KID_ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'kid_first_lesson',
    name: 'First Bunny Hill',
    description: 'Completed a first lesson on the snow',
    icon: '⛷️',
    category: 'milestone',
    criteria: { type: 'kid_first_lesson', value: 1, condition: 'eq' },
    rarity: 'common',
    points: 20
  },
  {
    id: 'kid_3_lessons',
    name: 'Snow Explorer',
    description: 'Completed 3 lessons',
    icon: '🌨️',
    category: 'milestone',
    criteria: { type: 'kid_lessons_completed', value: 3, condition: 'gte' },
    rarity: 'common',
    points: 40
  },
  {
    id: 'kid_5_lessons',
    name: 'Powder Pup',
    description: 'Completed 5 lessons',
    icon: '🐾',
    category: 'milestone',
    criteria: { type: 'kid_lessons_completed', value: 5, condition: 'gte' },
    rarity: 'common',
    points: 60
  },
  {
    id: 'kid_10_lessons',
    name: 'Mountain Cub',
    description: 'Completed 10 lessons',
    icon: '🐻',
    category: 'milestone',
    criteria: { type: 'kid_lessons_completed', value: 10, condition: 'gte' },
    rarity: 'rare',
    points: 100
  },
  {
    id: 'kid_level_up',
    name: 'Growing Strong',
    description: 'Moved beyond first-time on the mountain',
    icon: '⬆️',
    category: 'skill',
    criteria: { type: 'kid_level_up', value: 1, condition: 'eq' },
    rarity: 'rare',
    points: 75
  },
  {
    id: 'kid_linking_turns',
    name: 'Turn Star',
    description: 'Reached linking turns or higher',
    icon: '⭐',
    category: 'skill',
    criteria: { type: 'kid_min_skill_level', value: 2, condition: 'gte' },
    rarity: 'rare',
    points: 90
  },
  {
    id: 'kid_confident',
    name: 'Confidence Boost',
    description: 'Reached confident turns or higher',
    icon: '💪',
    category: 'skill',
    criteria: { type: 'kid_min_skill_level', value: 3, condition: 'gte' },
    rarity: 'epic',
    points: 150
  },
  {
    id: 'kid_dual_sport',
    name: 'All-Mountain Kid',
    description: 'Took both ski and snowboard lessons',
    icon: '🏔️',
    category: 'milestone',
    criteria: { type: 'kid_dual_sport', value: 1, condition: 'eq' },
    rarity: 'epic',
    points: 120
  }
];

const LEVEL_INDEX: Record<string, number> = {
  first_time: 0,
  developing_turns: 1,
  linking_turns: 2,
  confident_turns: 3,
  consistent_blue: 4
};

function evaluateKidCriteria(
  definition: AchievementDefinition,
  kid: KidProgressStats
): { criteriaValue: number; shouldAward: boolean } {
  const { type, value, condition } = definition.criteria;
  let criteriaValue = 0;

  switch (type) {
    case 'kid_first_lesson':
      criteriaValue = kid.lessonsCompleted === 1 ? 1 : 0;
      break;
    case 'kid_lessons_completed':
      criteriaValue = kid.lessonsCompleted;
      break;
    case 'kid_level_up': {
      const idx = LEVEL_INDEX[kid.level] ?? 0;
      criteriaValue = idx > 0 ? 1 : 0;
      break;
    }
    case 'kid_min_skill_level': {
      const idx = LEVEL_INDEX[kid.level] ?? 0;
      criteriaValue = idx;
      break;
    }
    case 'kid_dual_sport': {
      const ski = kid.skiLessonsCompleted ?? 0;
      const sb = kid.snowboardLessonsCompleted ?? 0;
      criteriaValue = ski >= 1 && sb >= 1 ? 1 : 0;
      break;
    }
    default:
      return { criteriaValue: 0, shouldAward: false };
  }

  let shouldAward = false;
  switch (condition) {
    case 'eq':
      shouldAward = criteriaValue === value;
      break;
    case 'gte':
      shouldAward = criteriaValue >= value;
      break;
    case 'lte':
      shouldAward = criteriaValue <= value;
      break;
    default:
      shouldAward = criteriaValue >= value;
  }
  return { criteriaValue, shouldAward };
}

export const achievementService = {
  async getStudentAchievements(studentId: string): Promise<Achievement[]> {
    try {
      const achievementsRef = collection(db, 'achievements');
      const q = query(achievementsRef, where('studentId', '==', studentId));
      const snapshot = await getDocs(q);

      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Achievement[];

      return list
        .filter(a => !a.kidProfileId)
        .sort((a, b) => new Date(b.unlockedDate).getTime() - new Date(a.unlockedDate).getTime());
    } catch (error) {
      console.error('Error getting student achievements:', error);
      throw error;
    }
  },

  async getKidAchievements(parentId: string, kidProfileId: string): Promise<Achievement[]> {
    try {
      const achievementsRef = collection(db, 'achievements');
      const q = query(achievementsRef, where('studentId', '==', parentId));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Achievement))
        .filter(a => a.kidProfileId === kidProfileId)
        .sort((a, b) => new Date(b.unlockedDate).getTime() - new Date(a.unlockedDate).getTime());
    } catch (error) {
      console.error('Error getting kid achievements:', error);
      throw error;
    }
  },

  async getKidAchievementsGrouped(parentId: string): Promise<Record<string, Achievement[]>> {
    try {
      const achievementsRef = collection(db, 'achievements');
      const q = query(achievementsRef, where('studentId', '==', parentId));
      const snapshot = await getDocs(q);
      const grouped: Record<string, Achievement[]> = {};
      for (const d of snapshot.docs) {
        const a = { id: d.id, ...d.data() } as Achievement;
        if (!a.kidProfileId) continue;
        if (!grouped[a.kidProfileId]) grouped[a.kidProfileId] = [];
        grouped[a.kidProfileId].push(a);
      }
      for (const k of Object.keys(grouped)) {
        grouped[k].sort(
          (a, b) => new Date(b.unlockedDate).getTime() - new Date(a.unlockedDate).getTime()
        );
      }
      return grouped;
    } catch (error) {
      console.error('Error grouping kid achievements:', error);
      throw error;
    }
  },

  async checkAndAwardKidAchievements(
    parentId: string,
    kidProfileId: string
  ): Promise<Achievement[]> {
    try {
      const progressRef = collection(db, 'studentProgress');
      const progressQuery = query(progressRef, where('studentId', '==', parentId));
      const progressSnapshot = await getDocs(progressQuery);

      const kidStats =
        progressSnapshot.empty
          ? null
          : ((progressSnapshot.docs[0].data() as StudentProgress).kids?.[kidProfileId] ?? null);

      if (!kidStats) {
        return [];
      }

      const existing = await this.getKidAchievements(parentId, kidProfileId);
      const existingNames = new Set(existing.map(a => a.name));

      const batch = writeBatch(db);
      const newAchievements: Achievement[] = [];

      for (const definition of KID_ACHIEVEMENT_DEFINITIONS) {
        if (existingNames.has(definition.name)) continue;

        const { shouldAward } = evaluateKidCriteria(definition, kidStats);
        if (!shouldAward) continue;

        const achievement: Omit<Achievement, 'id'> = {
          studentId: parentId,
          kidProfileId,
          name: definition.name,
          description: definition.description,
          icon: definition.icon,
          unlockedDate: new Date().toISOString(),
          category: definition.category
        };

        const achievementRef = doc(collection(db, 'achievements'));
        batch.set(achievementRef, achievement);

        newAchievements.push({
          id: achievementRef.id,
          ...achievement
        });
      }

      if (newAchievements.length > 0) {
        await batch.commit();
      }

      return newAchievements;
    } catch (error) {
      console.error('Error checking kid achievements:', error);
      throw error;
    }
  },

  async addAchievement(achievement: Omit<Achievement, 'id'>): Promise<string> {
    try {
      const achievementsRef = collection(db, 'achievements');
      const docRef = await addDoc(achievementsRef, {
        ...achievement,
        unlockedDate: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding achievement:', error);
      throw error;
    }
  },

  async checkAndAwardAchievements(studentId: string): Promise<Achievement[]> {
    try {
      const batch = writeBatch(db);
      const newAchievements: Achievement[] = [];

      const progressRef = collection(db, 'studentProgress');
      const progressQuery = query(progressRef, where('studentId', '==', studentId));
      const progressSnapshot = await getDocs(progressQuery);

      let progress: StudentProgress | null = null;
      if (!progressSnapshot.empty) {
        progress = progressSnapshot.docs[0].data() as StudentProgress;
      }

      const lessonsRef = collection(db, 'lessons');
      const lessonsQuery = query(
        lessonsRef,
        where('studentIds', 'array-contains', studentId),
        where('status', '==', 'completed')
      );
      const lessonsSnapshot = await getDocs(lessonsQuery);
      const completedLessons = lessonsSnapshot.docs.map(doc => doc.data() as Lesson);

      const feedbackRef = collection(db, 'lessonFeedback');
      const feedbackQuery = query(feedbackRef, where('studentId', '==', studentId));
      const feedbackSnapshot = await getDocs(feedbackQuery);
      const feedbacks = feedbackSnapshot.docs.map(doc => doc.data() as LessonFeedback);

      const existingAchievements = await this.getStudentAchievements(studentId);
      const existingAchievementNames = new Set(existingAchievements.map(a => a.name));

      for (const definition of ACHIEVEMENT_DEFINITIONS) {
        if (existingAchievementNames.has(definition.name)) {
          continue;
        }

        let shouldAward = false;
        let criteriaValue = 0;

        switch (definition.criteria.type) {
          case 'account_created':
            criteriaValue = 1;
            break;
          case 'profile_picture_added': {
            const userRef = doc(db, 'users', studentId);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
              const avatar = userData.avatar as string | undefined;
              const hasUploadedPhoto =
                !!avatar &&
                avatar !== defaultAvatar &&
                !isGeneratedDisciplineAvatar(avatar);
              criteriaValue = hasUploadedPhoto ? 1 : 0;
            }
            break;
          }
          case 'lessons_completed':
            criteriaValue = completedLessons.length;
            break;
          case 'dual_sport': {
            const hasSkiLesson = completedLessons.some((l) => l.sport !== 'snowboarding');
            const hasSnowboardLesson = completedLessons.some((l) => l.sport === 'snowboarding');
            criteriaValue = hasSkiLesson && hasSnowboardLesson ? 1 : 0;
            break;
          }
          case 'skill_level':
            if (progress) {
              const levelMap = {
                first_time: 0,
                developing_turns: 1,
                linking_turns: 2,
                confident_turns: 3,
                consistent_blue: 4
              };
              criteriaValue = levelMap[progress.level as keyof typeof levelMap] || 0;
            }
            break;
          case 'rating_achieved':
            if (feedbacks.length > 0) {
              const maxRating = Math.max(...feedbacks.map(f => f.performance.overall));
              criteriaValue = maxRating;
            }
            break;
          case 'feedback_count':
            criteriaValue = feedbacks.length;
            break;
          case 'streak_days':
            criteriaValue = this.calculateStreakDays(completedLessons);
            break;
        }

        switch (definition.criteria.condition) {
          case 'eq':
            shouldAward = criteriaValue === definition.criteria.value;
            break;
          case 'gte':
            shouldAward = criteriaValue >= definition.criteria.value;
            break;
          case 'lte':
            shouldAward = criteriaValue <= definition.criteria.value;
            break;
          default:
            shouldAward = criteriaValue >= definition.criteria.value;
        }

        if (shouldAward) {
          const achievement: Omit<Achievement, 'id'> = {
            studentId,
            name: definition.name,
            description: definition.description,
            icon: definition.icon,
            unlockedDate: new Date().toISOString(),
            category: definition.category
          };

          const achievementRef = doc(collection(db, 'achievements'));
          batch.set(achievementRef, achievement);

          newAchievements.push({
            id: achievementRef.id,
            ...achievement
          });
        }
      }

      if (newAchievements.length > 0) {
        await batch.commit();
      }

      return newAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      throw error;
    }
  },

  calculateStreakDays(lessons: Lesson[]): number {
    if (lessons.length === 0) return 0;

    const sortedLessons = lessons
      .map(lesson => new Date(lesson.date))
      .sort((a, b) => b.getTime() - a.getTime());

    let currentStreak = 1;
    let maxStreak = 1;

    for (let i = 1; i < sortedLessons.length; i++) {
      const currentDate = sortedLessons[i];
      const previousDate = sortedLessons[i - 1];

      const dayDiff = Math.floor(
        (previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return maxStreak;
  },

  async getAchievementStats(studentId: string): Promise<{
    totalAchievements: number;
    totalPoints: number;
    achievementsByCategory: { [key: string]: number };
    achievementsByRarity: { [key: string]: number };
    recentAchievements: Achievement[];
  }> {
    try {
      const achievements = await this.getStudentAchievements(studentId);

      const totalPoints = achievements.reduce((sum, achievement) => {
        const definition = ACHIEVEMENT_DEFINITIONS.find(d => d.name === achievement.name);
        return sum + (definition?.points || 0);
      }, 0);

      const achievementsByCategory = achievements.reduce((acc, achievement) => {
        acc[achievement.category] = (acc[achievement.category] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      const achievementsByRarity = achievements.reduce((acc, achievement) => {
        const definition = ACHIEVEMENT_DEFINITIONS.find(d => d.name === achievement.name);
        const rarity = definition?.rarity || 'common';
        acc[rarity] = (acc[rarity] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      const recentAchievements = achievements
        .sort((a, b) => new Date(b.unlockedDate).getTime() - new Date(a.unlockedDate).getTime())
        .slice(0, 5);

      return {
        totalAchievements: achievements.length,
        totalPoints,
        achievementsByCategory,
        achievementsByRarity,
        recentAchievements
      };
    } catch (error) {
      console.error('Error getting achievement stats:', error);
      throw error;
    }
  },

  async getAllAchievements(studentId: string): Promise<{
    unlocked: Achievement[];
    locked: AchievementDefinition[];
  }> {
    try {
      const unlockedAchievements = await this.getStudentAchievements(studentId);
      const unlockedNames = new Set(unlockedAchievements.map(a => a.name));

      const lockedAchievements = ACHIEVEMENT_DEFINITIONS.filter(
        definition => !unlockedNames.has(definition.name)
      );

      return {
        unlocked: unlockedAchievements,
        locked: lockedAchievements
      };
    } catch (error) {
      console.error('Error getting all achievements:', error);
      throw error;
    }
  }
};

// --- Progress tracking (Firestore) ---

export const progressService = {
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

  async updateStudentProgress(progress: Partial<StudentProgress>): Promise<string> {
    try {
      const progressRef = collection(db, 'studentProgress');

      if (progress.id) {
        const docRef = doc(db, 'studentProgress', progress.id);
        await updateDoc(docRef, {
          ...progress,
          lastUpdated: new Date().toISOString()
        });
        return progress.id;
      } else {
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

  async calculateProgress(studentId: string): Promise<Partial<StudentProgress>> {
    try {
      const lessonsRef = collection(db, 'lessons');
      const lessonsQuery = query(
        lessonsRef,
        where('studentIds', 'array-contains', studentId),
        where('status', '==', 'completed')
      );
      const lessonsSnapshot = await getDocs(lessonsQuery);

      const feedbackRef = collection(db, 'lessonFeedback');
      const feedbackQuery = query(feedbackRef, where('studentId', '==', studentId));
      const feedbackSnapshot = await getDocs(feedbackQuery);

      const completedLessons = lessonsSnapshot.docs.length;
      const feedbacks = feedbackSnapshot.docs.map(doc => doc.data() as LessonFeedback);

      let overallLevel: StudentSkillLevel = 'first_time';
      if (feedbacks.length > 0) {
        const latestFeedback = feedbacks.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        overallLevel = parseStudentSkillLevel(latestFeedback.skillAssessment.currentLevel);
      }

      return {
        studentId,
        level: overallLevel,
        totalLessons: completedLessons,
        completedLessons,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calculating progress:', error);
      throw error;
    }
  },

  async updateProgressAfterLesson(_lessonId: string, studentId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      const newProgress = await this.calculateProgress(studentId);

      const existingProgress = await this.getStudentProgress(studentId);

      if (existingProgress) {
        const progressRef = doc(db, 'studentProgress', existingProgress.id);
        batch.update(progressRef, newProgress);
      } else {
        const progressRef = doc(collection(db, 'studentProgress'));
        batch.set(progressRef, { ...newProgress, id: progressRef.id });
      }

      await batch.commit();

      if (newProgress.level) {
        await updateDoc(
          doc(db, 'users', studentId),
          studentSkillLevelUserFields(String(newProgress.level))
        );
      }
    } catch (error) {
      console.error('Error updating progress after lesson:', error);
      throw error;
    }
  },

  async getProgressAnalytics(studentId: string): Promise<{
    recentProgress: SkillProgress[];
    achievements: Achievement[];
    lessonHistory: any[];
    improvementTrend: number;
  }> {
    try {
      const [recentProgress, achievements] = await Promise.all([
        this.getSkillProgress(studentId),
        achievementService.getStudentAchievements(studentId)
      ]);

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

      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const recentSkills = recentProgress.filter(
        p => new Date(p.progressDate) >= threeMonthsAgo
      );

      const improvementTrend =
        recentSkills.length > 0
          ? recentSkills.reduce((sum, skill) => sum + (skill.currentLevel - skill.previousLevel), 0) /
            recentSkills.length
          : 0;

      return {
        recentProgress: recentProgress.slice(0, 5),
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
