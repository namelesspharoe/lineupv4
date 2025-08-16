# React Router Restructure & Component Organization

## Overview

This document outlines the comprehensive restructuring of the React application to use React Router more effectively and eliminate most `useEffect` patterns for data fetching and side effects.

## Key Changes

### 1. Centralized Routing (`src/routes/index.tsx`)

**Before**: All routing logic was in `App.tsx` with complex conditional rendering
**After**: Clean, centralized routing with lazy loading and proper separation of concerns

```typescript
// New structure uses createBrowserRouter with lazy loading
const router = createBrowserRouter([
  {
    path: '/',
    element: <HomeRoute />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardRoute />
      </ProtectedRoute>
    ),
  },
  // ... more routes
]);
```

**Benefits**:
- Lazy loading for better performance
- Clear separation of protected vs public routes
- Role-based access control
- Easier testing and maintenance

### 2. Custom Data Loading Hooks (`src/hooks/useDataLoader.ts`)

**Before**: Components used `useEffect` for data fetching
**After**: Reusable hooks that handle loading states, errors, and caching

```typescript
// Before: useEffect pattern
useEffect(() => {
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchData();
      setData(data);
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };
  loadData();
}, [dependencies]);

// After: Custom hook
const { data, isLoading, error, refetch } = useInstructorData(instructorId);
```

**Benefits**:
- Consistent loading states across components
- Built-in error handling
- Automatic cleanup and memory leak prevention
- Reusable across components
- Easier testing

### 3. URL State Management (`src/hooks/useUrlState.ts`)

**Before**: Manual URL parameter handling with `useEffect`
**After**: Declarative URL state management

```typescript
// Before: Manual URL handling
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const page = parseInt(params.get('page') || '1');
  setCurrentPage(page);
}, []);

// After: Declarative URL state
const [pagination, updatePagination] = usePaginationState(1, 10);
```

**Benefits**:
- URL state is always in sync with component state
- Browser back/forward navigation works automatically
- Shareable URLs with state
- No manual URL manipulation

### 4. Feature-Based Component Organization

**Before**: Components scattered across ambiguous directories
**After**: Logical grouping by feature with clear exports

```
src/components/
├── features/           # Central export point
├── dashboard/          # Dashboard-specific components
├── messages/           # Messaging system
├── lessons/            # Lesson management
├── instructor/         # Instructor features
├── calendar/           # Calendar & availability
├── booking/            # Booking system
├── profile/            # Profile management
├── common/             # Shared UI components
└── ...
```

**Benefits**:
- Easy to find related components
- Clear separation of concerns
- Better maintainability
- Reduced import complexity

## Migration Guide

### Step 1: Replace useEffect Data Fetching

**Old Pattern**:
```typescript
function InstructorDashboard({ user }) {
  const [availability, setAvailability] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAvailability = async () => {
      try {
        setIsLoading(true);
        const slots = await getAvailabilityByInstructorId(user.id);
        setAvailability(slots);
      } catch (error) {
        console.error('Error loading availability:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailability();
  }, [user.id]);

  // ... rest of component
}
```

**New Pattern**:
```typescript
function InstructorDashboard({ user }) {
  const { data: availability, isLoading, error, refetch } = useAvailabilityData(user.id);

  // ... rest of component
}
```

### Step 2: Replace URL Parameter Handling

**Old Pattern**:
```typescript
function InstructorGrid() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = parseInt(params.get('page') || '1');
    const filterStr = params.get('filters');
    
    setCurrentPage(page);
    if (filterStr) {
      setFilters(JSON.parse(filterStr));
    }
  }, []);

  const updatePage = (page) => {
    setCurrentPage(page);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('page', page.toString());
    window.history.replaceState({}, '', newUrl.toString());
  };
}
```

**New Pattern**:
```typescript
function InstructorGrid() {
  const [pagination, updatePagination] = usePaginationState(1, 10);
  const [filters, updateFilters] = useFilterState({});

  const updatePage = (page) => {
    updatePagination({ page });
  };
}
```

### Step 3: Replace Modal State Management

**Old Pattern**:
```typescript
function InstructorProfile() {
  const [showBooking, setShowBooking] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // ... component logic
}
```

**New Pattern**:
```typescript
function InstructorProfile() {
  const [isBookingOpen, openBooking, closeBooking] = useModalState('booking');
  const [isCalendarOpen, openCalendar, closeCalendar] = useModalState('calendar');

  // ... component logic
}
```

## Available Custom Hooks

### Data Loading Hooks
- `useDataLoader<T>()` - Generic data loading hook
- `useInstructorData(instructorId)` - Load instructor profile data
- `useInstructorStats(instructorId)` - Load instructor statistics
- `useAvailabilityData(instructorId)` - Load availability data
- `useStudentLessons(studentId)` - Load student lessons
- `useInstructorLessons(instructorId)` - Load instructor lessons
- `useMessages(userId)` - Load user messages
- `useAchievements(userId)` - Load user achievements

### URL State Hooks
- `useUrlState<T>()` - Generic URL state management
- `usePaginationState()` - Pagination state with URL sync
- `useFilterState()` - Filter state with URL sync
- `useModalState()` - Modal state with URL sync
- `useTabState()` - Tab state with URL sync
- `useNavigationState()` - Navigation utilities

## Best Practices

### 1. Component Structure
```typescript
function MyComponent() {
  // 1. Custom hooks for data and state
  const { data, isLoading, error } = useMyData();
  const [state, updateState] = useUrlState(initialState);

  // 2. Event handlers
  const handleAction = useCallback(() => {
    // Action logic
  }, [dependencies]);

  // 3. Render logic
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### 2. Error Handling
```typescript
const { data, error, refetch } = useDataLoader({
  loadFn: fetchData,
  onError: (error) => {
    // Custom error handling
    console.error('Failed to load data:', error);
  }
});
```

### 3. Loading States
```typescript
const { data, isLoading, isRefetching } = useDataLoader({
  loadFn: fetchData
});

// Show different loading states
if (isLoading) return <FullPageSpinner />;
if (isRefetching) return <RefetchSpinner />;
```

## Performance Benefits

1. **Lazy Loading**: Components are loaded only when needed
2. **Reduced Re-renders**: Custom hooks prevent unnecessary re-renders
3. **Memory Management**: Automatic cleanup prevents memory leaks
4. **Caching**: Data loading hooks can implement caching strategies
5. **Bundle Splitting**: Route-based code splitting reduces initial bundle size

## Testing Benefits

1. **Easier Unit Testing**: Custom hooks can be tested in isolation
2. **Mock Data**: Data loading hooks can be easily mocked
3. **URL Testing**: URL state can be tested independently
4. **Component Isolation**: Components are more focused and testable

## Migration Checklist

- [ ] Replace `useEffect` data fetching with custom hooks
- [ ] Replace manual URL handling with `useUrlState`
- [ ] Replace modal state with `useModalState`
- [ ] Update component imports to use feature-based exports
- [ ] Remove unused `useEffect` dependencies
- [ ] Test all routes and navigation
- [ ] Verify lazy loading works correctly
- [ ] Check error handling and loading states
- [ ] Update tests to use new patterns

## Future Enhancements

1. **React Query Integration**: Consider integrating React Query for advanced caching
2. **Suspense Boundaries**: Add more granular Suspense boundaries
3. **Error Boundaries**: Implement route-specific error boundaries
4. **Analytics**: Add route-based analytics tracking
5. **PWA Support**: Implement service worker for offline support
