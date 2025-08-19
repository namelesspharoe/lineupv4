import React from 'react';
import { Eye, EyeOff, Star, Check, X as XIcon } from 'lucide-react';

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  content: string;
  avatar: string;
  studentId?: string;
  lessonId?: string;
  isApproved?: boolean;
  isHidden?: boolean;
  originalReview?: any;
}

interface ProfileReviewsProps {
  reviews: Review[];
  showReviews: boolean;
  isEditable: boolean;
  onToggleReviews: () => void;
  onReviewAction: (reviewId: string, action: 'approve' | 'hide') => void;
}

export function ProfileReviews({
  reviews,
  showReviews,
  isEditable,
  onToggleReviews,
  onReviewAction
}: ProfileReviewsProps) {
  // Filter reviews for display
  const publicReviews = reviews.filter(review => review.isApproved && !review.isHidden);
  const pendingReviews = reviews.filter(review => !review.isApproved && !review.isHidden);
  const hiddenReviews = reviews.filter(review => review.isHidden);

  if (reviews.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          All Reviews
          <span className="ml-2 text-sm text-gray-500">
            ({publicReviews.length} public, {pendingReviews.length} pending, {hiddenReviews.length} hidden)
          </span>
        </h3>
        <button
          onClick={onToggleReviews}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          {showReviews ? (
            <>
              <EyeOff className="w-4 h-4" />
              Hide Reviews
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Show Reviews ({reviews.length})
            </>
          )}
        </button>
      </div>

      {showReviews && (
        <div className="space-y-6">
          {/* Public Reviews */}
          {publicReviews.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                Public Reviews ({publicReviews.length})
              </h4>
              <div className="space-y-4">
                {publicReviews.map((review) => (
                  <div key={review.id} className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={review.avatar}
                          alt={review.author}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{review.author}</p>
                          <p className="text-sm text-gray-500">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">{review.rating}/5</span>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{review.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Reviews */}
          {isEditable && pendingReviews.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-yellow-600 dark:text-yellow-400 mb-3">
                Pending Approval ({pendingReviews.length})
              </h4>
              <div className="space-y-4">
                {pendingReviews.map((review) => (
                  <div key={review.id} className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={review.avatar}
                          alt={review.author}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{review.author}</p>
                          <p className="text-sm text-gray-500">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">{review.rating}/5</span>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">{review.content}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onReviewAction(review.id, 'approve')}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Check className="w-3 h-3" />
                        Approve
                      </button>
                      <button
                        onClick={() => onReviewAction(review.id, 'hide')}
                        className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        <XIcon className="w-3 h-3" />
                        Hide
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hidden Reviews */}
          {isEditable && hiddenReviews.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-red-600 dark:text-red-400 mb-3">
                Hidden Reviews ({hiddenReviews.length})
              </h4>
              <div className="space-y-4">
                {hiddenReviews.map((review) => (
                  <div key={review.id} className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={review.avatar}
                          alt={review.author}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{review.author}</p>
                          <p className="text-sm text-gray-500">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">{review.rating}/5</span>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">{review.content}</p>
                    <button
                      onClick={() => onReviewAction(review.id, 'approve')}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <Check className="w-3 h-3" />
                      Unhide
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


