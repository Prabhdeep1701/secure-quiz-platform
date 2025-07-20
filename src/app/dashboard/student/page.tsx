"use client";
import { useAuth } from "@/components/ui/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authenticatedFetch } from "@/lib/api-client";

export default function StudentDashboard() {
  const { user, userRole, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('quizzes');

  useEffect(() => {
    if (authLoading) return;
    if (!user || userRole !== "Student") {
      router.replace("/auth/signin");
    } else {
      fetchData();
    }
  }, [user, userRole, authLoading, router]);

  async function fetchData() {
    setLoading(true);
    try {
      const [quizzesRes, lessonsRes, gradesRes] = await Promise.all([
        authenticatedFetch("/api/student/quizzes"),
        authenticatedFetch("/api/student/lessons"),
        authenticatedFetch("/api/student/grades")
      ]);

      if (quizzesRes.ok) {
        const data = await quizzesRes.json();
        setQuizzes(data.quizzes || []);
      }

      if (lessonsRes.ok) {
        const data = await lessonsRes.json();
        setLessons(data.lessons || []);
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
  }

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString();
  };

  if (authLoading || !user || userRole !== "Student") {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Student Dashboard</h1>
          <div className="flex gap-2">
            <button 
              onClick={async () => {
                setRefreshing(true);
                try {
                  if (activeTab === 'quizzes') {
                    await fetchData();
                  } else if (activeTab === 'lessons') {
                    await fetchData();
                  } else if (activeTab === 'grades') {
                    await fetchData();
                  }
                } finally {
                  setRefreshing(false);
                }
              }}
              disabled={refreshing}
              className="btn btn-secondary text-sm px-3 py-1"
            >
              {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
            </button>
            <button
              onClick={signOut}
              className="btn btn-danger text-sm px-3 py-1"
            >
              Logout
            </button>
          </div>
        </div>

      <div className="bg-white rounded shadow p-4">
        <div className="mb-4">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`px-4 py-2 ${activeTab === 'quizzes' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Available Quizzes
            </button>
            <button
              onClick={() => setActiveTab('lessons')}
              className={`px-4 py-2 ${activeTab === 'lessons' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Available Lessons
            </button>
            <button
              onClick={() => setActiveTab('grades')}
              className={`px-4 py-2 ${activeTab === 'grades' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              My Grades
            </button>
          </div>
        </div>

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
                  <li key={quiz.id} className="border rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-semibold text-lg">{quiz.title}</div>
                      <div className="text-sm text-gray-600 mb-2">{quiz.description}</div>
                      <div className="flex gap-2 text-sm">
                        {quiz.attempted && (
                          <span className="text-green-600 font-medium">✓ Attempted</span>
                        )}
                        {quiz.score !== null && (
                          <span className="text-blue-600">Score: {quiz.score}</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 md:mt-0">
                      {quiz.attempted ? (
                        <span className="text-gray-500">Already attempted</span>
                      ) : (
                        <button
                          onClick={() => router.push(`/quiz/${quiz.link}`)}
                          className="btn btn-primary"
                        >
                          Take Quiz
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'lessons' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Lessons</h2>
            {loading ? (
              <p>Loading lessons...</p>
            ) : lessons.length === 0 ? (
              <p className="text-gray-500">No lessons available.</p>
            ) : (
              <ul className="space-y-4">
                {lessons.map((lesson) => (
                  <li key={lesson.id} className="border rounded p-4">
                    <div className="font-semibold text-lg">{lesson.title}</div>
                    <div className="text-sm text-gray-600 mb-2">{lesson.description}</div>
                    <button
                      className="btn btn-primary"
                      onClick={() => router.push(`/lesson/${lesson.id}`)}
                    >
                      View Lesson
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
            {grades.length === 0 ? (
              <p className="text-gray-500">No grades published yet.</p>
            ) : (
              <div className="space-y-4">
                {grades.map((grade) => (
                  <div key={grade.id} className="border rounded p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{grade.quizTitle}</h3>
                        <p className="text-sm text-gray-600">{grade.quizDescription}</p>
                        <p className="text-sm text-gray-500">
                          Submitted: {formatDate(grade.submittedAt)}
                        </p>
                        {grade.gradedAt && (
                          <p className="text-sm text-gray-500">
                            Graded: {formatDate(grade.gradedAt)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {grade.finalScore}
                        </div>
                        <div className="text-sm text-gray-600">
                          {grade.autoScore !== grade.manualScore && (
                            <div className="text-xs text-gray-500">
                              Auto: {grade.autoScore} | Manual: {grade.manualScore}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {grade.feedback && (
                      <div className="bg-white p-3 rounded border">
                        <div className="font-medium text-sm mb-1">Teacher Feedback:</div>
                        <div className="text-sm text-gray-700">{grade.feedback}</div>
                      </div>
                    )}
                    
                    <details className="mt-3">
                      <summary className="cursor-pointer text-blue-600 text-sm font-medium">
                        View My Answers
                      </summary>
                      <div className="mt-2 space-y-2">
                        {grade.readableAnswers?.map((answer: string, index: number) => (
                          <div key={index} className="bg-white p-2 rounded text-sm">
                            <strong>Q{index + 1}:</strong> {answer}
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
} 