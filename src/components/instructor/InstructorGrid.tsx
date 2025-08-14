import React, { useState } from 'react';
import { MapPin, Star, Clock, Users, Globe2, Award, Target } from 'lucide-react';
import { InstructorProfileModal } from './InstructorProfileModal';

interface InstructorStats {
  totalLessons: number;
  averageRating: number;
  totalStudents: number;
  totalReviews: number;
}

interface Instructor {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  reviewCount: number;
  price: number;
  specialties: string[];
  experience: number;
  languages: string[];
  availability: string;
  stats?: InstructorStats;
}

interface InstructorGridProps {
  instructors: Instructor[];
}

export function InstructorGrid({ instructors }: InstructorGridProps) {
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instructors.map(instructor => (
          <div
            key={instructor.id}
            className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100"
          >
            <div className="relative h-48">
              <img
                src={instructor.image}
                alt={instructor.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 right-4 px-3 py-1 bg-white rounded-full text-sm font-medium">
                ${instructor.price}/hour
              </div>
              {instructor.stats && instructor.stats.totalLessons > 0 && (
                <div className="absolute top-4 left-4 px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                  {instructor.stats.totalLessons} lessons
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{instructor.name}</h3>
                  <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                    <MapPin className="w-4 h-4" />
                    {instructor.location}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-medium">{instructor.rating.toFixed(1)}</span>
                  <span className="text-gray-500 text-sm">({instructor.reviewCount})</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{instructor.experience} years</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Globe2 className="w-4 h-4" />
                    <span>{instructor.languages.length} languages</span>
                  </div>
                </div>
                
                {/* Stats Row */}
                {instructor.stats && instructor.stats.totalLessons > 0 && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{instructor.stats.totalStudents} students</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Target className="w-4 h-4" />
                      <span className="text-sm">{instructor.stats.totalLessons} lessons</span>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {instructor.specialties.slice(0, 3).map((specialty, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium"
                    >
                      {specialty}
                    </span>
                  ))}
                  {instructor.specialties.length > 3 && (
                    <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-medium">
                      +{instructor.specialties.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedInstructor(instructor)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Award className="w-5 h-5" />
                View Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedInstructor && (
        <InstructorProfileModal
          instructor={selectedInstructor}
          onClose={() => setSelectedInstructor(null)}
        />
      )}
    </>
  );
}