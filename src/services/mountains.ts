import {
  addDoc,
  collection,
  deleteField,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Mountain, User, type Lesson } from '../types';
import { getUserById } from './users';

type MountainInput = Omit<Mountain, 'id' | 'createdAt' | 'updatedAt' | 'instructorIds'> & {
  instructorIds?: string[];
};

export async function getMountains(): Promise<Mountain[]> {
  const q = query(collection(db, 'mountains'), orderBy('name'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((mountainDoc) => ({
    id: mountainDoc.id,
    ...mountainDoc.data()
  } as Mountain));
}

export async function getMountainById(mountainId: string): Promise<Mountain | null> {
  const mountainSnap = await getDoc(doc(db, 'mountains', mountainId));

  if (!mountainSnap.exists()) {
    return null;
  }

  return {
    id: mountainSnap.id,
    ...mountainSnap.data()
  } as Mountain;
}

export async function createMountain(mountainData: MountainInput): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, 'mountains'), {
    ...mountainData,
    instructorIds: mountainData.instructorIds ?? [],
    privateLessonPrice: mountainData.privateLessonPrice ?? 0,
    groupLessonPrice: mountainData.groupLessonPrice ?? 0,
    createdAt: now,
    updatedAt: now
  });

  return docRef.id;
}

export async function updateMountain(mountainId: string, updates: Partial<Mountain>): Promise<void> {
  await updateDoc(doc(db, 'mountains', mountainId), {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

/** Partial doc update (e.g. `deleteField()` for clearing optional snow fields). */
export async function patchMountain(mountainId: string, patch: Record<string, unknown>): Promise<void> {
  await updateDoc(doc(db, 'mountains', mountainId), {
    ...patch,
    updatedAt: new Date().toISOString()
  });
}

/** Student browse: deepest reported base first, then 24h snowfall, then name. */
export function sortMountainsForStudentBrowse(mountains: Mountain[]): Mountain[] {
  return [...mountains].sort((a, b) => {
    const baseA = a.baseDepthInches ?? -1;
    const baseB = b.baseDepthInches ?? -1;
    if (baseB !== baseA) return baseB - baseA;
    const snowA = a.snowfall24hInches ?? -1;
    const snowB = b.snowfall24hInches ?? -1;
    if (snowB !== snowA) return snowB - snowA;
    return a.name.localeCompare(b.name);
  });
}

export function mountainsHaveSnowReportData(mountains: Mountain[]): boolean {
  return mountains.some(
    (m) => m.baseDepthInches != null || m.snowfall24hInches != null
  );
}

export async function deleteMountain(mountainId: string): Promise<void> {
  await deleteDoc(doc(db, 'mountains', mountainId));
}

export async function assignInstructorToMountain(instructorId: string, mountainId: string): Promise<void> {
  const userRef = doc(db, 'users', instructorId);
  const targetMountainRef = doc(db, 'mountains', mountainId);

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const targetMountainSnap = await transaction.get(targetMountainRef);

    if (!userSnap.exists()) {
      throw new Error('Instructor not found');
    }

    if (!targetMountainSnap.exists()) {
      throw new Error('Mountain not found');
    }

    const userData = userSnap.data() as User;
    const targetMountain = targetMountainSnap.data() as Mountain;

    if (userData.role !== 'instructor') {
      throw new Error('Only instructors can be assigned to mountains');
    }

    const previousMountainId = userData.mountainId;

    if (previousMountainId && previousMountainId !== mountainId) {
      const previousMountainRef = doc(db, 'mountains', previousMountainId);
      const previousMountainSnap = await transaction.get(previousMountainRef);

      if (previousMountainSnap.exists()) {
        const previousMountain = previousMountainSnap.data() as Mountain;
        transaction.update(previousMountainRef, {
          instructorIds: previousMountain.instructorIds.filter((id) => id !== instructorId),
          updatedAt: new Date().toISOString()
        });
      }
    }

    transaction.update(targetMountainRef, {
      instructorIds: targetMountain.instructorIds.includes(instructorId)
        ? targetMountain.instructorIds
        : [...targetMountain.instructorIds, instructorId],
      updatedAt: new Date().toISOString()
    });

    transaction.update(userRef, {
      mountainId,
      homeMountain: targetMountain.name
    });
  });
}

export async function unassignInstructorFromMountain(instructorId: string): Promise<void> {
  const userRef = doc(db, 'users', instructorId);

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);

    if (!userSnap.exists()) {
      throw new Error('Instructor not found');
    }

    const userData = userSnap.data() as User;
    const currentMountainId = userData.mountainId;

    if (currentMountainId) {
      const mountainRef = doc(db, 'mountains', currentMountainId);
      const mountainSnap = await transaction.get(mountainRef);

      if (mountainSnap.exists()) {
        const mountain = mountainSnap.data() as Mountain;
        transaction.update(mountainRef, {
          instructorIds: mountain.instructorIds.filter((id) => id !== instructorId),
          updatedAt: new Date().toISOString()
        });
      }
    }

    transaction.update(userRef, {
      homeMountain: '',
      mountainId: deleteField()
    });
  });
}

/**
 * Browse / AI resort filter: instructor counts as belonging to a selected mountain if any of:
 * - `mountains/{selectedId}.instructorIds` contains their user id (admin assignment roster)
 * - `users.mountainId` equals the selected mountain Firestore doc id
 * - `users.homeMountain` equals the mountain display name (case-insensitive trim)
 * - `users.preferredLocations` includes that name (case-insensitive)
 *
 * Firestore expectations:
 * - **users** (instructors): `role` must be exactly `"instructor"` for queries; optional `mountainId`,
 *   `homeMountain`, `preferredLocations` (hourlyRate/price are admin–instructor only, not shown to students on Book Lesson)
 * - **mountains**: `name`, `instructorIds[]`, optional `privateLessonPrice` / `groupLessonPrice`
 */
export function instructorMatchesMountainSelection(
  instructor: Pick<User, 'id' | 'mountainId' | 'homeMountain' | 'preferredLocations'>,
  selectedMountainId: string,
  selectedMountainName: string,
  allMountains: Mountain[]
): boolean {
  const doc = allMountains.find((m) => m.id === selectedMountainId);
  if (doc?.instructorIds?.includes(instructor.id)) {
    return true;
  }
  if (instructor.mountainId === selectedMountainId) {
    return true;
  }
  const targetName = selectedMountainName.trim().toLowerCase();
  if (!targetName) {
    return false;
  }
  const home = instructor.homeMountain?.trim().toLowerCase();
  if (home && home === targetName) {
    return true;
  }
  return (
    instructor.preferredLocations?.some(
      (loc) => loc.trim().toLowerCase() === targetName
    ) ?? false
  );
}

/** Resolve the instructor's primary mountain from profile (`mountainId` or `homeMountain` name). */
export function getMountainForInstructor(
  instructor: Pick<User, 'mountainId' | 'homeMountain'>,
  mountains: Mountain[]
): Mountain | null {
  const byId = instructor.mountainId
    ? mountains.find((m) => m.id === instructor.mountainId)
    : undefined;
  const hm = instructor.homeMountain?.trim().toLowerCase();
  const byName = hm
    ? mountains.find((m) => m.name.trim().toLowerCase() === hm)
    : undefined;
  return byId || byName || null;
}

/**
 * Price for a lesson type from a mountain doc (admin / edit forms).
 * Workshop falls back to group, then private.
 */
export function getMountainLessonPriceForLessonType(
  mountain: Mountain,
  lessonType: Lesson['type']
): number {
  if (lessonType === 'private') {
    const n = mountain.privateLessonPrice;
    return n != null && n > 0 ? n : 0;
  }
  if (lessonType === 'group') {
    const n = mountain.groupLessonPrice;
    return n != null && n > 0 ? n : 0;
  }
  const g = mountain.groupLessonPrice;
  if (g != null && g > 0) return g;
  const p = mountain.privateLessonPrice;
  return p != null && p > 0 ? p : 0;
}

/**
 * When `lesson.price` is missing or zero, load the instructor and use their mountain's
 * private/group/workshop rate (same source as student booking).
 */
export async function resolveLessonPriceFromMountain(
  lesson: Pick<Lesson, 'price' | 'instructorId' | 'type'>
): Promise<number | null> {
  if (lesson.price != null && lesson.price > 0) return lesson.price;
  if (!lesson.instructorId) return null;
  const instructor = await getUserById(lesson.instructorId);
  if (!instructor) return null;
  const mountains = await getMountains();
  const mountain = getMountainForInstructor(instructor, mountains);
  if (!mountain) return null;
  const n = getMountainLessonPriceForLessonType(mountain, lesson.type);
  return n > 0 ? n : null;
}

/**
 * Student-facing lesson rate: **only** from the linked mountain doc (private, then group).
 * Never uses instructor `hourlyRate` / `price` — those are admin–instructor only.
 */
export function getStudentFacingMountainLessonRate(
  instructor: Pick<User, 'mountainId' | 'homeMountain'>,
  mountains: Mountain[]
): number | null {
  const mountain = getMountainForInstructor(instructor, mountains);
  if (!mountain) return null;
  const priv = mountain.privateLessonPrice;
  const group = mountain.groupLessonPrice;
  if (priv != null && priv > 0) return priv;
  if (group != null && group > 0) return group;
  return null;
}

/** Label for instructor cards / badges (Book Lesson). */
export function formatStudentMountainRateBadge(rate: number | null): string {
  if (rate != null && rate > 0) return `From $${rate}/hr`;
  return 'Resort pricing';
}
