import { type FormEvent, type Dispatch, type SetStateAction, useMemo, useState } from 'react';
import { Search, MapPin, Sparkles, ChevronDown } from 'lucide-react';
import { InstructorGrid } from '../instructor/InstructorGrid';
import { FilterPanel } from '../instructor/FilterPanel';
import { AIMatchingRecommendations } from '../instructor/AIMatchingRecommendations';
import { MountainLocationPicker } from './MountainLocationPicker';
import type { User, Mountain as MountainType } from '../../types';
import { getStudentFacingMountainLessonRate, formatStudentMountainRateBadge } from '../../services/mountains';
import type { PassBrowseFilter } from '../../constants/mountainBrowse';
import { directorySearchIsPromptOnly } from '../../utils/bookLessonSearch';

const DEFAULT_PRICE_FILTER_MAX = 500;

const BOOK_LESSON_SEARCH_PLACEHOLDER =
  'e.g. snowboard carving, family lesson, first time on blues…';
const BOOK_LESSON_SEARCH_SUBTITLE =
  'Matches name, specialties, and profile text. Students can jump to AI picks below.';

export type BookLessonFilterState = {
  discipline: string[];
  level: string[];
  price: number[];
  availability: string[];
  languages: string[];
  gender: string[];
  certification: string[];
};

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

function activeRefinementCount(filters: BookLessonFilterState): number {
  let n =
    filters.discipline.length +
    filters.level.length +
    filters.availability.length +
    filters.languages.length +
    filters.gender.length +
    filters.certification.length;
  if (filters.price[0] > 0 || filters.price[1] < DEFAULT_PRICE_FILTER_MAX) n += 1;
  return n;
}

export interface BookLessonBrowseViewProps {
  userRole: string | undefined;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  onMatchSubmit: (e: FormEvent) => void;
  hasMountains: boolean;
  mountains: MountainType[];
  mountainsForBrowse: MountainType[];
  instructors: InstructorWithStats[];
  filteredInstructors: InstructorWithStats[];
  selectedMountain: MountainType | null;
  selectedMountainId: string | null;
  setSelectedMountainId: Dispatch<SetStateAction<string | null>>;
  instructorCountByMountainId: Record<string, number>;
  showSnowSortHint: boolean;
  initialResortPassFilter: PassBrowseFilter;
  filters: BookLessonFilterState;
  setFilters: Dispatch<SetStateAction<BookLessonFilterState>>;
  isLoadingBrowse: boolean;
}

export function BookLessonBrowseView({
  userRole,
  searchQuery,
  setSearchQuery,
  onMatchSubmit,
  hasMountains,
  mountains,
  mountainsForBrowse,
  instructors,
  filteredInstructors,
  selectedMountain,
  selectedMountainId,
  setSelectedMountainId,
  instructorCountByMountainId,
  showSnowSortHint,
  initialResortPassFilter,
  filters,
  setFilters,
  isLoadingBrowse
}: BookLessonBrowseViewProps) {
  const refinementCount = useMemo(() => activeRefinementCount(filters), [filters]);
  const isStudent = userRole === 'student';
  const [refineOpen, setRefineOpen] = useState(false);

  const refineDirectorySummaryCollapsed = useMemo(() => {
    if (selectedMountain && refinementCount > 0) {
      return `${selectedMountain.name} · ${refinementCount} filter${refinementCount === 1 ? '' : 's'}`;
    }
    if (selectedMountain) return selectedMountain.name;
    if (refinementCount > 0) {
      return `All resorts · ${refinementCount} filter${refinementCount === 1 ? '' : 's'}`;
    }
    return 'All resorts — add a resort or filters (optional)';
  }, [selectedMountain, refinementCount]);

  if (isLoadingBrowse) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading directory…</p>
      </div>
    );
  }

  const resetDirectory = () => {
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
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 lg:space-y-10">
      {/* Primary search */}
      <section
        id="book-lesson-match"
        className="scroll-mt-28 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-5"
        aria-label="Search instructors"
      >
        <div className="mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Search
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">{BOOK_LESSON_SEARCH_SUBTITLE}</p>
        </div>
        <form onSubmit={onMatchSubmit} className="space-y-3">
          <label htmlFor="book-lesson-match-prompt" className="sr-only">
            Search instructors by keywords
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"
              aria-hidden
            />
            <textarea
              id="book-lesson-match-prompt"
              name="lessonSearch"
              rows={2}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={BOOK_LESSON_SEARCH_PLACEHOLDER}
              className="min-h-[4.5rem] w-full resize-y rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 md:text-[15px]"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {directorySearchIsPromptOnly(searchQuery)
                ? 'Long descriptions apply to AI recommendations only; the full directory is shown below.'
                : 'Short phrases filter this list. Tip: level, discipline, or name.'}
            </p>
            {isStudent && (
              <button
                type="submit"
                className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                Match with AI
              </button>
            )}
          </div>
        </form>
      </section>

      {!hasMountains && (
        <div className="flex gap-3 rounded-lg border border-amber-200/80 bg-amber-50/90 p-4 dark:border-amber-900/50 dark:bg-amber-950/25">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
          <div className="min-w-0 text-sm text-amber-950 dark:text-amber-100">
            <p className="font-medium">No resorts in directory yet</p>
            <p className="mt-1 text-amber-900/90 dark:text-amber-200/85">
              Add mountains in admin to filter by location. You can still browse all instructors below.
            </p>
          </div>
        </div>
      )}

      {/* Refine: filters + resorts */}
      {!hasMountains ? (
        <section
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
          aria-labelledby="refine-heading-solo"
        >
          <button
            type="button"
            id="refine-solo-trigger"
            className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 md:px-5"
            aria-expanded={refineOpen}
            aria-controls="refine-solo-panel"
            onClick={() => setRefineOpen((o) => !o)}
          >
            <ChevronDown
              className={`mt-0.5 h-5 w-5 shrink-0 text-slate-500 transition-transform motion-reduce:transition-none dark:text-slate-400 ${refineOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="refine-heading-solo" className="text-base font-semibold text-slate-900 dark:text-white">
                  Refine results
                </h2>
                {!refineOpen && refinementCount > 0 && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950/60 dark:text-blue-200">
                    {refinementCount}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {refineOpen
                  ? 'Discipline, level, price, languages, and more'
                  : refinementCount > 0
                    ? `${refinementCount} filter${refinementCount === 1 ? '' : 's'} active`
                    : 'Optional — discipline, level, price, and more'}
              </p>
            </div>
          </button>
          {refineOpen && (
            <div
              id="refine-solo-panel"
              role="region"
              aria-labelledby="refine-heading-solo"
              className="p-5 md:p-6 lg:p-8"
            >
              <FilterPanel embedded filters={filters} setFilters={setFilters} layout="comfortable" />
            </div>
          )}
        </section>
      ) : (
        <section
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 scroll-mt-24"
          aria-labelledby="refine-heading"
        >
          <button
            type="button"
            id="refine-directory-trigger"
            className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 md:px-5"
            aria-expanded={refineOpen}
            aria-controls="refine-directory-panel"
            onClick={() => setRefineOpen((o) => !o)}
          >
            <ChevronDown
              className={`mt-0.5 h-5 w-5 shrink-0 text-slate-500 transition-transform motion-reduce:transition-none dark:text-slate-400 ${refineOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <h2 id="refine-heading" className="text-base font-semibold text-slate-900 dark:text-white">
                Refine directory
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {refineOpen
                  ? 'Choose a resort, then adjust instructor filters below — full width for easier scanning.'
                  : refineDirectorySummaryCollapsed}
              </p>
            </div>
          </button>
          {refineOpen && (
            <div
              id="refine-directory-panel"
              role="region"
              aria-labelledby="refine-heading"
              className="flex flex-col gap-8 lg:gap-10"
            >
              <div className="min-w-0 rounded-xl bg-slate-50/70 p-5 ring-1 ring-slate-200/90 dark:bg-slate-900/35 dark:ring-slate-700/80 md:p-6 lg:p-8">
                <MountainLocationPicker
                  embedded
                  mountains={mountainsForBrowse}
                  instructorCountByMountainId={instructorCountByMountainId}
                  instructorsTotal={instructors.length}
                  selectedMountainId={selectedMountainId}
                  onSelectMountain={setSelectedMountainId}
                  showSnowSortHint={showSnowSortHint}
                  initialPassFilter={initialResortPassFilter}
                />
              </div>
              <div className="min-w-0 rounded-xl border border-slate-200/90 bg-slate-50/90 p-5 dark:border-slate-700/80 dark:bg-slate-950/45 md:p-6 lg:p-8">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Instructor filters
                </p>
                <FilterPanel embedded filters={filters} setFilters={setFilters} layout="comfortable" />
              </div>
            </div>
          )}
        </section>
      )}

      {isStudent && (
        <section id="ai-matching" className="scroll-mt-24 space-y-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recommended</h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Top picks from your profile and filters
              {selectedMountain?.name ? ` · ${selectedMountain.name}` : ''}
            </span>
          </div>
          <AIMatchingRecommendations
            mountains={mountains}
            resort={selectedMountain?.name}
            filters={filters}
            searchQuery={searchQuery}
          />
        </section>
      )}

      {/* Results */}
      <section className="space-y-4" aria-label="Instructor results">
        <div className="flex flex-col gap-2 border-b border-slate-200 pb-3 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Instructors</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {filteredInstructors.length} result{filteredInstructors.length === 1 ? '' : 's'}
              {selectedMountain ? ` at ${selectedMountain.name}` : hasMountains ? ' · all resorts' : ''}
            </p>
          </div>
          {(searchQuery.trim() || refinementCount > 0 || selectedMountainId) && (
            <button
              type="button"
              onClick={resetDirectory}
              className="self-start text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Reset search & filters
            </button>
          )}
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
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 py-14 text-center dark:border-slate-700 dark:bg-slate-900/40">
            <Search className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" aria-hidden />
            <p className="font-medium text-slate-900 dark:text-white">No instructors match</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Widen filters, pick another resort, or clear search.
            </p>
            <button
              type="button"
              onClick={resetDirectory}
              className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Reset all
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
