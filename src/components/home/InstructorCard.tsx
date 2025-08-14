import React from 'react';
import { MessageSquare, User2, Star } from 'lucide-react';

interface InstructorCardProps {
  name: string;
  image: string;
  bio: string;
  specialties: string[];
  rating: number;
  lessonsCount: number;
}

export function InstructorCard({ name, image, bio, specialties, rating, lessonsCount }: InstructorCardProps) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg transform hover:scale-[1.02] transition-transform">
      <div className="relative h-48">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-medium">{rating}</span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-900">{name}</h3>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <User2 className="w-3 h-3" />
            <span>{lessonsCount}+</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{bio}</p>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {specialties.slice(0, 2).map((specialty, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium"
            >
              {specialty}
            </span>
          ))}
          {specialties.length > 2 && (
            <span className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded-full text-xs font-medium">
              +{specialties.length - 2}
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <button className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            View Profile
          </button>
          <button className="px-3 py-1.5 border border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors">
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}