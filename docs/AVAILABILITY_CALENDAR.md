# Real-Time Availability Calendar System

## Overview

The real-time availability calendar system provides a comprehensive solution for managing instructor availability and lesson scheduling. It includes visual calendar interfaces, availability management tools, and seamless integration with the lesson booking system.

## Features

### 🗓️ Visual Calendar Interface
- **Monthly View**: Full calendar grid showing availability and lessons
- **Time Slot Visualization**: Color-coded time slots (Morning, Afternoon, Full Day)
- **Real-time Updates**: Live updates when lessons are created or availability changes
- **Interactive Elements**: Click on time slots to create lessons or view details

### 📅 Availability Management
- **Pattern-Based Scheduling**: Set recurring availability patterns (e.g., every Monday 9AM-12PM)
- **Quick Date Selection**: Select specific dates for availability
- **Batch Operations**: Create or delete availability for multiple dates at once
- **Time Slot Configuration**: Customize start and end times

### 🎯 Role-Based Access
- **Instructor View**: Manage personal availability and create lessons
- **Student View**: Browse instructor availability and book lessons
- **Admin View**: Oversee all instructor schedules and lesson management

## Components

### AvailabilityCalendar
The main calendar component that displays availability and lessons.

**Props:**
- `instructor?: User` - Instructor to display availability for
- `onLessonCreated?: () => void` - Callback when lesson is created
- `viewMode?: 'instructor' | 'admin' | 'student'` - Access level

**Features:**
- Monthly navigation
- Time slot visualization
- Lesson creation integration
- Real-time data loading

### AvailabilityManager
Advanced availability management interface for instructors.

**Features:**
- Weekly pattern creation
- Date range selection
- Time slot customization
- Batch availability operations

## Usage Examples

### For Instructors

1. **Set Availability Patterns**
   ```typescript
   // Navigate to instructor dashboard
   // Click "Manage Availability"
   // Create patterns for recurring availability
   ```

2. **View Calendar**
   ```typescript
   // Click "View Calendar" in dashboard
   // See all availability and lessons
   // Click time slots to create lessons
   ```

3. **Quick Availability**
   ```typescript
   // Use quick date selection
   // Select specific dates
   // Set availability for those dates
   ```

### For Students

1. **Browse Instructor Availability**
   ```typescript
   // Find instructor on FindInstructor page
   // Click "View Availability" in profile
   // See available time slots
   ```

2. **Book Lessons**
   ```typescript
   // Click on available time slot
   // Fill in lesson details
   // Confirm booking
   ```

## Data Flow

### Availability Data
```typescript
interface Availability {
  id: string;
  instructorId: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  createdAt: string;
  updatedAt: string;
}
```

### Lesson Integration
```typescript
interface Lesson {
  id: string;
  instructorId: string;
  date: string;
  time: 'morning' | 'afternoon' | 'full_day';
  startTime?: string;
  endTime?: string;
  // ... other fields
}
```

## Time Slots

The system uses predefined time slots for consistency:

- **Morning**: 9:00 AM - 12:00 PM (Blue)
- **Afternoon**: 1:00 PM - 4:00 PM (Green)  
- **Full Day**: 9:00 AM - 5:00 PM (Purple)

## Integration Points

### Firebase Collections
- `instructorAvailability` - Stores availability records
- `lessons` - Stores lesson bookings
- `users` - Instructor and student data

### Services
- `availability.ts` - Availability CRUD operations
- `lessons.ts` - Lesson management
- `users.ts` - User data access

### Components
- `UnifiedLessonModal` - Lesson creation/booking
- `InstructorDashboard` - Instructor calendar access
- `InstructorProfileModal` - Student calendar access

## Best Practices

### Performance
- Use memoization for expensive calculations
- Implement pagination for large datasets
- Cache availability data when possible

### User Experience
- Provide clear visual feedback
- Use consistent color coding
- Include loading states
- Handle errors gracefully

### Data Consistency
- Validate time slot conflicts
- Ensure availability before booking
- Update related data atomically

## Future Enhancements

### Planned Features
- **Drag & Drop**: Drag lessons between time slots
- **Recurring Lessons**: Set up repeating lesson patterns
- **Conflict Detection**: Automatic conflict warnings
- **Mobile Optimization**: Touch-friendly interface
- **Calendar Sync**: Export to external calendars
- **Notifications**: Real-time availability alerts

### Technical Improvements
- **WebSocket Integration**: Real-time updates
- **Offline Support**: Work without internet
- **Advanced Filtering**: Filter by location, skill level
- **Analytics**: Usage and availability insights

## Troubleshooting

### Common Issues

1. **Calendar Not Loading**
   - Check Firebase permissions
   - Verify instructor ID
   - Check network connectivity

2. **Availability Not Saving**
   - Validate date format (YYYY-MM-DD)
   - Check time format (HH:MM)
   - Verify Firebase rules

3. **Lesson Creation Fails**
   - Ensure time slot is available
   - Check instructor permissions
   - Validate lesson data

### Debug Mode
Enable debug logging by setting:
```typescript
localStorage.setItem('debug', 'calendar');
```

## API Reference

### AvailabilityCalendar Methods
- `handleDateClick(day)` - Handle date selection
- `handleTimeSlotClick(day, timeSlot)` - Handle time slot selection
- `loadCalendarData()` - Load availability and lesson data

### AvailabilityManager Methods
- `handleSavePatterns()` - Save recurring patterns
- `handleSaveSelectedDates()` - Save specific dates
- `handleDeleteSelectedDates()` - Remove availability

## Support

For issues or questions about the availability calendar system:
1. Check this documentation
2. Review Firebase console logs
3. Test with different user roles
4. Verify data consistency 