import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  TrendingDown,
  Star,
  Users,
  Target,
  Award,
  Calendar
} from 'lucide-react';
import { instructorStatsService, InstructorRanking } from '../../services/instructorStats';

interface InstructorRankingsProps {
  limit?: number;
  showRankChange?: boolean;
}

export function InstructorRankings({ limit = 10, showRankChange = true }: InstructorRankingsProps) {
  const [rankings, setRankings] = useState<InstructorRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const topInstructors = await instructorStatsService.getTopInstructors(limit);
        setRankings(topInstructors);
      } catch (err) {
        console.error('Error fetching instructor rankings:', err);
        setError('Failed to load instructor rankings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, [limit]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 text-gray-400 font-bold">{rank}</span>;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'diamond': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'platinum': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'gold': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'silver': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'bronze': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Top Instructors</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Updated daily</span>
        </div>
      </div>

      <div className="space-y-3">
        {rankings.map((instructor, index) => (
          <div
            key={instructor.instructorId}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="flex items-center justify-center w-12 h-12">
                {getRankIcon(instructor.rank)}
              </div>

              {/* Instructor Info */}
              <div className="flex-1 flex items-center gap-4">
                <img
                  src={instructor.instructorAvatar}
                  alt={instructor.instructorName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{instructor.instructorName}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTierColor(instructor.stats.tier)}`}>
                      {instructor.stats.tier}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span>{instructor.stats.averageRating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{instructor.stats.totalStudents} students</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      <span>{instructor.stats.totalLessons} lessons</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Score */}
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{instructor.stats.performanceScore}</div>
                <div className="text-sm text-gray-600">Performance</div>
              </div>

              {/* Rank Change */}
              {showRankChange && instructor.rankChange !== 0 && (
                <div className="flex items-center gap-1">
                  {instructor.rankChange > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${instructor.rankChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(instructor.rankChange)}
                  </span>
                </div>
              )}
            </div>

            {/* Badges */}
            {instructor.stats.badges && instructor.stats.badges.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {instructor.stats.badges.slice(0, 3).map((badge, badgeIndex) => (
                    <span
                      key={badgeIndex}
                      className="px-2 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 rounded-full text-xs font-medium border border-orange-200"
                    >
                      {badge}
                    </span>
                  ))}
                  {instructor.stats.badges.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      +{instructor.stats.badges.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {rankings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No instructor rankings available</p>
          <p className="text-sm">Rankings are updated based on performance metrics</p>
        </div>
      )}
    </div>
  );
}
