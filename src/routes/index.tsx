import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { Layout } from '../components/Layout';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { FullPageSpinner } from '../components/LoadingSpinner';

// Lazy load pages for better performance
const Home = React.lazy(() => import('../pages/Home').then(module => ({ default: module.Home })));
const StudentSignup = React.lazy(() => import('../pages/StudentSignup').then(module => ({ default: module.StudentSignup })));
const InstructorSignup = React.lazy(() => import('../pages/InstructorSignup').then(module => ({ default: module.InstructorSignup })));
const FindInstructor = React.lazy(() => import('../pages/FindInstructor').then(module => ({ default: module.FindInstructor })));
const BookLesson = React.lazy(() => import('../pages/BookLesson').then(module => ({ default: module.BookLesson })));
const Messages = React.lazy(() => import('../pages/Messages').then(module => ({ default: module.Messages })));
const Progress = React.lazy(() => import('../pages/Progress').then(module => ({ default: module.Progress })));
const Profile = React.lazy(() => import('../pages/Profile').then(module => ({ default: module.Profile })));
const AchievementsPage = React.lazy(() => import('../pages/Achievements').then(module => ({ default: module.AchievementsPage })));
const CheckoutSuccess = React.lazy(() => import('../pages/checkout/Success').then(module => ({ default: module.CheckoutSuccess })));
const CheckoutCancel = React.lazy(() => import('../pages/checkout/Cancel').then(module => ({ default: module.CheckoutCancel })));

// Dashboard components
const StudentDashboard = React.lazy(() => import('../components/dashboard/student').then(module => ({ default: module.StudentDashboard })));
const InstructorDashboard = React.lazy(() => import('../components/dashboard/instructor').then(module => ({ default: module.InstructorDashboard })));
const AdminDashboard = React.lazy(() => import('../components/dashboard/admin').then(module => ({ default: module.AdminDashboard })));

// Protected route wrapper
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageSpinner text="Loading application..." />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Route components with data loading
const DashboardRoute = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/" replace />;

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's an overview of your {user.role} dashboard
        </p>
      </div>
      {user.role === 'admin' ? (
        <AdminDashboard user={user} />
      ) : user.role === 'instructor' ? (
        <InstructorDashboard user={user} />
      ) : (
        <StudentDashboard user={user} />
      )}
    </Layout>
  );
};

const HomeRoute = () => {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Layout>
      <Home />
    </Layout>
  );
};

// Router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <HomeRoute />,
  },
  {
    path: '/signup',
    element: (
      <Layout showNavigation={false}>
        <StudentSignup />
      </Layout>
    ),
  },
  {
    path: '/instructor-signup',
    element: (
      <Layout showNavigation={false}>
        <InstructorSignup />
      </Layout>
    ),
  },
  {
    path: '/find-instructor',
    element: (
      <Layout>
        <FindInstructor />
      </Layout>
    ),
  },
  {
    path: '/book-lesson',
    element: (
      <Layout>
        <BookLesson />
      </Layout>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardRoute />
      </ProtectedRoute>
    ),
  },
  {
    path: '/messages',
    element: (
      <ProtectedRoute>
        <Layout>
          <Messages />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/progress',
    element: (
      <ProtectedRoute requiredRole="student">
        <Layout>
          <Progress />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/achievements',
    element: (
      <ProtectedRoute requiredRole="student">
        <Layout>
          <AchievementsPage />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Layout>
          <Profile />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile/:userId',
    element: (
      <ProtectedRoute>
        <Layout>
          <Profile />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/users',
    element: (
      <ProtectedRoute requiredRole="admin">
        <Layout>
          <div>Users Management (TODO)</div>
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/lessons',
    element: (
      <ProtectedRoute requiredRole="instructor">
        <Layout>
          <div>Lessons Management (TODO)</div>
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/students',
    element: (
      <ProtectedRoute requiredRole="instructor">
        <Layout>
          <div>Students Management (TODO)</div>
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/schedule',
    element: (
      <ProtectedRoute>
        <Layout>
          <div>Schedule (TODO)</div>
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/resources',
    element: (
      <ProtectedRoute>
        <Layout>
          <div>Resources (TODO)</div>
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute requiredRole="admin">
        <Layout>
          <div>Settings (TODO)</div>
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/checkout/success',
    element: (
      <Layout>
        <CheckoutSuccess />
      </Layout>
    ),
  },
  {
    path: '/checkout/cancel',
    element: (
      <Layout>
        <CheckoutCancel />
      </Layout>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export function AppRouter() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <React.Suspense fallback={<FullPageSpinner text="Loading..." />}>
            <RouterProvider router={router} />
          </React.Suspense>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
