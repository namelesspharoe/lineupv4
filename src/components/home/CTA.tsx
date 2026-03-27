import React from 'react';
import { Mountain, Snowflake, ArrowRight, CheckCircle, Star, Users } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gray-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M30 30c0-16.569 13.431-30 30-30v60c-16.569 0-30-13.431-30-30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 sm:mb-10 md:mb-12">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-800 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6 border border-gray-700">
              <Snowflake className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0" />
              Start today
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 leading-tight text-white">
              Ready to ride
              <span className="block text-blue-400">
                with confidence?
              </span>
            </h2>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed px-1 sm:px-0">
              Match with a coach, book fast, and build skills trip by trip.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto text-left">
            <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-800/40 p-3 sm:p-0 sm:border-0 sm:bg-transparent">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm sm:text-base">Certified coaches</p>
                <p className="text-xs sm:text-sm text-gray-400">Vetted instructors</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-800/40 p-3 sm:p-0 sm:border-0 sm:bg-transparent">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm sm:text-base">Real results</p>
                <p className="text-xs sm:text-sm text-gray-400">Skills that stick</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-800/40 p-3 sm:p-0 sm:border-0 sm:bg-transparent">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm sm:text-base">Community</p>
                <p className="text-xs sm:text-sm text-gray-400">Riders like you</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center items-stretch sm:items-center mb-8 sm:mb-10 md:mb-12">
            <a 
              href="/find-instructor"
              className="inline-flex justify-center items-center min-h-[48px] gap-2 px-6 sm:px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold transition-colors md:transform md:hover:scale-[1.02] shadow-lg touch-manipulation"
            >
              <Mountain className="w-5 h-5 shrink-0" />
              Find your instructor
              <ArrowRight className="w-5 h-5 shrink-0" />
            </a>
            
            <a 
              href="/signup"
              className="inline-flex justify-center items-center min-h-[48px] px-6 sm:px-8 py-3.5 bg-gray-800 hover:bg-gray-700 active:bg-gray-700 text-white rounded-xl font-semibold transition-colors border border-gray-600 hover:border-gray-500 touch-manipulation"
            >
              Create free account
            </a>
          </div>

          <div className="rounded-2xl border border-gray-700/80 bg-gray-800/40 overflow-hidden max-w-3xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-700/80">
              <div className="text-center py-3 sm:py-4 px-2">
                <p className="text-lg sm:text-2xl font-bold text-white tabular-nums">500+</p>
                <p className="text-gray-400 text-[10px] sm:text-sm leading-tight">Coaches</p>
              </div>
              <div className="text-center py-3 sm:py-4 px-2">
                <p className="text-lg sm:text-2xl font-bold text-white tabular-nums">25k+</p>
                <p className="text-gray-400 text-[10px] sm:text-sm leading-tight">Lessons</p>
              </div>
              <div className="text-center py-3 sm:py-4 px-2">
                <p className="text-lg sm:text-2xl font-bold text-white tabular-nums">4.9</p>
                <p className="text-gray-400 text-[10px] sm:text-sm leading-tight">Avg rating</p>
              </div>
              <div className="text-center py-3 sm:py-4 px-2">
                <p className="text-lg sm:text-2xl font-bold text-white tabular-nums">98%</p>
                <p className="text-gray-400 text-[10px] sm:text-sm leading-tight">Satisfied</p>
              </div>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 p-4 sm:p-6 bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-700">
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
              <strong className="text-white">Flexible booking.</strong> Reschedule when plans change—no long-term lock-in.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
