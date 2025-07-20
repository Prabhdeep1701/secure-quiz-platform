import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase-admin';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    const user = await requireAuth(req, ['Teacher']);
    if (user instanceof NextResponse) return user; // Error response
    
    const { status } = await req.json();
    if (!['published', 'draft'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    
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
      status,
      updatedAt: new Date(),
    });
    
    const updatedDoc = await quizRef.get();
    const quiz = { id: updatedDoc.id, ...updatedDoc.data() };
    
    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('PATCH /api/quizzes/[quizId]/publish error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 