import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase-admin';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['Teacher']);
    if (user instanceof NextResponse) return user; // Error response

    const { title, description, questions, status } = await req.json();
    if (!title || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const quizzesRef = db.collection('quizzes');
    const link = nanoid(10);
    const quizRef = await quizzesRef.add({
      title,
      description,
      questions,
      status: status || 'draft',
      author: user.uid,
      link,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const quizDoc = await quizRef.get();
    const quiz = { id: quizDoc.id, ...quizDoc.data() };

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (error) {
    console.error('POST /api/quizzes error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['Teacher']);
    if (user instanceof NextResponse) return user; // Error response

    const quizzesRef = db.collection('quizzes');
    const quizzesSnapshot = await quizzesRef
      .where('author', '==', user.uid)
      .get();

    const quizzes = quizzesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    // Sort in memory by createdAt descending
    quizzes.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error('GET /api/quizzes error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 