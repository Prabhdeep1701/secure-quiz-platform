import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['Teacher']);
    if (user instanceof NextResponse) return user; // Error response

    const { title, description, content, aiGenerated, originalPrompt } = await req.json();
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const lessonsRef = db.collection('lessons');
    const lessonRef = await lessonsRef.add({
      title,
      description,
      content,
      author: user.uid,
      aiGenerated: aiGenerated || false,
      originalPrompt,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const lessonDoc = await lessonRef.get();
    const lesson = { id: lessonDoc.id, ...lessonDoc.data() };

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    console.error('POST /api/lessons error:', error);
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

    const lessonsRef = db.collection('lessons');
    const lessonsSnapshot = await lessonsRef
      .where('author', '==', user.uid)
      .get();

    const lessons = lessonsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    // Sort in memory by createdAt descending
    lessons.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({ lessons });
  } catch (error) {
    console.error('GET /api/lessons error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 