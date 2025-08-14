import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Award, 
  Star, 
  Clock, 
  Target, 
  ChevronRight, 
  GraduationCap,
  BarChart2,
  Users,
  Calendar,
  Trophy,
  Flame,
  ArrowLeft
} from 'lucide-react';
import { progressService } from '../services/progress';
import { achievementService } from '../services/achievements';
import { Achievement, StudentProgress } from '../types';

export function Progress() {
  const { user } = useAuth();
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProgressData();
    }
  }, [user]);

  const loadProgressData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load progress and achievements in parallel
      const [progressData, achievementsData] = await Promise.all([
        progressService.getStudentProgress(user!.id),
        achievementService.getStudentAchievements(user!.id)
      ]);

      setProgress(progressData);
      setAchievements(achievementsData || []);
    } catch (err: any) {
      console.error('Error loading progress data:', err);
      setError(err.message || 'Failed to load progress data');
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelColor = (level: string | number) => {
    const levelStr = typeof level === 'number' ? getLevelName(level) : level;
    switch (levelStr.toLowerCase()) {
      case 'beginner':
      case 'first_time':
        return 'bg-green-50 text-green-600';
      case 'intermediate':
      case 'developing_turns':
      case 'linking_turns':
        return 'bg-blue-50 text-blue-600';
      case 'advanced':
      case 'confident_turns':
        return 'bg-purple-50 text-purple-600';
      case 'expert':
      case 'consistent_blue':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  const getLevelName = (level: number): string => {
    switch (level) {
      case 0:
        return 'Beginner';
      case 1:
        return 'Developing';
      case 2:
        return 'Intermediate';
      case 3:
        return 'Advanced';
      case 4:
        return 'Expert';
      default:
        return 'Beginner';
    }
  };

  const getAchievementColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'epic':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'rare':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'common':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getSkillDisplayName = (skill: string): string => {
    const skillNames: { [key: string]: string } = {
      skiing: 'Skiing',
      snowboarding: 'Snowboarding'
    };
    return skillNames[skill] || skill;
  };

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'skiing':
        return <TrendingUp className="w-6 h-6" />;
      case 'snowboarding':
        return <Target className="w-6 h-6" />;
      default:
        return <GraduationCap className="w-6 h-6" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadProgressData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-500">No progress data found. Start taking lessons to see your progress!</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalLessons: progress.totalLessons,
    completedLessons: progress.completedLessons,
    totalPoints: progress.totalPoints,
    streakDays: progress.streakDays
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Progress</h1>
            <p className="text-gray-600">Track your skiing journey and achievements</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(progress.level)}`}>
            Level: {progress.level.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </span>
          <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm font-medium">
            {progress.totalPoints} Points
          </span>
        </div>
      </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Lessons</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLessons}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-xl">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedLessons}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-50 rounded-xl">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPoints}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 rounded-xl">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Streak Days</p>
                <p className="text-2xl font-bold text-gray-900">{stats.streakDays}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Skills Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Skills Progress</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {Object.entries(progress.skillProgress).map(([skillKey, skillData]: [string, any]) => (
                <div key={skillKey}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        {getSkillIcon(skillKey)}
                      </div>
                      <h3 className="font-medium text-gray-900">{getSkillDisplayName(skillKey)}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(skillData.level)}`}>
                        {getLevelName(skillData.level)}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedSkill(selectedSkill === skillKey ? null : skillKey)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      View Skills
                      <ChevronRight className={`w-4 h-4 transition-transform ${
                        selectedSkill === skillKey ? 'rotate-90' : ''
                      }`} />
                    </button>
                  </div>

                  <div className="relative">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${skillData.progress}%` }}
                      />
                    </div>
                    <span className="absolute right-0 top-0 -mt-7 text-sm text-gray-600">
                      {skillData.progress}%
                    </span>
                  </div>

                  {selectedSkill === skillKey && (
                    <div className="mt-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Mastered Skills:</h4>
                        <div className="flex flex-wrap gap-2">
                                                     {skillData.skills.length > 0 ? (
                             skillData.skills.map((skill: string, index: number) => (
                               <span
                                 key={index}
                                 className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
                               >
                                 {skill.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                               </span>
                             ))
                          ) : (
                            <span className="text-gray-500 text-sm">No skills mastered yet</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Last updated: {new Date(skillData.lastUpdated).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Achievements</h2>
          </div>
          <div className="p-6">
            {achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {achievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className="border rounded-xl p-6 bg-white shadow-sm"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <span className="text-2xl">{achievement.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{achievement.name}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(achievement.unlockedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    <div className="mt-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(achievement.category)}`}>
                        {achievement.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No achievements yet</h3>
                <p className="text-gray-500">
                  Complete lessons and activities to unlock achievements!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }