/**
 * Authentication service that handles user signup, signin, and signout operations.
 * Integrates Firebase Authentication with Firestore for user data management.
 * 
 * This service ensures:
 * - User authentication state is properly managed
 * - User data is consistently stored in both Auth and Firestore
 * - Type safety through proper interfaces
 * - Proper error handling and messaging
 */

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';

/**
 * Creates a new user account with both Firebase Auth and Firestore profile.
 * 
 * @param email - User's email address
 * @param password - User's password (must meet Firebase Auth requirements)
 * @param userData - Additional user profile data excluding the ID
 * @returns Promise<User> - The newly created user object
 * @throws Error if account creation fails
 * 
 * Implementation details:
 * 1. Creates Firebase Auth account
 * 2. Updates Auth profile with name and avatar
 * 3. Creates corresponding Firestore document
 * 4. Handles data sanitization for Firestore
 */
export async function signUp(
  email: string,
  password: string,
  userData: Omit<User, 'id'>
): Promise<User> {
  try {
    // Create Firebase Auth user
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update Auth profile with basic info
    await updateProfile(firebaseUser, {
      displayName: userData.name,
      photoURL: userData.avatar
    });

    // Prepare user data for Firestore with explicit type handling
    const newUser: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      name: userData.name,
      role: userData.role,
      avatar: userData.avatar,
      bio: userData.bio ?? '', // Use nullish coalescing for explicit undefined check
      specialties: Array.isArray(userData.specialties) ? userData.specialties : [],
      level: typeof userData.level === 'string' ? userData.level : '', // Explicit type check
      certifications: Array.isArray(userData.certifications) ? userData.certifications : [],
      languages: Array.isArray(userData.languages) ? userData.languages : [],
      yearsOfExperience: typeof userData.yearsOfExperience === 'number' ? userData.yearsOfExperience : 0,
      hourlyRate: typeof userData.hourlyRate === 'number' ? userData.hourlyRate : 0,
      preferredLocations: Array.isArray(userData.preferredLocations) ? userData.preferredLocations : [],
      qualifications: typeof userData.qualifications === 'string' ? userData.qualifications : ''
    };

    // Create Firestore user document
    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    return newUser;
  } catch (error: unknown) {
    console.error('Error in signUp:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
    throw new Error(errorMessage);
  }
}

/**
 * Authenticates a user with email and password.
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise<User> - The authenticated user's data
 * @throws Error if authentication fails or user data is not found
 * 
 * Implementation details:
 * 1. Authenticates with Firebase Auth
 * 2. Retrieves additional user data from Firestore
 * 3. Combines Auth and Firestore data
 */
export async function signIn(email: string, password: string): Promise<User> {
  try {
    // Authenticate with Firebase
    const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
    
    // Get additional user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }

    return { id: userDoc.id, ...userDoc.data() } as User;
  } catch (error: unknown) {
    console.error('Error in signIn:', error);
    const errorMessage = error instanceof Error ? error.message : 'Invalid email or password';
    throw new Error(errorMessage);
  }
}

/**
 * Signs out the current user.
 * 
 * @returns Promise<void>
 * @throws Error if sign out fails
 * 
 * Implementation details:
 * - Calls Firebase Auth signOut method
 * - Handles any potential errors
 */
export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: unknown) {
    console.error('Error in logout:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
    throw new Error(errorMessage);
  }
}

/**
 * Transforms a Firebase User object into our application's User type.
 * Used for maintaining consistent user data structure throughout the app.
 * 
 * @param fbUser - Firebase User object
 * @returns User - Application User object with default values
 * 
 * Note: This is a utility function primarily used during authentication state changes
 * to provide a consistent user object structure while full data loads.
 */
export function transformFirebaseUser(fbUser: FirebaseUser): User {
  return {
    id: fbUser.uid,
    email: fbUser.email!,
    name: fbUser.displayName!,
    avatar: fbUser.photoURL!,
    role: 'student', // Default role
    bio: '',
    level: 'beginner', // Default level
    specialties: [],
    certifications: [],
    languages: [],
    yearsOfExperience: 0,
    hourlyRate: 0,
    preferredLocations: [],
    qualifications: ''
  };
}