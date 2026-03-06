import { NextResponse } from 'next/server';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    const snap = await getDocs(collection(db, 'items'));
    let deletedCount = 0;
    const deletePromises: Promise<void>[] = [];
    
    for (const d of snap.docs) {
      if (d.id.startsWith('item-seed-')) {
        deletePromises.push(deleteDoc(d.ref));
        deletedCount++;
      }
    }
    
    await Promise.all(deletePromises);
    
    return NextResponse.json({ success: true, deletedCount });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
