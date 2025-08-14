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

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  avatar: string;
  bio?: string;
  phone?: string;
  specialties?: string[];
  level?: string;
  certifications?: string[];
  languages?: string[];
  yearsOfExperience?: number;
  price?: number;
  hourlyRate?: number;
  preferredLocations?: string[];
  qualifications?: string;
  isGroup?: boolean;
  participants?: string[];
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
  level: string; // 'first_time' | 'developing_turns' | 'linking_turns' | 'confident_turns' | 'consistent_blue'
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
  time: 'morning' | 'afternoon' | 'full_day';
  startTime?: string;
  endTime?: string;
  status: 'available' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
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
  createdAt: string;
  updatedAt: string;
}