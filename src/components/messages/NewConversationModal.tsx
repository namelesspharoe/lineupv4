import { useState, useEffect } from 'react';
import { User } from '../../types';
import { ResponsiveModalPanel } from '../common/ResponsiveModalPanel';
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
    <ResponsiveModalPanel onClose={onClose} labelledBy="new-conversation-title" maxWidthClass="sm:max-w-md">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:inset-x-0 sm:top-0 sm:z-20 sm:border-0 sm:bg-transparent sm:px-6 sm:py-3">
        <h2 id="new-conversation-title" className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
          New Conversation
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 active:bg-gray-200 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-gray-200 px-4 py-4 dark:border-gray-800 sm:pt-20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-10 pr-4 text-base text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-4 dark:bg-gray-900">
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

        <div className="shrink-0 border-t border-gray-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-gray-800 dark:bg-gray-900 sm:pb-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gray-100 py-3 px-4 font-medium text-gray-700 transition-colors hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </ResponsiveModalPanel>
  );
}
