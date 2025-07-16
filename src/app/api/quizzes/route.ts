import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Quiz from '@/models/Quiz';
import User from '@/models/User';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'Teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { title, description, questions, status } = await req.json();
  if (!title || !questions || !Array.isArray(questions)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  await dbConnect();
  const link = nanoid(10);
  const quiz = await Quiz.create({
    title,
    description,
    questions,
    status: status || 'draft',
    author: (session.user as any).id,
    link,
  });
  return NextResponse.json({ quiz }, { status: 201 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'Teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const quizzes = await Quiz.find({ author: (session.user as any).id }).sort({ createdAt: -1 });
  return NextResponse.json({ quizzes });
} 