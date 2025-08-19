import React from 'react';
import { User, TrendingUp, Target, Zap, Trophy } from 'lucide-react';

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

interface LevelProgressProps {
  studentLevel: string;
  stats: StudentStats;
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

const getLevelInfo = (level: string) => {
  return levelConfig[level as keyof typeof levelConfig] || levelConfig.first_time;
};

const getNextLevel = (currentLevel: string) => {
  const levels = ['first_time', 'developing_turns', 'linking_turns', 'confident_turns', 'consistent_blue'];
  const currentIndex = levels.indexOf(currentLevel);
  return levels[Math.min(currentIndex + 1, levels.length - 1)];
};

export function LevelProgress({ studentLevel, stats }: LevelProgressProps) {
  const levelInfo = getLevelInfo(studentLevel);

  return (
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
        <span>Next level: {getLevelInfo(getNextLevel(studentLevel)).name}</span>
      </div>
    </div>
  );
}


