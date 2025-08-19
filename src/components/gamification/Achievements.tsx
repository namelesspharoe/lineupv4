import React, { useState, useEffect } from 'react';
import { Trophy, Search, Filter, Star, Target, Users, Flame, Award, ChevronRight, X } from 'lucide-react';
import { Achievement, AchievementDefinition } from '../../types';
import { achievementService, ACHIEVEMENT_DEFINITIONS } from '../../services/achievements';

interface AchievementsProps {
  studentId: string;
}

interface AchievementCardProps {
  achievement: Achievement | AchievementDefinition;
  isUnlocked: boolean;
  onClick?: () => void;
}

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common':
      return 'border-gray-300 bg-gray-50';
    case 'rare':
      return 'border-blue-300 bg-blue-50';
    case 'epic':
      return 'border-purple-300 bg-purple-50';
    case 'legendary':
      return 'border-yellow-300 bg-yellow-50';
    default:
      return 'border-gray-300 bg-gray-50';
  }
};

const getRarityTextColor = (rarity: string) => {
  switch (rarity) {
    case 'common':
      return 'text-gray-600';
    case 'rare':
      return 'text-blue-600';
    case 'epic':
      return 'text-purple-600';
    case 'legendary':
      return 'text-yellow-600';
    default:
      return 'text-gray-600';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'skill':
      return <Target className="w-4 h-4" />;
    case 'milestone':
      return <Trophy className="w-4 h-4" />;
    case 'social':
      return <Users className="w-4 h-4" />;
    case 'streak':
      return <Flame className="w-4 h-4" />;
    default:
      return <Award className="w-4 h-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'skill':
      return 'bg-green-100 text-green-700';
    case 'milestone':
      return 'bg-blue-100 text-blue-700';
    case 'social':
      return 'bg-purple-100 text-purple-700';
    case 'streak':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

function AchievementCard({ achievement, isUnlocked, onClick }: AchievementCardProps) {
  const definition = ACHIEVEMENT_DEFINITIONS.find(d => d.id === achievement.id);
  const rarity = definition?.rarity || 'common';
  const points = definition?.points || 0;

  return (
    <div
      className={`relative p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:scale-105 ${
        isUnlocked 
          ? getRarityColor(rarity) 
          : 'border-gray-200 bg-gray-50 opacity-60'
      }`}
      onClick={onClick}
    >
      {/* Rarity indicator */}
      <div className="absolute top-3 right-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getRarityTextColor(rarity)} bg-white/80`}>
          {rarity}
        </span>
      </div>

      {/* Achievement icon */}
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4">
        <span className="text-4xl">{achievement.icon}</span>
      </div>

      {/* Achievement info */}
      <div className="text-center">
        <h3 className={`font-semibold mb-2 ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
          {achievement.name}
        </h3>
        <p className={`text-sm mb-3 ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
          {achievement.description}
        </p>

        {/* Category badge */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(achievement.category)}`}>
            {getCategoryIcon(achievement.category)}
          </span>
          <span className="text-xs text-gray-500 capitalize">
            {achievement.category}
          </span>
        </div>

        {/* Points */}
        <div className="flex items-center justify-center gap-1">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium text-gray-700">{points} pts</span>
        </div>

        {/* Action button for certain achievements */}
        {!isUnlocked && achievement.id === 'profile_picture' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                // Navigate to profile page to add picture
                window.location.href = '/profile';
              }}
              className="w-full px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Profile Picture
            </button>
          </div>
        )}

        {/* Unlock status */}
        {isUnlocked && 'unlockedDate' in achievement && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Unlocked {new Date(achievement.unlockedDate).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Lock overlay for locked achievements */}
      {!isUnlocked && (
        <div className="absolute inset-0 bg-gray-900/20 rounded-xl flex items-center justify-center">
          <div className="bg-white rounded-full p-2">
            <div className="w-6 h-6 text-gray-400 flex items-center justify-center">
              <span className="text-lg">🔒</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Achievements({ studentId }: AchievementsProps) {
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | AchievementDefinition | null>(null);

  const categories = ['all', 'skill', 'milestone', 'social', 'streak'];
  const rarities = ['all', 'common', 'rare', 'epic', 'legendary'];

  useEffect(() => {
    loadAchievements();
  }, [studentId]);

  const loadAchievements = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [achievementsData, statsData] = await Promise.all([
        achievementService.getAllAchievements(studentId),
        achievementService.getAchievementStats(studentId)
      ]);

      setAchievements(achievementsData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading achievements:', err);
      setError(err.message || 'Failed to load achievements');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAchievements = () => {
    let filtered = [
      ...achievements.unlocked.map(a => ({ ...a, isUnlocked: true })),
      ...achievements.locked.map(a => ({ ...a, isUnlocked: false }))
    ];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }

         // Filter by rarity
     if (selectedRarity !== 'all') {
       filtered = filtered.filter(achievement => {
         const definition = ACHIEVEMENT_DEFINITIONS.find(d => d.id === achievement.id);
         return definition?.rarity === selectedRarity;
       });
     }

    // Filter by unlock status
    if (showUnlockedOnly) {
      filtered = filtered.filter(a => a.isUnlocked);
    }

    return filtered;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading achievements...</p>
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
            onClick={loadAchievements}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const filtered = filteredAchievements();

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAchievements}</p>
                <p className="text-sm text-gray-500">Achievements</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPoints}</p>
                <p className="text-sm text-gray-500">Total Points</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round((stats.totalAchievements / ACHIEVEMENT_DEFINITIONS.length) * 100)}%
                </p>
                <p className="text-sm text-gray-500">Completion</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.recentAchievements.length}
                </p>
                <p className="text-sm text-gray-500">Recent</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search achievements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category filter */}
          <div className="flex gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(selectedCategory === category ? 'all' : category)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* Rarity filter */}
          <div className="flex gap-2">
            {rarities.map(rarity => (
              <button
                key={rarity}
                onClick={() => setSelectedRarity(selectedRarity === rarity ? 'all' : rarity)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedRarity === rarity
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </button>
            ))}
          </div>

          {/* Unlocked only toggle */}
          <button
            onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showUnlockedOnly
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showUnlockedOnly ? 'Show All' : 'Unlocked Only'}
          </button>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            isUnlocked={achievement.isUnlocked}
            onClick={() => setSelectedAchievement(achievement)}
          />
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No achievements found</h3>
          <p className="text-gray-500">
            Try adjusting your filters or complete more activities to unlock achievements.
          </p>
        </div>
      )}

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedAchievement(null)} />
          
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
              <button
                onClick={() => setSelectedAchievement(null)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4">
                    <span className="text-6xl">{selectedAchievement.icon}</span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedAchievement.name}
                  </h2>
                  
                  <p className="text-gray-600 mb-4">
                    {selectedAchievement.description}
                  </p>

                  <div className="flex items-center justify-center gap-4 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedAchievement.category)}`}>
                      {selectedAchievement.category}
                    </span>
                    
                    {ACHIEVEMENT_DEFINITIONS.find(d => d.id === selectedAchievement.id) && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRarityTextColor(ACHIEVEMENT_DEFINITIONS.find(d => d.id === selectedAchievement.id)?.rarity || 'common')} bg-gray-100`}>
                        {ACHIEVEMENT_DEFINITIONS.find(d => d.id === selectedAchievement.id)?.rarity}
                      </span>
                    )}
                  </div>

                  {ACHIEVEMENT_DEFINITIONS.find(d => d.id === selectedAchievement.id) && (
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="font-medium text-gray-900">
                        {ACHIEVEMENT_DEFINITIONS.find(d => d.id === selectedAchievement.id)?.points} points
                      </span>
                    </div>
                  )}

                  {'unlockedDate' in selectedAchievement && selectedAchievement.unlockedDate && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 font-medium">Achievement Unlocked!</p>
                      <p className="text-green-600 text-sm">
                        {new Date(selectedAchievement.unlockedDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
