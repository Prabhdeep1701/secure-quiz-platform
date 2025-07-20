import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['Teacher']);
    if (user instanceof NextResponse) return user; // Error response

    // Get all responses
    const responsesRef = db.collection('responses');
    const responsesSnapshot = await responsesRef.get();
    
    const responses = responsesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    // Get all quiz IDs
    const quizIds = [...new Set(responses.map(r => r.quiz))];
    const quizzesRef = db.collection('quizzes');
    
    // Check which quizzes exist
    const existingQuizIds = new Set<string>();
    for (const quizId of quizIds) {
      try {
        const quizDoc = await quizzesRef.doc(quizId).get();
        if (quizDoc.exists) {
          existingQuizIds.add(quizId);
        }
      } catch (error) {
        console.error(`Error checking quiz ${quizId}:`, error);
      }
    }

    // Find orphaned responses
    const orphanedResponses = responses.filter(response => !existingQuizIds.has(response.quiz));
    
    if (orphanedResponses.length === 0) {
      return NextResponse.json({ 
        message: 'No orphaned responses found',
        deletedCount: 0
      });
    }

    // Delete orphaned responses in batches
    const batch = db.batch();
    orphanedResponses.forEach(response => {
      batch.delete(responsesRef.doc(response.id));
    });

    await batch.commit();

    return NextResponse.json({ 
      message: `Cleaned up ${orphanedResponses.length} orphaned responses`,
      deletedCount: orphanedResponses.length
    });

  } catch (error) {
    console.error('POST /api/admin/cleanup-orphaned-responses error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 