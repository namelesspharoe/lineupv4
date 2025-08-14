import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import {
  User as UserIcon,
  Edit,
  Save,
  X,
  Shield,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Activity,
  Mail,
  Phone,
  Globe,
  Camera,
  Database,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { doc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface AdminProfileProps {
  admin: User;
  onUpdate?: (updatedAdmin: User) => void;
  isEditable?: boolean;
}

interface SystemStats {
  totalUsers: number;
  totalInstructors: number;
  totalStudents: number;
  totalLessons: number;
  activeLessons: number;
  pendingApprovals: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

export const AdminProfile: React.FC<AdminProfileProps> = ({
  admin,
  onUpdate,
  isEditable = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<User>(admin);
  const [isLoading, setIsLoading] = useState(false);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalInstructors: 0,
    totalStudents: 0,
    totalLessons: 0,
    activeLessons: 0,
    pendingApprovals: 0,
    systemHealth: 'good'
  });

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      // Get total users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      // Get users by role
      const instructorsQuery = query(collection(db, 'users'), where('role', '==', 'instructor'));
      const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
      
      const [instructorsSnapshot, studentsSnapshot] = await Promise.all([
        getDocs(instructorsQuery),
        getDocs(studentsQuery)
      ]);

      const totalInstructors = instructorsSnapshot.size;
      const totalStudents = studentsSnapshot.size;

      // Get lessons stats
      const lessonsSnapshot = await getDocs(collection(db, 'lessons'));
      const totalLessons = lessonsSnapshot.size;

      const activeLessonsQuery = query(
        collection(db, 'lessons'),
        where('status', 'in', ['scheduled', 'in_progress'])
      );
      const activeLessonsSnapshot = await getDocs(activeLessonsQuery);
      const activeLessons = activeLessonsSnapshot.size;

      // Calculate system health based on various metrics
      const systemHealth = calculateSystemHealth(totalUsers, totalInstructors, totalStudents);

      setSystemStats({
        totalUsers,
        totalInstructors,
        totalStudents,
        totalLessons,
        activeLessons,
        pendingApprovals: 0, // This would need to be implemented based on your approval system
        systemHealth
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const calculateSystemHealth = (
    totalUsers: number,
    totalInstructors: number,
    totalStudents: number
  ): 'excellent' | 'good' | 'warning' | 'critical' => {
    // Simple health calculation - you can make this more sophisticated
    if (totalUsers === 0) return 'critical';
    if (totalInstructors === 0) return 'critical';
    if (totalStudents === 0) return 'warning';
    if (totalInstructors < 5) return 'warning';
    return 'excellent';
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const userRef = doc(db, 'users', admin.id);
      await updateDoc(userRef, {
        name: editedProfile.name,
        bio: editedProfile.bio,
        qualifications: editedProfile.qualifications
      });

      onUpdate?.(editedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(admin);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof User, value: any) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 dark:text-green-400';
      case 'good': return 'text-blue-600 dark:text-blue-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'critical': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'good': return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
              {admin.avatar ? (
                <img 
                  src={admin.avatar} 
                  alt={admin.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <Shield className="w-10 h-10 text-white" />
              )}
            </div>
            {isEditable && (
              <button className="absolute -bottom-1 -right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {admin.name}
              </h1>
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-xs font-medium">
                Administrator
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              System Administrator
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {admin.email}
            </p>
          </div>
        </div>
        
        {isEditable && (
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isLoading ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* System Health Status */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getHealthIcon(systemStats.systemHealth)}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  System Health
                </h3>
                <p className={`text-sm font-medium ${getHealthColor(systemStats.systemHealth)}`}>
                  {systemStats.systemHealth.charAt(0).toUpperCase() + systemStats.systemHealth.slice(1)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-300">Last Updated</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Total Users</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {systemStats.totalUsers}
          </p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Instructors</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {systemStats.totalInstructors}
          </p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <UserIcon className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Students</span>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {systemStats.totalStudents}
          </p>
        </div>
        
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Total Lessons</span>
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {systemStats.totalLessons}
          </p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Active Lessons</span>
          </div>
          <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
            {systemStats.activeLessons}
          </p>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Pending Approvals</span>
          </div>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">
            {systemStats.pendingApprovals}
          </p>
        </div>
        
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-indigo-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">System Status</span>
          </div>
          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            Online
          </p>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Bio */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              About Me
            </h3>
            {isEditing ? (
              <textarea
                value={editedProfile.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={4}
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300">
                {admin.bio || 'No bio available.'}
              </p>
            )}
          </div>

          {/* Qualifications */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Qualifications & Permissions
            </h3>
            {isEditing ? (
              <textarea
                value={editedProfile.qualifications || ''}
                onChange={(e) => handleInputChange('qualifications', e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder="List your qualifications and system permissions..."
              />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">Full System Access</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">User Management</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">System Configuration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">Analytics & Reports</span>
                </div>
                {admin.qualifications && (
                  <p className="text-gray-700 dark:text-gray-300 mt-2">
                    {admin.qualifications}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                <Mail className="w-4 h-4" />
                <span>{admin.email}</span>
              </div>
              {admin.phone && (
                <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                  <Phone className="w-4 h-4" />
                  <span>{admin.phone || 'Not provided'}</span>
                </div>
              )}
            </div>
          </div>

          {/* System Access */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              System Access
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">User Management</span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
                  Full Access
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">Content Management</span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
                  Full Access
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">Analytics</span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
                  Full Access
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">System Settings</span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
                  Full Access
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                <Users className="w-4 h-4 mx-auto mb-1" />
                Manage Users
              </button>
              <button className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm">
                <BarChart3 className="w-4 h-4 mx-auto mb-1" />
                View Analytics
              </button>
              <button className="p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm">
                <Settings className="w-4 h-4 mx-auto mb-1" />
                System Settings
              </button>
              <button className="p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm">
                <Activity className="w-4 h-4 mx-auto mb-1" />
                System Health
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
