"use client";
import React, { useState } from 'react';
import { useToast } from '@/components/ui/ToastContext';
import { authenticatedFetch } from '@/lib/api-client';

interface AILessonBuilderProps {
  onClose: () => void;
}

export default function AILessonBuilder({ onClose }: AILessonBuilderProps) {
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { showToast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast('Please enter a prompt', 'error');
      return;
    }

    setGenerating(true);
    try {
      const res = await authenticatedFetch('/api/lessons/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (res.ok) {
        const data = await res.json();
        setTitle(data.title);
        setDescription(data.description);
        setContent(data.content);
        showToast('Lesson generated successfully!', 'success');
      } else {
        const error = await res.json();
        showToast(error.error || 'Failed to generate lesson', 'error');
      }
    } catch (_) {
      showToast('Failed to generate lesson', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      showToast('Title and content are required', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await authenticatedFetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          content,
          aiGenerated: true,
          originalPrompt: prompt,
        }),
      });

      if (res.ok) {
        showToast('Lesson saved successfully!', 'success');
        onClose();
      } else {
        const error = await res.json();
        showToast(error.error || 'Failed to save lesson', 'error');
      }
    } catch (_) {
      showToast('Failed to save lesson', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">AI Lesson Builder</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-black text-2xl">&times;</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">AI Prompt</label>
              <textarea
                className="input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what lesson you want AI to create..."
                rows={3}
              />
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn btn-primary mt-2"
              >
                {generating ? 'Generating...' : 'Generate Lesson'}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Lesson title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                className="input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Lesson description"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <textarea
                className="input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Lesson content"
                rows={15}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="btn btn-success"
              >
                {loading ? 'Saving...' : 'Save Lesson'}
              </button>
              <button onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 