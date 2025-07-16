import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'Teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prompt } = await req.json();
  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const aiPrompt = `Create a comprehensive educational lesson based on this prompt: "${prompt}"

Please structure the lesson with:
1. A clear title
2. An engaging introduction
3. Main content sections with explanations
4. Key concepts and definitions
5. Examples or case studies
6. A summary or conclusion
7. Suggested activities or discussion points

Make it educational, engaging, and suitable for students. Format it with clear headings and structure.`;

    const result = await model.generateContent(aiPrompt);
    const response = await result.response;
    const content = response.text();

    return NextResponse.json({ 
      content,
      title: `AI Generated Lesson: ${prompt}`,
      description: `Lesson generated from prompt: ${prompt}`
    });
  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate lesson' }, { status: 500 });
  }
} 