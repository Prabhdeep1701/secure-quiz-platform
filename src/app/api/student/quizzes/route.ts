import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Quiz from '@/models/Quiz';
import Response from '@/models/Response';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'Student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const quizzes = await Quiz.find({ status: 'published' }).sort({ createdAt: -1 });
  const responses = await Response.find({ student: (session.user as any).id });
  const attemptedQuizIds = new Set(responses.map((r: any) => r.quiz.toString()));
  const quizList = quizzes.map((q: any) => ({
    _id: q._id,
    title: q.title,
    description: q.description,
    link: q.link,
    attempted: attemptedQuizIds.has(q._id.toString()),
    score: responses.find((r: any) => r.quiz.toString() === q._id.toString())?.score ?? null,
  }));
  return NextResponse.json({ quizzes: quizList });
} 