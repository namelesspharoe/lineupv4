import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Calendar, Clock, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { User as UserType } from '../../types';
import { AvailabilityCalendar } from '../calendar/AvailabilityCalendar';
import { UnifiedLessonModal } from '../lessons/UnifiedLessonModal';
import { useLessonBooking } from '../../hooks/useLessonBooking';

interface StudentBookingInterfaceProps {
  onBookingComplete?: () => void;
}

export function StudentBookingInterface({ onBookingComplete }: StudentBookingInterfaceProps) {
  const { user } = useAuth();
  const [instructors, setInstructors] = useState<UserType[]>([]);
  const [filteredInstructors, setFilteredInstructors] = useState<UserType[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Mock data - in a real app, this would come from a service
  useEffect(() => {
    const mockInstructors: UserType[] = [
      {
        id: '1',
        email: 'sarah@skiinstructor.com',
        name: 'Sarah Johnson',
        role: 'instructor',
        avatar: '',
        bio: 'Certified ski instructor with 8 years of experience teaching all skill levels.',
        specialties: ['Beginner Lessons', 'Advanced Techniques', 'Freestyle'],
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
        avatar: '',
        bio: 'Specialized in teaching children and families. Patient and encouraging approach.',
        specialties: ['Children Lessons', 'Family Groups', 'Safety Training'],
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
        avatar: '',
        bio: 'Former competitive skier turned instructor. Expert in advanced techniques and racing.',
        specialties: ['Advanced Techniques', 'Racing', 'Moguls'],
        level: 'expert',
        certifications: ['PSIA Level 3', 'Race Coach'],
        languages: ['English', 'French'],
        yearsOfExperience: 12,
        price: 85,
        preferredLocations: ['Jackson Hole', 'Big Sky'],
        qualifications: 'PSIA Level 3 Certified, Race Coach'
      }
    ];

    setInstructors(mockInstructors);
    setFilteredInstructors(mockInstructors);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const filtered = instructors.filter(instructor =>
      instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.specialties?.some(specialty => 
        specialty.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      instructor.preferredLocations?.some(location => 
        location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredInstructors(filtered);
  }, [searchTerm, instructors]);

  const handleInstructorSelect = (instructor: UserType) => {
    setSelectedInstructor(instructor);
  };

  const handleBookLesson = (instructor: UserType) => {
    openBookingModal(instructor, 'book');
  };

  if (!user || user.role !== 'student') {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">This interface is only available for students.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Book a Ski Lesson</h1>
        <p className="text-gray-600">
          Browse our certified instructors and find the perfect lesson for your skill level.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by instructor name, specialty, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Instructor List */}
      {!selectedInstructor ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstructors.map((instructor) => (
            <div
              key={instructor.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleInstructorSelect(instructor)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{instructor.name}</h3>
                    <p className="text-sm text-gray-500">{instructor.yearsOfExperience} years experience</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">${instructor.price}/hr</div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">4.9</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{instructor.bio}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>{instructor.preferredLocations?.join(', ')}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {instructor.specialties?.slice(0, 3).map((specialty, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInstructorSelect(instructor);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  View Calendar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBookLesson(instructor);
                  }}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Instructor Calendar View */
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedInstructor(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ← Back to Instructors
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedInstructor.name}</h2>
                  <p className="text-gray-600">{selectedInstructor.bio}</p>
                </div>
              </div>
              <button
                onClick={() => handleBookLesson(selectedInstructor)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Book Lesson
              </button>
            </div>
          </div>

          <AvailabilityCalendar
            instructor={selectedInstructor}
            viewMode="student"
            onLessonCreated={() => {
              // Refresh calendar data
            }}
          />
        </div>
      )}

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <UnifiedLessonModal
          isOpen={isBookingModalOpen}
          onClose={closeBookingModal}
          mode="book"
          instructor={selectedInstructor || undefined}
        />
      )}
    </div>
  );
}
