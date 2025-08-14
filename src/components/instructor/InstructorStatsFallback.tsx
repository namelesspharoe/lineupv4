import React from 'react';
import { Star, Users, Target, DollarSign, Clock } from 'lucide-react';

interface InstructorStatsFallbackProps {
  instructor: {
    yearsOfExperience?: number;
    name: string;
  };
}

export function InstructorStatsFallback({ instructor }: InstructorStatsFallbackProps) {
  // Calculate default stats based on experience
  const yearsOfExperience = instructor.yearsOfExperience || 1;
  const totalLessons = Math.floor(yearsOfExperience * 50);
  const totalStudents = Math.floor(yearsOfExperience * 30);
  const totalReviews = Math.floor(yearsOfExperience * 20);
  const averageRating = 4.5;
  const totalEarnings = totalLessons * 100; // Assume $100 per lesson

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <Star className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Stats Preview
          </span>
        </div>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Enhanced performance metrics will be available once {instructor.name} completes their first lesson.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
          <div className="flex items-center justify-center mb-2">
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {totalLessons}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Estimated Lessons</div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
          <div className="flex items-center justify-center mb-2">
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {averageRating.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Expected Rating</div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
          <div className="flex items-center justify-center mb-2">
            <Users className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {totalStudents}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Students</div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
          <div className="flex items-center justify-center mb-2">
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            ${totalEarnings.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Earnings</div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Based on {yearsOfExperience} year{yearsOfExperience !== 1 ? 's' : ''} of experience
        </p>
      </div>
    </div>
  );
}
