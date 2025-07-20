"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/ui/AuthContext";
import { useRouter } from "next/navigation";
import QuizAttempt from "@/components/quiz/QuizAttempt";

declare global {
  interface Window {
    electronAPI?: {
      enterKiosk: () => void;
      exitKiosk: () => void;
      onWindowBlurred?: (callback: () => void) => void;
      offWindowBlurred?: (callback: () => void) => void;
    };
  }
}

export default function QuizAttemptPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attemptStarted, setAttemptStarted] = useState(false);
  const unwrappedParams = React.use(params);

  const fetchQuiz = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/quizzes/${unwrappedParams.quizId}`);
    if (res.ok) {
      const data = await res.json();
      setQuiz(data.quiz);
    } else {
      setError("Quiz not found or unavailable.");
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    if (authLoading) return;
    if (!user || userRole !== "Student") {
      router.replace("/auth/signin");
      return;
    }
    fetchQuiz();
  }, [user, userRole, authLoading, router, fetchQuiz]);

  const handleStartAttempt = () => {
    setAttemptStarted(true);
    if (typeof window !== 'undefined' && window.electronAPI?.enterKiosk) {
      window.electronAPI.enterKiosk();
    }
  };

  const handleClose = () => {
    // Exit kiosk mode if available
    if (typeof window !== 'undefined' && window.electronAPI?.exitKiosk) {
      window.electronAPI.exitKiosk();
    }
    // Redirect back to student dashboard
    router.push('/dashboard/student');
  };

  if (authLoading || !user || userRole !== "Student") {
    return <div className="p-8">Loading...</div>;
  }
  if (loading) return <div className="p-8">Loading quiz...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!quiz) return null;

  return (
    <main className="p-8 max-w-2xl mx-auto">
      {!attemptStarted ? (
        <div className="flex flex-col items-center justify-center gap-6">
          <h2 className="text-2xl font-bold mb-4">{quiz.title}</h2>
          {quiz.description && <div className="mb-4 text-gray-600">{quiz.description}</div>}
          <button
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            onClick={handleStartAttempt}
          >
            Attempt Quiz
          </button>
        </div>
      ) : (
        <QuizAttempt quiz={quiz} onClose={handleClose} />
      )}
    </main>
  );
} 