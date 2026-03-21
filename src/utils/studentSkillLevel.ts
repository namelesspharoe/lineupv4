import type { StudentSkillLevel, User } from '../types';

export const STUDENT_SKILL_LEVELS: readonly StudentSkillLevel[] = [
  'first_time',
  'developing_turns',
  'linking_turns',
  'confident_turns',
  'consistent_blue'
] as const;

export function parseStudentSkillLevel(value: string | undefined | null): StudentSkillLevel {
  if (value && (STUDENT_SKILL_LEVELS as readonly string[]).includes(value)) {
    return value as StudentSkillLevel;
  }
  return 'first_time';
}

/**
 * Preferred read path for a student's current skill step on the user profile.
 * Uses `studentSkillLevel` when present, otherwise `level`, with safe parsing.
 */
export function getStudentSkillLevel(
  user: Pick<User, 'role' | 'level' | 'studentSkillLevel'> | null | undefined
): StudentSkillLevel {
  if (!user || user.role !== 'student') {
    return 'first_time';
  }
  return parseStudentSkillLevel(user.studentSkillLevel ?? user.level);
}

/** Use when writing a student's skill level to Firestore so both fields stay aligned. */
export function studentSkillLevelUserFields(level: string): {
  level: StudentSkillLevel;
  studentSkillLevel: StudentSkillLevel;
} {
  const sl = parseStudentSkillLevel(level);
  return { level: sl, studentSkillLevel: sl };
}
