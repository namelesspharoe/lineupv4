import React from 'react';
import { Star, User as UserIcon, DollarSign, Award, Clock, Calendar } from 'lucide-react';
import { InstructorStats } from '../../../services/instructorStats';

interface ProfileStatsProps {
  enhancedStats: InstructorStats | null;
  basicStats: {
    totalLessons: number;
    averageRating: number;
    totalStudents: number;
    totalEarnings: number;
  };
}

export function ProfileStats({ enhancedStats, basicStats }: ProfileStatsProps) {
  return (
    <>
      {/* Basic Stats Row */}
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
    </>
  );
}


