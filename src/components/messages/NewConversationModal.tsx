import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { getAvailableUsers, createConversation } from '../../services/messages';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  Search, 
  User as UserIcon, 
  MessageSquare,
  Loader2
} from 'lucide-react';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationStarted: (user: User) => void;
}

export function NewConversationModal({ 
  isOpen, 
  onClose, 
  onConversationStarted 
}: NewConversationModalProps) {
  const { user } = useAuth();
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadAvailableUsers();
    }
  }, [isOpen, user]);

  useEffect(() => {
    // Filter users based on search term
    if (searchTerm) {
      const filtered = availableUsers.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(availableUsers);
    }
  }, [availableUsers, searchTerm]);

  const loadAvailableUsers = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const users = await getAvailableUsers(user.id);
      setAvailableUsers(users);
    } catch (err) {
      console.error('Error loading available users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartConversation = async (selectedUser: User) => {
    if (!user) return;
    
    setIsCreatingConversation(true);
    setError(null);
    
    try {
      await createConversation(user.id, selectedUser.id);
      onConversationStarted(selectedUser);
      onClose();
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to start conversation. Please try again.');
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'instructor':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header - Mobile Optimized */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">New Conversation</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg active:bg-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search - Mobile Optimized */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            />
          </div>
        </div>

        {/* Content - Mobile Optimized */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-3 text-base text-gray-600">Loading users...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4 text-base">{error}</p>
              <button
                onClick={loadAvailableUsers}
                className="text-blue-600 hover:text-blue-700 font-medium text-base active:bg-gray-100 px-4 py-2 rounded-lg"
              >
                Try Again
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-base text-gray-500 font-medium">
                {searchTerm ? 'No users found' : 'No available users to start conversations with'}
              </p>
              {!searchTerm && (
                <p className="text-sm text-gray-400 mt-2">
                  All users already have conversations with you
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleStartConversation(user)}
                  disabled={isCreatingConversation}
                  className="w-full p-4 border border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 text-base truncate">{user.name}</h3>
                      <span className={`px-2 py-1 text-xs font-bold rounded-full flex-shrink-0 ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                    {user.bio && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{user.bio}</p>
                    )}
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Mobile Optimized */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
