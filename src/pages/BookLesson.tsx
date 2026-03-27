import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useLayoutEffect,
  type FormEvent
} from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import {
  Calendar,
  Clock,
  BookOpen,
  History,
  Plus,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  X,
  Mountain,
  UsersRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ActiveLessons } from '../components/lessons/ActiveLessons';
import { BookLessonBrowseView } from '../components/booking/BookLessonBrowseView';
import { getLessonsByStudent, getLessonsByInstructor } from '../services/lessons';
import { collection, query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Lesson, User, Mountain as MountainType } from '../types';
import {
  getMountains,
  instructorMatchesMountainSelection,
  getStudentFacingMountainLessonRate,
  sortMountainsForStudentBrowse,
  mountainsHaveSnowReportData
} from '../services/mountains';
import { getLessonDate, isLessonUpcoming } from '../utils/lessonDate';
import { passFilterFromStudentSkiPass } from '../constants/mountainBrowse';
import { directoryGridSearchNeedle } from '../utils/bookLessonSearch';

const DEFAULT_PRICE_FILTER_MAX = 500;

type TabType = 'browse' | 'active' | 'history';

interface InstructorStats {
  totalLessons: number;
  averageRating: number;
  totalStudents: number;
  totalReviews: number;
  lastUpdated: string;
}

interface InstructorWithStats extends User {
  stats: InstructorStats;
}

export function BookLesson() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const qFromUrl = searchParams.get('q') ?? searchParams.get('match') ?? '';
  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [searchQuery, setSearchQuery] = useState(qFromUrl);
  const [selectedMountainId, setSelectedMountainId] = useState<string | null>(null);
  const [mountains, setMountains] = useState<MountainType[]>([]);
  const [instructors, setInstructors] = useState<InstructorWithStats[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoadingBrowse, setIsLoadingBrowse] = useState(true);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    discipline: [] as string[],
    level: [] as string[],
    price: [0, DEFAULT_PRICE_FILTER_MAX],
    availability: [] as string[],
    languages: [] as string[],
    gender: [] as string[],
    certification: [] as string[]
  });

  const loadLessons = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingLessons(true);
      setError(null);

      let userLessons: Lesson[];
      if (user.role === 'student') {
        userLessons = await getLessonsByStudent(user.id);
      } else if (user.role === 'instructor') {
        userLessons = await getLessonsByInstructor(user.id);
      } else {
        setError('Invalid user role');
        return;
      }

      if (activeTab === 'active') {
        const upcomingStatuses = new Set(['scheduled', 'in_progress', 'booked']);
        userLessons = userLessons
          .filter((lesson) => {
            if (!upcomingStatuses.has(lesson.status as string)) return false;
            return isLessonUpcoming(lesson);
          })
          .sort((a, b) => {
            const ta = getLessonDate(a).getTime();
            const tb = getLessonDate(b).getTime();
            if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
            if (Number.isNaN(ta)) return 1;
            if (Number.isNaN(tb)) return -1;
            return ta - tb;
          });
      } else if (activeTab === 'history') {
        userLessons = userLessons.filter(
          (lesson) => lesson.status === 'completed' || lesson.status === 'cancelled'
        );
      }

      setLessons(userLessons);
    } catch (err: unknown) {
      console.error('Error loading lessons:', err);
      setError(err instanceof Error ? err.message : 'Failed to load lessons');
    } finally {
      setIsLoadingLessons(false);
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (!user || (activeTab !== 'active' && activeTab !== 'history')) return;
    void loadLessons();
  }, [user, activeTab, loadLessons]);

  useEffect(() => {
    setSearchQuery(qFromUrl);
  }, [qFromUrl]);

  useLayoutEffect(() => {
    if (location.hash !== '#book-lesson-match') return;
    if (activeTab !== 'browse') return;
    const el = document.getElementById('book-lesson-match');
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [location.hash, location.search, activeTab]);

  useEffect(() => {
    if (activeTab !== 'browse') return;

    const loadBrowse = async () => {
      try {
        setIsLoadingBrowse(true);
        setError(null);

        const [mountainsData, instructorsSnapshot] = await Promise.all([
          getMountains().catch((e) => {
            console.warn('Mountains collection failed:', e);
            return [] as MountainType[];
          }),
          getDocs(query(collection(db, 'users'), where('role', '==', 'instructor')))
        ]);

        setMountains(mountainsData);

        const fetchedInstructors = instructorsSnapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name,
            email: data.email || '',
            avatar: data.avatar,
            specialties: data.specialties || [],
            languages: data.languages || [],
            yearsOfExperience: data.yearsOfExperience,
            // Internal instructor rate (admin/payroll); not shown to students on this page
            price: data.hourlyRate ?? data.price,
            preferredLocations: data.preferredLocations || [],
            mountainId: data.mountainId,
            homeMountain: data.homeMountain,
            bio: data.bio,
            level: data.level,
            role: 'instructor' as const,
            gender: data.gender || 'Not specified',
            certifications: data.certifications || [],
            stats: {
              totalLessons: 0,
              averageRating: 0,
              totalStudents: 0,
              totalReviews: 0,
              lastUpdated: new Date().toISOString()
            }
          } as InstructorWithStats;
        });

        const withStats = await Promise.all(
          fetchedInstructors.map(async (instructor) => {
            try {
              const statsDoc = await getDoc(doc(db, 'instructorStats', instructor.id));
              if (statsDoc.exists()) {
                const statsData = statsDoc.data() as InstructorStats;
                return {
                  ...instructor,
                  stats: {
                    totalLessons: statsData.totalLessons || 0,
                    averageRating: statsData.averageRating || 0,
                    totalStudents: statsData.totalStudents || 0,
                    totalReviews: statsData.totalReviews || 0,
                    lastUpdated: statsData.lastUpdated || new Date().toISOString()
                  }
                };
              }
            } catch {
              /* use defaults */
            }
            return {
              ...instructor,
              stats: {
                totalLessons: Math.floor((instructor.yearsOfExperience || 1) * 50),
                averageRating: 4.5,
                totalStudents: Math.floor((instructor.yearsOfExperience || 1) * 30),
                totalReviews: Math.floor((instructor.yearsOfExperience || 1) * 20),
                lastUpdated: new Date().toISOString()
              }
            };
          })
        );

        setInstructors(withStats);
      } catch (err) {
        console.error('Error loading browse data:', err);
        setError('Failed to load resorts and instructors. Please try again.');
      } finally {
        setIsLoadingBrowse(false);
      }
    };

    loadBrowse();
  }, [activeTab]);

  useEffect(() => {
    if (selectedMountainId && !mountains.some((m) => m.id === selectedMountainId)) {
      setSelectedMountainId(null);
    }
  }, [mountains, selectedMountainId]);

  const selectedMountain = useMemo(
    () => (selectedMountainId ? mountains.find((m) => m.id === selectedMountainId) ?? null : null),
    [mountains, selectedMountainId]
  );

  const mountainsForBrowse = useMemo(
    () => sortMountainsForStudentBrowse(mountains),
    [mountains]
  );

  const showSnowSortHint = useMemo(() => mountainsHaveSnowReportData(mountains), [mountains]);

  const initialResortPassFilter = useMemo(
    () => passFilterFromStudentSkiPass(user?.studentPreferences?.skiPass),
    [user?.studentPreferences?.skiPass]
  );

  const instructorCountByMountainId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of mountains) {
      map[m.id] = instructors.filter((i) =>
        instructorMatchesMountainSelection(i, m.id, m.name, mountains)
      ).length;
    }
    return map;
  }, [mountains, instructors]);

  const filteredInstructors = useMemo(() => {
    return instructors.filter((instructor) => {
      const matchesMountain =
        !selectedMountain ||
        instructorMatchesMountainSelection(
          instructor,
          selectedMountain.id,
          selectedMountain.name,
          mountains
        );

      const needle = directoryGridSearchNeedle(searchQuery);
      const matchesSearch =
        needle === null ||
        (instructor.name || '').toLowerCase().includes(needle) ||
        instructor.specialties?.some((s) => s.toLowerCase().includes(needle)) ||
        (instructor.bio || '').toLowerCase().includes(needle);

      const matchesDiscipline =
        filters.discipline.length === 0 ||
        instructor.specialties?.some((s) => {
          const sl = s.toLowerCase();
          return filters.discipline.some(
            (d) => sl.includes(d.toLowerCase()) || d.toLowerCase().includes(sl)
          );
        });

      const matchesLevel =
        filters.level.length === 0 ||
        (instructor.level && filters.level.includes(instructor.level));

      const displayPrice = getStudentFacingMountainLessonRate(instructor, mountains);
      const matchesPrice =
        displayPrice === null ||
        (displayPrice >= filters.price[0] && displayPrice <= filters.price[1]);

      const matchesLanguages =
        filters.languages.length === 0 ||
        instructor.languages?.some((l) => filters.languages.includes(l));

      const matchesGender =
        filters.gender.length === 0 ||
        (instructor.gender && filters.gender.includes(instructor.gender));

      const matchesCertification =
        filters.certification.length === 0 ||
        instructor.certifications?.some((c) => filters.certification.includes(c));

      return (
        matchesMountain &&
        matchesSearch &&
        matchesDiscipline &&
        matchesLevel &&
        matchesPrice &&
        matchesLanguages &&
        matchesGender &&
        matchesCertification
      );
    });
  }, [searchQuery, filters, instructors, selectedMountain, mountains]);

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case 'browse':
        return <Mountain className="w-5 h-5" />;
      case 'active':
        return <Clock className="w-5 h-5" />;
      case 'history':
        return <History className="w-5 h-5" />;
    }
  };

  const getTabLabel = (tab: TabType) => {
    switch (tab) {
      case 'browse':
        return 'Find a lesson';
      case 'active':
        return 'Upcoming lessons';
      case 'history':
        return 'History';
    }
  };

  const handleLessonComplete = () => loadLessons();

  const hasMountains = mountains.length > 0;

  const scrollToAiMatching = useCallback(() => {
    document.getElementById('ai-matching')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleBookLessonMatchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (user?.role === 'student') {
      scrollToAiMatching();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-6 md:py-7">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-[1.65rem]">
              Lessons
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-400">
              {user?.role === 'student'
                ? 'Search the directory, choose a resort, book a certified instructor.'
                : 'Browse the directory or manage your schedule and history.'}
            </p>
          </div>
          {hasMountains && activeTab === 'browse' && !isLoadingBrowse && (
            <dl className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/80">
                <Mountain className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden />
                <div>
                  <dt className="sr-only">Resorts</dt>
                  <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">{mountains.length}</dd>
                  <dd className="text-xs text-slate-500 dark:text-slate-400">resorts</dd>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/80">
                <UsersRound className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                <div>
                  <dt className="sr-only">Instructors</dt>
                  <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">{instructors.length}</dd>
                  <dd className="text-xs text-slate-500 dark:text-slate-400">instructors</dd>
                </div>
              </div>
            </dl>
          )}
        </div>
      </header>

      <div className="sticky top-16 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="container mx-auto px-4 py-3 md:px-6">
          <nav className="inline-flex gap-0.5 rounded-lg bg-slate-100 p-1 dark:bg-slate-800" aria-label="Lesson views">
            {(['browse', 'active', 'history'] as TabType[]).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors md:px-4 ${
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {getTabIcon(tab)}
                <span className="hidden sm:inline">{getTabLabel(tab)}</span>
                <span className="sm:hidden">
                  {tab === 'browse' ? 'Browse' : tab === 'active' ? 'Upcoming' : 'Past'}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/40">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {activeTab === 'browse' && (
          <BookLessonBrowseView
            userRole={user?.role}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onMatchSubmit={handleBookLessonMatchSubmit}
            hasMountains={hasMountains}
            mountains={mountains}
            mountainsForBrowse={mountainsForBrowse}
            instructors={instructors}
            filteredInstructors={filteredInstructors}
            selectedMountain={selectedMountain}
            selectedMountainId={selectedMountainId}
            setSelectedMountainId={setSelectedMountainId}
            instructorCountByMountainId={instructorCountByMountainId}
            showSnowSortHint={showSnowSortHint}
            initialResortPassFilter={initialResortPassFilter}
            filters={filters}
            setFilters={setFilters}
            isLoadingBrowse={isLoadingBrowse}
          />
        )}

        {activeTab === 'active' && (
          <div className="space-y-6">
            {user?.role === 'instructor' ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
                <ActiveLessons instructorId={user.id} onLessonComplete={handleLessonComplete} />
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 md:p-8">
                {isLoadingLessons ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="h-12 w-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  </div>
                ) : lessons.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your upcoming lessons</h2>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        {lessons.length}
                      </span>
                    </div>
                    <div className="grid gap-4">
                      {lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="rounded-xl p-6 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                                {lesson.title}
                              </h3>
                              <p className="text-slate-600 dark:text-slate-400 text-sm">{lesson.description}</p>
                            </div>
                            <div className="flex flex-col items-start md:items-end gap-1">
                              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                <Calendar className="w-4 h-4" />
                                <span>{lesson.date}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {lesson.startTime} – {lesson.endTime}
                                </span>
                              </div>
                              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                ${lesson.price}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              <span className="capitalize">{lesson.type}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Target className="w-4 h-4" />
                              <span className="capitalize">{lesson.skillLevel?.replace('_', ' ')}</span>
                            </div>
                          </div>
                          {lesson.skillsFocus && lesson.skillsFocus.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Skills focus
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {lesson.skillsFocus.map((skill, index) => (
                                  <span
                                    key={index}
                                    className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No upcoming lessons</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      Book a lesson from the Find a lesson tab.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('browse')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Find a lesson
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 md:p-8">
            {isLoadingLessons ? (
              <div className="flex justify-center items-center h-64">
                <div className="h-12 w-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              </div>
            ) : lessons.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Lesson history</h2>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {lessons.length}
                  </span>
                </div>
                <div className="grid gap-4">
                  {lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="rounded-xl p-6 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                            {lesson.title}
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 text-sm">{lesson.description}</p>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-2">
                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <Calendar className="w-4 h-4" />
                            <span>{lesson.date}</span>
                          </div>
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                              lesson.status === 'completed'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                            }`}
                          >
                            {lesson.status === 'completed' ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            <span className="capitalize">{lesson.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-4">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          <span className="capitalize">{lesson.type}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Target className="w-4 h-4" />
                          <span className="capitalize">{lesson.skillLevel?.replace('_', ' ')}</span>
                        </div>
                        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">${lesson.price}</div>
                      </div>
                      {lesson.feedback && lesson.feedback.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Feedback</div>
                          {lesson.feedback.map((feedback, index) => (
                            <div
                              key={index}
                              className="text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800 mb-2 last:mb-0"
                            >
                              <div className="font-medium mb-1">
                                Performance: {feedback.performance?.overall ?? 'N/A'}/5
                              </div>
                              {feedback.instructorNotes && (
                                <div className="text-slate-500 dark:text-slate-500">{feedback.instructorNotes}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No lesson history</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">Complete a lesson to see it here.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('browse')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Find a lesson
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
