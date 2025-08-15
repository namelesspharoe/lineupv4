import admin from 'firebase-admin';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(
  fs.readFileSync(join(__dirname, '../firebase-service-account.json'), 'utf8')
);

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
