import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';

export async function getInstructors(): Promise<User[]> {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'instructor')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as User));
}

export async function getStudents(): Promise<User[]> {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'student')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as User));
}

export async function getAllUsers(): Promise<User[]> {
  const q = query(collection(db, 'users'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as User));
}

export async function getUserById(userId: string): Promise<User | null> {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data()
  } as User;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
  await updateDoc(doc(db, 'users', userId), updates);
}

export async function createUser(userData: Omit<User, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'users'), userData);
  return docRef.id;
}