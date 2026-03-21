import { useEffect, useRef, type ReactNode } from 'react';
import {
  acquireBodyScrollLock,
  focusFirstFocusable,
  registerEscapeToClose
} from '../../utils/dialogOverlay';

type ResponsiveModalPanelProps = {
  onClose: () => void;
  children: ReactNode;
  /** Tailwind max-width on sm+ (default max-w-2xl) */
  maxWidthClass?: string;
  /** Optional id for aria-labelledby */
  labelledBy?: string;
  /** When set, used as aria-label instead of labelledBy (e.g. login sheet with no visible title). */
  ariaLabel?: string;
  /** Use when this dialog stacks on another (e.g. UnifiedLesson over CreateLesson). */
  nested?: boolean;
};

/**
 * Mobile: bottom-anchored sheet with rounded top, safe-area padding, internal scroll.
 * sm+: centered card with max height and standard shadow.
 *
 * Escape closes the topmost stacked dialog; body scroll is ref-counted; focus moves into the panel and restores on close.
 */
export function ResponsiveModalPanel({
  onClose,
  children,
  maxWidthClass = 'sm:max-w-2xl',
  labelledBy,
  ariaLabel,
  nested = false
}: ResponsiveModalPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const rootZ = nested ? 'z-dialog-nested' : 'z-dialog';

  useEffect(() => {
    const unregisterEscape = registerEscapeToClose(onClose);
    const releaseScroll = acquireBodyScrollLock();
    const previousFocus = document.activeElement as HTMLElement | null;

    const id = requestAnimationFrame(() => {
      focusFirstFocusable(panelRef.current);
    });

    return () => {
      cancelAnimationFrame(id);
      unregisterEscape();
      releaseScroll();
      if (previousFocus?.focus) {
        previousFocus.focus();
      }
    };
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 ${rootZ} flex items-end justify-center motion-reduce:transition-none sm:items-center sm:justify-center sm:p-4`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 dark:bg-black/65"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabel ? undefined : labelledBy}
        aria-label={ariaLabel}
        className={`relative z-10 flex max-h-[min(96dvh,100%)] w-full flex-col overflow-hidden rounded-t-2xl border-x border-t border-gray-200 bg-white pb-[max(0px,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(0,0,0,0.15)] outline-none dark:border-gray-700 dark:bg-gray-900 dark:shadow-[0_-12px_40px_rgba(0,0,0,0.45)] sm:max-h-[min(90dvh,56rem)] sm:rounded-xl sm:border sm:shadow-xl motion-reduce:transition-none ${maxWidthClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
