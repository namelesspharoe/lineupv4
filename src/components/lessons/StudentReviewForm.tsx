import React, { useState } from 'react';
import { Star, AlertCircle } from 'lucide-react';
import { StudentReview } from '../../types';
import { addStudentReview } from '../../services/lessons';

interface StudentReviewFormProps {
  lessonId: string;
  studentId: string;
  onSubmit: () => void;
  onClose: () => void;
}

export function StudentReviewForm({ lessonId, studentId, onSubmit, onClose }: StudentReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [review, setReview] = useState<StudentReview>({
    studentId: studentId,
    rating: 0,
    comment: '',
    createdAt: new Date()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      if (review.rating === 0) {
        setError('Please provide a rating');
        return;
      }

      await addStudentReview(lessonId, review);
      onSubmit();
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Rate Your Lesson</h2>
        <p className="text-gray-600">Share your experience and help other students</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => setReview(prev => ({ ...prev, rating }))}
                className={`p-2 rounded-lg ${
                  review.rating === rating
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Star className="w-6 h-6" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Review
          </label>
          <textarea
            value={review.comment}
            onChange={(e) => setReview(prev => ({ ...prev, comment: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Share your experience with this lesson..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
}