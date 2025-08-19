import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Calendar, Clock, User, Filter, X, Snowflake, Mountain, Users, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { User as UserType } from '../../types';
import { AvailabilityCalendar } from '../calendar/AvailabilityCalendar';
import { UnifiedLessonModal } from '../lessons/UnifiedLessonModal';
import { useLessonBooking } from '../../hooks/useLessonBooking';
import { InstructorProfileModal } from '../instructor/InstructorProfileModal';

interface StudentBookingInterfaceProps {
  onBookingComplete?: () => void;
}

interface FilterState {
  searchTerm: string;
  lessonTypes: string[];
  skillLevels: string[];
  priceRange: [number, number];
  locations: string[];
  experienceYears: number[];
}

const LESSON_TYPES = [
  'Freestyle', 'Powder', 'Moguls', 'Racing', 'Beginner', 'Advanced',
  'Children', 'Family', 'Safety Training', 'Backcountry', 'Park & Pipe'
];

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const LOCATIONS = ['Aspen', 'Vail', 'Breckenridge', 'Park City', 'Deer Valley', 'Jackson Hole', 'Big Sky', 'Telluride'];

export function StudentBookingInterface({ onBookingComplete }: StudentBookingInterfaceProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState<UserType[]>([]);
  const [filteredInstructors, setFilteredInstructors] = useState<UserType[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showInstructorProfile, setShowInstructorProfile] = useState(false);
  const [profileInstructor, setProfileInstructor] = useState<any>(null);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    lessonTypes: [],
    skillLevels: [],
    priceRange: [0, 200],
    locations: [],
    experienceYears: []
  });

  const {
    isBookingModalOpen,
    openBookingModal,
    closeBookingModal,
    handleBookingSuccess
  } = useLessonBooking({
    onSuccess: () => {
      onBookingComplete?.();
      setSelectedInstructor(null);
    },
    onError: (error) => setError(error)
  });

  // Enhanced mock data with more lesson types and specialties
  useEffect(() => {
    const mockInstructors: UserType[] = [
      {
        id: '1',
        email: 'sarah@skiinstructor.com',
        name: 'Sarah Johnson',
        role: 'instructor',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        bio: 'Certified ski instructor with 8 years of experience teaching all skill levels. Specialized in freestyle and powder skiing.',
        specialties: ['Freestyle', 'Powder', 'Advanced Techniques', 'Park & Pipe'],
        level: 'expert',
        certifications: ['PSIA Level 3', 'AASI Level 2'],
        languages: ['English', 'Spanish'],
        yearsOfExperience: 8,
        price: 75,
        preferredLocations: ['Aspen', 'Vail', 'Breckenridge'],
        qualifications: 'PSIA Level 3 Certified'
      },
      {
        id: '2',
        email: 'mike@skiinstructor.com',
        name: 'Mike Chen',
        role: 'instructor',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        bio: 'Specialized in teaching children and families. Patient and encouraging approach with safety-first mentality.',
        specialties: ['Children', 'Family', 'Safety Training', 'Beginner'],
        level: 'expert',
        certifications: ['PSIA Level 2', 'Children\'s Specialist'],
        languages: ['English', 'Mandarin'],
        yearsOfExperience: 5,
        price: 65,
        preferredLocations: ['Park City', 'Deer Valley'],
        qualifications: 'PSIA Level 2 Certified, Children\'s Specialist'
      },
      {
        id: '3',
        email: 'emma@skiinstructor.com',
        name: 'Emma Rodriguez',
        role: 'instructor',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        bio: 'Former competitive skier turned instructor. Expert in advanced techniques, racing, and moguls.',
        specialties: ['Racing', 'Moguls', 'Advanced', 'Backcountry'],
        level: 'expert',
        certifications: ['PSIA Level 3', 'Race Coach'],
        languages: ['English', 'French'],
        yearsOfExperience: 12,
        price: 85,
        preferredLocations: ['Jackson Hole', 'Big Sky'],
        qualifications: 'PSIA Level 3 Certified, Race Coach'
      },
      {
        id: '4',
        email: 'jake@skiinstructor.com',
        name: 'Jake Thompson',
        role: 'instructor',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        bio: 'Freestyle specialist with a passion for teaching park and pipe techniques. Former X-Games competitor.',
        specialties: ['Freestyle', 'Park & Pipe', 'Advanced', 'Powder'],
        level: 'expert',
        certifications: ['PSIA Level 2', 'Freestyle Specialist'],
        languages: ['English'],
        yearsOfExperience: 6,
        price: 90,
        preferredLocations: ['Breckenridge', 'Park City'],
        qualifications: 'PSIA Level 2 Certified, Freestyle Specialist'
      },
      {
        id: '5',
        email: 'lisa@skiinstructor.com',
        name: 'Lisa Wang',
        role: 'instructor',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
        bio: 'Backcountry and powder specialist. Certified avalanche instructor with deep knowledge of mountain safety.',
        specialties: ['Backcountry', 'Powder', 'Safety Training', 'Advanced'],
        level: 'expert',
        certifications: ['PSIA Level 3', 'Avalanche Instructor'],
        languages: ['English', 'Mandarin'],
        yearsOfExperience: 10,
        price: 95,
        preferredLocations: ['Jackson Hole', 'Big Sky', 'Telluride'],
        qualifications: 'PSIA Level 3 Certified, Avalanche Instructor'
      },
      {
        id: '6',
        email: 'david@skiinstructor.com',
        name: 'David Martinez',
        role: 'instructor',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        bio: 'Racing coach and mogul specialist. Former Olympic team member with extensive competition experience.',
        specialties: ['Racing', 'Moguls', 'Advanced', 'Expert'],
        level: 'expert',
        certifications: ['PSIA Level 3', 'Race Coach'],
        languages: ['English', 'Spanish'],
        yearsOfExperience: 15,
        price: 100,
        preferredLocations: ['Aspen', 'Vail'],
        qualifications: 'PSIA Level 3 Certified, Olympic Coach'
      }
    ];

    setInstructors(mockInstructors);
    setFilteredInstructors(mockInstructors);
    setIsLoading(false);
  }, []);

  // Enhanced filtering logic
  useEffect(() => {
    let filtered = instructors;

    // Search term filter
    if (filters.searchTerm) {
      filtered = filtered.filter(instructor =>
        instructor.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (instructor.bio && instructor.bio.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        instructor.specialties?.some(specialty => 
          specialty.toLowerCase().includes(filters.searchTerm.toLowerCase())
        ) ||
        instructor.preferredLocations?.some(location => 
          location.toLowerCase().includes(filters.searchTerm.toLowerCase())
        )
      );
    }

    // Lesson types filter
    if (filters.lessonTypes.length > 0) {
      filtered = filtered.filter(instructor =>
        instructor.specialties?.some(specialty =>
          filters.lessonTypes.some(type => 
            specialty.toLowerCase().includes(type.toLowerCase())
          )
        )
      );
    }

    // Skill levels filter
    if (filters.skillLevels.length > 0) {
      filtered = filtered.filter(instructor =>
        instructor.specialties?.some(specialty =>
          filters.skillLevels.some(level => 
            specialty.toLowerCase().includes(level.toLowerCase())
          )
        )
      );
    }

    // Price range filter
    filtered = filtered.filter(instructor =>
      instructor.price && instructor.price >= filters.priceRange[0] && instructor.price <= filters.priceRange[1]
    );

    // Locations filter
    if (filters.locations.length > 0) {
      filtered = filtered.filter(instructor =>
        instructor.preferredLocations?.some(location =>
          filters.locations.includes(location)
        )
      );
    }

    // Experience years filter
    if (filters.experienceYears.length > 0) {
      filtered = filtered.filter(instructor => {
        const experience = instructor.yearsOfExperience || 0;
        return filters.experienceYears.some(year => experience >= year);
      });
    }

    setFilteredInstructors(filtered);
  }, [filters, instructors]);

  const handleFilterChange = (filterType: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const toggleLessonType = (lessonType: string) => {
    setFilters(prev => ({
      ...prev,
      lessonTypes: prev.lessonTypes.includes(lessonType)
        ? prev.lessonTypes.filter(type => type !== lessonType)
        : [...prev.lessonTypes, lessonType]
    }));
  };

  const toggleSkillLevel = (level: string) => {
    setFilters(prev => ({
      ...prev,
      skillLevels: prev.skillLevels.includes(level)
        ? prev.skillLevels.filter(l => l !== level)
        : [...prev.skillLevels, level]
    }));
  };

  const toggleLocation = (location: string) => {
    setFilters(prev => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter(l => l !== location)
        : [...prev.locations, location]
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      lessonTypes: [],
      skillLevels: [],
      priceRange: [0, 200],
      locations: [],
      experienceYears: []
    });
  };

  const handleInstructorSelect = (instructor: UserType) => {
    // Convert UserType to the format expected by InstructorProfileModal
    const profileInstructorData = {
      id: instructor.id,
      name: instructor.name,
      image: instructor.avatar || '',
      location: instructor.preferredLocations?.join(', ') || '',
      rating: 4.9,
      reviewCount: 127,
      price: instructor.price || 0,
      specialties: instructor.specialties || [],
      experience: instructor.yearsOfExperience || 0,
      languages: instructor.languages || [],
      availability: 'Available for lessons'
    };
    
    setProfileInstructor(profileInstructorData);
    setShowInstructorProfile(true);
  };

  const handleBookLesson = (instructor: UserType) => {
    openBookingModal(instructor, 'book');
  };

  const getActiveFiltersCount = () => {
    return (
      (filters.searchTerm ? 1 : 0) +
      filters.lessonTypes.length +
      filters.skillLevels.length +
      filters.locations.length +
      (filters.priceRange[0] > 0 || filters.priceRange[1] < 200 ? 1 : 0)
    );
  };

  // Allow browsing for all users, but show sign-up prompt for non-students
  const isStudent = user && user.role === 'student';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sign-up Prompt for Non-Students */}
      {!isStudent && (
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Snowflake className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Ready to Book Your Ski Lesson?</h3>
                <p className="text-indigo-100">Create a free account to book lessons and save your preferences</p>
              </div>
            </div>
            <button className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
              Sign Up Free
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl shadow-2xl p-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
        <div className="relative">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            Find Your Perfect Ski Lesson
          </h1>
          <p className="text-blue-100 text-xl mb-8 max-w-3xl">
            Discover expert instructors for every skill level and style - from freestyle to powder, racing to backcountry
          </p>
          <div className="flex flex-wrap items-center gap-8">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Snowflake className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">100+ Certified Instructors</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Mountain className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">8 Premier Resorts</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <Award className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">PSIA Certified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Location Selector - Most Important Filter */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-gray-900 text-2xl mb-2">Choose Your Resort</h3>
            <p className="text-gray-600">Select where you'd like to take your lesson</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-3 px-4 py-3 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm"
          >
            <Filter className="w-4 h-4" />
            More Filters
            {getActiveFiltersCount() > 0 && (
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs rounded-full px-2 py-1 font-medium">
                {getActiveFiltersCount()}
              </span>
            )}
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {LOCATIONS.map((location) => (
            <button
              key={location}
              onClick={() => toggleLocation(location)}
              className={`p-6 rounded-2xl border-2 transition-all duration-300 text-center group hover:shadow-lg ${
                filters.locations.includes(location)
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 font-semibold shadow-lg scale-105'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <div className="font-bold text-lg mb-2">{location}</div>
              <div className="text-sm text-gray-500">
                {instructors.filter(instructor => 
                  instructor.preferredLocations?.includes(location)
                ).length} instructors
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => {
              if (filters.locations.length === LOCATIONS.length) {
                setFilters(prev => ({ ...prev, locations: [] }));
              } else {
                setFilters(prev => ({ ...prev, locations: [...LOCATIONS] }));
              }
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors"
          >
            {filters.locations.length === LOCATIONS.length ? 'Clear All Locations' : 'Select All Locations'}
          </button>
        </div>
      </div>

      {/* Quick Lesson Type Filters */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <h3 className="font-bold text-gray-900 text-xl mb-6">Popular Lesson Types</h3>
        <div className="flex flex-wrap gap-3">
          {LESSON_TYPES.slice(0, 6).map((type) => (
            <button
              key={type}
              onClick={() => toggleLessonType(type)}
              className={`px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 hover:scale-105 ${
                filters.lessonTypes.includes(type)
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Search */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                 <input
                   type="text"
                   placeholder="Instructor, specialty, location..."
                   value={filters.searchTerm}
                   onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                   className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 />
               </div>
             </div>

             {/* Lesson Types */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">All Lesson Types</label>
               <div className="space-y-2 max-h-32 overflow-y-auto">
                 {LESSON_TYPES.map((type) => (
                   <label key={type} className="flex items-center">
                     <input
                       type="checkbox"
                       checked={filters.lessonTypes.includes(type)}
                       onChange={() => toggleLessonType(type)}
                       className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                     />
                     <span className="ml-2 text-sm text-gray-700">{type}</span>
                   </label>
                 ))}
               </div>
             </div>

             {/* Skill Levels */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Skill Levels</label>
               <div className="space-y-2">
                 {SKILL_LEVELS.map((level) => (
                   <label key={level} className="flex items-center">
                     <input
                       type="checkbox"
                       checked={filters.skillLevels.includes(level)}
                       onChange={() => toggleSkillLevel(level)}
                       className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                     />
                     <span className="ml-2 text-sm text-gray-700">{level}</span>
                   </label>
                 ))}
               </div>
             </div>
           </div>

          {/* Price Range */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
            </label>
            <div className="flex gap-4 items-center">
              <input
                type="range"
                min="0"
                max="200"
                value={filters.priceRange[0]}
                onChange={(e) => handleFilterChange('priceRange', [parseInt(e.target.value), filters.priceRange[1]])}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="200"
                value={filters.priceRange[1]}
                onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {getActiveFiltersCount() > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-blue-900">Active Filters:</span>
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Search: {filters.searchTerm}
                <button
                  onClick={() => handleFilterChange('searchTerm', '')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.lessonTypes.map((type) => (
              <span key={type} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {type}
                <button
                  onClick={() => toggleLessonType(type)}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.skillLevels.map((level) => (
              <span key={level} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {level}
                <button
                  onClick={() => toggleSkillLevel(level)}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.locations.map((location) => (
              <span key={location} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {location}
                <button
                  onClick={() => toggleLocation(location)}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {filteredInstructors.length} instructor{filteredInstructors.length !== 1 ? 's' : ''} found
        </p>
        {filteredInstructors.length === 0 && (
          <button
            onClick={clearFilters}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Clear filters to see all instructors
          </button>
        )}
      </div>

             {/* Instructor List */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredInstructors.map((instructor) => (
           <div
             key={instructor.id}
             className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-[1.02]"
             onClick={() => handleInstructorSelect(instructor)}
           >
                             <div className="flex items-start justify-between mb-6">
                 <div className="flex items-center gap-4">
                   <div className="relative">
                     {instructor.avatar ? (
                       <img 
                         src={instructor.avatar} 
                         alt={instructor.name}
                         className="w-16 h-16 rounded-2xl object-cover shadow-lg"
                       />
                     ) : (
                       <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                         {instructor.name.split(' ').map(n => n[0]).join('')}
                       </div>
                     )}
                     <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                       <div className="w-2 h-2 bg-white rounded-full"></div>
                     </div>
                   </div>
                   <div>
                     <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                       {instructor.name}
                     </h3>
                     <p className="text-gray-500">{instructor.yearsOfExperience || 0} years experience</p>
                     <div className="flex items-center gap-1 mt-1">
                       <Star className="w-4 h-4 text-yellow-400 fill-current" />
                       <span className="text-sm font-semibold text-gray-700">4.9</span>
                       <span className="text-xs text-gray-500">(127 reviews)</span>
                     </div>
                   </div>
                 </div>
                                   <div className="text-right">
                    <div className="text-sm text-gray-500">Available Now</div>
                  </div>
               </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{instructor.bio}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>{instructor.preferredLocations?.join(', ')}</span>
                </div>
                                 <div className="flex flex-wrap gap-2">
                   {instructor.specialties?.slice(0, 3).map((specialty, index) => (
                     <span
                       key={index}
                       className="px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs rounded-xl font-medium border border-blue-200"
                     >
                       {specialty}
                     </span>
                   ))}
                   {instructor.specialties && instructor.specialties.length > 3 && (
                     <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-xl font-medium">
                       +{instructor.specialties.length - 3} more
                     </span>
                   )}
                 </div>
              </div>

                             <div className="flex gap-3 mt-6">
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     handleInstructorSelect(instructor);
                   }}
                   className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 text-sm font-semibold hover:shadow-md"
                 >
                   View Availability
                 </button>
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     // Navigate to messages with instructor data
                     navigate('/messages', { 
                       state: { 
                         selectedInstructor: {
                           id: instructor.id,
                           name: instructor.name,
                           image: instructor.avatar,
                           location: instructor.preferredLocations?.[0] || 'Location not specified',
                           specialties: instructor.specialties || [],
                           languages: instructor.languages || [],
                           experience: instructor.yearsOfExperience || 0,
                           price: instructor.hourlyRate || 0
                         }
                       }
                     });
                   }}
                   className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                 >
                   Message Instructor
                 </button>
                              </div>
             </div>
           ))}
         </div>

             {/* Booking Modal */}
       {isBookingModalOpen && (
         <UnifiedLessonModal
           isOpen={isBookingModalOpen}
           onClose={closeBookingModal}
           mode="book"
           instructor={selectedInstructor || undefined}
         />
       )}

       {/* Instructor Profile Modal */}
       {showInstructorProfile && profileInstructor && (
         <InstructorProfileModal
           instructor={profileInstructor}
           onClose={() => {
             setShowInstructorProfile(false);
             setProfileInstructor(null);
           }}
         />
       )}
     </div>
   );
 }
