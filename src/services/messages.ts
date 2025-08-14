import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  limit,
  startAfter,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { Message, MessageAttachment, MessageReaction, Conversation, GroupSettings } from '../types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { User } from '../types';

// Real-time message listeners
const messageListeners = new Map<string, () => void>();

// Test function to check if user can access Firestore
export async function testUserFirestoreAccess(userId: string): Promise<boolean> {
  try {
    console.log('Testing Firestore access for user:', userId);
    
    // Try to read a simple document
    const testQuery = query(
      collection(db, 'messages'),
      where('receiverId', '==', userId),
      limit(1)
    );
    
    const snapshot = await getDocs(testQuery);
    console.log('Firestore access test successful');
    return true;
  } catch (error) {
    console.error('Firestore access test failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('permission-denied')) {
        console.warn('User does not have permission to access Firestore');
      } else if (error.message.includes('unauthenticated')) {
        console.warn('User is not authenticated');
      } else if (error.message.includes('network')) {
        console.warn('Network error occurred');
      }
    }
    
    return false;
  }
}

// Test function to check Firestore connection
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    // Try to read from a test document
    const testQuery = query(collection(db, 'messages'), limit(1));
    await getDocs(testQuery);
    console.log('Firestore connection test successful');
    return true;
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    return false;
  }
}

export async function getMessages(userId: string): Promise<Message[]> {
  try {
    // Create queries with proper indexes and error handling
    const sentQuery = query(
      collection(db, 'messages'),
      where('senderId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    
    const receivedQuery = query(
      collection(db, 'messages'),
      where('receiverId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    
    const [sentSnapshot, receivedSnapshot] = await Promise.all([
      getDocs(sentQuery).catch(error => {
        console.error('Error fetching sent messages:', error);
        return { docs: [] };
      }),
      getDocs(receivedQuery).catch(error => {
        console.error('Error fetching received messages:', error);
        return { docs: [] };
      })
    ]);

    const messages = [
      ...sentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      })),
      ...receivedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      }))
    ];

    // Sort combined results by timestamp
    return messages.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ) as Message[];
  } catch (error) {
    console.error('Error getting messages:', error);
    return []; // Return empty array instead of throwing
  }
}

export async function getConversationMessages(
  userId1: string, 
  userId2: string, 
  limitCount: number = 50
): Promise<Message[]> {
  try {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', userId1),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(messagesQuery);
    
    return snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
        } as Message;
      })
      .filter(msg => 
        (msg.senderId === userId1 && msg.receiverId === userId2) ||
        (msg.senderId === userId2 && msg.receiverId === userId1)
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    return [];
  }
}

export function subscribeToMessages(
  userId: string, 
  callback: (messages: Message[]) => void
): () => void {
  // Unsubscribe from existing listener if any
  if (messageListeners.has(userId)) {
    messageListeners.get(userId)?.();
  }

  // Use a simpler query that should work with basic Firestore rules
  // We'll get received messages and the MessageList component will handle grouping
  const q = query(
    collection(db, 'messages'),
    where('receiverId', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(50)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Message;
    });
    
    callback(messages);
  }, (error) => {
    console.error('Error listening to messages:', error);
    
    // Handle permission errors gracefully
    if (error.code === 'permission-denied') {
      console.warn('Firestore permission denied. Messages will not update in real-time.');
      callback([]);
    } else {
      console.warn('Firestore error occurred. Using fallback method.');
      callback([]);
    }
  });

  messageListeners.set(userId, unsubscribe);
  return unsubscribe;
}

export function subscribeToConversation(
  userId1: string,
  userId2: string,
  callback: (messages: Message[]) => void
): () => void {
  const conversationId = [userId1, userId2].sort().join('_');
  
  // Use a simpler query approach
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'asc'),
    limit(50) // Add limit for better performance
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Message;
    });
    
    callback(messages);
  }, (error) => {
    console.error('Error listening to conversation:', error);
    
    // Handle permission errors gracefully
    if (error.code === 'permission-denied') {
      console.warn('Firestore permission denied. Conversation will not update in real-time.');
      // Return empty array to prevent UI errors
      callback([]);
    } else {
      // For any other error, also return empty array
      console.warn('Firestore error occurred. Using fallback method.');
      callback([]);
    }
    // Don't throw error, just log it to prevent UI disruption
  });

  return unsubscribe;
}

// Subscribe to group conversation messages
export function subscribeToGroupConversation(
  groupId: string,
  callback: (messages: Message[]) => void
): () => void {
  // Use a simpler query approach for group conversations
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', groupId),
    orderBy('timestamp', 'asc'),
    limit(50) // Add limit for better performance
  );

  const unsubscribe = onSnapshot(q, async (snapshot) => {
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Message;
    });
    
    // Add sender names and avatars for group messages
    const messagesWithNames = await Promise.all(
      messages.map(async (message) => {
        if (!message.senderName || !message.senderAvatar) {
          try {
            const { getUserById } = await import('./users');
            const sender = await getUserById(message.senderId);
            return {
              ...message,
              senderName: sender?.name || 'Unknown User',
              senderAvatar: sender?.avatar || 'https://ui-avatars.com/api/?name=User&background=random'
            };
          } catch (error) {
            console.error('Error fetching sender info:', error);
            return {
              ...message,
              senderName: 'Unknown User',
              senderAvatar: 'https://ui-avatars.com/api/?name=User&background=random'
            };
          }
        }
        return message;
      })
    );
    
    callback(messagesWithNames);
  }, (error) => {
    console.error('Error listening to group conversation:', error);
    
    // Handle permission errors gracefully
    if (error.code === 'permission-denied') {
      console.warn('Firestore permission denied. Group conversation will not update in real-time.');
      // Return empty array to prevent UI errors
      callback([]);
    } else {
      // For any other error, also return empty array
      console.warn('Firestore error occurred. Using fallback method.');
      callback([]);
    }
    // Don't throw error, just log it to prevent UI disruption
  });

  return unsubscribe;
}

export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string,
  messageType: 'text' | 'image' | 'file' | 'system' = 'text',
  attachments?: MessageAttachment[],
  replyTo?: string
): Promise<string> {
  try {
    console.log('Attempting to send message:', { senderId, receiverId, content: content.substring(0, 50) });
    
    if (!senderId || !receiverId || !content.trim()) {
      throw new Error('Invalid message data');
    }

    const conversationId = [senderId, receiverId].sort().join('_');
    
    // Create a simpler message structure that should work with basic Firestore rules
    const messageData = {
      senderId,
      receiverId,
      conversationId,
      content: content.trim(),
      messageType,
      attachments: attachments || [],
      replyTo: replyTo || null,
      timestamp: serverTimestamp(),
      read: false,
      status: 'sent' as const,
      reactions: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log('Message data prepared:', messageData);
    
    // Try to send the message
    const docRef = await addDoc(collection(db, 'messages'), messageData);
    console.log('Message sent successfully with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('permission-denied') || errorMessage.includes('permission')) {
        throw new Error('Permission denied. Please check your authentication and try again.');
      } else if (errorMessage.includes('unavailable') || errorMessage.includes('network')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (errorMessage.includes('invalid-argument') || errorMessage.includes('invalid')) {
        throw new Error('Invalid message data. Please check your input and try again.');
      } else if (errorMessage.includes('quota-exceeded') || errorMessage.includes('quota')) {
        throw new Error('Service quota exceeded. Please try again later.');
      } else if (errorMessage.includes('not-found') || errorMessage.includes('missing')) {
        throw new Error('Service not found. Please refresh the page and try again.');
      }
    }
    
    // Generic error message
    throw new Error('Failed to send message. Please check your connection and try again.');
  }
}

// Send message to a group conversation
export async function sendGroupMessage(
  senderId: string,
  groupId: string,
  content: string,
  messageType: 'text' | 'image' | 'file' | 'system' = 'text',
  attachments?: MessageAttachment[],
  replyTo?: string
): Promise<string> {
  try {
    console.log('Attempting to send group message:', { senderId, groupId, content: content.substring(0, 50) });
    
    if (!senderId || !groupId || !content.trim()) {
      throw new Error('Invalid group message data');
    }

    // For group messages, use the groupId as the conversationId
    const conversationId = groupId;
    
    // Get sender's name and avatar for display
    let senderName = 'Unknown User';
    let senderAvatar = 'https://ui-avatars.com/api/?name=User&background=random';
    try {
      const { getUserById } = await import('./users');
      const sender = await getUserById(senderId);
      senderName = sender?.name || 'Unknown User';
      senderAvatar = sender?.avatar || 'https://ui-avatars.com/api/?name=User&background=random';
    } catch (error) {
      console.error('Error fetching sender info for group message:', error);
    }
    
    // Create message structure for group conversations
    const messageData = {
      senderId,
      receiverId: groupId, // Use groupId as receiverId for consistency
      conversationId,
      senderName, // Include sender name for display
      senderAvatar, // Include sender avatar for display
      content: content.trim(),
      messageType,
      attachments: attachments || [],
      replyTo: replyTo || null,
      timestamp: serverTimestamp(),
      read: false,
      status: 'sent' as const,
      reactions: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log('Group message data prepared:', messageData);
    
    // Try to send the message
    const docRef = await addDoc(collection(db, 'messages'), messageData);
    console.log('Group message sent successfully with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error sending group message:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('permission-denied') || errorMessage.includes('permission')) {
        throw new Error('Permission denied. Please check your authentication and try again.');
      } else if (errorMessage.includes('unavailable') || errorMessage.includes('network')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (errorMessage.includes('invalid-argument') || errorMessage.includes('invalid')) {
        throw new Error('Invalid message data. Please check your input and try again.');
      } else if (errorMessage.includes('quota-exceeded') || errorMessage.includes('quota')) {
        throw new Error('Service quota exceeded. Please try again later.');
      } else if (errorMessage.includes('not-found') || errorMessage.includes('missing')) {
        throw new Error('Service not found. Please refresh the page and try again.');
      }
    }
    
    // Generic error message
    throw new Error('Failed to send group message. Please check your connection and try again.');
  }
}

export async function uploadFile(
  file: File,
  userId: string
): Promise<MessageAttachment> {
  try {
    const fileId = `${userId}_${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `messages/${fileId}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    const attachment: MessageAttachment = {
      id: fileId,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      url: downloadURL,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      thumbnail: file.type.startsWith('image/') ? downloadURL : undefined
    };

    return attachment;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file. Please try again.');
  }
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  try {
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
      read: true,
      status: 'read',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    // Don't throw here to prevent UI disruption
  }
}

export async function markConversationAsRead(
  userId: string,
  otherUserId: string
): Promise<void> {
  try {
    const conversationId = [userId, otherUserId].sort().join('_');
    
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      where('receiverId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        status: 'read',
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error marking conversation as read:', error);
  }
}

export async function addReaction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<void> {
  try {
    const messageRef = doc(db, 'messages', messageId);
    const reaction: MessageReaction = {
      userId,
      emoji,
      timestamp: new Date().toISOString()
    };

    await updateDoc(messageRef, {
      reactions: arrayUnion(reaction),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw new Error('Failed to add reaction. Please try again.');
  }
}

export async function removeReaction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<void> {
  try {
    const messageRef = doc(db, 'messages', messageId);
    
    // Get current message to find the reaction to remove
    const messageDoc = await getDocs(query(
      collection(db, 'messages'),
      where('__name__', '==', messageId)
    ));
    
    if (!messageDoc.empty) {
      const message = messageDoc.docs[0].data() as Message;
      const reactionToRemove = message.reactions?.find(
        r => r.userId === userId && r.emoji === emoji
      );

      if (reactionToRemove) {
        await updateDoc(messageRef, {
          reactions: arrayRemove(reactionToRemove),
          updatedAt: serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error('Error removing reaction:', error);
    throw new Error('Failed to remove reaction. Please try again.');
  }
}

export async function deleteMessage(messageId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'messages', messageId));
  } catch (error) {
    console.error('Error deleting message:', error);
    throw new Error('Failed to delete message. Please try again.');
  }
}

export async function searchMessages(
  userId: string,
  searchTerm: string
): Promise<Message[]> {
  try {
    // Note: Firestore doesn't support full-text search natively
    // This is a simple implementation - in production, you'd use Algolia or similar
    const messages = await getMessages(userId);
    
    return messages.filter(message =>
      message.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching messages:', error);
    return [];
  }
}

export function unsubscribeFromMessages(userId: string): void {
  if (messageListeners.has(userId)) {
    messageListeners.get(userId)?.();
    messageListeners.delete(userId);
  }
}

export function unsubscribeFromAllMessages(): void {
  messageListeners.forEach(unsubscribe => unsubscribe());
  messageListeners.clear();
}

// Fallback function to load messages without real-time updates
export async function loadMessagesFallback(userId: string): Promise<Message[]> {
  try {
    console.log('Loading messages with fallback method...');
    
    // Try to get messages without complex queries
    const messagesQuery = query(
      collection(db, 'messages'),
      where('receiverId', '==', userId),
      limit(20)
    );

    const snapshot = await getDocs(messagesQuery);
    
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Message;
    });

    console.log(`Loaded ${messages.length} messages with fallback method`);
    return messages;
  } catch (error) {
    console.error('Fallback message loading failed:', error);
    return [];
  }
}

// Fallback function to load conversation messages
export async function loadConversationFallback(
  userId1: string, 
  userId2: string
): Promise<Message[]> {
  try {
    console.log('Loading conversation with fallback method...');
    
    const conversationId = [userId1, userId2].sort().join('_');
    
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      limit(50)
    );

    const snapshot = await getDocs(messagesQuery);
    
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Message;
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    console.log(`Loaded ${messages.length} conversation messages with fallback method`);
    return messages;
  } catch (error) {
    console.error('Fallback conversation loading failed:', error);
    return [];
  }
}

// Fallback function to load group conversation messages
export async function loadGroupConversationFallback(groupId: string): Promise<Message[]> {
  try {
    console.log('Loading group conversation with fallback method...');
    
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', groupId),
      limit(50)
    );

    const snapshot = await getDocs(messagesQuery);
    
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      } as Message;
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Add sender names and avatars for group messages
    const messagesWithNames = await Promise.all(
      messages.map(async (message) => {
        if (!message.senderName || !message.senderAvatar) {
          try {
            const { getUserById } = await import('./users');
            const sender = await getUserById(message.senderId);
            return {
              ...message,
              senderName: sender?.name || 'Unknown User',
              senderAvatar: sender?.avatar || 'https://ui-avatars.com/api/?name=User&background=random'
            };
          } catch (error) {
            console.error('Error fetching sender info:', error);
            return {
              ...message,
              senderName: 'Unknown User',
              senderAvatar: 'https://ui-avatars.com/api/?name=User&background=random'
            };
          }
        }
        return message;
      })
    );

    console.log(`Loaded ${messagesWithNames.length} group conversation messages with fallback method`);
    return messagesWithNames;
  } catch (error) {
    console.error('Fallback group conversation loading failed:', error);
    return [];
  }
}

// Check if a conversation exists between two users
export async function conversationExists(userId1: string, userId2: string): Promise<boolean> {
  try {
    const conversationId = [userId1, userId2].sort().join('_');
    
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      limit(1)
    );

    const snapshot = await getDocs(messagesQuery);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking conversation existence:', error);
    return false;
  }
}

// Create a new conversation by sending an initial message
export async function createConversation(
  senderId: string,
  receiverId: string,
  initialMessage: string = "Hello! I'd like to start a conversation."
): Promise<string> {
  try {
    const conversationId = [senderId, receiverId].sort().join('_');
    
    const messageData = {
      senderId,
      receiverId,
      content: initialMessage,
      timestamp: serverTimestamp(),
      read: false,
      status: 'sent',
      messageType: 'text',
      conversationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'messages'), messageData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw new Error('Failed to create conversation. Please try again.');
  }
}

// Get users that the current user can start conversations with
export async function getAvailableUsers(currentUserId: string): Promise<User[]> {
  try {
    const { getAllUsers } = await import('./users');
    const allUsers = await getAllUsers();
    
    // Filter out the current user and users they already have conversations with
    const availableUsers = [];
    
    for (const user of allUsers) {
      if (user.id === currentUserId) continue;
      
      const hasConversation = await conversationExists(currentUserId, user.id);
      if (!hasConversation) {
        availableUsers.push(user);
      }
    }
    
    return availableUsers;
  } catch (error) {
    console.error('Error getting available users:', error);
    return [];
  }
}

// Create a new group conversation
export async function createGroupConversation(
  creatorId: string,
  groupName: string,
  participantIds: string[],
  settings?: Partial<GroupSettings>
): Promise<string> {
  try {
    console.log('createGroupConversation called with:', { creatorId, groupName, participantIds });
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const defaultSettings: GroupSettings = {
      allowMemberInvites: true,
      allowMemberLeave: true,
      allowMemberMessages: true,
      maxParticipants: 50,
      description: '',
      ...settings
    };

    const conversationData = {
      id: groupId,
      participants: [creatorId, ...participantIds],
      isGroup: true,
      groupName,
      groupAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}&background=random`,
      groupSettings: defaultSettings,
      createdBy: creatorId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      unreadCount: 0
    };

    console.log('Creating group conversation with data:', conversationData);

    // Create the conversation document with the custom groupId
    await setDoc(doc(db, 'conversations', groupId), conversationData);

    // Create initial welcome message
    const welcomeMessage = `${groupName} group created! Welcome everyone!`;
    await sendGroupMessage(creatorId, groupId, welcomeMessage, 'system');

    console.log('Group conversation created successfully with ID:', groupId);
    return groupId;
  } catch (error) {
    console.error('Error creating group conversation:', error);
    throw new Error('Failed to create group conversation. Please try again.');
  }
}

// Get group conversations for a user
export async function getGroupConversations(userId: string): Promise<Conversation[]> {
  try {
    console.log('getGroupConversations called for userId:', userId);
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      where('isGroup', '==', true),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    console.log('getGroupConversations query result:', snapshot.docs.length, 'documents');
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Conversation));
    console.log('getGroupConversations returning:', conversations);
    return conversations;
  } catch (error) {
    console.error('Error getting group conversations:', error);
    return [];
  }
}

// Add member to group
export async function addGroupMember(
  groupId: string,
  userId: string,
  addedBy: string
): Promise<void> {
  try {
    const conversationRef = doc(db, 'conversations', groupId);
    
    await updateDoc(conversationRef, {
      participants: arrayUnion(userId),
      updatedAt: new Date().toISOString()
    });

    // Send system message about new member
    const { getUserById } = await import('./users');
    const user = await getUserById(userId);
    const addedByUser = await getUserById(addedBy);
    
    const message = `${user?.name || 'Someone'} was added to the group by ${addedByUser?.name || 'an admin'}`;
    await sendGroupMessage(addedBy, groupId, message, 'system');
  } catch (error) {
    console.error('Error adding group member:', error);
    throw new Error('Failed to add member to group.');
  }
}

// Remove member from group
export async function removeGroupMember(
  groupId: string,
  userId: string,
  removedBy: string
): Promise<void> {
  try {
    const conversationRef = doc(db, 'conversations', groupId);
    
    await updateDoc(conversationRef, {
      participants: arrayRemove(userId),
      updatedAt: new Date().toISOString()
    });

    // Send system message about member removal
    const { getUserById } = await import('./users');
    const user = await getUserById(userId);
    const removedByUser = await getUserById(removedBy);
    
    const message = `${user?.name || 'Someone'} was removed from the group by ${removedByUser?.name || 'an admin'}`;
    await sendGroupMessage(removedBy, groupId, message, 'system');
  } catch (error) {
    console.error('Error removing group member:', error);
    throw new Error('Failed to remove member from group.');
  }
}

// Update group settings
export async function updateGroupSettings(
  groupId: string,
  settings: Partial<GroupSettings>
): Promise<void> {
  try {
    const conversationRef = doc(db, 'conversations', groupId);
    
    await updateDoc(conversationRef, {
      'groupSettings': settings,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating group settings:', error);
    throw new Error('Failed to update group settings.');
  }
}

// Get group members
export async function getGroupMembers(groupId: string): Promise<User[]> {
  try {
    const conversationRef = doc(db, 'conversations', groupId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (!conversationDoc.exists()) {
      throw new Error('Group not found');
    }

    const conversation = conversationDoc.data() as Conversation;
    const { getAllUsers } = await import('./users');
    const allUsers = await getAllUsers();
    
    return allUsers.filter(user => conversation.participants.includes(user.id));
  } catch (error) {
    console.error('Error getting group members:', error);
    return [];
  }
}