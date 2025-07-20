import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase-admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    const { quizId } = await params;
    console.log('Looking for quiz with link:', quizId);
    
    const quizzesRef = db.collection('quizzes');
    const quizSnapshot = await quizzesRef
      .where('link', '==', quizId)
      .where('status', '==', 'published')
      .get();
    
    console.log('Quiz found:', !quizSnapshot.empty);
    
    if (quizSnapshot.empty) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    
    const quizDoc = quizSnapshot.docs[0];
    const quiz = { id: quizDoc.id, ...quizDoc.data() };
    
    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('GET /api/quizzes/[quizId] error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    const user = await requireAuth(req, ['Teacher']);
    if (user instanceof NextResponse) return user; // Error response
    
    const { title, description, questions, status } = await req.json();
    const { quizId } = await params;
    
    const quizRef = db.collection('quizzes').doc(quizId);
    const quizDoc = await quizRef.get();
    
    if (!quizDoc.exists) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    
    const quizData = quizDoc.data();
    if (quizData?.author !== user.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await quizRef.update({
      title,
      description,
      questions,
      status,
      updatedAt: new Date(),
    });
    
    const updatedDoc = await quizRef.get();
    const quiz = { id: updatedDoc.id, ...updatedDoc.data() };
    
    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('PUT /api/quizzes/[quizId] error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    const user = await requireAuth(req, ['Teacher']);
    if (user instanceof NextResponse) return user; // Error response
    
    const { quizId } = await params;
    
    const quizRef = db.collection('quizzes').doc(quizId);
    const quizDoc = await quizRef.get();
    
    if (!quizDoc.exists) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    
    const quizData = quizDoc.data();
    if (quizData?.author !== user.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Delete all responses for this quiz first
    const responsesRef = db.collection('responses');
    const responsesSnapshot = await responsesRef
      .where('quiz', '==', quizId)
      .get();
    
    // Delete responses in batches (Firestore batch limit is 500)
    const batch = db.batch();
    let deletedResponses = 0;
    
    responsesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      deletedResponses++;
    });
    
    if (deletedResponses > 0) {
      await batch.commit();
      console.log(`Deleted ${deletedResponses} responses for quiz ${quizId}`);
    }
    
    // Now delete the quiz
    await quizRef.delete();
    
    return NextResponse.json({ 
      message: 'Quiz and all related responses deleted successfully',
      deletedResponses
    });
  } catch (error) {
    console.error('DELETE /api/quizzes/[quizId] error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 