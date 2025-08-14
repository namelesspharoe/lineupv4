import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Achievements } from '../components/gamification/Achievements';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function AchievementsPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please log in to view your achievements.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Achievements
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your progress and unlock achievements as you master the slopes.
        </p>
      </div>

      <Achievements studentId={user.id} />
    </div>
  );
}
