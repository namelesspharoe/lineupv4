import type { ReactNode } from 'react';

type ResponsiveModalPanelProps = {
  onClose: () => void;
  children: ReactNode;
  /** Tailwind max-width on sm+ (default max-w-2xl) */
  maxWidthClass?: string;
  /** Optional id for aria-labelledby */
  labelledBy?: string;
};

/**
 * Mobile: bottom-anchored sheet with rounded top, safe-area padding, internal scroll.
 * sm+: centered card with max height and standard shadow.
 */
export function ResponsiveModalPanel({
  onClose,
  children,
  maxWidthClass = 'sm:max-w-2xl',
  labelledBy
}: ResponsiveModalPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:justify-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 dark:bg-black/65"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`relative z-10 flex max-h-[min(96dvh,100%)] w-full flex-col overflow-hidden rounded-t-2xl border-x border-t border-gray-200 bg-white pb-[max(0px,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(0,0,0,0.15)] dark:border-gray-700 dark:bg-gray-900 dark:shadow-[0_-12px_40px_rgba(0,0,0,0.45)] sm:max-h-[min(90dvh,56rem)] sm:rounded-xl sm:border sm:shadow-xl ${maxWidthClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
