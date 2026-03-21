import type { LessonSport } from '../types';

const EMOJI: Record<LessonSport, string> = {
  skiing: '⛷️',
  snowboarding: '🏂'
};

const BG: Record<LessonSport, string> = {
  skiing: '#e0f2fe',
  snowboarding: '#eef2ff'
};

/**
 * Rounded SVG as a data URL so existing `<img src={user.avatar}>` keeps working.
 */
export function disciplineAvatarDataUrl(discipline: LessonSport): string {
  const emoji = EMOJI[discipline];
  const bg = BG[discipline];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="${bg}"/><text x="48" y="54" font-size="42" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,Segoe UI Emoji,Apple Color Emoji,sans-serif">${emoji}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
