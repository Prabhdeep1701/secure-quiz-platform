import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase-admin';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req, ['Teacher']);
    if (user instanceof NextResponse) return user; // Error response

    const { title, description, content, status } = await req.json();
    const { id } = await params;
    
    const lessonRef = db.collection('lessons').doc(id);
    const lessonDoc = await lessonRef.get();
    
    if (!lessonDoc.exists) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    
    const lessonData = lessonDoc.data();
    if (lessonData?.author !== user.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await lessonRef.update({
      title,
      description,
      content,
      status,
      updatedAt: new Date(),
    });
    
    const updatedDoc = await lessonRef.get();
    const lesson = { id: updatedDoc.id, ...updatedDoc.data() };
    
    return NextResponse.json({ lesson });
  } catch (error) {
    console.error('PUT /api/lessons/[id] error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req, ['Teacher']);
    if (user instanceof NextResponse) return user; // Error response

    const { id } = await params;
    
    const lessonRef = db.collection('lessons').doc(id);
    const lessonDoc = await lessonRef.get();
    
    if (!lessonDoc.exists) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    
    const lessonData = lessonDoc.data();
    if (lessonData?.author !== user.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await lessonRef.delete();
    
    return NextResponse.json({ message: 'Lesson deleted' });
  } catch (error) {
    console.error('DELETE /api/lessons/[id] error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 