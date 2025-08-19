import React from 'react';
import { BookOpen, CheckCircle, Award, Target, Activity } from 'lucide-react';

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

interface StudentStatsProps {
  stats: StudentStats;
}

export function StudentStats({ stats }: StudentStatsProps) {
  return (
    <>
      {/* Activity Summary */}
      <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            <span className="text-green-600 font-medium">{stats.lessonsThisMonth} lessons this month</span>
          </div>
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
    </>
  );
}


