import React, { useState, useEffect } from 'react';
import { Mountain, Sparkles, Star } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const LESSON_MATCH_PLACEHOLDER =
  'Private snowboard lesson for two teens in Aspen, Saturday morning, never been before…';

const LESSON_MATCH_EXAMPLE =
  'Try: “Intermediate skier, weekday mornings, Breckenridge, want to learn carving.”';

interface HeroProps {
  lessonDescription: string;
  onLessonDescriptionChange: (value: string) => void;
  onMatchSubmit: (trimmedPrompt: string) => void | Promise<void>;
  matchLoading?: boolean;
}

export function Hero({
  lessonDescription,
  onLessonDescriptionChange,
  onMatchSubmit,
  matchLoading = false
}: HeroProps) {
  const [totalLessons, setTotalLessons] = useState(0);

  useEffect(() => {
    const fetchLessonCount = async () => {
      try {
        const lessonsSnapshot = await getDocs(collection(db, 'lessons'));
        setTotalLessons(lessonsSnapshot.size);
      } catch (error) {
        console.error('Error fetching lesson count:', error);
        setTotalLessons(2500);
      }
    };

    fetchLessonCount();
  }, []);

  const handleLessonMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = lessonDescription.trim();
    if (!text || matchLoading) return;
    await onMatchSubmit(text);
  };

  return (
    <div className="relative min-h-[78vh] sm:min-h-[85vh] md:min-h-[90vh] flex items-center bg-gray-900 py-10 sm:py-0">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <img
          src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=2000&q=80"
          alt="Ski slopes with snow-covered mountains"
          className="w-full h-full object-cover object-center"
        />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-6">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
            </div>
            <span className="text-sm sm:text-base text-gray-300 font-medium">{totalLessons.toLocaleString()}+ lessons booked</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            Find Your Perfect
            <span className="block text-blue-400">
              Ski & Snowboard Instructor
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-5 sm:mb-8 leading-relaxed max-w-2xl">
            Smart matching, certified coaches, and easy booking—whether you&apos;re new to snow or leveling up.
          </p>
          
          <div className="mb-5 sm:mb-8 inline-flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-xl sm:rounded-full max-w-full">
            <span className="text-xs sm:text-sm font-semibold text-blue-300">✨ AI matching</span>
            <span className="text-[11px] sm:text-xs text-gray-400">Suggestions based on your goals</span>
          </div>
          
          <form
            onSubmit={handleLessonMatchSubmit}
            className="mb-8 sm:mb-12 max-w-2xl"
            aria-label="Describe your lesson for AI matching"
          >
            <label
              htmlFor="hero-lesson-match"
              className="flex items-center gap-2 text-sm sm:text-base font-medium text-gray-100 mb-2"
            >
              <Mountain className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0" aria-hidden />
              Describe your perfect lesson
            </label>
            <div className="rounded-xl sm:rounded-2xl border border-gray-600/90 bg-gray-950/55 backdrop-blur-md shadow-xl overflow-hidden ring-1 ring-white/5 focus-within:ring-2 focus-within:ring-blue-500/80 focus-within:border-blue-500/50 transition-shadow">
              <textarea
                id="hero-lesson-match"
                name="lessonDescription"
                rows={3}
                value={lessonDescription}
                onChange={(e) => onLessonDescriptionChange(e.target.value)}
                placeholder={LESSON_MATCH_PLACEHOLDER}
                className="w-full bg-transparent text-white placeholder:text-gray-500 px-4 py-3 sm:py-3.5 text-sm sm:text-base leading-relaxed resize-y min-h-[5.5rem] border-0 focus:ring-0"
              />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-700/90 bg-gray-900/50">
                <p className="text-[11px] sm:text-xs text-gray-400 leading-snug order-2 sm:order-1">
                  {LESSON_MATCH_EXAMPLE}
                </p>
                <button
                  type="submit"
                  disabled={!lessonDescription.trim() || matchLoading}
                  className="order-1 sm:order-2 inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl font-semibold text-sm sm:text-base bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:pointer-events-none transition-colors touch-manipulation shadow-lg"
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  {matchLoading ? 'Matching…' : 'Match with AI'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}