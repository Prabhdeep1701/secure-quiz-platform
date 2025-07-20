import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check Firebase configuration
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    // Check if all required config values are present
    const missingConfig = Object.entries(firebaseConfig)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingConfig.length > 0) {
      return NextResponse.json({
        status: 'error',
        message: 'Missing Firebase configuration',
        missing: missingConfig,
        config: firebaseConfig
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Firebase configuration is complete',
      config: {
        ...firebaseConfig,
        apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'MISSING',
        projectId: firebaseConfig.projectId
      }
    });
  } catch (error) {
    console.error('Firebase debug error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 