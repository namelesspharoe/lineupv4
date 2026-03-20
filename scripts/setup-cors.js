import admin from 'firebase-admin';
import { loadServiceAccountJson } from './resolve-service-account.js';

const serviceAccount = loadServiceAccountJson();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'concierge-95495.appspot.com'
});

const bucket = admin.storage().bucket();

async function setCors() {
  try {
    const corsConfiguration = [
      {
        origin: [
          'http://localhost:5173',
          'http://localhost:3000', 
          'http://localhost:8080',
          'http://localhost:4173',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:3000'
        ],
        method: [
          'GET',
          'POST', 
          'PUT',
          'DELETE',
          'HEAD',
          'OPTIONS'
        ],
        maxAgeSeconds: 3600,
        responseHeader: [
          'Content-Type',
          'Authorization', 
          'Content-Length',
          'User-Agent',
          'x-goog-resumable',
          'x-goog-encryption-algorithm',
          'x-goog-meta-*'
        ]
      }
    ];

    await bucket.setCorsConfiguration(corsConfiguration);
    console.log('✅ CORS configuration set successfully!');
  } catch (error) {
    console.error('❌ Error setting CORS configuration:', error);
  }
}

setCors();
