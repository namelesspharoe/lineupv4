import React, { useState, useEffect } from 'react';
import { ChevronRight, Star, Snowflake, Mountain, Users } from 'lucide-react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function Hero() {
  const [stats, setStats] = useState({
    totalInstructors: 0,
    totalLessons: 0,
    averageRating: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total instructors
        const instructorsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'instructor')
        );
        const instructorsSnapshot = await getDocs(instructorsQuery);
        const totalInstructors = instructorsSnapshot.size;

        // Get total lessons
        const lessonsSnapshot = await getDocs(collection(db, 'lessons'));
        const totalLessons = lessonsSnapshot.size;

        // Calculate average rating from completed lessons
        const completedLessons = lessonsSnapshot.docs
          .map(doc => doc.data())
          .filter(lesson => lesson.status === 'completed');
        
        const allReviews = completedLessons.flatMap(lesson => lesson.studentReviews || []);
        const averageRating = allReviews.length > 0 
          ? Math.round((allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length) * 10) / 10
          : 4.8; // Default rating if no reviews

        setStats({
          totalInstructors,
          totalLessons,
          averageRating
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback to default stats
        setStats({
          totalInstructors: 150,
          totalLessons: 2500,
          averageRating: 4.8
        });
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="relative min-h-[90vh] flex items-center bg-gray-900">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <img
          src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=2000&q=80"
          alt="Ski slopes with snow-covered mountains"
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            </div>
            <span className="text-gray-300 font-medium">Trusted by {stats.totalLessons.toLocaleString()}+ students worldwide</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Find Your Perfect
            <span className="block text-blue-400">
              Ski & Snowboard Instructor
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl">
            Connect with certified instructors, book personalized lessons, and track your progress from beginner to expert. 
            Whether you're hitting the slopes for the first time or perfecting advanced techniques.
          </p>
          
          <div className="flex flex-wrap gap-4 mb-12">
            <a 
              href="/find-instructor"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              <Mountain className="w-5 h-5" />
              Find Your Instructor
              <ChevronRight className="w-5 h-5" />
            </a>
            <a 
              href="/book-lesson"
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all duration-300 border border-gray-600 hover:border-gray-500"
            >
              <Snowflake className="w-5 h-5 inline mr-2" />
              Browse Lessons
            </a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 mb-3 inline-block border border-gray-700">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalInstructors}+</p>
              <p className="text-gray-400 font-medium">Certified Instructors</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 mb-3 inline-block border border-gray-700">
                <Snowflake className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalLessons.toLocaleString()}+</p>
              <p className="text-gray-400 font-medium">Lessons Completed</p>
            </div>
            <div className="text-center">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 mb-3 inline-block border border-gray-700">
                <Star className="w-8 h-8 text-yellow-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.averageRating}/5</p>
              <p className="text-gray-400 font-medium">Average Rating</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}