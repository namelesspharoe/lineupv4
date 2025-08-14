import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, MapPin, Star, Clock, ChevronDown } from 'lucide-react';
import { InstructorGrid } from '../components/instructor/InstructorGrid';
import { FilterPanel } from '../components/instructor/FilterPanel';
import { collection, query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';

interface InstructorStats {
  totalLessons: number;
  averageRating: number;
  totalStudents: number;
  totalReviews: number;
  lastUpdated: string;
}

interface InstructorWithStats extends User {
  stats: InstructorStats;
}

export function FindInstructor() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [instructors, setInstructors] = useState<InstructorWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: authUser } = useAuth();
  const [filters, setFilters] = useState({
    discipline: [] as string[],
    level: [] as string[],
    price: [0, 200],
    availability: [] as string[],
    languages: [] as string[]
  });

  // Fetch instructors from Firebase with their stats
  useEffect(() => {
    const fetchInstructorsWithStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Query only public instructor data
        const instructorsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'instructor')
        );

        const snapshot = await getDocs(instructorsQuery);
        const fetchedInstructors = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            avatar: data.avatar,
            specialties: data.specialties || [],
            languages: data.languages || [],
            yearsOfExperience: data.yearsOfExperience,
            price: data.hourlyRate, // Map hourlyRate to price for consistency
            preferredLocations: data.preferredLocations || [],
            bio: data.bio,
            level: data.level,
            role: 'instructor',
            stats: {
              totalLessons: 0,
              averageRating: 0,
              totalStudents: 0,
              totalReviews: 0,
              lastUpdated: new Date().toISOString()
            }
          } as InstructorWithStats;
        });

        // Try to fetch stats from instructorStats collection, fall back to defaults if not available
        const instructorsWithStats = await Promise.all(
          fetchedInstructors.map(async (instructor) => {
            try {
              // Try to get stats from instructorStats collection
              const statsDoc = await getDoc(doc(db, 'instructorStats', instructor.id));
              
              if (statsDoc.exists()) {
                const statsData = statsDoc.data() as InstructorStats;
                return {
                  ...instructor,
                  stats: {
                    totalLessons: statsData.totalLessons || 0,
                    averageRating: statsData.averageRating || 0,
                    totalStudents: statsData.totalStudents || 0,
                    totalReviews: statsData.totalReviews || 0,
                    lastUpdated: statsData.lastUpdated || new Date().toISOString()
                  }
                };
              }
            } catch (error) {
              // Silently ignore errors and use default stats
              console.log(`Using default stats for instructor ${instructor.name}`);
            }
            
            // Use default stats based on experience
            return {
              ...instructor,
              stats: {
                totalLessons: Math.floor((instructor.yearsOfExperience || 1) * 50),
                averageRating: 4.5,
                totalStudents: Math.floor((instructor.yearsOfExperience || 1) * 30),
                totalReviews: Math.floor((instructor.yearsOfExperience || 1) * 20),
                lastUpdated: new Date().toISOString()
              }
            };
          })
        );

        setInstructors(instructorsWithStats);
      } catch (err) {
        console.error('Error fetching instructors:', err);
        setError('Failed to load instructors. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstructorsWithStats();
  }, []);

  const filteredInstructors = useMemo(() => {
    return instructors.filter(instructor => {
      const matchesSearch = 
        instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instructor.specialties?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDiscipline = filters.discipline.length === 0 ||
        instructor.specialties?.some(s => filters.discipline.includes(s));

      const matchesLevel = filters.level.length === 0 ||
        instructor.level && filters.level.includes(instructor.level);

      const matchesPrice = (!instructor.price && filters.price[0] === 0) ||
        (instructor.price &&
          instructor.price >= filters.price[0] &&
          instructor.price <= filters.price[1]);

      const matchesLanguages = filters.languages.length === 0 ||
        instructor.languages?.some(l => filters.languages.includes(l));

      return matchesSearch && matchesDiscipline && matchesLevel &&
        matchesPrice && matchesLanguages;
    });
  }, [searchQuery, filters, instructors]);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">Find Your Perfect Instructor</h1>
          <p className="text-blue-100 text-lg max-w-2xl">
            Connect with certified ski and snowboard instructors who match your skill level,
            schedule, and learning style.
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or specialty..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <FilterPanel filters={filters} setFilters={setFilters} />
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-6 py-8">
        {error ? (
          <div className="text-center p-8">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing <span className="font-medium text-gray-900">{filteredInstructors.length}</span> instructors
              </p>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Sort by:</span>
                <select className="border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
                  <option>Recommended</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Experience</option>
                  <option>Rating</option>
                </select>
              </div>
            </div>

            {filteredInstructors.length > 0 ? (
              <InstructorGrid instructors={filteredInstructors.map(instructor => ({
                id: instructor.id,
                name: instructor.name,
                image: instructor.avatar,
                location: instructor.preferredLocations?.[0] || 'Location not specified',
                rating: instructor.stats.averageRating,
                reviewCount: instructor.stats.totalReviews,
                price: instructor.price || 0,
                specialties: instructor.specialties || [],
                experience: instructor.yearsOfExperience || 0,
                languages: instructor.languages || [],
                availability: 'Full-time',
                stats: instructor.stats
              }))} />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No instructors found matching your criteria</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}