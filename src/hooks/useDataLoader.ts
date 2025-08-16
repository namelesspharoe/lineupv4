import { useState, useEffect, useCallback, useRef } from 'react';

interface DataLoaderOptions<T> {
  loadFn: () => Promise<T>;
  dependencies?: any[];
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  refetchOnMount?: boolean;
}

interface DataLoaderState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isRefetching: boolean;
}

export function useDataLoader<T>({
  loadFn,
  dependencies = [],
  enabled = true,
  onSuccess,
  onError,
  refetchOnMount = true
}: DataLoaderOptions<T>) {
  const [state, setState] = useState<DataLoaderState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isRefetching: false
  });

  const isMountedRef = useRef(true);
  const lastLoadTimeRef = useRef<number>(0);

  const loadData = useCallback(async (isRefetch = false) => {
    if (!enabled) return;

    const now = Date.now();
    if (now - lastLoadTimeRef.current < 100) {
      // Prevent rapid successive calls
      return;
    }
    lastLoadTimeRef.current = now;

    setState(prev => ({
      ...prev,
      isLoading: !isRefetch,
      isRefetching: isRefetch,
      error: null
    }));

    try {
      const data = await loadFn();
      
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          data,
          isLoading: false,
          isRefetching: false,
          error: null
        }));
        
        onSuccess?.(data);
      }
    } catch (error) {
      if (isMountedRef.current) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setState(prev => ({
          ...prev,
          isLoading: false,
          isRefetching: false,
          error: errorObj
        }));
        
        onError?.(errorObj);
      }
    }
  }, [loadFn, enabled, onSuccess, onError]);

  const refetch = useCallback(() => {
    loadData(true);
  }, [loadData]);

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null,
      isRefetching: false
    });
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (refetchOnMount) {
      loadData();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [loadData, refetchOnMount]);

  useEffect(() => {
    if (enabled && refetchOnMount) {
      loadData();
    }
  }, dependencies);

  return {
    ...state,
    refetch,
    reset
  };
}

// Specialized hooks for common data loading patterns
export function useInstructorData(instructorId: string) {
  return useDataLoader({
    loadFn: async () => {
      // Import here to avoid circular dependencies
      const { getUserById } = await import('../services/users');
      return getUserById(instructorId);
    },
    dependencies: [instructorId],
    enabled: !!instructorId
  });
}

export function useInstructorStats(instructorId: string) {
  return useDataLoader({
    loadFn: async () => {
      const { instructorStatsService } = await import('../services/instructorStats');
      return instructorStatsService.getInstructorStats(instructorId);
    },
    dependencies: [instructorId],
    enabled: !!instructorId
  });
}

export function useAvailabilityData(instructorId: string) {
  return useDataLoader({
    loadFn: async () => {
      const { getAvailabilityByInstructorId } = await import('../services/availability');
      return getAvailabilityByInstructorId(instructorId);
    },
    dependencies: [instructorId],
    enabled: !!instructorId
  });
}

export function useStudentLessons(studentId: string) {
  return useDataLoader({
    loadFn: async () => {
      const { getStudentLessons } = await import('../services/lessons');
      return getStudentLessons(studentId);
    },
    dependencies: [studentId],
    enabled: !!studentId
  });
}

export function useInstructorLessons(instructorId: string) {
  return useDataLoader({
    loadFn: async () => {
      const { getInstructorLessons } = await import('../services/lessons');
      return getInstructorLessons(instructorId);
    },
    dependencies: [instructorId],
    enabled: !!instructorId
  });
}

export function useMessages(userId: string) {
  return useDataLoader({
    loadFn: async () => {
      const { loadMessagesFallback } = await import('../services/messages');
      return loadMessagesFallback(userId);
    },
    dependencies: [userId],
    enabled: !!userId
  });
}

export function useAchievements(userId: string) {
  return useDataLoader({
    loadFn: async () => {
      const { achievementService } = await import('../services/achievements');
      return achievementService.getAllAchievements(userId);
    },
    dependencies: [userId],
    enabled: !!userId
  });
}
