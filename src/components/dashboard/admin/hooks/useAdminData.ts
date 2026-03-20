import { useState, useEffect } from 'react';
import { User, Lesson, Mountain } from '../../../../types';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

interface Stats {
  totalUsers: number;
  totalLessons: number;
  activeInstructors: number;
  totalMountains: number;
  assignedInstructors: number;
  disputedLessons: number;
}

interface UseAdminDataReturn {
  stats: Stats;
  users: User[];
  lessons: Lesson[];
  mountains: Mountain[];
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
    totalMountains: 0,
    assignedInstructors: 0,
    disputedLessons: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [mountains, setMountains] = useState<Mountain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const usersQuery = query(collection(db, 'users'), orderBy('name'), limit(100));
      const lessonsQuery = query(collection(db, 'lessons'), orderBy('date', 'desc'), limit(100));

      const [usersSnapshot, lessonsSnapshot] = await Promise.all([
        getDocs(usersQuery),
        getDocs(lessonsQuery)
      ]);

      let fetchedMountains: Mountain[] = [];
      try {
        const mountainsQuery = query(collection(db, 'mountains'), orderBy('name'), limit(100));
        const mountainsSnapshot = await getDocs(mountainsQuery);
        fetchedMountains = mountainsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Mountain[];
      } catch (mountainsError) {
        console.error('Error loading mountains data:', mountainsError);
      }

      const fetchedUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      const fetchedLessons = lessonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lesson[];

      setUsers(fetchedUsers);
      setLessons(fetchedLessons);
      setMountains(fetchedMountains);

      // Calculate stats
      setStats({
        totalUsers: fetchedUsers.length,
        totalLessons: fetchedLessons.length,
        activeInstructors: fetchedUsers.filter(u => u.role === 'instructor').length,
        totalMountains: fetchedMountains.length,
        assignedInstructors: fetchedUsers.filter(u => u.role === 'instructor' && Boolean(u.mountainId || u.homeMountain)).length,
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
    mountains,
    isLoading,
    error,
    isRefreshing,
    loadDashboardData,
    handleRefresh
  };
}
