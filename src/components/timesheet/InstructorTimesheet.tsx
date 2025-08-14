import React, { useState, useEffect } from 'react';
import { User, TimeEntry } from '../../types';
import { getTimeEntries } from '../../services/timesheet';
import { TimesheetAnalytics } from './TimesheetAnalytics';

interface InstructorTimesheetProps {
  instructorId: string;
}

export function InstructorTimesheet({ instructorId }: InstructorTimesheetProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTimeEntries = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create date objects for today with the selected times
        const today = new Date();
        const start = new Date(today);
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        start.setHours(startHours, startMinutes, 0, 0);

        const end = new Date(today);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        end.setHours(endHours, endMinutes, 0, 0);

        const entries = await getTimeEntries(instructorId, start, end);
        setTimeEntries(entries);
      } catch (err) {
        console.error('Error loading time entries:', err);
        setError('Failed to load time entries');
      } finally {
        setIsLoading(false);
      }
    };

    loadTimeEntries();
  }, [instructorId, startTime, endTime]);

  return (
    <div className="space-y-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">My Timesheet</h2>
        <div className="flex items-center gap-4">
          <div>
            <label htmlFor="start-time" className="block text-sm font-medium text-gray-700">
              Start Time
            </label>
            <input
              type="time"
              id="start-time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="end-time" className="block text-sm font-medium text-gray-700">
              End Time
            </label>
            <input
              type="time"
              id="end-time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
          <span className="text-sm">{error}</span>
        </div>
      ) : (
        <>
          <TimesheetAnalytics 
            timeEntries={timeEntries} 
            startTime={startTime}
            endTime={endTime}
          />

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
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
                    Break Time
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {timeEntries.map(entry => {
                  const clockIn = new Date(entry.clockIn);
                  const clockOut = entry.clockOut ? new Date(entry.clockOut) : null;
                  const duration = clockOut ? 
                    (clockOut.getTime() - clockIn.getTime()) / (1000 * 60) : // minutes
                    null;
                  
                  const totalBreakTime = entry.breaks?.reduce((total, breakPeriod) => 
                    total + (breakPeriod.duration || 0), 0) || 0;

                  return (
                    <tr key={entry.id} className="hover:bg-gray-50">
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
                        {totalBreakTime > 0 ? `${totalBreakTime} mins` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          entry.status === 'active' ? 'bg-green-50 text-green-600' :
                          entry.status === 'completed' ? 'bg-blue-50 text-blue-600' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {timeEntries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No time entries found for this period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}