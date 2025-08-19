import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { TimeCard } from '../../timesheet/TimeCard';

export function InstructorTimeCard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">User not found</p>
      </div>
    );
  }

  return <TimeCard instructor={user} />;
}
