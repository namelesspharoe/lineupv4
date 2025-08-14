# Firebase Indexes for Profile Components

This document outlines the Firebase Firestore indexes that may be needed for the profile components to function optimally.

## Current Implementation

The profile components have been updated to use simplified queries that avoid complex composite indexes. This approach:

1. **Reduces Firebase index requirements**
2. **Improves performance** by filtering data in memory
3. **Eliminates index creation errors** during development

## Profile Component Queries

### InstructorProfile
- **Query**: `lessons` collection filtered by `instructorId`
- **Filtering**: Completed lessons filtered in memory
- **No complex indexes required**

### StudentProfile  
- **Query**: `lessons` collection filtered by `studentIds` (array-contains)
- **Query**: `achievements` collection filtered by `studentId`
- **Sorting**: Achievements sorted in memory by `unlockedDate`
- **No complex indexes required**

### AdminProfile
- **Queries**: Simple collection queries for system stats
- **No complex indexes required**

## Optional Indexes (for Performance)

If you want to optimize performance with larger datasets, you can create these indexes:

### Lessons Collection
```json
{
  "collectionGroup": "lessons",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "instructorId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "date", "order": "DESCENDING" }
  ]
}
```

```json
{
  "collectionGroup": "lessons", 
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "studentIds", "arrayConfig": "CONTAINS" },
    { "fieldPath": "date", "order": "DESCENDING" }
  ]
}
```

### Achievements Collection
```json
{
  "collectionGroup": "achievements",
  "queryScope": "COLLECTION", 
  "fields": [
    { "fieldPath": "studentId", "order": "ASCENDING" },
    { "fieldPath": "unlockedDate", "order": "DESCENDING" }
  ]
}
```

## Benefits of Current Approach

1. **Faster Development**: No need to wait for index creation
2. **Reduced Costs**: Fewer indexes mean lower Firebase costs
3. **Simpler Maintenance**: Less complex query management
4. **Better Error Handling**: Graceful fallbacks when data is missing

## When to Add Indexes

Consider adding the optional indexes above if:
- You have more than 1000 lessons per instructor/student
- Query performance becomes noticeably slow
- You want to optimize for production scale

## Index Creation

To create indexes, use the Firebase Console:
1. Go to Firestore Database
2. Click on "Indexes" tab
3. Click "Create Index"
4. Follow the prompts to add the desired indexes
