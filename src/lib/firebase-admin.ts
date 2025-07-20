import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Check if required environment variables are present
const requiredEnvVars = {
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
};

// Validate environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Firebase Admin environment variables: ${missingVars.join(', ')}\n` +
    'Please check your .env.local file and ensure all Firebase Admin variables are set.'
  );
}

const firebaseAdminConfig = {
  credential: cert({
    projectId: requiredEnvVars.FIREBASE_PROJECT_ID!,
    clientEmail: requiredEnvVars.FIREBASE_CLIENT_EMAIL!,
    privateKey: requiredEnvVars.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  }),
};

// Initialize Firebase Admin
const app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth }; 