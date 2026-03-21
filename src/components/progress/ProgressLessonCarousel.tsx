import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  MapPin,
  Target,
  Users
} from 'lucide-react';
import { Lesson, LessonFeedback, User } from '../../types';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatSessionType(sessionType: Lesson['sessionType']) {
  switch (sessionType) {
    case 'morning':
      return 'Morning';
    case 'afternoon':
      return 'Afternoon';
    case 'full_day':
      return 'Full Day';
    default:
      return String(sessionType ?? '');
  }
}

function getLessonStatusColor(status: Lesson['status']) {
  switch (status) {
    case 'scheduled':
      return 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300';
    case 'in_progress':
      return 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300';
    case 'completed':
      return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300';
    case 'cancelled':
      return 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }
}

function getPerformanceColor(rating: number) {
  if (rating >= 4.5) return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300';
  if (rating >= 3.5) return 'text-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-300';
  if (rating >= 2.5) return 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300';
  return 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300';
}

type LessonRow = Lesson & { instructor?: User };

interface ProgressLessonCarouselProps {
  lessons: LessonRow[];
  userId: string;
  onOpenLesson: (lesson: LessonRow) => void;
}

export function ProgressLessonCarousel({ lessons, userId, onOpenLesson }: ProgressLessonCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const max = scrollWidth - clientWidth;
    setCanPrev(scrollLeft > 4);
    setCanNext(scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => updateScrollState());
    return () => cancelAnimationFrame(id);
  }, [lessons, updateScrollState]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateScrollState());
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateScrollState]);

  const scrollPage = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const delta = Math.max(280, Math.floor(el.clientWidth * 0.72));
    el.scrollBy({ left: dir * delta, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Previous lessons"
        disabled={!canPrev}
        onClick={() => scrollPage(-1)}
        className="absolute left-0 top-[min(12rem,45%)] z-10 hidden -translate-y-1/2 rounded-full border border-slate-200/90 bg-white/95 p-2 shadow-md backdrop-blur-sm transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-25 md:flex dark:border-slate-600 dark:bg-slate-800/95 dark:hover:bg-slate-700"
      >
        <ChevronLeft className="h-5 w-5 text-slate-700 dark:text-slate-200" />
      </button>
      <button
        type="button"
        aria-label="Next lessons"
        disabled={!canNext}
        onClick={() => scrollPage(1)}
        className="absolute right-0 top-[min(12rem,45%)] z-10 hidden -translate-y-1/2 rounded-full border border-slate-200/90 bg-white/95 p-2 shadow-md backdrop-blur-sm transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-25 md:flex dark:border-slate-600 dark:bg-slate-800/95 dark:hover:bg-slate-700"
      >
        <ChevronRight className="h-5 w-5 text-slate-700 dark:text-slate-200" />
      </button>

      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 scrollbar-hide md:px-11"
      >
        {lessons.map((lesson) => {
          const lessonFeedback =
            lesson.feedback?.find((f: LessonFeedback) => f.studentId === userId) ||
            lesson.feedback?.[0] ||
            null;
          const lessonLocation =
            lesson.instructor?.homeMountain ||
            lesson.instructor?.address ||
            lesson.instructor?.preferredLocations?.[0] ||
            'Mountain Resort';

          return (
            <button
              key={lesson.id}
              type="button"
              onClick={() => onOpenLesson(lesson)}
              aria-label={`Open lesson details: ${lesson.title}`}
              className="w-[min(100%,420px)] flex-none snap-center overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-left shadow-sm transition hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-600/80 dark:bg-slate-800/80 dark:hover:border-slate-500 dark:focus-visible:ring-offset-slate-950 sm:w-[420px]"
            >
              <div className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h5 className="text-base font-semibold text-slate-900 dark:text-white">{lesson.title}</h5>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(lesson.date)}{' '}
                      {lesson.startTime && lesson.endTime ? `• ${lesson.startTime} - ${lesson.endTime}` : ''}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getLessonStatusColor(lesson.status)}`}
                  >
                    {String(lesson.status).replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 shrink-0 text-blue-500" />
                    <span>{lesson.instructor?.name || 'Instructor unavailable'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-red-500" />
                    <span>{lessonLocation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{formatSessionType(lesson.sessionType)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 shrink-0 text-purple-500" />
                    <span>{lesson.type}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Target className="h-4 w-4 shrink-0 text-cyan-600" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {lesson.sport === 'snowboarding' ? 'Snowboard' : 'Ski'}
                    </span>
                  </div>
                </div>

                {lesson.skillsFocus && lesson.skillsFocus.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {lesson.skillsFocus.map((skill, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-sky-800 dark:bg-sky-950/50 dark:text-sky-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900/50">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Lesson recap</p>
                    {lessonFeedback && lessonFeedback.performance != null && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getPerformanceColor(lessonFeedback.performance.overall ?? 0)}`}
                      >
                        {lessonFeedback.performance.overall ?? 0}/5
                      </span>
                    )}
                  </div>

                  {lessonFeedback ? (
                    <div className="space-y-3 text-sm">
                      <p className="text-slate-700 dark:text-slate-300">
                        {lessonFeedback.instructorNotes ||
                          lessonFeedback.skillAssessment?.recommendations ||
                          'No recap was added for this lesson.'}
                      </p>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-lg bg-emerald-50/90 p-3 dark:bg-emerald-950/30">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                            What went well
                          </p>
                          <p className="text-emerald-900 dark:text-emerald-200/90">
                            {lessonFeedback.strengths && lessonFeedback.strengths.length > 0
                              ? lessonFeedback.strengths.join(', ')
                              : 'No strengths recorded.'}
                          </p>
                        </div>
                        <div className="rounded-lg bg-amber-50/90 p-3 dark:bg-amber-950/30">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-300">
                            Focus next
                          </p>
                          <p className="text-amber-950 dark:text-amber-200/90">
                            {lessonFeedback.areasForImprovement && lessonFeedback.areasForImprovement.length > 0
                              ? lessonFeedback.areasForImprovement.join(', ')
                              : 'No focus areas recorded.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Feedback has not been added for this lesson yet.
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
