import React, { useState, useEffect } from 'react';
import { InstructorCard } from './InstructorCard';
import { instructorStatsService, InstructorRanking } from '../../services/instructorStats';

export function TopInstructors() {
  const [rankings, setRankings] = useState<InstructorRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopInstructors = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const topInstructors = await instructorStatsService.getTopInstructors(3);
        setRankings(topInstructors);
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
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Learn from the World's Best
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our top-ranked instructors are among the most qualified and experienced professionals in the industry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {rankings.map((instructor, index) => (
            <div key={instructor.instructorId} className="relative">
              {/* Rank Badge */}
              <div className="absolute -top-2 -right-2 z-10">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg">
                  #{instructor.rank}
                </div>
              </div>
              
              <InstructorCard
                name={instructor.instructorName}
                image={instructor.instructorAvatar}
                bio=""
                specialties={[]}
                rating={instructor.stats.averageRating}
                lessonsCount={instructor.stats.totalLessons}
              />
              
              {/* Performance Score */}
              <div className="mt-2 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  <span>Performance Score:</span>
                  <span className="font-bold">{instructor.stats.performanceScore}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {rankings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No top instructors available at the moment</p>
          </div>
        )}
      </div>
    </section>
  );
}