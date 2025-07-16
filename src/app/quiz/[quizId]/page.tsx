"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import QuizAttempt from "@/components/quiz/QuizAttempt";

declare global {
  interface Window {
    electronAPI?: {
      enterKiosk: () => void;
      exitKiosk: () => void;
    };
  }
}

export default function QuizAttemptPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const unwrappedParams = React.use(params);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !(session.user && (session.user as any).role === "Student")) {
      router.replace("/auth/signin");
      return;
    }
    fetchQuiz();
    // Trigger kiosk mode if available
    if (typeof window !== 'undefined' && window.electronAPI?.enterKiosk) {
      window.electronAPI.enterKiosk();
    }
    // eslint-disable-next-line
  }, [session, status]);

  async function fetchQuiz() {
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
  }

  if (status === "loading" || !session || !(session.user && (session.user as any).role === "Student")) {
    return <div className="p-8">Loading...</div>;
  }
  if (loading) return <div className="p-8">Loading quiz...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!quiz) return null;

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <QuizAttempt quiz={quiz} quizId={unwrappedParams.quizId} />
    </main>
  );
} 