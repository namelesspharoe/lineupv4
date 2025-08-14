import React, { useState, useEffect } from 'react';
import { User, Conversation, GroupSettings } from '../../types';
import { 
  getGroupMembers, 
  addGroupMember, 
  removeGroupMember, 
  updateGroupSettings
} from '../../services/messages';
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
  Save,
  Crown,
  Shield,
  User as UserIcon
} from 'lucide-react';

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
}

export function GroupSettingsModal({ 
  isOpen, 
  onClose, 
  conversation 
}: GroupSettingsModalProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<GroupSettings>(
    conversation.groupSettings || {
      allowMemberInvites: true,
      allowMemberLeave: true,
      allowMemberMessages: true,
      maxParticipants: 50,
      description: ''
    }
  );

  useEffect(() => {
    if (isOpen && conversation.isGroup) {
      loadGroupMembers();
      loadAvailableUsers();
    }
  }, [isOpen, conversation]);

  useEffect(() => {
    // Filter available users based on search term and exclude current members
    if (searchTerm) {
      const filtered = availableUsers.filter(user =>
        (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
         user.role.toLowerCase().includes(searchTerm.toLowerCase())) &&
        !members.some(member => member.id === user.id)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(availableUsers.filter(user => 
        !members.some(member => member.id === user.id)
      ));
    }
  }, [availableUsers, searchTerm, members]);

  const loadGroupMembers = async () => {
    if (!conversation.isGroup) return;
    
    setIsLoading(true);
    try {
      const groupMembers = await getGroupMembers(conversation.id);
      setMembers(groupMembers);
    } catch (err) {
      console.error('Error loading group members:', err);
      setError('Failed to load group members');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    if (!user) return;
    
    try {
      const users = await getAllUsers();
      // Filter out the current user
      const filteredUsers = users.filter((u: User) => u.id !== user.id);
      setAvailableUsers(filteredUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    }
  };

  const handleAddMember = async (userToAdd: User) => {
    if (!user || !conversation.isGroup) return;
    
    try {
      await addGroupMember(conversation.id, userToAdd.id, user.id);
      setMembers(prev => [...prev, userToAdd]);
      setSearchTerm('');
    } catch (err) {
      console.error('Error adding member:', err);
      setError('Failed to add member to group');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!user || !conversation.isGroup) return;
    
    try {
      await removeGroupMember(conversation.id, userId, user.id);
      setMembers(prev => prev.filter(member => member.id !== userId));
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Failed to remove member from group');
    }
  };

  const handleSaveSettings = async () => {
    if (!conversation.isGroup) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      await updateGroupSettings(conversation.id, settings);
      onClose();
    } catch (err) {
      console.error('Error updating group settings:', err);
      setError('Failed to update group settings');
    } finally {
      setIsSaving(false);
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

  const isAdmin = user?.id === conversation.createdBy;

  if (!isOpen || !conversation.isGroup) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Group Settings</h2>
              <p className="text-sm text-gray-500">{conversation.groupName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="space-y-6">
            {/* Group Settings */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Group Settings
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">Allow member invites</label>
                  <input
                    type="checkbox"
                    checked={settings.allowMemberInvites}
                    onChange={(e) => setSettings(prev => ({ ...prev, allowMemberInvites: e.target.checked }))}
                    disabled={!isAdmin}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">Allow members to leave</label>
                  <input
                    type="checkbox"
                    checked={settings.allowMemberLeave}
                    onChange={(e) => setSettings(prev => ({ ...prev, allowMemberLeave: e.target.checked }))}
                    disabled={!isAdmin}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">Allow member messages</label>
                  <input
                    type="checkbox"
                    checked={settings.allowMemberMessages}
                    onChange={(e) => setSettings(prev => ({ ...prev, allowMemberMessages: e.target.checked }))}
                    disabled={!isAdmin}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    value={settings.maxParticipants}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 50 }))}
                    min="2"
                    max="100"
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={settings.description || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter group description..."
                    rows={3}
                    disabled={!isAdmin}
                    className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Current Members */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Current Members ({members.length}/{settings.maxParticipants})
              </h3>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-gray-600">Loading members...</span>
                </div>
              ) : members.length > 0 ? (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
                            {member.id === conversation.createdBy && (
                              <div className="relative">
                                <Crown className="w-3 h-3 text-yellow-600" />
                                <span className="sr-only">Group Admin</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      {isAdmin && member.id !== user?.id && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove member"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No members found</p>
              )}
            </div>

            {/* Add Members */}
            {isAdmin && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Add Members
                </h3>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {filteredUsers.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {filteredUsers.map((userToAdd) => (
                        <button
                          key={userToAdd.id}
                          onClick={() => handleAddMember(userToAdd)}
                          className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                        >
                          <img
                            src={userToAdd.avatar}
                            alt={userToAdd.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-gray-900">{userToAdd.name}</p>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleColor(userToAdd.role)}`}>
                                {userToAdd.role}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">{userToAdd.email}</p>
                          </div>
                          <UserPlus className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {searchTerm ? 'No users found' : 'No available users to add'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-gray-200">
          {error && (
            <p className="text-red-600 text-sm mb-3">{error}</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 text-gray-600 hover:text-gray-800 transition-colors text-sm md:text-base"
            >
              Cancel
            </button>
            {isAdmin && (
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Settings
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
