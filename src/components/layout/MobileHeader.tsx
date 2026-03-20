import React from 'react';
import { LayoutGrid, Menu, X } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';

interface MobileHeaderProps {
  isMobileMenuOpen: boolean;
  onToggleMenu: () => void;
}

export function MobileHeader({ isMobileMenuOpen, onToggleMenu }: MobileHeaderProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-14 border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950 lg:hidden sm:h-16">
      <div className="flex h-full items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <LayoutGrid className="h-5 w-5 text-frost-600 dark:text-frost-400 sm:h-6 sm:w-6" />
          <span className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">SlopesMaster</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            id="menu-button"
            onClick={onToggleMenu}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

