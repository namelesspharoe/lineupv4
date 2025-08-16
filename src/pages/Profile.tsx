import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { InstructorProfile, AdminProfile, StudentProfile } from '../components/profile';
import { getUserById } from '../services/users';
import { User } from '../types';

export function Profile() {
  const { user, updateUser } = useAuth();
  const { userId } = useParams<{ userId?: string }>();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If userId is provided, fetch that user's profile
  useEffect(() => {
    if (userId && userId !== user?.id) {
      const fetchUser = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedUser = await getUserById(userId);
          setProfileUser(fetchedUser);
        } catch (err) {
          console.error('Error fetching user:', err);
          setError('User not found');
        } finally {
          setIsLoading(false);
        }
      };
      fetchUser();
    } else {
      setProfileUser(user);
    }
  }, [userId, user]);

  // Use profileUser if available, otherwise use current user
  const displayUser = profileUser || user;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You must be logged in to view your profile.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !displayUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Profile Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {error || 'The requested profile could not be found.'}
          </p>
        </div>
      </div>
    );
  }

  // Determine if the profile is editable (only if viewing own profile)
  const isEditable = !userId || userId === user.id;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {userId && userId !== user.id ? `${displayUser.name}'s Profile` : 'Profile'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {userId && userId !== user.id 
            ? `Viewing ${displayUser.name}'s profile information`
            : 'Manage your account information and preferences'
          }
        </p>
      </div>

      {displayUser.role === 'admin' && (
        <AdminProfile 
          admin={displayUser} 
          isEditable={isEditable}
          onUpdate={(updatedUser) => {
            if (isEditable) {
              updateUser(updatedUser);
              console.log('Admin profile updated:', updatedUser);
            }
          }}
        />
      )}

      {displayUser.role === 'instructor' && (
        <InstructorProfile 
          instructor={displayUser} 
          isEditable={isEditable}
          onUpdate={(updatedUser) => {
            if (isEditable) {
              updateUser(updatedUser);
              console.log('Instructor profile updated:', updatedUser);
            }
          }}
        />
      )}

      {displayUser.role === 'student' && (
        <StudentProfile 
          student={displayUser} 
          isEditable={isEditable}
          onUpdate={(updatedUser) => {
            if (isEditable) {
              updateUser(updatedUser);
              console.log('Student profile updated:', updatedUser);
            }
          }}
        />
      )}
    </div>
  );
}
