import type { User, Lesson, TimeEntry, Mountain } from '../../../../types';
import { instructorMatchesMountainSelection } from '../../../../services/mountains';

export function getAdminMountainFilterContext(
  mountainId: string | null,
  mountains: Mountain[]
): { id: string; name: string } | null {
  if (!mountainId) return null;
  const m = mountains.find((x) => x.id === mountainId);
  return m ? { id: m.id, name: m.name } : null;
}

/** Students and admins always visible; instructors must match the selected mountain (or roster on mountain doc). */
export function filterUsersForAdminMountain(
  allUsers: User[],
  mountainId: string | null,
  mountains: Mountain[]
): User[] {
  const ctx = getAdminMountainFilterContext(mountainId, mountains);
  if (!ctx) return allUsers;
  return allUsers.filter((u) => {
    if (u.role !== 'instructor') return true;
    return instructorMatchesMountainSelection(u, ctx.id, ctx.name, mountains);
  });
}

export function filterLessonsForAdminMountain(
  lessons: Lesson[],
  allUsers: User[],
  mountainId: string | null,
  mountains: Mountain[]
): Lesson[] {
  const ctx = getAdminMountainFilterContext(mountainId, mountains);
  if (!ctx) return lessons;
  return lessons.filter((lesson) => {
    const instructor = allUsers.find((x) => x.id === lesson.instructorId);
    if (!instructor) return false;
    return instructorMatchesMountainSelection(instructor, ctx.id, ctx.name, mountains);
  });
}

export function filterTimeEntriesForAdminMountain(
  entries: TimeEntry[],
  allUsers: User[],
  mountainId: string | null,
  mountains: Mountain[]
): TimeEntry[] {
  const ctx = getAdminMountainFilterContext(mountainId, mountains);
  if (!ctx) return entries;
  return entries.filter((e) => {
    const instructor = allUsers.find((x) => x.id === e.instructorId);
    if (!instructor) return false;
    return instructorMatchesMountainSelection(instructor, ctx.id, ctx.name, mountains);
  });
}
