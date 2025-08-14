import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, Pause, Play as Resume, AlertCircle } from 'lucide-react';
import { clockIn, clockOut, getActiveTimeEntry, startBreak, endBreak } from '../../services/timesheet';
import { TimeEntry } from '../../types';

interface ClockInOutButtonProps {
  instructorId: string;
  lessonId?: string;
  onClockIn?: () => void;
  onClockOut?: () => void;
}

export function ClockInOutButton({
  instructorId,
  lessonId = 'general',
  onClockIn,
  onClockOut
}: ClockInOutButtonProps) {
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnBreak, setIsOnBreak] = useState(false);

  useEffect(() => {
    const checkActiveEntry = async () => {
      try {
        setIsLoading(true);
        const entry = await getActiveTimeEntry(instructorId);
        setActiveEntry(entry);
        
        // Check if currently on break
        if (entry?.breaks && entry.breaks.length > 0) {
          const lastBreak = entry.breaks[entry.breaks.length - 1];
          setIsOnBreak(!!lastBreak && !lastBreak.endTime);
        }
      } catch (err) {
        console.error('Error checking active entry:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkActiveEntry();
  }, [instructorId]);

  const handleClockIn = async () => {
    try {
      setError(null);
      const entryId = await clockIn(lessonId, instructorId);
      setActiveEntry(await getActiveTimeEntry(instructorId));
      onClockIn?.();
    } catch (err: any) {
      console.error('Error clocking in:', err);
      setError(err.message || 'Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    if (!activeEntry) return;

    try {
      setError(null);
      
      // If on break, end it first
      if (isOnBreak) {
        await endBreak(activeEntry.id);
      }
      
      await clockOut(activeEntry.id);
      setActiveEntry(null);
      setIsOnBreak(false);
      onClockOut?.();
    } catch (err: any) {
      console.error('Error clocking out:', err);
      setError(err.message || 'Failed to clock out');
    }
  };

  const handleBreakToggle = async () => {
    if (!activeEntry) return;

    try {
      setError(null);
      if (isOnBreak) {
        await endBreak(activeEntry.id);
        setIsOnBreak(false);
      } else {
        await startBreak(activeEntry.id);
        setIsOnBreak(true);
      }
      
      // Refresh active entry to get updated break info
      const updatedEntry = await getActiveTimeEntry(instructorId);
      setActiveEntry(updatedEntry);
    } catch (err: any) {
      console.error('Error toggling break:', err);
      setError(err.message || 'Failed to toggle break');
    }
  };

  if (isLoading) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg flex items-center gap-2"
      >
        <Clock className="w-5 h-5 animate-spin" />
        Loading...
      </button>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (activeEntry) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleClockOut}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <Square className="w-5 h-5" />
          Clock Out
        </button>
        <button
          onClick={handleBreakToggle}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            isOnBreak 
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
          }`}
        >
          {isOnBreak ? (
            <>
              <Resume className="w-5 h-5" />
              Resume Work
            </>
          ) : (
            <>
              <Pause className="w-5 h-5" />
              Take Break
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClockIn}
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
    >
      <Play className="w-5 h-5" />
      Clock In
    </button>
  );
}