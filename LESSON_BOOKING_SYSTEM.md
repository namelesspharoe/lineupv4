# Unified Lesson Booking System

## Overview

The new unified lesson booking system provides a simplified, consistent way to create and book lessons across the entire application. It works for all user types (admin, instructor, student) with a single modal component.

## Key Features

### 1. **Unified Modal Component**
- **File**: `src/components/lessons/UnifiedLessonModal.tsx`
- **Purpose**: Single modal for all lesson creation and booking
- **Modes**: 
  - `create`: For admins and instructors to create lessons
  - `book`: For students to book lessons with instructors

### 2. **Simplified Data Structure**
- Consistent field names throughout the app
- No complex data transformations
- Clear separation between lesson creation and booking

### 3. **Role-Based Access**
- **Admin**: Can create lessons for any instructor
- **Instructor**: Can create lessons for themselves
- **Student**: Can book lessons with instructors

## Components

### UnifiedLessonModal
```typescript
interface UnifiedLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'book';
  instructor?: User; // Required for booking mode
  existingLesson?: Lesson; // For editing existing lessons
}
```

### useLessonBooking Hook
```typescript
const {
  isBookingModalOpen,
  selectedInstructor,
  bookingMode,
  openBookingModal,
  closeBookingModal,
  handleBookingSuccess
} = useLessonBooking({
  onSuccess: () => console.log('Lesson booked!'),
  onError: (error) => console.error('Booking failed:', error)
});
```

## Usage Examples

### For Students (Booking)
```typescript
import { UnifiedLessonModal } from '../components/lessons/UnifiedLessonModal';

// In instructor profile modal
<UnifiedLessonModal
  isOpen={showBooking}
  onClose={() => setShowBooking(false)}
  mode="book"
  instructor={instructor}
/>
```

### For Instructors (Creating)
```typescript
import { UnifiedLessonModal } from '../components/lessons/UnifiedLessonModal';

// In instructor dashboard
<UnifiedLessonModal
  isOpen={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  mode="create"
/>
```

### For Admins (Creating for Others)
```typescript
import { UnifiedLessonModal } from '../components/lessons/UnifiedLessonModal';

// In admin dashboard
<UnifiedLessonModal
  isOpen={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  mode="create"
  instructor={selectedInstructor}
/>
```

## Data Flow

1. **Student Booking Flow**:
   - Student clicks "Book Lesson" on instructor profile
   - UnifiedLessonModal opens in "book" mode
   - Student fills out lesson details
   - Lesson is created with student as participant

2. **Instructor Creation Flow**:
   - Instructor clicks "Create Lesson" in dashboard
   - UnifiedLessonModal opens in "create" mode
   - Instructor fills out lesson details
   - Lesson is created as "available" for booking

3. **Admin Creation Flow**:
   - Admin selects instructor and clicks "Create Lesson"
   - UnifiedLessonModal opens in "create" mode
   - Admin fills out lesson details
   - Lesson is created for the selected instructor

## Benefits

1. **Consistency**: Same UI and logic across all user types
2. **Maintainability**: Single component to maintain
3. **Simplicity**: No complex data transformations
4. **Flexibility**: Easy to extend with new features
5. **Error Handling**: Centralized validation and error handling

## Migration from Old System

The old system had multiple issues:
- Complex data transformations between `price` and `hourlyRate`
- Multiple modal components with different interfaces
- Inconsistent validation logic
- Hard to maintain and extend

The new system:
- Uses consistent field names (`price` throughout)
- Single modal component with mode-based behavior
- Simplified validation in the service layer
- Easy to maintain and extend

## Future Enhancements

1. **Availability Integration**: Connect with instructor availability calendar
2. **Payment Integration**: Add Stripe payment processing
3. **Notifications**: Add email/SMS notifications for bookings
4. **Recurring Lessons**: Support for weekly/monthly lesson series
5. **Group Management**: Better handling of group lesson participants 