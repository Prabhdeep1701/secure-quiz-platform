import { NextResponse, NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { uid, name, email, role, provider } = await req.json();
    
    if (!uid || !name || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the user is authenticated (but don't require specific role)
    const user = await getAuthUser(req);
    if (!user || user.uid !== uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already exists
    const existingUser = await db.collection('users').doc(uid).get();
    if (existingUser.exists) {
      return NextResponse.json({ 
        message: 'User already exists',
        user: { uid, name, email, role }
      });
    }

    // Create user document in Firestore
    await db.collection('users').doc(uid).set({
      name,
      email,
      role,
      createdAt: new Date(),
      provider: provider || 'email'
    });

    return NextResponse.json({ 
      message: 'User created successfully',
      user: { uid, name, email, role }
    }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 