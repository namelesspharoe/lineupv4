import { useState, useEffect, useMemo } from 'react';
import { Sparkles, TrendingUp, Star, MapPin, DollarSign, Award, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { instructorMatchingService, InstructorMatch } from '../../services/instructorMatching';
import { getStudentFacingMountainLessonRate } from '../../services/mountains';
import { User, Mountain } from '../../types';

interface FilterState {
  discipline: string[];
  level: string[];
  price: number[];
  availability: string[];
  languages: string[];
  gender: string[];
  certification: string[];
}

interface AIMatchingRecommendationsProps {
  /** Loaded mountains — student-facing rates come from here only (not instructor hourly). */
  mountains: Mountain[];
  resort?: string | null;
  filters?: FilterState;
  searchQuery?: string;
  onInstructorSelect?: (instructor: User) => void;
}

export function AIMatchingRecommendations({
  mountains,
  resort,
  filters,
  searchQuery,
  onInstructorSelect
}: AIMatchingRecommendationsProps) {
  const { user } = useAuth();
  const [matches, setMatches] = useState<InstructorMatch[]>([]);
  // Start true for students so we don't render `matches.length === 0 → null` before the first fetch runs
  const [isLoading, setIsLoading] = useState(() => user?.role === 'student');
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});

  // Create a stable filter key to prevent unnecessary re-renders
  const filterKey = useMemo(() => {
    if (!filters) return '';
    return JSON.stringify({
      discipline: filters.discipline.sort(),
      level: filters.level.sort(),
      price: filters.price,
      languages: filters.languages.sort(),
      gender: filters.gender.sort(),
      certification: filters.certification.sort()
    });
  }, [filters]);

  useEffect(() => {
    if (user && user.role === 'student') {
      void loadRecommendations();
    } else {
      setIsLoading(false);
      setMatches([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, resort, filterKey, searchQuery, mountains]);

  const loadRecommendations = async () => {
    if (!user || user.role !== 'student') return;

    try {
      setIsLoading(true);
      setError(null);

      // Get all recommendations first
      const allRecommendations = await instructorMatchingService.matchStudentWithInstructors(
        user.id,
        {
          resort: resort || undefined,
          maxResults: 50 // Get more to filter
        }
      );

      // Apply filters to recommendations
      let filtered = allRecommendations;

      if (filters) {
        filtered = allRecommendations.filter(match => {
          const instructor = match.instructor;

          // Discipline/Specialties filter
          if (filters.discipline.length > 0) {
            const hasDiscipline = filters.discipline.some(discipline =>
              instructor.specialties?.some(spec =>
                spec.toLowerCase().includes(discipline.toLowerCase()) ||
                discipline.toLowerCase().includes(spec.toLowerCase())
              )
            );
            if (!hasDiscipline) return false;
          }

          // Level filter
          if (filters.level.length > 0) {
            if (!instructor.level || !filters.level.includes(instructor.level)) {
              return false;
            }
          }

          // Price filter — mountain resort rates only
          const resortRate = getStudentFacingMountainLessonRate(instructor, mountains);
          if (
            resortRate !== null &&
            (resortRate < filters.price[0] || resortRate > filters.price[1])
          ) {
            return false;
          }

          // Languages filter
          if (filters.languages.length > 0) {
            const hasLanguage = filters.languages.some(lang =>
              instructor.languages?.includes(lang)
            );
            if (!hasLanguage) return false;
          }

          // Gender filter
          if (filters.gender.length > 0) {
            if (!instructor.gender || !filters.gender.includes(instructor.gender)) {
              return false;
            }
          }

          // Certification filter
          if (filters.certification.length > 0) {
            const hasCertification = filters.certification.some(cert =>
              instructor.certifications?.includes(cert)
            );
            if (!hasCertification) return false;
          }

          return true;
        });
      }

      // Apply search query filter
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(match => {
          const instructor = match.instructor;
          return (
            instructor.name.toLowerCase().includes(query) ||
            instructor.specialties?.some(spec => spec.toLowerCase().includes(query)) ||
            instructor.bio?.toLowerCase().includes(query)
          );
        });
      }

      // Take top 6 matches
      setMatches(filtered.slice(0, 6));
    } catch (err: any) {
      console.error('Error loading AI recommendations:', err);
      setError(err.message || 'Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const getMatchColor = (score: number): string => {
    if (score >= 85) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-blue-600 dark:text-blue-400';
    if (score >= 55) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getMatchBadgeColor = (score: number): string => {
    if (score >= 85) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
    if (score >= 70) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    if (score >= 55) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800';
  };

  if (!user || user.role !== 'student') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Finding your perfect match...
          </h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-800 shadow-sm p-6">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={loadRecommendations}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-6 md:p-8">
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 text-violet-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              No AI matches right now
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Try clearing filters, widening the price range, choosing <strong>All locations</strong>, or
              shortening your search — matches need at least one instructor that passes your current
              filters and resort selection.
            </p>
            <button
              type="button"
              onClick={() => void loadRecommendations()}
              className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Refresh recommendations
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-blue-200 dark:border-gray-700 shadow-lg p-6 md:p-8 mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-600 rounded-xl">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            AI-Powered Recommendations
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Matched based on your skill level, preferences, and learning goals
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-gray-700">
          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {matches.length} matches
          </span>
        </div>
      </div>

      {/* Top Matches Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {matches.slice(0, 3).map((match, index) => (
          <div
            key={match.instructor.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => onInstructorSelect?.(match.instructor)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {index === 0 && (
                  <Award className="w-5 h-5 text-yellow-500" />
                )}
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  #{index + 1} Match
                </span>
              </div>
              <div className={`px-2 py-1 rounded-lg text-xs font-bold ${getMatchBadgeColor(match.matchScore)}`}>
                {Math.round(match.matchScore)}%
              </div>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              {match.instructor.name}
            </h4>
            {match.stats && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span>{match.stats.averageRating.toFixed(1)}</span>
                <span className="text-gray-400">•</span>
                <span>{match.stats.totalReviews} reviews</span>
              </div>
            )}
            {match.reasons.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {match.reasons[0]}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detailed Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Recommendations
          </h4>
          <button
            onClick={loadRecommendations}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Refresh
          </button>
        </div>

        {matches.map((match) => (
          <div
            key={match.instructor.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                  {match.instructor.avatar ? (
                    <img
                      src={match.instructor.avatar}
                      alt={match.instructor.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      {match.instructor.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {match.instructor.name}
                    </h5>
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getMatchBadgeColor(match.matchScore)}`}>
                      {Math.round(match.matchScore)}% Match
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {match.stats && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span>{match.stats.averageRating.toFixed(1)}</span>
                        <span>({match.stats.totalReviews})</span>
                      </div>
                    )}
                    {match.instructor.yearsOfExperience ? (
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        <span>{match.instructor.yearsOfExperience} years</span>
                      </div>
                    ) : null}
                    {match.instructor.preferredLocations && match.instructor.preferredLocations.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{match.instructor.preferredLocations[0]}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span>
                        {(() => {
                          const r = getStudentFacingMountainLessonRate(match.instructor, mountains);
                          return r != null ? `From $${r}/hr` : 'Resort pricing';
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Match Reasons */}
                  {match.reasons.length > 0 && (
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowDetails(prev => ({
                          ...prev,
                          [match.instructor.id]: !prev[match.instructor.id]
                        }))}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                      >
                        {showDetails[match.instructor.id] ? 'Hide' : 'Show'} why this is a good match
                      </button>
                      {showDetails[match.instructor.id] && (
                        <div className="mt-2 space-y-2">
                          {match.reasons.map((reason, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                            >
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => onInstructorSelect?.(match.instructor)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex-shrink-0 whitespace-nowrap"
              >
                Book Lesson
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

