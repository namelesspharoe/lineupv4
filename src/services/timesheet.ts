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
  verificationMethod: 'manual' = 'manual',
  hourlyRate?: number
): Promise<string> {
  try {
    const timeEntry: Omit<TimeEntry, 'id'> = {
      lessonId,
      instructorId,
      clockIn: new Date().toISOString(),
      verificationMethod,
      status: 'active',
      breaks: [],
      hourlyRate: hourlyRate || 50, // Default $50/hour if not provided
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
    
    // Get the time entry to calculate earnings
    const timeEntrySnap = await getDoc(timeEntryRef);
    const timeEntry = timeEntrySnap.data();
    
    if (!timeEntry) {
      throw new Error('Time entry not found');
    }
    
    // Calculate total work time (excluding breaks)
    const clockInTime = new Date(timeEntry.clockIn);
    const totalWorkTimeMs = clockOutTime.getTime() - clockInTime.getTime();
    
    // Calculate total break time
    const totalBreakTimeMs = timeEntry.breaks?.reduce((total: number, breakPeriod: any) => {
      if (breakPeriod.duration) {
        return total + (breakPeriod.duration * 60 * 1000); // Convert minutes to milliseconds
      }
      return total;
    }, 0) || 0;
    
    // Calculate actual work time (total time minus breaks)
    const actualWorkTimeMs = totalWorkTimeMs - totalBreakTimeMs;
    const actualWorkHours = actualWorkTimeMs / (1000 * 60 * 60);
    
    // Get instructor's hourly rate (you might want to fetch this from user profile)
    // For now, we'll use a default rate or calculate from lesson price
    const hourlyRate = timeEntry.hourlyRate || 50; // Default $50/hour
    
    // Calculate total earnings
    const totalEarnings = actualWorkHours * hourlyRate;
    
    await updateDoc(timeEntryRef, {
      clockOut: clockOutTime.toISOString(),
      status: 'completed',
      hourlyRate,
      totalEarnings: Math.round(totalEarnings * 100) / 100, // Round to 2 decimal places
      updatedAt: new Date().toISOString()
    });

    // Save timesheet data to calendar
    try {
      await saveTimesheetToCalendar(timeEntryRef.id);
    } catch (calendarError) {
      console.warn('Failed to save to calendar, but clock out was successful:', calendarError);
      // Don't throw error here as clock out was successful
    }
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

export async function getTimeEntriesByInstructor(instructorId: string, date: string): Promise<TimeEntry[]> {
  try {
    // Get all time entries for the instructor
    const q = query(
      collection(db, 'timeEntries'),
      where('instructorId', '==', instructorId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    // Filter by date (time entries that started on the specified date)
    const timeEntries = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TimeEntry[];
    
    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.clockIn).toISOString().split('T')[0];
      return entryDate === date;
    });
  } catch (error) {
    console.error('Error getting time entries by instructor and date:', error);
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

export async function saveTimesheetToCalendar(timeEntryId: string): Promise<void> {
  try {
    // Get the time entry
    const timeEntryRef = doc(db, 'timeEntries', timeEntryId);
    const timeEntrySnap = await getDoc(timeEntryRef);
    const timeEntry = timeEntrySnap.data() as TimeEntry;

    if (!timeEntry || timeEntry.status !== 'completed') {
      throw new Error('Time entry not found or not completed');
    }

    // Create availability entry for the time period
    const clockInDate = new Date(timeEntry.clockIn);
    const clockOutDate = new Date(timeEntry.clockOut!);
    
    // Format times for availability
    const startTime = clockInDate.toTimeString().slice(0, 5); // HH:MM format
    const endTime = clockOutDate.toTimeString().slice(0, 5); // HH:MM format
    
    // Create availability for the specific date
    const availabilityDate = clockInDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Prepare availability data, only including defined values
    const availabilityData: any = {
      instructorId: timeEntry.instructorId,
      date: availabilityDate,
      startTime,
      endTime,
      source: 'timesheet',
      timeEntryId: timeEntryId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Only add optional fields if they have values
    if (timeEntry.hourlyRate !== undefined) {
      availabilityData.hourlyRate = timeEntry.hourlyRate;
    }
    if (timeEntry.totalEarnings !== undefined) {
      availabilityData.totalEarnings = timeEntry.totalEarnings;
    }
    
    console.log('Saving availability data:', availabilityData);
    
    // Add to availability collection
    await addDoc(collection(db, 'instructorAvailability'), availabilityData);

    console.log('Timesheet data saved to calendar successfully');
  } catch (error) {
    console.error('Error saving timesheet to calendar:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      details: (error as any)?.details
    });
    throw new Error('Failed to save timesheet to calendar');
  }
}