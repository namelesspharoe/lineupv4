import { Users, BookOpen, TrendingUp, AlertTriangle, Mountain, UserCheck } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalLessons: number;
  activeInstructors: number;
  totalMountains: number;
  assignedInstructors: number;
  disputedLessons: number;
}

interface StatsGridProps {
  stats: Stats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-xl">
            <BookOpen className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Lessons</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalLessons}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-xl">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Active Instructors</p>
            <p className="text-2xl font-bold text-gray-900">{stats.activeInstructors}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Mountain className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Mountains</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalMountains}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-50 rounded-xl">
            <UserCheck className="w-6 h-6 text-cyan-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Assigned Instructors</p>
            <p className="text-2xl font-bold text-gray-900">{stats.assignedInstructors}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Disputed Lessons</p>
            <p className="text-2xl font-bold text-gray-900">{stats.disputedLessons}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
