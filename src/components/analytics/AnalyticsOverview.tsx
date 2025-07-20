"use client";
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsOverviewProps {
  onViewLessonAnalytics: (lessonId: string) => void;
}

interface OverviewData {
  overview: {
    totalLessons: number;
    publishedLessons: number;
    totalViews: number;
    totalUniqueViews: number;
    averageTimeSpent: number;
    overallCompletionRate: number;
    recentViews: number;
  };
  topLessons: Array<{
    id: string;
    title: string;
    status: string;
    totalViews: number;
    uniqueViews: number;
    averageTimeSpent: number;
    completionRate: number;
  }>;
  lessonsWithAnalytics: Array<{
    id: string;
    title: string;
    status: string;
    totalViews: number;
    uniqueViews: number;
    averageTimeSpent: number;
    completionRate: number;
  }>;
}

export default function AnalyticsOverview({ onViewLessonAnalytics }: AnalyticsOverviewProps) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/lessons/analytics/overview');
      if (res.ok) {
        const overviewData = await res.json();
        setData(overviewData);
      } else {
        setError('Failed to load analytics overview');
      }
    } catch (_err) {
      setError('Failed to load analytics overview');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) return <div className="p-4">Loading analytics overview...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!data) return <div className="p-4">No analytics data available</div>;

  const { overview, topLessons } = data;

  // Prepare data for charts
  const topLessonsChartData = topLessons.map(lesson => ({
    name: lesson.title.length > 20 ? lesson.title.substring(0, 20) + '...' : lesson.title,
    views: lesson.uniqueViews,
    completion: lesson.completionRate,
  }));

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{overview.totalLessons}</div>
          <div className="text-sm text-gray-600">Total Lessons</div>
          <div className="text-xs text-gray-500 mt-1">{overview.publishedLessons} published</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{overview.totalViews}</div>
          <div className="text-sm text-gray-600">Total Views</div>
          <div className="text-xs text-gray-500 mt-1">{overview.totalUniqueViews} unique</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{formatTime(overview.averageTimeSpent)}</div>
          <div className="text-sm text-gray-600">Avg. Time Spent</div>
          <div className="text-xs text-gray-500 mt-1">per lesson</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{overview.overallCompletionRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Completion Rate</div>
          <div className="text-xs text-gray-500 mt-1">{overview.recentViews} views this week</div>
        </div>
      </div>

      {/* Top Performing Lessons */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Top Performing Lessons</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topLessonsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* List */}
          <div>
            <div className="space-y-3">
              {topLessons.map((lesson, index) => (
                <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{lesson.title}</div>
                      <div className="text-sm text-gray-600">
                        {lesson.uniqueViews} views • {lesson.completionRate.toFixed(1)}% completion
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onViewLessonAnalytics(lesson.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* All Lessons Performance */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">All Lessons Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Lesson</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Views</th>
                <th className="text-left py-2">Unique Views</th>
                <th className="text-left py-2">Avg. Time</th>
                <th className="text-left py-2">Completion</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.lessonsWithAnalytics
                .filter(lesson => lesson.status === 'published')
                .sort((a, b) => b.uniqueViews - a.uniqueViews)
                .map((lesson) => (
                  <tr key={lesson.id} className="border-b">
                    <td className="py-2 font-medium">{lesson.title}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        lesson.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {lesson.status}
                      </span>
                    </td>
                    <td className="py-2">{lesson.totalViews}</td>
                    <td className="py-2">{lesson.uniqueViews}</td>
                    <td className="py-2">{formatTime(lesson.averageTimeSpent)}</td>
                    <td className="py-2">{lesson.completionRate.toFixed(1)}%</td>
                    <td className="py-2">
                      <button
                        onClick={() => onViewLessonAnalytics(lesson.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Analytics
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 