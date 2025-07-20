import { NextRequest, NextResponse } from 'next/server';
import { auth } from './firebase-admin';
import { db } from './firebase-admin';

export async function getAuthUser(request: NextRequest) {
  try {
    console.log('getAuthUser called');
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Invalid auth header format');
      return null;
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('Token length:', token.length);
    
    if (!token) {
      console.log('No token found');
      return null;
    }

    console.log('Verifying token...');
    const decodedToken = await auth.verifyIdToken(token);
    console.log('Token verified, UID:', decodedToken.uid);
    
    // Get user role from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    console.log('User doc exists:', userDoc.exists);
    
    if (!userDoc.exists) {
      console.log('User document not found in Firestore');
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: null,
        role: null,
      };
    }

    const userData = userDoc.data();
    console.log('User data retrieved');
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: userData?.name,
      role: userData?.role,
    };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest, allowedRoles?: string[]) {
  const user = await getAuthUser(request);
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return user;
} 