import { useState, useRef } from 'react';
import { Camera, X, Upload, CheckCircle } from 'lucide-react';
import { ResponsiveModalPanel } from './ResponsiveModalPanel';
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
      <ResponsiveModalPanel onClose={handleSkip} labelledBy="profile-picture-popup-title" maxWidthClass="sm:max-w-md">
        <div className="flex shrink-0 items-center justify-end border-b border-gray-200 bg-white px-2 py-2 dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:inset-x-0 sm:top-0 sm:z-20 sm:border-0 sm:bg-transparent sm:px-4 sm:py-3">
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-6 pt-2 sm:px-6 sm:pb-6 sm:pt-16">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
              <Camera className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2
              id="profile-picture-popup-title"
              className="mb-2 text-2xl font-bold text-gray-900 dark:text-white"
            >
              Welcome to SlopesMaster, {user.name}! 🎿
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
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
            <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={handleSkip}
                disabled={isUploading}
                className="w-full flex-1 px-4 py-2.5 text-gray-600 transition-colors hover:text-gray-900 disabled:opacity-50 dark:text-gray-400 dark:hover:text-white sm:py-2"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex w-full flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 sm:py-2"
              >
                <Upload className="h-4 w-4" />
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

          <div className="mt-6 rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-4 dark:border-yellow-800 dark:from-yellow-950/40 dark:to-orange-950/40">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
                <span className="text-xl">📸</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Profile Picture Achievement</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add a profile picture to unlock this achievement!
                </p>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveModalPanel>

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
