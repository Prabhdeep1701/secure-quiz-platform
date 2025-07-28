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
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-sm border border-purple-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-300 mx-auto"></div>
          <p className="text-gray-700 mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-stone-200 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large abstract shapes */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-teal-100/30 to-teal-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-gradient-to-tr from-stone-200/40 to-amber-100/30 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-to-tl from-teal-50/40 to-stone-100/30 rounded-full blur-xl"></div>
        
        {/* Geometric shapes */}
        <div className="absolute top-1/4 right-1/3 w-32 h-32 bg-teal-100/20 rotate-45 rounded-lg blur-sm"></div>
        <div className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-stone-200/30 rotate-12 rounded-lg blur-sm"></div>
        <div className="absolute top-2/3 right-1/5 w-20 h-20 bg-teal-50/25 -rotate-12 rounded-full blur-sm"></div>
        
        {/* Subtle lines */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-200/20 to-transparent"></div>
        <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-stone-300/15 to-transparent"></div>
      </div>
      
      <div className="max-w-6xl mx-auto p-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h1>
          <button
            onClick={signOut}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/50">
          {/* Action Bar */}
          <div className="bg-gradient-to-r from-purple-50/80 to-stone-100/60 px-6 py-4 border-b border-purple-100/50 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => { setShowAIQuizBuilder(false); setShowAIBuilder(false); handleCreate(); }} 
                  className="bg-purple-200/80 hover:bg-purple-300/80 text-purple-800 px-4 py-2 rounded-md font-medium transition-all backdrop-blur-sm shadow-sm"
                >
                  + Create New Quiz
                </button>
                <button 
                  onClick={() => { setShowBuilder(false); setShowAIBuilder(false); setShowAIQuizBuilder(true); }} 
                  className="bg-teal-100/80 hover:bg-teal-200/80 text-teal-800 px-4 py-2 rounded-md font-medium transition-all backdrop-blur-sm shadow-sm"
                >
                  + Create AI Quiz
                </button>
                <button 
                  onClick={() => { setShowBuilder(false); setShowAIQuizBuilder(false); setShowAIBuilder(true); }} 
                  className="bg-stone-200/80 hover:bg-stone-300/80 text-stone-800 px-4 py-2 rounded-md font-medium transition-all backdrop-blur-sm shadow-sm"
                >
                  + Create AI Lesson
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                {message && (
                  <div className="bg-green-100/80 text-green-700 px-3 py-1 rounded-md text-sm backdrop-blur-sm">
                    {message}
                  </div>
                )}
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
                  className="bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-all disabled:opacity-50 backdrop-blur-sm shadow-sm"
                >
                  🔄 {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <button 
                  onClick={handleCleanupOrphanedResponses}
                  disabled={cleaningUp}
                  className="bg-yellow-100/80 hover:bg-yellow-200/80 text-yellow-700 px-3 py-2 rounded-md text-sm font-medium transition-all disabled:opacity-50 backdrop-blur-sm shadow-sm"
                  title="Clean up orphaned responses for deleted quizzes"
                >
                  🧹 {cleaningUp ? 'Cleaning...' : 'Cleanup'}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex px-6">
              <button
                onClick={() => setActiveTab('quizzes')}
                className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'quizzes' 
                    ? 'border-purple-400 text-purple-600 bg-purple-50' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Quizzes
              </button>
              <button
                onClick={() => setActiveTab('lessons')}
                className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'lessons' 
                    ? 'border-purple-400 text-purple-600 bg-purple-50' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Lessons
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'analytics' 
                    ? 'border-purple-400 text-purple-600 bg-purple-50' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Only one builder/modal visible at a time, no sidebar */}
            {showBuilder ? (
              <div className="bg-stone-50/80 rounded-lg p-6 border border-purple-100/50 backdrop-blur-sm">
                <QuizBuilder quiz={editQuiz} onClose={handleBuilderClose} />
              </div>
            ) : showAIBuilder ? (
              <div className="bg-stone-50/80 rounded-lg p-6 border border-purple-100/50 backdrop-blur-sm">
                <AILessonBuilder onClose={() => setShowAIBuilder(false)} />
              </div>
            ) : showAIQuizBuilder ? (
              <div className="bg-stone-50/80 rounded-lg p-6 border border-purple-100/50 backdrop-blur-sm">
                <AIQuizBuilder onClose={() => setShowAIQuizBuilder(false)} onSave={handleAIQuizSave} />
              </div>
            ) : showLessonEditor && editLesson ? (
              <div className="bg-stone-50/80 rounded-lg p-6 border border-purple-100/50 backdrop-blur-sm">
                <LessonEditor lesson={editLesson} onClose={() => { setShowLessonEditor(false); setEditLesson(null); }} onSave={handleLessonSave} />
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
            ) : activeTab === 'quizzes' ? (
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
                    onClick={() => { setShowAIQuizBuilder(false); setShowAIBuilder(false); handleCreate(); }} 
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
            ) : activeTab === 'lessons' ? (
              lessons.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100/80 to-teal-50/60 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm backdrop-blur-sm">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No lessons created yet.</h3>
                  <p className="text-gray-600 mb-6">Create engaging lessons for your students.</p>
                  <button 
                    onClick={() => { setShowBuilder(false); setShowAIQuizBuilder(false); setShowAIBuilder(true); }} 
                    className="bg-stone-200/80 hover:bg-stone-300/80 text-stone-800 px-6 py-2 rounded-md font-medium transition-all backdrop-blur-sm shadow-sm"
                  >
                    Create Your First Lesson
                  </button>
                </div>
              ) : (
                <LessonList
                  lessons={lessons}
                  onEdit={handleLessonEdit}
                  onDelete={handleLessonDelete}
                  onPublish={handleLessonPublish}
                  onViewAnalytics={handleViewLessonAnalytics}
                />
              )
            ) : (
              <AnalyticsOverview onViewLessonAnalytics={handleViewLessonAnalytics} />
            )}

            {showLessonAnalytics && selectedLessonId && (
              <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl border border-white/50 max-w-4xl w-full max-h-[90vh] overflow-hidden">
                  <LessonAnalytics
                    lessonId={selectedLessonId}
                    onClose={() => {
                      setShowLessonAnalytics(false);
                      setSelectedLessonId('');
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}