import React, { useState, useRef } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import { uploadAvatar } from '../../services/storage';

interface AvatarUploadProps {
  currentAvatar?: string;
  userId: string;
  onAvatarUpdate: (avatarUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  userId,
  onAvatarUpdate,
  size = 'md',
  className = '',
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create a temporary preview
      const reader = new FileReader();
      reader.onload = (e) => {
        // You could show a preview here if needed
      };
      reader.readAsDataURL(file);

      // Upload to Firebase Storage
      const avatarUrl = await uploadAvatar(file, userId, (progress) => {
        setUploadProgress(progress);
      });
      onAvatarUpdate(avatarUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = () => {
    onAvatarUpdate('');
    setError(null);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Avatar Display */}
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center`}>
        {currentAvatar ? (
          <img
            src={currentAvatar}
            alt="Profile"
            className={`${sizeClasses[size]} object-cover`}
          />
        ) : (
          <Camera className={`${iconSizes[size]} text-white`} />
        )}

        {/* Upload Progress Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-sm font-medium">{uploadProgress}%</div>
              <div className="text-xs">Uploading...</div>
            </div>
          </div>
        )}

        {/* Upload Button */}
        {!disabled && !isUploading && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
            title="Upload new photo"
          >
            <Upload className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Remove Button (only show if there's an avatar) */}
        {currentAvatar && !disabled && !isUploading && (
          <button
            type="button"
            onClick={handleRemoveAvatar}
            className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
            title="Remove photo"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* Upload Instructions */}
      {!currentAvatar && !disabled && !isUploading && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          Click to upload photo
        </p>
      )}
    </div>
  );
};
