import React from 'react';
import { BarChart2, Users, BookOpen, TrendingUp, DollarSign, Calendar, Star, Award } from 'lucide-react';

export function Stats() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistics</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of platform performance and metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">1,247</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-green-600 dark:text-green-400">+12%</span>
            <span className="text-gray-500 dark:text-gray-400">from last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
              <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Lessons Booked</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">856</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-green-600 dark:text-green-400">+8%</span>
            <span className="text-gray-500 dark:text-gray-400">from last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
              <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">$45,230</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-green-600 dark:text-green-400">+15%</span>
            <span className="text-gray-500 dark:text-gray-400">from last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl">
              <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">4.8</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Based on 234 reviews</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">New student registration</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sarah Johnson joined the platform</p>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">2 min ago</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Lesson completed</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Advanced skiing lesson with Mike Chen</p>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">15 min ago</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Achievement unlocked</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">First Lesson completed by Emma Davis</p>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">1 hour ago</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">New review posted</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">5-star review from Alex Thompson</p>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">Manage Users</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">View and edit user accounts</p>
            </button>
            <button className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-left">
              <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">View Lessons</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monitor all scheduled lessons</p>
            </button>
            <button className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-left">
              <BarChart2 className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">Analytics</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Detailed performance metrics</p>
            </button>
            <button className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors text-left">
              <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">Schedule</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage instructor schedules</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
