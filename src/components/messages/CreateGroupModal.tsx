import React, { useState, useEffect } from 'react';
import { User, GroupSettings } from '../../types';
import { createGroupConversation } from '../../services/messages';
import { getAllUsers } from '../../services/users';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  Search, 
  Users, 
  Settings,
  UserPlus,
  UserMinus,
  Loader2,
  Check
} from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (groupId: string) => void;
}

export function CreateGroupModal({ 
  isOpen, 
  onClose, 
  onGroupCreated 
}: CreateGroupModalProps) {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupSettings, setGroupSettings] = useState<Partial<GroupSettings>>({
    allowMemberInvites: true,
    allowMemberLeave: true,
    allowMemberMessages: true,
    maxParticipants: 50
  });

  useEffect(() => {
    if (isOpen && user) {
      loadAvailableUsers();
    }
  }, [isOpen, user]);

  useEffect(() => {
    // Filter users based on search term and exclude already selected users
    if (searchTerm) {
      const filtered = availableUsers.filter(user =>
        (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
         user.role.toLowerCase().includes(searchTerm.toLowerCase())) &&
        !selectedUsers.some(selected => selected.id === user.id)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(availableUsers.filter(user => 
        !selectedUsers.some(selected => selected.id === user.id)
      ));
    }
  }, [availableUsers, searchTerm, selectedUsers]);

  const loadAvailableUsers = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const users = await getAllUsers();
      // Filter out the current user
      const filteredUsers = users.filter((u: User) => u.id !== user.id);
      setAvailableUsers(filteredUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = (userToAdd: User) => {
    if (selectedUsers.length >= (groupSettings.maxParticipants || 50)) {
      setError(`Maximum ${groupSettings.maxParticipants} participants allowed`);
      return;
    }
    setSelectedUsers(prev => [...prev, userToAdd]);
    setSearchTerm('');
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(user => user.id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    if (selectedUsers.length === 0) {
      setError('Please select at least one participant');
      return;
    }

    setIsCreating(true);
    setError(null);
    
    try {
      const participantIds = selectedUsers.map(u => u.id);
      const settings = {
        ...groupSettings,
        description: description.trim() || undefined
      };
      
      const groupId = await createGroupConversation(
        user.id,
        groupName.trim(),
        participantIds,
        settings
      );
      
      onGroupCreated(groupId);
      onClose();
      resetForm();
    } catch (err) {
      console.error('Error creating group:', err);
      setError('Failed to create group. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setGroupName('');
    setDescription('');
    setSelectedUsers([]);
    setSearchTerm('');
    setError(null);
    setGroupSettings({
      allowMemberInvites: true,
      allowMemberLeave: true,
      allowMemberMessages: true,
      maxParticipants: 50
    });
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header - Mobile Optimized */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Create New Group</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg active:bg-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Mobile Optimized */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Group Details */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Group Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name..."
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter group description..."
                    rows={3}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  Selected Participants ({selectedUsers.length})
                </h3>
                <div className="space-y-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                        />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.role}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveUser(user.id)}
                        className="p-2 text-red-500 hover:text-red-700 rounded-lg active:bg-red-100 transition-colors"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Users */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Add Participants</h3>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search users to add..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  />
                </div>
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="ml-3 text-base text-gray-600">Loading users...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-4">
                    <p className="text-red-600 text-base">{error}</p>
                    <button
                      onClick={loadAvailableUsers}
                      className="text-blue-600 hover:text-blue-700 font-medium text-base active:bg-gray-100 px-4 py-2 rounded-lg mt-2"
                    >
                      Try Again
                    </button>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-6">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-base text-gray-500">
                      {searchTerm ? 'No users found' : 'No available users to add'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleAddUser(user)}
                        className="w-full p-3 border border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center gap-3"
                      >
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                        />
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${getRoleColor(user.role)}`}>
                              {user.role}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <UserPlus className="w-4 h-4 text-blue-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Group Settings */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Group Settings
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={groupSettings.allowMemberInvites}
                    onChange={(e) => setGroupSettings(prev => ({ ...prev, allowMemberInvites: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Allow member invites</p>
                    <p className="text-xs text-gray-500">Members can invite others to the group</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={groupSettings.allowMemberLeave}
                    onChange={(e) => setGroupSettings(prev => ({ ...prev, allowMemberLeave: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Allow members to leave</p>
                    <p className="text-xs text-gray-500">Members can leave the group on their own</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={groupSettings.allowMemberMessages}
                    onChange={(e) => setGroupSettings(prev => ({ ...prev, allowMemberMessages: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Allow member messages</p>
                    <p className="text-xs text-gray-500">All members can send messages</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Mobile Optimized */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={isCreating || !groupName.trim() || selectedUsers.length === 0}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Create Group
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
