import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format } from 'date-fns';

export interface Availability {
  id: string;
  instructorId: string;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}


export async function getAvailabilityByInstructorId(instructorId: string): Promise<Availability[]> {
  try {
    const q = query(
      collection(db, 'instructorAvailability'),
      where('instructorId', '==', instructorId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Availability[];
  } catch (error) {
    console.error('Error getting availability:', error);
    throw new Error('Failed to get availability');
  }
}

export async function getInstructorAvailability(
  instructorId: string,
  date: string
): Promise<Availability[]> {
  try {
    const q = query(
      collection(db, 'instructorAvailability'),
      where('instructorId', '==', instructorId),
      where('date', '==', date)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Availability[];
  } catch (error) {
    console.error('Error getting instructor availability:', error);
    throw new Error('Failed to get instructor availability');
  }
}

export async function createAvailabilityBatch(
  instructorId: string,
  dates: Date[],
  startTime: string,
  endTime: string
): Promise<void> {
  try {
    // Validate inputs
    if (!instructorId) {
      throw new Error('Instructor ID is required');
    }
    
    if (!dates || dates.length === 0) {
      throw new Error('At least one date is required');
    }
    
    if (!startTime || !endTime) {
      throw new Error('Start time and end time are required');
    }
    
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new Error('Invalid time format. Use HH:MM format');
    }
    
    // Validate start time is before end time
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    if (start >= end) {
      throw new Error('Start time must be before end time');
    }

    // Create a new batch
    const batch = writeBatch(db);

    // Format dates as YYYY-MM-DD strings
    const formattedDates = dates.map(date => format(date, 'yyyy-MM-dd'));

    // Firestore 'in' query limit is 10, so batch the deletes
    const chunkSize = 10;
    for (let i = 0; i < formattedDates.length; i += chunkSize) {
      const chunk = formattedDates.slice(i, i + chunkSize);
      const existingQuery = query(
        collection(db, 'instructorAvailability'),
        where('instructorId', '==', instructorId),
        where('date', 'in', chunk)
      );
      const existingDocs = await getDocs(existingQuery);
      existingDocs.forEach(doc => {
        batch.delete(doc.ref);
      });
    }

    // Then add new availability records
    for (const date of formattedDates) {
      const docRef = doc(collection(db, 'instructorAvailability'));
      const availabilityData = {
        instructorId,
        date,
        startTime,
        endTime,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      batch.set(docRef, availabilityData);
    }

    // Commit the batch
    await batch.commit();
  } catch (error) {
    console.error('Error creating availability batch:', error);
    throw new Error('Failed to create availability');
  }
}

export async function deleteAvailabilityForDates(
  instructorId: string,
  dates: Date[]
): Promise<void> {
  try {
    if (!instructorId) {
      throw new Error('Instructor ID is required');
    }
    
    if (!dates || dates.length === 0) {
      throw new Error('At least one date is required');
    }

    const batch = writeBatch(db);
    
    // Format dates for comparison
    const formattedDatesToDelete = dates.map(date => format(date, 'yyyy-MM-dd'));

    // Query existing availability records
    const q = query(
      collection(db, 'instructorAvailability'),
      where('instructorId', '==', instructorId),
      where('date', 'in', formattedDatesToDelete)
    );
    
    const snapshot = await getDocs(q);
    
    // Delete each matching document
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error deleting availability:', error);
    throw new Error('Failed to delete availability');
  }
}

export async function checkAvailabilityConflicts(
  instructorId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  try {
    // Check for existing availability on the same date
    const availabilityQuery = query(
      collection(db, 'instructorAvailability'),
      where('instructorId', '==', instructorId),
      where('date', '==', date)
    );
    
    const availabilitySnapshot = await getDocs(availabilityQuery);
    
    // Check for time conflicts with existing availability
    for (const doc of availabilitySnapshot.docs) {
      const existing = doc.data();
      if (existing.startTime && existing.endTime) {
        const existingStart = new Date(`2000-01-01T${existing.startTime}`);
        const existingEnd = new Date(`2000-01-01T${existing.endTime}`);
        const newStart = new Date(`2000-01-01T${startTime}`);
        const newEnd = new Date(`2000-01-01T${endTime}`);
        
        // Check for overlap
        if (
          (newStart >= existingStart && newStart < existingEnd) ||
          (newEnd > existingStart && newEnd <= existingEnd) ||
          (newStart <= existingStart && newEnd >= existingEnd)
        ) {
          return true; // Conflict found
        }
      }
    }
    
    return false; // No conflicts
  } catch (error) {
    console.error('Error checking availability conflicts:', error);
    return false; // Assume no conflict if check fails
  }
}