import { User, Lesson, SkillAssessment, Message } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Anderson',
    email: 'instructor@slopes.com',
    role: 'instructor',
    avatar: 'https://images.unsplash.com/photo-1607503873903-c5e95f80d7b9?w=150',
    bio: 'Professional ski instructor with 10 years of experience',
    specialties: ['Alpine Skiing', 'Freestyle', 'Children']
  },
  {
    id: '2',
    name: 'Mike Johnson',
    email: 'student@slopes.com',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1618214839021-3fce2a41d042?w=150',
    bio: 'Intermediate skier looking to improve technique',
    level: 'Intermediate'
  }
];

// Get tomorrow's date at 9:00 AM
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(9, 0, 0, 0);

// Get tomorrow at 2:00 PM
const tomorrowAfternoon = new Date(tomorrow);
tomorrowAfternoon.setHours(14, 0, 0, 0);

// Get yesterday's date
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
yesterday.setHours(10, 0, 0, 0);

export const mockLessons: Lesson[] = [
  {
    id: '1',
    title: 'Private Morning Lesson',
    instructorId: '1',
    studentId: '2',
    date: tomorrow.toISOString(),
    duration: 120,
    status: 'scheduled',
    skillsFocus: ['Carving', 'Edge Control', 'Speed Management'],
    notes: 'Focus on improving edge control at higher speeds'
  },
  {
    id: '2',
    title: 'Afternoon Freestyle Session',
    instructorId: '1',
    studentId: '2',
    date: tomorrowAfternoon.toISOString(),
    duration: 90,
    status: 'scheduled',
    skillsFocus: ['Basic Jumps', 'Balance', 'Park Safety'],
    notes: 'Introduction to freestyle basics'
  },
  {
    id: '3',
    title: 'Advanced Technique Workshop',
    instructorId: '1',
    studentId: '2',
    date: yesterday.toISOString(),
    duration: 180,
    status: 'completed',
    skillsFocus: ['Advanced Carving', 'Moguls', 'Off-Piste'],
    notes: 'Excellent progress in challenging conditions'
  }
];

export const mockSkillAssessments: SkillAssessment[] = [
  {
    id: '1',
    studentId: '2',
    skillName: 'Carving',
    level: 3,
    date: '2024-03-15',
    notes: 'Good progress on edge control, needs work on weight distribution'
  },
  {
    id: '2',
    studentId: '2',
    skillName: 'Speed Control',
    level: 4,
    date: '2024-03-15',
    notes: 'Excellent progress in maintaining consistent speed'
  },
  {
    id: '3',
    studentId: '2',
    skillName: 'Freestyle Basics',
    level: 2,
    date: '2024-03-16',
    notes: 'Starting to grasp basic concepts, needs more practice'
  }
];

export const mockMessages: Message[] = [
  {
    id: '1',
    senderId: '2',
    receiverId: '1',
    content: 'Looking forward to our lesson tomorrow!',
    timestamp: '2024-03-19T15:30:00',
    read: false
  },
  {
    id: '2',
    senderId: '1',
    receiverId: '2',
    content: 'Don\'t forget to bring your new equipment!',
    timestamp: '2024-03-19T15:35:00',
    read: true
  }
];