import { useState, useEffect } from 'react';
import { User, Lesson, Mountain, TimeEntry } from '../../../../types';
import { collection, query, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { isNonLessonTimeEntryId } from '../../../../constants/timeEntry';

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
  timeEntries: TimeEntry[];
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
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [mountains, setMountains] = useState<Mountain[]>([]);
  const [hydratedLessons, setHydratedLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const usersQuery = query(collection(db, 'users'), orderBy('name'), limit(100));
      const lessonsQuery = query(collection(db, 'lessons'), orderBy('date', 'desc'), limit(200));

      const [usersSnapshot, lessonsSnapshot] = await Promise.all([
        getDocs(usersQuery),
        getDocs(lessonsQuery)
      ]);

      let fetchedTimeEntries: TimeEntry[] = [];
      try {
        const timeEntriesQuery = query(
          collection(db, 'timeEntries'),
          orderBy('createdAt', 'desc'),
          limit(250)
        );
        const timeEntriesSnapshot = await getDocs(timeEntriesQuery);
        fetchedTimeEntries = timeEntriesSnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        })) as TimeEntry[];
      } catch (timeErr) {
        console.error('Error loading time entries for admin:', timeErr);
      }

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
      setTimeEntries(fetchedTimeEntries);
      setMountains(fetchedMountains);

      const loadedLessonIds = new Set(fetchedLessons.map((l) => l.id));
      const referencedIds = [
        ...new Set(
          fetchedTimeEntries
            .map((e) => e.lessonId)
            .filter((id): id is string => Boolean(id) && !isNonLessonTimeEntryId(id))
        )
      ].filter((id) => !loadedLessonIds.has(id));

      let extraLessons: Lesson[] = [];
      if (referencedIds.length > 0) {
        const results = await Promise.all(
          referencedIds.map(async (id) => {
            try {
              const snap = await getDoc(doc(db, 'lessons', id));
              if (!snap.exists()) return null;
              return { id: snap.id, ...snap.data() } as Lesson;
            } catch {
              return null;
            }
          })
        );
        extraLessons = results.filter((l): l is Lesson => l != null);
      }
      setHydratedLessons(extraLessons);

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
    hydratedLessons,
    timeEntries,
    mountains,
    isLoading,
    error,
    isRefreshing,
    loadDashboardData,
    handleRefresh
  };
}
