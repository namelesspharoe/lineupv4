import { collection, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Lesson } from '../types';
import type { LessonBookingDraft } from '../types/cart';
import { getMountains, getMountainForInstructor, getMountainLessonPriceForLessonType } from './mountains';
import { getUserById } from './users';
import { getInstructorDailyLessons } from './lessons';
import { getSessionType, lessonHours, timeRangesOverlap } from '../utils/lessonBookingMath';

/**
 * Books one or more lessons from cart drafts (student-only, no payment).
 * Validates resort pricing, minimum amount, and instructor time conflicts.
 */
export async function bookStudentLessonsFromDrafts(
  studentId: string,
  drafts: LessonBookingDraft[]
): Promise<void> {
  if (!drafts.length) {
    throw new Error('Cart is empty');
  }
  if (drafts.length > 25) {
    throw new Error('Too many items');
  }

  const userSnap = await getDoc(doc(db, 'users', studentId));
  if (!userSnap.exists()) {
    throw new Error('User not found');
  }
  const role = (userSnap.data() as { role?: string }).role;
  if (role !== 'student') {
    throw new Error('Only students can book lessons this way');
  }

  const mountains = await getMountains();

  type Built = {
    lesson: Omit<Lesson, 'id'>;
    draft: LessonBookingDraft;
  };

  const built: Built[] = [];

  for (const draft of drafts) {
    if (
      !draft.title ||
      !draft.instructorId ||
      !draft.date ||
      !draft.startTime ||
      !draft.endTime
    ) {
      throw new Error('Invalid lesson line');
    }

    const instructor = await getUserById(draft.instructorId);
    if (!instructor) {
      throw new Error('Instructor not found');
    }

    const mountain = getMountainForInstructor(instructor, mountains);
    if (!mountain) {
      throw new Error('Instructor is not assigned to a resort');
    }

    const hourly = getMountainLessonPriceForLessonType(mountain, draft.type);
    if (hourly == null || hourly <= 0) {
      throw new Error('Could not resolve price for a lesson. Check resort pricing.');
    }

    const hours = lessonHours(draft.startTime, draft.endTime);
    if (hours <= 0) {
      throw new Error('Invalid time range');
    }

    const totalUsd = hourly * hours;
    const amountCents = Math.round(totalUsd * 100);
    if (amountCents < 50) {
      throw new Error('Amount too small');
    }

    const sessionType = getSessionType(draft.startTime, draft.endTime);

    const lesson: Omit<Lesson, 'id'> = {
      title: draft.title,
      instructorId: draft.instructorId,
      date: draft.date,
      sport: draft.sport ?? 'skiing',
      sessionType,
      startTime: draft.startTime,
      endTime: draft.endTime,
      status: 'scheduled',
      type: draft.type,
      maxStudents: draft.maxStudents,
      skillLevel: draft.skillLevel,
      price: hourly,
      description: draft.description,
      skillsFocus: draft.skillsFocus ?? [],
      notes: draft.notes ?? '',
      studentIds: [studentId]
    };

    if (draft.kidProfileIds?.length) {
      lesson.kidProfileIds = draft.kidProfileIds;
    }
    if (draft.participantChildNames?.length) {
      lesson.participantChildNames = draft.participantChildNames;
    }

    built.push({ lesson, draft });
  }

  // Conflicts among cart lines (same instructor + date)
  for (let i = 0; i < built.length; i++) {
    for (let j = i + 1; j < built.length; j++) {
      const a = built[i].lesson;
      const b = built[j].lesson;
      if (
        a.instructorId === b.instructorId &&
        a.date === b.date &&
        a.startTime &&
        a.endTime &&
        b.startTime &&
        b.endTime &&
        timeRangesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)
      ) {
        throw new Error('Cart items overlap for the same instructor');
      }
    }
  }

  // Conflicts with existing lessons
  for (const { lesson } of built) {
    const existing = await getInstructorDailyLessons(lesson.instructorId, lesson.date);
    const conflict = existing.some((l) => {
      if (!l.startTime || !l.endTime || !lesson.startTime || !lesson.endTime) return false;
      return timeRangesOverlap(
        lesson.startTime,
        lesson.endTime,
        l.startTime,
        l.endTime
      );
    });
    if (conflict) {
      throw new Error('That time slot is no longer available');
    }
  }

  const batch = writeBatch(db);
  const now = serverTimestamp();

  for (const { lesson } of built) {
    const ref = doc(collection(db, 'lessons'));
    batch.set(ref, {
      ...lesson,
      createdAt: now,
      updatedAt: now
    });
  }

  await batch.commit();
}
