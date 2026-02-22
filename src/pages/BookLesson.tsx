import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  BookOpen,
  History,
  Plus,
  ChevronDown,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  X,
  MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { InstructorGrid } from '../components/instructor/InstructorGrid';
import { FilterPanel } from '../components/instructor/FilterPanel';
import { ActiveLessons } from '../components/lessons/ActiveLessons';
import { UnifiedLessonModal } from '../components/lessons/UnifiedLessonModal';
import { AIMatchingRecommendations } from '../components/instructor/AIMatchingRecommendations';
import { useLessonBooking } from '../hooks/useLessonBooking';
import { getLessonsByStudent, getLessonsByInstructor } from '../services/lessons';
import { collection, query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Lesson, User } from '../types';

const RESORTS = ['Aspen', 'Vail', 'Breckenridge', 'Park City', 'Deer Valley', 'Jackson Hole', 'Big Sky', 'Telluride'];

type TabType = 'browse' | 'active' | 'history';

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

export function BookLesson() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResort, setSelectedResort] = useState<string | null>(null);
  const [instructors, setInstructors] = useState<InstructorWithStats[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoadingInstructors, setIsLoadingInstructors] = useState(true);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    discipline: [] as string[],
    level: [] as string[],
    price: [0, 200],
    availability: [] as string[],
    languages: [] as string[],
    gender: [] as string[],
    certification: [] as string[]
  });

  const {
    isBookingModalOpen,
    selectedInstructor,
    selectedLesson,
    bookingMode,
    openBookingModal,
    closeBookingModal
  } = useLessonBooking({
    onSuccess: () => {
      handleBookingComplete();
    },
    onError: (error) => setError(error)
  });

  // Fetch instructors
  useEffect(() => {
    const fetchInstructorsWithStats = async () => {
      try {
        setIsLoadingInstructors(true);
        setError(null);

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
            email: data.email || '',
            avatar: data.avatar,
            specialties: data.specialties || [],
            languages: data.languages || [],
            yearsOfExperience: data.yearsOfExperience,
            price: data.hourlyRate,
            preferredLocations: data.preferredLocations || [],
            bio: data.bio,
            level: data.level,
            role: 'instructor' as const,
            gender: data.gender || 'Not specified',
            certifications: data.certifications || [],
            stats: {
              totalLessons: 0,
              averageRating: 0,
              totalStudents: 0,
              totalReviews: 0,
              lastUpdated: new Date().toISOString()
            }
          } as InstructorWithStats;
        });

        const instructorsWithStats = await Promise.all(
          fetchedInstructors.map(async (instructor) => {
            try {
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
              console.log(`Using default stats for instructor ${instructor.name}`);
            }
            
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
        setIsLoadingInstructors(false);
      }
    };

    if (activeTab === 'browse') {
      fetchInstructorsWithStats();
    }
  }, [activeTab]);

  // Load lessons for active/history tabs
  useEffect(() => {
    if (user && (activeTab === 'active' || activeTab === 'history')) {
      loadLessons();
    }
  }, [user, activeTab]);

  const loadLessons = async () => {
    if (!user) return;
    
    try {
      setIsLoadingLessons(true);
      setError(null);
      
      let userLessons: Lesson[];
      if (user.role === 'student') {
        userLessons = await getLessonsByStudent(user.id);
      } else if (user.role === 'instructor') {
        userLessons = await getLessonsByInstructor(user.id);
      } else {
        setError('Invalid user role');
        return;
      }

      if (activeTab === 'active') {
        userLessons = userLessons.filter(lesson => 
          lesson.status === 'scheduled' || lesson.status === 'in_progress'
        );
      } else if (activeTab === 'history') {
        userLessons = userLessons.filter(lesson => 
          lesson.status === 'completed' || lesson.status === 'cancelled'
        );
      }

      setLessons(userLessons);
    } catch (err: any) {
      console.error('Error loading lessons:', err);
      setError(err.message || 'Failed to load lessons');
    } finally {
      setIsLoadingLessons(false);
    }
  };

  const handleBookingComplete = () => {
    if (activeTab === 'active') {
      loadLessons();
    }
  };

  const handleLessonComplete = () => {
    loadLessons();
  };

  const filteredInstructors = useMemo(() => {
    return instructors.filter(instructor => {
      const matchesResort = !selectedResort ||
        instructor.preferredLocations?.includes(selectedResort);

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

      const matchesGender = filters.gender.length === 0 ||
        instructor.gender && filters.gender.includes(instructor.gender);

      const matchesCertification = filters.certification.length === 0 ||
        instructor.certifications?.some(c => filters.certification.includes(c));

      return matchesResort && matchesSearch && matchesDiscipline && matchesLevel &&
        matchesPrice && matchesLanguages && matchesGender && matchesCertification;
    });
  }, [searchQuery, filters, instructors, selectedResort]);

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case 'browse':
        return <Search className="w-5 h-5" />;
      case 'active':
        return <Clock className="w-5 h-5" />;
      case 'history':
        return <History className="w-5 h-5" />;
    }
  };

  const getTabLabel = (tab: TabType) => {
    switch (tab) {
      case 'browse':
        return 'Browse Instructors';
      case 'active':
        return 'Active Lessons';
      case 'history':
        return 'Lesson History';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Ski Lessons</h1>
          <p className="text-blue-100 text-base md:text-lg max-w-2xl">
            {user?.role === 'student' 
              ? 'Book lessons with expert instructors and track your progress'
              : 'Manage your lessons and track student progress'
            }
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-16 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex overflow-x-auto scrollbar-hide">
            {(['browse', 'active', 'history'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 py-4 px-4 md:px-6 border-b-2 font-semibold text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {getTabIcon(tab)}
                <span className="hidden sm:inline">{getTabLabel(tab)}</span>
                <span className="sm:hidden">{tab === 'browse' ? 'Browse' : tab === 'active' ? 'Active' : 'History'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Browse Instructors Tab */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            {/* Step 1: Resort Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Choose Your Resort</h3>
              </div>
              
              {/* Mobile Dropdown */}
              <div className="md:hidden">
                <select
                  value={selectedResort || ''}
                  onChange={(e) => setSelectedResort(e.target.value || null)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="">All Resorts</option>
                  {RESORTS.map((resort) => {
                    const instructorCount = instructors.filter(instructor =>
                      instructor.preferredLocations?.includes(resort)
                    ).length;
                    return (
                      <option key={resort} value={resort}>
                        {resort} ({instructorCount} {instructorCount === 1 ? 'instructor' : 'instructors'})
                      </option>
                    );
                  })}
                </select>
                {selectedResort && (
                  <button
                    onClick={() => setSelectedResort(null)}
                    className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear selection
                  </button>
                )}
              </div>

              {/* Desktop Grid */}
              <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-3">
                {RESORTS.map((resort) => {
                  const instructorCount = instructors.filter(instructor =>
                    instructor.preferredLocations?.includes(resort)
                  ).length;
                  
                  return (
                    <button
                      key={resort}
                      onClick={() => setSelectedResort(selectedResort === resort ? null : resort)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-center group hover:shadow-md ${
                        selectedResort === resort
                          ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold shadow-md scale-105'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
                      }`}
                    >
                      <div className="font-bold text-base mb-1">{resort}</div>
                      <div className={`text-xs ${
                        selectedResort === resort
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {instructorCount} {instructorCount === 1 ? 'instructor' : 'instructors'}
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedResort && (
                <div className="hidden md:block mt-4">
                  <button
                    onClick={() => setSelectedResort(null)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear resort selection
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Search and Filter Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name or specialty..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium transition-colors"
                >
                  <Filter className="w-5 h-5" />
                  Filters
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {showFilters && (
                <div className="mt-4">
                  <FilterPanel filters={filters} setFilters={setFilters} />
                </div>
              )}
            </div>

            {/* Step 3: AI Matching Recommendations - Only show for students */}
            {user?.role === 'student' && (
              <AIMatchingRecommendations
                resort={selectedResort || undefined}
                filters={filters}
                searchQuery={searchQuery}
                onInstructorSelect={(instructor) => {
                  openBookingModal(instructor, 'book');
                }}
              />
            )}

            {/* Step 4: All Instructors Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Instructors</h2>
                  {!isLoadingInstructors && (
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredInstructors.length}</span> instructor{filteredInstructors.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Instructors Grid */}
              {isLoadingInstructors ? (
                <div className="flex justify-center items-center min-h-[400px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredInstructors.length > 0 ? (
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
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <Search className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No instructors found</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Lessons Tab */}
        {activeTab === 'active' && (
          <div className="space-y-6">
            {user?.role === 'instructor' ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                <ActiveLessons 
                  instructorId={user.id} 
                  onLessonComplete={handleLessonComplete}
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 md:p-8">
                {isLoadingLessons ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : lessons.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Active Lessons</h2>
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                        {lessons.length}
                      </span>
                    </div>
                    <div className="grid gap-4">
                      {lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{lesson.title}</h3>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">{lesson.description}</p>
                            </div>
                            <div className="flex flex-col items-start md:items-end gap-1">
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Calendar className="w-4 h-4" />
                                <span>{lesson.date}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>{lesson.startTime} - {lesson.endTime}</span>
                              </div>
                              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                ${lesson.price}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              <span className="capitalize">{lesson.type}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Target className="w-4 h-4" />
                              <span className="capitalize">{lesson.skillLevel?.replace('_', ' ')}</span>
                            </div>
                          </div>

                          {lesson.skillsFocus && lesson.skillsFocus.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills Focus:</div>
                              <div className="flex flex-wrap gap-2">
                                {lesson.skillsFocus.map((skill, index) => (
                                  <span
                                    key={index}
                                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Active Lessons</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      You don't have any active lessons scheduled. Book a lesson to get started!
                    </p>
                    <button
                      onClick={() => setActiveTab('browse')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-sm hover:shadow-md"
                    >
                      <Plus className="w-5 h-5" />
                      Browse Instructors
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Lesson History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 md:p-8">
            {isLoadingLessons ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : lessons.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lesson History</h2>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium">
                    {lessons.length}
                  </span>
                </div>
                <div className="grid gap-4">
                  {lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{lesson.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">{lesson.description}</p>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-2">
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>{lesson.date}</span>
                          </div>
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                            lesson.status === 'completed' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }`}>
                            {lesson.status === 'completed' ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            <span className="capitalize">{lesson.status}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          <span className="capitalize">{lesson.type}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Target className="w-4 h-4" />
                          <span className="capitalize">{lesson.skillLevel?.replace('_', ' ')}</span>
                        </div>
                        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          ${lesson.price}
                        </div>
                      </div>

                      {lesson.feedback && lesson.feedback.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Feedback:</div>
                          {lesson.feedback.map((feedback, index) => (
                            <div key={index} className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                              <div className="font-medium mb-1">
                                Performance: {feedback.performance?.overall || 'N/A'}/5
                              </div>
                              {feedback.instructorNotes && (
                                <div className="mt-1 text-gray-500 dark:text-gray-400">{feedback.instructorNotes}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Lesson History</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Complete your first lesson to see your history here.
                </p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-sm hover:shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Browse Instructors
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && selectedInstructor && (
        <UnifiedLessonModal
          isOpen={isBookingModalOpen}
          onClose={closeBookingModal}
          mode={bookingMode}
          instructor={selectedInstructor}
          existingLesson={selectedLesson || undefined}
        />
      )}
    </div>
  );
}
