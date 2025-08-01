"use client";
import { useAuth } from "@/components/ui/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authenticatedFetch } from "@/lib/api-client";

export default function StudentDashboard() {
  const { user, userRole, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quizzes' | 'grades'>('quizzes');

  useEffect(() => {
    if (authLoading) return;
    if (!user || userRole !== "Student") {
      router.replace("/auth/signin");
      return;
    }
    fetchData();
  }, [user, userRole, authLoading, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [quizzesRes, gradesRes] = await Promise.all([
        authenticatedFetch("/api/student/quizzes"),
        authenticatedFetch("/api/student/grades"),
      ]);

      if (quizzesRes.ok) {
        const data = await quizzesRes.json();
        setQuizzes(data.quizzes || []);
      }

      if (gradesRes.ok) {
        const data = await gradesRes.json();
        setGrades(data.grades || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizClick = (quiz: any) => {
    if (quiz.status === 'published') {
      router.push(`/quiz/${quiz.link}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!user || userRole !== "Student") {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You must be a student to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
            <button
              onClick={signOut}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex px-6">
              <button
                onClick={() => setActiveTab('quizzes')}
                className={`px-4 py-2 ${activeTab === 'quizzes' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              >
                Available Quizzes
              </button>
              <button
                onClick={() => setActiveTab('grades')}
                className={`px-4 py-2 ${activeTab === 'grades' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              >
                My Grades
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'quizzes' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Available Quizzes</h2>
                {loading ? (
                  <p>Loading quizzes...</p>
                ) : quizzes.length === 0 ? (
                  <p className="text-gray-500">No quizzes available.</p>
                ) : (
                  <ul className="space-y-4">
                    {quizzes.map((quiz) => (
                      <li key={quiz.id} className="border rounded p-4">
                        <div className="font-semibold text-lg">{quiz.title}</div>
                        <div className="text-sm text-gray-600 mb-2">{quiz.description}</div>
                        <button
                          onClick={() => handleQuizClick(quiz)}
                          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                        >
                          Take Quiz
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === 'grades' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">My Grades</h2>
                {loading ? (
                  <p>Loading grades...</p>
                ) : grades.length === 0 ? (
                  <p className="text-gray-500">No grades available.</p>
                ) : (
                  <ul className="space-y-4">
                    {grades.map((grade) => (
                      <li key={grade.id} className="border rounded p-4">
                        <div className="font-semibold text-lg">{grade.quizTitle}</div>
                        <div className="text-sm text-gray-600 mb-2">
                          Score: {grade.score}/{grade.totalQuestions}
                        </div>
                        <div className="text-sm text-gray-600">
                          Percentage: {grade.percentage}%
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 