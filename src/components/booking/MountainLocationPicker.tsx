import { useMemo, useState, useEffect } from 'react';
import { MapPin, Mountain, Snowflake, DollarSign, X, Search } from 'lucide-react';
import type { Mountain as MountainType, MountainRegionId } from '../../types';
import {
  MOUNTAIN_REGION_LABELS,
  MOUNTAIN_REGION_ORDER,
  type PassBrowseFilter,
  filterMountainsByPass,
  filterMountainsBySearch,
  groupMountainsByRegion,
  effectiveMountainRegionId
} from '../../constants/mountainBrowse';

function formatLessonRate(privateP?: number, groupP?: number): string {
  const parts: string[] = [];
  if (privateP != null && privateP > 0) parts.push(`Private $${privateP}/hr`);
  if (groupP != null && groupP > 0) parts.push(`Group $${groupP}/hr`);
  return parts.length ? parts.join(' · ') : 'Rates on request';
}

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

interface MountainLocationPickerProps {
  mountains: MountainType[];
  instructorCountByMountainId: Record<string, number>;
  instructorsTotal: number;
  selectedMountainId: string | null;
  onSelectMountain: (id: string | null) => void;
  showSnowSortHint: boolean;
  /** From signup / profile — preselect pass filter. */
  initialPassFilter: PassBrowseFilter;
}

const PASS_OPTIONS: { id: PassBrowseFilter; label: string }[] = [
  { id: 'all', label: 'All resorts' },
  { id: 'ikon', label: 'Ikon' },
  { id: 'epic', label: 'Epic' },
  { id: 'unlisted', label: 'Not tagged' }
];

export function MountainLocationPicker({
  mountains,
  instructorCountByMountainId,
  instructorsTotal,
  selectedMountainId,
  onSelectMountain,
  showSnowSortHint,
  initialPassFilter
}: MountainLocationPickerProps) {
  const [passFilter, setPassFilter] = useState<PassBrowseFilter>(initialPassFilter);
  const [regionScope, setRegionScope] = useState<MountainRegionId | 'all'>('all');
  const [resortSearch, setResortSearch] = useState('');

  useEffect(() => {
    setPassFilter(initialPassFilter);
  }, [initialPassFilter]);

  const filtered = useMemo(() => {
    const byPass = filterMountainsByPass(mountains, passFilter);
    return filterMountainsBySearch(byPass, resortSearch);
  }, [mountains, passFilter, resortSearch]);

  const grouped = useMemo(() => groupMountainsByRegion(filtered), [filtered]);

  const regionsWithResorts = useMemo(() => {
    return MOUNTAIN_REGION_ORDER.filter((id) => (grouped.get(id) ?? []).length > 0);
  }, [grouped]);

  const renderMountainCard = (m: MountainType) => {
    const count = instructorCountByMountainId[m.id] ?? 0;
    const selected = selectedMountainId === m.id;
    const snowUpdated = formatSnowReportDate(m.snowReportUpdatedAt);
    const passes = m.passAffiliations ?? [];
    return (
      <button
        key={m.id}
        type="button"
        onClick={() => onSelectMountain(selected ? null : m.id)}
        className={`text-left rounded-2xl border-2 p-5 transition-all hover:shadow-md w-full ${
          selected
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700'
        }`}
      >
        <div className="flex items-center justify-between gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">
          <span className="flex items-center gap-2 min-w-0">
            <Mountain className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{m.location || 'Resort'}</span>
          </span>
          {passes.length > 0 && (
            <span className="flex shrink-0 gap-1">
              {passes.includes('ikon') && (
                <span className="rounded bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-200 px-1.5 py-0.5 normal-case text-[10px]">
                  Ikon
                </span>
              )}
              {passes.includes('epic') && (
                <span className="rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 normal-case text-[10px]">
                  Epic
                </span>
              )}
            </span>
          )}
        </div>
        <div className="font-bold text-lg text-slate-900 dark:text-white mb-1 line-clamp-2">{m.name}</div>
        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
          {MOUNTAIN_REGION_LABELS[effectiveMountainRegionId(m)]}
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
  };

  const renderAllLocationsCard = () => (
    <button
      type="button"
      onClick={() => onSelectMountain(null)}
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
      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">{instructorsTotal} instructors</div>
    </button>
  );

  const gridForRegion = (rid: MountainRegionId) => {
    const list = grouped.get(rid) ?? [];
    if (list.length === 0) return null;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {list.map((m) => renderMountainCard(m))}
      </div>
    );
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Where do you want to ski?</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Filter by pass and region, then pick a resort. Rates are set per mountain.
            {showSnowSortHint && (
              <span className="block mt-1 text-slate-500 dark:text-slate-500">
                Within each region, resorts with snow data are sorted by reported base depth (most first). Figures are
                entered by your school—not live telemetry.
              </span>
            )}
          </p>
        </div>
        {selectedMountainId && (
          <button
            type="button"
            onClick={() => onSelectMountain(null)}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline self-start sm:self-auto inline-flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Show all mountains
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:mr-1">
          Pass
        </span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by season pass">
          {PASS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPassFilter(opt.id)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold border-2 transition-all ${
                passFilter === opt.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="search"
          value={resortSearch}
          onChange={(e) => setResortSearch(e.target.value)}
          placeholder="Search resorts by name or location…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Search resorts"
        />
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4 text-sm text-slate-600 dark:text-slate-400">
          No resorts match your filters. Try <strong>All resorts</strong>, clear search, or choose another pass.
        </div>
      )}

      {/* Region scope — desktop tabs */}
      {filtered.length > 0 && (
        <div className="hidden md:block">
          <div
            className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4"
            role="tablist"
            aria-label="Region"
          >
            <button
              type="button"
              role="tab"
              aria-selected={regionScope === 'all'}
              onClick={() => setRegionScope('all')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                regionScope === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All regions
            </button>
            {regionsWithResorts.map((rid) => (
              <button
                key={rid}
                type="button"
                role="tab"
                aria-selected={regionScope === rid}
                onClick={() => setRegionScope(rid)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  regionScope === rid
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {MOUNTAIN_REGION_LABELS[rid]}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">{renderAllLocationsCard()}</div>

          {regionScope === 'all' ? (
            regionsWithResorts.map((rid) => (
              <div key={rid} className="mb-8 last:mb-0">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  {MOUNTAIN_REGION_LABELS[rid]}
                  <span className="text-sm font-normal text-slate-500">
                    ({(grouped.get(rid) ?? []).length})
                  </span>
                </h3>
                {gridForRegion(rid)}
              </div>
            ))
          ) : (
            gridForRegion(regionScope)
          )}
        </div>
      )}

      {/* Mobile: horizontal chips + accordion by region */}
      {filtered.length > 0 && (
        <div className="md:hidden space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin -mx-1 px-1">
            <button
              type="button"
              onClick={() => onSelectMountain(null)}
              className={`snap-start shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                selectedMountainId === null
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              All · {instructorsTotal}
            </button>
            {filtered.map((m) => {
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
                  onClick={() => onSelectMountain(selectedMountainId === m.id ? null : m.id)}
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

          <div className="space-y-6">
            {regionsWithResorts.map((rid) => (
              <details key={rid} className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 open:shadow-md">
                <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-slate-900 dark:text-white flex justify-between items-center">
                  {MOUNTAIN_REGION_LABELS[rid]}
                  <span className="text-sm font-normal text-slate-500">{(grouped.get(rid) ?? []).length} resorts</span>
                </summary>
                <div className="px-4 pb-4 pt-0 space-y-3">{gridForRegion(rid)}</div>
              </details>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
