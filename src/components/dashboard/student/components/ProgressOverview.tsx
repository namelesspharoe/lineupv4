import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, GraduationCap, Plus, Search, MessageSquare } from 'lucide-react';
import { User } from '../../../../types';

interface ProgressOverviewProps {
  user: User;
  progress: number;
  pastLessons: any[];
  upcomingLessons: any[];
}

// Helper functions
const getLevelDescription = (level: string) => {
  switch (level) {
    case 'first_time':
      return 'Level 1: First Time on Snow';
    case 'developing_turns':
      return 'Level 2: Developing Basic Turns';
    case 'linking_turns':
      return 'Level 3: Linking Turns';
    case 'confident_turns':
      return 'Level 4: Confident Turn Control';
    case 'consistent_blue':
      return 'Level 5: Consistent Blue Runs';
    default:
      return level;
  }
};

const getNextLevel = (currentLevel: string) => {
  const levels = ['first_time', 'developing_turns', 'linking_turns', 'confident_turns', 'consistent_blue'];
  const currentIndex = levels.indexOf(currentLevel);
  return levels[Math.min(currentIndex + 1, levels.length - 1)];
};

export function ProgressOverview({ user, progress, pastLessons, upcomingLessons }: ProgressOverviewProps) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Progress</h2>
          <Link
            to="/progress"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View Details
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {getLevelDescription(user.level || 'first_time')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Next: {getLevelDescription(getNextLevel(user.level || 'first_time'))}
                </p>
              </div>
            </div>
          </div>

          <div className="col-span-2">
                          <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300">Overall Progress</span>
                    <span className="text-gray-600 dark:text-gray-400">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Completed Lessons:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {pastLessons.filter(l => l.status === 'completed').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Upcoming Lessons:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {upcomingLessons.length}
                    </span>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link
                    to="/book-lesson"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Book Lesson
                  </Link>
                  <Link
                    to="/find-instructor"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full text-xs font-medium hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors"
                  >
                    <Search className="w-3 h-3" />
                    Find Instructor
                  </Link>
                  <Link
                    to="/messages"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Messages
                  </Link>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
