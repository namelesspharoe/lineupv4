import React from 'react';
import { User as UserIcon, Edit, Save, X, Crown, Medal, Trophy } from 'lucide-react';
import { User } from '../../../types';
import { AvatarUpload } from '../../common/AvatarUpload';
import { InstructorStats } from '../../../services/instructorStats';

interface ProfileHeaderProps {
  instructor: User;
  editedProfile: User;
  isEditable: boolean;
  isEditing: boolean;
  enhancedStats: InstructorStats | null;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onAvatarUpdate: (avatarUrl: string) => void;
}

// Tier colors and icons
const tierConfig = {
  bronze: { color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Medal },
  silver: { color: 'text-gray-600', bgColor: 'bg-gray-50', icon: Medal },
  gold: { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Trophy },
  platinum: { color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Crown },
  diamond: { color: 'text-purple-600', bgColor: 'bg-purple-50', icon: Crown }
};

export function ProfileHeader({
  instructor,
  editedProfile,
  isEditable,
  isEditing,
  enhancedStats,
  onEdit,
  onSave,
  onCancel,
  onAvatarUpdate
}: ProfileHeaderProps) {
  // Get tier configuration
  const tier = enhancedStats?.tier || 'bronze';
  const tierInfo = tierConfig[tier];

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        {isEditable ? (
          <AvatarUpload
            currentAvatar={editedProfile.avatar}
            userId={instructor.id}
            onAvatarUpdate={onAvatarUpdate}
            size="md"
          />
        ) : (
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {instructor.avatar ? (
                <img 
                  src={instructor.avatar} 
                  alt={instructor.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-10 h-10 text-white" />
              )}
            </div>
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {instructor.name}
            </h1>
            {enhancedStats && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${tierInfo.bgColor} ${tierInfo.color}`}>
                <tierInfo.icon className="w-3 h-3 inline mr-1" />
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </span>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            {instructor.bio || 'No bio available'}
          </p>
        </div>
      </div>
      
      {isEditable && (
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={onSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={onCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      )}
    </div>
  );
}


