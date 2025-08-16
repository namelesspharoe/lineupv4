import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

interface UseUrlStateOptions {
  replace?: boolean;
  scrollToTop?: boolean;
}

export function useUrlState<T extends Record<string, any>>(
  initialState: T,
  options: UseUrlStateOptions = {}
) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<T>(() => {
    // Initialize state from URL params
    const urlState: Partial<T> = {};
    for (const [key, value] of searchParams.entries()) {
      if (key in initialState) {
        try {
          // Try to parse JSON values, fallback to string
          urlState[key as keyof T] = JSON.parse(value);
        } catch {
          urlState[key as keyof T] = value as T[keyof T];
        }
      }
    }
    return { ...initialState, ...urlState };
  });

  const updateState = useCallback(
    (newState: Partial<T> | ((prev: T) => Partial<T>)) => {
      setState(prev => {
        const updatedState = typeof newState === 'function' ? newState(prev) : newState;
        const finalState = { ...prev, ...updatedState };

        // Update URL params
        const newSearchParams = new URLSearchParams(searchParams);
        
        Object.entries(finalState).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (typeof value === 'object') {
              newSearchParams.set(key, JSON.stringify(value));
            } else {
              newSearchParams.set(key, String(value));
            }
          } else {
            newSearchParams.delete(key);
          }
        });

        setSearchParams(newSearchParams, { replace: options.replace });
        
        if (options.scrollToTop) {
          window.scrollTo(0, 0);
        }

        return finalState;
      });
    },
    [searchParams, setSearchParams, options.replace, options.scrollToTop]
  );

  const resetState = useCallback(() => {
    setState(initialState);
    setSearchParams({}, { replace: options.replace });
  }, [initialState, setSearchParams, options.replace]);

  // Sync URL params with state when URL changes externally
  useEffect(() => {
    const urlState: Partial<T> = {};
    let hasChanges = false;

    for (const [key, value] of searchParams.entries()) {
      if (key in initialState) {
        try {
          const parsedValue = JSON.parse(value);
          if (state[key as keyof T] !== parsedValue) {
            urlState[key as keyof T] = parsedValue;
            hasChanges = true;
          }
        } catch {
          if (state[key as keyof T] !== value) {
            urlState[key as keyof T] = value as T[keyof T];
            hasChanges = true;
          }
        }
      }
    }

    if (hasChanges) {
      setState(prev => ({ ...prev, ...urlState }));
    }
  }, [searchParams, initialState, state]);

  return [state, updateState, resetState] as const;
}

// Specialized hooks for common URL state patterns
export function usePaginationState(initialPage = 1, initialPageSize = 10) {
  return useUrlState(
    { page: initialPage, pageSize: initialPageSize },
    { replace: true }
  );
}

export function useFilterState<T extends Record<string, any>>(initialFilters: T) {
  return useUrlState(initialFilters, { replace: true });
}

export function useModalState(modalName: string) {
  const [state, updateState] = useUrlState(
    { [modalName]: false },
    { replace: true }
  );

  const isOpen = state[modalName as keyof typeof state] as boolean;
  
  const openModal = useCallback(() => {
    updateState({ [modalName]: true });
  }, [updateState, modalName]);

  const closeModal = useCallback(() => {
    updateState({ [modalName]: false });
  }, [updateState, modalName]);

  return [isOpen, openModal, closeModal] as const;
}

export function useTabState(tabName: string, defaultTab: string) {
  const [state, updateState] = useUrlState(
    { [tabName]: defaultTab },
    { replace: true }
  );

  const currentTab = state[tabName as keyof typeof state] as string;
  
  const setTab = useCallback((tab: string) => {
    updateState({ [tabName]: tab });
  }, [updateState, tabName]);

  return [currentTab, setTab] as const;
}

// Hook for managing URL-based navigation state
export function useNavigationState() {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateTo = useCallback((
    path: string,
    options: { replace?: boolean; state?: any; scrollToTop?: boolean } = {}
  ) => {
    navigate(path, { 
      replace: options.replace,
      state: options.state 
    });
    
    if (options.scrollToTop) {
      window.scrollTo(0, 0);
    }
  }, [navigate]);

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const goForward = useCallback(() => {
    navigate(1);
  }, [navigate]);

  const refresh = useCallback(() => {
    navigate(location.pathname + location.search, { replace: true });
  }, [navigate, location]);

  return {
    navigateTo,
    goBack,
    goForward,
    refresh,
    currentPath: location.pathname,
    currentSearch: location.search,
    currentState: location.state
  };
}
