import { NextResponse, NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    console.log('Firestore user debug endpoint called');
    
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    console.log('Checking Firestore for user:', user.uid);

    // Get user document from Firestore
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ 
        error: 'User document not found in Firestore',
        uid: user.uid,
        email: user.email
      }, { status: 404 });
    }

    const userData = userDoc.data();
    console.log('User data found:', userData);

    return NextResponse.json({
      uid: user.uid,
      email: user.email,
      firestoreData: userData,
      documentExists: true,
      createdAt: userData?.createdAt?.toDate?.() || userData?.createdAt,
      updatedAt: userData?.updatedAt?.toDate?.() || userData?.updatedAt
    });
  } catch (error) {
    console.error('Firestore user debug error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 