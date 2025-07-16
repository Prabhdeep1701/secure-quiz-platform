import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Lesson from '@/models/Lesson';
import LessonAnalytics from '@/models/LessonAnalytics';
import User from '@/models/User';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'Teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;
  
  // Verify lesson exists and belongs to the teacher
  const lesson = await Lesson.findById(id);
  if (!lesson || lesson.author.toString() !== (session.user as any).id) {
    return NextResponse.json({ error: 'Lesson not found or unauthorized' }, { status: 404 });
  }

  // Get analytics data
  const analytics = await LessonAnalytics.findOne({ lesson: id }).populate('views.student', 'name email');
  
  if (!analytics) {
    return NextResponse.json({
      lesson: {
        _id: lesson._id,
        title: lesson.title,
        description: lesson.description,
      },
      analytics: {
        totalViews: 0,
        uniqueViews: 0,
        averageTimeSpent: 0,
        completionRate: 0,
        views: [],
        lastViewed: null,
      }
    });
  }

  // Calculate additional metrics
  const recentViews = analytics.views
    .sort((a: any, b: any) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
    .slice(0, 10);

  const viewsByDate = analytics.views.reduce((acc: any, view: any) => {
    const date = new Date(view.viewedAt).toDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    lesson: {
      _id: lesson._id,
      title: lesson.title,
      description: lesson.description,
    },
    analytics: {
      totalViews: analytics.totalViews,
      uniqueViews: analytics.uniqueViews,
      averageTimeSpent: Math.round(analytics.averageTimeSpent),
      completionRate: Math.round(analytics.completionRate * 100) / 100,
      views: analytics.views,
      recentViews,
      viewsByDate,
      lastViewed: analytics.lastViewed,
    }
  });
} 