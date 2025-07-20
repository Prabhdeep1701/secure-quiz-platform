import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['Student']);
    if (user instanceof NextResponse) return user; // Error response

    // Get all responses for this student
    const responsesRef = db.collection('responses');
    const responsesSnapshot = await responsesRef
      .where('student', '==', user.uid)
      .get();

    const responses = responsesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    // Get quiz information for each response
    const quizIds = [...new Set(responses.map(r => r.quiz))];
    const quizzesRef = db.collection('quizzes');
    
    const quizzes: any[] = [];
    for (const quizId of quizIds) {
      try {
        const quizDoc = await quizzesRef.doc(quizId).get();
        if (quizDoc.exists) {
          quizzes.push({
            id: quizDoc.id,
            ...quizDoc.data()
          });
        }
      } catch (error) {
        console.error(`Error fetching quiz ${quizId}:`, error);
      }
    }
    
    const quizMap = new Map(quizzes.map(q => [q.id, q]));

    // Process responses to include quiz information and readable answers
    // Only include responses where the quiz still exists
    const validResponses = responses.filter(response => quizMap.has(response.quiz));
    const deletedQuizResponses = responses.filter(response => !quizMap.has(response.quiz));
    
    if (deletedQuizResponses.length > 0) {
      console.log(`Found ${deletedQuizResponses.length} responses for deleted quizzes, filtering them out`);
    }
    
    const grades = validResponses.map(response => {
        const quiz = quizMap.get(response.quiz);
        
        // Convert answer indices to readable text
        const readableAnswers = response.answers?.map((answer: any, index: number) => {
          const question = quiz?.questions?.[index];
          if (!question) return 'Question not found';
          
          if (question.type === 'multiple-choice') {
            const selectedIndex = answer;
            return question.options && question.options[selectedIndex] 
              ? question.options[selectedIndex] 
              : `Option ${selectedIndex + 1}`;
          } else if (question.type === 'checkbox') {
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
            return answer || 'No answer';
          } else {
            return String(answer);
          }
        }) || [];

        // Calculate final score
        const finalScore = response.manualScore !== null && response.manualScore !== undefined 
          ? response.manualScore 
          : response.score;

        return {
          id: response.id,
          quizId: response.quiz,
          quizTitle: quiz?.title || 'Unknown Quiz',
          quizDescription: quiz?.description || '',
          autoScore: response.score,
          manualScore: response.manualScore,
          finalScore,
          feedback: response.feedback,
          isPublished: response.isPublished || false,
          readableAnswers,
          submittedAt: response.submittedAt?.toDate?.() || new Date(response.submittedAt),
          gradedAt: response.gradedAt?.toDate?.() || null
        };
      });

    // Only return published grades
    const publishedGrades = grades.filter(grade => grade.isPublished);

    return NextResponse.json({ grades: publishedGrades });
  } catch (error) {
    console.error('GET /api/student/grades error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 