import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';

import { StudentDashboard } from './components/dashboard/student';
import { InstructorDashboard } from './components/dashboard/instructor';
import { AdminDashboard } from './components/dashboard/admin';
import { Home } from './pages/Home';
import { FindInstructor } from './pages/FindInstructor';
import { BookLesson } from './pages/BookLesson';
import { StudentSignup } from './pages/StudentSignup';
import { InstructorSignup } from './pages/InstructorSignup';
import { Messages } from './pages/Messages';
import { Progress } from './pages/Progress';
import { Profile } from './pages/Profile';
import { AchievementsPage } from './pages/Achievements';
import { CheckoutSuccess } from './pages/checkout/Success';
import { CheckoutCancel } from './pages/checkout/Cancel';
import { useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FullPageSpinner } from './components/LoadingSpinner';

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageSpinner text="Loading application..." />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        !user ? (
          <Layout>
            <Home />
          </Layout>
        ) : (
          <Navigate to="/dashboard" replace />
        )
      } />
      
      <Route path="/signup" element={
        <Layout showNavigation={false}>
          <StudentSignup />
        </Layout>
      } />
      <Route path="/instructor-signup" element={
        <Layout showNavigation={false}>
          <InstructorSignup />
        </Layout>
      } />
      
      <Route path="/find-instructor" element={
        <Layout>
          <FindInstructor />
        </Layout>
      } />
      
      <Route path="/book-lesson" element={
        <Layout>
          <BookLesson />
        </Layout>
      } />

      {/* Protected Routes - Require Authentication */}
      <Route path="/dashboard" element={
        user ? (
          <Layout>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {user.name}!</h1>
              <p className="text-gray-600 dark:text-gray-400">Here's an overview of your {user.role} dashboard</p>
            </div>
            {user.role === 'admin' ? (
              <AdminDashboard user={user} />
            ) : user.role === 'instructor' ? (
              <InstructorDashboard user={user} />
            ) : (
              <StudentDashboard user={user} />
            )}
          </Layout>
        ) : (
          <Navigate to="/" replace />
        )
      } />

      <Route path="/messages" element={
        user ? (
          <Layout>
            <Messages />
          </Layout>
        ) : (
          <Navigate to="/" replace />
        )
      } />

      <Route path="/progress" element={
        user && user.role === 'student' ? (
          <Layout>
            <Progress />
          </Layout>
        ) : (
          <Navigate to="/dashboard" replace />
        )
      } />

      <Route path="/achievements" element={
        user && user.role === 'student' ? (
          <Layout>
            <AchievementsPage />
          </Layout>
        ) : (
          <Navigate to="/dashboard" replace />
        )
      } />

      <Route path="/profile" element={
        user ? (
          <Layout>
            <Profile />
          </Layout>
        ) : (
          <Navigate to="/" replace />
        )
      } />

      {/* Admin Routes */}
      <Route path="/users" element={
        user && user.role === 'admin' ? (
          <Layout>
            <div>Users Management (TODO)</div>
          </Layout>
        ) : (
          <Navigate to="/dashboard" replace />
        )
      } />

      <Route path="/lessons" element={
        user && (user.role === 'admin' || user.role === 'instructor') ? (
          <Layout>
            <div>Lessons Management (TODO)</div>
          </Layout>
        ) : (
          <Navigate to="/dashboard" replace />
        )
      } />

      <Route path="/students" element={
        user && user.role === 'instructor' ? (
          <Layout>
            <div>Students Management (TODO)</div>
          </Layout>
        ) : (
          <Navigate to="/dashboard" replace />
        )
      } />

      <Route path="/schedule" element={
        user ? (
          <Layout>
            <div>Schedule (TODO)</div>
          </Layout>
        ) : (
          <Navigate to="/dashboard" replace />
        )
      } />

      <Route path="/resources" element={
        user ? (
          <Layout>
            <div>Resources (TODO)</div>
          </Layout>
        ) : (
          <Navigate to="/dashboard" replace />
        )
      } />

      <Route path="/settings" element={
        user && user.role === 'admin' ? (
          <Layout>
            <div>Settings (TODO)</div>
          </Layout>
        ) : (
          <Navigate to="/dashboard" replace />
        )
      } />

      {/* Checkout Routes */}
      <Route path="/checkout/success" element={
        <Layout>
          <CheckoutSuccess />
        </Layout>
      } />

      <Route path="/checkout/cancel" element={
        <Layout>
          <CheckoutCancel />
        </Layout>
      } />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;