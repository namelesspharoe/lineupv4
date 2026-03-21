/**
 * Stacking order (low → high). Use Tailwind tokens: z-nav-backdrop, z-nav-drawer, z-dialog, z-dialog-nested.
 *
 * - nav-backdrop (40): dimmed area behind mobile nav drawer
 * - nav-drawer (50): slide-out mobile menu panel
 * - dialog (60): primary modal / ResponsiveModalPanel
 * - dialog-nested (70): second modal on top (e.g. UnifiedLesson over CreateLesson)
 */
export const Z_INDEX = {
  navBackdrop: 40,
  navDrawer: 50,
  dialog: 60,
  dialogNested: 70
} as const;
