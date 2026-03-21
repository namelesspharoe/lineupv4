import { useState, useEffect } from 'react';
import { Trophy, Search, Star, Target, Users, Flame, Award, X } from 'lucide-react';
import { Achievement, AchievementDefinition } from '../../types';
import { achievementService, ACHIEVEMENT_DEFINITIONS } from '../../services/achievements';
import { ResponsiveModalPanel } from '../common/ResponsiveModalPanel';

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
      return 'border-slate-200/90 bg-slate-50/90 dark:border-slate-600 dark:bg-slate-800/60';
    case 'rare':
      return 'border-sky-300/80 bg-sky-50/90 dark:border-sky-700 dark:bg-sky-950/40';
    case 'epic':
      return 'border-violet-300/80 bg-violet-50/90 dark:border-violet-700 dark:bg-violet-950/40';
    case 'legendary':
      return 'border-amber-300/90 bg-amber-50/90 dark:border-amber-600 dark:bg-amber-950/30';
    default:
      return 'border-slate-200/90 bg-slate-50/90 dark:border-slate-600 dark:bg-slate-800/60';
  }
};

const getRarityTextColor = (rarity: string) => {
  switch (rarity) {
    case 'common':
      return 'text-slate-600 dark:text-slate-400';
    case 'rare':
      return 'text-sky-700 dark:text-sky-400';
    case 'epic':
      return 'text-violet-700 dark:text-violet-400';
    case 'legendary':
      return 'text-amber-800 dark:text-amber-400';
    default:
      return 'text-slate-600 dark:text-slate-400';
  }
};

const getCategoryIcon = (category: string, size: 'sm' | 'md' = 'md') => {
  const cn = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  switch (category) {
    case 'skill':
      return <Target className={cn} />;
    case 'milestone':
      return <Trophy className={cn} />;
    case 'social':
      return <Users className={cn} />;
    case 'streak':
      return <Flame className={cn} />;
    default:
      return <Award className={cn} />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'skill':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300';
    case 'milestone':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300';
    case 'social':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300';
    case 'streak':
      return 'bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-300';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
  }
};

/**
 * Locked rows use catalog `id`. Unlocked Firestore docs use auto-generated `id` but share `name` with the catalog.
 */
function definitionForAchievement(achievement: Achievement | AchievementDefinition) {
  return (
    ACHIEVEMENT_DEFINITIONS.find((d) => d.id === achievement.id) ??
    ACHIEVEMENT_DEFINITIONS.find((d) => d.name === achievement.name)
  );
}

function AchievementCard({ achievement, isUnlocked, onClick }: AchievementCardProps) {
  const definition = definitionForAchievement(achievement);
  const rarity = definition?.rarity || 'common';
  const points = definition?.points || 0;

  return (
    <div
      className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${
        isUnlocked ? getRarityColor(rarity) : 'border-slate-200/80 bg-slate-100/50 opacity-[0.72] dark:border-slate-600 dark:bg-slate-800/40'
      }`}
      onClick={onClick}
    >
      <div className="absolute right-2 top-2">
        <span
          className={`rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold capitalize shadow-sm dark:bg-slate-900/80 sm:px-2 sm:py-1 sm:text-xs ${getRarityTextColor(rarity)}`}
        >
          {rarity}
        </span>
      </div>

      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center sm:mb-3 sm:h-14 sm:w-14">
        <span className="text-3xl drop-shadow-sm sm:text-4xl">{achievement.icon}</span>
      </div>

      <div className="text-center">
        <h3
          className={`mb-1 line-clamp-2 text-sm font-semibold leading-snug sm:mb-1.5 sm:text-base ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-500'}`}
        >
          {achievement.name}
        </h3>
        <p
          className={`mb-2 line-clamp-3 text-xs leading-relaxed sm:mb-2.5 sm:text-sm ${isUnlocked ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400'}`}
        >
          {achievement.description}
        </p>

        <div className="mb-2 flex items-center justify-center gap-1.5 sm:mb-2.5 sm:gap-2">
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium sm:gap-1 sm:px-2 sm:py-1 sm:text-xs ${getCategoryColor(achievement.category)}`}
          >
            {getCategoryIcon(achievement.category, 'sm')}
          </span>
          <span className="text-[10px] capitalize text-slate-500 dark:text-slate-400 sm:text-xs">{achievement.category}</span>
        </div>

        <div className="flex items-center justify-center gap-0.5">
          <Star className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 sm:h-4 sm:w-4" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 sm:text-sm">{points} pts</span>
        </div>

        {!isUnlocked && achievement.id === 'profile_picture' && (
          <div className="mt-2 border-t border-slate-200/80 pt-2 dark:border-slate-600/80 sm:mt-3 sm:pt-3">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                window.location.href = '/profile';
              }}
              className="w-full rounded-lg bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 sm:px-3 sm:py-1.5 sm:text-xs"
            >
              Add profile photo
            </button>
          </div>
        )}

        {isUnlocked && 'unlockedDate' in achievement && (
          <div className="mt-2 border-t border-slate-200/80 pt-2 dark:border-slate-600/80 sm:mt-3 sm:pt-3">
            <p className="text-[10px] text-slate-500 dark:text-slate-500 sm:text-xs">
              Unlocked {new Date(achievement.unlockedDate).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-900/25 backdrop-blur-[1px] dark:bg-slate-950/40">
          <div className="rounded-full bg-white/95 p-2 shadow-md dark:bg-slate-800/95 sm:p-2.5">
            <span className="text-base sm:text-lg" aria-hidden>
              🔒
            </span>
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
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | AchievementDefinition | null>(null);

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

    if (selectedRarity !== 'all') {
      filtered = filtered.filter((a) => definitionForAchievement(a)?.rarity === selectedRarity);
    }

    // Filter by unlock status
    if (showUnlockedOnly) {
      filtered = filtered.filter(a => a.isUnlocked);
    }

    return filtered;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600 dark:border-slate-600 dark:border-t-blue-400" />
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Loading achievements…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto rounded-2xl border border-rose-200/80 bg-rose-50/50 p-8 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
        <p className="mb-4 text-sm text-rose-800 dark:text-rose-200">{error}</p>
        <button
          type="button"
          onClick={loadAchievements}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Try again
        </button>
      </div>
    );
  }

  const statShell =
    'min-w-0 rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-sm transition hover:shadow-md dark:border-slate-700/80 dark:bg-slate-800/60 sm:rounded-2xl sm:p-5';

  const filtered = filteredAchievements();
  const detailDefinition = selectedAchievement
    ? definitionForAchievement(selectedAchievement)
    : undefined;

  return (
    <div className="space-y-8">
      {stats && (
        <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
          <div className={statShell}>
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">
                  Unlocked
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-slate-900 dark:text-white sm:mt-1 sm:text-3xl">
                  {stats.totalAchievements}
                </p>
              </div>
              <div className="shrink-0 rounded-lg bg-sky-100 p-2 dark:bg-sky-950/50 sm:rounded-xl sm:p-3">
                <Trophy className="h-5 w-5 text-sky-700 dark:text-sky-400 sm:h-6 sm:w-6" />
              </div>
            </div>
          </div>

          <div className={statShell}>
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">
                  Points
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-slate-900 dark:text-white sm:mt-1 sm:text-3xl">
                  {stats.totalPoints}
                </p>
              </div>
              <div className="shrink-0 rounded-lg bg-amber-100 p-2 dark:bg-amber-950/50 sm:rounded-xl sm:p-3">
                <Star className="h-5 w-5 text-amber-700 dark:text-amber-400 sm:h-6 sm:w-6" />
              </div>
            </div>
          </div>

          <div className={statShell}>
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">
                  Completion
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-slate-900 dark:text-white sm:mt-1 sm:text-3xl">
                  {Math.round((stats.totalAchievements / ACHIEVEMENT_DEFINITIONS.length) * 100)}%
                </p>
              </div>
              <div className="shrink-0 rounded-lg bg-emerald-100 p-2 dark:bg-emerald-950/50 sm:rounded-xl sm:p-3">
                <Target className="h-5 w-5 text-emerald-700 dark:text-emerald-400 sm:h-6 sm:w-6" />
              </div>
            </div>
          </div>

          <div className={statShell}>
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">
                  Recent
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-slate-900 dark:text-white sm:mt-1 sm:text-3xl">
                  {stats.recentAchievements.length}
                </p>
              </div>
              <div className="shrink-0 rounded-lg bg-violet-100 p-2 dark:bg-violet-950/50 sm:rounded-xl sm:p-3">
                <Award className="h-5 w-5 text-violet-700 dark:text-violet-400 sm:h-6 sm:w-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/50 sm:p-6">
        <p className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Filter & search</p>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search by name or description…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap content-start gap-2 xl:max-w-xl">
            <span className="block w-full text-xs font-medium text-slate-500 dark:text-slate-400">Rarity</span>
            {rarities.map(rarity => (
              <button
                key={rarity}
                type="button"
                onClick={() => setSelectedRarity(selectedRarity === rarity ? 'all' : rarity)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition sm:text-sm ${
                  selectedRarity === rarity
                    ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700/80 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {rarity}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              showUnlockedOnly
                ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-600'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700/80 dark:text-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            {showUnlockedOnly ? 'Show all' : 'Unlocked only'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            isUnlocked={achievement.isUnlocked}
            onClick={() => setSelectedAchievement(achievement)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center dark:border-slate-600 dark:bg-slate-900/30">
          <Trophy className="mx-auto mb-4 h-14 w-14 text-slate-300 dark:text-slate-600" />
          <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">No achievements match</h3>
          <p className="mx-auto max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Clear filters or keep skiing — new badges unlock as you progress.
          </p>
        </div>
      )}

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <ResponsiveModalPanel
          onClose={() => setSelectedAchievement(null)}
          labelledBy="achievement-detail-title"
          maxWidthClass="sm:max-w-md"
        >
          <div className="flex shrink-0 items-center justify-end border-b border-gray-200 bg-white px-2 py-2 dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:inset-x-0 sm:top-0 sm:z-20 sm:border-0 sm:bg-transparent sm:px-4 sm:py-3">
            <button
              type="button"
              onClick={() => setSelectedAchievement(null)}
              className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-6 pt-2 sm:px-6 sm:pb-6 sm:pt-16">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
                <span className="text-6xl">{selectedAchievement.icon}</span>
              </div>

              <h2
                id="achievement-detail-title"
                className="mb-2 text-2xl font-bold text-gray-900 dark:text-white"
              >
                {selectedAchievement.name}
              </h2>
                  
              <p className="mb-4 text-gray-600 dark:text-gray-400">{selectedAchievement.description}</p>

              <div className="mb-4 flex flex-wrap items-center justify-center gap-4">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${getCategoryColor(selectedAchievement.category)}`}
                >
                  {selectedAchievement.category}
                </span>

                {detailDefinition && (
                  <span
                    className={`rounded-full bg-gray-100 px-3 py-1 text-sm font-medium capitalize dark:bg-gray-800 ${getRarityTextColor(detailDefinition.rarity)}`}
                  >
                    {detailDefinition.rarity}
                  </span>
                )}
              </div>

              {detailDefinition && (
                <div className="mb-4 flex items-center justify-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {detailDefinition.points} points
                  </span>
                </div>
              )}

              {'unlockedDate' in selectedAchievement && selectedAchievement.unlockedDate && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/40">
                  <p className="font-medium text-green-800 dark:text-green-300">Achievement Unlocked!</p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {new Date(selectedAchievement.unlockedDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </ResponsiveModalPanel>
      )}
    </div>
  );
}
