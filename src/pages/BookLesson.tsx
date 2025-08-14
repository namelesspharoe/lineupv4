import React from 'react';
import { StudentBookingInterface } from '../components/booking/StudentBookingInterface';

export function BookLesson() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6">
        <StudentBookingInterface 
          onBookingComplete={() => {
            // Could redirect to dashboard or show success message
            console.log('Booking completed successfully!');
          }}
        />
      </div>
    </div>
  );
}