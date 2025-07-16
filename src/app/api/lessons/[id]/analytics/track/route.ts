import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Lesson from '@/models/Lesson';
import LessonAnalytics from '@/models/LessonAnalytics';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'Student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { timeSpent, completed } = await req.json();
  
  await dbConnect();
  const { id } = await params;
  
  // Verify lesson exists and is published
  const lesson = await Lesson.findById(id);
  if (!lesson || lesson.status !== 'published') {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }

  // Find or create analytics record
  let analytics = await LessonAnalytics.findOne({ lesson: id });
  if (!analytics) {
    analytics = await LessonAnalytics.create({
      lesson: id,
      totalViews: 0,
      uniqueViews: 0,
      averageTimeSpent: 0,
      completionRate: 0,
      views: [],
    });
  }

  const studentId = (session.user as any).id;
  
  // Check if this is a new view or an update
  const existingViewIndex = analytics.views.findIndex(
    (view: any) => view.student.toString() === studentId
  );

  if (existingViewIndex === -1) {
    // New view
    analytics.views.push({
      student: studentId,
      viewedAt: new Date(),
      timeSpent: timeSpent || 0,
      completed: completed || false,
    });
    analytics.uniqueViews += 1;
  } else {
    // Update existing view
    analytics.views[existingViewIndex].viewedAt = new Date();
    if (timeSpent !== undefined) {
      analytics.views[existingViewIndex].timeSpent = timeSpent;
    }
    if (completed !== undefined) {
      analytics.views[existingViewIndex].completed = completed;
    }
  }

  analytics.totalViews += 1;
  analytics.lastViewed = new Date();

  // Calculate averages
  const totalTimeSpent = analytics.views.reduce((sum: number, view: any) => sum + (view.timeSpent || 0), 0);
  analytics.averageTimeSpent = analytics.views.length > 0 ? totalTimeSpent / analytics.views.length : 0;
  
  const completedViews = analytics.views.filter((view: any) => view.completed).length;
  analytics.completionRate = analytics.views.length > 0 ? (completedViews / analytics.views.length) * 100 : 0;

  await analytics.save();

  return NextResponse.json({ success: true });
} 