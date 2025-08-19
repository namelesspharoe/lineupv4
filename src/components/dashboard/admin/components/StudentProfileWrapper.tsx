import React from 'react';
import { User } from '../../../../types';
import { StudentProfileModal } from '../../../student/StudentProfileModal';

interface StudentProfileWrapperProps {
  user: User | null;
  onClose: () => void;
}

export function StudentProfileWrapper({ user, onClose }: StudentProfileWrapperProps) {
  if (!user) return null;

  // Convert User to Student type by adding the required 'image' property
  const student = {
    ...user,
    image: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
  };

  return (
    <StudentProfileModal
      student={student}
      onClose={onClose}
    />
  );
}
