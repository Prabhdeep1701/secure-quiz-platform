import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'Teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all lessons by the teacher
    const lessonsRef = db.collection('lessons');
    const lessonsSnapshot = await lessonsRef
      .where('author', '==', (session.user as any).id)
      .get();
    
    const lessons = lessonsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    const lessonIds = lessons.map(lesson => lesson.id);

    // Get analytics for all lessons
    const analyticsRef = db.collection('lessonAnalytics');
    const analyticsSnapshot = await analyticsRef
      .where('lesson', 'in', lessonIds)
      .get();
    
    const analytics = analyticsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    // Calculate overview metrics
    const totalLessons = lessons.length;
    const publishedLessons = lessons.filter(lesson => lesson.status === 'published').length;
    
    const totalViews = analytics.reduce((sum, a) => sum + (a.totalViews || 0), 0);
    const totalUniqueViews = analytics.reduce((sum, a) => sum + (a.uniqueViews || 0), 0);
    
    const totalTimeSpent = analytics.reduce((sum, a) => sum + ((a.averageTimeSpent || 0) * (a.uniqueViews || 0)), 0);
    const averageTimeSpent = totalUniqueViews > 0 ? totalTimeSpent / totalUniqueViews : 0;
    
    const totalCompletions = analytics.reduce((sum, a) => {
      const completions = (a.views || []).filter((view: any) => view.completed).length;
      return sum + completions;
    }, 0);
    const overallCompletionRate = totalUniqueViews > 0 ? (totalCompletions / totalUniqueViews) * 100 : 0;

    // Get top performing lessons
    const lessonsWithAnalytics = lessons.map(lesson => {
      const lessonAnalytics = analytics.find(a => a.lesson === lesson.id);
      return {
        id: lesson.id,
        title: lesson.title,
        status: lesson.status,
        totalViews: lessonAnalytics?.totalViews || 0,
        uniqueViews: lessonAnalytics?.uniqueViews || 0,
        averageTimeSpent: lessonAnalytics?.averageTimeSpent || 0,
        completionRate: lessonAnalytics?.completionRate || 0,
      };
    });

    const topLessons = lessonsWithAnalytics
      .filter(lesson => lesson.status === 'published')
      .sort((a, b) => b.uniqueViews - a.uniqueViews)
      .slice(0, 5);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentViews = analytics.reduce((total, a) => {
      const recentViewsCount = (a.views || []).filter((view: any) => 
        new Date(view.viewedAt) >= sevenDaysAgo
      ).length;
      return total + recentViewsCount;
    }, 0);

    return NextResponse.json({
      overview: {
        totalLessons,
        publishedLessons,
        totalViews,
        totalUniqueViews,
        averageTimeSpent: Math.round(averageTimeSpent),
        overallCompletionRate: Math.round(overallCompletionRate * 100) / 100,
        recentViews,
      },
      topLessons,
      lessonsWithAnalytics,
    });
  } catch (error) {
    console.error('GET /api/lessons/analytics/overview error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 