import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Quiz from '@/models/Quiz';

export async function GET(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  await dbConnect();
  const { quizId } = await params;
  console.log('Looking for quiz with link:', quizId);
  const quiz = await Quiz.findOne({ link: quizId, status: 'published' });
  console.log('Quiz found:', !!quiz);
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }
  return NextResponse.json({ quiz });
}

export async function PUT(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'Teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { title, description, questions, status } = await req.json();
  await dbConnect();
  const { quizId } = await params;
  const quiz = await Quiz.findOneAndUpdate(
    { _id: quizId, author: (session.user as any).id },
    { title, description, questions, status },
    { new: true }
  );
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found or unauthorized' }, { status: 404 });
  }
  return NextResponse.json({ quiz });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'Teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const { quizId } = await params;
  const quiz = await Quiz.findOneAndDelete({ _id: quizId, author: (session.user as any).id });
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found or unauthorized' }, { status: 404 });
  }
  return NextResponse.json({ message: 'Quiz deleted' });
} 