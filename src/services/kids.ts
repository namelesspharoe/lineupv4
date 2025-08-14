import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { KidProfile } from '../types';

export async function getKidProfiles(parentId: string): Promise<KidProfile[]> {
  try {
    const q = query(
      collection(db, 'kid_profiles'),
      where('parentId', '==', parentId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as KidProfile[];
  } catch (error) {
    console.error('Error fetching kid profiles:', error);
    throw new Error('Failed to fetch kid profiles');
  }
}

export async function createKidProfile(profile: Omit<KidProfile, 'id' | 'created_at' | 'updated_at'>): Promise<KidProfile> {
  try {
    const profileData = {
      ...profile,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'kid_profiles'), profileData);
    return {
      id: docRef.id,
      ...profileData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as KidProfile;
  } catch (error) {
    console.error('Error creating kid profile:', error);
    throw new Error('Failed to create kid profile');
  }
}

export async function updateKidProfile(id: string, updates: Partial<KidProfile>): Promise<void> {
  try {
    const docRef = doc(db, 'kid_profiles', id);
    await updateDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating kid profile:', error);
    throw new Error('Failed to update kid profile');
  }
}

export async function deleteKidProfile(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'kid_profiles', id));
  } catch (error) {
    console.error('Error deleting kid profile:', error);
    throw new Error('Failed to delete kid profile');
  }
}