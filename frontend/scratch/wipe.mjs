import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function wipe() {
  console.log('--- STARTING STANDALONE SUPER WIPE ---');

  const collections = [
    'users',
    'items',
    'requests',
    'notifications',
    'payments',
    'reviews',
    'referral_points_history'
  ];

  for (const collectionName of collections) {
    console.log(`Wiping collection: ${collectionName}`);
    const snapshot = await db.collection(collectionName).get();
    
    // Batch delete
    const batchSize = 400;
    for (let i = 0; i < snapshot.docs.length; i += batchSize) {
      const batch = db.batch();
      const chunk = snapshot.docs.slice(i, i + batchSize);
      chunk.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`Deleted ${chunk.length} docs from ${collectionName}`);
    }

    // Subcollections
    if (collectionName === 'requests') {
       for (const doc of snapshot.docs) {
         const messagesSnap = await doc.ref.collection('messages').get();
         const msgBatch = db.batch();
         messagesSnap.forEach(msgDoc => msgBatch.delete(msgDoc.ref));
         await msgBatch.commit();
       }
    }
  }

  // Auth Users
  console.log('Wiping all Firebase Auth users...');
  let nextPageToken;
  let totalAuthDeleted = 0;
  do {
    const listUsersResult = await auth.listUsers(1000, nextPageToken);
    const uids = listUsersResult.users.map(user => user.uid);
    if (uids.length > 0) {
      await auth.deleteUsers(uids);
      totalAuthDeleted += uids.length;
      console.log(`Deleted ${uids.length} users`);
    }
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  console.log(`--- WIPE COMPLETE: ${totalAuthDeleted} users deleted ---`);
}

wipe().catch(err => {
  console.error('Wipe failed:', err);
  process.exit(1);
});
