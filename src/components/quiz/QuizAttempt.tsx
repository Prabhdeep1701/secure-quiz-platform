"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/api-client';
import { useToast } from '@/components/ui/ToastContext';

interface QuizAttemptProps {
  quiz: any;
  onClose: () => void;
}

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

export default function QuizAttempt({ quiz, onClose }: QuizAttemptProps) {
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  // const router = useRouter();
  const { showToast } = useToast();
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    // setError('');

    try {
      const res = await authenticatedFetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quizId: quiz.link,
          answers: Object.values(answers)
        })
      });

      if (res.ok) {
        setSuccess(true);
        showToast(autoSubmitted ? 'Quiz auto-submitted.' : 'Quiz submitted successfully!', 'success');
        // Immediately call onClose after auto-submit (no delay)
        if (autoSubmitted) {
          onClose();
        } else {
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } else {
        const errorData = await res.json();
        showToast(errorData.error || 'Failed to submit quiz', 'error');
        // setError(errorData.error || 'Failed to submit quiz');
      }
    } catch (_err) {
      showToast('Failed to submit quiz', 'error');
      // setError('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-submit if window loses focus in kiosk mode
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.onWindowBlurred) {
      const handler = () => {
        if (!submitting && !success) {
          setAutoSubmitted(true);
          showToast('Quiz auto-submitted because you switched windows.', 'error');
          handleSubmit();
        }
      };
      window.electronAPI?.onWindowBlurred?.(handler);
      return () => {
        window.electronAPI?.offWindowBlurred?.(handler);
      };
    }
  }, [submitting, success, showToast, handleSubmit]);

  useEffect(() => {
    if (quiz && quiz.questions.length > 0) {
      setAnswers(Array(quiz.questions.length).fill(null));
    }
  }, [quiz, handleSubmit]);

  const handleAnswerChange = (questionIndex: number, value: any) => {
    setAnswers((prev: Record<number, any>) => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  if (success) {
    return (
      <div className="p-4 border rounded bg-green-50">
        <h2 className="text-xl font-bold mb-2 text-green-800">Quiz Submitted Successfully!</h2>
        <div className="text-lg text-green-700 mb-4">Your quiz response has been submitted.</div>
        <button
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h2 className="text-2xl font-bold mb-2">{quiz.title}</h2>
      {quiz.description && <div className="mb-4 text-gray-600">{quiz.description}</div>}
      {/* {error && <div className="text-red-600 text-sm mb-2">{error}</div>} */}
      {quiz.questions.map((q: any, i: number) => (
        <div key={i} className="bg-white border rounded p-4 mb-4">
          <div className="mb-2 font-medium">Q{i + 1}: {q.question} {q.required && <span className="text-red-500">*</span>}</div>
          {q.type === 'multiple-choice' && q.options && (
            <div className="space-y-1">
              {q.options.map((opt: string, idx: number) => (
                <label key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`q${i}`}
                    checked={answers[i] === idx}
                    onChange={() => handleAnswerChange(i, idx)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}
          {q.type === 'checkbox' && q.options && (
            <div className="space-y-1">
              {q.options.map((opt: string, idx: number) => (
                <label key={idx} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Array.isArray(answers[i]) && answers[i].includes(idx)}
                    onChange={() => handleAnswerChange(i, idx)}
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
              onChange={e => handleAnswerChange(i, e.target.value)}
            />
          )}
          {q.type === 'paragraph' && (
            <textarea
              className="w-full border rounded px-2 py-1"
              rows={3}
              value={answers[i] || ''}
              onChange={e => handleAnswerChange(i, e.target.value)}
            />
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        {submitting ? 'Submitting...' : 'Submit Quiz'}
      </button>
    </div>
  );
} 