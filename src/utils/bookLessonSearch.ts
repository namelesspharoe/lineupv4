/**
 * Home / AI flows pass long natural-language prompts via `?q=`. Those should narrow
 * AI recommendations, not hide most of the instructor directory (substring match).
 */
const MAX_DIRECTORY_SEARCH_CHARS = 64;
const MAX_DIRECTORY_SEARCH_WORDS = 6;

export function isDirectoryKeywordSearch(query: string): boolean {
  const q = query.trim();
  if (!q) return false;
  const words = q.split(/\s+/).filter(Boolean);
  if (q.length > MAX_DIRECTORY_SEARCH_CHARS) return false;
  if (words.length > MAX_DIRECTORY_SEARCH_WORDS) return false;
  return true;
}

/** Lowercase needle for directory grid, or null when text should not filter the grid. */
export function directoryGridSearchNeedle(query: string): string | null {
  const q = query.trim();
  if (!q) return null;
  if (!isDirectoryKeywordSearch(query)) return null;
  return q.toLowerCase();
}

export function directorySearchIsPromptOnly(query: string): boolean {
  return query.trim().length > 0 && !isDirectoryKeywordSearch(query);
}
