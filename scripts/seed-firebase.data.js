/**
 * Static seed data for scripts/seed-firebase.js
 * Mountains use stable Firestore doc IDs from slugify(name).
 */

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * @typedef {Object} MountainSeed
 * @property {string} name
 * @property {string} location
 * @property {string} description
 * @property {number} privateLessonPrice
 * @property {number} groupLessonPrice
 * @property {number} [baseDepthInches]
 * @property {number} [snowfall24hInches]
 * @property {string} [regionId]
 * @property {('ikon'|'epic')[]} [passAffiliations]
 */

/** @type {MountainSeed[]} */
export const MOUNTAIN_SEEDS = [
  {
    name: 'Aspen',
    location: 'Colorado',
    description: 'Premium mountain with advanced terrain, family learning zones, and a strong private lesson program.',
    privateLessonPrice: 180,
    groupLessonPrice: 110,
    baseDepthInches: 42,
    snowfall24hInches: 3,
    regionId: 'usa_rockies',
    passAffiliations: ['ikon']
  },
  {
    name: 'Vail',
    location: 'Colorado',
    description: 'Large destination resort with all-mountain terrain and high-volume group instruction.',
    privateLessonPrice: 190,
    groupLessonPrice: 120,
    baseDepthInches: 48,
    snowfall24hInches: 5,
    regionId: 'usa_rockies',
    passAffiliations: ['epic']
  },
  {
    name: 'Breckenridge',
    location: 'Colorado',
    description: 'High-altitude mountain with approachable beginner terrain and freestyle features.',
    privateLessonPrice: 160,
    groupLessonPrice: 100,
    baseDepthInches: 55,
    snowfall24hInches: 8,
    regionId: 'usa_rockies',
    passAffiliations: ['epic']
  },
  {
    name: 'Park City',
    location: 'Utah',
    description: 'Modern resort with easy access, diverse terrain, and a strong lesson marketplace.',
    privateLessonPrice: 170,
    groupLessonPrice: 105,
    baseDepthInches: 38,
    snowfall24hInches: 2,
    regionId: 'usa_rockies',
    passAffiliations: ['ikon', 'epic']
  },
  {
    name: 'Whistler',
    location: 'British Columbia',
    description: 'Large international destination with expansive terrain and multi-sport instruction demand.',
    privateLessonPrice: 195,
    groupLessonPrice: 125,
    baseDepthInches: 118,
    snowfall24hInches: 12,
    regionId: 'canada',
    passAffiliations: ['ikon']
  },
  {
    name: 'Jackson Hole',
    location: 'Wyoming',
    description: 'Steep and iconic mountain that supports advanced coaching and expert clinics.',
    privateLessonPrice: 205,
    groupLessonPrice: 130,
    baseDepthInches: 72,
    snowfall24hInches: 6,
    regionId: 'usa_rockies',
    passAffiliations: ['ikon']
  },
  {
    name: 'Steamboat',
    location: 'Colorado',
    description: 'Champagne powder and strong beginner through expert lesson programs.',
    privateLessonPrice: 165,
    groupLessonPrice: 98,
    baseDepthInches: 62,
    snowfall24hInches: 7,
    regionId: 'usa_rockies',
    passAffiliations: ['ikon']
  },
  {
    name: 'Telluride',
    location: 'Colorado',
    description: 'Stunning box canyon terrain with boutique-town vibe and expert guiding.',
    privateLessonPrice: 188,
    groupLessonPrice: 115,
    baseDepthInches: 51,
    snowfall24hInches: 4,
    regionId: 'usa_rockies',
    passAffiliations: ['epic']
  },
  {
    name: 'Copper Mountain',
    location: 'Colorado',
    description: 'Naturally divided terrain from beginner to expert; popular for families.',
    privateLessonPrice: 155,
    groupLessonPrice: 95,
    baseDepthInches: 44,
    snowfall24hInches: 3,
    regionId: 'usa_rockies',
    passAffiliations: ['ikon']
  },
  {
    name: 'Sun Valley',
    location: 'Idaho',
    description: 'Historic resort with cruisers, steeps, and strong ski school tradition.',
    privateLessonPrice: 172,
    groupLessonPrice: 108,
    baseDepthInches: 36,
    snowfall24hInches: 1,
    regionId: 'usa_rockies',
    passAffiliations: ['ikon']
  },
  {
    name: 'Mammoth Mountain',
    location: 'California',
    description: 'Long season, high elevation, and varied California-style terrain.',
    privateLessonPrice: 168,
    groupLessonPrice: 102,
    baseDepthInches: 88,
    snowfall24hInches: 0,
    regionId: 'usa_southwest',
    passAffiliations: ['ikon']
  },
  {
    name: 'Angel Fire',
    location: 'New Mexico',
    description: 'Family-friendly mountain with approachable learning terrain.',
    privateLessonPrice: 125,
    groupLessonPrice: 78,
    baseDepthInches: 28,
    snowfall24hInches: 2,
    regionId: 'usa_southwest',
    passAffiliations: []
  },
  {
    name: 'Stowe',
    location: 'Vermont',
    description: 'Classic Northeast skiing with challenging natural snow terrain.',
    privateLessonPrice: 175,
    groupLessonPrice: 108,
    baseDepthInches: 22,
    snowfall24hInches: 4,
    regionId: 'usa_northeast',
    passAffiliations: ['epic']
  },
  {
    name: 'Northstar',
    location: 'California',
    description: 'Lake Tahoe resort known for grooming, trees, and family programs.',
    privateLessonPrice: 162,
    groupLessonPrice: 99,
    baseDepthInches: 52,
    snowfall24hInches: 5,
    regionId: 'usa_southwest',
    passAffiliations: ['epic']
  }
];

/** Primary home resort name — must match MOUNTAIN_SEEDS[].name */
export const INSTRUCTOR_PRIMARY_MOUNTAIN_BY_EMAIL = {
  'sarah.johnson@slopesmaster.com': 'Vail',
  'mike.chen@slopesmaster.com': 'Park City',
  'emma.rodriguez@slopesmaster.com': 'Aspen',
  'james.okafor@slopesmaster.com': 'Breckenridge',
  'lisa.nakamura@slopesmaster.com': 'Whistler',
  'marcus.webb@slopesmaster.com': 'Jackson Hole',
  'nina.kowalski@slopesmaster.com': 'Steamboat',
  'diego.ferreira@slopesmaster.com': 'Telluride',
  'hannah.sullivan@slopesmaster.com': 'Copper Mountain',
  'ryan.cho@slopesmaster.com': 'Sun Valley',
  'olivia.martinez@slopesmaster.com': 'Mammoth Mountain',
  'ethan.nguyen@slopesmaster.com': 'Stowe',
  'priya.shah@slopesmaster.com': 'Northstar'
};

export const instructors = [
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@slopesmaster.com',
    password: 'password123',
    role: 'instructor',
    gender: 'Female',
    level: 'Expert',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
    bio: 'Certified ski instructor with 8 years of experience. Specialized in teaching beginners and intermediate skiers.',
    specialties: ['Skiing', 'Freestyle', 'Backcountry'],
    certifications: ['PSIA Level 2', 'Avalanche Safety', 'First Aid'],
    languages: ['English', 'Spanish'],
    yearsOfExperience: 8,
    hourlyRate: 85,
    preferredLocations: ['Whistler Blackcomb', 'Vail'],
    qualifications: 'PSIA Level 2 Certified, Avalanche Safety Certified'
  },
  {
    name: 'Mike Chen',
    email: 'mike.chen@slopesmaster.com',
    password: 'password123',
    role: 'instructor',
    gender: 'Male',
    level: 'Expert',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    bio: 'Expert snowboard instructor passionate about teaching all skill levels. Former competitive snowboarder.',
    specialties: ['Snowboarding', 'Terrain Park', 'Racing'],
    certifications: ['AASI Level 3', 'Terrain Park Safety', 'CPR'],
    languages: ['English', 'Mandarin'],
    yearsOfExperience: 12,
    hourlyRate: 95,
    preferredLocations: ['Whistler Blackcomb', 'Park City'],
    qualifications: 'AASI Level 3 Certified, Former Competitive Snowboarder'
  },
  {
    name: 'Emma Rodriguez',
    email: 'emma.rodriguez@slopesmaster.com',
    password: 'password123',
    role: 'instructor',
    gender: 'Female',
    level: 'Advanced',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    bio: "Dedicated instructor specializing in children's lessons and family groups. Patient and encouraging teaching style.",
    specialties: ['Skiing', "Children's Lessons", 'Family Groups'],
    certifications: ['PSIA Level 1', 'Child Safety', 'Teaching Children'],
    languages: ['English', 'Spanish', 'French'],
    yearsOfExperience: 5,
    hourlyRate: 75,
    preferredLocations: ['Whistler Blackcomb', 'Aspen'],
    qualifications: 'PSIA Level 1 Certified, Child Safety Specialist'
  },
  {
    name: 'James Okafor',
    email: 'james.okafor@slopesmaster.com',
    password: 'password123',
    role: 'instructor',
    gender: 'Male',
    level: 'Advanced',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    bio: 'PSIA Level 3 ski coach focused on carving, moguls, and strong fundamentals for adults.',
    specialties: ['Skiing', 'Carving', 'Moguls'],
    certifications: ['PSIA Level 3', 'First Aid'],
    languages: ['English'],
    yearsOfExperience: 14,
    hourlyRate: 92,
    preferredLocations: ['Breckenridge', 'Vail'],
    qualifications: 'PSIA Level 3'
  },
  {
    name: 'Lisa Nakamura',
    email: 'lisa.nakamura@slopesmaster.com',
    password: 'password123',
    role: 'instructor',
    gender: 'Female',
    level: 'Expert',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    bio: 'Splitboard-friendly guide and snowboard instructor for steep terrain and powder days.',
    specialties: ['Snowboarding', 'Backcountry', 'Powder'],
    certifications: ['AASI Level 2', 'Avalanche Safety'],
    languages: ['English', 'Japanese'],
    yearsOfExperience: 9,
    hourlyRate: 98,
    preferredLocations: ['Whistler'],
    qualifications: 'AASI Level 2, Avy 1'
  },
  {
    name: 'Marcus Webb',
    email: 'marcus.webb@slopesmaster.com',
    password: 'password123',
    role: 'instructor',
    gender: 'Male',
    level: 'Expert',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    bio: 'Former racer; teaches dynamic skiing for strong intermediates moving to expert terrain.',
    specialties: ['Skiing', 'Racing', 'Steep Terrain'],
    certifications: ['PSIA Level 3', 'USSS Coach'],
    languages: ['English'],
    yearsOfExperience: 16,
    hourlyRate: 110,
    preferredLocations: ['Jackson Hole'],
    qualifications: 'PSIA Level 3'
  },
  {
    name: 'Nina Kowalski',
    email: 'nina.kowalski@slopesmaster.com',
    password: 'password123',
    role: 'instructor',
    gender: 'Female',
    level: 'Intermediate',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    bio: 'Patient beginner specialist — first turns, lift loading, and building confidence on green terrain.',
    specialties: ['Skiing', 'Beginners', 'Nervous Adults'],
    certifications: ['PSIA Level 1', 'First Aid'],
    languages: ['English', 'Polish'],
    yearsOfExperience: 4,
    hourlyRate: 68,
    preferredLocations: ['Steamboat'],
    qualifications: 'PSIA Level 1'
  },
  {
    name: 'Diego Ferreira',
    email: 'diego.ferreira@slopesmaster.com',
    password: 'password123',
    role: 'instructor',
    gender: 'Male',
    level: 'Advanced',
    avatar: 'https://images.unsplash.com/photo-1507591064344-4c1ce0c14c57?w=150',
    bio: 'Bilingual snowboard instructor; park basics, switch riding, and all-mountain flow.',
    specialties: ['Snowboarding', 'Terrain Park', 'Freestyle'],
    certifications: ['AASI Level 2', 'CPR'],
    languages: ['English', 'Spanish', 'Portuguese'],
    yearsOfExperience: 7,
    hourlyRate: 82,
    preferredLocations: ['Telluride'],
    qualifications: 'AASI Level 2'
  },
  {
    name: 'Hannah Sullivan',
    email: 'hannah.sullivan@slopesmaster.com',
    password: 'password123',
    role: 'instructor',
    gender: 'Non-binary',
    level: 'Advanced',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
    bio: 'Adaptive-friendly coach; blends ski and snowboard cross-training for well-rounded snow skills.',
    specialties: ['Skiing', 'Snowboarding', 'Adaptive'],
    certifications: ['PSIA Level 2', 'AASI Level 1'],
    languages: ['English'],
    yearsOfExperience: 6,
    hourlyRate: 79,
    preferredLocations: ['Copper Mountain'],
    qualifications: 'PSIA Level 2, AASI Level 1'
  },
  {
    name: 'Ryan Cho',
    email: 'ryan.cho@slopesmaster.com',
    password: 'password123',
    role: 'instructor',
    gender: 'Male',
    level: 'Expert',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    bio: 'Technical ski nerd — alignment, boot setup, and efficient movement for long ski days.',
    specialties: ['Skiing', 'Biomechanics', 'Equipment'],
    certifications: ['PSIA Level 3'],
    languages: ['English', 'Korean'],
    yearsOfExperience: 11,
    hourlyRate: 94,
    preferredLocations: ['Sun Valley'],
    qualifications: 'PSIA Level 3'
  },
  {
    name: 'Olivia Martinez',
    email: 'olivia.martinez@slopesmaster.com',
    password: 'password123',
    role: 'instructor',
    gender: 'Female',
    level: 'Advanced',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150',
    bio: 'Spring corn and California sun — teaches smooth turns and mountain safety at altitude.',
    specialties: ['Skiing', 'Spring Conditions', 'Mountain Safety'],
    certifications: ['PSIA Level 2', 'First Aid'],
    languages: ['English', 'Spanish'],
    yearsOfExperience: 8,
    hourlyRate: 86,
    preferredLocations: ['Mammoth Mountain'],
    qualifications: 'PSIA Level 2'
  },
  {
    name: 'Ethan Nguyen',
    email: 'ethan.nguyen@slopesmaster.com',
    password: 'password123',
    role: 'instructor',
    gender: 'Male',
    level: 'Advanced',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    bio: 'Ice-coast transplant; teaches edge control, narrow trails, and variable East Coast snow.',
    specialties: ['Skiing', 'Ice', 'Narrow Trails'],
    certifications: ['PSIA Level 2'],
    languages: ['English', 'Vietnamese'],
    yearsOfExperience: 10,
    hourlyRate: 88,
    preferredLocations: ['Stowe'],
    qualifications: 'PSIA Level 2'
  },
  {
    name: 'Priya Shah',
    email: 'priya.shah@slopesmaster.com',
    password: 'password123',
    role: 'instructor',
    gender: 'Female',
    level: 'Expert',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    bio: 'Progression-focused snowboard coach from park jumps to confident black-diamond riding.',
    specialties: ['Snowboarding', 'Progression', 'All-Mountain'],
    certifications: ['AASI Level 3'],
    languages: ['English', 'Hindi'],
    yearsOfExperience: 13,
    hourlyRate: 99,
    preferredLocations: ['Northstar', 'Park City'],
    qualifications: 'AASI Level 3'
  }
];

export const students = [
  {
    name: 'Alex Thompson',
    email: 'alex.thompson@email.com',
    password: 'password123',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    bio: 'New to skiing, excited to learn the basics and progress to intermediate level.',
    level: 'first_time',
    specialties: ['Skiing'],
    studentPreferences: { skiPass: 'epic' }
  },
  {
    name: 'Jessica Park',
    email: 'jessica.park@email.com',
    password: 'password123',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    bio: 'Intermediate snowboarder looking to improve technique and learn new tricks.',
    level: 'linking_turns',
    specialties: ['Snowboarding', 'Freestyle'],
    studentPreferences: { skiPass: 'ikon' }
  },
  {
    name: 'David Wilson',
    email: 'david.wilson@email.com',
    password: 'password123',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    bio: 'Family man with two kids, looking to improve skiing skills for family trips.',
    level: 'developing_turns',
    specialties: ['Skiing', 'Family Skiing'],
    studentPreferences: { skiPass: 'epic' }
  },
  {
    name: 'Sam Rivera',
    email: 'sam.rivera@email.com',
    password: 'password123',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    bio: 'Weekend warrior targeting blue runs and better carve technique.',
    level: 'linking_turns',
    specialties: ['Skiing'],
    studentPreferences: { skiPass: 'ikon' }
  },
  {
    name: 'Taylor Kim',
    email: 'taylor.kim@email.com',
    password: 'password123',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    bio: 'First season on a board — wants safe fundamentals and small park features.',
    level: 'first_time',
    specialties: ['Snowboarding'],
    studentPreferences: {}
  },
  {
    name: 'Jordan Lee',
    email: 'jordan.lee@email.com',
    password: 'password123',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    bio: 'Returning skier after a long break; refreshing stops and turns.',
    level: 'developing_turns',
    specialties: ['Skiing'],
    studentPreferences: { skiPass: 'epic' }
  },
  {
    name: 'Casey Morgan',
    email: 'casey.morgan@email.com',
    password: 'password123',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
    bio: 'Aspiring instructor track — shadowing lessons and building mileage.',
    level: 'confident_turns',
    specialties: ['Skiing', 'Teaching'],
    studentPreferences: { skiPass: 'ikon' }
  },
  {
    name: 'Riley Brooks',
    email: 'riley.brooks@email.com',
    password: 'password123',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
    bio: 'College club rider; wants consistent heelside and switch comfort.',
    level: 'linking_turns',
    specialties: ['Snowboarding'],
    studentPreferences: {}
  },
  {
    name: 'Morgan Patel',
    email: 'morgan.patel@email.com',
    password: 'password123',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    bio: 'Planning a Japan trip — powder etiquette and tree-skiing basics.',
    level: 'consistent_blue',
    specialties: ['Skiing', 'Powder'],
    studentPreferences: { skiPass: 'ikon' }
  }
];

export const kidProfiles = [
  {
    name: 'Lily Wilson',
    age: 8,
    allergies: 'None',
    helmet_color: '#FF6B6B',
    jacket_color: '#4ECDC4',
    pants_color: '#45B7D1',
    level: 'first_time',
    emergency_contact_name: 'David Wilson',
    emergency_contact_phone: '+1-555-0123',
    emergency_contact_relationship: 'Father'
  },
  {
    name: 'Max Wilson',
    age: 10,
    allergies: 'Peanuts',
    helmet_color: '#96CEB4',
    jacket_color: '#FFEAA7',
    pants_color: '#DDA0DD',
    level: 'developing_turns',
    emergency_contact_name: 'David Wilson',
    emergency_contact_phone: '+1-555-0123',
    emergency_contact_relationship: 'Father'
  }
];
