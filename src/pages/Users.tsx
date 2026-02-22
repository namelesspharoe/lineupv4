import { useMemo, useState } from 'react';
import { Plus, RefreshCw, Users, ShieldCheck, Target } from 'lucide-react';
import type { User } from '../types';
import { useAdminData } from '../components/dashboard/admin/hooks/useAdminData';
import { useAdminActions } from '../components/dashboard/admin/hooks/useAdminActions';
import { UserTable } from '../components/dashboard/admin/components/UserTable';
import { CreateUserModal } from '../components/dashboard/admin/CreateUserModal';
import { EditUserModal } from '../components/dashboard/admin/EditUserModal';
import { AvailabilityForm } from '../components/instructor/AvailabilityForm';
import { StudentProfileWrapper } from '../components/dashboard/admin/components/StudentProfileWrapper';

function formatPercent(part: number, total: number) {
  if (!total) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}

export function UsersPage() {
  const {
    stats,
    users,
    isLoading,
    error,
    isRefreshing,
    handleRefresh,
    loadDashboardData
  } = useAdminData();

  const { handleDeleteUser, handleUpdateUserRole } = useAdminActions();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);

  const roleBreakdown = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        if (user.role && acc[user.role] !== undefined) {
          acc[user.role] += 1;
        }
        return acc;
      },
      { student: 0, instructor: 0, admin: 0 }
    );
  }, [users]);

  const totalUsers = users.length || stats.totalUsers;

  const handleManageAvailability = (userId: string) => {
    setSelectedInstructorId(userId);
    setShowAvailabilityForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:items-center md:flex-row md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold">
            Admin · Control Center
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Users & Permissions</h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Monitor growth across every role, grant access, and keep instructor availability
            aligned with the resort&apos;s demand. Everything funnels into the same management
            table to keep navigation consistent from the sidebar.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <button
            onClick={() => setShowCreateUser(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            New User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{totalUsers}</p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
          <p className="text-sm text-gray-500">
            {roleBreakdown.student} students · {roleBreakdown.instructor} instructors
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Coverage Balance</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatPercent(roleBreakdown.instructor, totalUsers || 1)}
              </p>
            </div>
            <Target className="w-10 h-10 text-emerald-500" />
          </div>
          <p className="text-sm text-gray-500">
            Keep ~35% of the org as instructors to handle peak demand.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Admin Seats</p>
              <p className="text-2xl font-semibold text-gray-900">{roleBreakdown.admin}</p>
            </div>
            <ShieldCheck className="w-10 h-10 text-purple-500" />
          </div>
          <p className="text-sm text-gray-500">
            Restrict admin access to the minimum required for oversight.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            <p>Loading latest roster…</p>
          </div>
        </div>
      ) : (
        <UserTable
          users={users}
          onEditUser={setSelectedUser}
          onManageAvailability={handleManageAvailability}
          onViewProfile={setProfileUser}
          onDeleteUser={(userId) => handleDeleteUser(userId, users, loadDashboardData)}
          onUpdateUserRole={(userId, role) =>
            handleUpdateUserRole(userId, role, users, loadDashboardData)
          }
        />
      )}

      {selectedUser && (
        <EditUserModal
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={loadDashboardData}
        />
      )}

      <CreateUserModal
        isOpen={showCreateUser}
        onClose={() => setShowCreateUser(false)}
        onCreated={loadDashboardData}
      />

      {showAvailabilityForm && selectedInstructorId && (
        <AvailabilityForm
          instructorId={selectedInstructorId}
          onClose={() => {
            setShowAvailabilityForm(false);
            setSelectedInstructorId(null);
            loadDashboardData();
          }}
        />
      )}

      <StudentProfileWrapper
        user={profileUser}
        onClose={() => setProfileUser(null)}
      />
    </div>
  );
}

export default UsersPage;

