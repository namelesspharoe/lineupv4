# Achievements System

## Overview

The achievements system provides gamification features to encourage student engagement and track progress in the skiing/snowboarding learning platform. Students can unlock achievements by completing various milestones and activities.

## Features

### Core Components

1. **Achievement Service** (`src/services/achievements.ts`)
   - Manages achievement definitions and logic
   - Handles achievement checking and awarding
   - Provides statistics and progress tracking

2. **Achievements Component** (`src/components/gamification/Achievements.tsx`)
   - Main UI for displaying achievements
   - Grid layout with filtering and search
   - Achievement cards with unlock status

3. **Achievement Notifications** (`src/components/gamification/AchievementNotification.tsx`)
   - Toast notifications for newly unlocked achievements
   - Animated notifications with auto-dismiss

4. **Achievement Hooks** (`src/hooks/useAchievements.ts`)
   - Custom hooks for managing achievement state
   - Integration with existing progress system

### Achievement Categories

- **Milestone**: Based on lesson completion counts
- **Skill**: Based on skill level progression
- **Social**: Based on feedback and interactions
- **Streak**: Based on consecutive activity days

### Achievement Rarities

- **Common**: Basic achievements (10-50 points)
- **Rare**: Intermediate achievements (75-100 points)
- **Epic**: Advanced achievements (150-250 points)
- **Legendary**: Master achievements (300-500 points)

## Current Achievements

### Milestone Achievements
- 🎿 Welcome to SlopesMaster! (0 lessons)
- 🎯 First Steps (1 lesson)
- ⛷️ Getting the Hang of It (5 lessons)
- 🏂 Dedicated Learner (10 lessons)
- 🏔️ Seasoned Skier (25 lessons)
- 👑 Mountain Master (50 lessons)

### Skill Achievements
- 🔄 Turn Developer (developing turns level)
- 🔗 Turn Linker (linking turns level)
- 💪 Confident Carver (confident turns level)
- 🏆 Blue Run Champion (consistent blue runs level)

### Rating Achievements
- ⭐ Perfect Performance (5-star rating)
- 🌟 High Achiever (4.5+ average rating)

### Social Achievements
- 📝 First Feedback (first instructor feedback)
- 📚 Feedback Collector (10 feedbacks)

### Streak Achievements
- 🔥 Weekend Warrior (3 consecutive days)
- 🔥🔥 Week Warrior (7 consecutive days)

## Usage

### For Students

1. Navigate to the Achievements page via the navigation menu
2. View unlocked and locked achievements
3. Filter by category, rarity, or search by name
4. Click on achievements to see detailed information
5. Receive notifications when new achievements are unlocked

### For Developers

#### Adding New Achievements

1. Add achievement definition to `ACHIEVEMENT_DEFINITIONS` in `src/services/achievements.ts`:

```typescript
{
  id: 'unique_achievement_id',
  name: 'Achievement Name',
  description: 'Achievement description',
  icon: '🎯',
  category: 'milestone', // 'skill' | 'milestone' | 'social' | 'streak'
  criteria: {
    type: 'lessons_completed', // 'lessons_completed' | 'skill_level' | 'rating_achieved' | 'streak_days' | 'feedback_count'
    value: 10,
    condition: 'eq' // 'gte' | 'eq' | 'lte'
  },
  rarity: 'rare', // 'common' | 'rare' | 'epic' | 'legendary'
  points: 100
}
```

#### Checking Achievements

The system automatically checks for new achievements when:
- Lessons are completed
- Progress is updated
- The dashboard loads

You can manually trigger achievement checking:

```typescript
import { achievementService } from '../services/achievements';

const newAchievements = await achievementService.checkAndAwardAchievements(studentId);
```

#### Integration with Progress System

Achievements are integrated with the existing progress tracking system. When students complete lessons or receive feedback, the achievement system automatically checks if new achievements should be awarded.

## Database Schema

### Achievements Collection

```typescript
{
  id: string;
  studentId: string;
  name: string;
  description: string;
  icon: string;
  unlockedDate: string;
  category: 'skill' | 'milestone' | 'social' | 'streak';
}
```

## Future Enhancements

### Planned Features

1. **Achievement Progress Tracking**
   - Show progress bars for locked achievements
   - Display current progress towards unlocking

2. **Achievement Rewards**
   - Points system for unlocking achievements
   - Badges and profile customization
   - Leaderboards

3. **Custom Achievements**
   - Instructor-created achievements
   - Personalized milestone tracking

4. **Achievement Sharing**
   - Social media integration
   - Achievement showcase

5. **Seasonal Achievements**
   - Time-limited achievements
   - Seasonal challenges

### Technical Improvements

1. **Performance Optimization**
   - Caching achievement data
   - Batch achievement checking
   - Optimized database queries

2. **Analytics Integration**
   - Achievement unlock analytics
   - Engagement metrics
   - Progress correlation

3. **Mobile Optimization**
   - Touch-friendly achievement cards
   - Swipe gestures
   - Mobile notifications

## Testing

### Manual Testing

1. Create a student account
2. Complete lessons to trigger milestone achievements
3. Receive feedback to trigger social achievements
4. Check achievement notifications appear
5. Verify achievement page displays correctly

### Automated Testing

Run the achievement seeding script to create test data:

```bash
node scripts/seed-achievements.js
```

## Troubleshooting

### Common Issues

1. **Achievements not unlocking**
   - Check achievement criteria logic
   - Verify student progress data
   - Check database permissions

2. **Notifications not appearing**
   - Verify notification component is mounted
   - Check achievement service errors
   - Validate achievement data structure

3. **Performance issues**
   - Optimize achievement checking frequency
   - Implement caching for achievement data
   - Use pagination for large achievement lists

## Contributing

When adding new achievements or modifying the system:

1. Follow the existing code structure
2. Add appropriate TypeScript types
3. Include error handling
4. Update documentation
5. Test thoroughly
6. Consider performance implications

## Support

For questions or issues with the achievements system, please refer to:
- Achievement service documentation
- Component prop interfaces
- Database schema documentation
- Testing guidelines
