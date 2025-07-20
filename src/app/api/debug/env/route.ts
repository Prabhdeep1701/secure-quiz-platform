import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'MISSING',
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'MISSING',
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    };

    // Test Firebase connection
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.limit(1).get();
    const userCount = usersSnapshot.size;

    return NextResponse.json({
      status: 'ok',
      environment: envCheck,
      firebase: {
        connected: true,
        userCount,
        projectId: process.env.FIREBASE_PROJECT_ID,
      },
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'MISSING',
        FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'MISSING',
      },
    }, { status: 500 });
  }
} 