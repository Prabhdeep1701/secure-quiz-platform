import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase-admin';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ responseId: string }> }) {
  try {
    const user = await requireAuth(req, ['Teacher']);
    if (user instanceof NextResponse) return user; // Error response

    const { responseId } = await params;
    const { manualScore, feedback, isPublished } = await req.json();

    // Get the response
    const responseRef = db.collection('responses').doc(responseId);
    const responseDoc = await responseRef.get();

    if (!responseDoc.exists) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    const responseData = responseDoc.data();
    if (!responseData) {
      return NextResponse.json({ error: 'Response data not found' }, { status: 404 });
    }

    // Get the quiz to verify ownership
    const quizRef = db.collection('quizzes').doc(responseData.quiz);
    const quizDoc = await quizRef.get();

    if (!quizDoc.exists) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const quizData = quizDoc.data();
    if (!quizData || quizData.author !== user.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update the response with manual grading
    await responseRef.update({
      manualScore: manualScore || null,
      feedback: feedback || null,
      isPublished: isPublished || false,
      gradedBy: user.uid,
      gradedAt: new Date(),
    });

    return NextResponse.json({ message: 'Response graded successfully' });
  } catch (error) {
    console.error('PUT /api/responses/[responseId]/grade error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 