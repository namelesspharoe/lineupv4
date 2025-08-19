import { useState } from 'react';
import { User, Lesson } from '../../../../types';
import { updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

interface UseAdminActionsReturn {
  handleDeleteUser: (userId: string, users: User[], onSuccess: () => void) => Promise<void>;
  handleDeleteLesson: (lessonId: string, lessons: Lesson[], onSuccess: () => void) => Promise<void>;
  handleUpdateUserRole: (userId: string, newRole: 'student' | 'instructor' | 'admin', users: User[], onSuccess: () => void) => Promise<void>;
  handleUpdateLessonStatus: (lessonId: string, newStatus: 'available' | 'scheduled' | 'completed' | 'cancelled', lessons: Lesson[], onSuccess: () => void) => Promise<void>;
}

export function useAdminActions(): UseAdminActionsReturn {
  const handleDeleteUser = async (userId: string, users: User[], onSuccess: () => void) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      await deleteDoc(doc(db, 'users', userId));
      onSuccess();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const handleDeleteLesson = async (lessonId: string, lessons: Lesson[], onSuccess: () => void) => {
    if (!window.confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) return;
    
    try {
      await deleteDoc(doc(db, 'lessons', lessonId));
      onSuccess();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Failed to delete lesson. Please try again.');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'student' | 'instructor' | 'admin', users: User[], onSuccess: () => void) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      onSuccess();
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role. Please try again.');
    }
  };

  const handleUpdateLessonStatus = async (lessonId: string, newStatus: 'available' | 'scheduled' | 'completed' | 'cancelled', lessons: Lesson[], onSuccess: () => void) => {
    try {
      await updateDoc(doc(db, 'lessons', lessonId), { status: newStatus });
      onSuccess();
    } catch (error) {
      console.error('Error updating lesson status:', error);
      alert('Failed to update lesson status. Please try again.');
    }
  };

  return {
    handleDeleteUser,
    handleDeleteLesson,
    handleUpdateUserRole,
    handleUpdateLessonStatus
  };
}
