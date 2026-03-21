import { useState, useEffect, type FormEvent } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { ResponsiveModalPanel } from '../../common/ResponsiveModalPanel';
import { format, parseISO } from 'date-fns';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { TimeEntry, User as UserType } from '../../../types';
import { NON_LESSON_TIME_ENTRY_ID } from '../../../constants/timeEntry';
import {
  computeBillableHours,
  computeEarningsFromHours,
  payCategoryLabel,
  resolveHourlyRateForEntry,
  resolvePayCategory
} from '../../../utils/instructorPayroll';

interface EditTimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeEntry: TimeEntry & { instructor?: UserType };
  onUpdated: () => void;
}

export function EditTimeEntryModal({ isOpen, onClose, timeEntry, onUpdated }: EditTimeEntryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    clockIn: '',
    clockOut: '',
    lessonId: timeEntry.lessonId || NON_LESSON_TIME_ENTRY_ID,
    hourlyRate: timeEntry.hourlyRate || 0,
    notes: timeEntry.notes || '',
    status: timeEntry.status,
    disputeReason: timeEntry.verificationData?.disputeReason || ''
  });

  useEffect(() => {
    if (timeEntry) {
      // Convert ISO strings to datetime-local format
      const clockInDate = parseISO(timeEntry.clockIn);
      const clockOutDate = timeEntry.clockOut ? parseISO(timeEntry.clockOut) : null;
      
      setFormData({
        clockIn: format(clockInDate, "yyyy-MM-dd'T'HH:mm"),
        clockOut: clockOutDate ? format(clockOutDate, "yyyy-MM-dd'T'HH:mm") : '',
        hourlyRate: timeEntry.hourlyRate || 0,
        notes: timeEntry.notes || '',
        status: timeEntry.status,
        disputeReason: timeEntry.verificationData?.disputeReason || ''
      });
    }
  }, [timeEntry]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!timeEntry) return;

    setIsLoading(true);
    setError(null);

    try {
      // Validate form data
      if (!formData.clockIn) {
        throw new Error('Clock in time is required');
      }

      if (formData.clockOut && new Date(formData.clockOut) <= new Date(formData.clockIn)) {
        throw new Error('Clock out time must be after clock in time');
      }

      const normalizedLessonId =
        formData.lessonId.trim() === '' ? NON_LESSON_TIME_ENTRY_ID : formData.lessonId.trim();
      const payCategory = resolvePayCategory(normalizedLessonId);
      const appliedRate =
        timeEntry.instructor != null
          ? resolveHourlyRateForEntry(normalizedLessonId, timeEntry.instructor)
          : formData.hourlyRate;

      // Prepare update data
      const updateData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
        notes: formData.notes,
        status: formData.status,
        lessonId: normalizedLessonId,
        payCategory,
        appliedRatePerHour: appliedRate,
        hourlyRate: appliedRate
      };

      // Update clock in/out times if changed
      if (formData.clockIn !== format(parseISO(timeEntry.clockIn), "yyyy-MM-dd'T'HH:mm")) {
        updateData.clockIn = new Date(formData.clockIn).toISOString();
      }

      if (formData.clockOut !== (timeEntry.clockOut ? format(parseISO(timeEntry.clockOut), "yyyy-MM-dd'T'HH:mm") : '')) {
        if (formData.clockOut) {
          updateData.clockOut = new Date(formData.clockOut).toISOString();
        } else {
          updateData.clockOut = null;
        }
      }

      // Update verification data if dispute reason changed
      if (formData.disputeReason !== (timeEntry.verificationData?.disputeReason || '')) {
        updateData.verificationData = {
          ...timeEntry.verificationData,
          disputeReason: formData.disputeReason || null
        };
      }

      // Recalculate total earnings (billable hours minus breaks) when times or rate/lesson changed
      const clockInIso = (updateData.clockIn as string | undefined) || timeEntry.clockIn;
      const clockOutIso =
        updateData.clockOut !== undefined
          ? (updateData.clockOut as string | null | undefined) || undefined
          : timeEntry.clockOut;

      if (clockOutIso && appliedRate != null) {
        const billable = computeBillableHours(clockInIso, clockOutIso, timeEntry.breaks);
        updateData.totalEarnings = computeEarningsFromHours(billable, appliedRate);
      }

      // Update the document
      const entryRef = doc(db, 'timeEntries', timeEntry.id);
      await updateDoc(entryRef, updateData);

      onUpdated();
    } catch (err) {
      console.error('Error updating time entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to update time entry');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    try {
      if (!timeString) return 'N/A';
      
      if (timeString.match(/^\d{1,2}:\d{2}$/)) {
        return timeString;
      }
      
      const date = parseISO(timeString);
      if (isNaN(date.getTime())) {
        return 'Invalid time';
      }
      return format(date, 'h:mm a');
    } catch {
      return 'Invalid time';
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    try {
      if (!endTime) return 'In Progress';
      
      const start = parseISO(startTime);
      const end = parseISO(endTime);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'Invalid duration';
      }
      
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch {
      return 'Invalid duration';
    }
  };

  if (!isOpen || !timeEntry) return null;

  return (
    <ResponsiveModalPanel onClose={onClose} labelledBy="edit-time-entry-title" maxWidthClass="sm:max-w-2xl">
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
        <h2 id="edit-time-entry-title" className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
          Edit Time Entry
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {timeEntry.instructor?.name || 'Unknown Instructor'} • {format(parseISO(timeEntry.clockIn), 'MMM d, yyyy')}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Current Entry Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Current Entry</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Clock In:</span>
                  <div className="font-medium">{formatTime(timeEntry.clockIn)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Clock Out:</span>
                  <div className="font-medium">
                    {timeEntry.clockOut ? formatTime(timeEntry.clockOut) : 'Not set'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <div className="font-medium">{formatDuration(timeEntry.clockIn, timeEntry.clockOut)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Earnings:</span>
                  <div className="font-medium">
                    {timeEntry.totalEarnings ? `$${timeEntry.totalEarnings.toFixed(2)}` : 'Not calculated'}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Pay type:</span>
                  <div className="font-medium">
                    {payCategoryLabel(timeEntry.payCategory ?? resolvePayCategory(timeEntry.lessonId))}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clock In Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.clockIn}
                  onChange={(e) => setFormData(prev => ({ ...prev, clockIn: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clock Out Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.clockOut}
                  onChange={(e) => setFormData(prev => ({ ...prev, clockOut: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty if still active</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson ID (Firestore doc id)
                </label>
                <input
                  type="text"
                  value={formData.lessonId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData((prev) => {
                      const raw = v.trim();
                      const id = raw === '' ? NON_LESSON_TIME_ENTRY_ID : raw;
                      const next: typeof prev = { ...prev, lessonId: v };
                      if (timeEntry.instructor) {
                        next.hourlyRate = resolveHourlyRateForEntry(id, timeEntry.instructor);
                      }
                      return next;
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder={NON_LESSON_TIME_ENTRY_ID}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use <span className="font-mono">{NON_LESSON_TIME_ENTRY_ID}</span> or leave empty for resort / non-lesson time. Paste a lesson document id to link this entry to that lesson.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {timeEntry.instructor ? 'Hourly rate (from profile)' : 'Hourly rate ($)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourlyRate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))
                  }
                  readOnly={!!timeEntry.instructor}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent read-only:bg-gray-50 read-only:cursor-not-allowed"
                />
                {timeEntry.instructor && (
                  <p className="text-xs text-gray-500 mt-1">Updates when you change the lesson id (teach vs resort rates).</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'completed' | 'disputed' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="disputed">Disputed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any notes about this time entry..."
              />
            </div>

            {formData.status === 'disputed' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dispute Reason
                </label>
                <textarea
                  value={formData.disputeReason}
                  onChange={(e) => setFormData(prev => ({ ...prev, disputeReason: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Explain why this time entry is disputed..."
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 dark:border-gray-800 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 sm:w-auto sm:py-2"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 sm:w-auto sm:py-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
      </div>
    </ResponsiveModalPanel>
  );
}
