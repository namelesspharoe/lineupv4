import React, { useState, useEffect } from 'react';
import { User, Message, Conversation } from '../../types';
import { 
  getMessages, 
  markMessageAsRead, 
  subscribeToMessages, 
  unsubscribeFromMessages,
  searchMessages,
  markConversationAsRead,
  loadMessagesFallback,
  testUserFirestoreAccess,
  getGroupConversations
} from '../../services/messages';
import { getUserById } from '../../services/users';
import { useAuth } from '../../context/AuthContext';
import { NewConversationModal } from './NewConversationModal';
import { CreateGroupModal } from './CreateGroupModal';
import { 
  MessageSquare, 
  Clock, 
  Check, 
  CheckCheck, 
  Search, 
  Filter,
  MoreVertical,
  Archive,
  Trash2,
  Star,
  UserPlus,
  Users
} from 'lucide-react';

interface MessageGroup {
  user: User;
  messages: Message[];
  lastMessage: Message;
  unreadCount: number;
  conversationId: string;
}

export function MessageList({ onSelectChat }: { onSelectChat: (user: User) => void }) {
  const { user } = useAuth();
  const [messageGroups, setMessageGroups] = useState<MessageGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<MessageGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'archived'>('all');
  const [hasPermissionError, setHasPermissionError] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  useEffect(() => {
    if (!user) return;

    let unsubscribe: (() => void) | null = null;
    let hasPermissionError = false;

    // Test Firestore access first
    testUserFirestoreAccess(user.id).then(hasAccess => {
      if (!hasAccess) {
        console.warn('User does not have Firestore access, using fallback method');
        hasPermissionError = true;
        setHasPermissionError(true);
        loadMessagesFallback(user.id).then(processMessages);
        return;
      }

      setHasPermissionError(false);

      // Subscribe to real-time messages
      try {
        unsubscribe = subscribeToMessages(user.id, (messages) => {
          // If we get an empty array, it might be due to permission errors
          if (messages.length === 0 && !hasPermissionError) {
            console.log('No messages received, trying fallback method...');
            loadMessagesFallback(user.id).then(fallbackMessages => {
              if (fallbackMessages.length > 0) {
                processMessages(fallbackMessages);
              } else {
                processMessages([]);
              }
            });
          } else {
            processMessages(messages);
          }
        });
      } catch (error) {
        console.warn('Real-time subscription failed, using fallback method');
        hasPermissionError = true;
        loadMessagesFallback(user.id).then(processMessages);
      }

      // If real-time subscription fails, use fallback method
      if (hasPermissionError || !unsubscribe) {
        loadMessagesFallback(user.id).then(processMessages);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribeFromMessages(user.id);
      }
    };
  }, [user]);

  useEffect(() => {
    // Filter message groups based on search and filter
    let filtered = messageGroups;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(group =>
        group.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (selectedFilter === 'unread') {
      filtered = filtered.filter(group => group.unreadCount > 0);
    }

    setFilteredGroups(filtered);
  }, [messageGroups, searchTerm, selectedFilter]);

  const processMessages = async (messages: Message[]) => {
    try {
      setIsLoading(true);
      setError(null);

      // Also fetch sent messages to get complete conversation history
      const sentMessages = await getMessages(user?.id || '');
      const allMessages = [...messages, ...sentMessages];

      // Group messages by conversation (individual and group)
      const groupedMessages = new Map<string, Message[]>();
      const conversationIds = new Set<string>();

      allMessages.forEach(message => {
        // For individual conversations
        if (!message.conversationId || !message.conversationId.startsWith('group_')) {
          const otherId = message.senderId === user?.id ? message.receiverId : message.senderId;
          const conversationId = [user?.id, otherId].sort().join('_');
          conversationIds.add(conversationId);

          if (!groupedMessages.has(conversationId)) {
            groupedMessages.set(conversationId, []);
          }
          groupedMessages.get(conversationId)?.push(message);
        } else {
          // For group conversations
          const conversationId = message.conversationId;
          conversationIds.add(conversationId);

          if (!groupedMessages.has(conversationId)) {
            groupedMessages.set(conversationId, []);
          }
          groupedMessages.get(conversationId)?.push(message);
        }
      });

      // Fetch group conversations
      console.log('Fetching group conversations for user:', user?.id);
      const groupConversations = await getGroupConversations(user?.id || '');
      console.log('Found group conversations:', groupConversations);
      
      // Create groups for individual conversations
      const groups: MessageGroup[] = [];
      
      // Process individual conversations
      for (const conversationId of conversationIds) {
        if (!conversationId.startsWith('group_')) {
          // Individual conversation
          const [userId1, userId2] = conversationId.split('_');
          const otherUserId = userId1 === user?.id ? userId2 : userId1;
          const otherUser = await getUserById(otherUserId);
          
          if (otherUser) {
            const userMessages = groupedMessages.get(conversationId) || [];
            userMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            
            if (userMessages.length > 0) {
              groups.push({
                user: otherUser,
                messages: userMessages,
                lastMessage: userMessages[0],
                unreadCount: userMessages.filter(m => !m.read && m.senderId === otherUserId).length,
                conversationId
              });
            }
          }
        }
      }

      // Process group conversations
      console.log('Processing group conversations:', groupConversations.length);
      for (const groupConv of groupConversations) {
        console.log('Processing group:', groupConv);
        const groupMessages = groupedMessages.get(groupConv.id) || [];
        groupMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        // Create a virtual user for the group
        const groupUser: User = {
          id: groupConv.id,
          name: groupConv.groupName || 'Group',
          email: '',
          role: 'student', // Default role for groups
          avatar: groupConv.groupAvatar || 'https://ui-avatars.com/api/?name=Group&background=random',
          bio: groupConv.groupSettings?.description || '',
          isGroup: true,
          participants: groupConv.participants || []
        };

        if (groupMessages.length > 0) {
          groups.push({
            user: groupUser,
            messages: groupMessages,
            lastMessage: groupMessages[0],
            unreadCount: groupMessages.filter(m => !m.read && m.senderId !== user?.id).length,
            conversationId: groupConv.id
          });
        } else {
          // Add group even if no messages yet
          groups.push({
            user: groupUser,
            messages: [],
            lastMessage: {
              id: '',
              senderId: '',
              receiverId: '',
              content: 'Group created',
              timestamp: groupConv.createdAt || new Date().toISOString(),
              read: true,
              status: 'sent',
              messageType: 'text',
              conversationId: groupConv.id
            },
            unreadCount: 0,
            conversationId: groupConv.id
          });
        }
      }

      // Sort by latest message
      groups.sort((a, b) => {
        const timeA = new Date(a.lastMessage.timestamp).getTime();
        const timeB = new Date(b.lastMessage.timestamp).getTime();
        return timeB - timeA;
      });

      setMessageGroups(groups);
    } catch (err) {
      console.error('Error processing messages:', err);
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSelect = async (group: MessageGroup) => {
    // Mark conversation as read when selected
    if (group.unreadCount > 0) {
      await markConversationAsRead(user?.id || '', group.user.id);
    }
    
    onSelectChat(group.user);
  };

  const handleNewConversationStarted = (selectedUser: User) => {
    // Refresh the message list to include the new conversation
    if (user) {
      loadMessagesFallback(user.id).then(processMessages);
    }
    onSelectChat(selectedUser);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getMessageStatusIcon = (message: Message) => {
    if (message.senderId !== user?.id) return null;

    switch (message.status) {
      case 'sending':
        return <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />;
      case 'sent':
        return <Check className="w-4 h-4 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-600" />;
      case 'failed':
        return <div className="w-4 h-4 text-red-500">!</div>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600 mb-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:text-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header - Mobile Optimized */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:bg-gray-200 dark:active:bg-gray-700"
              title="Search Messages"
            >
              <Search className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowNewConversationModal(true)}
              className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:bg-gray-200 dark:active:bg-gray-700"
              title="New Conversation"
            >
              <UserPlus className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowCreateGroupModal(true)}
              className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:bg-gray-200 dark:active:bg-gray-700"
              title="Create Group"
            >
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar - Mobile Optimized */}
        {showSearch && (
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
        )}

        {/* Filter Tabs - Mobile Optimized */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {[
            { key: 'all', label: 'All', count: messageGroups.length },
            { key: 'unread', label: 'Unread', count: messageGroups.filter(g => g.unreadCount > 0).length }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key as any)}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-colors ${
                selectedFilter === filter.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white active:bg-gray-200 dark:active:bg-gray-600'
              }`}
            >
              {filter.label}
              {filter.count > 0 && (
                <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full font-medium">
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Message List - Mobile Optimized */}
      <div className="flex-1 overflow-y-auto">
        {hasPermissionError && (
          <div className="mx-4 mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-200">
                  <strong>Limited functionality:</strong> Real-time messaging is not available due to permission settings. 
                  Messages will update when you refresh the page.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {filteredGroups.length > 0 ? (
            filteredGroups.map(group => (
              <div
                key={group.user.id}
                className="w-full px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 transition-colors flex items-center gap-3 group cursor-pointer"
                onClick={() => handleChatSelect(group)}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={group.user.avatar}
                    alt={group.user.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                  />
                  {group.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {group.unreadCount > 9 ? '9+' : group.unreadCount}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold truncate text-base ${
                        group.unreadCount > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {group.user.name}
                      </h3>
                      {group.user.isGroup && (
                        <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                          <Users className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                            {group.user.participants?.length || 0}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                      {formatTimestamp(group.lastMessage.timestamp)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {getMessageStatusIcon(group.lastMessage)}
                    </div>
                    <p className={`text-sm truncate flex-1 ${
                      group.unreadCount > 0 ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {group.lastMessage.content}
                    </p>
                  </div>
                </div>

                {/* Action Menu - Mobile Optimized */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button 
                    className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg active:bg-gray-200 dark:active:bg-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement action menu functionality
                    }}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 px-4">
              <MessageSquare className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-base text-gray-500 dark:text-gray-400 font-medium">
                {searchTerm ? 'No messages found' : 'No messages yet'}
              </p>
              {!searchTerm && (
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Start a conversation with an instructor or student
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onConversationStarted={handleNewConversationStarted}
      />
      
      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onGroupCreated={(groupId) => {
          setShowCreateGroupModal(false);
          // Force a complete refresh to include the new group
          if (user) {
            loadMessagesFallback(user.id).then(processMessages);
          }
        }}
      />
    </div>
  );
}