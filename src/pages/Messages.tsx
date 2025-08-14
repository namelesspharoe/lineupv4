import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { MessageList } from '../components/messages/MessageList';
import { ChatWindow } from '../components/messages/ChatWindow';
import { useLocation } from 'react-router-dom';

export function Messages() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const location = useLocation();

  // Check if we have an instructor to message from the navigation state
  useEffect(() => {
    if (location.state?.selectedInstructor) {
      const instructor = location.state.selectedInstructor;
      // Convert the instructor data to match User type
      setSelectedUser({
        id: instructor.id,
        name: instructor.name,
        email: '',
        role: 'instructor',
        avatar: instructor.image,
        bio: '',
        specialties: instructor.specialties,
        languages: instructor.languages,
        yearsOfExperience: instructor.experience,
        price: instructor.price,
        hourlyRate: instructor.price,
        preferredLocations: [instructor.location]
      });
    }
  }, [location.state]);

  return (
    <div className="h-screen flex flex-col md:flex-row bg-white dark:bg-gray-900">
      {/* Message List */}
      <div className={`bg-white dark:bg-gray-900 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 ${
        selectedUser ? 'hidden md:block md:w-96' : 'w-full md:w-96'
      }`}>
        <MessageList onSelectChat={setSelectedUser} />
      </div>

      {/* Chat Window */}
      {selectedUser ? (
        <div className="flex-1 bg-white dark:bg-gray-900 flex flex-col">
          <ChatWindow
            otherUser={selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-800">
          <div className="text-center">
            <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
              Select a conversation
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Choose a conversation from the list to start messaging
            </p>
          </div>
        </div>
      )}
    </div>
  );
}