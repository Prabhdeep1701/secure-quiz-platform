"use client";
import { useAuth } from "@/components/ui/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import QuizList from "@/components/quiz/QuizList";
import QuizBuilder from "@/components/quiz/QuizBuilder";
import QuizResponses from "@/components/quiz/QuizResponses";
import AILessonBuilder from "@/components/lesson/AILessonBuilder";
import AIQuizBuilder from "@/components/quiz/AIQuizBuilder";
import LessonList from "@/components/lesson/LessonList";
import LessonEditor from "@/components/lesson/LessonEditor";
import AnalyticsOverview from "@/components/analytics/AnalyticsOverview";
import LessonAnalytics from "@/components/analytics/LessonAnalytics";
import { authenticatedFetch } from "@/lib/api-client";

export default function TeacherDashboard() {
  const { user, userRole, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editQuiz, setEditQuiz] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [messageTimeout, setMessageTimeout] = useState<NodeJS.Timeout | null>(null);

  const showMessage = (msg: string) => {
    if (messageTimeout) clearTimeout(messageTimeout);
    setMessage(msg);
    const timeout = setTimeout(() => setMessage(""), 3000);
    setMessageTimeout(timeout);
  };
  const [showResponses, setShowResponses] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const [responsesQuiz, setResponsesQuiz] = useState<any>(null);
  const [showAIBuilder, setShowAIBuilder] = useState(false);
  const [showAIQuizBuilder, setShowAIQuizBuilder] = useState(false);
  const [lessons, setLessons] = useState<any[]>([]);
  const [showLessonEditor, setShowLessonEditor] = useState(false);
  const [editLesson, setEditLesson] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'quizzes' | 'lessons' | 'analytics'>('quizzes');
  const [showLessonAnalytics, setShowLessonAnalytics] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [cleaningUp, setCleaningUp] = useState(false);

  useEffect(() => {
    console.log('Teacher dashboard useEffect:', { user: !!user, userRole, authLoading });
    if (authLoading) return;
    if (!user || userRole !== "Teacher") {
      console.log('Redirecting to signin - User:', !!user, 'Role:', userRole);
      // Temporary: Add a delay to see if role gets set
      setTimeout(() => {
        console.log('After delay - User:', !!user, 'Role:', userRole);
        if (!user || userRole !== "Teacher") {
          router.replace("/auth/signin");
        }
      }, 2000);
    } else {
      console.log('Loading teacher dashboard data');
      fetchQuizzes();
      fetchLessons();
    }
  }, [user, userRole, authLoading, router]);

  async function fetchQuizzes() {
    setLoading(true);
    try {
      const res = await authenticatedFetch("/api/quizzes");
      if (!res.ok) {
        console.error('Failed to fetch quizzes:', res.status, res.statusText);
        const errorData = await res.json().catch(() => ({}));
        console.error('Error details:', errorData);
        setQuizzes([]);
        return;
      }
      const data = await res.json();
      setQuizzes(data.quizzes || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLessons() {
    try {
      const res = await authenticatedFetch("/api/lessons");
      if (!res.ok) {
        console.error('Failed to fetch lessons:', res.status, res.statusText);
        const errorData = await res.json().catch(() => ({}));
        console.error('Error details:', errorData);
        setLessons([]);
        return;
      }
      const data = await res.json();
      setLessons(data.lessons || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      setLessons([]);
    }
  }

  const handleCreate = () => {
    setEditQuiz(null);
    setShowBuilder(true);
  };

  const handleEdit = (quiz: any) => {
    setEditQuiz(quiz);
    setShowBuilder(true);
  };

  const handleDelete = async (quiz: any) => {
    if (!confirm("Delete this quiz? This will also delete all student responses and grades.")) return;
    try {
      const res = await authenticatedFetch(`/api/quizzes/${quiz.id}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        const message = data.deletedResponses > 0 
          ? `Quiz deleted. Also deleted ${data.deletedResponses} student response(s).`
          : "Quiz deleted.";
        showMessage(message);
        // Immediately update the state
        setQuizzes(prevQuizzes => prevQuizzes.filter(q => q.id !== quiz.id));
      } else {
        showMessage("Failed to delete quiz.");
      }
    } catch {
      showMessage("Failed to delete quiz.");
    }
  };

  const handlePublish = async (quiz: any, status: "published" | "draft") => {
    try {
      const res = await authenticatedFetch(`/api/quizzes/${quiz.id}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        showMessage(status === "published" ? "Quiz published." : "Quiz unpublished.");
        // Immediately update the state
        setQuizzes(prevQuizzes => prevQuizzes.map(q => 
          q.id === quiz.id ? { ...q, status } : q
        ));
      } else {
        showMessage("Failed to update quiz status.");
      }
    } catch {
      showMessage("Failed to update quiz status.");
    }
  };

  const handleCopyLink = (quiz: any) => {
    navigator.clipboard.writeText(`${window.location.origin}/quiz/${quiz.link}`);
    showMessage("Link copied!");
  };

  const handleViewResponses = async (quiz: any) => {
    setLoading(true);
    const res = await authenticatedFetch(`/api/quizzes/${quiz.id}/responses`);
    if (res.ok) {
      const data = await res.json();
      setResponses(data.responses);
      setResponsesQuiz(quiz);
      setShowResponses(true);
    }
    setLoading(false);
  };

  const handleLessonEdit = (lesson: any) => {
    setEditLesson(lesson);
    setShowLessonEditor(true);
  };

  const handleLessonDelete = async (lesson: any) => {
    if (!confirm("Delete this lesson?")) return;
    try {
      const res = await authenticatedFetch(`/api/lessons/${lesson.id}`, { method: "DELETE" });
      if (res.ok) {
        showMessage("Lesson deleted.");
        // Immediately update the state
        setLessons(prevLessons => prevLessons.filter(l => l.id !== lesson.id));
      } else {
        showMessage("Failed to delete lesson.");
      }
    } catch {
      showMessage("Failed to delete lesson.");
    }
  };

  const handleLessonPublish = async (lesson: any, status: "published" | "draft") => {
    try {
      const res = await authenticatedFetch(`/api/lessons/${lesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lesson, status }),
      });
      if (res.ok) {
        showMessage(status === "published" ? "Lesson published." : "Lesson unpublished.");
        // Immediately update the state
        setLessons(prevLessons => prevLessons.map(l => 
          l.id === lesson.id ? { ...l, status } : l
        ));
      } else {
        showMessage("Failed to update lesson status.");
      }
    } catch {
      showMessage("Failed to update lesson status.");
    }
  };

  const handleLessonSave = () => {
    fetchLessons();
  };

  const handleViewLessonAnalytics = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setShowLessonAnalytics(true);
  };

  const handleAIQuizSave = async (quiz: any) => {
    try {
      const res = await authenticatedFetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quiz.title,
          description: quiz.description,
          questions: quiz.questions,
          status: "draft"
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        showMessage("AI Quiz saved successfully!");
        setShowAIQuizBuilder(false);
        // Immediately add the new quiz to the state
        setQuizzes(prevQuizzes => [data.quiz, ...prevQuizzes]);
      } else {
        showMessage("Failed to save quiz.");
      }
    } catch {
      showMessage("Failed to save quiz.");
    }
  };

  const handleBuilderClose = (refresh = false) => {
    setShowBuilder(false);
    setEditQuiz(null);
    if (refresh) fetchQuizzes();
  };

  const handleCleanupOrphanedResponses = async () => {
    if (!confirm('This will clean up any orphaned responses for deleted quizzes. Continue?')) return;
    
    setCleaningUp(true);
    try {
      const res = await authenticatedFetch('/api/admin/cleanup-orphaned-responses', {
        method: 'POST'
      });
      
      if (res.ok) {
        const data = await res.json();
        showMessage(`Cleanup completed. Deleted ${data.deletedCount} orphaned responses.`);
      } else {
        showMessage('Failed to cleanup orphaned responses.');
      }
    } catch {
      showMessage('Failed to cleanup orphaned responses.');
    } finally {
      setCleaningUp(false);
    }
  };

  if (authLoading || !user || userRole !== "Teacher") {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
        <button
          onClick={signOut}
          className="btn btn-danger text-sm px-3 py-1"
        >
          Logout
        </button>
      </div>
      <div className="bg-white rounded shadow p-4 relative">
        <div className="mb-4 flex justify-between items-center">
          <div className="flex gap-2">
            <button onClick={handleCreate} className="btn btn-primary">+ Create New Quiz</button>
            <button onClick={() => setShowAIQuizBuilder(true)} className="btn btn-info">+ Create AI Quiz</button>
            <button onClick={() => setShowAIBuilder(true)} className="btn btn-success">+ Create AI Lesson</button>
          </div>
          <div className="flex items-center gap-2">
            {message && <span className="text-green-600 text-sm">{message}</span>}
            <button 
              onClick={async () => {
                setRefreshing(true);
                try {
                  if (activeTab === 'quizzes') {
                    await fetchQuizzes();
                  } else if (activeTab === 'lessons') {
                    await fetchLessons();
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
              onClick={handleCleanupOrphanedResponses}
              disabled={cleaningUp}
              className="btn btn-warning text-sm px-3 py-1"
              title="Clean up orphaned responses for deleted quizzes"
            >
              {cleaningUp ? '🧹 Cleaning...' : '🧹 Cleanup'}
            </button>
          </div>
        </div>

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
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 ${activeTab === 'analytics' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Sidebar QuizBuilder overlay */}
        {showBuilder && (
          <div className="fixed top-0 right-0 h-full w-full z-50 pointer-events-none">
            <div className="absolute top-0 right-0 h-full w-[420px] bg-white shadow-2xl border-l border-gray-200 p-4 pointer-events-auto overflow-y-auto">
              <QuizBuilder quiz={editQuiz} onClose={handleBuilderClose} />
            </div>
          </div>
        )}

        {/* Main dashboard content remains interactive */}
        {showAIBuilder ? (
          <AILessonBuilder onClose={() => setShowAIBuilder(false)} />
        ) : showAIQuizBuilder ? (
          <AIQuizBuilder onClose={() => setShowAIQuizBuilder(false)} onSave={handleAIQuizSave} />
        ) : showLessonEditor && editLesson ? (
          <LessonEditor lesson={editLesson} onClose={() => { setShowLessonEditor(false); setEditLesson(null); }} onSave={handleLessonSave} />
        ) : showResponses && responsesQuiz ? (
          <div>
            <button onClick={() => setShowResponses(false)} className="mb-2 bg-gray-300 px-3 py-1 rounded">Back to Quizzes</button>
            <QuizResponses 
              responses={responses} 
              quiz={responsesQuiz} 
              onClose={() => {
                setShowResponses(false);
                fetchQuizzes(); // Refresh to get updated grades
              }}
            />
          </div>
        ) : activeTab === 'quizzes' ? (
          <QuizList
            quizzes={quizzes}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPublish={handlePublish}
            onCopyLink={handleCopyLink}
            onViewResponses={handleViewResponses}
          />
        ) : activeTab === 'lessons' ? (
          <LessonList
            lessons={lessons}
            onEdit={handleLessonEdit}
            onDelete={handleLessonDelete}
            onPublish={handleLessonPublish}
            onViewAnalytics={handleViewLessonAnalytics}
          />
        ) : (
          <AnalyticsOverview onViewLessonAnalytics={handleViewLessonAnalytics} />
        )}

        {showLessonAnalytics && selectedLessonId && (
          <LessonAnalytics
            lessonId={selectedLessonId}
            onClose={() => {
              setShowLessonAnalytics(false);
              setSelectedLessonId('');
            }}
          />
        )}
      </div>
    </main>
  );
} 