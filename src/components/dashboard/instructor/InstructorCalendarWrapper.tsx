import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { InstructorCalendar } from './InstructorCalendar';

export function InstructorCalendarWrapper() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">User not found</p>
      </div>
    );
  }

  return <InstructorCalendar user={user} />;
}
