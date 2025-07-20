import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['Student']);
    if (user instanceof NextResponse) return user; // Error response

    const quizzesRef = db.collection('quizzes');
    const quizzesSnapshot = await quizzesRef
      .where('status', '==', 'published')
      .get();

    const responsesRef = db.collection('responses');
    const responsesSnapshot = await responsesRef
      .where('student', '==', user.uid)
      .get();

    const quizzes = quizzesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    const responses = responsesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    const attemptedQuizIds = new Set(responses.map((r: any) => r.quiz));
    
    // Sort quizzes by createdAt descending
    quizzes.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    const quizList = quizzes.map((q: any) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      link: q.link,
      attempted: attemptedQuizIds.has(q.id),
      score: responses.find((r: any) => r.quiz === q.id)?.score ?? null,
    }));

    return NextResponse.json({ quizzes: quizList });
  } catch (error) {
    console.error('GET /api/student/quizzes error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 