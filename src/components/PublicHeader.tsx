import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Snowflake, Menu, X } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { ResponsiveModalPanel } from './common/ResponsiveModalPanel';

export function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <header className="fixed w-full z-50 bg-white/80 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2">
              <Snowflake className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">SlopesMaster</span>
            </a>

            <nav className="hidden md:flex items-center gap-8">
              <a href="/find-instructor" className="text-gray-600 hover:text-gray-900">
                Find Instructor
              </a>
              <a href="/book-lesson" className="text-gray-600 hover:text-gray-900">
                Book Lesson
              </a>
              <button
                onClick={() => setShowLogin(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Sign In
              </button>
              <div className="flex gap-2">
                <a
                  href="/signup"
                  className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                >
                  Student Signup
                </a>
                <a
                  href="/instructor-signup"
                  className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                >
                  Join as Instructor
                </a>
              </div>
            </nav>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="container mx-auto px-6 py-4 space-y-4">
              <a
                href="/find-instructor"
                className="block text-gray-600 hover:text-gray-900"
              >
                Find Instructor
              </a>
              <a
                href="/book-lesson"
                className="block text-gray-600 hover:text-gray-900"
              >
                Book Lesson
              </a>
              <button
                onClick={() => {
                  setShowLogin(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Sign In
              </button>
              <a
                href="/signup"
                className="block w-full px-4 py-2 text-center border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
              >
                Student Signup
              </a>
              <a
                href="/instructor-signup"
                className="block w-full px-4 py-2 text-center border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
              >
                Join as Instructor
              </a>
            </div>
          </div>
        )}
      </header>

      {showLogin && (
        <ResponsiveModalPanel
          onClose={() => setShowLogin(false)}
          ariaLabel="Sign in"
          maxWidthClass="sm:max-w-md"
        >
          <div className="flex shrink-0 items-center justify-end border-b border-gray-200 bg-white px-2 py-2 dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:inset-x-0 sm:top-0 sm:z-20 sm:border-0 sm:bg-transparent sm:px-4 sm:py-3">
            <button
              type="button"
              onClick={() => setShowLogin(false)}
              className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-6 sm:px-8 sm:pb-8 sm:pt-16">
            <LoginForm />
          </div>
        </ResponsiveModalPanel>
      )}
    </>
  );
}