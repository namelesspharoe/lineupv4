import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import type { Mountain } from '../../../../types';

export interface AdminLocationFilterProps {
  mountains: Mountain[];
  /** `null` = all locations */
  selectedMountainId: string | null;
  onSelectedMountainIdChange: (id: string | null) => void;
}

export function AdminLocationFilter({
  mountains,
  selectedMountainId,
  onSelectedMountainIdChange
}: AdminLocationFilterProps) {
  const sorted = useMemo(
    () => [...mountains].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [mountains]
  );

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <MapPin className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
        <span className="font-medium text-gray-900 dark:text-white">Location</span>
        <span className="hidden text-gray-500 sm:inline dark:text-gray-500">
          Filter instructors and lessons by resort.
        </span>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md sm:flex-initial">
        <label htmlFor="admin-dashboard-mountain-filter" className="sr-only">
          Mountain
        </label>
        <select
          id="admin-dashboard-mountain-filter"
          value={selectedMountainId ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            onSelectedMountainIdChange(v === '' ? null : v);
          }}
          className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">All mountains</option>
          {sorted.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.location ? ` — ${m.location}` : ''}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
