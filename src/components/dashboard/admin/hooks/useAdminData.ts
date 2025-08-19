import { useState, useEffect } from 'react';
import { User, Lesson } from '../../../../types';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

interface Stats {
  totalUsers: number;
  totalLessons: number;
  activeInstructors: number;
  disputedLessons: number;
}

interface UseAdminDataReturn {
  stats: Stats;
  users: User[];
  lessons: Lesson[];
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean;
  loadDashboardData: () => Promise<void>;
  handleRefresh: () => Promise<void>;
}

export function useAdminData(): UseAdminDataReturn {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalLessons: 0,
    activeInstructors: 0,
    disputedLessons: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch users with ordering and limit
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('name'),
        limit(100)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const fetchedUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(fetchedUsers);

      // Fetch lessons with ordering and limit
      const lessonsQuery = query(
        collection(db, 'lessons'),
        orderBy('date', 'desc'),
        limit(100)
      );
      const lessonsSnapshot = await getDocs(lessonsQuery);
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
      setError('Failed to load dashboard data. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return {
    stats,
    users,
    lessons,
    isLoading,
    error,
    isRefreshing,
    loadDashboardData,
    handleRefresh
  };
}
