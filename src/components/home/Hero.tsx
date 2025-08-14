import React from 'react';
import { ChevronRight, Star } from 'lucide-react';

export function Hero() {
  return (
    <div className="relative min-h-[90vh] flex items-center">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50 z-10" />
        <img
          src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=2000&q=80"
          alt="Hero background"
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-6">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="text-white/90 font-medium">Rated #1 Ski & Snowboard School Worldwide</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Master the Slopes with World-Class Instructors
          </h1>
          
          <p className="text-xl text-white/80 mb-8 leading-relaxed">
            From beginners to advanced riders, our certified instructors will help you reach new heights in your skiing and snowboarding journey.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <a 
              href="/find-instructor"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              Find Your Instructor
              <ChevronRight className="w-5 h-5" />
            </a>
            <a 
              href="/book-lesson"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium backdrop-blur-sm transition-colors"
            >
              View All Lessons
            </a>
          </div>
          
          <div className="flex items-center gap-8 mt-12">
            <div>
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-white/70">Certified Instructors</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">50k+</p>
              <p className="text-white/70">Happy Students</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">100%</p>
              <p className="text-white/70">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}