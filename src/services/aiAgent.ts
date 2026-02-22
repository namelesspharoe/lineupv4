import { User, Lesson } from '../types';
import { collection, query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getLessonsByStudent } from './lessons';
import { instructorMatchingService } from './instructorMatching';

export interface AIAgentResponse {
  message: string;
  suggestions?: string[];
  actionType?: 'instructor_match' | 'lesson_booking' | 'general' | 'recommendation';
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

  /**
   * Handle greeting messages
   */
  handleGreeting(user?: User): AIAgentResponse {
    const name = user?.name?.split(' ')[0] || 'there';
    const role = user?.role || 'student';
    
    return {
      message: `Hello ${name}! 👋 I'm your AI assistant. I can help you:\n\n` +
               `• Find the perfect instructor for your skill level\n` +
               `• Book lessons and check availability\n` +
               `• Answer questions about our platform\n` +
               `• Get personalized recommendations\n\n` +
               `What would you like help with today?`,
      suggestions: [
        'Find me an instructor',
        'Show my lesson history',
        'How do I book a lesson?',
        'What are the best instructors?'
      ],
      actionType: 'general'
    };
  },

  /**
   * Handle instructor search requests
   */
  async handleInstructorSearch(
    userId: string,
    message: string,
    user?: User
  ): Promise<AIAgentResponse> {
    try {
      // Extract preferences from message
      const resort = this.extractResort(message);
      const level = user?.level || this.extractLevel(message);
      
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
    message: string,
    user?: User
  ): Promise<AIAgentResponse> {
    try {
      // Get user's past lessons
      const pastLessons = await getLessonsByStudent(userId);
      const upcomingLessons = pastLessons.filter(
        lesson => lesson.status === 'scheduled' || lesson.status === 'in_progress'
      );

      if (upcomingLessons.length > 0) {
        const lessonList = upcomingLessons.slice(0, 3).map(lesson => 
          `• ${lesson.title} - ${lesson.date}`
        ).join('\n');

        return {
          message: `You have ${upcomingLessons.length} upcoming lesson${upcomingLessons.length > 1 ? 's' : ''}:\n\n` +
                   `${lessonList}\n\n` +
                   `Would you like to book another lesson or view your lesson history?`,
          suggestions: [
            'Book another lesson',
            'View all my lessons',
            'Find an instructor'
          ],
          actionType: 'lesson_booking',
          data: { lessons: upcomingLessons }
        };
      }

      return {
        message: `You don't have any upcoming lessons yet. Let me help you find the perfect instructor to book with! 🎿\n\n` +
                 `I can:\n` +
                 `• Match you with instructors based on your preferences\n` +
                 `• Show you available instructors at your preferred resort\n` +
                 `• Help you schedule your first lesson\n\n` +
                 `What would you like to do?`,
        suggestions: [
          'Find me an instructor',
          'Show available instructors',
          'How do I book a lesson?'
        ],
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
  async handleQuestion(message: string, user?: User): Promise<AIAgentResponse> {
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
  async handleRecommendation(userId: string, user?: User): Promise<AIAgentResponse> {
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

  /**
   * Handle default/unrecognized messages
   */
  handleDefault(message: string, user?: User): AIAgentResponse {
    return {
      message: `I'm not sure I understand. I can help you with:\n\n` +
               `• Finding instructors that match your preferences\n` +
               `• Booking and managing lessons\n` +
               `• Answering questions about the platform\n` +
               `• Getting personalized recommendations\n\n` +
               `Try asking something like:\n` +
               `• "Find me an instructor"\n` +
               `• "Show my lessons"\n` +
               `• "How do I book?"`,
      suggestions: [
        'Find me an instructor',
        'How do I book a lesson?',
        'Show my lessons',
        'What can you help with?'
      ],
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






