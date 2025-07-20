import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  console.log('Responses API called');
  
  const user = await requireAuth(req, ['Student']);
  if (user instanceof NextResponse) return user; // Error response
  
  console.log('User authenticated:', user.uid);
  
  const { quizId, answers } = await req.json();
  console.log('Request data:', { quizId, answers });
  
  if (!quizId || !answers) {
    console.log('Missing quizId or answers');
    return NextResponse.json({ error: 'Missing quizId or answers' }, { status: 400 });
  }
  
  // Find quiz by link
  const quizzesRef = db.collection('quizzes');
  const quizSnapshot = await quizzesRef.where('link', '==', quizId).where('status', '==', 'published').get();
  console.log('Quiz found:', !quizSnapshot.empty);
  
  if (quizSnapshot.empty) {
    console.log('Quiz not found');
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }
  
  const quizDoc = quizSnapshot.docs[0];
  const quiz = { id: quizDoc.id, ...quizDoc.data() } as any;
  
  // Prevent multiple submissions
  const responsesRef = db.collection('responses');
  const existingSnapshot = await responsesRef
    .where('quiz', '==', quizDoc.id)
    .where('student', '==', user.uid)
    .get();
  
  console.log('Existing response:', !existingSnapshot.empty);
  
  if (!existingSnapshot.empty) {
    console.log('Already attempted');
    return NextResponse.json({ error: 'You have already attempted this quiz.' }, { status: 409 });
  }
  
  // Store response without auto-grading
  const responseRef = await responsesRef.add({
    quiz: quizDoc.id,
    student: user.uid,
    answers,
    submittedAt: new Date(),
    // No auto-score - will be graded manually by teacher
  });
  
  console.log('Response created:', responseRef.id);
  return NextResponse.json({ 
    message: 'Your quiz has been submitted successfully! Your grades will be published shortly.',
    submitted: true
  });
} 