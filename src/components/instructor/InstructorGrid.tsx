import React, { useState } from 'react';
import { MapPin, Star, Clock, Users, Globe2, Award, Target, DollarSign } from 'lucide-react';
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
  /** Student-facing mountain rate label (Book Lesson). Preferred over legacy `price`. */
  priceLabel?: string;
  /** Legacy numeric rate (e.g. Find Instructor). Ignored when `priceLabel` is set. */
  price?: number;
  /** Mountain-based rate for booking modal prefill (no instructor hourly). */
  studentLessonRate?: number | null;
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {instructors.map(instructor => (
          <div
            key={instructor.id}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-800 dark:bg-gray-900 flex flex-col"
          >
            {/* Image Section */}
            <div className="relative h-48 md:h-56 overflow-hidden">
              <img
                src={instructor.image}
                alt={instructor.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
              
              {/* Price badge: mountain / student-facing label, or legacy $/hr */}
              <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-full text-sm font-semibold text-gray-900 dark:text-white shadow-lg flex items-center gap-1.5 max-w-[min(100%,14rem)]">
                <DollarSign className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">
                  {instructor.priceLabel ??
                    (instructor.price != null && instructor.price > 0
                      ? `$${instructor.price}/hr`
                      : 'Resort pricing')}
                </span>
              </div>
              
              {/* Stats Badge */}
              {instructor.stats && instructor.stats.totalLessons > 0 && (
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-blue-600 text-white rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm">
                  {instructor.stats.totalLessons} lessons
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-4 md:p-6 flex-1 flex flex-col">
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                    {instructor.name}
                  </h3>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {instructor.rating.toFixed(1)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      ({instructor.reviewCount})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="line-clamp-1">{instructor.location}</span>
                </div>
              </div>

              {/* Quick Info */}
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{instructor.experience} yrs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe2 className="w-4 h-4" />
                  <span>{instructor.languages.length} lang</span>
                </div>
              </div>
              
              {/* Stats Row */}
              {instructor.stats && instructor.stats.totalLessons > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-1.5">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium">{instructor.stats.totalStudents}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-1.5">
                      <Target className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium">{instructor.stats.totalLessons}</span>
                  </div>
                </div>
              )}
              
              {/* Specialties */}
              <div className="flex flex-wrap gap-2 mb-4">
                {instructor.specialties.slice(0, 3).map((specialty, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium"
                  >
                    {specialty}
                  </span>
                ))}
                {instructor.specialties.length > 3 && (
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                    +{instructor.specialties.length - 3}
                  </span>
                )}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => setSelectedInstructor(instructor)}
                className="mt-auto w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
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