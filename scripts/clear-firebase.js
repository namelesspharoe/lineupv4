import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc,
  doc,
  query,
  where 
} from 'firebase/firestore';
import { 
  getAuth
} from 'firebase/auth';

// Firebase config
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

// Test email domains to identify seeded users
const testDomains = ['slopesmaster.com', 'email.com'];

async function clearFirebase() {
  try {
    console.log('🧹 Starting Firebase cleanup...');
    
    // Clear Firestore collections
    console.log('🗑️ Clearing Firestore collections...');
    
    // Clear lessons
    const lessonsSnapshot = await getDocs(collection(db, 'lessons'));
    for (const doc of lessonsSnapshot.docs) {
      await deleteDoc(doc.ref);
    }
    console.log(`✅ Cleared ${lessonsSnapshot.docs.length} lessons`);
    
    // Clear instructor availability
    const availabilitySnapshot = await getDocs(collection(db, 'instructorAvailability'));
    for (const doc of availabilitySnapshot.docs) {
      await deleteDoc(doc.ref);
    }
    console.log(`✅ Cleared ${availabilitySnapshot.docs.length} availability slots`);
    
    // Clear kid profiles
    const kidProfilesSnapshot = await getDocs(collection(db, 'kid_profiles'));
    for (const doc of kidProfilesSnapshot.docs) {
      await deleteDoc(doc.ref);
    }
    console.log(`✅ Cleared ${kidProfilesSnapshot.docs.length} kid profiles`);
    
    // Clear test users from Firestore
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let deletedUsers = 0;
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      if (testDomains.some(domain => userData.email?.includes(domain))) {
        await deleteDoc(doc.ref);
        deletedUsers++;
      }
    }
    console.log(`✅ Cleared ${deletedUsers} test users from Firestore`);
    
    // Note: Firebase Auth users need to be deleted manually from the Firebase Console
    // or using the Firebase Admin SDK (which requires server-side setup)
    console.log('\n⚠️  Note: Firebase Auth users need to be deleted manually from the Firebase Console');
    console.log('   Go to Authentication > Users and delete users with these domains:');
    testDomains.forEach(domain => console.log(`   - ${domain}`));
    
    console.log('\n🎉 Firebase cleanup completed!');
    console.log('   You can now run "npm run seed" to populate with fresh test data.');
    
  } catch (error) {
    console.error('❌ Error clearing Firebase:', error);
  }
}

// Run the cleanup function
clearFirebase(); 