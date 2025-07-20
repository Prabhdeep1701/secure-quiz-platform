import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/firebase-admin';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req, ['Student']);
    if (user instanceof NextResponse) return user; // Error response

    const { id } = await params;
    
    // Verify lesson exists and belongs to the teacher
    const lessonRef = db.collection('lessons').doc(id);
    const lessonDoc = await lessonRef.get();
    
    if (!lessonDoc.exists) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    
    const lessonData = lessonDoc.data();
    if (!lessonData || lessonData.author !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get analytics data
    const analyticsRef = db.collection('lessonAnalytics');
    const analyticsSnapshot = await analyticsRef
      .where('lesson', '==', id)
      .get();
    
    if (analyticsSnapshot.empty) {
      return NextResponse.json({
        lesson: {
          id: lessonDoc.id,
          title: lessonData.title,
          description: lessonData.description,
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

    const analyticsDoc = analyticsSnapshot.docs[0];
    const analytics = analyticsDoc.data() as any;

    // Calculate additional metrics
    const views = analytics.views || [];
    const recentViews = views
      .sort((a: any, b: any) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
      .slice(0, 10);

    const viewsByDate = views.reduce((acc: any, view: any) => {
      const date = new Date(view.viewedAt).toDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      lesson: {
        id: lessonDoc.id,
        title: lessonData.title,
        description: lessonData.description,
      },
      analytics: {
        totalViews: analytics.totalViews || 0,
        uniqueViews: analytics.uniqueViews || 0,
        averageTimeSpent: Math.round(analytics.averageTimeSpent || 0),
        completionRate: Math.round((analytics.completionRate || 0) * 100) / 100,
        views: views,
        recentViews,
        viewsByDate,
        lastViewed: analytics.lastViewed,
      }
    });
  } catch (error) {
    console.error('POST /api/lessons/[id]/analytics error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 