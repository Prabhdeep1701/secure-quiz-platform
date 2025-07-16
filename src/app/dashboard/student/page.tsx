"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<'quizzes' | 'lessons'>('quizzes');

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !(session.user && (session.user as any).role === "Student")) {
      router.replace("/auth/signin");
      return;
    }
    fetchQuizzes();
    fetchLessons();
    // eslint-disable-next-line
  }, [session, status]);

  async function fetchQuizzes() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/student/quizzes");
    if (res.ok) {
      const data = await res.json();
      setQuizzes(data.quizzes);
    } else {
      setError("Failed to load quizzes.");
    }
    setLoading(false);
  }

  async function fetchLessons() {
    const res = await fetch("/api/student/lessons");
    if (res.ok) {
      const data = await res.json();
      setLessons(data.lessons);
    }
  }

  if (status === "loading" || !session || !(session.user && (session.user as any).role === "Student")) {
    return <div className="p-8">Loading...</div>;
  }
  if (loading) return <div className="p-8">Loading quizzes...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="btn btn-danger text-sm px-3 py-1"
        >
          Logout
        </button>
      </div>
      <div className="bg-white rounded shadow p-4">
        <div className="mb-4">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`px-4 py-2 ${activeTab === 'quizzes' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Quizzes
            </button>
            <button
              onClick={() => setActiveTab('lessons')}
              className={`px-4 py-2 ${activeTab === 'lessons' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Lessons
            </button>
          </div>
        </div>

        {activeTab === 'quizzes' ? (
          <>
            <h2 className="text-lg font-semibold mb-4">Available Quizzes</h2>
            {quizzes.length === 0 && <div className="text-gray-500">No quizzes available.</div>}
            <ul className="space-y-4">
              {quizzes.map((quiz) => (
                <li key={quiz._id} className="border rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold text-lg">{quiz.title}</div>
                    <div className="text-sm text-gray-600 mb-1">{quiz.description}</div>
                    <div className="text-xs text-gray-500 mb-1">
                      {quiz.attempted ? (
                        <span>Attempted</span>
                      ) : (
                        <span>Not Attempted</span>
                      )}
                      {quiz.attempted && quiz.score !== null && (
                        <span className="ml-2">| Score: <span className="font-bold">{quiz.score}</span></span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 md:mt-0">
                    {quiz.attempted ? (
                      <button
                        className="btn btn-disabled"
                        disabled
                      >
                        Attempted
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => router.push(`/quiz/${quiz.link}`)}
                      >
                        Attempt Quiz
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-4">Available Lessons</h2>
            {lessons.length === 0 && <div className="text-gray-500">No lessons available.</div>}
            <ul className="space-y-4">
              {lessons.map((lesson) => (
                <li key={lesson._id} className="border rounded p-4">
                  <div className="font-semibold text-lg">{lesson.title}</div>
                  <div className="text-sm text-gray-600 mb-2">{lesson.description}</div>
                  <div className="text-xs text-gray-500 mb-2">
                    By: {lesson.author?.name || 'Unknown'} 
                    {lesson.aiGenerated && <span className="ml-2 text-blue-600">• AI Generated</span>}
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => router.push(`/lesson/${lesson._id}`)}
                  >
                    View Lesson
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
} 