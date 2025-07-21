import React, { useState } from 'react';
import { authenticatedFetch } from '@/lib/api-client';

type QuestionType = 'multiple-choice' | 'checkbox' | 'short-answer' | 'paragraph';

interface Question {
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswers?: number[];
  required?: boolean;
}

interface QuizBuilderProps {
  quiz?: any;
  onClose: (refresh?: boolean) => void;
}

const emptyQuestion: Question = {
  type: 'multiple-choice',
  question: '',
  options: [''],
  correctAnswers: [],
  required: false,
};

export default function QuizBuilder({ quiz, onClose }: QuizBuilderProps) {
  const [title, setTitle] = useState(quiz?.title || '');
  const [description, setDescription] = useState(quiz?.description || '');
  const [questions, setQuestions] = useState<Question[]>(quiz?.questions || []);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingQ, setEditingQ] = useState<Question>(emptyQuestion);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Add or update question in list
  const handleSaveQuestion = () => {
    if (!editingQ.question.trim()) {
      setError('Question text is required.');
      return;
    }
    if ((editingQ.type === 'multiple-choice' || editingQ.type === 'checkbox')) {
      if (!editingQ.options || editingQ.options.length < 2 || editingQ.options.some(opt => !opt.trim())) {
        setError('At least two non-empty options are required.');
        return;
      }
    }
    setError('');
    if (editingIdx !== null) {
      setQuestions(qs => qs.map((q, i) => i === editingIdx ? editingQ : q));
      setEditingIdx(null);
    } else {
      setQuestions(qs => [...qs, editingQ]);
    }
    setEditingQ(emptyQuestion);
  };

  // Edit question
  const handleEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditingQ(questions[idx]);
  };

  // Delete question
  const handleDelete = (idx: number) => {
    setQuestions(qs => qs.filter((_, i) => i !== idx));
    if (editingIdx === idx) {
      setEditingIdx(null);
      setEditingQ(emptyQuestion);
    }
  };

  // Reorder questions
  const moveQuestion = (from: number, to: number) => {
    if (to < 0 || to >= questions.length) return;
    const newQs = [...questions];
    const [moved] = newQs.splice(from, 1);
    newQs.splice(to, 0, moved);
    setQuestions(newQs);
  };

  // Handle option change
  const handleOptionChange = (idx: number, value: string) => {
    setEditingQ(q => ({ ...q, options: q.options?.map((opt, i) => i === idx ? value : opt) }));
  };

  // Add option
  const addOption = () => {
    setEditingQ(q => ({ ...q, options: [...(q.options || []), ''] }));
  };

  // Remove option
  const removeOption = (idx: number) => {
    setEditingQ(q => ({ ...q, options: q.options?.filter((_, i) => i !== idx) }));
  };

  // Toggle correct answer
  const toggleCorrect = (idx: number) => {
    setEditingQ(q => {
      let correct = q.correctAnswers || [];
      if (q.type === 'multiple-choice') {
        correct = [idx];
      } else if (q.type === 'checkbox') {
        correct = correct.includes(idx) ? correct.filter(i => i !== idx) : [...correct, idx];
      }
      return { ...q, correctAnswers: correct };
    });
  };

  // Save quiz (draft or publish)
  const handleSaveQuiz = async (status: 'draft' | 'published') => {
    setError('');
    setSuccess('');
    if (!title.trim()) {
      setError('Quiz title is required.');
      return;
    }
    if (questions.length === 0) {
      setError('At least one question is required.');
      return;
    }
    setLoading(true);
    const payload = { title, description, questions, status };
    const method = quiz ? 'PUT' : 'POST';
    const url = quiz ? `/api/quizzes/${quiz.id}` : '/api/quizzes';
    const res = await authenticatedFetch(url, {
      method,
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setSuccess(status === 'published' ? 'Quiz published!' : 'Quiz saved as draft.');
      setTimeout(() => onClose(true), 1000);
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to save quiz.');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded bg-gray-50 relative max-w-2xl mx-auto">
      <button onClick={() => onClose()} className="absolute top-2 right-2 text-gray-500 hover:text-black">&times;</button>
      <h2 className="text-xl font-bold mb-2">{quiz ? 'Edit Quiz' : 'Create New Quiz'}</h2>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      {success && <div className="text-green-600 text-sm mb-2">{success}</div>}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Quiz Title</label>
        <input className="w-full border rounded px-3 py-2" value={title} onChange={e => setTitle(e.target.value)} required />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea className="w-full border rounded px-3 py-2" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
      </div>
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Questions</h3>
        {questions.length === 0 && <div className="text-gray-500 mb-2">No questions yet.</div>}
        <ol className="space-y-2 mb-2">
          {questions.map((q, i) => (
            <li key={i} className="bg-white border rounded p-2 flex items-center justify-between">
              <div>
                <span className="font-medium">Q{i + 1}:</span> {q.question} <span className="text-xs text-gray-500">[{q.type}]</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => moveQuestion(i, i - 1)} disabled={i === 0} className="text-xs px-2 py-1 rounded bg-gray-200">↑</button>
                <button onClick={() => moveQuestion(i, i + 1)} disabled={i === questions.length - 1} className="text-xs px-2 py-1 rounded bg-gray-200">↓</button>
                <button onClick={() => handleEdit(i)} className="text-xs px-2 py-1 rounded bg-blue-500 text-white">Edit</button>
                <button onClick={() => handleDelete(i)} className="text-xs px-2 py-1 rounded bg-red-500 text-white">Delete</button>
              </div>
            </li>
          ))}
        </ol>
        <div className="border-t pt-2 mt-2">
          <h4 className="font-semibold mb-1">{editingIdx !== null ? 'Edit Question' : 'Add Question'}</h4>
          <div className="mb-2">
            <label className="block text-xs mb-1">Type</label>
            <select className="border rounded px-2 py-1" value={editingQ.type} onChange={e => setEditingQ(q => ({ ...q, type: e.target.value as QuestionType, options: (e.target.value === 'multiple-choice' || e.target.value === 'checkbox') ? ['',''] : undefined, correctAnswers: [] }))}>
              <option value="multiple-choice">Multiple Choice (Single)</option>
              <option value="checkbox">Multiple Choice (Multiple)</option>
              <option value="short-answer">Short Answer</option>
              <option value="paragraph">Paragraph</option>
            </select>
          </div>
          <div className="mb-2">
            <label className="block text-xs mb-1">Question</label>
            <input className="w-full border rounded px-2 py-1" value={editingQ.question} onChange={e => setEditingQ(q => ({ ...q, question: e.target.value }))} />
          </div>
          {(editingQ.type === 'multiple-choice' || editingQ.type === 'checkbox') && (
            <div className="mb-2">
              <label className="block text-xs mb-1">Options</label>
              {editingQ.options?.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-1">
                  <input className="border rounded px-2 py-1 flex-1" value={opt} onChange={e => handleOptionChange(idx, e.target.value)} />
                  <button type="button" onClick={() => removeOption(idx)} className="text-xs px-2 py-1 rounded bg-red-200">Remove</button>
                  {(editingQ.type === 'multiple-choice' || editingQ.type === 'checkbox') && (
                    <button type="button" onClick={() => toggleCorrect(idx)} className={`text-xs px-2 py-1 rounded ${editingQ.correctAnswers?.includes(idx) ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>{editingQ.type === 'multiple-choice' ? 'Correct' : 'Toggle'}</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addOption} className="text-xs px-2 py-1 rounded bg-blue-200 mt-1">Add Option</button>
            </div>
          )}
          <div className="mb-2">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={editingQ.required} onChange={e => setEditingQ(q => ({ ...q, required: e.target.checked }))} />
              Required
            </label>
          </div>
          <button type="button" onClick={handleSaveQuestion} className="bg-blue-600 text-white px-4 py-1 rounded mr-2">{editingIdx !== null ? 'Update' : 'Add'} Question</button>
          {editingIdx !== null && <button type="button" onClick={() => { setEditingIdx(null); setEditingQ(emptyQuestion); }} className="text-xs text-gray-500 ml-2">Cancel</button>}
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={() => handleSaveQuiz('draft')} disabled={loading} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">Save as Draft</button>
        <button onClick={() => handleSaveQuiz('published')} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Publish</button>
      </div>
    </div>
  );
} 