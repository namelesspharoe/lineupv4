import type { Lesson, LessonSport } from './index';

/**
 * Draft for a student-paid lesson booking (no id; studentIds set server-side after payment).
 */
export interface LessonBookingDraft {
  title: string;
  instructorId: string;
  date: string;
  sport: LessonSport;
  sessionType: Lesson['sessionType'];
  startTime: string;
  endTime: string;
  type: Lesson['type'];
  maxStudents: number;
  skillLevel: Lesson['skillLevel'];
  skillsFocus: string[];
  notes: string;
  description: string;
  /** Parent booking: child profile ids in `kid_profiles` (one or more). */
  kidProfileIds?: string[];
  participantChildNames?: string[];
}

export interface CartLineItem {
  id: string;
  draft: LessonBookingDraft;
  instructorName?: string;
}
