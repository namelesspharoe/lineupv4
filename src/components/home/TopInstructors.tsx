import React, { useState, useEffect } from 'react';
import { InstructorCard } from './InstructorCard';
import { instructorStatsService, InstructorRanking } from '../../services/instructorStats';
import { Trophy, Star, Award, TrendingUp, Users, Clock } from 'lucide-react';

export function TopInstructors() {
  const [rankings, setRankings] = useState<InstructorRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalInstructors: 0,
    averageRating: 0,
    totalLessons: 0,
    averageExperience: 0
  });

  useEffect(() => {
    const fetchTopInstructors = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const topInstructors = await instructorStatsService.getTopInstructors(3);
        setRankings(topInstructors);
        
        // Calculate aggregate stats from the top instructors
        if (topInstructors.length > 0) {
          const totalLessons = topInstructors.reduce((sum, instructor) => sum + instructor.stats.totalLessons, 0);
          const totalRating = topInstructors.reduce((sum, instructor) => sum + instructor.stats.averageRating, 0);
          const avgRating = totalRating / topInstructors.length;
          
          setStats({
            totalInstructors: topInstructors.length,
            averageRating: Math.round(avgRating * 10) / 10,
            totalLessons,
            averageExperience: 8 // Default average experience
          });
        }
      } catch (err) {
        console.error('Error fetching top instructors:', err);
        setError('Failed to load instructors');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopInstructors();
  }, []);

  if (error) {
    return (
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-full text-sm font-semibold mb-6">
            <Trophy className="w-5 h-5" />
            Top Rated This Season
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Learn from the
            <span className="block text-blue-400">
              Mountain's Finest
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Our top-ranked instructors are certified professionals with years of experience teaching 
            skiing and snowboarding. They've helped thousands of students master the slopes.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16 max-w-4xl mx-auto">
          <div className="text-center p-6 bg-gray-800 rounded-2xl shadow-lg border border-gray-700">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.averageRating}/5</p>
            <p className="text-gray-400 text-sm">Average Rating</p>
          </div>
          
          <div className="text-center p-6 bg-gray-800 rounded-2xl shadow-lg border border-gray-700">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">100%</p>
            <p className="text-gray-400 text-sm">Certified</p>
          </div>
          
          <div className="text-center p-6 bg-gray-800 rounded-2xl shadow-lg border border-gray-700">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalLessons.toLocaleString()}+</p>
            <p className="text-gray-400 text-sm">Lessons Taught</p>
          </div>
          
          <div className="text-center p-6 bg-gray-800 rounded-2xl shadow-lg border border-gray-700">
            <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.averageExperience}+</p>
            <p className="text-gray-400 text-sm">Years Avg</p>
          </div>
        </div>

        {/* Instructors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {rankings.map((instructor, index) => (
            <div key={instructor.instructorId} className="relative group">
              {/* Rank Badge */}
              <div className="absolute -top-3 -right-3 z-20">
                <div className="relative">
                  <div className="bg-yellow-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-xl border-4 border-gray-900">
                    #{instructor.rank}
                  </div>
                  <div className="absolute inset-0 bg-yellow-600 rounded-full blur-lg opacity-50"></div>
                </div>
              </div>
              
              <InstructorCard
                name={instructor.instructorName}
                image={instructor.instructorAvatar}
                bio="Certified professional with extensive experience in teaching skiing and snowboarding techniques. Specializes in personalized instruction for all skill levels."
                specialties={['Alpine Skiing', 'Snowboarding', 'Freestyle', 'Racing']}
                rating={instructor.stats.averageRating}
                lessonsCount={instructor.stats.totalLessons}
                location="Aspen, CO"
                experience={8}
                price={85}
                certifications={['PSIA Level 3', 'AASI Level 2']}
              />
            </div>
          ))}
        </div>

        {rankings.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
              <Star className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 text-lg">No top instructors available at the moment</p>
            <p className="text-gray-500 text-sm mt-2">Check back soon for updated rankings</p>
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-700 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Start Your Journey?
            </h3>
            <p className="text-gray-300 mb-6">
              Book a lesson with one of our top instructors and experience the difference 
              that professional instruction makes.
            </p>
            <a 
              href="/find-instructor"
              className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Browse All Instructors
              <TrendingUp className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}