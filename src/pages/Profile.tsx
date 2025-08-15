import React from 'react';
import { useAuth } from '../context/AuthContext';
import { InstructorProfile, AdminProfile, StudentProfile } from '../components/profile';

export function Profile() {
  const { user, updateUser } = useAuth();

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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account information and preferences
        </p>
      </div>

      {user.role === 'admin' && (
        <AdminProfile 
          admin={user} 
          isEditable={true}
          onUpdate={(updatedUser) => {
            updateUser(updatedUser);
            console.log('Admin profile updated:', updatedUser);
          }}
        />
      )}

      {user.role === 'instructor' && (
        <InstructorProfile 
          instructor={user} 
          isEditable={true}
          onUpdate={(updatedUser) => {
            updateUser(updatedUser);
            console.log('Instructor profile updated:', updatedUser);
          }}
        />
      )}

      {user.role === 'student' && (
        <StudentProfile 
          student={user} 
          isEditable={true}
          onUpdate={(updatedUser) => {
            updateUser(updatedUser);
            console.log('Student profile updated:', updatedUser);
          }}
        />
      )}
    </div>
  );
}
