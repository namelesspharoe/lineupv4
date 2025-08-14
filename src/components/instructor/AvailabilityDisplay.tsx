import React from 'react';
import { Clock } from 'lucide-react';
import type { Availability } from '../../services/availability';

interface AvailabilityDisplayProps {
  availability: Availability[];
}

export function AvailabilityDisplay({ availability }: AvailabilityDisplayProps) {
  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ];

  return (
    <div className="grid grid-cols-7 gap-4">
      {daysOfWeek.map(day => {
        const daySlots = availability
          .filter(slot => slot.dayOfWeek === day)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        return (
          <div
            key={day}
            className={`p-4 rounded-lg ${
              daySlots.length > 0 ? 'bg-blue-50' : 'bg-gray-50'
            }`}
          >
            <h3 className="font-medium text-gray-900 mb-2">{day}</h3>
            {daySlots.length > 0 ? (
              <div className="space-y-2">
                {daySlots.map(slot => (
                  <div
                    key={slot.id}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <Clock className="w-4 h-4" />
                    <span>
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No availability</p>
            )}
          </div>
        );
      })}
    </div>
  );
}