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
        <div
          className="fixed inset-0 z-nav-backdrop bg-black/50 dark:bg-black/60 lg:hidden"
          aria-hidden
        />
      )}

      {/* Mobile Navigation Menu */}
      <div
        id="mobile-menu"
        className={`fixed bottom-0 right-0 top-14 z-nav-drawer flex w-[min(100vw-2.5rem,20rem)] flex-col border-l border-gray-200 bg-white shadow-xl transition-transform duration-200 ease-out motion-reduce:transition-none dark:border-gray-800 dark:bg-gray-950 sm:top-16 sm:w-80 lg:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-3 sm:p-4">
          <Navigation onItemClick={onClose} />
        </div>
        <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-gray-800 dark:bg-gray-950 sm:p-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

