import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Lesson from '@/models/Lesson';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'Teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, description, content, aiGenerated, originalPrompt } = await req.json();
  if (!title || !content) {
    return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
  }

  await dbConnect();
  const lesson = await Lesson.create({
    title,
    description,
    content,
    author: (session.user as any).id,
    aiGenerated: aiGenerated || false,
    originalPrompt,
    status: 'draft'
  });

  return NextResponse.json({ lesson }, { status: 201 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'Teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const lessons = await Lesson.find({ author: (session.user as any).id }).sort({ createdAt: -1 });
  return NextResponse.json({ lessons });
} 