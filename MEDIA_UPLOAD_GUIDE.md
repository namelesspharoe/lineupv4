# Media Upload Guide

This guide explains how to handle media uploads in your Firebase-powered application, specifically for profile pictures and other media files.

## Overview

The application uses Firebase Storage for media uploads with the following features:
- File validation (type and size)
- Progress tracking
- Error handling
- Automatic cleanup
- Reusable components

## Firebase Storage Setup

### 1. Firebase Configuration

Your Firebase configuration is already set up in `src/lib/firebase.ts`:

```typescript
import { getStorage } from 'firebase/storage';

const storage = getStorage(app);
export { storage };
```

### 2. Storage Rules

Make sure your Firebase Storage rules allow authenticated users to upload files:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload avatars
    match /avatars/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to upload message attachments
    match /messages/{fileName} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Storage Service

The main storage service is located at `src/services/storage.ts`:

### Key Functions

#### `uploadAvatar(file: File, userId: string, onProgress?: (progress: number) => void): Promise<string>`

Uploads a profile picture for a user.

**Parameters:**
- `file`: The image file to upload
- `userId`: The user's ID for organizing files
- `onProgress`: Optional callback for upload progress

**Returns:** Promise that resolves to the download URL

**Features:**
- Validates file type (images only)
- Validates file size (max 5MB)
- Generates unique filenames
- Provides progress tracking
- Comprehensive error handling

#### `deleteAvatar(avatarUrl: string): Promise<void>`

Deletes an avatar from storage.

**Parameters:**
- `avatarUrl`: The URL of the avatar to delete

## AvatarUpload Component

A reusable component for handling avatar uploads is available at `src/components/common/AvatarUpload.tsx`.

### Usage

```tsx
import { AvatarUpload } from '../common/AvatarUpload';

function ProfileComponent() {
  const [avatarUrl, setAvatarUrl] = useState(user.avatar);

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setAvatarUrl(newAvatarUrl);
    // Update user in database
  };

  return (
    <AvatarUpload
      currentAvatar={avatarUrl}
      userId={user.id}
      onAvatarUpdate={handleAvatarUpdate}
      size="md"
      disabled={false}
    />
  );
}
```

### Props

- `currentAvatar?: string` - Current avatar URL
- `userId: string` - User ID for file organization
- `onAvatarUpdate: (avatarUrl: string) => void` - Callback when avatar is updated
- `size?: 'sm' | 'md' | 'lg'` - Avatar size (default: 'md')
- `className?: string` - Additional CSS classes
- `disabled?: boolean` - Whether upload is disabled (default: false)

### Features

- **Visual Feedback**: Shows upload progress overlay
- **Error Handling**: Displays error messages
- **Remove Functionality**: Allows removing current avatar
- **Responsive Design**: Works on all screen sizes
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Integration Examples

### 1. Profile Pages

The profile components (`StudentProfile`, `InstructorProfile`, `AdminProfile`) have been updated to use the `AvatarUpload` component when in edit mode.

### 2. Signup Forms

The signup forms already include avatar upload functionality using the storage service.

### 3. Admin User Management

Admin components for creating/editing users can use the `AvatarUpload` component for profile picture management.

## File Organization

Files are organized in Firebase Storage as follows:

```
avatars/
├── userId1/
│   ├── avatar_1234567890.jpg
│   └── avatar_1234567891.png
├── userId2/
│   └── avatar_1234567892.jpg
└── ...

messages/
├── message_attachment_1.jpg
├── message_attachment_2.pdf
└── ...
```

## Best Practices

### 1. File Validation

Always validate files before upload:
- Check file type (use MIME type)
- Check file size
- Consider image dimensions for avatars

### 2. Error Handling

Provide meaningful error messages to users:
- Network errors
- File size exceeded
- Unsupported file type
- Permission denied

### 3. Progress Feedback

Show upload progress to improve user experience:
- Progress bar or percentage
- Upload status (uploading, success, error)

### 4. Cleanup

Delete old files when replacing them:
- Use the `deleteAvatar` function
- Consider implementing automatic cleanup for unused files

### 5. Security

- Validate file types on both client and server
- Use Firebase Security Rules
- Limit file sizes
- Consider virus scanning for uploaded files

## Example Implementation

Here's a complete example of implementing avatar upload in a component:

```tsx
import React, { useState } from 'react';
import { AvatarUpload } from '../common/AvatarUpload';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

function UserProfile({ user, onUpdate }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleAvatarUpdate = async (avatarUrl: string) => {
    try {
      setIsUploading(true);
      setError(null);

      // Update user document in Firestore
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { avatar: avatarUrl });

      // Update local state
      onUpdate({ ...user, avatar: avatarUrl });
    } catch (err) {
      setError('Failed to update profile picture');
      console.error('Error updating avatar:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <AvatarUpload
        currentAvatar={user.avatar}
        userId={user.id}
        onAvatarUpdate={handleAvatarUpdate}
        size="lg"
        disabled={isUploading}
      />
      
      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}
      
      {isUploading && (
        <p className="text-blue-600 text-sm mt-2">Updating profile...</p>
      )}
    </div>
  );
}
```

## Testing

You can test the avatar upload functionality using the `AvatarUploadExample` component:

```tsx
import { AvatarUploadExample } from '../components/common/AvatarUploadExample';

// In your test page or component
<AvatarUploadExample />
```

This component demonstrates different sizes and states of the avatar upload functionality.

## Troubleshooting

### Common Issues

1. **Upload fails with "Permission denied"**
   - Check Firebase Storage rules
   - Ensure user is authenticated
   - Verify user ID matches the file path

2. **File size too large**
   - Check the 5MB limit in the storage service
   - Consider implementing client-side image compression

3. **File type not supported**
   - Ensure file is an image (MIME type starts with 'image/')
   - Check browser support for the file format

4. **Progress not showing**
   - Verify the `onProgress` callback is being called
   - Check that the progress state is being updated

### Debug Tips

- Check browser console for error messages
- Verify Firebase Storage rules in Firebase Console
- Test with different file types and sizes
- Check network tab for failed requests

## Future Enhancements

Consider implementing these features:

1. **Image Compression**: Compress images before upload
2. **Image Cropping**: Allow users to crop their avatars
3. **Multiple File Upload**: Support for multiple files
4. **Drag and Drop**: Drag and drop file upload
5. **Preview**: Show image preview before upload
6. **Batch Operations**: Upload multiple files at once
7. **CDN Integration**: Use a CDN for faster image delivery
