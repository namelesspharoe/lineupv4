import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigation } from './Navigation';
import { PublicHeader } from './PublicHeader';
import { Footer } from './Footer';
import { ThemeToggle } from './ThemeToggle';
import { LessonBookingChatbot } from './chatbot/LessonBookingChatbot';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, LogOut, Menu, X, ChevronDown, User, Home, Calendar, MessageSquare, User as UserIcon, BarChart2, Trophy, BookOpen, Clock } from 'lucide-react';

export function Layout({ children, showNavigation = true }: { children: React.ReactNode; showNavigation?: boolean }) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();

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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

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
        <main className="flex-1 p-4 sm:p-6">{children}</main>
        <Footer />
      </div>
    );
  }

  // Mobile bottom navigation items
  const getMobileNavItems = () => {
    if (user.role === 'student') {
      return [
        { icon: Home, label: 'Home', href: '/dashboard' },
        { icon: BookOpen, label: 'Lessons', href: '/lessons' },
        { icon: Trophy, label: 'Progress', href: '/progress' },
        { icon: MessageSquare, label: 'Chat', href: '/messages' },
        { icon: UserIcon, label: 'Profile', href: '/profile' },
      ];
    } else if (user.role === 'instructor') {
      return [
        { icon: Home, label: 'Home', href: '/dashboard' },
        { icon: BookOpen, label: 'Lessons', href: '/lessons' },
        { icon: Calendar, label: 'Calendar', href: '/schedule' },
        { icon: Clock, label: 'Time', href: '/dashboard/instructor/timecard' },
        { icon: UserIcon, label: 'Profile', href: '/profile' },
      ];
    } else {
      return [
        { icon: Home, label: 'Home', href: '/dashboard' },
        { icon: BarChart2, label: 'Stats', href: '/stats' },
        { icon: UserIcon, label: 'Users', href: '/users' },
        { icon: MessageSquare, label: 'Chat', href: '/messages' },
        { icon: UserIcon, label: 'Profile', href: '/profile' },
      ];
    }
  };

  const mobileNavItems = getMobileNavItems();

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-gray-950 lg:bg-winter-light lg:dark:bg-winter-dark">
      {/* Mobile header: solid bar (no blur) so the shell feels grounded on small screens */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
                  <div className="flex h-full items-center justify-between px-3 sm:px-4">
            <Link to="/" className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-frost-600 dark:text-frost-400" />
              <span className="font-bold text-base text-gray-900 dark:text-white">SlopesMaster</span>
            </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              id="menu-button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors touch-manipulation"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden dark:bg-black/60"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile Side Menu */}
      <div
        id="mobile-menu"
        className={`fixed bottom-0 left-0 top-14 z-50 flex w-[min(100vw-2.5rem,20rem)] flex-col border-r border-gray-200 bg-white shadow-xl transition-transform duration-200 ease-out dark:border-gray-800 dark:bg-gray-950 sm:w-80 lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <div className="border-b border-gray-200 p-3 dark:border-gray-800 sm:p-4">
            <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
          <div className="p-3 sm:p-4">
            <Navigation onItemClick={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
        <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-gray-800 dark:bg-gray-950 sm:p-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Link
            to="/profile"
            onClick={() => setIsMobileMenuOpen(false)}
            className="mb-2 flex w-full items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 sm:mb-3 sm:px-4 sm:py-3"
          >
            <User className="w-5 h-5" />
            View Profile
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              setIsMobileMenuOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400 sm:px-4 sm:py-3"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main shell: min-h-0 lets the scroll region fill space without “floating” overflow on mobile */}
      <div className="flex min-h-0 flex-1 pt-14 lg:h-screen lg:pt-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 glass-card">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3">
                <LayoutGrid className="w-6 h-6 text-frost-600 dark:text-frost-400" />
                <span className="font-bold text-lg text-gray-900 dark:text-white">SlopesMaster</span>
              </Link>
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
        <main className="min-h-0 flex-1 overflow-auto bg-slate-100 dark:bg-gray-950 lg:bg-transparent lg:dark:bg-transparent">
          <div className="px-3 py-3 pb-6 sm:px-6 sm:py-6 sm:pb-8 lg:p-8 lg:pb-8">{children}</div>
        </main>
      </div>
      
      {/* Footer */}
      <Footer />
      
      {/* AI Chatbot - Show for all users */}
      <LessonBookingChatbot />
    </div>
  );
}