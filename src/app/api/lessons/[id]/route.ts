import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Lesson from '@/models/Lesson';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'Teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, description, content, status } = await req.json();
  await dbConnect();
  const { id } = await params;
  const lesson = await Lesson.findOneAndUpdate(
    { _id: id, author: (session.user as any).id },
    { title, description, content, status },
    { new: true }
  );
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found or unauthorized' }, { status: 404 });
  }
  return NextResponse.json({ lesson });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'Teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;
  const lesson = await Lesson.findOneAndDelete({ _id: id, author: (session.user as any).id });
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found or unauthorized' }, { status: 404 });
  }
  return NextResponse.json({ message: 'Lesson deleted' });
} 