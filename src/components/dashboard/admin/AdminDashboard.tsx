import React, { useMemo, useState } from 'react';
import { User, TimeEntry, type Lesson } from '../../../types';
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
import { LessonManagementPanel } from './components/LessonManagementPanel';
import { StudentProfileWrapper } from './components/StudentProfileWrapper';
import { MountainManagement } from './components/MountainManagement';
import { AdminOverviewDayCards } from './components/AdminOverviewDayCards';
import { EditTimeEntryModal } from './EditTimeEntryModal';
import { AdminOverviewLessonDetailModal } from './AdminOverviewLessonDetailModal';
import { AdminLocationFilter } from './components/AdminLocationFilter';
import {
  filterUsersForAdminMountain,
  filterLessonsForAdminMountain,
  filterTimeEntriesForAdminMountain
} from './utils/adminLocationFilter';

interface AdminDashboardProps {
  user: User;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const {
    stats,
    users,
    lessons,
    hydratedLessons,
    timeEntries,
    mountains,
    isLoading,
    error,
    isRefreshing,
    loadDashboardData,
    handleRefresh
  } = useAdminData();

  const lessonsForOverview = useMemo(() => {
    const byId = new Map<string, Lesson>();
    for (const l of lessons) byId.set(l.id, l);
    for (const l of hydratedLessons) byId.set(l.id, l);
    return [...byId.values()];
  }, [lessons, hydratedLessons]);

  const [locationMountainId, setLocationMountainId] = useState<string | null>(null);

  const filteredUsers = useMemo(
    () => filterUsersForAdminMountain(users, locationMountainId, mountains),
    [users, locationMountainId, mountains]
  );

  const filteredLessons = useMemo(
    () => filterLessonsForAdminMountain(lessons, users, locationMountainId, mountains),
    [lessons, users, locationMountainId, mountains]
  );

  const lessonsForOverviewFiltered = useMemo(
    () => filterLessonsForAdminMountain(lessonsForOverview, users, locationMountainId, mountains),
    [lessonsForOverview, users, locationMountainId, mountains]
  );

  const filteredTimeEntries = useMemo(
    () => filterTimeEntriesForAdminMountain(timeEntries, users, locationMountainId, mountains),
    [timeEntries, users, locationMountainId, mountains]
  );

  const {
    handleDeleteUser,
    handleDeleteLesson,
    handleUpdateUserRole,
    handleUpdateLessonStatus,
    handleCreateMountain,
    handleUpdateMountainMeta,
    handleUpdateMountainSnow,
    handleAssignInstructorToMountain,
    handleUnassignInstructorFromMountain
  } = useAdminActions();

  // UI State
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'lessons' | 'mountains' | 'timeEntries'>('overview');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<User | null>(null);
  const [selectedTimeEntry, setSelectedTimeEntry] = useState<(TimeEntry & { instructor?: User }) | null>(null);
  const [overviewLessonDetail, setOverviewLessonDetail] = useState<Lesson | null>(null);

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

      <AdminLocationFilter
        mountains={mountains}
        selectedMountainId={locationMountainId}
        onSelectedMountainIdChange={setLocationMountainId}
      />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage users and full lesson tables from the <strong>Users</strong> and <strong>Lessons</strong> tabs.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowCreateUser(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Create user
              </button>
              <button
                type="button"
                onClick={() => setShowCreateLesson(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Create lesson
              </button>
            </div>
          </div>
          <AdminOverviewDayCards
            lessons={lessonsForOverviewFiltered}
            timeEntries={filteredTimeEntries}
            users={users}
            mountains={mountains}
            onViewLessonDetail={setOverviewLessonDetail}
            onEditLesson={handleEditLesson}
            onEditTimeEntry={setSelectedTimeEntry}
          />
        </div>
      )}

      {activeTab === 'users' && (
        <UserTable
          users={filteredUsers}
          onEditUser={handleEditUser}
          onManageAvailability={handleManageAvailability}
          onViewProfile={handleViewProfile}
          onDeleteUser={handleDeleteUserWithRefresh}
          onUpdateUserRole={handleUpdateUserRoleWithRefresh}
        />
      )}

      {activeTab === 'lessons' && (
        <LessonManagementPanel
          lessons={filteredLessons}
          users={users}
          onCreateLesson={() => setShowCreateLesson(true)}
          onEditLesson={handleEditLesson}
          onUpdateLessonStatus={handleUpdateLessonStatusWithRefresh}
          onDeleteLesson={handleDeleteLessonWithRefresh}
        />
      )}

      {activeTab === 'mountains' && (
        <MountainManagement
          mountains={mountains}
          users={users}
          onCreateMountain={handleCreateMountain}
          onUpdateMountainMeta={handleUpdateMountainMeta}
          onUpdateMountainSnow={handleUpdateMountainSnow}
          onAssignInstructorToMountain={handleAssignInstructorToMountain}
          onUnassignInstructorFromMountain={handleUnassignInstructorFromMountain}
          onRefresh={loadDashboardData}
        />
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

      {selectedTimeEntry && (
        <EditTimeEntryModal
          isOpen={!!selectedTimeEntry}
          timeEntry={selectedTimeEntry}
          onClose={() => setSelectedTimeEntry(null)}
          onUpdated={() => {
            setSelectedTimeEntry(null);
            void loadDashboardData();
          }}
        />
      )}

      {overviewLessonDetail && (
        <AdminOverviewLessonDetailModal
          isOpen
          lesson={overviewLessonDetail}
          users={users}
          timeEntriesForLesson={timeEntries.filter((e) => e.lessonId === overviewLessonDetail.id)}
          onClose={() => setOverviewLessonDetail(null)}
          onEditLesson={handleEditLesson}
          onEditTimeEntry={setSelectedTimeEntry}
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