import React, { useEffect } from 'react';

interface LayoutWrapperProps {
  children: React.ReactNode;
  onCloseMenus: () => void;
}

export function LayoutWrapper({ children, onCloseMenus }: LayoutWrapperProps) {
  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#mobile-menu') && !target.closest('#menu-button')) {
        onCloseMenus();
      }
      if (!target.closest('#profile-menu') && !target.closest('#profile-button')) {
        onCloseMenus();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCloseMenus]);

  return (
    <div className="min-h-screen bg-winter-light dark:bg-winter-dark flex flex-col">
      {children}
    </div>
  );
}

