/**
 * Server-side mirror of client mountain pricing (see src/services/mountains.ts).
 */

export interface MountainDoc {
  id: string;
  name: string;
  mountainId?: string;
  privateLessonPrice?: number;
  groupLessonPrice?: number;
}

export interface UserDoc {
  mountainId?: string;
  homeMountain?: string;
}

export type LessonType = 'private' | 'group' | 'workshop';

export function getMountainForInstructor(
  instructor: UserDoc,
  mountains: MountainDoc[]
): MountainDoc | null {
  const byId = instructor.mountainId
    ? mountains.find((m) => m.id === instructor.mountainId)
    : undefined;
  const hm = instructor.homeMountain?.trim().toLowerCase();
  const byName = hm
    ? mountains.find((m) => m.name.trim().toLowerCase() === hm)
    : undefined;
  return byId || byName || null;
}

export function getMountainLessonPriceForLessonType(
  mountain: MountainDoc,
  lessonType: LessonType
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

export function resolveHourlyRateFromMountain(
  instructor: UserDoc,
  mountains: MountainDoc[],
  lessonType: LessonType
): number | null {
  const mountain = getMountainForInstructor(instructor, mountains);
  if (!mountain) return null;
  const n = getMountainLessonPriceForLessonType(mountain, lessonType);
  return n > 0 ? n : null;
}

export function getSessionType(
  startTime: string,
  endTime: string
): 'morning' | 'afternoon' | 'full_day' {
  if (startTime === '09:00' && endTime === '12:00') return 'morning';
  if (startTime === '13:00' && endTime === '16:00') return 'afternoon';
  if (startTime === '09:00' && endTime === '17:00') return 'full_day';
  return 'morning';
}

export function lessonHours(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}
