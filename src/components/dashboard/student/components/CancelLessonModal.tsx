import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { User, Lesson } from '../../../../types';
import { updateLesson } from '../../../../services/lessons';
import { ResponsiveModalPanel } from '../../../common/ResponsiveModalPanel';

interface CancelLessonModalProps {
  lesson: (Lesson & { instructor?: User }) | null;
  onClose: () => void;
  onCancel: () => void;
}

export function CancelLessonModal({ lesson, onClose, onCancel }: CancelLessonModalProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!lesson) return;

    try {
      setIsCancelling(true);
      setError(null);

      await updateLesson(lesson.id, { status: 'cancelled' });
      onCancel();
    } catch (err: unknown) {
      console.error('Error cancelling lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel lesson');
    } finally {
      setIsCancelling(false);
    }
  };

  if (!lesson) return null;

  return (
    <ResponsiveModalPanel onClose={onClose} labelledBy="cancel-lesson-title" maxWidthClass="sm:max-w-md">
      <div className="flex shrink-0 items-center justify-end border-b border-gray-200 bg-white px-2 py-2 dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:inset-x-0 sm:top-0 sm:z-20 sm:border-0 sm:bg-transparent sm:px-4 sm:py-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-6 pt-2 sm:px-6 sm:pb-6 sm:pt-16">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/50">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 id="cancel-lesson-title" className="text-xl font-bold text-gray-900 dark:text-white">
              Cancel Lesson
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Are you sure you want to cancel this lesson?</p>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <h3 className="mb-2 font-medium text-gray-900 dark:text-white">{lesson.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {new Date(lesson.date).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          {lesson.instructor && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">with {lesson.instructor.name}</p>
          )}
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/30 dark:text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2.5 text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white sm:w-auto sm:py-2"
          >
            Keep Lesson
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isCancelling}
            className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-white transition-colors hover:bg-red-700 disabled:opacity-50 sm:w-auto sm:py-2"
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Lesson'}
          </button>
        </div>
      </div>
    </ResponsiveModalPanel>
  );
}
