import React from 'react';
import { LogOut } from 'lucide-react';
import { Navigation } from '../Navigation';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function MobileMenu({ isOpen, onClose, onLogout }: MobileMenuProps) {
  return (
    <>
      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
      )}

      {/* Mobile Navigation Menu */}
      <div
        id="mobile-menu"
        className={`lg:hidden fixed top-16 right-0 w-72 sm:w-80 h-[calc(100vh-4rem)] glass-card z-40 transition-transform duration-300 transform flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto p-4">
          <Navigation onItemClick={onClose} />
        </div>
        <div className="flex-shrink-0 p-4 border-t border-white/10 glass-card">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full px-4 py-2 text-red-500 dark:text-red-400 glass-button flex items-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

