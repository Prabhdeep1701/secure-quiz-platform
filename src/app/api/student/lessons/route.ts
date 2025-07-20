import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const lessonsRef = db.collection('lessons');
    const lessonsSnapshot = await lessonsRef
      .where('status', '==', 'published')
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
    console.error('GET /api/student/lessons error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 