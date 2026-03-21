import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Search, 
  User,
  DollarSign,
  AlertTriangle,
  Eye,
  RefreshCw,
  BookOpen,
  Scale,
  GraduationCap,
  Building2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { collection, query, getDocs, updateDoc, doc, getDoc, orderBy, where, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { TimeEntry, User as UserType } from '../../../types';
import { EditTimeEntryModal } from './EditTimeEntryModal';
import { TimeEntryDetailsModal } from './TimeEntryDetailsModal';
import { payCategoryLabel, resolvePayCategory } from '../../../utils/instructorPayroll';
import { isNonLessonTimeEntryId } from '../../../constants/timeEntry';

interface TimeEntryManagementProps {
  user: UserType;
}

interface TimeEntryWithInstructor extends TimeEntry {
  instructor?: UserType;
}

interface Stats {
  totalEntries: number;
  pendingApproval: number;
  disputedEntries: number;
  completedEntries: number;
  totalEarnings: number;
  /** Sum of `lesson.price` for distinct lesson docs linked by time entries (teaching shifts). */
  linkedLessonRevenue: number;
  /** linkedLessonRevenue − totalEarnings (same loaded batch). */
  netMargin: number;
  teachingPayout: number;
  resortPayout: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function TimeEntryManagement({ user }: TimeEntryManagementProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntryWithInstructor[]>([]);
  const [instructors, setInstructors] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'disputed'>('all');
  const [instructorFilter, setInstructorFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedEntry, setSelectedEntry] = useState<TimeEntryWithInstructor | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalEntries: 0,
    pendingApproval: 0,
    disputedEntries: 0,
    completedEntries: 0,
    totalEarnings: 0,
    linkedLessonRevenue: 0,
    netMargin: 0,
    teachingPayout: 0,
    resortPayout: 0
  });

  // Load time entries and instructors
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load instructors
      const instructorsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'instructor'),
        orderBy('name')
      );
      const instructorsSnapshot = await getDocs(instructorsQuery);
      const fetchedInstructors = instructorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserType[];
      setInstructors(fetchedInstructors);

      // Load time entries
      const timeEntriesQuery = query(
        collection(db, 'timeEntries'),
        orderBy('createdAt', 'desc'),
        limit(200)
      );
      const timeEntriesSnapshot = await getDocs(timeEntriesQuery);
      const fetchedEntries = timeEntriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TimeEntry[];

      // Combine with instructor data
      const entriesWithInstructors = fetchedEntries.map(entry => ({
        ...entry,
        instructor: fetchedInstructors.find(instructor => instructor.id === entry.instructorId)
      }));

      setTimeEntries(entriesWithInstructors);

      const uniqueLessonIds = [
        ...new Set(
          entriesWithInstructors
            .map((e) => e.lessonId)
            .filter((id): id is string => Boolean(id) && !isNonLessonTimeEntryId(id))
        )
      ];

      const lessonPriceById = new Map<string, number>();
      await Promise.all(
        uniqueLessonIds.map(async (lessonId) => {
          try {
            const snap = await getDoc(doc(db, 'lessons', lessonId));
            if (snap.exists()) {
              const price = Number((snap.data() as { price?: number }).price) || 0;
              lessonPriceById.set(lessonId, price);
            }
          } catch {
            /* ignore missing lesson */
          }
        })
      );

      let linkedLessonRevenue = 0;
      for (const id of uniqueLessonIds) {
        linkedLessonRevenue += lessonPriceById.get(id) ?? 0;
      }

      // Calculate stats
      const totalEntries = entriesWithInstructors.length;
      const pendingApproval = entriesWithInstructors.filter((entry) => entry.status === 'active').length;
      const disputedEntries = entriesWithInstructors.filter((entry) => entry.status === 'disputed').length;
      const completedEntries = entriesWithInstructors.filter((entry) => entry.status === 'completed').length;
      const totalEarnings = entriesWithInstructors.reduce((sum, entry) => sum + (entry.totalEarnings || 0), 0);

      let teachingPayout = 0;
      let resortPayout = 0;
      for (const entry of entriesWithInstructors) {
        const pay = entry.totalEarnings || 0;
        if (resolvePayCategory(entry.lessonId) === 'teaching') {
          teachingPayout += pay;
        } else {
          resortPayout += pay;
        }
      }

      const netMargin = linkedLessonRevenue - totalEarnings;

      setStats({
        totalEntries,
        pendingApproval,
        disputedEntries,
        completedEntries,
        totalEarnings,
        linkedLessonRevenue,
        netMargin,
        teachingPayout,
        resortPayout
      });

    } catch (err) {
      console.error('Error loading time entries:', err);
      setError('Failed to load time entries');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter time entries based on search and filters
  const filteredEntries = timeEntries.filter(entry => {
    const matchesSearch = searchQuery === '' || 
      entry.instructor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    const matchesInstructor = instructorFilter === 'all' || entry.instructorId === instructorFilter;
    const matchesDate = dateFilter === '' || entry.clockIn.startsWith(dateFilter);

    return matchesSearch && matchesStatus && matchesInstructor && matchesDate;
  });

  // Handle status updates
  const handleStatusUpdate = async (entryId: string, newStatus: 'active' | 'completed' | 'disputed') => {
    try {
      const entryRef = doc(db, 'timeEntries', entryId);
      await updateDoc(entryRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setTimeEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, status: newStatus, updatedAt: new Date().toISOString() }
          : entry
      ));

      // Reload data to update stats
      loadData();
    } catch (err) {
      console.error('Error updating time entry status:', err);
      setError('Failed to update time entry status');
    }
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    try {
      if (!timeString) return 'N/A';
      
      if (timeString.match(/^\d{1,2}:\d{2}$/)) {
        return timeString;
      }
      
      const date = parseISO(timeString);
      if (isNaN(date.getTime())) {
        return 'Invalid time';
      }
      return format(date, 'h:mm a');
    } catch {
      return 'Invalid time';
    }
  };

  // Format duration
  const formatDuration = (startTime: string, endTime?: string) => {
    try {
      if (!endTime) return 'In Progress';
      
      const start = parseISO(startTime);
      const end = parseISO(endTime);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'Invalid duration';
      }
      
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch {
      return 'Invalid duration';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Active</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>;
      case 'disputed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Disputed</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Time Entry Management</h2>
          <p className="text-gray-600">Review and manage instructor time entries</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total entries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEntries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending (active)</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingApproval}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Disputed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.disputedEntries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedEntries}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-600">Lesson revenue (linked)</p>
                <p className="text-2xl font-bold text-gray-900">${stats.linkedLessonRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  Sum of lesson prices for distinct lessons referenced by these entries.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-600">Instructor payout</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalEarnings.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Sum of recorded earnings on all loaded entries.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  stats.netMargin >= 0 ? 'bg-teal-100' : 'bg-orange-100'
                }`}
              >
                <Scale className={`w-5 h-5 ${stats.netMargin >= 0 ? 'text-teal-700' : 'text-orange-700'}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-600">Net (revenue − payout)</p>
                <p
                  className={`text-2xl font-bold ${
                    stats.netMargin >= 0 ? 'text-teal-800' : 'text-orange-800'
                  }`}
                >
                  ${stats.netMargin.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  Rough margin for this batch; not a full P&amp;L.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                <GraduationCap className="w-5 h-5 text-slate-700" />
              </div>
              <div className="min-w-0 space-y-2">
                <p className="text-sm font-medium text-gray-700">Payout by type</p>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-1 text-gray-600">
                    <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                    Teaching
                  </span>
                  <span className="font-semibold text-gray-900">${stats.teachingPayout.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-1 text-gray-600">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    Resort / other
                  </span>
                  <span className="font-semibold text-gray-900">${stats.resortPayout.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 max-w-4xl">
          Figures use the latest <strong>200 time entries</strong> from the server (same as the table). Lesson
          revenue counts each lesson once; multiple shifts on the same lesson still show one lesson price. Payout
          sums every entry’s <span className="font-mono">totalEarnings</span>.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by instructor, ID, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'completed' | 'disputed')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
            <select
              value={instructorFilter}
              onChange={(e) => setInstructorFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Instructors</option>
              {instructors.map(instructor => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Time Entries Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Earnings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.instructor?.name || 'Unknown Instructor'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.instructor?.email || 'No email'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(parseISO(entry.clockIn), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>In: {formatTime(entry.clockIn)}</div>
                      {entry.clockOut && (
                        <div>Out: {formatTime(entry.clockOut)}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(entry.clockIn, entry.clockOut)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="text-xs text-gray-500">
                        {payCategoryLabel(entry.payCategory ?? resolvePayCategory(entry.lessonId))}
                      </div>
                      {entry.hourlyRate != null && (
                        <div className="text-gray-500">${entry.hourlyRate}/hr</div>
                      )}
                      {entry.totalEarnings != null && (
                        <div className="font-medium">${entry.totalEarnings.toFixed(2)}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(entry.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedEntry(entry);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedEntry(entry);
                          setShowEditModal(true);
                        }}
                        className="text-gray-600 hover:text-gray-900 p-1"
                        title="Edit Entry"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {entry.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(entry.id, 'completed')}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Approve Entry"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(entry.id, 'disputed')}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Dispute Entry"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {entry.status === 'completed' && (
                        <button
                          onClick={() => handleStatusUpdate(entry.id, 'disputed')}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Dispute Entry"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                      {entry.status === 'disputed' && (
                        <button
                          onClick={() => handleStatusUpdate(entry.id, 'completed')}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Approve Entry"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No time entries found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showEditModal && selectedEntry && (
        <EditTimeEntryModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEntry(null);
          }}
          timeEntry={selectedEntry}
          onUpdated={() => {
            setShowEditModal(false);
            setSelectedEntry(null);
            loadData();
          }}
        />
      )}

      {showDetailsModal && selectedEntry && (
        <TimeEntryDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedEntry(null);
          }}
          timeEntry={selectedEntry}
        />
      )}
    </div>
  );
}
