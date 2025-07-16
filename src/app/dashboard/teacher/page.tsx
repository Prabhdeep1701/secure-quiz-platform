"use client";
import { useSession } from "next-auth/react";
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
import { signOut } from "next-auth/react";

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !(session.user && (session.user as any).role === "Teacher")) {
      router.replace("/auth/signin");
    } else {
      fetchQuizzes();
      fetchLessons();
    }
    // eslint-disable-next-line
  }, [session, status]);

  async function fetchQuizzes() {
    setLoading(true);
    const res = await fetch("/api/quizzes");
    const data = await res.json();
    setQuizzes(data.quizzes || []);
    setLoading(false);
  }

  async function fetchLessons() {
    const res = await fetch("/api/lessons");
    const data = await res.json();
    setLessons(data.lessons || []);
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
    if (!confirm("Delete this quiz?")) return;
    try {
      const res = await fetch(`/api/quizzes/${quiz._id}`, { method: "DELETE" });
      if (res.ok) {
        showMessage("Quiz deleted.");
        // Immediately update the state
        setQuizzes(prevQuizzes => prevQuizzes.filter(q => q._id !== quiz._id));
      } else {
        showMessage("Failed to delete quiz.");
      }
    } catch (error) {
      showMessage("Failed to delete quiz.");
    }
  };

  const handlePublish = async (quiz: any, status: "published" | "draft") => {
    try {
      const res = await fetch(`/api/quizzes/${quiz._id}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        showMessage(status === "published" ? "Quiz published." : "Quiz unpublished.");
        // Immediately update the state
        setQuizzes(prevQuizzes => prevQuizzes.map(q => 
          q._id === quiz._id ? { ...q, status } : q
        ));
      } else {
        showMessage("Failed to update quiz status.");
      }
    } catch (error) {
      showMessage("Failed to update quiz status.");
    }
  };

  const handleCopyLink = (quiz: any) => {
    navigator.clipboard.writeText(`${window.location.origin}/quiz/${quiz.link}`);
    showMessage("Link copied!");
  };

  const handleViewResponses = async (quiz: any) => {
    setLoading(true);
    const res = await fetch(`/api/quizzes/${quiz._id}/responses`);
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
      const res = await fetch(`/api/lessons/${lesson._id}`, { method: "DELETE" });
      if (res.ok) {
        showMessage("Lesson deleted.");
        // Immediately update the state
        setLessons(prevLessons => prevLessons.filter(l => l._id !== lesson._id));
      } else {
        showMessage("Failed to delete lesson.");
      }
    } catch (error) {
      showMessage("Failed to delete lesson.");
    }
  };

  const handleLessonPublish = async (lesson: any, status: "published" | "draft") => {
    try {
      const res = await fetch(`/api/lessons/${lesson._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lesson, status }),
      });
      if (res.ok) {
        showMessage(status === "published" ? "Lesson published." : "Lesson unpublished.");
        // Immediately update the state
        setLessons(prevLessons => prevLessons.map(l => 
          l._id === lesson._id ? { ...l, status } : l
        ));
      } else {
        showMessage("Failed to update lesson status.");
      }
    } catch (error) {
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
      const res = await fetch("/api/quizzes", {
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
    } catch (error) {
      showMessage("Failed to save quiz.");
    }
  };

  const handleBuilderClose = (refresh = false) => {
    setShowBuilder(false);
    setEditQuiz(null);
    if (refresh) fetchQuizzes();
  };

  if (status === "loading" || !session || !(session.user && (session.user as any).role === "Teacher")) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="btn btn-danger text-sm px-3 py-1"
        >
          Logout
        </button>
      </div>
      <div className="bg-white rounded shadow p-4">
        <div className="mb-4 flex justify-between items-center">
          <div className="flex gap-2">
            <button onClick={handleCreate} className="btn btn-primary">+ Create New Quiz</button>
            <button onClick={() => setShowAIQuizBuilder(true)} className="btn btn-info">+ Create AI Quiz</button>
            <button onClick={() => setShowAIBuilder(true)} className="btn btn-success">+ Create AI Lesson</button>
          </div>
          {message && <span className="text-green-600 text-sm">{message}</span>}
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

        {showBuilder ? (
          <QuizBuilder quiz={editQuiz} onClose={handleBuilderClose} />
        ) : showAIBuilder ? (
          <AILessonBuilder onClose={() => setShowAIBuilder(false)} />
        ) : showAIQuizBuilder ? (
          <AIQuizBuilder onClose={() => setShowAIQuizBuilder(false)} onSave={handleAIQuizSave} />
        ) : showLessonEditor && editLesson ? (
          <LessonEditor lesson={editLesson} onClose={() => { setShowLessonEditor(false); setEditLesson(null); }} onSave={handleLessonSave} />
        ) : showResponses && responsesQuiz ? (
          <div>
            <button onClick={() => setShowResponses(false)} className="mb-2 bg-gray-300 px-3 py-1 rounded">Back to Quizzes</button>
            <QuizResponses responses={responses} quiz={responsesQuiz} />
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