/** Stack of Escape handlers — only the topmost dialog receives Escape. */
const escapeStack: Array<() => void> = [];
let escapeListenerAttached = false;

function onDocumentKeyDown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || escapeStack.length === 0) return;
  e.preventDefault();
  escapeStack[escapeStack.length - 1]();
}

function ensureEscapeListener() {
  if (escapeListenerAttached) return;
  escapeListenerAttached = true;
  document.addEventListener('keydown', onDocumentKeyDown);
}

/**
 * Register this dialog as the current Escape target (LIFO).
 * @returns cleanup — call on unmount
 */
export function registerEscapeToClose(onClose: () => void): () => void {
  ensureEscapeListener();
  escapeStack.push(onClose);
  return () => {
    const i = escapeStack.lastIndexOf(onClose);
    if (i >= 0) escapeStack.splice(i, 1);
  };
}

let bodyLockCount = 0;
let savedBodyOverflow = '';
let savedBodyPaddingRight = '';

function lockBodyScroll() {
  if (bodyLockCount === 0) {
    savedBodyOverflow = document.body.style.overflow;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbar > 0) {
      savedBodyPaddingRight = document.body.style.paddingRight;
      document.body.style.paddingRight = `${scrollbar}px`;
    }
    document.body.style.overflow = 'hidden';
  }
  bodyLockCount += 1;
}

function unlockBodyScroll() {
  bodyLockCount = Math.max(0, bodyLockCount - 1);
  if (bodyLockCount === 0) {
    document.body.style.overflow = savedBodyOverflow;
    document.body.style.paddingRight = savedBodyPaddingRight;
    savedBodyOverflow = '';
    savedBodyPaddingRight = '';
  }
}

/** Ref-counted body scroll lock for stacked modals. Call the returned function on unmount. */
export function acquireBodyScrollLock(): () => void {
  lockBodyScroll();
  return unlockBodyScroll;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function focusFirstFocusable(container: HTMLElement | null) {
  if (!container) return;
  const el = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
  if (el) {
    el.focus();
    return;
  }
  if (!container.hasAttribute('tabindex')) {
    container.setAttribute('tabindex', '-1');
  }
  container.focus();
}
