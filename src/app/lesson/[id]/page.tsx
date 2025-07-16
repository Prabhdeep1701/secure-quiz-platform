"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LessonViewerPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [hasTracked, setHasTracked] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !(session.user && (session.user as any).role === "Student")) {
      router.replace("/auth/signin");
      return;
    }
    fetchLesson();
    // eslint-disable-next-line
  }, [session, status]);

  async function fetchLesson() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/student/lessons`);
    if (res.ok) {
      const data = await res.json();
      const foundLesson = data.lessons.find((l: any) => l._id === params.id);
      if (foundLesson) {
        setLesson(foundLesson);
        // Track lesson view
        trackLessonView();
      } else {
        setError("Lesson not found or not published.");
      }
    } else {
      setError("Failed to load lesson.");
    }
    setLoading(false);
  }

  const trackLessonView = async () => {
    if (hasTracked) return;
    
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      await fetch(`/api/lessons/${params.id}/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeSpent, completed: false }),
      });
      setHasTracked(true);
    } catch (error) {
      console.error('Failed to track lesson view:', error);
    }
  };

  const trackLessonCompletion = async () => {
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      await fetch(`/api/lessons/${params.id}/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeSpent, completed: true }),
      });
    } catch (error) {
      console.error('Failed to track lesson completion:', error);
    }
  };

  if (status === "loading" || !session || !(session.user && (session.user as any).role === "Student")) {
    return <div className="p-8">Loading...</div>;
  }
  if (loading) return <div className="p-8">Loading lesson...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!lesson) return null;

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="mb-4">
        <button onClick={() => router.back()} className="btn btn-secondary">
          ← Back to Dashboard
        </button>
      </div>
      
      <article className="bg-white rounded-lg shadow-lg p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-gray-600 text-lg mb-4">{lesson.description}</p>
          )}
          <div className="text-sm text-gray-500">
            By: {lesson.author?.name || 'Unknown'}
            {lesson.aiGenerated && <span className="ml-2 text-blue-600">• AI Generated</span>}
          </div>
        </header>

        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
            {lesson.content}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          <button
            onClick={trackLessonCompletion}
            className="btn btn-primary"
          >
            Mark as Completed
          </button>
        </div>
      </article>
    </main>
  );
} 