import React, { useState, useRef } from 'react';
import { Camera, X, Upload, CheckCircle } from 'lucide-react';
import { uploadAvatar } from '../../services/storage';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { achievementService } from '../../services/achievements';
import { AchievementNotification } from '../gamification/AchievementNotification';

interface ProfilePicturePopupProps {
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  onClose: () => void;
  onUpdate: (avatarUrl: string) => void;
}

export function ProfilePicturePopup({ user, onClose, onUpdate }: ProfilePicturePopupProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievement, setAchievement] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      // Upload to Firebase Storage
      const downloadUrl = await uploadAvatar(file, user.id, (progress) => {
        setUploadProgress(progress);
      });

      // Update user profile in Firestore
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        avatar: downloadUrl
      });

      // Update local state
      onUpdate(downloadUrl);

      // Award achievement for adding profile picture
      try {
        const newAchievements = await achievementService.checkAndAwardAchievements(user.id);
        if (newAchievements.length > 0) {
          setAchievement(newAchievements[0]);
          setShowAchievement(true);
        }
      } catch (err) {
        console.error('Error awarding achievement:', err);
      }

      // Close popup after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleSkip} />
        
        <div className="relative min-h-screen flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome to SlopesMaster, {user.name}! 🎿
                </h2>
                <p className="text-gray-600">
                  Add a profile picture to personalize your experience and earn your first achievement!
                </p>
              </div>

              <div className="space-y-4">
                {/* Current Avatar Preview */}
                <div className="flex justify-center">
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="text-white text-sm font-medium">{uploadProgress}%</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Success Message */}
                {uploadProgress === 100 && !error && (
                  <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Profile picture uploaded successfully!
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSkip}
                    disabled={isUploading}
                    className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                  >
                    Skip for now
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {isUploading ? 'Uploading...' : 'Add Photo'}
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Achievement Preview */}
              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📸</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Profile Picture Achievement</h3>
                    <p className="text-sm text-gray-600">Add a profile picture to unlock this achievement!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Notification */}
      {showAchievement && achievement && (
        <AchievementNotification
          achievement={achievement}
          onClose={() => setShowAchievement(false)}
          autoClose={true}
          autoCloseDelay={4000}
        />
      )}
    </>
  );
}
