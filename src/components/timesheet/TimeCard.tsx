import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Play, Square, Pause, DollarSign, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TimeEntry, User } from '../../types';
import { getActiveTimeEntry, getTimeEntries } from '../../services/timesheet';
import { ClockInOutButton } from './ClockInOutButton';
import { TimesheetAnalytics } from './TimesheetAnalytics';

interface TimeCardProps {
  instructor?: User;
}

export function TimeCard({ instructor }: TimeCardProps) {
  const { user } = useAuth();
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  const instructorId = instructor?.id || user?.id;

  const loadTimeData = useCallback(async () => {
    if (!instructorId) return;
    
    try {
      setIsLoading(true);
      setError(null);

      // Load active time entry
      const active = await getActiveTimeEntry(instructorId);
      setActiveEntry(active);

      // Load time entries for selected period
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (selectedPeriod) {
        case 'today': {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        }
        case 'week': {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          startDate = startOfWeek;
          endDate = endOfWeek;
          break;
        }
        case 'month': {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          break;
        }
        default: {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        }
      }

      const entries = await getTimeEntries(instructorId, startDate, endDate);
      setTimeEntries(entries);
    } catch (err) {
      console.error('Error loading time data:', err);
      setError('Failed to load time data');
    } finally {
      setIsLoading(false);
    }
  }, [instructorId, selectedPeriod]);

  useEffect(() => {
    if (instructorId) {
      loadTimeData();
    }
  }, [instructorId, loadTimeData]);

  const getCurrentStatus = () => {
    if (!activeEntry) return 'offline';
    
    const hasActiveBreak = activeEntry.breaks?.some(breakPeriod => 
      breakPeriod.startTime && !breakPeriod.endTime
    );
    
    return hasActiveBreak ? 'on_break' : 'working';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <Play className="w-4 h-4 text-green-600" />;
      case 'on_break':
        return <Pause className="w-4 h-4 text-yellow-600" />;
      case 'offline':
        return <Square className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'working':
        return 'Currently Working';
      case 'on_break':
        return 'On Break';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'on_break':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'offline':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const calculateCurrentSessionTime = () => {
    if (!activeEntry) return 0;
    
    const startTime = new Date(activeEntry.clockIn);
    const now = new Date();
    const totalTimeMs = now.getTime() - startTime.getTime();
    
    // Subtract break time
    const breakTimeMs = activeEntry.breaks?.reduce((total, breakPeriod) => {
      if (breakPeriod.duration) {
        return total + (breakPeriod.duration * 60 * 1000);
      }
      return total;
    }, 0) || 0;
    
    return Math.max(0, totalTimeMs - breakTimeMs);
  };

  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Time Card</h2>
          <p className="text-gray-600">Track your work hours and earnings</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Period Selector */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            {(['today', 'week', 'month'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current Status Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Current Status</h3>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(getCurrentStatus())}`}>
            {getStatusIcon(getCurrentStatus())}
            <span className="text-sm font-medium">{getStatusText(getCurrentStatus())}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Clock In/Out Button */}
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
            <ClockInOutButton
              instructorId={instructorId || ''}
              instructor={instructor || user || undefined}
              onClockIn={loadTimeData}
              onClockOut={loadTimeData}
            />
          </div>

          {/* Current Session Time */}
          {activeEntry && (
            <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg">
              <Clock className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm text-gray-600">Current Session</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatTime(calculateCurrentSessionTime())}
              </span>
            </div>
          )}

          {/* Today's Earnings */}
          <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg">
            <DollarSign className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm text-gray-600">Today's Earnings</span>
            <span className="text-2xl font-bold text-green-600">
              ${timeEntries
                .filter(entry => entry.totalEarnings)
                .reduce((total, entry) => total + (entry.totalEarnings || 0), 0)
                .toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h3>
        <TimesheetAnalytics 
          timeEntries={timeEntries}
          startTime="09:00"
          endTime="17:00"
        />
      </div>

      {/* Recent Time Entries */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Time Entries</h3>
          <button
            onClick={loadTimeData}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clock In
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clock Out
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Earnings
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {timeEntries.slice(0, 10).map(entry => {
                const clockIn = new Date(entry.clockIn);
                const clockOut = entry.clockOut ? new Date(entry.clockOut) : null;
                const duration = clockOut ? 
                  (clockOut.getTime() - clockIn.getTime()) / (1000 * 60) : // minutes
                  null;

                return (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {clockIn.toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {clockIn.toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4">
                      {clockOut ? clockOut.toLocaleTimeString() : 'Active'}
                    </td>
                    <td className="py-3 px-4">
                      {duration ? `${Math.round(duration)} mins` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {entry.totalEarnings ? `$${entry.totalEarnings.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                        entry.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : entry.status === 'active'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                        {entry.status === 'active' && <Play className="w-3 h-3" />}
                        {entry.status === 'disputed' && <XCircle className="w-3 h-3" />}
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {timeEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No time entries found for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
