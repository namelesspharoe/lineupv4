import React, { useState, useEffect, useRef } from 'react';
import { User, Message, MessageAttachment, MessageReaction } from '../../types';
import { 
  getConversationMessages, 
  sendMessage, 
  sendGroupMessage,
  markMessageAsRead, 
  subscribeToConversation,
  subscribeToGroupConversation,
  uploadFile,
  addReaction,
  removeReaction,
  deleteMessage,
  markConversationAsRead,
  loadConversationFallback,
  loadGroupConversationFallback
} from '../../services/messages';
import { useAuth } from '../../context/AuthContext';
import { 
  Send, 
  X, 
  Check, 
  CheckCheck, 
  Paperclip, 
  Image, 
  Smile,
  MoreVertical,
  Trash2,
  Reply,
  Download,
  Eye
} from 'lucide-react';

interface ChatWindowProps {
  otherUser: User;
  onClose: () => void;
}

export function ChatWindow({ otherUser, onClose }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user) return;

    let unsubscribe: (() => void) | null = null;
    let hasPermissionError = false;

    // Subscribe to real-time conversation (individual or group)
    try {
      const subscriptionFunction = otherUser.isGroup 
        ? (callback: (messages: Message[]) => void) => subscribeToGroupConversation(otherUser.id, callback)
        : (callback: (messages: Message[]) => void) => subscribeToConversation(user.id, otherUser.id, callback);
      
      unsubscribe = subscriptionFunction((messages) => {
        // If we get an empty array, it might be due to permission errors
        if (messages.length === 0 && !hasPermissionError) {
          console.log('No conversation messages received, trying fallback method...');
          const fallbackFunction = otherUser.isGroup 
            ? () => loadGroupConversationFallback(otherUser.id)
            : () => loadConversationFallback(user.id, otherUser.id);
          
          fallbackFunction().then(fallbackMessages => {
            setMessages(fallbackMessages);
            setIsLoading(false);
            
            // Mark messages as read
            const unreadMessages = fallbackMessages.filter(
              msg => !msg.read && msg.senderId === otherUser.id
            );
            
            if (unreadMessages.length > 0) {
              markConversationAsRead(user.id, otherUser.id);
            }
          });
        } else {
          setMessages(messages);
          setIsLoading(false);
          
          // Mark messages as read
          const unreadMessages = messages.filter(
            msg => !msg.read && msg.senderId === otherUser.id
          );
          
          if (unreadMessages.length > 0) {
            markConversationAsRead(user.id, otherUser.id);
          }
        }
      });
    } catch (error) {
      console.warn('Real-time conversation subscription failed, using fallback method');
      hasPermissionError = true;
      const fallbackFunction = otherUser.isGroup 
        ? () => loadGroupConversationFallback(otherUser.id)
        : () => loadConversationFallback(user.id, otherUser.id);
      
      fallbackFunction().then((messages) => {
        setMessages(messages);
        setIsLoading(false);
      });
    }

    // If real-time subscription fails, use fallback method
    if (hasPermissionError || !unsubscribe) {
      const fallbackFunction = otherUser.isGroup 
        ? () => loadGroupConversationFallback(otherUser.id)
        : () => loadConversationFallback(user.id, otherUser.id);
      
      fallbackFunction().then((messages) => {
        setMessages(messages);
        setIsLoading(false);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, otherUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!newMessage.trim() && !selectedFile) || isSending) return;

    try {
      setIsSending(true);
      let attachments: MessageAttachment[] = [];

      // Upload file if selected
      if (selectedFile) {
        const attachment = await uploadFile(selectedFile, user.id);
        attachments.push(attachment);
        setSelectedFile(null);
        setUploadProgress(0);
      }

      // Send message (check if it's a group conversation)
      const messageId = otherUser.isGroup 
        ? await sendGroupMessage(
            user.id, 
            otherUser.id, 
            newMessage.trim() || (attachments.length > 0 ? 'Sent an attachment' : ''), 
            attachments.length > 0 ? 'file' : 'text',
            attachments,
            replyToMessage?.id
          )
        : await sendMessage(
            user.id, 
            otherUser.id, 
            newMessage.trim() || (attachments.length > 0 ? 'Sent an attachment' : ''), 
            attachments.length > 0 ? 'file' : 'text',
            attachments,
            replyToMessage?.id
          );

      setNewMessage('');
      setReplyToMessage(null);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing indicator
    setIsTyping(true);

    // Clear typing indicator after 2 seconds of no typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      await addReaction(messageId, user.id, emoji);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      await removeReaction(messageId, user.id, emoji);
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageStatusIcon = (message: Message) => {
    if (message.senderId !== user?.id) return null;

    switch (message.status) {
      case 'sending':
        return <div className="w-3 h-3 border border-gray-300 border-t-blue-600 rounded-full animate-spin" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-600" />;
      case 'failed':
        return <div className="w-3 h-3 text-red-500 text-xs">!</div>;
      default:
        return null;
    }
  };

  const renderMessageContent = (message: Message) => {
    if (message.messageType === 'image' && message.attachments?.[0]) {
      return (
        <div className="space-y-2">
          {message.content && <p className="break-words">{message.content}</p>}
          <img
            src={message.attachments[0].url}
            alt="Shared image"
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.attachments![0].url, '_blank')}
          />
        </div>
      );
    }

    if (message.messageType === 'file' && message.attachments?.[0]) {
      return (
        <div className="space-y-2">
          {message.content && <p className="break-words">{message.content}</p>}
          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Paperclip className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <span className="text-sm font-medium break-words flex-1 min-w-0">{message.attachments[0].name}</span>
            <button
              onClick={() => window.open(message.attachments![0].url, '_blank')}
              className="ml-auto p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    return <p className="break-words">{message.content}</p>;
  };

  const renderReactions = (message: Message) => {
    if (!message.reactions || message.reactions.length === 0) return null;

    const reactionGroups = message.reactions.reduce((acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="flex gap-1 mt-1">
        {Object.entries(reactionGroups).map(([emoji, count]) => (
          <button
            key={emoji}
            onClick={() => {
              const hasReacted = message.reactions?.some(r => r.userId === user?.id && r.emoji === emoji);
              if (hasReacted) {
                handleRemoveReaction(message.id, emoji);
              } else {
                handleReaction(message.id, emoji);
              }
            }}
            className={`px-2 py-1 text-xs rounded-full border ${
              message.reactions?.some(r => r.userId === user?.id && r.emoji === emoji)
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {emoji} {count}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Chat Header - Mobile Optimized */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-900 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src={otherUser.avatar}
            alt={otherUser.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">{otherUser.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{otherUser.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isTyping && (
            <span className="text-xs text-gray-500 dark:text-gray-400 italic">typing...</span>
          )}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Messages - Mobile Optimized */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length > 0 ? (
          messages.map((message, index) => {
            const isCurrentUser = message.senderId === user?.id;
            const showAvatar = index === 0 || 
              messages[index - 1].senderId !== message.senderId;
            const showName = otherUser.isGroup && showAvatar;

            return (
              <div
                key={message.id}
                className={`flex items-end gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
              >
                {showAvatar && !isCurrentUser && (
                  <img
                    src={otherUser.isGroup ? (message.senderAvatar || otherUser.avatar) : otherUser.avatar}
                    alt={otherUser.isGroup ? (message.senderName || 'User') : otherUser.name}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                  />
                )}
                {!showAvatar && !isCurrentUser && <div className="w-8" />}
                
                <div className="group relative max-w-[85%] min-w-0">
                  {/* Sender name for group conversations */}
                  {showName && (
                    <div className={`text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium ${
                      isCurrentUser ? 'text-right' : 'text-left'
                    }`}>
                      {isCurrentUser ? 'You' : (message.senderName || 'Unknown User')}
                    </div>
                  )}
                  
                  {/* Reply indicator */}
                  {message.replyTo && (
                    <div className={`text-xs text-gray-500 dark:text-gray-400 mb-1 ${
                      isCurrentUser ? 'text-right' : 'text-left'
                    }`}>
                      {(() => {
                        const repliedMessage = messages.find(m => m.id === message.replyTo);
                        if (repliedMessage) {
                          const repliedSenderName = repliedMessage.senderName || 
                            (repliedMessage.senderId === user?.id ? 'You' : 'Unknown User');
                          return `Replying to ${repliedSenderName}`;
                        }
                        return 'Replying to a message';
                      })()}
                    </div>
                  )}
                  
                  <div
                    className={`rounded-2xl px-4 py-3 shadow-sm break-words ${
                      isCurrentUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {renderMessageContent(message)}
                    </div>
                    
                    <div className={`text-xs mt-2 flex items-center gap-1 ${
                      isCurrentUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatMessageTime(message.timestamp)}
                      {getMessageStatusIcon(message)}
                    </div>
                    
                    {renderReactions(message)}
                  </div>

                  {/* Message actions - Mobile Optimized */}
                  <div className={`absolute top-0 ${
                    isCurrentUser ? '-left-12' : '-right-12'
                  } opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
                    <button
                      onClick={() => setReplyToMessage(message)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 bg-white dark:bg-gray-800 rounded-lg shadow-sm active:bg-gray-100 dark:active:bg-gray-700"
                    >
                      <Reply className="w-4 h-4" />
                    </button>
                    {isCurrentUser && (
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 bg-white dark:bg-gray-800 rounded-lg shadow-sm active:bg-gray-100 dark:active:bg-gray-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            <p className="text-base font-medium">No messages yet. Start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator - Mobile Optimized */}
      {replyToMessage && (
        <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Reply className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-300 break-words flex-1 min-w-0">
                Replying to {replyToMessage.senderName || (replyToMessage.senderId === user?.id ? 'You' : 'Unknown User')}: {replyToMessage.content.substring(0, 30)}...
              </span>
            </div>
            <button
              onClick={() => setReplyToMessage(null)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg active:bg-gray-200 dark:active:bg-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* File preview - Mobile Optimized */}
      {selectedFile && (
        <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Paperclip className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-300 break-words flex-1 min-w-0">{selectedFile.name}</span>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg active:bg-gray-200 dark:active:bg-gray-700 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Message Input - Mobile Optimized */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e as any);
                }
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={isSending || (!newMessage.trim() && !selectedFile)}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed active:bg-blue-800 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}