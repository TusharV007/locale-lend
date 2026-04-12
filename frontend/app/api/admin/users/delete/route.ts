import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

/**
 * POST /api/admin/users/delete
 * Body: { userId: string }
 * Performs a permanent full-stack deletion (Firestore + Auth).
 */
export async function POST(request: Request) {
  try {
    const admin = getFirebaseAdmin();
    const adminDb = admin.firestore();
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

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

    // Prevent self-deletion via this route to avoid accidental lockouts
    if (userId === decodedToken.uid) {
      return NextResponse.json({ error: 'Cannot delete your own admin account via this tool for safety reasons.' }, { status: 400 });
    }

    console.log(`Starting Full Purge for user: ${userId}`);

    // 3. Cascade Firestore Deletion
    // A. Deleting User's Items and their associated data
    const itemsSnapshot = await adminDb.collection('items').where('ownerId', '==', userId).get();
    const itemIds = itemsSnapshot.docs.map(doc => doc.id);

    for (const itemId of itemIds) {
      // Find all requests for this item
      const requestsSnapshot = await adminDb.collection('requests').where('itemId', '==', itemId).get();
      
      for (const requestDoc of requestsSnapshot.docs) {
        // Delete messages sub-collection for each request
        const messagesSnapshot = await adminDb.collection('requests').doc(requestDoc.id).collection('messages').get();
        const msgBatch = adminDb.batch();
        messagesSnapshot.docs.forEach(doc => msgBatch.delete(doc.ref));
        await msgBatch.commit();
        
        // Delete the request itself
        await adminDb.collection('requests').doc(requestDoc.id).delete();
      }
      
      // Delete the item itself
      await adminDb.collection('items').doc(itemId).delete();
    }

    // B. Delete Notifications for this user
    const notificationsSnapshot = await adminDb.collection('notifications').where('userId', '==', userId).get();
    const notifBatch = adminDb.batch();
    notificationsSnapshot.docs.forEach(doc => notifBatch.delete(doc.ref));
    await notifBatch.commit();

    // C. Delete User Profile document
    await adminDb.collection('users').doc(userId).delete();

    // 4. Firebase Authentication Purge
    try {
      await admin.auth().deleteUser(userId);
      console.log(`Successfully deleted Auth account for: ${userId}`);
    } catch (authError: any) {
      // If user doc exists but auth account is already gone, we continue
      if (authError.code !== 'auth/user-not-found') {
        throw authError;
      }
      console.warn(`Auth account not found for ${userId}, continuing with Firestore cleanup confirmation.`);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Neighbor ${userId} has been permanently purged from the community and login records.` 
    });

  } catch (error: any) {
    console.error('Neighbor Purge Engine Error:', error);
    return NextResponse.json({ error: error.message || 'Deletion failed' }, { status: 500 });
  }
}
