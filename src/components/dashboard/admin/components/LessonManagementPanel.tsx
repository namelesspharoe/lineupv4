import { Plus } from 'lucide-react';
import type { Lesson, User } from '../../../../types';
import { LessonTable } from './LessonTable';

export interface LessonManagementPanelProps {
  lessons: Lesson[];
  users: User[];
  onCreateLesson: () => void;
  onEditLesson: (lesson: Lesson) => void;
  onUpdateLessonStatus: (
    lessonId: string,
    status: 'available' | 'scheduled' | 'completed' | 'cancelled'
  ) => void;
  onDeleteLesson: (lessonId: string) => void;
}

export function LessonManagementPanel({
  lessons,
  users,
  onCreateLesson,
  onEditLesson,
  onUpdateLessonStatus,
  onDeleteLesson
}: LessonManagementPanelProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lesson management</h2>
          <button
            type="button"
            onClick={onCreateLesson}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Create lesson
          </button>
        </div>
      </div>
      <div className="p-6">
        <LessonTable
          lessons={lessons}
          users={users}
          onEditLesson={onEditLesson}
          onUpdateLessonStatus={onUpdateLessonStatus}
          onDeleteLesson={onDeleteLesson}
        />
      </div>
    </div>
  );
}
