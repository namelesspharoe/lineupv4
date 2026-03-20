import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  BookOpen,
  History,
  Plus,
  ChevronDown,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  X,
  MapPin,
  Mountain,
  Sparkles,
  DollarSign,
  UsersRound,
  Snowflake
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { InstructorGrid } from '../components/instructor/InstructorGrid';
import { FilterPanel } from '../components/instructor/FilterPanel';
import { ActiveLessons } from '../components/lessons/ActiveLessons';
import { UnifiedLessonModal } from '../components/lessons/UnifiedLessonModal';
import { AIMatchingRecommendations } from '../components/instructor/AIMatchingRecommendations';
import { useLessonBooking } from '../hooks/useLessonBooking';
import { getLessonsByStudent, getLessonsByInstructor } from '../services/lessons';
import { collection, query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Lesson, User, Mountain as MountainType } from '../types';
import {
  getMountains,
  instructorMatchesMountainSelection,
  getStudentFacingMountainLessonRate,
  formatStudentMountainRateBadge,
  sortMountainsForStudentBrowse,
  mountainsHaveSnowReportData
} from '../services/mountains';

const DEFAULT_PRICE_FILTER_MAX = 500;

function formatSnowReportDate(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

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

function formatLessonRate(privateP?: number, groupP?: number): string {
  const parts: string[] = [];
  if (privateP != null && privateP > 0) parts.push(`Private $${privateP}/hr`);
  if (groupP != null && groupP > 0) parts.push(`Group $${groupP}/hr`);
  return parts.length ? parts.join(' · ') : 'Rates on request';
}

export function BookLesson() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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
        userLessons = userLessons.filter(
          (lesson) => lesson.status === 'scheduled' || lesson.status === 'in_progress'
        );
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

  const handleBookingComplete = useCallback(() => {
    if (activeTab === 'active') {
      void loadLessons();
    }
  }, [activeTab, loadLessons]);

  const {
    isBookingModalOpen,
    selectedInstructor,
    selectedLesson,
    bookingMode,
    openBookingModal,
    closeBookingModal
  } = useLessonBooking({
    onSuccess: () => handleBookingComplete(),
    onError: (err) => setError(err)
  });

  useEffect(() => {
    if (!user || (activeTab !== 'active' && activeTab !== 'history')) return;
    void loadLessons();
  }, [user, activeTab, loadLessons]);

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

  const selectedMountainName = selectedMountain?.name;

  const mountainsForBrowse = useMemo(
    () => sortMountainsForStudentBrowse(mountains),
    [mountains]
  );

  const showSnowSortHint = useMemo(() => mountainsHaveSnowReportData(mountains), [mountains]);

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

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (instructor.name || '').toLowerCase().includes(q) ||
        instructor.specialties?.some((s) => s.toLowerCase().includes(q));

      const matchesDiscipline =
        filters.discipline.length === 0 ||
        instructor.specialties?.some((s) => filters.discipline.includes(s));

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
        return 'Active lessons';
      case 'history':
        return 'History';
    }
  };

  const handleLessonComplete = () => loadLessons();

  const hasMountains = mountains.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, rgba(96,165,250,0.35), transparent 45%),
              radial-gradient(circle at 80% 60%, rgba(129,140,248,0.25), transparent 40%)`
          }}
        />
        <div className="relative container mx-auto px-4 md:px-6 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-blue-200 text-sm font-medium tracking-wide uppercase mb-2">
                Resort directory
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Book a ski lesson</h1>
              <p className="text-slate-300 text-base md:text-lg leading-relaxed">
                {user?.role === 'student'
                  ? 'Pick a mountain, compare resort lesson rates, and book an instructor who teaches there.'
                  : 'Manage your schedule and lesson history.'}
              </p>
            </div>
            {hasMountains && activeTab === 'browse' && !isLoadingBrowse && (
              <div className="flex flex-wrap gap-3 text-sm text-slate-200">
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm border border-white/10">
                  <Mountain className="w-4 h-4 text-sky-300" />
                  <span>{mountains.length} ski areas</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm border border-white/10">
                  <UsersRound className="w-4 h-4 text-emerald-300" />
                  <span>{instructors.length} instructors</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-16 z-20 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex overflow-x-auto scrollbar-hide gap-1">
            {(['browse', 'active', 'history'] as TabType[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 py-4 px-4 md:px-5 border-b-2 font-semibold text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {getTabIcon(tab)}
                <span className="hidden sm:inline">{getTabLabel(tab)}</span>
                <span className="sm:hidden">
                  {tab === 'browse' ? 'Book' : tab === 'active' ? 'Active' : 'Past'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-10">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {activeTab === 'browse' && (
          <div className="space-y-8">
            {isLoadingBrowse ? (
              <div className="flex flex-col items-center justify-center min-h-[320px] gap-4">
                <div className="h-12 w-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">Loading resorts and instructors…</p>
              </div>
            ) : (
              <>
                {!hasMountains && (
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/30 p-5 md:p-6 flex gap-4">
                    <div className="shrink-0 p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-amber-950 dark:text-amber-100 mb-1">
                        No ski areas in Firestore yet
                      </h2>
                      <p className="text-sm text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                        The <code className="text-xs bg-amber-100/80 dark:bg-amber-900/50 px-1 rounded">mountains</code>{' '}
                        collection is empty. Add resorts in the admin dashboard (or run your seed script). Until then,
                        you can still browse all instructors below without filtering by mountain.
                      </p>
                    </div>
                  </div>
                )}

                {hasMountains && (
                  <section className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                          Where do you want to ski?
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                          Rates shown are set per mountain. Select one to see instructors who teach there.
                          {showSnowSortHint && (
                            <span className="block mt-1 text-slate-500 dark:text-slate-500">
                              Resorts with snow data are sorted by reported base depth (most first). Figures are
                              entered by your school—not live telemetry.
                            </span>
                          )}
                        </p>
                      </div>
                      {selectedMountainId && (
                        <button
                          type="button"
                          onClick={() => setSelectedMountainId(null)}
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline self-start sm:self-auto inline-flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Show all mountains
                        </button>
                      )}
                    </div>

                    {/* Mobile: horizontal chips */}
                    <div className="flex md:hidden gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin -mx-1 px-1">
                      <button
                        type="button"
                        onClick={() => setSelectedMountainId(null)}
                        className={`snap-start shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                          selectedMountainId === null
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        All · {instructors.length}
                      </button>
                      {mountainsForBrowse.map((m) => {
                        const count = instructorCountByMountainId[m.id] ?? 0;
                        const snowLine =
                          m.baseDepthInches != null
                            ? `${m.baseDepthInches}" base${
                                m.snowfall24hInches != null ? ` · ${m.snowfall24hInches}" 24h` : ''
                              }`
                            : m.snowfall24hInches != null
                              ? `${m.snowfall24hInches}" in 24h`
                              : null;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() =>
                              setSelectedMountainId(selectedMountainId === m.id ? null : m.id)
                            }
                            className={`snap-start shrink-0 max-w-[200px] px-4 py-2.5 rounded-xl text-sm font-semibold border-2 text-left transition-all ${
                              selectedMountainId === m.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="line-clamp-1">{m.name}</span>
                            {snowLine && (
                              <span className="flex items-center gap-1 text-[11px] font-medium text-sky-700 dark:text-sky-300 mt-0.5">
                                <Snowflake className="w-3 h-3 shrink-0" />
                                {snowLine}
                              </span>
                            )}
                            <span className="block text-xs font-normal opacity-80 mt-0.5">{count} instructors</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Desktop: card grid */}
                    <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      <button
                        type="button"
                        onClick={() => setSelectedMountainId(null)}
                        className={`text-left rounded-2xl border-2 p-5 transition-all hover:shadow-md ${
                          selectedMountainId === null
                            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">
                          <MapPin className="w-3.5 h-3.5" />
                          Everywhere
                        </div>
                        <div className="font-bold text-lg text-slate-900 dark:text-white mb-1">All locations</div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          See every instructor across all listed ski areas.
                        </p>
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {instructors.length} instructors
                        </div>
                      </button>

                      {mountainsForBrowse.map((m) => {
                        const count = instructorCountByMountainId[m.id] ?? 0;
                        const selected = selectedMountainId === m.id;
                        const snowUpdated = formatSnowReportDate(m.snowReportUpdatedAt);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedMountainId(selected ? null : m.id)}
                            className={`text-left rounded-2xl border-2 p-5 transition-all hover:shadow-md ${
                              selected
                                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">
                              <Mountain className="w-3.5 h-3.5" />
                              {m.location || 'Resort'}
                            </div>
                            <div className="font-bold text-lg text-slate-900 dark:text-white mb-1 line-clamp-2">
                              {m.name}
                            </div>
                            {(m.baseDepthInches != null || m.snowfall24hInches != null) && (
                              <div className="flex flex-wrap items-center gap-2 mb-2 text-xs font-medium text-sky-800 dark:text-sky-200">
                                <span className="inline-flex items-center gap-1 rounded-lg bg-sky-100/90 dark:bg-sky-950/60 px-2 py-1 border border-sky-200/80 dark:border-sky-800">
                                  <Snowflake className="w-3.5 h-3.5 shrink-0" />
                                  {m.baseDepthInches != null && <span>{m.baseDepthInches}" base</span>}
                                  {m.baseDepthInches != null && m.snowfall24hInches != null && (
                                    <span className="text-sky-600/80 dark:text-sky-400/80">·</span>
                                  )}
                                  {m.snowfall24hInches != null && <span>{m.snowfall24hInches}" 24h</span>}
                                </span>
                                {snowUpdated && (
                                  <span className="text-slate-500 dark:text-slate-400 font-normal">as of {snowUpdated}</span>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2.5rem] mb-3">
                              {m.description || 'Private and group lessons available.'}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                              <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                                <DollarSign className="w-3 h-3" />
                                {formatLessonRate(m.privateLessonPrice, m.groupLessonPrice)}
                              </span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-sm font-medium text-blue-600 dark:text-blue-400">
                              {count} instructor{count === 1 ? '' : 's'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {selectedMountain && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg">
                    <div className="p-6 md:p-8">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sky-300/90 text-xs font-semibold uppercase tracking-wider mb-1">
                            Selected mountain
                          </p>
                          <h3 className="text-2xl md:text-3xl font-bold tracking-tight">{selectedMountain.name}</h3>
                          {selectedMountain.location && (
                            <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 shrink-0" />
                              {selectedMountain.location}
                            </p>
                          )}
                          {selectedMountain.description && (
                            <p className="text-slate-300 text-sm mt-4 leading-relaxed max-w-3xl">
                              {selectedMountain.description}
                            </p>
                          )}
                          {(selectedMountain.baseDepthInches != null ||
                            selectedMountain.snowfall24hInches != null) && (
                            <p className="text-sky-200/90 text-sm mt-3 flex flex-wrap items-center gap-2">
                              <Snowflake className="w-4 h-4 shrink-0" />
                              <span>
                                {selectedMountain.baseDepthInches != null && (
                                  <>{selectedMountain.baseDepthInches}" base</>
                                )}
                                {selectedMountain.baseDepthInches != null &&
                                  selectedMountain.snowfall24hInches != null &&
                                  ' · '}
                                {selectedMountain.snowfall24hInches != null && (
                                  <>{selectedMountain.snowfall24hInches}" last 24h</>
                                )}
                              </span>
                              {(() => {
                                const asOf = formatSnowReportDate(selectedMountain.snowReportUpdatedAt);
                                return asOf ? (
                                  <span className="text-slate-500 text-xs">(as of {asOf})</span>
                                ) : null;
                              })()}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 shrink-0">
                          <div className="rounded-xl bg-white/10 px-4 py-3 border border-white/10">
                            <div className="text-xs text-slate-400 uppercase font-medium">Lesson rates</div>
                            <div className="text-sm font-semibold mt-1">
                              {formatLessonRate(
                                selectedMountain.privateLessonPrice,
                                selectedMountain.groupLessonPrice
                              )}
                            </div>
                          </div>
                          <div className="rounded-xl bg-white/10 px-4 py-3 border border-white/10">
                            <div className="text-xs text-slate-400 uppercase font-medium">Instructors</div>
                            <div className="text-lg font-bold mt-1">
                              {instructorCountByMountainId[selectedMountain.id] ?? 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 md:p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="search"
                        placeholder="Search by name or specialty…"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFilters((v) => !v)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Filter className="w-5 h-5" />
                      Filters
                      <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {showFilters && (
                    <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800">
                      <FilterPanel filters={filters} setFilters={setFilters} />
                    </div>
                  )}
                </section>

                {user?.role === 'student' && (
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                      <Sparkles className="w-5 h-5 text-violet-500" />
                      <h2 className="text-lg font-bold">Recommended for you</h2>
                      {selectedMountainName && (
                        <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                          at {selectedMountainName}
                        </span>
                      )}
                    </div>
                    <AIMatchingRecommendations
                      mountains={mountains}
                      resort={selectedMountainName}
                      filters={filters}
                      searchQuery={searchQuery}
                      onInstructorSelect={(instructor) => openBookingModal(instructor, 'book')}
                    />
                  </section>
                )}

                <section className="space-y-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                      {selectedMountain
                        ? `Instructors at ${selectedMountain.name}`
                        : hasMountains
                          ? 'All instructors'
                          : 'Instructors'}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                      {filteredInstructors.length} instructor
                      {filteredInstructors.length !== 1 ? 's' : ''} match your filters
                      {selectedMountain ? '' : hasMountains ? ' across all mountains' : ''}.
                    </p>
                  </div>

                  {filteredInstructors.length > 0 ? (
                    <InstructorGrid
                      instructors={filteredInstructors.map((instructor) => {
                        const studentRate = getStudentFacingMountainLessonRate(instructor, mountains);
                        return {
                          id: instructor.id,
                          name: instructor.name,
                          image: instructor.avatar,
                          location:
                            instructor.homeMountain ||
                            mountains.find((m) => m.id === instructor.mountainId)?.name ||
                            instructor.preferredLocations?.[0] ||
                            'Mountain not specified',
                          rating: instructor.stats.averageRating,
                          reviewCount: instructor.stats.totalReviews,
                          priceLabel: formatStudentMountainRateBadge(studentRate),
                          studentLessonRate: studentRate,
                          specialties: instructor.specialties || [],
                          experience: instructor.yearsOfExperience || 0,
                          languages: instructor.languages || [],
                          availability: 'Full-time',
                          stats: instructor.stats
                        };
                      })}
                    />
                  ) : (
                    <div className="text-center py-16 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                      <Search className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        No instructors match
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
                        Try another mountain, clear filters, or widen the price range.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedMountainId(null);
                          setFilters({
                            discipline: [],
                            level: [],
                            price: [0, DEFAULT_PRICE_FILTER_MAX],
                            availability: [],
                            languages: [],
                            gender: [],
                            certification: []
                          });
                          setShowFilters(false);
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                      >
                        Reset search & filters
                      </button>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
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
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your active lessons</h2>
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
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No active lessons</h3>
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

      {isBookingModalOpen && selectedInstructor && (
        <UnifiedLessonModal
          isOpen={isBookingModalOpen}
          onClose={closeBookingModal}
          mode={bookingMode}
          instructor={selectedInstructor}
          existingLesson={selectedLesson || undefined}
        />
      )}
    </div>
  );
}
