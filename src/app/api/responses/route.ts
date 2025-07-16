import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Quiz from '@/models/Quiz';
import Response from '@/models/Response';

export async function POST(req: Request) {
  console.log('Responses API called');
  
  const session = await getServerSession(authOptions);
  console.log('Session:', session);
  
  if (!session || (session.user as any).role !== 'Student') {
    console.log('Unauthorized - session or role issue');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { quizId, answers } = await req.json();
  console.log('Request data:', { quizId, answers });
  
  if (!quizId || !answers) {
    console.log('Missing quizId or answers');
    return NextResponse.json({ error: 'Missing quizId or answers' }, { status: 400 });
  }
  
  await dbConnect();
  const quiz = await Quiz.findOne({ link: quizId, status: 'published' });
  console.log('Quiz found:', !!quiz);
  
  if (!quiz) {
    console.log('Quiz not found');
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }
  
  // Prevent multiple submissions
  const existing = await Response.findOne({ quiz: quiz._id, student: (session.user as any).id });
  console.log('Existing response:', !!existing);
  
  if (existing) {
    console.log('Already attempted');
    return NextResponse.json({ error: 'You have already attempted this quiz.' }, { status: 409 });
  }
  
  // Auto-grade objective questions
  let score = 0;
  quiz.questions.forEach((q: any, i: number) => {
    if (q.type === 'multiple-choice') {
      // Single choice - compare numbers
      const correct = q.correctAnswer;
      const given = answers[i];
      console.log(`Question ${i}: correct=${correct}, given=${given}`);
      if (correct === given) score++;
    } else if (q.type === 'checkbox') {
      // Multiple choice - compare arrays
      const correct = (q.correctAnswers || []).sort().join(',');
      const given = Array.isArray(answers[i]) ? answers[i].sort().join(',') : String(answers[i]);
      console.log(`Question ${i}: correct=${correct}, given=${given}`);
      if (correct && correct === given) score++;
    }
  });
  
  console.log('Final score:', score);
  
  const response = await Response.create({
    quiz: quiz._id,
    student: (session.user as any).id,
    answers,
    submittedAt: new Date(),
    score,
  });
  
  console.log('Response created:', response._id);
  return NextResponse.json({ message: 'Response submitted', score });
} 