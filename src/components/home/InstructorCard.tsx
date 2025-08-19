import React from 'react';
import { MessageSquare, User2, Star, MapPin, Clock, Award, Snowflake } from 'lucide-react';

interface InstructorCardProps {
  name: string;
  image: string;
  bio: string;
  specialties: string[];
  rating: number;
  lessonsCount: number;
  location?: string;
  experience?: number;
  price?: number;
  certifications?: string[];
}

export function InstructorCard({ 
  name, 
  image, 
  bio, 
  specialties, 
  rating, 
  lessonsCount, 
  location = "Mountain Resort",
  experience = 5,
  price = 75,
  certifications = []
}: InstructorCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 border border-gray-100">
      <div className="relative h-56">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Rating Badge */}
        <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full flex items-center gap-1.5 shadow-lg">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-bold text-gray-900">{rating}</span>
        </div>
        
        {/* Experience Badge */}
        <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-blue-600/90 backdrop-blur-sm rounded-full flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-white" />
          <span className="text-sm font-semibold text-white">{experience}+ years</span>
        </div>
      </div>
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-xl text-gray-900 mb-1">{name}</h3>
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{location}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">${price}</p>
            <p className="text-sm text-gray-500">per hour</p>
          </div>
        </div>
        
        {/* Bio */}
        <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">{bio}</p>
        
        {/* Certifications */}
        {certifications.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-blue-600" />
            <div className="flex flex-wrap gap-1">
              {certifications.slice(0, 2).map((cert, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                >
                  {cert}
                </span>
              ))}
              {certifications.length > 2 && (
                <span className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded-full text-xs font-medium">
                  +{certifications.length - 2}
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Specialties */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {specialties.slice(0, 3).map((specialty, index) => (
            <span
              key={index}
              className="px-2.5 py-1 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-100"
            >
              <Snowflake className="w-3 h-3 inline mr-1" />
              {specialty}
            </span>
          ))}
          {specialties.length > 3 && (
            <span className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium">
              +{specialties.length - 3} more
            </span>
          )}
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between mb-5 p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2">
            <User2 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">{lessonsCount}+ lessons</span>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-3 h-3 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
              />
            ))}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <a 
            href="/book-lesson"
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-md text-center"
          >
            Book Lesson
          </a>
          <a 
            href="/messages"
            className="px-4 py-2.5 border-2 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-600 rounded-xl font-semibold transition-all duration-200 hover:bg-blue-50 flex items-center justify-center"
          >
            <MessageSquare className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
}