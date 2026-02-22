import { User } from '../types';

function sanitizeAvatar(src?: string | null) {
  if (!src || src.startsWith('blob:')) {
    return 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200&auto=format&fit=crop';
  }
  return src;
}

export function buildInstructorProfile(instructor: User) {
  return {
    id: instructor.id,
    name: instructor.name || 'Instructor',
    image: sanitizeAvatar(instructor.avatar),
    location: instructor.homeMountain || instructor.preferredLocations?.[0] || 'Mountain Resort',
    rating: 4.8,
    reviewCount: 87,
    price: instructor.price ?? instructor.hourlyRate ?? 120,
    specialties: instructor.specialties && instructor.specialties.length > 0 ? instructor.specialties : ['All-Mountain'],
    experience: instructor.yearsOfExperience ?? 5,
    languages: instructor.languages && instructor.languages.length > 0 ? instructor.languages : ['English'],
    availability: 'Weekdays & Weekends'
  };
}



