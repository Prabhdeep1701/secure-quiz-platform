import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Test Firebase Admin Auth
    const testUser = await auth.listUsers(1);
    
    return NextResponse.json({
      status: 'ok',
      message: 'Firebase Admin Auth is working',
      userCount: testUser.users.length,
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  } catch (error) {
    console.error('Firebase Auth debug error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      projectId: process.env.FIREBASE_PROJECT_ID
    }, { status: 500 });
  }
} 