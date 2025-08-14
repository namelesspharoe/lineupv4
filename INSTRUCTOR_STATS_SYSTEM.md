# Instructor Stats & Ranking System

## Overview

The instructor stats and ranking system provides comprehensive performance metrics for ski and snowboard instructors, including rankings, badges, and tier levels based on their teaching performance.

## Features

### Performance Score Calculation
The system calculates a performance score (0-100) based on multiple factors:

- **Average Rating (30%)**: Student review ratings
- **Experience (20%)**: Total lessons taught
- **Completion Rate (15%)**: Percentage of completed lessons
- **Repeat Student Rate (15%)**: Percentage of students who book again
- **Lesson Success Rate (10%)**: Percentage of lessons with 4+ star ratings
- **Response Time (10%)**: Average response time to student inquiries

### Tier System
Instructors are assigned tiers based on their performance score:

- **Diamond**: 90+ points
- **Platinum**: 80-89 points
- **Gold**: 70-79 points
- **Silver**: 60-69 points
- **Bronze**: Below 60 points

### Achievement Badges
Instructors earn badges based on various achievements:

#### Lesson Count Badges
- Lesson Master (1000+ lessons)
- Experienced Guide (500+ lessons)
- Dedicated Instructor (100+ lessons)

#### Rating Badges
- Excellence Award (4.8+ rating)
- High Performer (4.5+ rating)
- Quality Instructor (4.0+ rating)

#### Student Count Badges
- Student Favorite (500+ students)
- Popular Instructor (200+ students)
- Growing Following (50+ students)

#### Earnings Badges
- Top Earner ($50,000+)
- High Earner ($25,000+)
- Established ($10,000+)

#### Performance Badges
- Elite Instructor (90+ performance score)
- Premium Guide (80+ performance score)
- Professional (70+ performance score)

## Database Structure

### instructorStats Collection
```typescript
interface InstructorStats {
  totalLessons: number;
  averageRating: number;
  totalStudents: number;
  totalReviews: number;
  performanceScore: number;
  ranking: number;
  totalEarnings: number;
  completionRate: number;
  responseTime: number;
  repeatStudentRate: number;
  lessonSuccessRate: number;
  seasonalStats: {
    currentSeason: { lessons: number; earnings: number; rating: number; };
    previousSeason: { lessons: number; earnings: number; rating: number; };
  };
  badges: string[];
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  lastUpdated: string;
}
```

## Usage

### Seeding Initial Data
To populate instructor stats with initial data:

```bash
npm run seed-instructor-stats
```

### Updating Stats
Stats are automatically updated when:
- A lesson is completed
- A student review is added
- Instructor performance changes

### Manual Recalculation
To recalculate stats for an instructor:

```typescript
import { instructorStatsService } from './services/instructorStats';

// Recalculate stats for an instructor
await instructorStatsService.recalculateInstructorStats(instructorId, lessons);
```

## Components

### InstructorProfileModal
Displays enhanced instructor stats including:
- Performance score and ranking
- Tier badges
- Achievement badges
- Detailed metrics

### InstructorRankings
Shows top-ranked instructors with:
- Rank positions
- Performance scores
- Tier indicators
- Rank change indicators

### InstructorStatsFallback
Shows estimated stats when enhanced data isn't available yet.

## API Methods

### instructorStatsService

#### getInstructorStats(instructorId: string)
Retrieves instructor stats from the database.

#### getTopInstructors(limit: number)
Gets top-ranked instructors ordered by performance score.

#### updateStatsOnLessonCompletion(lesson: Lesson)
Updates stats when a lesson is completed.

#### updateStatsOnReviewAdded(instructorId: string, review: StudentReview)
Updates stats when a review is added.

#### calculateInstructorBadges(instructorId: string)
Calculates and returns achievement badges for an instructor.

#### recalculateInstructorStats(instructorId: string, lessons: Lesson[])
Recalculates all stats for an instructor (useful for data migration).

## Firestore Rules

The system requires the following Firestore rules:

```javascript
// Allow authenticated users to read/write instructor stats
match /instructorStats/{instructorId} {
  allow read, write: if request.auth != null;
}
```

## Future Enhancements

- Real-time ranking updates
- Seasonal performance tracking
- Advanced analytics dashboard
- Performance trend analysis
- Automated badge notifications
- Instructor performance reports
