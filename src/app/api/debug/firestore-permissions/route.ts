import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Test 1: Try to read from users collection
    let usersTest = 'Not tested';
    try {
      const usersSnapshot = await db.collection('users').limit(1).get();
      usersTest = `✅ Success - Found ${usersSnapshot.size} users`;
    } catch (error: any) {
      usersTest = `❌ Failed - ${error.message}`;
    }

    // Test 2: Try to write to a test collection
    let writeTest = 'Not tested';
    try {
      const testRef = db.collection('test-permissions');
      await testRef.add({
        test: true,
        timestamp: new Date(),
        message: 'Testing write permissions'
      });
      writeTest = '✅ Success - Write permission granted';
      
      // Clean up test document
      const testDocs = await testRef.where('test', '==', true).get();
      for (const doc of testDocs.docs) {
        await doc.ref.delete();
      }
    } catch (error: any) {
      writeTest = `❌ Failed - ${error.message}`;
    }

    // Test 3: Check if collections exist
    let collectionsTest = 'Not tested';
    try {
      const collections = await db.listCollections();
      const collectionNames = collections.map(col => col.id);
      collectionsTest = `✅ Success - Found collections: ${collectionNames.join(', ')}`;
    } catch (error: any) {
      collectionsTest = `❌ Failed - ${error.message}`;
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Firestore permissions test completed',
      tests: {
        readUsers: usersTest,
        writeTest: writeTest,
        listCollections: collectionsTest
      },
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Missing'
    });
  } catch (error) {
    console.error('Firestore permissions debug error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      projectId: process.env.FIREBASE_PROJECT_ID
    }, { status: 500 });
  }
} 