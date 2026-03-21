import { User, Lesson } from '../../../../types';
import { updateDoc, doc, deleteDoc, deleteField } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import {
  assignInstructorToMountain,
  createMountain,
  patchMountain,
  unassignInstructorFromMountain,
  updateMountain
} from '../../../../services/mountains';
import type { MountainPassAffiliation, MountainRegionId } from '../../../../types';

interface UseAdminActionsReturn {
  handleDeleteUser: (userId: string, users: User[], onSuccess: () => void) => Promise<void>;
  handleDeleteLesson: (lessonId: string, lessons: Lesson[], onSuccess: () => void) => Promise<void>;
  handleUpdateUserRole: (userId: string, newRole: 'student' | 'instructor' | 'admin', users: User[], onSuccess: () => void) => Promise<void>;
  handleUpdateLessonStatus: (lessonId: string, newStatus: 'available' | 'scheduled' | 'completed' | 'cancelled', lessons: Lesson[], onSuccess: () => void) => Promise<void>;
  handleCreateMountain: (data: {
    name: string;
    description?: string;
    location?: string;
    privateLessonPrice?: number;
    groupLessonPrice?: number;
    baseDepthInches?: number;
    snowfall24hInches?: number;
    snowReportUpdatedAt?: string;
    regionId?: MountainRegionId;
    passAffiliations?: MountainPassAffiliation[];
  }) => Promise<void>;
  handleUpdateMountainMeta: (mountainId: string, updates: { regionId: MountainRegionId; passAffiliations: MountainPassAffiliation[] }) => Promise<void>;
  handleUpdateMountainSnow: (
    mountainId: string,
    raw: { baseDepthInches: string; snowfall24hInches: string }
  ) => Promise<void>;
  handleAssignInstructorToMountain: (instructorId: string, mountainId: string) => Promise<void>;
  handleUnassignInstructorFromMountain: (instructorId: string) => Promise<void>;
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
      const currentUser = users.find(user => user.id === userId);

      if (currentUser?.role === 'instructor' && newRole !== 'instructor') {
        await unassignInstructorFromMountain(userId);
      }

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

  const handleCreateMountain = async (data: {
    name: string;
    description?: string;
    location?: string;
    privateLessonPrice?: number;
    groupLessonPrice?: number;
    baseDepthInches?: number;
    snowfall24hInches?: number;
    snowReportUpdatedAt?: string;
    regionId?: MountainRegionId;
    passAffiliations?: MountainPassAffiliation[];
  }) => {
    try {
      await createMountain({
        name: data.name.trim(),
        description: data.description?.trim(),
        location: data.location?.trim(),
        privateLessonPrice: data.privateLessonPrice,
        groupLessonPrice: data.groupLessonPrice,
        baseDepthInches: data.baseDepthInches,
        snowfall24hInches: data.snowfall24hInches,
        snowReportUpdatedAt: data.snowReportUpdatedAt,
        ...(data.regionId !== undefined ? { regionId: data.regionId } : {}),
        ...(data.passAffiliations !== undefined ? { passAffiliations: data.passAffiliations } : {})
      });
    } catch (error) {
      console.error('Error creating mountain:', error);
      alert('Failed to create mountain. Please try again.');
    }
  };

  const handleUpdateMountainMeta = async (
    mountainId: string,
    updates: { regionId: MountainRegionId; passAffiliations: MountainPassAffiliation[] }
  ) => {
    try {
      await updateMountain(mountainId, {
        regionId: updates.regionId,
        passAffiliations: updates.passAffiliations
      });
    } catch (error) {
      console.error('Error updating mountain:', error);
      alert('Failed to update mountain. Please try again.');
    }
  };

  const handleUpdateMountainSnow = async (
    mountainId: string,
    raw: { baseDepthInches: string; snowfall24hInches: string }
  ) => {
    const baseStr = raw.baseDepthInches.trim();
    const snowStr = raw.snowfall24hInches.trim();

    const parseInches = (label: string, s: string): number | 'clear' | null => {
      if (s === '') return 'clear';
      const n = Number(s);
      if (!Number.isFinite(n) || n < 0) {
        alert(`${label} must be a non-negative number or empty.`);
        return null;
      }
      return n;
    };

    const baseVal = parseInches('Base depth (inches)', baseStr);
    const snowVal = parseInches('24h snowfall (inches)', snowStr);
    if (baseVal === null || snowVal === null) return;

    try {
      const payload: Record<string, unknown> = {};
      payload.baseDepthInches = baseVal === 'clear' ? deleteField() : baseVal;
      payload.snowfall24hInches = snowVal === 'clear' ? deleteField() : snowVal;

      const hasNumericSnow =
        (baseVal !== 'clear' && typeof baseVal === 'number') ||
        (snowVal !== 'clear' && typeof snowVal === 'number');
      payload.snowReportUpdatedAt = hasNumericSnow ? new Date().toISOString() : deleteField();

      await patchMountain(mountainId, payload);
    } catch (error) {
      console.error('Error updating mountain snow report:', error);
      alert('Failed to update snow report. Please try again.');
    }
  };

  const handleAssignInstructorToMountain = async (instructorId: string, mountainId: string) => {
    try {
      await assignInstructorToMountain(instructorId, mountainId);
    } catch (error) {
      console.error('Error assigning instructor to mountain:', error);
      alert('Failed to assign instructor to mountain. Please try again.');
    }
  };

  const handleUnassignInstructorFromMountain = async (instructorId: string) => {
    try {
      await unassignInstructorFromMountain(instructorId);
    } catch (error) {
      console.error('Error unassigning instructor from mountain:', error);
      alert('Failed to unassign instructor from mountain. Please try again.');
    }
  };

  return {
    handleDeleteUser,
    handleDeleteLesson,
    handleUpdateUserRole,
    handleUpdateLessonStatus,
    handleCreateMountain,
    handleUpdateMountainMeta,
    handleUpdateMountainSnow,
    handleAssignInstructorToMountain,
    handleUnassignInstructorFromMountain
  };
}
