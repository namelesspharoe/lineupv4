import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  and,
  or,
  arrayUnion,
  getDoc,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Lesson, LessonFeedback, StudentReview } from '../types';
import { format } from 'date-fns';
import { progressService } from './progress';

export async function getLessonsByStudent(studentId: string): Promise<Lesson[]> {
  const q = query(
    collection(db, 'lessons'),
    where('studentIds', 'array-contains', studentId)
  );
  
  const snapshot = await getDocs(q);
  const lessons = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Lesson));

  // Populate feedback data for each lesson
  const lessonsWithFeedback = await Promise.all(
    lessons.map(async (lesson) => {
      // Handle feedback as array of IDs (which is how it's stored in Firestore)
      const feedbackIds = lesson.feedback as string[] | undefined;
      
      if (feedbackIds && Array.isArray(feedbackIds) && feedbackIds.length > 0) {
        try {
          // Get the actual feedback documents
          const feedbackPromises = feedbackIds.map(async (feedbackId: string) => {
            const feedbackDoc = await getDoc(doc(db, 'lessonFeedback', feedbackId));
            if (feedbackDoc.exists()) {
              return { id: feedbackDoc.id, ...feedbackDoc.data() } as LessonFeedback;
            }
            return null;
          });
          
          const feedbackData = await Promise.all(feedbackPromises);
          const validFeedback = feedbackData.filter(f => f !== null);
          
          return {
            ...lesson,
            feedback: validFeedback
          };
        } catch (error) {
          console.error('Error loading feedback for lesson:', lesson.id, error);
          return lesson;
        }
      }
      return lesson;
    })
  );

  return lessonsWithFeedback;
}

export async function getLessonsByInstructor(instructorId: string): Promise<Lesson[]> {
  const q = query(
    collection(db, 'lessons'),
    where('instructorId', '==', instructorId)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Lesson));
}

export async function getInstructorDailyLessons(
  instructorId: string,
  date: string
): Promise<Lesson[]> {
  const q = query(
    collection(db, 'lessons'),
    where('instructorId', '==', instructorId),
    where('date', '==', date),
    where('status', 'in', ['available', 'scheduled', 'in_progress', 'booked'])
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Lesson));
}

// Simplified lesson creation function
export async function createLesson(lessonData: Omit<Lesson, 'id'>): Promise<string> {
  console.log('createLesson called with:', lessonData);
  
  // Basic validation
  if (!lessonData.title || !lessonData.instructorId || !lessonData.date) {
    throw new Error('Missing required fields: title, instructorId, or date');
  }
  
  if (!lessonData.startTime || !lessonData.endTime) {
    throw new Error('Missing required fields: startTime or endTime');
  }
  
  // Validate time format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(lessonData.startTime) || !timeRegex.test(lessonData.endTime)) {
    throw new Error('Invalid time format. Use HH:MM format');
  }
  
  // Validate start time is before end time
  const start = new Date(`2000-01-01T${lessonData.startTime}`);
  const end = new Date(`2000-01-01T${lessonData.endTime}`);
  if (start >= end) {
    throw new Error('Start time must be before end time');
  }
  
  // Validate price
  if (typeof lessonData.price !== 'number' || lessonData.price < 0) {
    throw new Error('Price must be a non-negative number');
  }
  
  // Validate maxStudents
  if (typeof lessonData.maxStudents !== 'number' || lessonData.maxStudents < 1) {
    throw new Error('maxStudents must be a positive number');
  }
  
  // Check for time conflicts (simplified)
  try {
    const existingLessons = await getInstructorDailyLessons(
      lessonData.instructorId,
      lessonData.date
    );
    
    const hasConflict = existingLessons.some(lesson => {
      if (!lesson.startTime || !lesson.endTime) return false;
      
      const newStart = new Date(`2000-01-01T${lessonData.startTime}`);
      const newEnd = new Date(`2000-01-01T${lessonData.endTime}`);
      const lessonStart = new Date(`2000-01-01T${lesson.startTime}`);
      const lessonEnd = new Date(`2000-01-01T${lesson.endTime}`);
      
      return (
        (newStart >= lessonStart && newStart < lessonEnd) ||
        (newEnd > lessonStart && newEnd <= lessonEnd) ||
        (newStart <= lessonStart && newEnd >= lessonEnd)
      );
    });
    
    if (hasConflict) {
      throw new Error('Time slot conflicts with existing lesson');
    }
  } catch (error) {
    // If conflict check fails, log but continue (for now)
    console.warn('Could not check for time conflicts:', error);
  }
  
  const lessonWithTimestamp = {
    ...lessonData,
    studentIds: lessonData.studentIds || [],
    skillsFocus: lessonData.skillsFocus || [],
    notes: lessonData.notes || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  console.log('About to add document to Firestore with data:', lessonWithTimestamp);
  
  try {
    const docRef = await addDoc(collection(db, 'lessons'), lessonWithTimestamp);
    console.log('Successfully created lesson with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Firestore error details:', error);
    if (error instanceof Error) {
      console.error('Error code:', (error as { code?: string }).code);
      console.error('Error message:', error.message);
    }
    throw error;
  }
}

export async function updateLesson(
  lessonId: string, 
  updates: Partial<Lesson>
): Promise<void> {
  try {
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(db, 'lessons', lessonId), updatesWithTimestamp);
  } catch (error) {
    console.error('Error updating lesson:', error);
    throw new Error('Failed to update lesson');
  }
}

export async function addLessonFeedback(
  lessonId: string,
  feedback: Omit<LessonFeedback, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    console.log('Adding lesson feedback:', { lessonId, feedback });
    
    // Validate required fields
    if (!feedback.studentId || !feedback.instructorId || !feedback.lessonId) {
      throw new Error('Missing required fields: studentId, instructorId, or lessonId');
    }
    
    // Clean up feedback data to remove undefined values
    const cleanFeedback = JSON.parse(JSON.stringify(feedback));
    
    // Add feedback to separate collection for better querying
    const feedbackRef = collection(db, 'lessonFeedback');
    const feedbackWithTimestamp = {
      ...cleanFeedback,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Feedback with timestamp:', feedbackWithTimestamp);
    
    const docRef = await addDoc(feedbackRef, feedbackWithTimestamp);
    console.log('Feedback document created:', docRef.id);
    
    // Update lesson with feedback reference
    const lessonRef = doc(db, 'lessons', lessonId);
    await updateDoc(lessonRef, {
      feedback: arrayUnion(docRef.id),
      updatedAt: serverTimestamp()
    });
    console.log('Lesson updated with feedback reference');
    
    // Update student progress based on feedback data
    await updateStudentProgressFromFeedback(feedback);
    console.log('Student progress updated');
    
    // Check for achievements after progress update
    try {
      const { achievementService } = await import('./achievements');
      await achievementService.checkAndAwardAchievements(feedback.studentId);
      console.log('Achievements checked');
    } catch (achievementError) {
      console.error('Error checking achievements:', achievementError);
      // Don't throw here, as achievements are not critical for feedback submission
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding lesson feedback:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to add feedback: ${error.message}`);
    }
    throw new Error('Failed to add feedback');
  }
}

// New function to update student progress based on feedback
async function updateStudentProgressFromFeedback(feedback: Omit<LessonFeedback, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  try {
    console.log('Updating student progress from feedback:', feedback.studentId);
    
    const batch = writeBatch(db);
    
    // Get current student progress
    const progressRef = collection(db, 'studentProgress');
    const progressQuery = query(progressRef, where('studentId', '==', feedback.studentId));
    const progressSnapshot = await getDocs(progressQuery);
    
    let currentProgress: any;
    let progressDocRef: any;
    
    if (progressSnapshot.empty) {
      console.log('Creating new progress document for student:', feedback.studentId);
      // Create new progress document
      progressDocRef = doc(collection(db, 'studentProgress'));
      currentProgress = {
        studentId: feedback.studentId,
        name: '', // Will be filled from user data if needed
        level: feedback.skillAssessment.currentLevel,
        totalLessons: 1,
        completedLessons: 1,
        skillProgress: {
          skiing: {
            level: 0,
            progress: 0,
            skills: [],
            lastUpdated: new Date().toISOString()
          },
          snowboarding: {
            level: 0,
            progress: 0,
            skills: [],
            lastUpdated: new Date().toISOString()
          }
        },
        achievements: [],
        streakDays: 1,
        totalPoints: 0,
        lastActivity: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
    } else {
      console.log('Updating existing progress document for student:', feedback.studentId);
      // Update existing progress
      const progressDoc = progressSnapshot.docs[0];
      progressDocRef = doc(db, 'studentProgress', progressDoc.id);
      currentProgress = progressDoc.data();
      
      // Update lesson counts
      currentProgress.totalLessons = (currentProgress.totalLessons || 0) + 1;
      currentProgress.completedLessons = (currentProgress.completedLessons || 0) + 1;
    }
    
    // Update skill progress based on feedback
    const levelMap = {
      'first_time': 0,
      'developing_turns': 1,
      'linking_turns': 2,
      'confident_turns': 3,
      'consistent_blue': 4
    };
    
    const newLevel = levelMap[feedback.skillAssessment.currentLevel as keyof typeof levelMap] || 0;
    const currentLevel = levelMap[currentProgress.level as keyof typeof levelMap] || 0;
    
    // Update overall level if improved
    if (newLevel > currentLevel) {
      currentProgress.level = feedback.skillAssessment.currentLevel;
    }
    
    // Update skill progress for the specific sport
    const sport = feedback.sport || 'skiing'; // Default to skiing if not specified
    const skillProgress = Math.min(100, Math.max(0, (feedback.performance.overall / 5) * 100));
    
    // Ensure skillProgress object exists
    if (!currentProgress.skillProgress) {
      currentProgress.skillProgress = {
        skiing: { level: 0, progress: 0, skills: [], lastUpdated: new Date().toISOString() },
        snowboarding: { level: 0, progress: 0, skills: [], lastUpdated: new Date().toISOString() }
      };
    }
    
    // Update the specific sport's progress
    currentProgress.skillProgress[sport] = {
      level: newLevel,
      progress: skillProgress,
      skills: [
        ...(currentProgress.skillProgress[sport]?.skills || []),
        ...feedback.progressUpdate.skillsImproved,
        ...feedback.progressUpdate.newSkillsLearned
      ].filter((skill, index, arr) => arr.indexOf(skill) === index), // Remove duplicates
      lastUpdated: new Date().toISOString()
    };
    
    // Update last activity
    currentProgress.lastActivity = new Date().toISOString();
    currentProgress.lastUpdated = new Date().toISOString();
    
    // Update or create progress document
    if (progressSnapshot.empty) {
      batch.set(progressDocRef, currentProgress);
    } else {
      batch.update(progressDocRef, currentProgress);
    }
    
    // Add skill progress entry for tracking
    const skillProgressRef = collection(db, 'skillProgress');
    
    // Add progress entry for the specific sport
    const sportProgressRef = doc(skillProgressRef);
    batch.set(sportProgressRef, {
      studentId: feedback.studentId,
      skillName: sport,
      currentLevel: newLevel,
      previousLevel: currentProgress.skillProgress[sport]?.level || 0,
      progress: skillProgress,
      skills: currentProgress.skillProgress[sport]?.skills || [],
      progressDate: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    await batch.commit();
    console.log('Student progress updated successfully');
  } catch (error) {
    console.error('Error updating student progress from feedback:', error);
    throw error;
  }
}

export async function getLessonFeedback(lessonId: string): Promise<LessonFeedback[]> {
  try {
    const feedbackRef = collection(db, 'lessonFeedback');
    const q = query(feedbackRef, where('lessonId', '==', lessonId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LessonFeedback[];
  } catch (error) {
    console.error('Error getting lesson feedback:', error);
    throw new Error('Failed to get feedback');
  }
}

export async function getStudentFeedback(studentId: string): Promise<LessonFeedback[]> {
  try {
    const feedbackRef = collection(db, 'lessonFeedback');
    const q = query(
      feedbackRef, 
      where('studentId', '==', studentId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LessonFeedback[];
  } catch (error) {
    console.error('Error getting student feedback:', error);
    throw new Error('Failed to get student feedback');
  }
}

export async function addStudentReview(
  lessonId: string,
  review: StudentReview
): Promise<void> {
  try {
    const lessonRef = doc(db, 'lessons', lessonId);
    await updateDoc(lessonRef, {
      studentReviews: arrayUnion(review),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding student review:', error);
    throw new Error('Failed to add review');
  }
}

export async function startLesson(lessonId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'lessons', lessonId), {
      status: 'in_progress',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error starting lesson:', error);
    throw new Error('Failed to start lesson');
  }
}

export async function completeLesson(lessonId: string): Promise<void> {
  try {
    // Get lesson details to update progress for all students
    const lessonRef = doc(db, 'lessons', lessonId);
    const lessonDoc = await getDoc(lessonRef);
    
    if (!lessonDoc.exists()) {
      throw new Error('Lesson not found');
    }
    
    const lesson = lessonDoc.data() as Lesson;
    
    // Update lesson status
    await updateDoc(lessonRef, {
      status: 'completed',
      updatedAt: serverTimestamp()
    });
    
    // Update progress for all students in the lesson
    for (const studentId of lesson.studentIds) {
      try {
        await progressService.updateProgressAfterLesson(lessonId, studentId);
      } catch (error) {
        console.error(`Error updating progress for student ${studentId}:`, error);
        // Continue with other students even if one fails
      }
    }
  } catch (error) {
    console.error('Error completing lesson:', error);
    throw new Error('Failed to complete lesson');
  }
}

export async function deleteLesson(lessonId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'lessons', lessonId));
  } catch (error) {
    console.error('Error deleting lesson:', error);
    throw new Error('Failed to delete lesson');
  }
}