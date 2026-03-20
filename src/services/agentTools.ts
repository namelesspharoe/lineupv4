/**
 * Agent tools: thin wrappers over existing services so the AI agent can read
 * data for all app features. Role-based — only exposes tools the current user can use.
 */
import { User } from '../types';
import { getLessonsByStudent, getLessonsByInstructor } from './lessons';
import { instructorMatchingService } from './instructorMatching';
import { progressService } from './progress';
import { achievementService } from './achievements';
import { getMessages } from './messages';
import { getAvailabilityByInstructorId } from './availability';
import { getUserById, getStudents, getAllUsers } from './users';
import { getTimeEntriesByInstructor, getActiveTimeEntry } from './timesheet';
import { instructorStatsService } from './instructorStats';

export type UserRole = 'student' | 'instructor' | 'admin';

// --- Student tools ---

export async function getMyLessons(userId: string, role: UserRole) {
  if (role === 'student') {
    return getLessonsByStudent(userId);
  }
  if (role === 'instructor') {
    return getLessonsByInstructor(userId);
  }
  return [];
}

export async function getInstructorMatches(
  userId: string,
  options?: { resort?: string; maxResults?: number }
) {
  return instructorMatchingService.matchStudentWithInstructors(userId, {
    resort: options?.resort,
    maxResults: options?.maxResults ?? 5,
  });
}

export async function getMyProgress(userId: string) {
  const [progress, analytics] = await Promise.all([
    progressService.getStudentProgress(userId),
    progressService.getProgressAnalytics(userId).catch(() => null),
  ]);
  return { progress, analytics };
}

export async function getMyAchievements(userId: string) {
  return achievementService.getAchievementStats(userId);
}

export async function getMyMessagesSummary(userId: string) {
  const messages = await getMessages(userId);
  const conversationIds = new Set<string>();
  let unreadCount = 0;
  for (const m of messages) {
    const cid = (m as { conversationId?: string }).conversationId;
    if (cid) conversationIds.add(cid);
    if ((m as { read?: boolean }).read === false && (m as { receiverId?: string }).receiverId === userId) {
      unreadCount++;
    }
  }
  return {
    totalMessages: messages.length,
    conversationCount: conversationIds.size || Math.ceil(messages.length / 2) || 0,
    unreadCount,
    recentCount: messages.slice(0, 10).length,
  };
}

// --- Instructor tools ---

export async function getMyAvailability(userId: string) {
  return getAvailabilityByInstructorId(userId);
}

export async function getTimecardSummary(instructorId: string) {
  const [active, allEntries] = await Promise.all([
    getActiveTimeEntry(instructorId),
    getTimeEntriesByInstructor(instructorId, new Date().toISOString().slice(0, 10)),
  ]);
  const completed = allEntries.filter((e: { status?: string }) => e.status === 'completed');
  const totalEarnings = completed.reduce((sum: number, e: { totalEarnings?: number }) => sum + (e.totalEarnings || 0), 0);
  return {
    activeEntry: active,
    entriesToday: allEntries.length,
    completedToday: completed.length,
    totalEarningsToday: totalEarnings,
  };
}

export async function getMyStudentsList(instructorId: string) {
  const lessons = await getLessonsByInstructor(instructorId);
  const studentIds = new Set<string>();
  for (const l of lessons) {
    const ids = (l as { studentIds?: string[] }).studentIds || [];
    ids.forEach((id: string) => studentIds.add(id));
  }
  return Array.from(studentIds);
}

// --- Profile / shared ---

export async function getProfile(userId: string) {
  return getUserById(userId);
}

// --- Admin tools ---

export async function getUsersList() {
  return getAllUsers();
}

export async function getInstructorStatsSummary(instructorId: string) {
  return instructorStatsService.getInstructorStats(instructorId);
}

/**
 * Get list of tool names available for a given role (for intent routing / LLM).
 */
export function getAvailableToolNames(role: UserRole): string[] {
  const base = ['getMyLessons', 'getProfile', 'getMyMessagesSummary'];
  if (role === 'student') {
    return [...base, 'getInstructorMatches', 'getMyProgress', 'getMyAchievements'];
  }
  if (role === 'instructor') {
    return [
      ...base,
      'getMyAvailability',
      'getTimecardSummary',
      'getMyStudentsList',
      'getInstructorStatsSummary',
    ];
  }
  if (role === 'admin') {
    return [...base, 'getUsersList', 'getMyLessons', 'getProfile'];
  }
  return base;
}
