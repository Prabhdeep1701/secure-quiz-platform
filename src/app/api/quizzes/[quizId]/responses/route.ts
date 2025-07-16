import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Quiz from '@/models/Quiz';
import Response from '@/models/Response';
import User from '@/models/User';

export async function GET(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'Teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const { quizId } = await params;
  const quiz = await Quiz.findById(quizId);
  if (!quiz || quiz.author.toString() !== (session.user as any).id) {
    return NextResponse.json({ error: 'Quiz not found or unauthorized' }, { status: 404 });
  }
  const responses = await Response.find({ quiz: quiz._id }).populate('student', 'name email');
  return NextResponse.json({ responses });
} 