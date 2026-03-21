import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  Star,
  Target,
  ChevronRight,
  GraduationCap,
  Calendar,
  Flame,
  ArrowLeft,
  Trophy,
  LayoutList,
  X
} from 'lucide-react';
import { progressService } from '../services/progress';
import { getLessonsByStudent } from '../services/lessons';
import { getUserById } from '../services/users';
import { Lesson, StudentProgress, User } from '../types';
import { Achievements } from '../components/gamification/Achievements';
import { LessonDetailsModal } from '../components/dashboard/student/components/LessonDetailsModal';
import { ResponsiveModalPanel } from '../components/common/ResponsiveModalPanel';
import { getStudentSkillLevel } from '../utils/studentSkillLevel';
import { formatSkillLabel, getSkillDescription } from '../utils/skillDescriptions';
import { ProgressLessonCarousel } from '../components/progress/ProgressLessonCarousel';

type ProgressTab = 'overview' | 'achievements';

/** Matches feedback / studentProgress level indices (see lessons.ts levelMap). */
const STUDENT_LEVEL_INDEX_TO_KEY = [
  'first_time',
  'developing_turns',
  'linking_turns',
  'confident_turns',
  'consistent_blue'
] as const;

function normalizeStudentLevelKey(level: string | number): string {
  if (typeof level === 'number') {
    if (!Number.isFinite(level)) return 'first_time';
    const idx = Math.min(Math.max(0, Math.floor(level)), STUDENT_LEVEL_INDEX_TO_KEY.length - 1);
    return STUDENT_LEVEL_INDEX_TO_KEY[idx];
  }
  return String(level);
}

function formatStudentLevelLabel(level: string | number): string {
  return normalizeStudentLevelKey(level)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l: string) => l.toUpperCase());
}

function lessonSportKey(lesson: Lesson): 'skiing' | 'snowboarding' {
  return lesson.sport === 'snowboarding' ? 'snowboarding' : 'skiing';
}

export function Progress() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: ProgressTab = searchParams.get('tab') === 'achievements' ? 'achievements' : 'overview';

  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [lessons, setLessons] = useState<(Lesson & { instructor?: User })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonForModal, setLessonForModal] = useState<(Lesson & { instructor?: User }) | null>(null);
  const [skillTipModal, setSkillTipModal] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadProgressData();
    }
  }, [user]);

  const setTab = (next: ProgressTab) => {
    if (next === 'overview') {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('tab');
      setSearchParams(nextParams, { replace: true });
    } else {
      setSearchParams({ tab: 'achievements' }, { replace: true });
    }
  };

  const loadProgressData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [progressData, lessonsData] = await Promise.all([
        progressService.getStudentProgress(user!.id),
        getLessonsByStudent(user!.id)
      ]);

      const lessonsWithInstructors = await Promise.all(
        lessonsData.map(async (lesson) => {
          try {
            const instructor = lesson.instructorId ? await getUserById(lesson.instructorId) : null;
            return { ...lesson, instructor: instructor || undefined };
          } catch (lessonError) {
            console.error('Error loading instructor for lesson:', lesson.id, lessonError);
            return lesson;
          }
        })
      );

      setProgress(progressData);
      setLessons(
        lessonsWithInstructors.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
    } catch (err: any) {
      console.error('Error loading progress data:', err);
      setError(err.message || 'Failed to load progress data');
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelColor = (level: string | number) => {
    const levelStr = normalizeStudentLevelKey(level);
    switch (levelStr.toLowerCase()) {
      case 'beginner':
      case 'first_time':
        return 'bg-emerald-100/90 text-emerald-800 ring-1 ring-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/50';
      case 'intermediate':
      case 'developing_turns':
      case 'linking_turns':
        return 'bg-sky-100/90 text-sky-800 ring-1 ring-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800/50';
      case 'advanced':
      case 'confident_turns':
        return 'bg-violet-100/90 text-violet-800 ring-1 ring-violet-200/60 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-800/50';
      case 'expert':
      case 'consistent_blue':
        return 'bg-rose-100/90 text-rose-800 ring-1 ring-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800/50';
      default:
        return 'bg-slate-100/90 text-slate-700 ring-1 ring-slate-200/60 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-600/50';
    }
  };

  const getSkillDisplayName = (skill: string): string => {
    const skillNames: { [key: string]: string } = {
      skiing: 'Skiing',
      snowboarding: 'Snowboarding'
    };
    return skillNames[skill] || skill;
  };

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'skiing':
        return (
          <span className="text-3xl leading-none select-none" role="img" aria-label="Skiing">
            ⛷️
          </span>
        );
      case 'snowboarding':
        return (
          <span className="text-3xl leading-none select-none" role="img" aria-label="Snowboarding">
            🏂
          </span>
        );
      default:
        return <GraduationCap className="h-6 w-6" />;
    }
  };

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-10 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700/80">
            <GraduationCap className="h-7 w-7 text-slate-500 dark:text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-300">Sign in to view your progress and achievements.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600 dark:border-slate-600 dark:border-t-blue-400" />
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Loading your progress…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/50 p-8 dark:border-rose-900/50 dark:bg-rose-950/20">
          <p className="text-rose-800 dark:text-rose-200 mb-4 text-sm">{error}</p>
          <button
            type="button"
            onClick={loadProgressData}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const levelKey = progress?.level ?? getStudentSkillLevel(user);
  const stats = {
    totalLessons: progress?.totalLessons ?? 0,
    completedLessons: progress?.completedLessons ?? 0,
    totalPoints: progress?.totalPoints ?? 0,
    streakDays: progress?.streakDays ?? 0
  };
  const skillEntries = progress?.skillProgress ? Object.entries(progress.skillProgress) : [];

  const statCardClass =
    'group relative min-w-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-sm transition hover:shadow-md dark:border-slate-700/80 dark:bg-slate-800/60 sm:rounded-2xl sm:p-5';

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-sky-50/60 shadow-sm dark:border-slate-700/70 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-400/15 blur-3xl dark:bg-blue-500/10" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl dark:bg-indigo-500/10" />
        <div className="relative p-6 sm:p-8">
          <Link
            to="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-600/60">
                <TrendingUp className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                Your learning journey
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Progress & achievements
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Lessons, skill breakdown, and badges — organized in one place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <span
                className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-semibold ${getLevelColor(levelKey)}`}
              >
                {formatStudentLevelLabel(levelKey)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 px-3.5 py-1.5 text-sm font-semibold text-amber-900 ring-1 ring-amber-200/70 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/50">
                <Star className="h-3.5 w-3.5" />
                {stats.totalPoints} pts
              </span>
            </div>
          </div>

          {/* Segmented tabs */}
          <nav
            className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            aria-label="Progress sections"
          >
            <div className="inline-flex w-full gap-1 rounded-2xl bg-slate-100/90 p-1 ring-1 ring-slate-200/60 dark:bg-slate-800/90 dark:ring-slate-600/50 sm:w-auto">
              <button
                type="button"
                onClick={() => setTab('overview')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:flex-initial ${
                  tab === 'overview'
                    ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-700 dark:text-blue-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <LayoutList className="h-4 w-4 opacity-80" />
                Overview
              </button>
              <button
                type="button"
                onClick={() => setTab('achievements')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:flex-initial ${
                  tab === 'achievements'
                    ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-700 dark:text-blue-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Trophy className="h-4 w-4 opacity-80" />
                Achievements
              </button>
            </div>
          </nav>
        </div>
      </div>

      {tab === 'achievements' ? (
        <Achievements studentId={user.id} />
      ) : (
        <>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
          <div className={statCardClass}>
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">
                  Total lessons
                </p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900 dark:text-white sm:mt-1 sm:text-3xl">
                  {stats.totalLessons}
                </p>
              </div>
              <div className="shrink-0 rounded-lg bg-sky-100 p-2 dark:bg-sky-950/50 sm:rounded-xl sm:p-3">
                <Calendar className="h-5 w-5 text-sky-700 dark:text-sky-400 sm:h-6 sm:w-6" />
              </div>
            </div>
          </div>

          <div className={statCardClass}>
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">
                  Completed
                </p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900 dark:text-white sm:mt-1 sm:text-3xl">
                  {stats.completedLessons}
                </p>
              </div>
              <div className="shrink-0 rounded-lg bg-emerald-100 p-2 dark:bg-emerald-950/50 sm:rounded-xl sm:p-3">
                <GraduationCap className="h-5 w-5 text-emerald-700 dark:text-emerald-400 sm:h-6 sm:w-6" />
              </div>
            </div>
          </div>

          <div className={statCardClass}>
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">
                  Total points
                </p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900 dark:text-white sm:mt-1 sm:text-3xl">
                  {stats.totalPoints}
                </p>
              </div>
              <div className="shrink-0 rounded-lg bg-amber-100 p-2 dark:bg-amber-950/50 sm:rounded-xl sm:p-3">
                <Star className="h-5 w-5 text-amber-700 dark:text-amber-400 sm:h-6 sm:w-6" />
              </div>
            </div>
          </div>

          <div className={statCardClass}>
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">
                  Streak
                </p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900 dark:text-white sm:mt-1 sm:text-3xl">
                  {stats.streakDays}
                  <span className="ml-1 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-base">
                    days
                  </span>
                </p>
              </div>
              <div className="shrink-0 rounded-lg bg-orange-100 p-2 dark:bg-orange-950/50 sm:rounded-xl sm:p-3">
                <Flame className="h-5 w-5 text-orange-700 dark:text-orange-400 sm:h-6 sm:w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Skills Progress */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/50">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-700/80">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Skills progress</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Per-sport level and lesson history
            </p>
          </div>
          <div className="p-6">
            {!progress && (
              <p className="mb-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-900/50 dark:text-slate-400">
                No progress record yet — book a lesson to start tracking skills here.
              </p>
            )}
            <div className="space-y-8">
              {skillEntries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center dark:border-slate-600 dark:bg-slate-900/30">
                  <Target className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Skill breakdown appears after your first lesson feedback.
                  </p>
                </div>
              ) : (
              skillEntries.map(([skillKey, skillData]: [string, any]) => {
                const lessonsForSkill = lessons.filter((l) => lessonSportKey(l) === skillKey);
                return (
                <div key={skillKey} className="rounded-xl border border-slate-100 bg-slate-50/30 p-4 dark:border-slate-700/50 dark:bg-slate-900/20 sm:p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600/50">
                        {getSkillIcon(skillKey)}
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{getSkillDisplayName(skillKey)}</h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getLevelColor(skillData.level ?? 0)}`}
                      >
                        {formatStudentLevelLabel(skillData.level ?? 0)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSkill(selectedSkill === skillKey ? null : skillKey)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {selectedSkill === skillKey ? 'Hide detail' : 'View detail'}
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${selectedSkill === skillKey ? 'rotate-90' : ''}`}
                      />
                    </button>
                  </div>

                  <div className="relative pt-1">
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-600/50">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500 dark:from-blue-500 dark:to-cyan-400"
                        style={{ width: `${skillData.progress}%` }}
                      />
                    </div>
                    <span className="absolute right-0 top-0 -mt-7 text-sm font-medium text-slate-600 dark:text-slate-400">
                      {skillData.progress}%
                    </span>
                  </div>

                  {selectedSkill === skillKey && (
                    <div className="mt-5 space-y-5">
                      <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 dark:bg-slate-800/40 dark:ring-slate-600/50">
                        <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Mastered skills</h4>
                        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                          Tap a skill for a quick explanation.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {skillData.skills.length > 0 ? (
                            skillData.skills.map((skill: string, index: number) => (
                              <button
                                key={`${skill}-${index}`}
                                type="button"
                                onClick={() =>
                                  setSkillTipModal({
                                    title: formatSkillLabel(skill),
                                    body: getSkillDescription(skill)
                                  })
                                }
                                className="rounded-full bg-emerald-100 px-2.5 py-1 text-left text-xs font-medium text-emerald-800 transition hover:bg-emerald-200/90 hover:ring-2 hover:ring-emerald-400/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60 dark:hover:ring-emerald-600/40"
                              >
                                {formatSkillLabel(skill)}
                              </button>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500 dark:text-slate-400">No skills mastered yet</span>
                          )}
                        </div>
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
                          Last updated: {new Date(skillData.lastUpdated).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white">
                              {getSkillDisplayName(skillKey)} lessons
                            </h4>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              Only {skillKey === 'snowboarding' ? 'snowboard' : 'ski'} sessions booked for you
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-right">
                            <span className="hidden md:inline">Use arrows to browse.</span>
                            <span className="flex items-center gap-2 md:hidden">
                              <ChevronRight className="h-3 w-3 rotate-180" />
                              Swipe for more
                              <ChevronRight className="h-3 w-3" />
                            </span>
                          </div>
                        </div>

                        {lessonsForSkill.length > 0 ? (
                          <ProgressLessonCarousel
                            lessons={lessonsForSkill}
                            userId={user.id}
                            onOpenLesson={setLessonForModal}
                          />
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900/30 dark:text-slate-400">
                            {lessons.length === 0
                              ? 'No lessons found yet.'
                              : `No ${skillKey === 'snowboarding' ? 'snowboard' : 'ski'} lessons yet — your other sessions appear under the other discipline.`}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
              })
              )}
            </div>
          </div>
        </div>
        </>
      )}

      <LessonDetailsModal
        lesson={lessonForModal}
        onClose={() => setLessonForModal(null)}
        onLessonUpdate={() => {
          setLessonForModal(null);
          loadProgressData();
        }}
      />

      {skillTipModal && (
        <ResponsiveModalPanel
          onClose={() => setSkillTipModal(null)}
          labelledBy="progress-skill-tip-title"
          maxWidthClass="sm:max-w-lg"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <h2
              id="progress-skill-tip-title"
              className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white"
            >
              {skillTipModal.title}
            </h2>
            <button
              type="button"
              onClick={() => setSkillTipModal(null)}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto p-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {skillTipModal.body}
          </div>
        </ResponsiveModalPanel>
      )}
    </div>
  );
}