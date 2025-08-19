import { User, Lesson } from '../../../../types';

export const getRoleColor = (role?: string) => {
  switch (role) {
    case 'admin':
      return 'bg-purple-50 text-purple-600';
    case 'instructor':
      return 'bg-blue-50 text-blue-600';
    case 'student':
      return 'bg-green-50 text-green-600';
    default:
      return 'bg-gray-50 text-gray-600';
  }
};

export const getStatusColor = (status?: string) => {
  switch (status) {
    case 'available':
      return 'bg-green-50 text-green-600';
    case 'scheduled':
      return 'bg-blue-50 text-blue-600';
    case 'completed':
      return 'bg-purple-50 text-purple-600';
    case 'cancelled':
      return 'bg-red-50 text-red-600';
    default:
      return 'bg-gray-50 text-gray-600';
  }
};

export const formatRole = (role?: string) => {
  if (!role) return 'Unknown';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

export const formatStatus = (status?: string) => {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const getInstructorName = (instructorId: string, users: User[]) => {
  const instructor = users.find(u => u.id === instructorId);
  return instructor?.name || 'Unknown Instructor';
};

export const getStudentNames = (studentIds: string[], users: User[]) => {
  if (!studentIds || studentIds.length === 0) {
    return 'No Students Assigned';
  }

  const students = studentIds
    .map(id => users.find(u => u.id === id))
    .filter(student => student !== undefined)
    .map(student => student?.name);

  if (students.length === 0) {
    return 'No Students Found';
  }

  if (students.length === 1) {
    return students[0];
  }

  return `${students[0]} +${students.length - 1} more`;
};
