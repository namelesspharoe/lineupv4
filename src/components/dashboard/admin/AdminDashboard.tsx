import React, { useState, useEffect } from 'react';
import { User, Lesson } from '../../../types';
import {
  Users,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  MoreVertical,
  Shield,
  UserX,
  Edit,
  Trash,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  Target,
  MapPin,
  Plus,
  CalendarDays
} from 'lucide-react';
import { collection, query, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { EditUserModal } from './EditUserModal';
import { EditLessonModal } from '../instructor/EditLessonModal';
import { CreateUserModal } from './CreateUserModal';
import { CreateLessonModal } from '../instructor/CreateLessonModal';
import { AvailabilityForm } from '../../instructor/AvailabilityForm';
import { StudentProfileModal } from '../../student/StudentProfileModal';

interface AdminDashboardProps {
  user: User;
}

interface Stats {
  totalUsers: number;
  totalLessons: number;
  activeInstructors: number;
  disputedLessons: number;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalLessons: 0,
    activeInstructors: 0,
    disputedLessons: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [lessonSearchQuery, setLessonSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'student' | 'instructor' | 'admin'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'available' | 'scheduled' | 'completed' | 'cancelled'>('all');
  const [showUserActions, setShowUserActions] = useState<string | null>(null);
  const [showLessonActions, setShowLessonActions] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<User | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const fetchedUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(fetchedUsers);

      // Fetch lessons
      const lessonsSnapshot = await getDocs(collection(db, 'lessons'));
      const fetchedLessons = lessonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lesson[];
      setLessons(fetchedLessons);

      // Calculate stats
      setStats({
        totalUsers: fetchedUsers.length,
        totalLessons: fetchedLessons.length,
        activeInstructors: fetchedUsers.filter(u => u.role === 'instructor').length,
        disputedLessons: fetchedLessons.filter(l => l.status === 'cancelled').length
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(u => u.id !== userId));
      setShowUserActions(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;
    
    try {
      await deleteDoc(doc(db, 'lessons', lessonId));
      setLessons(lessons.filter(l => l.id !== lessonId));
      setShowLessonActions(null);
    } catch (error) {
      console.error('Error deleting lesson:', error);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'student' | 'instructor' | 'admin') => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setShowUserActions(null);
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handleUpdateLessonStatus = async (lessonId: string, newStatus: 'available' | 'scheduled' | 'completed' | 'cancelled') => {
    try {
      await updateDoc(doc(db, 'lessons', lessonId), { status: newStatus });
      setLessons(lessons.map(l => l.id === lessonId ? { ...l, status: newStatus } : l));
      setShowLessonActions(null);
    } catch (error) {
      console.error('Error updating lesson status:', error);
    }
  };

  const handleManageAvailability = (userId: string) => {
    setSelectedInstructorId(userId);
    setShowAvailabilityForm(true);
    setShowUserActions(null);
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-50 text-purple-600';
      case 'instructor':
        return 'bg-blue-50 text-blue-600';
      case 'student':
        return 'bg-green-50 text-green-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-50 text-green-600';
      case 'scheduled':
        return 'bg-blue-50 text-blue-600';
      case 'completed':
        return 'bg-purple-50 text-purple-600';
      case 'cancelled':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  const formatRole = (role?: string) => {
    if (!role) return 'Unknown';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const formatStatus = (status?: string) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name?.toLowerCase() || '').includes(userSearchQuery.toLowerCase()) ||
      (u.email?.toLowerCase() || '').includes(userSearchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const filteredLessons = lessons.filter(l => {
    const matchesSearch = (l.title?.toLowerCase() || '').includes(lessonSearchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || l.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getInstructorName = (instructorId: string) => {
    const instructor = users.find(u => u.id === instructorId);
    return instructor?.name || 'Unknown Instructor';
  };

  const getStudentNames = (studentIds: string[]) => {
    if (!studentIds || studentIds.length === 0) {
      return 'No Students Assigned';
    }

    const students = studentIds
      .map(id => users.find(u => u.id === id))
      .filter(student => student !== undefined)
      .map(student => student?.name);

    if (students.length === 0) {
      return 'No Students Found';
    }

    if (students.length === 1) {
      return students[0];
    }

    return `${students[0]} +${students.length - 1} more`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="instructor">Instructors</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedUser(u)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || 'https://via.placeholder.com/40'}
                          alt={u.name || 'User'}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{u.name || 'Unknown User'}</p>
                          <p className="text-sm text-gray-500">{u.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(u.role)}`}>
                        {formatRole(u.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-50 text-green-600">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowUserActions(showUserActions === u.id ? null : u.id);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-500" />
                        </button>
                        
                        {showUserActions === u.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateUserRole(u.id, 'admin');
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Shield className="w-4 h-4" />
                              Make Admin
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateUserRole(u.id, 'instructor');
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Make Instructor
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateUserRole(u.id, 'student');
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <UserX className="w-4 h-4" />
                              Make Student
                            </button>
                            {u.role === 'instructor' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleManageAvailability(u.id);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <CalendarDays className="w-4 h-4" />
                                Manage Availability
                              </button>
                            )}
                            {u.role === 'student' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStudentForProfile(u);
                                  setShowUserActions(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Users className="w-4 h-4" />
                                View Profile
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(u.id);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash className="w-4 h-4" />
                              Delete User
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search lessons..."
                value={lessonSearchQuery}
                onChange={(e) => setLessonSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Lessons Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lesson
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLessons.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedLesson(lesson)}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{lesson.title}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {new Date(lesson.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            {lesson.duration} mins
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Target className="w-4 h-4" />
                            {lesson.skillLevel}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-gray-900">{getInstructorName(lesson.instructorId)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-gray-900">{getStudentNames(lesson.studentIds)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lesson.status)}`}>
                        {formatStatus(lesson.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowLessonActions(showLessonActions === lesson.id ? null : lesson.id);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-500" />
                        </button>
                        
                        {showLessonActions === lesson.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateLessonStatus(lesson.id, 'available');
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Mark Available
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateLessonStatus(lesson.id, 'scheduled');
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Calendar className="w-4 h-4" />
                              Mark Scheduled
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateLessonStatus(lesson.id, 'completed');
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Mark Completed
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateLessonStatus(lesson.id, 'cancelled');
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Mark Cancelled
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLesson(lesson.id);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash className="w-4 h-4" />
                              Delete Lesson
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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

      {selectedStudentForProfile && (
        <StudentProfileModal
          student={selectedStudentForProfile}
          onClose={() => setSelectedStudentForProfile(null)}
        />
      )}
    </div>
  );
}