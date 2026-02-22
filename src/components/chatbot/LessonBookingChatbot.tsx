import { useState, useEffect, useRef } from 'react';
import { X, Send, Minimize2, Maximize2, Sparkles, BookOpen, Search, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { aiAgentService, AIAgentResponse } from '../../services/aiAgent';
import { useNavigate } from 'react-router-dom';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  actionData?: any;
}

export function LessonBookingChatbot() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initialize with welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        sender: 'ai',
        content: user 
          ? `Hello${user.name ? ` ${user.name.split(' ')[0]}` : ''}! 👋 I'm your AI assistant for booking lessons.\n\nI can help you:\n• Find the perfect instructor\n• Book lessons\n• Check your lesson history\n• Answer questions\n\nWhat would you like to do?`
          : `Hello! 👋 I'm your AI assistant for booking lessons.\n\nI can help you:\n• Find the perfect instructor\n• Learn about our platform\n• Answer questions\n\nSign up to access full features like booking lessons and viewing your history!`,
        timestamp: new Date(),
        suggestions: user 
          ? [
              'Find me an instructor',
              'Show my lessons',
              'How do I book?',
              'What instructors are available?'
            ]
          : [
              'How does it work?',
              'Find instructors',
              'Sign Up',
              'What can you help with?'
            ]
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (message?: string) => {
    const messageToSend = message || inputMessage.trim();
    if (!messageToSend || isProcessing) return;
    
    if (!user) {
      // For non-authenticated users, show signup prompt
      const signupMessage: ChatMessage = {
        id: `ai-signup-${Date.now()}`,
        sender: 'ai',
        content: 'To use the full features of the AI assistant, please sign up or log in. I can help you find instructors and book lessons once you\'re registered!',
        timestamp: new Date(),
        suggestions: ['Sign Up', 'Log In']
      };
      setMessages(prev => [...prev, signupMessage]);
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    try {
      // Process with AI agent
      const response = await aiAgentService.processMessage(user.id, messageToSend, user);
      
      // Add AI response
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        content: response.message,
        timestamp: new Date(),
        suggestions: response.suggestions,
        actionData: response.data
      };

      setMessages(prev => [...prev, aiMessage]);

      // Handle action data (e.g., navigate to instructor profile)
      if (response.actionData?.topMatch) {
        // Could navigate to instructor profile or booking page
      }
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'ai',
        content: 'I apologize, but I encountered an error. Please try again or use the menu to navigate.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Handle navigation suggestions
    if (suggestion === 'Sign Up') {
      navigate('/signup');
      setIsOpen(false);
      return;
    }
    if (suggestion === 'Log In') {
      navigate('/login');
      setIsOpen(false);
      return;
    }
    handleSend(suggestion);
  };

  const handleQuickAction = (action: string) => {
    if (!user) {
      // For non-authenticated users, prompt to sign up
      if (action === 'book-lesson' || action === 'find-instructor' || action === 'my-lessons') {
        const signupMessage: ChatMessage = {
          id: `ai-signup-${Date.now()}`,
          sender: 'ai',
          content: 'Please sign up or log in to access this feature. It only takes a minute!',
          timestamp: new Date(),
          suggestions: ['Sign Up', 'Log In']
        };
        setMessages(prev => [...prev, signupMessage]);
        return;
      }
    }
    
    switch (action) {
      case 'book-lesson':
        navigate('/book-lesson');
        setIsOpen(false);
        break;
      case 'find-instructor':
        navigate('/book-lesson');
        setIsOpen(false);
        break;
      case 'my-lessons':
        navigate('/lessons');
        setIsOpen(false);
        break;
      default:
        handleSend(action);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Show for everyone, but functionality limited for non-authenticated users

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          aria-label="Open AI Assistant"
        >
          <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed ${isMinimized ? 'bottom-6 right-6' : 'bottom-6 right-6 md:bottom-24 md:right-6'} z-50 transition-all duration-300`}>
          <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col ${
            isMinimized ? 'w-80 h-16' : 'w-full md:w-96 h-[600px] max-h-[80vh]'
          }`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">AI Assistant</h3>
                  <p className="text-xs text-white/80">Lesson Booking Help</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label={isMinimized ? 'Maximize' : 'Minimize'}
                >
                  {isMinimized ? (
                    <Maximize2 className="w-4 h-4" />
                  ) : (
                    <Minimize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsMinimized(false);
                  }}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Quick Actions */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    <button
                      onClick={() => handleQuickAction('book-lesson')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium whitespace-nowrap hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Book Lesson
                    </button>
                    <button
                      onClick={() => handleQuickAction('find-instructor')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium whitespace-nowrap hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Find Instructor
                    </button>
                    <button
                      onClick={() => handleQuickAction('my-lessons')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs font-medium whitespace-nowrap hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      My Lessons
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-800">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      {message.sender === 'ai' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className={`flex-1 ${message.sender === 'user' ? 'flex flex-col items-end' : ''}`}>
                        <div className={`inline-block rounded-2xl px-4 py-2 max-w-[85%] ${
                          message.sender === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          <span className={`text-xs mt-1 block ${
                            message.sender === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {message.suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {message.sender === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Ask me anything about booking lessons..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                      disabled={isProcessing}
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isProcessing}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

