import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Star, MapPin, Award, ChevronRight, CheckCircle } from 'lucide-react';
import type { InstructorMatch } from '../../services/instructorMatching';
import { getMountains, getStudentFacingMountainLessonRate } from '../../services/mountains';
import type { Mountain } from '../../types';

interface HomeMatchResultsProps {
  prompt: string;
  matches: InstructorMatch[];
  loading: boolean;
  error: string | null;
  visible: boolean;
}

export function HomeMatchResults({
  prompt,
  matches,
  loading,
  error,
  visible
}: HomeMatchResultsProps) {
  const [mountains, setMountains] = useState<Mountain[]>([]);

  useEffect(() => {
    if (!visible) return;
    void getMountains()
      .then(setMountains)
      .catch(() => setMountains([]));
  }, [visible]);

  if (!visible) return null;

  const bookHref = `/book-lesson?q=${encodeURIComponent(prompt)}#book-lesson-match`;

  return (
    <section
      className="py-12 sm:py-16 md:py-20 bg-gray-900 border-t border-gray-800"
      aria-busy={loading}
      aria-live="polite"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/40 text-violet-300 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                AI matches for you
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                Top picks from your lesson
              </h2>
              {prompt && (
                <p className="mt-2 text-sm sm:text-base text-gray-400 line-clamp-2">
                  “{prompt}”
                </p>
              )}
            </div>
            <Link
              to={bookHref}
              className="inline-flex items-center justify-center gap-1 text-sm font-semibold text-blue-400 hover:text-blue-300 shrink-0"
            >
              Book on full directory
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading && (
            <div className="rounded-2xl border border-gray-700 bg-gray-800/60 p-8 flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent" />
              <div>
                <p className="font-semibold text-white">Finding instructors…</p>
                <p className="text-sm text-gray-400">Scoring against your goals and resorts you mentioned</p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-800/80 bg-red-950/40 p-6 text-red-200 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && matches.length === 0 && (
            <div className="rounded-2xl border border-gray-700 bg-gray-800/40 p-8 text-center">
              <p className="text-gray-300 mb-2">No instructors matched that text closely enough.</p>
              <p className="text-sm text-gray-500 mb-4">Try another resort, sport, or a bit more detail.</p>
              <Link
                to={bookHref}
                className="inline-flex items-center gap-2 text-blue-400 font-medium hover:text-blue-300"
              >
                Open book lesson
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {!loading && !error && matches.length > 0 && (
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 list-none p-0 m-0">
              {matches.map((match, index) => {
                const rate = getStudentFacingMountainLessonRate(match.instructor, mountains);
                const topReasons = match.reasons.slice(0, 3);
                return (
                  <li key={match.instructor.id}>
                    <article className="h-full flex flex-col rounded-2xl border border-gray-700 bg-gray-800/80 overflow-hidden shadow-lg hover:border-violet-600/50 transition-colors">
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-start gap-3 mb-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white text-sm font-bold">
                            {index + 1}
                          </span>
                          <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-gray-600 shrink-0">
                            {match.instructor.avatar ? (
                              <img
                                src={match.instructor.avatar}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-700 text-white font-semibold">
                                {match.instructor.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-white truncate">{match.instructor.name}</h3>
                            <div className="mt-1 inline-flex px-2 py-0.5 rounded-md text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                              {Math.round(match.matchScore)}% match
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 mb-4">
                          {match.stats && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                              {match.stats.averageRating.toFixed(1)} ({match.stats.totalReviews})
                            </span>
                          )}
                          {match.instructor.yearsOfExperience != null && match.instructor.yearsOfExperience > 0 && (
                            <span className="flex items-center gap-1">
                              <Award className="w-3.5 h-3.5" />
                              {match.instructor.yearsOfExperience}+ yrs
                            </span>
                          )}
                          {(match.instructor.homeMountain ||
                            match.instructor.preferredLocations?.[0]) && (
                            <span className="flex items-center gap-1 min-w-0">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                {match.instructor.homeMountain ||
                                  match.instructor.preferredLocations?.[0]}
                              </span>
                            </span>
                          )}
                          <span className="text-gray-500">
                            {rate != null ? `From $${rate}/hr` : 'Resort rates'}
                          </span>
                        </div>

                        {topReasons.length > 0 && (
                          <ul className="space-y-2 mb-5 flex-1">
                            {topReasons.map((reason, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-xs text-gray-300 leading-snug"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        <Link
                          to={bookHref}
                          className="mt-auto w-full text-center py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
                        >
                          Continue to book
                        </Link>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
