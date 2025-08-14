import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { achievementService } from '../services/achievements';
import { Achievement, AchievementDefinition } from '../types';

export function useAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<{
    unlocked: Achievement[];
    locked: AchievementDefinition[];
  }>({ unlocked: [], locked: [] });
  const [stats, setStats] = useState<{
    totalAchievements: number;
    totalPoints: number;
    achievementsByCategory: { [key: string]: number };
    achievementsByRarity: { [key: string]: number };
    recentAchievements: Achievement[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  // Load achievements
  const loadAchievements = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const [achievementsData, statsData] = await Promise.all([
        achievementService.getAllAchievements(user.id),
        achievementService.getAchievementStats(user.id)
      ]);

      setAchievements(achievementsData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading achievements:', err);
      setError(err.message || 'Failed to load achievements');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Check for new achievements
  const checkForNewAchievements = useCallback(async () => {
    if (!user?.id) return;

    try {
      const newAchievements = await achievementService.checkAndAwardAchievements(user.id);
      
      if (newAchievements.length > 0) {
        setNewAchievements(prev => [...prev, ...newAchievements]);
        
        // Reload achievements to get updated data
        await loadAchievements();
        
        return newAchievements;
      }
      
      return [];
    } catch (err: any) {
      console.error('Error checking achievements:', err);
      return [];
    }
  }, [user?.id, loadAchievements]);

  // Clear new achievements notification
  const clearNewAchievements = useCallback(() => {
    setNewAchievements([]);
  }, []);

  // Get achievement by ID
  const getAchievementById = useCallback((id: string) => {
    const unlocked = achievements.unlocked.find(a => a.id === id);
    const locked = achievements.locked.find(a => a.id === id);
    return unlocked || locked;
  }, [achievements]);

  // Get achievements by category
  const getAchievementsByCategory = useCallback((category: string) => {
    const unlocked = achievements.unlocked.filter(a => a.category === category);
    const locked = achievements.locked.filter(a => a.category === category);
    return { unlocked, locked };
  }, [achievements]);

  // Get achievements by rarity
  const getAchievementsByRarity = useCallback((rarity: string) => {
    const unlocked = achievements.unlocked.filter(a => {
      // This would need to be implemented based on your achievement definitions
      return true; // Placeholder
    });
    const locked = achievements.locked.filter(a => {
      // This would need to be implemented based on your achievement definitions
      return true; // Placeholder
    });
    return { unlocked, locked };
  }, [achievements]);

  // Check if achievement is unlocked
  const isAchievementUnlocked = useCallback((achievementId: string) => {
    return achievements.unlocked.some(a => a.id === achievementId);
  }, [achievements.unlocked]);

  // Get progress towards an achievement
  const getAchievementProgress = useCallback((achievementId: string) => {
    // This would need to be implemented based on your achievement criteria
    // For now, return a placeholder
    return {
      current: 0,
      required: 1,
      percentage: 0,
      isCompleted: false
    };
  }, []);

  // Load achievements on mount
  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  return {
    // State
    achievements,
    stats,
    isLoading,
    error,
    newAchievements,
    
    // Actions
    loadAchievements,
    checkForNewAchievements,
    clearNewAchievements,
    
    // Utilities
    getAchievementById,
    getAchievementsByCategory,
    getAchievementsByRarity,
    isAchievementUnlocked,
    getAchievementProgress
  };
}

// Hook for achievement notifications
export function useAchievementNotifications() {
  const [notifications, setNotifications] = useState<Achievement[]>([]);

  const addNotification = useCallback((achievement: Achievement) => {
    setNotifications(prev => [...prev, achievement]);
  }, []);

  const removeNotification = useCallback((achievementId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== achievementId));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  };
}

// Hook for achievement progress tracking
export function useAchievementProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<{
    lessonsCompleted: number;
    skillLevel: string;
    averageRating: number;
    feedbackCount: number;
    streakDays: number;
  } | null>(null);

  const updateProgress = useCallback(async () => {
    if (!user?.id) return;

    try {
      // This would integrate with your existing progress service
      // For now, return placeholder data
      setProgress({
        lessonsCompleted: 0,
        skillLevel: 'first_time',
        averageRating: 0,
        feedbackCount: 0,
        streakDays: 0
      });
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    updateProgress();
  }, [updateProgress]);

  return {
    progress,
    updateProgress
  };
}
