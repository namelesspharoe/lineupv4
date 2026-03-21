// Add KidProfile interface to existing types
export interface KidProfile {
  id: string;
  parentId: string;
  name: string;
  age: number;
  allergies: string;
  helmet_color: string;
  jacket_color: string;
  pants_color: string;
  level: 'first_time' | 'developing_turns' | 'linking_turns' | 'confident_turns' | 'consistent_blue';
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  created_at: string;
  updated_at: string;
}

/** Ski vs snowboard — used on users (discipline), lessons (sport), and feedback. */
export type LessonSport = 'skiing' | 'snowboarding';

/** Student skill step (signup, feedback, studentProgress). Not used for instructor teaching-level strings. */
export type StudentSkillLevel =
  | 'first_time'
  | 'developing_turns'
  | 'linking_turns'
  | 'confident_turns'
  | 'consistent_blue';

/** Student’s season pass — signup + preferences. */
export type SkiPassType = 'ikon' | 'epic' | 'both' | 'independent' | 'none';

/** Resort network tags on mountain docs (Ikon / Epic). */
export type MountainPassAffiliation = 'ikon' | 'epic';

/** Stable region bucket for grouping resorts in Book Lesson. */
export type MountainRegionId =
  | 'usa_rockies'
  | 'usa_pnw'
  | 'usa_northeast'
  | 'usa_southwest'
  | 'usa_other'
  | 'canada'
  | 'international'
  | 'other';

/** Instructor payroll: lesson time vs resort/non-lesson; extensible for future modifiers. */
export interface InstructorPaySettings {
  /** Resort / admin / non-lesson clock-ins (`lessonId` general or unset). */
  baseRatePerHour?: number;
  /** Clock-ins tied to a real lesson id. */
  teachRatePerHour?: number;
  /** Future: overtime multiplier, large-group add-on, etc. */
  payModifiers?: Record<string, number>;
}

export interface StudentPreferences {
  maxPrice?: number;
  preferredLessonType?: 'private' | 'group' | 'workshop' | 'any';
  learningGoals?: string[];
  preferredDays?: string[];
  preferredTimes?: string[];
  preferredInstructorGender?: string;
  preferredInstructorExperience?: string;
  learningStyle?: string;
  /** Season pass the student skis on (Book Lesson defaults, matching). */
  skiPass?: SkiPassType;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  avatar: string;
  /** Primary sport — especially for students (ski vs snowboard). */
  discipline?: LessonSport;
  bio?: string;
  phone?: string;
  address?: string;
  homeMountain?: string; // Only for instructors
  mountainId?: string;
  specialties?: string[];
  /**
   * Instructor: teaching / matching level (freeform).
   * Student: same value as `studentSkillLevel` when set; use `getStudentSkillLevel()` for typed reads.
   */
  level?: string;
  /** Student-only: canonical skill step; kept in sync with `level` for students. */
  studentSkillLevel?: StudentSkillLevel;
  certifications?: string[];
  languages?: string[];
  yearsOfExperience?: number;
  price?: number;
  hourlyRate?: number;
  /** Instructor: structured teach vs base pay for timesheet. */
  instructorPay?: InstructorPaySettings;
  preferredLocations?: string[];
  qualifications?: string;
  gender?: string;
  isGroup?: boolean;
  participants?: string[];
  createdAt?: string;
  /** Student-only: AI matching + Book Lesson defaults (pass, price, goals, …). */
  studentPreferences?: StudentPreferences;
}

export interface Mountain {
  id: string;
  name: string;
  description?: string;
  location?: string;
  /** Region bucket for browse grouping; legacy docs treated as `other`. */
  regionId?: MountainRegionId;
  /** Ikon / Epic (or both) — empty/undefined until admin tags the resort. */
  passAffiliations?: MountainPassAffiliation[];
  privateLessonPrice?: number;
  groupLessonPrice?: number;
  /** Reported base depth (inches); used to sort resorts for students (higher first). */
  baseDepthInches?: number;
  /** Optional secondary sort / display: fresh snow in last 24h (inches). */
  snowfall24hInches?: number;
  /** When snow figures were last updated (ISO string). */
  snowReportUpdatedAt?: string;
  instructorIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SkillProgress {
  id: string;
  studentId: string;
  skillName: string;
  currentLevel: number; // 1-5 scale
  previousLevel: number;
  progressDate: string;
  instructorNotes: string;
  nextGoals: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentProgress {
  id: string;
  studentId: string;
  name: string;
  level: StudentSkillLevel;
  totalLessons: number;
  completedLessons: number;
  skillProgress: {
    skiing: {
      level: number;
      progress: number;
      skills: string[];
      lastUpdated: string;
    };
    snowboarding: {
      level: number;
      progress: number;
      skills: string[];
      lastUpdated: string;
    };
  };
  achievements: string[];
  streakDays: number;
  totalPoints: number;
  lastActivity: string;
  lastUpdated: string;
}

export interface Achievement {
  id: string;
  studentId: string;
  name: string;
  description: string;
  icon: string;
  unlockedDate: string;
  category: 'skill' | 'milestone' | 'social' | 'streak';
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'skill' | 'milestone' | 'social' | 'streak';
  criteria: {
    type: 'lessons_completed' | 'skill_level' | 'rating_achieved' | 'streak_days' | 'feedback_count' | 'level_up' | 'account_created';
    value: number;
    condition?: 'gte' | 'eq' | 'lte';
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlockedAt?: string;
}

export interface LessonFeedback {
  id: string;
  lessonId: string;
  studentId: string;
  instructorId: string;
  date: string;
  sport?: 'skiing' | 'snowboarding'; // Track which sport the feedback is for
  
  // Performance Assessment (1-5 scale)
  performance: {
    technique: number;
    control: number;
    confidence: number;
    safety: number;
    overall: number;
  };
  
  // Skill Assessment
  skillAssessment: {
    currentLevel: string;
    nextSteps: string[];
    recommendations: string;
    areasOfFocus: string[];
  };
  
  // Detailed Feedback
  strengths: string[];
  areasForImprovement: string[];
  instructorNotes: string;
  homework: string;
  
  // Progress Tracking
  progressUpdate: {
    skillsImproved: string[];
    newSkillsLearned: string[];
    levelUp: boolean;
    newLevel?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface StudentReview {
  studentId?: string;
  rating: number;
  comment: string;
  createdAt: Date;
  isApproved?: boolean; // Whether the instructor has approved this review for public display
  isHidden?: boolean; // Whether the instructor has hidden this review
}

export interface Lesson {
  id: string;
  title: string;
  instructorId: string;
  studentIds: string[];
  date: string;
  /** Ski or snowboard for this session (defaults to skiing for legacy docs). */
  sport?: LessonSport;
  sessionType: 'morning' | 'afternoon' | 'full_day';
  startTime?: string;
  endTime?: string;
  status: 'available' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  /** Instructor scratchpad during / right after the session (not the public lesson description). */
  sessionNotes?: string;
  skillsFocus: string[];
  type: 'private' | 'group' | 'workshop';
  maxStudents: number;
  skillLevel: 'first_time' | 'developing_turns' | 'linking_turns' | 'confident_turns' | 'consistent_blue';
  price: number;
  description: string;
  feedback?: LessonFeedback[];
  studentReviews?: StudentReview[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  messageType: 'text' | 'image' | 'file' | 'system';
  conversationId?: string;
  senderName?: string; // Name of the sender for display
  senderAvatar?: string; // Avatar of the sender for display
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  replyTo?: string; // ID of message being replied to
  createdAt?: string;
  updatedAt?: string;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file' | 'audio' | 'video';
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
  thumbnail?: string;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string;
  groupSettings?: GroupSettings;
  createdBy?: string;
  createdAt?: string;
}

export interface GroupSettings {
  allowMemberInvites: boolean;
  allowMemberLeave: boolean;
  allowMemberMessages: boolean;
  maxParticipants: number;
  description?: string;
}

export interface GroupMember {
  userId: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: string;
  addedBy?: string;
}

export interface SkillAssessment {
  id: string;
  studentId: string;
  skillName: string;
  level: number;
  date: string;
  notes?: string;
}

export interface Availability {
  id: string;
  instructorId: string;
  date: string;
  startTime: string;
  endTime: string;
  source?: 'manual' | 'timesheet' | 'pattern';
  timeEntryId?: string;
  hourlyRate?: number;
  totalEarnings?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  lessonId: string;
  instructorId: string;
  clockIn: string;
  clockOut?: string;
  status: 'active' | 'completed' | 'disputed';
  verificationMethod: 'manual' | 'gps' | 'qr';
  breaks: Array<{
    startTime: string;
    endTime?: string;
    duration?: number;
  }>;
  notes?: string;
  hourlyRate?: number;
  /** Snapshot at clock-in for teach vs non-lesson classification. */
  payCategory?: 'teaching' | 'non_lesson';
  /** Rate used for this entry (matches hourlyRate when set). */
  appliedRatePerHour?: number;
  totalEarnings?: number;
  verificationData?: {
    location?: {
      latitude: number;
      longitude: number;
    };
    disputeReason?: string;
  };
  createdAt: string;
  updatedAt: string;
}