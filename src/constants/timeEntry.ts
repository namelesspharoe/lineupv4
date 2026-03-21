/** Time entries not tied to a Firestore lesson document use this sentinel `lessonId`. */
export const NON_LESSON_TIME_ENTRY_ID = 'general' as const;

export function isNonLessonTimeEntryId(lessonId: string | undefined | null): boolean {
  return !lessonId || lessonId === NON_LESSON_TIME_ENTRY_ID;
}
