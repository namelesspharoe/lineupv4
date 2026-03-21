import { X, Clock, User, DollarSign, MapPin, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { ResponsiveModalPanel } from '../../common/ResponsiveModalPanel';
import { format, parseISO } from 'date-fns';
import { TimeEntry, User as UserType } from '../../../types';
import { payCategoryLabel, resolvePayCategory } from '../../../utils/instructorPayroll';

interface TimeEntryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeEntry: TimeEntry & { instructor?: UserType };
}

export function TimeEntryDetailsModal({ isOpen, onClose, timeEntry }: TimeEntryDetailsModalProps) {
  if (!isOpen || !timeEntry) return null;

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Disputed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getVerificationMethodBadge = (method: string) => {
    switch (method) {
      case 'manual':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Manual</span>;
      case 'gps':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">GPS</span>;
      case 'qr':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">QR Code</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{method}</span>;
    }
  };

  return (
    <ResponsiveModalPanel onClose={onClose} labelledBy="time-entry-details-title" maxWidthClass="sm:max-w-4xl">
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
        <h2 id="time-entry-details-title" className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
          Time Entry Details
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {timeEntry.instructor?.name || 'Unknown Instructor'} • {format(parseISO(timeEntry.clockIn), 'MMM d, yyyy')}
        </p>

        <div className="mt-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Duration</h3>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {formatDuration(timeEntry.clockIn, timeEntry.clockOut)}
                </p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Earnings</h3>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  ${timeEntry.totalEarnings?.toFixed(2) || '0.00'}
                </p>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Instructor</h3>
                </div>
                <p className="text-lg font-bold text-purple-900">
                  {timeEntry.instructor?.name || 'Unknown'}
                </p>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Status</h3>
                </div>
                <div className="mt-2">
                  {getStatusBadge(timeEntry.status)}
                </div>
              </div>
            </div>

            {/* Time Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Time Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Clock In</h4>
                  <p className="text-sm text-gray-600">
                    {format(parseISO(timeEntry.clockIn), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-lg font-medium text-gray-900">
                    {formatTime(timeEntry.clockIn)}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Clock Out</h4>
                  {timeEntry.clockOut ? (
                    <>
                      <p className="text-sm text-gray-600">
                        {format(parseISO(timeEntry.clockOut), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="text-lg font-medium text-gray-900">
                        {formatTime(timeEntry.clockOut)}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500 italic">Not set (still active)</p>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financial Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Pay type</h4>
                  <p className="text-lg font-medium text-gray-900">
                    {payCategoryLabel(timeEntry.payCategory ?? resolvePayCategory(timeEntry.lessonId))}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Hourly Rate</h4>
                  <p className="text-2xl font-bold text-gray-900">
                    ${timeEntry.hourlyRate?.toFixed(2) || '0.00'}/hour
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Total Earnings</h4>
                  <p className="text-2xl font-bold text-gray-900">
                    ${timeEntry.totalEarnings?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>

            {/* Breaks Information */}
            {timeEntry.breaks && timeEntry.breaks.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Breaks</h3>
                <div className="space-y-3">
                  {timeEntry.breaks.map((breakItem, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          Break {index + 1}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatTime(breakItem.startTime)} - {breakItem.endTime ? formatTime(breakItem.endTime) : 'Ongoing'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="font-medium text-gray-900">
                          {breakItem.duration ? `${breakItem.duration} minutes` : 'Calculating...'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Information</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Verification Method</h4>
                  {getVerificationMethodBadge(timeEntry.verificationMethod)}
                </div>
                
                {timeEntry.verificationData?.location && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location Data
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">
                        Latitude: {timeEntry.verificationData.location.latitude}
                      </p>
                      <p className="text-sm text-gray-600">
                        Longitude: {timeEntry.verificationData.location.longitude}
                      </p>
                    </div>
                  </div>
                )}
                
                {timeEntry.verificationData?.disputeReason && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Dispute Reason
                    </h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">
                        {timeEntry.verificationData.disputeReason}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {timeEntry.notes && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{timeEntry.notes}</p>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Entry Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Entry ID:</span>
                  <p className="font-mono text-gray-900">{timeEntry.id}</p>
                </div>
                <div>
                  <span className="text-gray-600">Lesson ID:</span>
                  <p className="font-mono text-gray-900">{timeEntry.lessonId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>
                  <p className="text-gray-900">
                    {format(parseISO(timeEntry.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <p className="text-gray-900">
                    {format(parseISO(timeEntry.updatedAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            </div>
        </div>
      </div>
    </ResponsiveModalPanel>
  );
}
