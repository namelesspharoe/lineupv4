import admin from 'firebase-admin';
import { loadServiceAccountJson } from './resolve-service-account.js';

const serviceAccount = loadServiceAccountJson();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'concierge-95495.appspot.com'
});

const db = admin.firestore();
const timestamp = new Date().toISOString();

const mountainSeeds = [
  {
    name: 'Aspen',
    location: 'Colorado',
    description: 'Premium mountain with advanced terrain, family learning zones, and a strong private lesson program.',
    privateLessonPrice: 180,
    groupLessonPrice: 110,
    baseDepthInches: 42,
    snowfall24hInches: 3
  },
  {
    name: 'Vail',
    location: 'Colorado',
    description: 'Large destination resort with all-mountain terrain and high-volume group instruction.',
    privateLessonPrice: 190,
    groupLessonPrice: 120,
    baseDepthInches: 48,
    snowfall24hInches: 5
  },
  {
    name: 'Breckenridge',
    location: 'Colorado',
    description: 'High-altitude mountain with approachable beginner terrain and freestyle features.',
    privateLessonPrice: 160,
    groupLessonPrice: 100,
    baseDepthInches: 55,
    snowfall24hInches: 8
  },
  {
    name: 'Park City',
    location: 'Utah',
    description: 'Modern resort with easy access, diverse terrain, and a strong lesson marketplace.',
    privateLessonPrice: 170,
    groupLessonPrice: 105,
    baseDepthInches: 38,
    snowfall24hInches: 2
  },
  {
    name: 'Whistler',
    location: 'British Columbia',
    description: 'Large international destination with expansive terrain and multi-sport instruction demand.',
    privateLessonPrice: 195,
    groupLessonPrice: 125,
    baseDepthInches: 118,
    snowfall24hInches: 12
  },
  {
    name: 'Jackson Hole',
    location: 'Wyoming',
    description: 'Steep and iconic mountain that supports advanced coaching and expert clinics.',
    privateLessonPrice: 205,
    groupLessonPrice: 130,
    baseDepthInches: 72,
    snowfall24hInches: 6
  }
];

const instructorMountainByEmail = {
  'sarah.johnson@slopesmaster.com': 'Vail',
  'mike.chen@slopesmaster.com': 'Park City',
  'emma.rodriguez@slopesmaster.com': 'Aspen'
};

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function clearCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) {
    return 0;
  }

  const batch = db.batch();
  snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
  await batch.commit();
  return snapshot.size;
}

async function seedMountains() {
  try {
    console.log('🌄 Seeding mountains...');

    const cleared = await clearCollection('mountains');
    if (cleared > 0) {
      console.log(`🧹 Cleared ${cleared} existing mountains`);
    }

    const mountainIdByName = new Map();
    const batch = db.batch();

    mountainSeeds.forEach((mountain) => {
      const mountainId = slugify(mountain.name);
      const ref = db.collection('mountains').doc(mountainId);
      mountainIdByName.set(mountain.name, mountainId);
      batch.set(ref, {
        ...mountain,
        snowReportUpdatedAt: timestamp,
        instructorIds: [],
        createdAt: timestamp,
        updatedAt: timestamp
      });
    });

    await batch.commit();
    console.log(`✅ Seeded ${mountainSeeds.length} mountains`);

    const instructorsSnapshot = await db.collection('users').where('role', '==', 'instructor').get();
    if (instructorsSnapshot.empty) {
      console.log('⚠️ No instructors found to backfill mountain assignments');
      return;
    }

    const seededMountainIds = mountainSeeds.map((mountain) => mountainIdByName.get(mountain.name));
    let fallbackIndex = 0;

    for (const instructorDoc of instructorsSnapshot.docs) {
      const instructor = instructorDoc.data();
      const matchedMountainName =
        instructorMountainByEmail[instructor.email] ||
        instructor.homeMountain ||
        mountainSeeds[fallbackIndex % mountainSeeds.length].name;

      const mountainId = mountainIdByName.get(matchedMountainName) || seededMountainIds[fallbackIndex % seededMountainIds.length];
      const mountainSeed = mountainSeeds.find((mountain) => mountainIdByName.get(mountain.name) === mountainId);

      if (!mountainId || !mountainSeed) {
        fallbackIndex += 1;
        continue;
      }

      await instructorDoc.ref.update({
        mountainId,
        homeMountain: mountainSeed.name
      });

      await db.collection('mountains').doc(mountainId).update({
        instructorIds: admin.firestore.FieldValue.arrayUnion(instructorDoc.id),
        updatedAt: timestamp
      });

      console.log(`👤 Assigned ${instructor.name || instructor.email} to ${mountainSeed.name}`);
      fallbackIndex += 1;
    }

    console.log('🎉 Mountain reseed completed successfully');
  } catch (error) {
    console.error('❌ Error seeding mountains:', error);
    process.exitCode = 1;
  }
}

seedMountains();
