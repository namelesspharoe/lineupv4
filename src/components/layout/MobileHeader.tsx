import React from 'react';
import { LayoutGrid, Menu, X } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';

interface MobileHeaderProps {
  isMobileMenuOpen: boolean;
  onToggleMenu: () => void;
}

export function MobileHeader({ isMobileMenuOpen, onToggleMenu }: MobileHeaderProps) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-16 glass-card z-50">
      <div className="flex items-center justify-between px-4 h-full">
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-6 h-6 text-frost-600 dark:text-frost-400" />
          <span className="font-bold text-lg text-gray-900 dark:text-white">SlopesMaster</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            id="menu-button"
            onClick={onToggleMenu}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg glass-button transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

