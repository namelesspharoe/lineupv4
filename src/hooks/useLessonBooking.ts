import { useState } from 'react';
import { User, Lesson } from '../types';

interface UseLessonBookingProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useLessonBooking({ onSuccess, onError }: UseLessonBookingProps = {}) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<User | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [bookingMode, setBookingMode] = useState<'create' | 'book'>('book');

  const openBookingModal = (instructor: User, mode: 'create' | 'book' = 'book') => {
    setSelectedInstructor(instructor);
    setBookingMode(mode);
    setIsBookingModalOpen(true);
  };

  const openLessonEditModal = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setBookingMode('create');
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedInstructor(null);
    setSelectedLesson(null);
  };

  const handleBookingSuccess = () => {
    onSuccess?.();
    closeBookingModal();
  };

  const handleBookingError = (error: string) => {
    onError?.(error);
  };

  return {
    isBookingModalOpen,
    selectedInstructor,
    selectedLesson,
    bookingMode,
    openBookingModal,
    openLessonEditModal,
    closeBookingModal,
    handleBookingSuccess,
    handleBookingError
  };
} 