import React from 'react';
import { Navigation } from '../Navigation';
import { DesktopHeader } from './DesktopHeader';
import { ProfileMenu } from './ProfileMenu';

interface SidebarProps {
  user: any; // Replace with proper User type
  onLogout?: () => void;
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-64 glass-card">
      <DesktopHeader />
      <div className="flex-1 overflow-y-auto">
        <Navigation />
      </div>
      <div className="p-4 border-t border-white/10 glass-card">
        <ProfileMenu user={user} onLogout={onLogout} />
      </div>
    </aside>
  );
}
