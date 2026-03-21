import type { Mountain, MountainRegionId, SkiPassType } from '../types';
import { sortMountainsForStudentBrowse } from '../services/mountains';

/** Display labels for `Mountain.regionId` (Firestore stores id only). */
export const MOUNTAIN_REGION_LABELS: Record<MountainRegionId, string> = {
  usa_rockies: 'US Rockies',
  usa_pnw: 'Pacific Northwest',
  usa_northeast: 'US Northeast',
  usa_southwest: 'US Southwest',
  usa_other: 'US — Other',
  canada: 'Canada',
  international: 'International',
  other: 'Other'
};

/** Tab / section order for grouping. */
export const MOUNTAIN_REGION_ORDER: MountainRegionId[] = [
  'usa_rockies',
  'usa_pnw',
  'usa_northeast',
  'usa_southwest',
  'usa_other',
  'canada',
  'international',
  'other'
];

export type PassBrowseFilter = 'all' | 'ikon' | 'epic' | 'unlisted';

export function effectiveMountainRegionId(m: Mountain): MountainRegionId {
  const id = m.regionId ?? 'other';
  if (id in MOUNTAIN_REGION_LABELS) return id as MountainRegionId;
  return 'other';
}

/**
 * Browse filter: all | ikon | epic | unlisted (no pass tags).
 * Mountains with both Ikon and Epic match both ikon and epic filters.
 */
export function filterMountainsByPass(
  mountains: Mountain[],
  filter: PassBrowseFilter
): Mountain[] {
  if (filter === 'all') return mountains;
  return mountains.filter((m) => {
    const passes = m.passAffiliations ?? [];
    if (filter === 'unlisted') return passes.length === 0;
    if (filter === 'ikon') return passes.includes('ikon');
    if (filter === 'epic') return passes.includes('epic');
    return true;
  });
}

export function filterMountainsBySearch(mountains: Mountain[], query: string): Mountain[] {
  const q = query.trim().toLowerCase();
  if (!q) return mountains;
  return mountains.filter((m) => {
    const name = m.name.toLowerCase();
    const loc = (m.location || '').toLowerCase();
    const desc = (m.description || '').toLowerCase();
    return name.includes(q) || loc.includes(q) || desc.includes(q);
  });
}

/** Group by region; within each region, snow sort (deepest base first). */
export function groupMountainsByRegion(mountains: Mountain[]): Map<MountainRegionId, Mountain[]> {
  const map = new Map<MountainRegionId, Mountain[]>();
  for (const id of MOUNTAIN_REGION_ORDER) {
    map.set(id, []);
  }
  for (const m of mountains) {
    const rid = effectiveMountainRegionId(m);
    const list = map.get(rid) ?? map.get('other')!;
    list.push(m);
  }
  for (const id of MOUNTAIN_REGION_ORDER) {
    const list = map.get(id);
    if (list?.length) {
      map.set(id, sortMountainsForStudentBrowse(list));
    }
  }
  return map;
}

/** Default Book Lesson pass filter from student profile. */
export function passFilterFromStudentSkiPass(skiPass: SkiPassType | undefined): PassBrowseFilter {
  switch (skiPass) {
    case 'ikon':
      return 'ikon';
    case 'epic':
      return 'epic';
    case 'both':
      return 'all';
    case 'independent':
      return 'unlisted';
    case 'none':
    default:
      return 'all';
  }
}
