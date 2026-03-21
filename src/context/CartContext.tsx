import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo
} from 'react';
import { useAuth } from './AuthContext';
import type { CartLineItem, LessonBookingDraft } from '../types/cart';

const STORAGE_PREFIX = 'slopesmaster_cart_';

interface CartContextType {
  items: CartLineItem[];
  addItem: (draft: LessonBookingDraft, meta?: { instructorName?: string }) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const storageKey =
    user?.role === 'student' && user?.id ? `${STORAGE_PREFIX}${user.id}` : null;

  useEffect(() => {
    if (!storageKey) {
      setItems([]);
      setHydrated(true);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLineItem[];
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || !hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, storageKey, hydrated]);

  const addItem = useCallback(
    (draft: LessonBookingDraft, meta?: { instructorName?: string }) => {
      if (user?.role !== 'student') return;
      const id = crypto.randomUUID();
      setItems((prev) => [
        ...prev,
        { id, draft, instructorName: meta?.instructorName }
      ]);
    },
    [user?.role]
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      clear,
      itemCount: items.length
    }),
    [items, addItem, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
