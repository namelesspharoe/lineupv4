import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  setDoc, 
  doc,
  serverTimestamp,
  query, 
  where, 
  getDocs,
  orderBy, 
  limit 
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword 
} from 'firebase/auth';

// Load environment variables from .env file
config();

// Your Firebase config - using environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'welcome_to_slopes',
    name: 'Welcome to SlopesMaster!',
    description: 'Created your account and joined the community',
    icon: '🎿',
    category: 'milestone',
    criteria: { type: 'lessons_completed', value: 0, condition: 'eq' },
    rarity: 'common',
    points: 10
  },
  {
    id: 'first_lesson',
    name: 'First Steps',
    description: 'Completed your first lesson',
    icon: '🎯',
    category: 'milestone',
    criteria: { type: 'lessons_completed', value: 1, condition: 'eq' },
    rarity: 'common',
    points: 25
  },
  {
    id: 'five_lessons',
    name: 'Getting the Hang of It',
    description: 'Completed 5 lessons',
    icon: '⛷️',
    category: 'milestone',
    criteria: { type: 'lessons_completed', value: 5, condition: 'eq' },
    rarity: 'common',
    points: 50
  },
  {
    id: 'developing_turns',
    name: 'Turn Developer',
    description: 'Reached developing turns level',
    icon: '🔄',
    category: 'skill',
    criteria: { type: 'skill_level', value: 1, condition: 'eq' },
    rarity: 'common',
    points: 30
  },
  {
    id: 'first_feedback',
    name: 'First Feedback',
    description: 'Received your first instructor feedback',
    icon: '📝',
    category: 'social',
    criteria: { type: 'feedback_count', value: 1, condition: 'eq' },
    rarity: 'common',
    points: 20
  }
];

// Test data
const instructors = [
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@slopesmaster.com",
    password: "password123",
    role: "instructor",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
    bio: "Certified ski instructor with 8 years of experience. Specialized in teaching beginners and intermediate skiers.",
    specialties: ["Skiing", "Freestyle", "Backcountry"],
    certifications: ["PSIA Level 2", "Avalanche Safety", "First Aid"],
    languages: ["English", "Spanish"],
    yearsOfExperience: 8,
    hourlyRate: 85,
    preferredLocations: ["Whistler Blackcomb", "Vail"],
    qualifications: "PSIA Level 2 Certified, Avalanche Safety Certified"
  },
  {
    name: "Mike Chen",
    email: "mike.chen@slopesmaster.com",
    password: "password123",
    role: "instructor",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    bio: "Expert snowboard instructor passionate about teaching all skill levels. Former competitive snowboarder.",
    specialties: ["Snowboarding", "Terrain Park", "Racing"],
    certifications: ["AASI Level 3", "Terrain Park Safety", "CPR"],
    languages: ["English", "Mandarin"],
    yearsOfExperience: 12,
    hourlyRate: 95,
    preferredLocations: ["Whistler Blackcomb", "Park City"],
    qualifications: "AASI Level 3 Certified, Former Competitive Snowboarder"
  },
  {
    name: "Emma Rodriguez",
    email: "emma.rodriguez@slopesmaster.com",
    password: "password123",
    role: "instructor",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    bio: "Dedicated instructor specializing in children's lessons and family groups. Patient and encouraging teaching style.",
    specialties: ["Skiing", "Children's Lessons", "Family Groups"],
    certifications: ["PSIA Level 1", "Child Safety", "Teaching Children"],
    languages: ["English", "Spanish", "French"],
    yearsOfExperience: 5,
    hourlyRate: 75,
    preferredLocations: ["Whistler Blackcomb", "Aspen"],
    qualifications: "PSIA Level 1 Certified, Child Safety Specialist"
  }
];

const students = [
  {
    name: "Alex Thompson",
    email: "alex.thompson@email.com",
    password: "password123",
    role: "student",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    bio: "New to skiing, excited to learn the basics and progress to intermediate level.",
    level: "first_time",
    specialties: ["Skiing"]
  },
  {
    name: "Jessica Park",
    email: "jessica.park@email.com",
    password: "password123",
    role: "student",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    bio: "Intermediate snowboarder looking to improve technique and learn new tricks.",
    level: "linking_turns",
    specialties: ["Snowboarding", "Freestyle"]
  },
  {
    name: "David Wilson",
    email: "david.wilson@email.com",
    password: "password123",
    role: "student",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    bio: "Family man with two kids, looking to improve skiing skills for family trips.",
    level: "developing_turns",
    specialties: ["Skiing", "Family Skiing"]
  }
];

const kidProfiles = [
  {
    name: "Lily Wilson",
    age: 8,
    allergies: "None",
    helmet_color: "#FF6B6B",
    jacket_color: "#4ECDC4",
    pants_color: "#45B7D1",
    level: "first_time",
    emergency_contact_name: "David Wilson",
    emergency_contact_phone: "+1-555-0123",
    emergency_contact_relationship: "Father"
  },
  {
    name: "Max Wilson",
    age: 10,
    allergies: "Peanuts",
    helmet_color: "#96CEB4",
    jacket_color: "#FFEAA7",
    pants_color: "#DDA0DD",
    level: "developing_turns",
    emergency_contact_name: "David Wilson",
    emergency_contact_phone: "+1-555-0123",
    emergency_contact_relationship: "Father"
  }
];

// Generate availability for instructors
const generateAvailability = (instructorId) => {
  const availability = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1); // Start from tomorrow
  
  for (let i = 0; i < 30; i++) { // Generate 30 days of availability
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    // Skip weekends (optional - remove if you want weekend availability)
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      availability.push({
        instructorId,
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        startTime: "09:00",
        endTime: "17:00",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }
  
  return availability;
};

// Generate lessons
const generateLessons = (instructors, students) => {
  const lessons = [];
  const lessonTypes = ['private', 'group'];
  const skillLevels = ['first_time', 'developing_turns', 'linking_turns', 'confident_turns', 'consistent_blue'];
  const skillsFocus = ['Basic Turns', 'Stopping', 'Linking Turns', 'Speed Control', 'Terrain Navigation'];
  
  // Past lessons
  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (i + 1) * 7); // One lesson per week in the past
    
    lessons.push({
      title: `Skiing Lesson ${i + 1}`,
      instructorId: instructors[Math.floor(Math.random() * instructors.length)].id,
      studentIds: [students[Math.floor(Math.random() * students.length)].id],
      date: date.toISOString().split('T')[0],
      time: ['morning', 'afternoon', 'full_day'][Math.floor(Math.random() * 3)],
      status: 'completed',
      notes: `Great progress made in lesson ${i + 1}. Student showed improvement in basic turns.`,
      skillsFocus: [skillsFocus[Math.floor(Math.random() * skillsFocus.length)]],
      type: lessonTypes[Math.floor(Math.random() * lessonTypes.length)],
      maxStudents: Math.floor(Math.random() * 4) + 1,
      skillLevel: skillLevels[Math.floor(Math.random() * skillLevels.length)],
      price: Math.floor(Math.random() * 50) + 75,
      description: `Comprehensive skiing lesson focusing on technique improvement.`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  
  // Upcoming lessons
  for (let i = 0; i < 3; i++) {
    const date = new Date();
    date.setDate(date.getDate() + (i + 1) * 7); // One lesson per week in the future
    
    lessons.push({
      title: `Upcoming Skiing Lesson ${i + 1}`,
      instructorId: instructors[Math.floor(Math.random() * instructors.length)].id,
      studentIds: [students[Math.floor(Math.random() * students.length)].id],
      date: date.toISOString().split('T')[0],
      time: ['morning', 'afternoon', 'full_day'][Math.floor(Math.random() * 3)],
      status: 'scheduled',
      notes: `Looking forward to continuing progress in skiing skills.`,
      skillsFocus: [skillsFocus[Math.floor(Math.random() * skillsFocus.length)]],
      type: lessonTypes[Math.floor(Math.random() * lessonTypes.length)],
      maxStudents: Math.floor(Math.random() * 4) + 1,
      skillLevel: skillLevels[Math.floor(Math.random() * skillLevels.length)],
      price: Math.floor(Math.random() * 50) + 75,
      description: `Scheduled skiing lesson to continue skill development.`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  
  return lessons;
};

// Helper function to calculate performance score
function calculatePerformanceScore(stats) {
  const {
    averageRating = 0,
    totalLessons = 0,
    completionRate = 0,
    repeatStudentRate = 0,
    lessonSuccessRate = 0,
    responseTime = 0
  } = stats;

  // Normalize values to 0-100 scale
  const ratingScore = Math.min(averageRating * 20, 30); // Max 30 points for 4.5+ rating
  const lessonScore = Math.min(totalLessons / 2, 20); // Max 20 points for 40+ lessons
  const completionScore = completionRate * 0.15; // 15% weight
  const repeatScore = repeatStudentRate * 0.15; // 15% weight
  const successScore = lessonSuccessRate * 0.1; // 10% weight
  const responseScore = Math.max(0, (24 - responseTime) / 24 * 10); // 10% weight, max 10 points

  return Math.round(ratingScore + lessonScore + completionScore + repeatScore + successScore + responseScore);
}

// Helper function to determine tier
function calculateTier(performanceScore) {
  if (performanceScore >= 90) return 'diamond';
  if (performanceScore >= 80) return 'platinum';
  if (performanceScore >= 70) return 'gold';
  if (performanceScore >= 60) return 'silver';
  return 'bronze';
}

// Helper function to calculate badges
function calculateBadges(stats) {
  const badges = [];
  const { totalLessons, averageRating, totalStudents, totalEarnings, performanceScore } = stats;

  // Lesson count badges
  if (totalLessons >= 1000) badges.push('Lesson Master');
  else if (totalLessons >= 500) badges.push('Experienced Guide');
  else if (totalLessons >= 100) badges.push('Dedicated Instructor');

  // Rating badges
  if (averageRating >= 4.8) badges.push('Excellence Award');
  else if (averageRating >= 4.5) badges.push('High Performer');
  else if (averageRating >= 4.0) badges.push('Quality Instructor');

  // Student count badges
  if (totalStudents >= 500) badges.push('Student Favorite');
  else if (totalStudents >= 200) badges.push('Popular Instructor');
  else if (totalStudents >= 50) badges.push('Growing Following');

  // Earnings badges
  if (totalEarnings >= 50000) badges.push('Top Earner');
  else if (totalEarnings >= 25000) badges.push('High Earner');
  else if (totalEarnings >= 10000) badges.push('Established');

  // Performance badges
  if (performanceScore >= 90) badges.push('Elite Instructor');
  else if (performanceScore >= 80) badges.push('Premium Guide');
  else if (performanceScore >= 70) badges.push('Professional');

  return badges;
}

// Helper function to calculate seasonal stats
function calculateSeasonalStats(lessons) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Define seasons (winter: Dec-Feb, spring: Mar-May, summer: Jun-Aug, fall: Sep-Nov)
  const isCurrentSeason = (month) => {
    if (currentMonth >= 11 || currentMonth <= 1) return month >= 11 || month <= 1; // Winter
    if (currentMonth >= 2 && currentMonth <= 4) return month >= 2 && month <= 4; // Spring
    if (currentMonth >= 5 && currentMonth <= 7) return month >= 5 && month <= 7; // Summer
    return month >= 8 && month <= 10; // Fall
  };

  const currentSeasonLessons = lessons.filter(lesson => {
    const lessonDate = new Date(lesson.date);
    return lessonDate.getFullYear() === currentYear && isCurrentSeason(lessonDate.getMonth());
  });

  const previousSeasonLessons = lessons.filter(lesson => {
    const lessonDate = new Date(lesson.date);
    const lessonYear = lessonDate.getFullYear();
    const lessonMonth = lessonDate.getMonth();
    
    // Previous season logic
    if (currentMonth >= 11 || currentMonth <= 1) { // Current is winter
      return (lessonYear === currentYear - 1 && lessonMonth >= 8 && lessonMonth <= 10) || // Previous fall
             (lessonYear === currentYear && lessonMonth >= 5 && lessonMonth <= 7); // Previous summer
    } else if (currentMonth >= 2 && currentMonth <= 4) { // Current is spring
      return lessonYear === currentYear && lessonMonth >= 11 || lessonMonth <= 1; // Previous winter
    } else if (currentMonth >= 5 && currentMonth <= 7) { // Current is summer
      return lessonYear === currentYear && lessonMonth >= 2 && lessonMonth <= 4; // Previous spring
    } else { // Current is fall
      return lessonYear === currentYear && lessonMonth >= 5 && lessonMonth <= 7; // Previous summer
    }
  });

  return {
    currentSeason: {
      lessons: currentSeasonLessons.length,
      earnings: currentSeasonLessons.reduce((sum, lesson) => sum + (lesson.price || 0), 0),
      rating: currentSeasonLessons.length > 0 
        ? currentSeasonLessons.reduce((sum, lesson) => sum + (lesson.rating || 0), 0) / currentSeasonLessons.length 
        : 0
    },
    previousSeason: {
      lessons: previousSeasonLessons.length,
      earnings: previousSeasonLessons.reduce((sum, lesson) => sum + (lesson.price || 0), 0),
      rating: previousSeasonLessons.length > 0 
        ? previousSeasonLessons.reduce((sum, lesson) => sum + (lesson.rating || 0), 0) / previousSeasonLessons.length 
        : 0
    }
  };
}

function getSkillsForLevel(level, sport) {
  const skillMap = {
    first_time: {
      skiing: ['basic_stance', 'stopping'],
      snowboarding: ['basic_stance', 'stopping']
    },
    developing_turns: {
      skiing: ['basic_stance', 'stopping', 'basic_turns', 'developing_turns'],
      snowboarding: ['basic_stance', 'stopping', 'basic_turns', 'developing_turns']
    },
    linking_turns: {
      skiing: ['basic_stance', 'stopping', 'basic_turns', 'developing_turns', 'linking_turns', 'speed_control'],
      snowboarding: ['basic_stance', 'stopping', 'basic_turns', 'developing_turns', 'linking_turns', 'speed_control']
    },
    confident_turns: {
      skiing: ['basic_stance', 'stopping', 'basic_turns', 'developing_turns', 'linking_turns', 'speed_control', 'confident_turns', 'terrain_variety'],
      snowboarding: ['basic_stance', 'stopping', 'basic_turns', 'developing_turns', 'linking_turns', 'speed_control', 'confident_turns', 'terrain_variety']
    },
    consistent_blue: {
      skiing: ['basic_stance', 'stopping', 'basic_turns', 'developing_turns', 'linking_turns', 'speed_control', 'confident_turns', 'terrain_variety', 'blue_runs', 'advanced_techniques'],
      snowboarding: ['basic_stance', 'stopping', 'basic_turns', 'developing_turns', 'linking_turns', 'speed_control', 'confident_turns', 'terrain_variety', 'blue_runs', 'advanced_techniques']
    }
  };

  return skillMap[level]?.[sport] || skillMap.first_time[sport];
}

async function seedFirebase() {
  try {
    console.log('🌱 Starting comprehensive Firebase seeding...');
    
    // Create instructors
    console.log('👨‍🏫 Creating instructors...');
    const createdInstructors = [];
    for (const instructor of instructors) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          instructor.email, 
          instructor.password
        );
        
        await updateProfile(userCredential.user, {
          displayName: instructor.name,
          photoURL: instructor.avatar
        });
        
        const userData = {
          id: userCredential.user.uid,
          email: instructor.email,
          name: instructor.name,
          role: instructor.role,
          avatar: instructor.avatar,
          bio: instructor.bio,
          specialties: instructor.specialties,
          certifications: instructor.certifications,
          languages: instructor.languages,
          yearsOfExperience: instructor.yearsOfExperience,
          hourlyRate: instructor.hourlyRate,
          preferredLocations: instructor.preferredLocations,
          qualifications: instructor.qualifications
        };
        
        await setDoc(doc(db, 'users', userCredential.user.uid), userData);
        createdInstructors.push({ ...instructor, id: userCredential.user.uid });
        console.log(`✅ Created instructor: ${instructor.name}`);
              } catch (error) {
          if (error.code === 'auth/email-already-in-use') {
            console.log(`⚠️ Instructor ${instructor.name} already exists, skipping...`);
            // For now, we'll skip existing users since we can't query without auth
            // In a real scenario, you'd want to authenticate first or use admin SDK
            console.log(`ℹ️ Skipping existing instructor: ${instructor.name}`);
          } else {
            throw error;
          }
        }
    }
    
    // Create students
    console.log('👨‍🎓 Creating students...');
    const createdStudents = [];
    for (const student of students) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          student.email, 
          student.password
        );
        
        await updateProfile(userCredential.user, {
          displayName: student.name,
          photoURL: student.avatar
        });
        
        const userData = {
          id: userCredential.user.uid,
          email: student.email,
          name: student.name,
          role: student.role,
          avatar: student.avatar,
          bio: student.bio,
          level: student.level,
          specialties: student.specialties
        };
        
        await setDoc(doc(db, 'users', userCredential.user.uid), userData);
        createdStudents.push({ ...student, id: userCredential.user.uid });
        console.log(`✅ Created student: ${student.name}`);
              } catch (error) {
          if (error.code === 'auth/email-already-in-use') {
            console.log(`⚠️ Student ${student.name} already exists, skipping...`);
            // For now, we'll skip existing users since we can't query without auth
            console.log(`ℹ️ Skipping existing student: ${student.name}`);
          } else {
            throw error;
          }
        }
    }
    
    // Create kid profiles for David Wilson only if he was created
    if (createdStudents.length > 0) {
      console.log('👶 Creating kid profiles...');
      const davidWilson = createdStudents.find(s => s.name === "David Wilson");
      if (davidWilson) {
        for (const kidProfile of kidProfiles) {
          const profileData = {
            parentId: davidWilson.id,
            ...kidProfile,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          };
          
          await addDoc(collection(db, 'kid_profiles'), profileData);
          console.log(`✅ Created kid profile: ${kidProfile.name}`);
        }
      }
    } else {
      console.log('⚠️ Skipping kid profile creation - no new students created');
    }
    
    // Create availability for instructors only if we have instructors
    if (createdInstructors.length > 0) {
      console.log('📅 Creating instructor availability...');
      for (const instructor of createdInstructors) {
        const availability = generateAvailability(instructor.id);
        for (const slot of availability) {
          await addDoc(collection(db, 'instructorAvailability'), slot);
        }
        console.log(`✅ Created availability for: ${instructor.name}`);
      }
    } else {
      console.log('⚠️ Skipping availability creation - no new instructors created');
    }
    
    // Create lessons only if we have users
    if (createdInstructors.length > 0 && createdStudents.length > 0) {
      console.log('📚 Creating lessons...');
      const lessons = generateLessons(createdInstructors, createdStudents);
      for (const lesson of lessons) {
        await addDoc(collection(db, 'lessons'), lesson);
      }
      console.log(`✅ Created ${lessons.length} lessons`);
    } else {
      console.log('⚠️ Skipping lesson creation - no new users created');
    }
    
    // Create admin user
    console.log('👑 Creating admin user...');
    const adminUser = {
      name: "Admin User",
      email: "admin@slopesmaster.com",
      password: "password123",
      role: "admin",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      bio: "System administrator",
      specialties: [],
      level: "admin"
    };
    
    try {
      const adminCredential = await createUserWithEmailAndPassword(
        auth, 
        adminUser.email, 
        adminUser.password
      );
      
      await updateProfile(adminCredential.user, {
        displayName: adminUser.name,
        photoURL: adminUser.avatar
      });
      
      const adminData = {
        id: adminCredential.user.uid,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        avatar: adminUser.avatar,
        bio: adminUser.bio,
        specialties: adminUser.specialties,
        level: adminUser.level
      };
      
      await setDoc(doc(db, 'users', adminCredential.user.uid), adminData);
      console.log(`✅ Created admin user: ${adminUser.name}`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️ Admin user already exists, skipping...`);
      } else {
        throw error;
      }
    }
    
    // Seed achievements for students only if we have students
    if (createdStudents.length > 0) {
      console.log('🏆 Seeding achievements...');
      for (const student of createdStudents) {
        // Check if welcome achievement already exists
        const achievementsRef = collection(db, 'achievements');
        const achievementQuery = query(
          achievementsRef, 
          where('studentId', '==', student.id),
          where('name', '==', 'Welcome to SlopesMaster!')
        );
        const existingAchievement = await getDocs(achievementQuery);

        if (existingAchievement.empty) {
          // Add welcome achievement
          const welcomeAchievement = {
            studentId: student.id,
            name: 'Welcome to SlopesMaster!',
            description: 'Created your account and joined the community',
            icon: '🎿',
            unlockedDate: new Date().toISOString(),
            category: 'milestone'
          };

          await addDoc(achievementsRef, welcomeAchievement);
          console.log(`✅ Added welcome achievement for ${student.name}`);
        }
      }
    } else {
      console.log('⚠️ Skipping achievement seeding - no new students created');
    }
    
    // Seed progress data for students only if we have students
    if (createdStudents.length > 0) {
      console.log('📊 Seeding progress data...');
      for (const student of createdStudents) {
        // Check if progress already exists
        const progressRef = collection(db, 'studentProgress');
        const progressQuery = query(progressRef, where('studentId', '==', student.id));
        const existingProgress = await getDocs(progressQuery);

        if (existingProgress.empty) {
          // Create progress data based on student's current level
          const progressData = {
            studentId: student.id,
            name: student.name,
            level: student.level || 'first_time',
            totalLessons: Math.floor(Math.random() * 15), // Random number of lessons
            completedLessons: Math.floor(Math.random() * 10),
            skillProgress: {
              skiing: {
                level: student.level === 'first_time' ? 0 : Math.floor(Math.random() * 3),
                progress: Math.floor(Math.random() * 100),
                skills: getSkillsForLevel(student.level || 'first_time', 'skiing')
              },
              snowboarding: {
                level: student.level === 'first_time' ? 0 : Math.floor(Math.random() * 3),
                progress: Math.floor(Math.random() * 100),
                skills: getSkillsForLevel(student.level || 'first_time', 'snowboarding')
              }
            },
            achievements: ['welcome_to_slopes'],
            streakDays: Math.floor(Math.random() * 14),
            totalPoints: 10, // Start with welcome achievement
            lastActivity: new Date().toISOString()
          };

          // Add to studentProgress collection
          await addDoc(progressRef, progressData);
          console.log(`✅ Added progress data for ${student.name}`);

          // Create skill progress entries
          for (const [skill, skillData] of Object.entries(progressData.skillProgress)) {
            const skillProgressData = {
              studentId: student.id,
              skill,
              level: skillData.level,
              progress: skillData.progress,
              skills: skillData.skills,
              lastUpdated: new Date().toISOString()
            };

            await addDoc(collection(db, 'skillProgress'), skillProgressData);
            console.log(`  📈 Added ${skill} progress (Level ${skillData.level})`);
          }
        }
      }
    } else {
      console.log('⚠️ Skipping progress seeding - no new students created');
    }
    
    // Seed instructor stats only if we have instructors and lessons
    if (createdInstructors.length > 0) {
      console.log('📈 Seeding instructor stats...');
      const allLessons = lessons || [];
      
      // Calculate comprehensive stats for each instructor
      const instructorStatsPromises = createdInstructors.map(async (instructor, index) => {
      console.log(`\n📊 Analyzing stats for ${instructor.name}...`);

      // Get all lessons for this instructor
      const instructorLessons = allLessons.filter(lesson => lesson.instructorId === instructor.id);
      const completedLessons = instructorLessons.filter(lesson => lesson.status === 'completed');
      const cancelledLessons = instructorLessons.filter(lesson => lesson.status === 'cancelled');

      // Calculate basic stats
      const totalLessons = completedLessons.length;
      const totalEarnings = completedLessons.reduce((sum, lesson) => sum + (lesson.price || 0), 0);
      
      // Calculate completion rate
      const totalScheduled = instructorLessons.length;
      const completionRate = totalScheduled > 0 ? Math.round((totalLessons / totalScheduled) * 100) : 100;

      // Calculate average rating from reviews
      const allReviews = completedLessons.flatMap(lesson => lesson.studentReviews || []);
      const averageRating = allReviews.length > 0 
        ? Math.round((allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length) * 10) / 10
        : 4.5; // Default rating for new instructors

      // Calculate unique students
      const uniqueStudents = new Set(completedLessons.flatMap(lesson => lesson.studentIds || []));
      const totalStudents = uniqueStudents.size;

      // Calculate repeat student rate
      const studentLessonCounts = {};
      completedLessons.forEach(lesson => {
        lesson.studentIds?.forEach(studentId => {
          studentLessonCounts[studentId] = (studentLessonCounts[studentId] || 0) + 1;
        });
      });
      const repeatStudents = Object.values(studentLessonCounts).filter(count => count > 1).length;
      const repeatStudentRate = totalStudents > 0 ? Math.round((repeatStudents / totalStudents) * 100) : 0;

      // Calculate lesson success rate (lessons with 4+ star ratings)
      const successfulLessons = allReviews.filter(review => review.rating >= 4).length;
      const lessonSuccessRate = allReviews.length > 0 ? Math.round((successfulLessons / allReviews.length) * 100) : 90;

      // Calculate response time (mock data for now, would need message timestamps in real app)
      const responseTime = Math.floor(Math.random() * 6) + 1; // 1-6 hours

      // Calculate seasonal stats
      const seasonalStats = calculateSeasonalStats(completedLessons);

      // Calculate performance score
      const performanceScore = calculatePerformanceScore({
        averageRating,
        totalLessons,
        completionRate,
        repeatStudentRate,
        lessonSuccessRate,
        responseTime
      });

      // Determine tier
      const tier = calculateTier(performanceScore);

      // Calculate badges
      const badges = calculateBadges({
        totalLessons,
        averageRating,
        totalStudents,
        totalEarnings,
        performanceScore
      });

      const stats = {
        totalLessons,
        averageRating,
        totalStudents,
        totalReviews: allReviews.length,
        performanceScore,
        ranking: 0, // Will be calculated after all stats are computed
        totalEarnings,
        completionRate,
        responseTime,
        repeatStudentRate,
        lessonSuccessRate,
        seasonalStats,
        badges,
        tier,
        lastUpdated: new Date().toISOString()
      };

      console.log(`   📈 Performance Score: ${performanceScore}/100`);
      console.log(`   🏆 Tier: ${tier}`);
      console.log(`   🎖️ Badges: ${badges.join(', ')}`);
      console.log(`   💰 Total Earnings: $${totalEarnings.toLocaleString()}`);
      console.log(`   👥 Students: ${totalStudents}`);
      console.log(`   ⭐ Rating: ${averageRating}`);

      return { instructorId: instructor.id, stats, userData: instructor };
    });

    const instructorStats = await Promise.all(instructorStatsPromises);

    // Calculate rankings based on performance scores
    const sortedInstructors = instructorStats
      .sort((a, b) => b.stats.performanceScore - a.stats.performanceScore)
      .map((instructor, index) => ({
        ...instructor,
        stats: { ...instructor.stats, ranking: index + 1 }
      }));

    console.log('\n🏆 Final Rankings:');
    sortedInstructors.forEach((instructor, index) => {
      console.log(`   ${index + 1}. ${instructor.userData.name} - ${instructor.stats.performanceScore}pts (${instructor.stats.tier})`);
    });

    // Save all instructor stats
    const savePromises = sortedInstructors.map(async (instructor) => {
      try {
        await setDoc(doc(db, 'instructorStats', instructor.instructorId), instructor.stats);
        console.log(`✅ Saved comprehensive stats for ${instructor.userData.name}`);
      } catch (error) {
        console.log(`❌ Failed to save stats for ${instructor.userData.name}: ${error.message}`);
      }
    });

    await Promise.all(savePromises);
    } else {
      console.log('⚠️ Skipping instructor stats seeding - no new instructors created');
    }
    
    console.log('🎉 Comprehensive Firebase seeding completed successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('Admin: admin@slopesmaster.com / password123');
    console.log('Instructors: sarah.johnson@slopesmaster.com / password123');
    console.log('Students: alex.thompson@email.com / password123');
    
  } catch (error) {
    console.error('❌ Error seeding Firebase:', error);
  }
}

// Run the seeding function
seedFirebase()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 