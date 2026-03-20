import { User, Lesson } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { instructorMatchingService } from './instructorMatching';
import * as tools from './agentTools';

export interface AIAgentResponse {
  message: string;
  suggestions?: string[];
  actionType?: 'instructor_match' | 'lesson_booking' | 'general' | 'recommendation' | 'messages' | 'progress' | 'achievements' | 'schedule' | 'resources' | 'profile' | 'timecard' | 'students' | 'users' | 'stats';
  data?: any;
}

/**
 * AI Agent Service for handling user queries in messages
 */
export const aiAgentService = {
  /**
   * Process a user message and generate an AI response
   */
  async processMessage(
    userId: string,
    userMessage: string,
    user?: User
  ): Promise<AIAgentResponse> {
    const message = userMessage.toLowerCase().trim();

    // Get user data if not provided
    let currentUser = user;
    if (!currentUser) {
      const userDoc = await getDoc(doc(db, 'users', userId));
      currentUser = userDoc.data() as User;
    }

    // Intent detection
    if (this.isGreeting(message)) {
      return this.handleGreeting(currentUser);
    }

    if (this.isInstructorSearch(message)) {
      return await this.handleInstructorSearch(userId, message, currentUser);
    }

    if (this.isLessonBooking(message)) {
      return await this.handleLessonBooking(userId, message, currentUser);
    }

    if (this.isQuestion(message)) {
      return await this.handleQuestion(message, currentUser);
    }

    if (this.isRecommendationRequest(message)) {
      return await this.handleRecommendation(userId, currentUser);
    }

    const role = (currentUser?.role || 'student') as tools.UserRole;

    if (this.isMessages(message)) {
      return await this.handleMessages(userId, currentUser);
    }
    if (this.isProgress(message) && role === 'student') {
      return await this.handleProgress(userId, currentUser);
    }
    if (this.isAchievements(message) && role === 'student') {
      return await this.handleAchievements(userId, currentUser);
    }
    if (this.isSchedule(message)) {
      return await this.handleSchedule(userId, role, currentUser);
    }
    if (this.isResources(message)) {
      return this.handleResources(currentUser);
    }
    if (this.isProfile(message)) {
      return await this.handleProfile(userId, message, currentUser);
    }
    if (this.isTimecard(message) && role === 'instructor') {
      return await this.handleTimecard(userId, currentUser);
    }
    if (this.isStudents(message) && role === 'instructor') {
      return await this.handleStudents(userId, currentUser);
    }
    if (this.isUsers(message) && role === 'admin') {
      return await this.handleUsers(currentUser);
    }
    if (this.isStats(message) && role === 'admin') {
      return this.handleStats(currentUser);
    }

    // Default response
    return this.handleDefault(message, currentUser);
  },

  /**
   * Check if message is a greeting
   */
  isGreeting(message: string): boolean {
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'];
    return greetings.some(g => message.startsWith(g));
  },

  /**
   * Check if message is about finding instructors
   */
  isInstructorSearch(message: string): boolean {
    const keywords = ['find', 'search', 'instructor', 'teacher', 'coach', 'recommend', 'suggest', 'match', 'who can', 'looking for'];
    return keywords.some(keyword => message.includes(keyword));
  },

  /**
   * Check if message is about booking lessons
   */
  isLessonBooking(message: string): boolean {
    const keywords = ['book', 'schedule', 'lesson', 'class', 'appointment', 'reserve', 'when can', 'available'];
    return keywords.some(keyword => message.includes(keyword));
  },

  /**
   * Check if message is a question
   */
  isQuestion(message: string): boolean {
    return message.includes('?') || 
           message.startsWith('what') || 
           message.startsWith('how') || 
           message.startsWith('why') || 
           message.startsWith('when') || 
           message.startsWith('where') ||
           message.startsWith('can i') ||
           message.startsWith('do you');
  },

  /**
   * Check if message is requesting recommendations
   */
  isRecommendationRequest(message: string): boolean {
    const keywords = ['recommend', 'suggest', 'best', 'top', 'match', 'perfect', 'ideal'];
    return keywords.some(keyword => message.includes(keyword));
  },

  isMessages(message: string): boolean {
    const keywords = ['message', 'messages', 'conversation', 'conversations', 'chat', 'inbox', 'unread'];
    return keywords.some(keyword => message.includes(keyword));
  },

  isProgress(message: string): boolean {
    const keywords = ['progress', 'how am i', 'level', 'skill', 'improvement', 'track'];
    return keywords.some(keyword => message.includes(keyword));
  },

  isAchievements(message: string): boolean {
    const keywords = ['achievement', 'achievements', 'badge', 'badges', 'points', 'rewards'];
    return keywords.some(keyword => message.includes(keyword));
  },

  isSchedule(message: string): boolean {
    const keywords = ['schedule', 'calendar', 'availability', 'when am i', 'my calendar'];
    return keywords.some(keyword => message.includes(keyword));
  },

  isResources(message: string): boolean {
    const keywords = ['resource', 'resources', 'tips', 'help', 'learn', 'guide'];
    return keywords.some(keyword => message.includes(keyword));
  },

  isProfile(message: string): boolean {
    const keywords = ['profile', 'my profile', 'instructor profile', 'view profile'];
    return keywords.some(keyword => message.includes(keyword));
  },

  isTimecard(message: string): boolean {
    const keywords = ['timecard', 'time card', 'timesheet', 'hours', 'clock', 'earnings'];
    return keywords.some(keyword => message.includes(keyword));
  },

  isStudents(message: string): boolean {
    const keywords = ['my students', 'students', 'student list'];
    return keywords.some(keyword => message.includes(keyword));
  },

  isUsers(message: string): boolean {
    const keywords = ['users', 'all users', 'user list', 'manage users'];
    return keywords.some(keyword => message.includes(keyword));
  },

  isStats(message: string): boolean {
    const keywords = ['stats', 'statistics', 'dashboard', 'overview'];
    return keywords.some(keyword => message.includes(keyword));
  },

  /**
   * Handle greeting messages
   */
  handleGreeting(user?: User): AIAgentResponse {
    const name = user?.name?.split(' ')[0] || 'there';
    const role = user?.role || 'student';
    const studentSuggestions = ['Find me an instructor', 'Show my lesson history', 'How do I book a lesson?', 'My progress'];
    const instructorSuggestions = ['My lessons', 'My schedule', 'Timecard', 'My students'];
    const adminSuggestions = ['Users', 'Stats', 'Settings'];
    const suggestions = role === 'admin' ? adminSuggestions : role === 'instructor' ? instructorSuggestions : studentSuggestions;
    return {
      message: `Hello ${name}! 👋 I'm your AI assistant. I can help you with lessons, ${role === 'instructor' ? 'your schedule and students' : role === 'admin' ? 'users and stats' : 'progress and booking'}.\n\nWhat would you like help with today?`,
      suggestions,
      actionType: 'general'
    };
  },

  /**
   * Handle instructor search requests
   */
  async handleInstructorSearch(
    userId: string,
    message: string,
    _user?: User
  ): Promise<AIAgentResponse> {
    try {
      // Extract preferences from message
      const resort = this.extractResort(message);
      
      // Get AI recommendations
      const matches = await instructorMatchingService.matchStudentWithInstructors(
        userId,
        {
          resort: resort || undefined,
          maxResults: 3
        }
      );

      if (matches.length === 0) {
        return {
          message: `I couldn't find any instructors matching your criteria. Try:\n\n` +
                   `• Being more specific about your location\n` +
                   `• Adjusting your skill level preferences\n` +
                   `• Checking different resorts\n\n` +
                   `Would you like me to search again with different criteria?`,
          suggestions: [
            'Search at a different resort',
            'Show all instructors',
            'What resorts are available?'
          ],
          actionType: 'instructor_match'
        };
      }

      const topMatch = matches[0];
      const matchList = matches.slice(0, 3).map((match, index) => 
        `${index + 1}. **${match.instructor.name}** - ${Math.round(match.matchScore)}% match\n   ${match.reasons[0] || 'Great instructor for your level'}`
      ).join('\n\n');

      return {
        message: `I found ${matches.length} great instructor${matches.length > 1 ? 's' : ''} for you! 🎿\n\n` +
                 `${matchList}\n\n` +
                 `**Top Match:** ${topMatch.instructor.name} (${Math.round(topMatch.matchScore)}% match)\n` +
                 `Would you like to see their full profile or book a lesson?`,
        suggestions: [
          `View ${topMatch.instructor.name}'s profile`,
          'Show more instructors',
          'Book a lesson with top match'
        ],
        actionType: 'instructor_match',
        data: {
          matches,
          topMatch
        }
      };
    } catch (error) {
      console.error('Error in instructor search:', error);
      return {
        message: `I encountered an error while searching for instructors. Please try again or browse instructors manually.`,
        actionType: 'instructor_match'
      };
    }
  },

  /**
   * Handle lesson booking requests
   */
  async handleLessonBooking(
    userId: string,
    _message: string,
    user?: User
  ): Promise<AIAgentResponse> {
    try {
      const role = (user?.role || 'student') as tools.UserRole;
      const pastLessons = await tools.getMyLessons(userId, role);
      const upcomingLessons = pastLessons.filter(
        (lesson: Lesson) => lesson.status === 'scheduled' || lesson.status === 'in_progress'
      );

      if (upcomingLessons.length > 0) {
        const lessonList = upcomingLessons.slice(0, 3).map((lesson: Lesson) =>
          `• ${lesson.title} - ${lesson.date}`
        ).join('\n');

        return {
          message: `You have ${upcomingLessons.length} upcoming lesson${upcomingLessons.length > 1 ? 's' : ''}:\n\n` +
                   `${lessonList}\n\n` +
                   `Would you like to book another lesson or view your lesson history?`,
          suggestions: [
            'Book another lesson',
            'View all my lessons',
            role === 'student' ? 'Find an instructor' : 'My schedule'
          ],
          actionType: 'lesson_booking',
          data: { lessons: upcomingLessons }
        };
      }

      return {
        message: role === 'instructor'
          ? `You don't have any upcoming lessons scheduled. Check your availability or students list.`
          : `You don't have any upcoming lessons yet. Let me help you find the perfect instructor to book with! 🎿\n\n` +
            `I can:\n` +
            `• Match you with instructors based on your preferences\n` +
            `• Show you available instructors at your preferred resort\n` +
            `• Help you schedule your first lesson\n\n` +
            `What would you like to do?`,
        suggestions: role === 'instructor'
          ? ['My schedule', 'My students', 'My availability']
          : ['Find me an instructor', 'Show available instructors', 'How do I book a lesson?'],
        actionType: 'lesson_booking'
      };
    } catch (error) {
      console.error('Error in lesson booking:', error);
      return {
        message: `I encountered an error while checking your lessons. Please try again.`,
        actionType: 'lesson_booking'
      };
    }
  },

  /**
   * Handle general questions
   */
  async handleQuestion(message: string, _user?: User): Promise<AIAgentResponse> {
    // Common questions and answers
    const qa: Record<string, string> = {
      'how do i book': 'To book a lesson:\n1. Go to "Book Lesson" page\n2. Browse or use AI recommendations\n3. Select an instructor\n4. Choose date and time\n5. Confirm booking',
      'how much': 'Lesson prices vary by instructor and type. Most instructors charge between $50-$200 per hour. Check individual instructor profiles for exact pricing.',
      'what is': 'This is a platform connecting students with certified ski and snowboard instructors. We use AI to match you with the perfect instructor!',
      'where are': 'We have instructors at major resorts including Aspen, Vail, Breckenridge, Park City, Deer Valley, Jackson Hole, Big Sky, and Telluride.',
      'can i': 'Yes! You can book lessons, message instructors, track your progress, and more. What would you like to do?',
      'do you': 'I can help you find instructors, book lessons, answer questions, and provide recommendations. Just ask!'
    };

    for (const [key, answer] of Object.entries(qa)) {
      if (message.includes(key)) {
        return {
          message: answer,
          actionType: 'general'
        };
      }
    }

    return {
      message: `I'm here to help! I can assist with:\n\n` +
               `• Finding instructors\n` +
               `• Booking lessons\n` +
               `• Platform questions\n` +
               `• Getting recommendations\n\n` +
               `Could you be more specific about what you need?`,
      suggestions: [
        'How do I book a lesson?',
        'Find me an instructor',
        'What resorts are available?'
      ],
      actionType: 'general'
    };
  },

  /**
   * Handle recommendation requests
   */
  async handleRecommendation(userId: string, _user?: User): Promise<AIAgentResponse> {
    try {
      const matches = await instructorMatchingService.matchStudentWithInstructors(
        userId,
        { maxResults: 1 }
      );

      if (matches.length === 0) {
        return {
          message: `I need a bit more information to give you the best recommendation. Could you tell me:\n\n` +
                   `• Your skill level\n` +
                   `• Preferred resort\n` +
                   `• What you want to learn\n\n` +
                   `Or I can show you all available instructors!`,
          suggestions: [
            'Show all instructors',
            'Update my preferences',
            'What information do you need?'
          ],
          actionType: 'recommendation'
        };
      }

      const match = matches[0];
      return {
        message: `Based on your profile, I recommend **${match.instructor.name}**! ⭐\n\n` +
                 `**Match Score:** ${Math.round(match.matchScore)}%\n\n` +
                 `**Why this match:**\n${match.reasons.slice(0, 3).map(r => `• ${r}`).join('\n')}\n\n` +
                 `Would you like to view their profile or book a lesson?`,
        suggestions: [
          `View ${match.instructor.name}'s profile`,
          'Show more recommendations',
          'Book a lesson'
        ],
        actionType: 'recommendation',
        data: { match }
      };
    } catch (error) {
      console.error('Error in recommendation:', error);
      return {
        message: `I encountered an error while generating recommendations. Please try again.`,
        actionType: 'recommendation'
      };
    }
  },

  async handleMessages(userId: string, _user?: User): Promise<AIAgentResponse> {
    try {
      const summary = await tools.getMyMessagesSummary(userId);
      const { conversationCount, unreadCount } = summary;
      const msg = unreadCount > 0
        ? `You have ${conversationCount} conversation${conversationCount !== 1 ? 's' : ''} and **${unreadCount}** unread message${unreadCount !== 1 ? 's' : ''}.`
        : `You have ${conversationCount} conversation${conversationCount !== 1 ? 's' : ''}.`;
      return {
        message: `${msg}\n\nOpen Messages to view and reply.`,
        suggestions: ['Open Messages', 'Find an instructor', 'My lessons'],
        actionType: 'messages',
        data: { conversationCount, unreadCount }
      };
    } catch (error) {
      console.error('Error in messages:', error);
      return { message: 'I couldn\'t load your messages. Try opening Messages from the menu.', actionType: 'messages', suggestions: ['Open Messages'] };
    }
  },

  async handleProgress(userId: string, _user?: User): Promise<AIAgentResponse> {
    try {
      const { progress, analytics } = await tools.getMyProgress(userId);
      if (!progress && !analytics) {
        return {
          message: 'You don\'t have progress recorded yet. Complete lessons and get feedback from instructors to see your progress here.',
          suggestions: ['Book a lesson', 'My lessons', 'My achievements'],
          actionType: 'progress'
        };
      }
      const level = (progress?.level ?? analytics?.recentProgress?.[0]?.currentLevel) ?? '—';
      const total = progress?.totalLessons ?? progress?.completedLessons ?? 0;
      const msg = `Your progress: **Level** ${level}, **${total}** lesson${total !== 1 ? 's' : ''} completed.`;
      return {
        message: `${msg}\n\nOpen Progress to see details and skill breakdown.`,
        suggestions: ['Open Progress', 'My achievements', 'My lessons'],
        actionType: 'progress',
        data: { progress, analytics }
      };
    } catch (error) {
      console.error('Error in progress:', error);
      return { message: 'I couldn\'t load your progress. Try the Progress page.', actionType: 'progress', suggestions: ['Open Progress'] };
    }
  },

  async handleAchievements(userId: string, _user?: User): Promise<AIAgentResponse> {
    try {
      const stats = await tools.getMyAchievements(userId);
      const { totalAchievements, totalPoints, recentAchievements } = stats;
      const recent = recentAchievements?.length ? recentAchievements.slice(0, 3).map((a: { name: string; icon?: string }) => `${a.icon || '🏅'} ${a.name}`).join(', ') : 'none yet';
      const message = `You have **${totalAchievements}** achievement${totalAchievements !== 1 ? 's' : ''} (${totalPoints} points). Recent: ${recent}.`;
      return {
        message: `${message}\n\nOpen Achievements to see all badges.`,
        suggestions: ['Open Achievements', 'My progress', 'My lessons'],
        actionType: 'achievements',
        data: stats
      };
    } catch (error) {
      console.error('Error in achievements:', error);
      return { message: 'I couldn\'t load achievements. Try the Achievements page.', actionType: 'achievements', suggestions: ['Open Achievements'] };
    }
  },

  async handleSchedule(userId: string, role: tools.UserRole, _user?: User): Promise<AIAgentResponse> {
    try {
      if (role === 'instructor') {
        const availability = await tools.getMyAvailability(userId);
        const count = availability?.length ?? 0;
        const message = count > 0
          ? `You have **${count}** availability slot${count !== 1 ? 's' : ''} set. Open Schedule to manage your calendar.`
          : 'You don\'t have any availability set yet. Open Schedule to add your available times.';
        return {
          message,
          suggestions: ['Open Schedule', 'My lessons', 'Timecard'],
          actionType: 'schedule',
          data: { availability }
        };
      }
      const lessons = await tools.getMyLessons(userId, 'student');
      const upcoming = lessons.filter((l: Lesson) => l.status === 'scheduled' || l.status === 'in_progress');
      const message = upcoming.length > 0
        ? `You have **${upcoming.length}** upcoming lesson${upcoming.length !== 1 ? 's' : ''}. Open Schedule to see the full calendar.`
        : 'You don\'t have any lessons scheduled. Book a lesson to get started.';
      return {
        message,
        suggestions: ['Open Schedule', 'Book a lesson', 'My lessons'],
        actionType: 'schedule',
        data: { lessons: upcoming }
      };
    } catch (error) {
      console.error('Error in schedule:', error);
      return { message: 'I couldn\'t load schedule. Try the Schedule page.', actionType: 'schedule', suggestions: ['Open Schedule'] };
    }
  },

  handleResources(_user?: User): AIAgentResponse {
    return {
      message: 'Resources include tips, guides, and learning materials. Open the Resources page to browse.',
      suggestions: ['Open Resources', 'My progress', 'How do I book a lesson?'],
      actionType: 'resources'
    };
  },

  async handleProfile(userId: string, _message: string, _user?: User): Promise<AIAgentResponse> {
    const profileUser = await tools.getProfile(userId);
    if (!profileUser) {
      return {
        message: 'I couldn\'t load that profile. Try opening Profile from the menu.',
        suggestions: ['My profile', 'Find an instructor'],
        actionType: 'profile'
      };
    }
    const name = profileUser.name || 'User';
    return {
      message: `**${name}** — ${profileUser.role}. Open profile to view or edit.`,
      suggestions: ['My profile', 'Find an instructor', 'My lessons'],
      actionType: 'profile',
      data: { profileUserId: profileUser.id, user: profileUser }
    };
  },

  async handleTimecard(userId: string, _user?: User): Promise<AIAgentResponse> {
    try {
      const summary = await tools.getTimecardSummary(userId);
      const { activeEntry, entriesToday, completedToday, totalEarningsToday } = summary;
      let message = activeEntry
        ? 'You have an **active** time entry. Clock out from the Timecard page when done.'
        : `Today: **${entriesToday}** entr${entriesToday !== 1 ? 'ies' : 'y'}, **${completedToday}** completed.`;
      if (typeof totalEarningsToday === 'number' && totalEarningsToday > 0) {
        message += ` Earnings today: $${totalEarningsToday.toFixed(2)}.`;
      }
      return {
        message: `${message}\n\nOpen Timecard to log hours.`,
        suggestions: ['Open Timecard', 'My schedule', 'My lessons'],
        actionType: 'timecard',
        data: summary
      };
    } catch (error) {
      console.error('Error in timecard:', error);
      return { message: 'I couldn\'t load your timecard. Try the Timecard page.', actionType: 'timecard', suggestions: ['Open Timecard'] };
    }
  },

  async handleStudents(userId: string, _user?: User): Promise<AIAgentResponse> {
    try {
      const studentIds = await tools.getMyStudentsList(userId);
      const count = studentIds.length;
      return {
        message: `You have **${count}** student${count !== 1 ? 's' : ''} who have taken lessons with you. Open Students to view the list.`,
        suggestions: ['Open Students', 'My lessons', 'My schedule'],
        actionType: 'students',
        data: { studentIds }
      };
    } catch (error) {
      console.error('Error in students:', error);
      return { message: 'I couldn\'t load your students. Try the Students page.', actionType: 'students', suggestions: ['Open Students'] };
    }
  },

  async handleUsers(_user?: User): Promise<AIAgentResponse> {
    try {
      const list = await tools.getUsersList();
      const count = list?.length ?? 0;
      return {
        message: `There are **${count}** users. Open Users to manage.`,
        suggestions: ['Open Users', 'Stats', 'Settings'],
        actionType: 'users',
        data: { count }
      };
    } catch (error) {
      console.error('Error in users:', error);
      return { message: 'I couldn\'t load users. Try the Users page.', actionType: 'users', suggestions: ['Open Users'] };
    }
  },

  handleStats(_user?: User): AIAgentResponse {
    return {
      message: 'Open Stats for an overview of platform statistics and insights.',
      suggestions: ['Open Stats', 'Users', 'Settings'],
      actionType: 'stats'
    };
  },

  /**
   * Handle default/unrecognized messages
   */
  handleDefault(_message: string, user?: User): AIAgentResponse {
    const role = user?.role || 'student';
    const suggestions = role === 'admin'
      ? ['Users', 'Stats', 'Settings']
      : role === 'instructor'
        ? ['My lessons', 'My schedule', 'Timecard', 'My students']
        : ['Find me an instructor', 'How do I book a lesson?', 'Show my lessons', 'My progress'];
    return {
      message: `I'm not sure I understand. I can help with lessons, ${role === 'student' ? 'progress and booking' : role === 'instructor' ? 'schedule and students' : 'users and stats'}. Try one of the suggestions below.`,
      suggestions,
      actionType: 'general'
    };
  },

  /**
   * Extract resort name from message
   */
  extractResort(message: string): string | null {
    const resorts = ['Aspen', 'Vail', 'Breckenridge', 'Park City', 'Deer Valley', 'Jackson Hole', 'Big Sky', 'Telluride'];
    for (const resort of resorts) {
      if (message.includes(resort.toLowerCase())) {
        return resort;
      }
    }
    return null;
  },

  /**
   * Extract skill level from message
   */
  extractLevel(message: string): string | null {
    const levels = ['beginner', 'intermediate', 'advanced', 'expert', 'first time', 'first-time'];
    for (const level of levels) {
      if (message.includes(level)) {
        return level;
      }
    }
    return null;
  }
};

/**
 * AI Agent User - Special user object for the AI assistant
 */
export const AI_AGENT_USER: User = {
  id: 'ai-assistant',
  name: 'AI Assistant',
  email: 'ai@lineup.com',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=150',
  bio: 'Your intelligent assistant for finding instructors, booking lessons, and getting recommendations.'
};






