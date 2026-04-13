import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    
    // Verify auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 0 });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserId, updates, reason } = await req.json();

    if (!targetUserId || !updates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Safety check: Only allow specific keys to be updated via this endpoint
    const allowedKeys = [
      'referralPoints', 
      'referralCount', 
      'totalReviews', 
      'trustScore', 
      'itemsLentCount', 
      'itemsBorrowedCount'
    ];
    
    const updateKeys = Object.keys(updates);
    const isValid = updateKeys.every(key => allowedKeys.includes(key));

    if (!isValid) {
      return NextResponse.json({ error: 'Prohibited fields in update' }, { status: 403 });
    }

    // Log the update for auditing
    console.log(`[StatsUpdate] By: ${decodedToken.uid}, Target: ${targetUserId}, Reason: ${reason}, Updates:`, updates);

    const userRef = db.collection('users').doc(targetUserId);
    await userRef.update(updates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Stats Update API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
