import React from 'react';
import { Clock, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { TimeEntry } from '../../types';

interface TimesheetAnalyticsProps {
  timeEntries: TimeEntry[];
  startTime: string;
  endTime: string;
}

export function TimesheetAnalytics({ timeEntries, startTime, endTime }: TimesheetAnalyticsProps) {
  const calculateMetrics = () => {
    const metrics = {
      totalHours: 0,
      averageHoursPerDay: 0,
      totalBreakTime: 0,
      completionRate: 0,
      disputeRate: 0
    };

    if (!timeEntries.length) return metrics;

    // Calculate total hours
    timeEntries.forEach(entry => {
      if (entry.clockOut) {
        const duration = new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime();
        metrics.totalHours += duration / (1000 * 60 * 60);

        // Calculate break time
        entry.breaks?.forEach(breakPeriod => {
          if (breakPeriod.duration) {
            metrics.totalBreakTime += breakPeriod.duration;
          }
        });
      }
    });

    // Calculate average hours per day
    const [startHours] = startTime.split(':').map(Number);
    const [endHours] = endTime.split(':').map(Number);
    const workingHours = endHours - startHours;
    metrics.averageHoursPerDay = metrics.totalHours / workingHours;

    // Calculate completion and dispute rates
    const completedEntries = timeEntries.filter(entry => entry.status === 'completed').length;
    const disputedEntries = timeEntries.filter(entry => entry.status === 'disputed').length;
    
    metrics.completionRate = (completedEntries / timeEntries.length) * 100;
    metrics.disputeRate = (disputedEntries / timeEntries.length) * 100;

    return metrics;
  };

  const metrics = calculateMetrics();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Total Hours */}
      <div className="p-4 bg-blue-50 rounded-xl">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">Total Hours</h3>
        </div>
        <p className="text-2xl font-bold text-blue-600">
          {metrics.totalHours.toFixed(1)}h
        </p>
      </div>

      {/* Average Hours */}
      <div className="p-4 bg-green-50 rounded-xl">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="font-medium text-gray-900">Average Hours</h3>
        </div>
        <p className="text-2xl font-bold text-green-600">
          {metrics.averageHoursPerDay.toFixed(1)}h
        </p>
      </div>

      {/* Break Time */}
      <div className="p-4 bg-yellow-50 rounded-xl">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-5 h-5 text-yellow-600" />
          <h3 className="font-medium text-gray-900">Break Time</h3>
        </div>
        <p className="text-2xl font-bold text-yellow-600">
          {metrics.totalBreakTime.toFixed(0)}m
        </p>
      </div>

      {/* Completion Rate */}
      <div className="p-4 bg-purple-50 rounded-xl">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="w-5 h-5 text-purple-600" />
          <h3 className="font-medium text-gray-900">Completion Rate</h3>
        </div>
        <p className="text-2xl font-bold text-purple-600">
          {metrics.completionRate.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}