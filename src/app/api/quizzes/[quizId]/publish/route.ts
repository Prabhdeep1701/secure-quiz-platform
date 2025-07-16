import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Quiz from '@/models/Quiz';

export async function PATCH(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'Teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { status } = await req.json();
  if (!['published', 'draft'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }
  await dbConnect();
  const { quizId } = await params;
  const quiz = await Quiz.findOneAndUpdate(
    { _id: quizId, author: (session.user as any).id },
    { status },
    { new: true }
  );
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found or unauthorized' }, { status: 404 });
  }
  return NextResponse.json({ quiz });
} 