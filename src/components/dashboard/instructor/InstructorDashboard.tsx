import React from 'react';
import { User } from '../../../types';
import { InstructorDashboardLayout } from './InstructorDashboardLayout';

export function InstructorDashboard({ user }: { user: User }) {
  return <InstructorDashboardLayout user={user} />;
}

export default InstructorDashboard;