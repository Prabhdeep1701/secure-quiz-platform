import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check client-side Firebase configuration
    const clientConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    // Validate the configuration
    const missingFields = Object.entries(clientConfig)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return NextResponse.json({
        status: 'error',
        message: 'Missing client-side Firebase configuration',
        missing: missingFields
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Client-side Firebase configuration is complete',
      config: {
        apiKey: clientConfig.apiKey ? `${clientConfig.apiKey.substring(0, 10)}...` : 'MISSING',
        authDomain: clientConfig.authDomain,
        projectId: clientConfig.projectId,
        appId: clientConfig.appId
      }
    });
  } catch (error) {
    console.error('Firebase client debug error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 