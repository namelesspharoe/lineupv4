/**
 * Firebase Admin SDK credentials for Node seed/admin scripts.
 * Never commit real keys — keep the JSON outside the repo or use env vars.
 */
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function getServiceAccountPath() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    return process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
  return join(__dirname, '../firebase-service-account.json');
}

export function loadServiceAccountJson() {
  const serviceAccountPath = getServiceAccountPath();

  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Missing Firebase Admin credentials (service account JSON)

  Looked for: ${serviceAccountPath}

  How to fix:
  1. Firebase Console → Project settings → Service accounts
  2. "Generate new private key" → save the downloaded .json file
  3. Either:
     • Save as: project/firebase-service-account.json
       (this filename is gitignored — do not commit it)

     • Or point to any path via env (PowerShell example):
       $env:FIREBASE_SERVICE_ACCOUNT_PATH="C:\\Users\\YOU\\Downloads\\your-key.json"
       npm run seed-mountains

     • Or use the standard Google env var:
       $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\path\\to\\key.json"
       npm run seed-mountains
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
}
