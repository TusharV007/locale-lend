import * as admin from 'firebase-admin';

/**
 * Initializes the Firebase Admin SDK for server-side operations.
 * Requires FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY
 * to be set in the environment variables.
 */
export function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin;
  }

  // Handle new lines in private key from env
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      databaseURL: `https://${process.env.FIREBASE_ADMIN_PROJECT_ID}.firebaseio.com`
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }

  return admin;
}
