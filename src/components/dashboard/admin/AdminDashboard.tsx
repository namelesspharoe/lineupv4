import React, { useState } from 'react';
import { User } from '../../../types';
import { RefreshCw, AlertCircle, Plus } from 'lucide-react';
import { EditUserModal } from './EditUserModal';
import { EditLessonModal } from '../instructor/EditLessonModal';
import { CreateUserModal } from './CreateUserModal';
import { CreateLessonModal } from '../instructor/CreateLessonModal';
import { AvailabilityForm } from '../../instructor/AvailabilityForm';
import { TimeEntryManagement } from './TimeEntryManagement';
import { useAdminData } from './hooks/useAdminData';
import { useAdminActions } from './hooks/useAdminActions';
import { StatsGrid } from './components/StatsGrid';
import { TabNavigation } from './components/TabNavigation';
import { UserTable } from './components/UserTable';
import { LessonTable } from './components/LessonTable';
import { StudentProfileWrapper } from './components/StudentProfileWrapper';

interface AdminDashboardProps {
  user: User;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  // Debug: Log user role to help identify permission issues
  console.log('AdminDashboard - Current user:', { id: user.id, role: user.role, email: user.email });

  const {
    stats,
    users,
    lessons,
    isLoading,
    error,
    isRefreshing,
    loadDashboardData,
    handleRefresh
  } = useAdminData();

  const {
    handleDeleteUser,
    handleDeleteLesson,
    handleUpdateUserRole,
    handleUpdateLessonStatus
  } = useAdminActions();

  // UI State
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'lessons' | 'timeEntries'>('overview');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<User | null>(null);

  // Event handlers
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
  };

  const handleEditLesson = (lesson: any) => {
    setSelectedLesson(lesson);
  };

  const handleManageAvailability = (userId: string) => {
    setSelectedInstructorId(userId);
    setShowAvailabilityForm(true);
  };

  const handleViewProfile = (user: User) => {
    setSelectedStudentForProfile(user);
  };

  const handleDeleteUserWithRefresh = async (userId: string) => {
    await handleDeleteUser(userId, users, loadDashboardData);
  };

  const handleDeleteLessonWithRefresh = async (lessonId: string) => {
    await handleDeleteLesson(lessonId, lessons, loadDashboardData);
  };

  const handleUpdateUserRoleWithRefresh = async (userId: string, role: 'student' | 'instructor' | 'admin') => {
    await handleUpdateUserRole(userId, role, users, loadDashboardData);
  };

  const handleUpdateLessonStatusWithRefresh = async (lessonId: string, status: 'available' | 'scheduled' | 'completed' | 'cancelled') => {
    await handleUpdateLessonStatus(lessonId, status, lessons, loadDashboardData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <StatsGrid stats={stats} />

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Users Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
                <button
                  onClick={() => setShowCreateUser(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create User
                </button>
              </div>
            </div>
            <div className="p-6">
              <UserTable
                users={users}
                onEditUser={handleEditUser}
                onManageAvailability={handleManageAvailability}
                onViewProfile={handleViewProfile}
                onDeleteUser={handleDeleteUserWithRefresh}
                onUpdateUserRole={handleUpdateUserRoleWithRefresh}
              />
            </div>
          </div>

          {/* Lessons Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Lesson Management</h2>
                <button
                  onClick={() => setShowCreateLesson(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create Lesson
                </button>
              </div>
            </div>
            <div className="p-6">
              <LessonTable
                lessons={lessons}
                users={users}
                onEditLesson={handleEditLesson}
                onUpdateLessonStatus={handleUpdateLessonStatusWithRefresh}
                onDeleteLesson={handleDeleteLessonWithRefresh}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <UserTable
          users={users}
          onEditUser={handleEditUser}
          onManageAvailability={handleManageAvailability}
          onViewProfile={handleViewProfile}
          onDeleteUser={handleDeleteUserWithRefresh}
          onUpdateUserRole={handleUpdateUserRoleWithRefresh}
        />
      )}

      {activeTab === 'lessons' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Lesson Management</h2>
              <button
                onClick={() => setShowCreateLesson(true)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Create Lesson
              </button>
            </div>
          </div>
          <div className="p-6">
            <LessonTable
              lessons={lessons}
              users={users}
              onEditLesson={handleEditLesson}
              onUpdateLessonStatus={handleUpdateLessonStatusWithRefresh}
              onDeleteLesson={handleDeleteLessonWithRefresh}
            />
          </div>
        </div>
      )}

      {activeTab === 'timeEntries' && (
        <TimeEntryManagement user={user} />
      )}

      {/* Modals */}
      {selectedUser && (
        <EditUserModal
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={loadDashboardData}
        />
      )}

      {selectedLesson && (
        <EditLessonModal
          lesson={selectedLesson}
          isOpen={!!selectedLesson}
          onClose={() => setSelectedLesson(null)}
          onUpdate={loadDashboardData}
          isAdmin={true}
        />
      )}

      <CreateUserModal
        isOpen={showCreateUser}
        onClose={() => setShowCreateUser(false)}
        onCreated={loadDashboardData}
      />

      <CreateLessonModal
        isOpen={showCreateLesson}
        onClose={() => setShowCreateLesson(false)}
        onCreated={loadDashboardData}
        isAdmin={true}
      />

      {showAvailabilityForm && selectedInstructorId && (
        <AvailabilityForm
          instructorId={selectedInstructorId}
          onClose={() => {
            setShowAvailabilityForm(false);
            setSelectedInstructorId(null);
          }}
        />
      )}

      <StudentProfileWrapper
        user={selectedStudentForProfile}
        onClose={() => setSelectedStudentForProfile(null)}
      />
    </div>
  );
}