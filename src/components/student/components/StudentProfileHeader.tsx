import React from 'react';
import { X, User, TrendingUp, Target, Zap, Trophy } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  image: string;
  email: string;
  level: string;
  bio?: string;
  phone?: string;
  address?: string;
  homeMountain?: string;
  createdAt?: string;
}

interface StudentProfileHeaderProps {
  student: Student;
  onClose: () => void;
}

// Level colors and progression
const levelConfig = {
  first_time: { 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-50', 
    icon: User,
    name: 'First Time',
    description: 'Just getting started'
  },
  developing_turns: { 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50', 
    icon: TrendingUp,
    name: 'Developing Turns',
    description: 'Learning the basics'
  },
  linking_turns: { 
    color: 'text-green-600', 
    bgColor: 'bg-green-50', 
    icon: Target,
    name: 'Linking Turns',
    description: 'Connecting movements'
  },
  confident_turns: { 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-50', 
    icon: Zap,
    name: 'Confident Turns',
    description: 'Building confidence'
  },
  consistent_blue: { 
    color: 'text-indigo-600', 
    bgColor: 'bg-indigo-50', 
    icon: Trophy,
    name: 'Consistent Blue',
    description: 'Mastering blue runs'
  }
};

export function StudentProfileHeader({ student, onClose }: StudentProfileHeaderProps) {
  const levelInfo = levelConfig[student.level as keyof typeof levelConfig] || levelConfig.first_time;

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
            {student.image ? (
              <img 
                src={student.image} 
                alt={student.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-white" />
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {student.name}
            </h1>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${levelInfo.bgColor} ${levelInfo.color}`}>
              <levelInfo.icon className="w-3 h-3 inline mr-1" />
              {levelInfo.name}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            {student.bio || 'Student'}
          </p>
          {student.homeMountain && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Home Mountain: {student.homeMountain}
            </p>
          )}
        </div>
      </div>
      
      <button
        onClick={onClose}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  );
}


