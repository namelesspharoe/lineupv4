import React, { useState } from 'react';
import { AvatarUpload } from './AvatarUpload';
import { useAuth } from '../../context/AuthContext';

export const AvatarUploadExample: React.FC = () => {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setAvatarUrl(newAvatarUrl);
    console.log('Avatar updated:', newAvatarUrl);
  };

  if (!user) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <p className="text-gray-600 dark:text-gray-400">Please log in to test avatar uploads.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Avatar Upload Examples
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Small Avatar */}
        <div className="text-center">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Small</h3>
          <AvatarUpload
            currentAvatar={avatarUrl}
            userId={user.id}
            onAvatarUpdate={handleAvatarUpdate}
            size="sm"
          />
        </div>

        {/* Medium Avatar */}
        <div className="text-center">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Medium</h3>
          <AvatarUpload
            currentAvatar={avatarUrl}
            userId={user.id}
            onAvatarUpdate={handleAvatarUpdate}
            size="md"
          />
        </div>

        {/* Large Avatar */}
        <div className="text-center">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Large</h3>
          <AvatarUpload
            currentAvatar={avatarUrl}
            userId={user.id}
            onAvatarUpdate={handleAvatarUpdate}
            size="lg"
          />
        </div>
      </div>

      {/* Disabled State */}
      <div className="text-center">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Disabled</h3>
        <AvatarUpload
          currentAvatar={avatarUrl}
          userId={user.id}
          onAvatarUpdate={handleAvatarUpdate}
          size="md"
          disabled={true}
        />
      </div>

      {/* Current Avatar URL */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Current Avatar URL:
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 break-all">
          {avatarUrl || 'No avatar uploaded'}
        </p>
      </div>
    </div>
  );
};
