import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

/**
 * POST /api/admin/super-wipe
 * DANGEROUS: Wipes all Firestore collections and all Firebase Auth users.
 */
export async function POST(request: Request) {
  try {
    const admin = getFirebaseAdmin();
    const adminDb = admin.firestore();
    const adminAuth = admin.auth();

    console.log('--- STARTING SUPER WIPE ---');

    const collections = [
      'users',
      'items',
      'requests',
      'notifications',
      'payments',
      'reviews',
      'referral_points_history'
    ];

    const stats = {
      docsDeleted: 0,
      usersDeleted: 0,
      errors: [] as string[]
    };

    // 1. Delete all Firestore documents
    for (const collectionName of collections) {
      console.log(`Wiping collection: ${collectionName}`);
      const snapshot = await adminDb.collection(collectionName).get();
      
      const batchSize = 400; // Firestore batch limit is 500
      for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = adminDb.batch();
        const chunk = snapshot.docs.slice(i, i + batchSize);
        chunk.forEach(doc => {
          batch.delete(doc.ref);
          stats.docsDeleted++;
        });
        await batch.commit();
      }

      // Special case for subcollections (e.g., requests/messages)
      if (collectionName === 'requests') {
        for (const doc of snapshot.docs) {
          const messagesSnap = await doc.ref.collection('messages').get();
          const msgBatch = adminDb.batch();
          messagesSnap.forEach(msgDoc => {
            msgBatch.delete(msgDoc.ref);
            stats.docsDeleted++;
          });
          await msgBatch.commit();
        }
      }
    }

    // 2. Delete all Auth Users
    console.log('Wiping all Firebase Auth users...');
    let nextPageToken;
    do {
      const listUsersResult = await adminAuth.listUsers(1000, nextPageToken);
      const uids = listUsersResult.users.map(user => user.uid);
      
      if (uids.length > 0) {
        const deleteResult = await adminAuth.deleteUsers(uids);
        stats.usersDeleted += deleteResult.successCount;
        if (deleteResult.failureCount > 0) {
          deleteResult.errors.forEach(err => stats.errors.push(`Auth Error: ${err.error.message}`));
        }
      }
      
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log('--- SUPER WIPE COMPLETE ---', stats);

    return NextResponse.json({
      success: true,
      message: 'System successfully wiped clean.',
      stats
    });

  } catch (error: any) {
    console.error('Super Wipe Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
