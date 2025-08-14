import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDoc,
  arrayUnion,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TimeEntry } from '../types';

export async function clockIn(
  lessonId: string,
  instructorId: string,
  verificationMethod: 'manual' = 'manual'
): Promise<string> {
  try {
    const timeEntry: Omit<TimeEntry, 'id'> = {
      lessonId,
      instructorId,
      clockIn: new Date().toISOString(),
      verificationMethod,
      status: 'active',
      breaks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'timeEntries'), timeEntry);
    return docRef.id;
  } catch (error) {
    console.error('Error in clockIn:', error);
    throw new Error('Failed to clock in');
  }
}

export async function clockOut(timeEntryId: string): Promise<void> {
  try {
    const clockOutTime = new Date();
    const timeEntryRef = doc(db, 'timeEntries', timeEntryId);
    
    await updateDoc(timeEntryRef, {
      clockOut: clockOutTime.toISOString(),
      status: 'completed',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in clockOut:', error);
    throw new Error('Failed to clock out');
  }
}

export async function startBreak(timeEntryId: string): Promise<void> {
  try {
    const timeEntryRef = doc(db, 'timeEntries', timeEntryId);
    const breakStartTime = new Date().toISOString();
    
    await updateDoc(timeEntryRef, {
      breaks: arrayUnion({
        startTime: breakStartTime,
        endTime: null,
        duration: 0
      }),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error starting break:', error);
    throw new Error('Failed to start break');
  }
}

export async function endBreak(timeEntryId: string): Promise<void> {
  try {
    const timeEntryRef = doc(db, 'timeEntries', timeEntryId);
    const breakEndTime = new Date().toISOString();
    
    // Get current breaks array
    const timeEntrySnap = await getDoc(timeEntryRef);
    const breaks = timeEntrySnap.data()?.breaks || [];
    const lastBreak = breaks[breaks.length - 1];
    
    if (lastBreak && !lastBreak.endTime) {
      const duration = (new Date(breakEndTime).getTime() - new Date(lastBreak.startTime).getTime()) / 1000 / 60;
      lastBreak.endTime = breakEndTime;
      lastBreak.duration = duration;
      
      await updateDoc(timeEntryRef, {
        breaks,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error ending break:', error);
    throw new Error('Failed to end break');
  }
}

export async function getActiveTimeEntry(instructorId: string): Promise<TimeEntry | null> {
  try {
    const q = query(
      collection(db, 'timeEntries'),
      where('instructorId', '==', instructorId),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as TimeEntry;
  } catch (error) {
    console.error('Error getting active time entry:', error);
    throw new Error('Failed to get active time entry');
  }
}

export async function getTimeEntries(
  instructorId: string,
  startTime: Date,
  endTime: Date
): Promise<TimeEntry[]> {
  try {
    const q = query(
      collection(db, 'timeEntries'),
      where('instructorId', '==', instructorId),
      where('createdAt', '>=', startTime.toISOString()),
      where('createdAt', '<=', endTime.toISOString()),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TimeEntry[];
  } catch (error) {
    console.error('Error getting time entries:', error);
    throw new Error('Failed to get time entries');
  }
}

export async function updateTimeEntryNotes(
  timeEntryId: string,
  notes: string
): Promise<void> {
  try {
    const timeEntryRef = doc(db, 'timeEntries', timeEntryId);
    await updateDoc(timeEntryRef, {
      notes,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating time entry notes:', error);
    throw new Error('Failed to update time entry notes');
  }
}

export async function disputeTimeEntry(
  timeEntryId: string,
  reason: string
): Promise<void> {
  try {
    const timeEntryRef = doc(db, 'timeEntries', timeEntryId);
    await updateDoc(timeEntryRef, {
      status: 'disputed',
      'verificationData.disputeReason': reason,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error disputing time entry:', error);
    throw new Error('Failed to dispute time entry');
  }
}