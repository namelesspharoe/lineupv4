import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, User, LogOut } from 'lucide-react';

interface ProfileMenuProps {
  user: any; // Replace with proper User type
  onLogout?: () => void;
}

export function ProfileMenu({ user, onLogout }: ProfileMenuProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="relative">
      <button
        id="profile-button"
        onClick={() => setIsProfileOpen(!isProfileOpen)}
        className="w-full flex items-center gap-3 p-2 glass-button rounded-lg"
      >
        <img
          src={user.avatar}
          alt={user.name}
          className="w-8 h-8 rounded-full object-cover ring-2 ring-white/20"
        />
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isProfileOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Profile Dropdown */}
      {isProfileOpen && (
        <div
          id="profile-menu"
          className="absolute bottom-full left-0 right-0 mb-2 glass-card rounded-lg overflow-hidden"
        >
          <div className="p-4 border-b border-white/10 bg-white/5">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Account Settings</p>
          </div>
          <div className="p-2 space-y-1">
            <Link
              to="/profile"
              onClick={() => setIsProfileOpen(false)}
              className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 glass-button rounded-lg text-sm font-medium flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <User className="w-4 h-4" />
              View Profile
            </Link>
            <button
              onClick={() => {
                onLogout?.();
                setIsProfileOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-red-500 dark:text-red-400 glass-button rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
