import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

/**
 * POST /api/admin/sync
 * Scans Firebase Authentication for all users and ensures they have a matching profile in Firestore.
 */
export async function POST(request: Request) {
  try {
    const admin = getFirebaseAdmin();
    const adminDb = admin.firestore();

    // 1. Security Check: Verify Bearer Token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    // 2. Authorization Check: Verify Admin Role
    const requestingUserDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (requestingUserDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Administrator privileges required' }, { status: 403 });
    }

    // 3. Synchronization Logic
    // Fetch all users from Firebase Auth
    const authUsersResult = await admin.auth().listUsers();
    const authUsers = authUsersResult.users;

    // Fetch existing Firestore profile IDs
    const existingUsersSnapshot = await adminDb.collection('users').get();
    const existingUserIds = new Set(existingUsersSnapshot.docs.map(doc => doc.id));

    // Identify "Ghost Accounts" (in Auth but not in Firestore)
    const missingUsers = authUsers.filter(u => !existingUserIds.has(u.uid));

    if (missingUsers.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'Your community records are already fully synchronized!' 
      });
    }

    // 4. Batch Processing
    // Firestore batches are limited to 500 operations
    const MAX_BATCH_SIZE = 500;
    let syncedCount = 0;

    for (let i = 0; i < missingUsers.length; i += MAX_BATCH_SIZE) {
      const batch = adminDb.batch();
      const currentBatch = missingUsers.slice(i, i + MAX_BATCH_SIZE);

      currentBatch.forEach(u => {
        const userRef = adminDb.collection('users').doc(u.uid);
        batch.set(userRef, {
          name: u.displayName || u.email?.split('@')[0] || 'Neighbor',
          email: u.email || '',
          verified: false,
          trustScore: 80, // Default trust for real users
          totalReviews: 0,
          itemsLentCount: 0,
          itemsBorrowedCount: 0,
          memberSince: u.metadata.creationTime ? new Date(u.metadata.creationTime) : admin.firestore.FieldValue.serverTimestamp(),
          role: u.email === 'admin@gmail.com' ? 'admin' : 'user',
          isBlocked: false
        });
        syncedCount++;
      });

      await batch.commit();
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully synchronized ${syncedCount} neighbor profiles.`,
      syncedCount 
    });

  } catch (error: any) {
    console.error('Synchronization Engine Error:', error);
    
    // Check if configuration is missing
    if (error.message?.includes('projectId')) {
       return NextResponse.json({ 
         error: 'Sync engine is not configured. Please add your Service Account credentials to .env.local' 
       }, { status: 500 });
    }

    return NextResponse.json({ error: error.message || 'Synchronization failed' }, { status: 500 });
  }
}
