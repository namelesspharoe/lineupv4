// Feature-based component exports
// This file serves as a central export point for all feature components

// Authentication & User Management
export { LoginForm } from '../LoginForm';
export { StudentSignup } from '../../pages/StudentSignup';
export { InstructorSignup } from '../../pages/InstructorSignup';
export { Profile } from '../../pages/Profile';

// Dashboard Features
export { StudentDashboard } from '../dashboard/student/StudentDashboard';
export { InstructorDashboard } from '../dashboard/instructor/InstructorDashboard';
export { AdminDashboard } from '../dashboard/admin/AdminDashboard';

// Messaging System
export { MessageList } from '../messages/MessageList';
export { ChatWindow } from '../messages/ChatWindow';
export { NewConversationModal } from '../messages/NewConversationModal';
export { CreateGroupModal } from '../messages/CreateGroupModal';
export { GroupSettingsModal } from '../messages/GroupSettingsModal';

// Lesson Management
export { ActiveLessons } from '../lessons/ActiveLessons';
export { EnhancedFeedbackForm } from '../lessons/EnhancedFeedbackForm';
export { StudentReviewForm } from '../lessons/StudentReviewForm';
export { UnifiedLessonModal } from '../lessons/UnifiedLessonModal';

// Instructor Features
export { InstructorGrid } from '../instructor/InstructorGrid';
export { InstructorProfileModal } from '../instructor/InstructorProfileModal';
export { InstructorRankings } from '../instructor/InstructorRankings';
export { AvailabilityDisplay } from '../instructor/AvailabilityDisplay';
export { AvailabilityForm } from '../instructor/AvailabilityForm';
export { BookLessonModal } from '../instructor/BookLessonModal';
export { FilterPanel } from '../instructor/FilterPanel';
export { Slider } from '../instructor/Slider';

// Calendar & Availability
export { AvailabilityCalendar } from '../calendar/AvailabilityCalendar';
export { AvailabilityManager } from '../calendar/AvailabilityManager';
export { DayDetailsModal } from '../calendar/DayDetailsModal';

// Booking System
export { StudentBookingInterface } from '../booking/StudentBookingInterface';

// Progress & Achievements
export { Progress } from '../../pages/Progress';
export { AchievementsPage } from '../../pages/Achievements';
export { AchievementNotification } from '../gamification/AchievementNotification';
export { Achievements } from '../gamification/Achievements';

// Profile Management
export { StudentProfile } from '../profile/StudentProfile';
export { InstructorProfile } from '../profile/InstructorProfile';
export { AdminProfile } from '../profile/AdminProfile';
export { AvatarUpload } from '../common/AvatarUpload';
export { ProfilePicturePopup } from '../common/ProfilePicturePopup';

// Common UI Components
export { LoadingSpinner, FullPageSpinner } from '../LoadingSpinner';
export { ErrorBoundary } from '../ErrorBoundary';
export { Layout } from '../Layout';
export { Navigation } from '../Navigation';
export { Footer } from '../Footer';
export { PublicHeader } from '../PublicHeader';
export { ThemeToggle } from '../ThemeToggle';
export { StudentSearch } from '../common/StudentSearch';

// Timesheet System
export { ClockInOutButton } from '../timesheet/ClockInOutButton';
export { InstructorTimesheet } from '../timesheet/InstructorTimesheet';
export { TimesheetAnalytics } from '../timesheet/TimesheetAnalytics';

// Payment & Checkout
export { CheckoutButton } from '../stripe/CheckoutButton';

// Kids Management
export { KidProfileForm } from '../kids/KidProfileForm';
export { KidProfileList } from '../kids/KidProfileList';

// Home Page Components
export { Hero } from '../home/Hero';
export { InstructorCard } from '../home/InstructorCard';
export { ProgressShowcase } from '../home/ProgressShowcase';
export { TopInstructors } from '../home/TopInstructors';
