import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase-admin';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'Student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { timeSpent, completed } = await req.json();
    const { id } = await params;
    
    // Verify lesson exists and is published
    const lessonRef = db.collection('lessons').doc(id);
    const lessonDoc = await lessonRef.get();
    
    if (!lessonDoc.exists) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    
    const lessonData = lessonDoc.data();
    if (lessonData?.status !== 'published') {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Find or create analytics record
    const analyticsRef = db.collection('lessonAnalytics');
    const analyticsSnapshot = await analyticsRef
      .where('lesson', '==', id)
      .get();
    
    let analyticsDoc;
    let analyticsData: any = {};
    
    if (analyticsSnapshot.empty) {
      // Create new analytics record
      const newAnalyticsRef = await analyticsRef.add({
        lesson: id,
        totalViews: 0,
        uniqueViews: 0,
        averageTimeSpent: 0,
        completionRate: 0,
        views: [],
        lastViewed: new Date(),
      });
      analyticsDoc = await newAnalyticsRef.get();
      analyticsData = analyticsDoc.data() || {};
    } else {
      analyticsDoc = analyticsSnapshot.docs[0];
      analyticsData = analyticsDoc.data() || {};
    }

    const studentId = (session.user as any).id;
    
    // Check if this is a new view or an update
    const views = analyticsData?.views || [];
    const existingViewIndex = views.findIndex(
      (view: any) => view.student === studentId
    );

    if (existingViewIndex === -1) {
      // New view
      views.push({
        student: studentId,
        viewedAt: new Date(),
        timeSpent: timeSpent || 0,
        completed: completed || false,
      });
      analyticsData.uniqueViews = (analyticsData.uniqueViews || 0) + 1;
    } else {
      // Update existing view
      views[existingViewIndex].viewedAt = new Date();
      if (timeSpent !== undefined) {
        views[existingViewIndex].timeSpent = timeSpent;
      }
      if (completed !== undefined) {
        views[existingViewIndex].completed = completed;
      }
    }

    analyticsData.totalViews = (analyticsData.totalViews || 0) + 1;
    analyticsData.lastViewed = new Date();
    analyticsData.views = views;

    // Calculate averages
    const totalTimeSpent = views.reduce((sum: number, view: any) => sum + (view.timeSpent || 0), 0);
    analyticsData.averageTimeSpent = views.length > 0 ? totalTimeSpent / views.length : 0;
    
    const completedViews = views.filter((view: any) => view.completed).length;
    analyticsData.completionRate = views.length > 0 ? (completedViews / views.length) * 100 : 0;

    // Update the analytics document
    await analyticsDoc.ref.update(analyticsData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/lessons/[id]/analytics/track error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 