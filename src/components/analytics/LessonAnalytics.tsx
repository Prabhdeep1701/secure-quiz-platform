"use client";
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface LessonAnalyticsProps {
  lessonId: string;
  onClose: () => void;
}

interface AnalyticsData {
  lesson: {
    _id: string;
    title: string;
    description: string;
  };
  analytics: {
    totalViews: number;
    uniqueViews: number;
    averageTimeSpent: number;
    completionRate: number;
    views: any[];
    recentViews: any[];
    viewsByDate: any;
    lastViewed: string | null;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function LessonAnalytics({ lessonId, onClose }: LessonAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [lessonId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/lessons/${lessonId}/analytics`);
      if (res.ok) {
        const analyticsData = await res.json();
        setData(analyticsData);
      } else {
        setError('Failed to load analytics');
      }
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading analytics...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!data) return <div className="p-4">No analytics data available</div>;

  const { lesson, analytics } = data;

  // Prepare data for charts
  const viewsByDateData = Object.entries(analytics.viewsByDate || {}).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString(),
    views: count,
  }));

  const completionData = [
    { name: 'Completed', value: Math.round(analytics.completionRate), color: '#00C49F' },
    { name: 'Not Completed', value: 100 - Math.round(analytics.completionRate), color: '#FF8042' },
  ];

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Lesson Analytics: {lesson.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{analytics.totalViews}</div>
            <div className="text-sm text-gray-600">Total Views</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{analytics.uniqueViews}</div>
            <div className="text-sm text-gray-600">Unique Views</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{formatTime(analytics.averageTimeSpent)}</div>
            <div className="text-sm text-gray-600">Avg. Time Spent</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{analytics.completionRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Completion Rate</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Views Over Time */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Views Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={viewsByDateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Completion Rate */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Completion Rate</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={completionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {completionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Views */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Recent Views</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Student</th>
                  <th className="text-left py-2">Viewed At</th>
                  <th className="text-left py-2">Time Spent</th>
                  <th className="text-left py-2">Completed</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentViews.map((view: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{view.student?.name || 'Unknown'}</td>
                    <td className="py-2">{new Date(view.viewedAt).toLocaleString()}</td>
                    <td className="py-2">{formatTime(view.timeSpent || 0)}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        view.completed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {view.completed ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {analytics.lastViewed && (
          <div className="mt-4 text-sm text-gray-600">
            Last viewed: {new Date(analytics.lastViewed).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
} 