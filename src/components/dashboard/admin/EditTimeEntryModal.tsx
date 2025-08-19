import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { TimeEntry, User as UserType } from '../../../types';

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

  const handleSubmit = async (e: React.FormEvent) => {
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

      // Prepare update data
      const updateData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
        notes: formData.notes,
        status: formData.status,
        hourlyRate: formData.hourlyRate
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

      // Recalculate total earnings if times or hourly rate changed
      if (updateData.clockIn || updateData.clockOut || updateData.hourlyRate) {
        const clockIn = updateData.clockIn || timeEntry.clockIn;
        const clockOut = updateData.clockOut || timeEntry.clockOut;
        const hourlyRate = updateData.hourlyRate || timeEntry.hourlyRate;

        if (clockOut && hourlyRate) {
          const startTime = new Date(clockIn);
          const endTime = new Date(clockOut);
          const hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          updateData.totalEarnings = hoursWorked * hourlyRate;
        }
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit Time Entry</h2>
                <p className="text-sm text-gray-600">
                  {timeEntry.instructor?.name || 'Unknown Instructor'} • {format(parseISO(timeEntry.clockIn), 'MMM d, yyyy')}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
