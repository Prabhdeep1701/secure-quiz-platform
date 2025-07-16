import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    electronAPI?: {
      enterKiosk: () => void;
      exitKiosk: () => void;
    };
  }
}

type QuestionType = 'multiple-choice' | 'checkbox' | 'short-answer' | 'paragraph';

interface Question {
  type: QuestionType;
  question: string;
  options?: string[];
  required?: boolean;
}

interface QuizAttemptProps {
  quiz: {
    title: string;
    description?: string;
    questions: Question[];
  };
  quizId: string;
}

export default function QuizAttempt({ quiz, quizId }: QuizAttemptProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<any[]>(Array(quiz.questions.length).fill(null));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const handleChange = (qIdx: number, value: any) => {
    setAnswers(ans => ans.map((a, i) => i === qIdx ? value : a));
  };

  const handleCheckbox = (qIdx: number, optIdx: number) => {
    setAnswers(ans => {
      const arr = Array.isArray(ans[qIdx]) ? [...ans[qIdx]] : [];
      if (arr.includes(optIdx)) {
        return ans.map((a, i) => i === qIdx ? arr.filter((v: number) => v !== optIdx) : a);
      } else {
        return ans.map((a, i) => i === qIdx ? [...arr, optIdx] : a);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Validate required
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      if (q.required) {
        if (q.type === 'checkbox') {
          if (!Array.isArray(answers[i]) || answers[i].length === 0) {
            setError(`Please answer question ${i + 1}`);
            return;
          }
        } else if (answers[i] == null || answers[i] === '' || (Array.isArray(answers[i]) && answers[i].length === 0)) {
          setError(`Please answer question ${i + 1}`);
          return;
        }
      }
    }
    setLoading(true);
    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId, answers }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        setScore(data.score);
        // Exit kiosk mode after submission (optional: keep until back button)
        // if (typeof window !== 'undefined' && window.electronAPI?.exitKiosk) {
        //   window.electronAPI.exitKiosk();
        // }
      } else {
        setError(data.error || 'Submission failed.');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleBack = () => {
    // Exit kiosk mode if available
    if (typeof window !== 'undefined' && window.electronAPI?.exitKiosk) {
      window.electronAPI.exitKiosk();
    }
    router.push('/dashboard/student');
  };

  if (submitted) {
    return (
      <div className="p-4 border rounded bg-green-50">
        <h2 className="text-xl font-bold mb-2">Quiz Submitted!</h2>
        {score !== null && <div className="text-lg">Your score: <span className="font-bold">{score}</span></div>}
        <button
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={handleBack}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      <h2 className="text-2xl font-bold mb-2">{quiz.title}</h2>
      {quiz.description && <div className="mb-4 text-gray-600">{quiz.description}</div>}
      {quiz.questions.map((q, i) => (
        <div key={i} className="bg-gray-50 border rounded p-4">
          <div className="mb-2 font-medium">Q{i + 1}: {q.question} {q.required && <span className="text-red-500">*</span>}</div>
          {q.type === 'multiple-choice' && q.options && (
            <div className="space-y-1">
              {q.options.map((opt, idx) => (
                <label key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`q${i}`}
                    checked={answers[i] === idx}
                    onChange={() => handleChange(i, idx)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}
          {q.type === 'checkbox' && q.options && (
            <div className="space-y-1">
              {q.options.map((opt, idx) => (
                <label key={idx} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Array.isArray(answers[i]) && answers[i].includes(idx)}
                    onChange={() => handleCheckbox(i, idx)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}
          {q.type === 'short-answer' && (
            <input
              className="w-full border rounded px-2 py-1"
              value={answers[i] || ''}
              onChange={e => handleChange(i, e.target.value)}
            />
          )}
          {q.type === 'paragraph' && (
            <textarea
              className="w-full border rounded px-2 py-1"
              rows={3}
              value={answers[i] || ''}
              onChange={e => handleChange(i, e.target.value)}
            />
          )}
        </div>
      ))}
      <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
} 