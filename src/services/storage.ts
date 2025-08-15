import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject, uploadBytes } from 'firebase/storage';

// Fallback upload method using fetch API
async function uploadWithFetch(file: File, userId: string): Promise<string> {
  try {
    console.log('Trying fetch-based upload...');
    
    // Get the current user's ID token
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const token = await user.getIdToken();
    
    // Create a unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `avatar_${timestamp}.${fileExtension}`;
    
    // Create the upload URL
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/concierge-95495.firebasestorage.app/o?name=avatars/${userId}/${fileName}`;
    
    // Upload using fetch
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': file.type,
      },
      body: file
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/concierge-95495.firebasestorage.app/o/${encodeURIComponent(result.name)}?alt=media&token=${result.downloadTokens}`;
    
    console.log('Fetch upload successful:', downloadUrl);
    return downloadUrl;
  } catch (error) {
    console.error('Fetch upload failed:', error);
    throw error;
  }
}

export async function uploadAvatar(
  file: File, 
  userId: string, 
  onProgress?: (progress: number) => void,
  isSignup: boolean = false
): Promise<string> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please upload an image file');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // Create a storage reference with unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `avatar_${timestamp}.${fileExtension}`;
    const storageRef = ref(storage, `avatars/${userId}/${fileName}`);

    console.log('Starting upload for user:', userId);
    console.log('File size:', file.size, 'bytes');
    console.log('File type:', file.type);
    console.log('Is signup:', isSignup);

    // For signup, skip the fetch-based method since user isn't authenticated yet
    const uploadMethods = isSignup ? [
      // Method 1: Simple upload with metadata (no auth required)
      async () => {
        console.log('Trying method 1: Simple upload with metadata...');
        onProgress?.(50);
        const metadata = {
          contentType: file.type,
          customMetadata: {
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
            isSignup: 'true'
          }
        };
        const snapshot = await uploadBytes(storageRef, file, metadata);
        return await getDownloadURL(snapshot.ref);
      },
      
      // Method 2: Basic simple upload (no auth required)
      async () => {
        console.log('Trying method 2: Basic simple upload...');
        onProgress?.(75);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
      },
      
      // Method 3: Resumable upload (no auth required)
      async () => {
        console.log('Trying method 3: Resumable upload...');
        return new Promise((resolve, reject) => {
          const uploadTask = uploadBytesResumable(storageRef, file);
          
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log('Resumable upload progress:', progress + '%');
              onProgress?.(progress);
            },
            (error) => {
              console.error('Resumable upload failed:', error);
              reject(error);
            },
            async () => {
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      }
    ] : [
      // Method 1: Fetch-based upload (bypasses SDK CORS issues)
      async () => {
        console.log('Trying method 1: Fetch-based upload...');
        onProgress?.(25);
        return await uploadWithFetch(file, userId);
      },
      
      // Method 2: Simple upload with metadata
      async () => {
        console.log('Trying method 2: Simple upload with metadata...');
        onProgress?.(50);
        const metadata = {
          contentType: file.type,
          customMetadata: {
            uploadedBy: userId,
            uploadedAt: new Date().toISOString()
          }
        };
        const snapshot = await uploadBytes(storageRef, file, metadata);
        return await getDownloadURL(snapshot.ref);
      },
      
      // Method 3: Basic simple upload
      async () => {
        console.log('Trying method 3: Basic simple upload...');
        onProgress?.(75);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
      },
      
      // Method 4: Resumable upload
      async () => {
        console.log('Trying method 4: Resumable upload...');
        return new Promise((resolve, reject) => {
          const uploadTask = uploadBytesResumable(storageRef, file);
          
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log('Resumable upload progress:', progress + '%');
              onProgress?.(progress);
            },
            (error) => {
              console.error('Resumable upload failed:', error);
              reject(error);
            },
            async () => {
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      }
    ];

    // Try each method until one works
    for (let i = 0; i < uploadMethods.length; i++) {
      try {
        console.log(`Attempting upload method ${i + 1}...`);
        const url = await uploadMethods[i]() as string;
        onProgress?.(100);
        console.log(`Upload method ${i + 1} successful:`, url);
        return url;
      } catch (error) {
        console.error(`Upload method ${i + 1} failed:`, error);
        if (i === uploadMethods.length - 1) {
          // Last method failed
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(`All upload methods failed. Last error: ${errorMessage}. Please check Firebase Storage configuration and try again.`);
        }
      }
    }
    
    // This should never be reached, but TypeScript requires it
    throw new Error('All upload methods failed unexpectedly');
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

// Function to delete an avatar from storage
export async function deleteAvatar(avatarUrl: string): Promise<void> {
  try {
    // Extract the file path from the URL
    const url = new URL(avatarUrl);
    const pathSegments = url.pathname.split('/');
    const filePath = pathSegments.slice(-2).join('/'); // Get the last two segments
    
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting avatar:', error);
    // Don't throw error as this is not critical
  }
}