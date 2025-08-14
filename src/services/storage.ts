import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Create a storage reference
      const storageRef = ref(storage, `avatars/${userId}/${Date.now()}_${file.name}`);

      // Upload the file with progress monitoring
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          // Progress monitoring if needed
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        },
        (error) => {
          // Handle unsuccessful uploads
          console.error('Upload error:', error);
          switch (error.code) {
            case 'storage/unauthorized':
              reject(new Error('Permission denied'));
              break;
            case 'storage/canceled':
              reject(new Error('Upload cancelled'));
              break;
            case 'storage/unknown':
              reject(new Error('An error occurred during upload'));
              break;
            default:
              reject(error);
          }
        },
        async () => {
          // Handle successful uploads
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(new Error('Failed to get download URL'));
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}