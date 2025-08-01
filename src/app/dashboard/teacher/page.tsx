"use client";
import { useAuth } from "@/components/ui/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import QuizList from "@/components/quiz/QuizList";
import QuizBuilder from "@/components/quiz/QuizBuilder";
import QuizResponses from "@/components/quiz/QuizResponses";
import AIQuizBuilder from "@/components/quiz/AIQuizBuilder";
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
  const [showAIQuizBuilder, setShowAIQuizBuilder] = useState(false);
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

  const handleAIQuizSave = async (quiz: any) => {
    try {
      const res = await authenticatedFetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quiz),
      });

      if (res.ok) {
        showMessage("Quiz created successfully!");
        setShowAIQuizBuilder(false);
        fetchQuizzes(); // Refresh the list
      } else {
        const errorData = await res.json();
        showMessage(errorData.error || "Failed to create quiz");
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      showMessage("Failed to create quiz");
    }
  };

  const handleBuilderClose = (refresh = false) => {
    setShowBuilder(false);
    setEditQuiz(null);
    if (refresh) {
      fetchQuizzes();
    }
  };

  const handleCleanupOrphanedResponses = async () => {
    if (!confirm("This will clean up orphaned responses. Continue?")) return;
    setCleaningUp(true);
    try {
      const res = await authenticatedFetch("/api/admin/cleanup-orphaned-responses", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        showMessage(`Cleanup completed. Removed ${data.removedCount} orphaned responses.`);
      } else {
        showMessage("Cleanup failed.");
      }
    } catch {
      showMessage("Cleanup failed.");
    } finally {
      setCleaningUp(false);
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

  if (!user || userRole !== "Teacher") {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You must be a teacher to access this page.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
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
          {/* Action Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => { setShowAIQuizBuilder(false); handleCreate(); }} 
                className="bg-purple-200/80 hover:bg-purple-300/80 text-purple-800 px-4 py-2 rounded-md font-medium transition-all backdrop-blur-sm shadow-sm"
              >
                + Create New Quiz
              </button>
              <button 
                onClick={() => { setShowBuilder(false); setShowAIQuizBuilder(true); }} 
                className="bg-teal-100/80 hover:bg-teal-200/80 text-teal-800 px-4 py-2 rounded-md font-medium transition-all backdrop-blur-sm shadow-sm"
              >
                + Create AI Quiz
              </button>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => { setRefreshing(true); fetchQuizzes().finally(() => setRefreshing(false)); }} 
                disabled={refreshing}
                className="bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 px-4 py-2 rounded-md font-medium transition-all backdrop-blur-sm shadow-sm disabled:opacity-50"
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
              <button 
                onClick={handleCleanupOrphanedResponses}
                disabled={cleaningUp}
                className="bg-yellow-100/80 hover:bg-yellow-200/80 text-yellow-800 px-4 py-2 rounded-md font-medium transition-all backdrop-blur-sm shadow-sm disabled:opacity-50"
              >
                {cleaningUp ? "Cleaning..." : "Cleanup"}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Only one builder/modal visible at a time, no sidebar */}
            {showBuilder ? (
              <div className="bg-stone-50/80 rounded-lg p-6 border border-purple-100/50 backdrop-blur-sm">
                <QuizBuilder quiz={editQuiz} onClose={handleBuilderClose} />
              </div>
            ) : showAIQuizBuilder ? (
              <div className="bg-stone-50/80 rounded-lg p-6 border border-purple-100/50 backdrop-blur-sm">
                <AIQuizBuilder onClose={() => setShowAIQuizBuilder(false)} onSave={handleAIQuizSave} />
              </div>
            ) : showResponses && responsesQuiz ? (
              <div className="space-y-4">
                <button 
                  onClick={() => setShowResponses(false)} 
                  className="bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 px-4 py-2 rounded-md font-medium transition-all backdrop-blur-sm shadow-sm"
                >
                  ← Back to Quizzes
                </button>
                <div className="bg-stone-50/80 rounded-lg p-6 border border-purple-100/50 backdrop-blur-sm">
                  <QuizResponses 
                    responses={responses} 
                    quiz={responsesQuiz} 
                    onClose={() => {
                      setShowResponses(false);
                      fetchQuizzes(); // Refresh to get updated grades
                    }}
                  />
                </div>
              </div>
            ) : (
              quizzes.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100/80 to-teal-50/60 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm backdrop-blur-sm">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No quizzes created yet.</h3>
                  <p className="text-gray-600 mb-6">Get started by creating your first quiz.</p>
                  <button 
                    onClick={() => { setShowAIQuizBuilder(false); handleCreate(); }} 
                    className="bg-purple-200/80 hover:bg-purple-300/80 text-purple-800 px-6 py-2 rounded-md font-medium transition-all backdrop-blur-sm shadow-sm"
                  >
                    Create Your First Quiz
                  </button>
                </div>
              ) : (
                <QuizList
                  quizzes={quizzes}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onPublish={handlePublish}
                  onCopyLink={handleCopyLink}
                  onViewResponses={handleViewResponses}
                />
              )
            )}
          </div>
        </div>
      </div>

      {/* Message Toast */}
      {message && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {message}
        </div>
      )}
    </div>
  );
}