import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const user = await requireAuth(req, ['Teacher']);
  if (user instanceof NextResponse) return user; // Error response

  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const aiPrompt = `Create a quiz based on the following requirements: ${prompt}

Please generate a JSON response with the following structure:
{
  "title": "Quiz Title",
  "description": "Brief description of the quiz",
  "questions": [
    {
      "type": "multiple-choice|checkbox|short-answer|paragraph",
      "question": "Question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"], // only for multiple-choice and checkbox
      "correctAnswers": [0, 2], // array of correct option indices (0-based), only for multiple-choice and checkbox
      "required": true
    }
  ]
}

Guidelines:
- For multiple-choice questions, provide 4 options and specify correct answer(s)
- For checkbox questions, provide 4 options and specify correct answer(s) - can be multiple
- For short-answer and paragraph questions, don't include options or correctAnswers
- Make questions clear and educational
- Ensure correct answers are properly indexed (0-based)
- Include a mix of question types based on the prompt
- Make the quiz engaging and informative

Return only the JSON response, no additional text.`;

    const result = await model.generateContent(aiPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const quizData = JSON.parse(jsonMatch[0]);

    // Validate the generated quiz structure
    if (!quizData.title || !quizData.questions || !Array.isArray(quizData.questions)) {
      throw new Error('Invalid quiz structure generated');
    }

    // Validate each question
    for (const question of quizData.questions) {
      if (!question.type || !question.question) {
        throw new Error('Invalid question structure');
      }
      
      if ((question.type === 'multiple-choice' || question.type === 'checkbox') && 
          (!question.options || !Array.isArray(question.options) || question.options.length < 2)) {
        throw new Error('Multiple choice questions must have at least 2 options');
      }
    }

    return NextResponse.json({ quiz: quizData });

  } catch (error: any) {
    console.error('AI Quiz Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz. Please try again with a different prompt.' },
      { status: 500 }
    );
  }
} 