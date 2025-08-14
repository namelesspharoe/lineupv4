import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigation } from './Navigation';
import { PublicHeader } from './PublicHeader';
import { Footer } from './Footer';
import { ThemeToggle } from './ThemeToggle';
import { Link } from 'react-router-dom';
import { LayoutGrid, LogOut, Menu, X, ChevronDown, User2, User } from 'lucide-react';

export function Layout({ children, showNavigation = true }: { children: React.ReactNode; showNavigation?: boolean }) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#mobile-menu') && !target.closest('#menu-button')) {
        setIsMobileMenuOpen(false);
      }
      if (!target.closest('#profile-menu') && !target.closest('#profile-button')) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <div className="bg-winter-light dark:bg-winter-dark min-h-screen flex flex-col">
        <PublicHeader />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  // If navigation is disabled, show a simple layout
  if (!showNavigation) {
    return (
      <div className="min-h-screen bg-winter-light dark:bg-winter-dark flex flex-col">
        <main className="flex-1 p-4">{children}</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-winter-light dark:bg-winter-dark flex flex-col">
      {/* Mobile Header */}
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
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
      )}

      {/* Mobile Navigation Menu */}
      <div
        id="mobile-menu"
        className={`lg:hidden fixed top-16 right-0 w-72 sm:w-80 h-[calc(100vh-4rem)] glass-card z-40 transition-transform duration-300 transform flex flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto p-4">
          <Navigation onItemClick={() => setIsMobileMenuOpen(false)} />
        </div>
        <div className="flex-shrink-0 p-4 border-t border-white/10 glass-card">
          <button
            onClick={() => {
              logout();
              setIsMobileMenuOpen(false);
            }}
            className="w-full px-4 py-2 text-red-500 dark:text-red-400 glass-button flex items-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="flex h-screen pt-16 lg:pt-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 glass-card">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-6 h-6 text-frost-600 dark:text-frost-400" />
                <span className="font-bold text-lg text-gray-900 dark:text-white">SlopesMaster</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Navigation />
          </div>
          <div className="p-4 border-t border-white/10 glass-card">
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
                      onClick={logout}
                      className="w-full px-4 py-2 text-left text-red-500 dark:text-red-400 glass-button rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4">{children}</div>
        </main>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}