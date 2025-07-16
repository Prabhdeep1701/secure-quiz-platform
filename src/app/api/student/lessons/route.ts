import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lesson from '@/models/Lesson';

export async function GET() {
  await dbConnect();
  const lessons = await Lesson.find({ status: 'published' })
    .populate('author', 'name')
    .sort({ createdAt: -1 });
  return NextResponse.json({ lessons });
} 