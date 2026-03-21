import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const { clear } = useCart();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setError('Invalid checkout session');
      setIsLoading(false);
      return;
    }

    clear();

    const t = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [searchParams, clear]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg text-center border border-gray-100 dark:border-gray-800">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment successful</h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your lessons are booked. You can view them under Lessons or on Book Lesson (Active).
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/lessons"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            View lessons
          </Link>
          <Link
            to="/book-lesson"
            className="inline-block px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center"
          >
            Book Lesson
          </Link>
        </div>
      </div>
    </div>
  );
}
