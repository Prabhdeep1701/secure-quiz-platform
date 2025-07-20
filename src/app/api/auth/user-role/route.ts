import { NextResponse, NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    console.log('User role endpoint called');
    
    // Check if Authorization header is present
    const authHeader = req.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('No Authorization header found');
      return NextResponse.json({ error: 'No Authorization header' }, { status: 401 });
    }

    // Try to get authenticated user
    const user = await getAuthUser(req);
    console.log('Auth user result:', user ? 'User found' : 'No user');
    
    if (!user) {
      console.log('getAuthUser returned null');
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    console.log('User UID:', user.uid);

    // Get user role from Firestore
    const userDoc = await db.collection('users').doc(user.uid).get();
    console.log('User document exists:', userDoc.exists);
    
    if (!userDoc.exists) {
      console.log('User document not found in Firestore');
      return NextResponse.json({ 
        error: 'User not found in database',
        uid: user.uid,
        email: user.email
      }, { status: 404 });
    }

    const userData = userDoc.data();
    console.log('User data retrieved:', { role: userData?.role, name: userData?.name });
    
    return NextResponse.json({ 
      role: userData?.role || 'Student',
      name: userData?.name,
      email: userData?.email
    });
  } catch (error) {
    console.error('Get user role error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 