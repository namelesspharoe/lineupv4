import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { User, Lesson } from '../../../../types';
import { updateLesson } from '../../../../services/lessons';

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
    } catch (err: any) {
      console.error('Error cancelling lesson:', err);
      setError(err.message || 'Failed to cancel lesson');
    } finally {
      setIsCancelling(false);
    }
  };

  if (!lesson) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Cancel Lesson</h2>
                <p className="text-gray-600">Are you sure you want to cancel this lesson?</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">{lesson.title}</h3>
              <p className="text-sm text-gray-600">
                {new Date(lesson.date).toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              {lesson.instructor && (
                <p className="text-sm text-gray-600 mt-1">
                  with {lesson.instructor.name}
                </p>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Keep Lesson
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Lesson'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


