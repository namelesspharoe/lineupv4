import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { resolveLessonPriceFromMountain } from '../services/mountains';
import { prepareLessonCheckout } from '../lib/lessonCheckout';
import type { LessonBookingDraft } from '../types/cart';

function lessonHours(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

async function estimateLineTotal(draft: LessonBookingDraft): Promise<number> {
  const hours = lessonHours(draft.startTime, draft.endTime);
  if (hours <= 0) return 0;
  const rate = await resolveLessonPriceFromMountain({
    price: 0,
    instructorId: draft.instructorId,
    type: draft.type
  });
  if (rate == null || rate <= 0) return 0;
  return rate * hours;
}

export function Cart() {
  const { user } = useAuth();
  const { items, removeItem, clear } = useCart();
  const [lineTotals, setLineTotals] = useState<Record<string, number>>({});
  const [loadingEstimates, setLoadingEstimates] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingEstimates(true);
      const next: Record<string, number> = {};
      for (const line of items) {
        try {
          next[line.id] = await estimateLineTotal(line.draft);
        } catch {
          next[line.id] = 0;
        }
      }
      if (!cancelled) {
        setLineTotals(next);
        setLoadingEstimates(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const grandTotal = useMemo(() => {
    return items.reduce((sum, line) => sum + (lineTotals[line.id] ?? 0), 0);
  }, [items, lineTotals]);

  const handleCheckout = async () => {
    if (!user || items.length === 0) return;
    setError(null);
    setCheckoutLoading(true);
    try {
      const drafts = items.map((l) => l.draft);
      const successUrl = `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/checkout/cancel`;
      const url = await prepareLessonCheckout(drafts, successUrl, cancelUrl);
      if (url) {
        window.location.href = url;
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        to="/book-lesson"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Book Lesson
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <ShoppingBag className="h-8 w-8 text-gray-700 dark:text-gray-200" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cart</h1>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-gray-600 dark:text-gray-400">Your cart is empty.</p>
          <Link
            to="/book-lesson"
            className="mt-4 inline-block font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Browse instructors
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((line) => (
            <div
              key={line.id}
              className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{line.draft.title}</p>
                {line.instructorName && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{line.instructorName}</p>
                )}
                {(() => {
                  const names = line.draft.participantChildNames?.length
                    ? line.draft.participantChildNames.join(', ')
                    : (line.draft as { participantChildName?: string }).participantChildName;
                  return names ? (
                    <p className="mt-1 text-sm font-medium text-blue-700 dark:text-blue-300">For: {names}</p>
                  ) : null;
                })()}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                  {line.draft.date} · {line.draft.startTime}–{line.draft.endTime} ·{' '}
                  {line.draft.type}
                </p>
              </div>
              <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                <span className="font-medium text-gray-900 dark:text-white">
                  {loadingEstimates ? (
                    '…'
                  ) : (
                    `$${(lineTotals[line.id] ?? 0).toFixed(2)}`
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(line.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:border-gray-600 dark:hover:bg-red-950/40"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-4 border-t border-gray-200 pt-6 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Estimated total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {loadingEstimates ? '…' : `$${grandTotal.toFixed(2)}`}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Totals use each instructor&apos;s resort pricing.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => clear()}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Clear cart
              </button>
              <button
                type="button"
                disabled={checkoutLoading || loadingEstimates}
                onClick={() => void handleCheckout()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redirecting…
                  </>
                ) : (
                  'Checkout'
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
