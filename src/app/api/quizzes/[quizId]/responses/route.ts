import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase-admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    const user = await requireAuth(req, ['Teacher']);
    if (user instanceof NextResponse) return user; // Error response
    
    const { quizId } = await params;
    
    // Get the quiz to verify ownership and get questions
    const quizRef = db.collection('quizzes').doc(quizId);
    const quizDoc = await quizRef.get();
    
    if (!quizDoc.exists) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    
    const quizData = quizDoc.data();
    if (!quizData || quizData.author !== user.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get responses for this quiz
    const responsesRef = db.collection('responses');
    const responsesSnapshot = await responsesRef
      .where('quiz', '==', quizId)
      .get();
    
    const responses = responsesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
    
    // Get student information for all responses
    const studentIds = [...new Set(responses.map(r => r.student))];
    const usersRef = db.collection('users');
    
    // Get users by document IDs
    const users: any[] = [];
    for (const studentId of studentIds) {
      try {
        const userDoc = await usersRef.doc(studentId).get();
        if (userDoc.exists) {
          users.push({
            id: userDoc.id,
            ...userDoc.data()
          });
        }
      } catch (error) {
        console.error(`Error fetching user ${studentId}:`, error);
      }
    }
    
    const userMap = new Map(users.map(u => [u.id, u]));
    
    // Process responses to include student names and readable answers
    const processedResponses = responses.map(response => {
      const student = userMap.get(response.student);
      
      // Convert answer indices to readable text
      const readableAnswers = response.answers.map((answer: any, index: number) => {
        const question = quizData.questions[index];
        if (!question) return 'Question not found';
        
        if (question.type === 'multiple-choice') {
          // Single choice - convert index to option text
          const selectedIndex = answer;
          return question.options && question.options[selectedIndex] 
            ? question.options[selectedIndex] 
            : `Option ${selectedIndex + 1}`;
        } else if (question.type === 'checkbox') {
          // Multiple choice - convert indices to option texts
          if (Array.isArray(answer)) {
            return answer.map((idx: number) => 
              question.options && question.options[idx] 
                ? question.options[idx] 
                : `Option ${idx + 1}`
            ).join(', ');
          } else {
            return String(answer);
          }
        } else if (question.type === 'short-answer' || question.type === 'paragraph') {
          // Text answers
          return answer || 'No answer';
        } else {
          return String(answer);
        }
      });
      
      // Calculate final score (manual score takes precedence, auto-score as fallback)
      const finalScore = response.manualScore !== null && response.manualScore !== undefined 
        ? response.manualScore 
        : response.score || 0;
      
      return {
        ...response,
        studentName: student?.name || 'Unknown Student',
        studentEmail: student?.email || 'No email',
        readableAnswers,
        finalScore,
        submittedAt: response.submittedAt?.toDate?.() || new Date(response.submittedAt),
        gradedAt: response.gradedAt?.toDate?.() || null
      };
    });
    
    return NextResponse.json({ responses: processedResponses });
  } catch (error) {
    console.error('GET /api/quizzes/[quizId]/responses error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 