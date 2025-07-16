"use client";
import React, { useState } from 'react';
import { useToast } from '@/components/ui/ToastContext';

interface LessonEditorProps {
  lesson: any;
  onClose: () => void;
  onSave: () => void;
}

export default function LessonEditor({ lesson, onClose, onSave }: LessonEditorProps) {
  const [title, setTitle] = useState(lesson?.title || '');
  const [description, setDescription] = useState(lesson?.description || '');
  const [content, setContent] = useState(lesson?.content || '');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      showToast('Title and content are required', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/lessons/${lesson._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          content,
          status: lesson.status,
        }),
      });

      if (res.ok) {
        showToast('Lesson updated successfully!', 'success');
        onSave();
        onClose();
      } else {
        const error = await res.json();
        showToast(error.error || 'Failed to update lesson', 'error');
      }
    } catch (error) {
      showToast('Failed to update lesson', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Edit Lesson</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-black text-2xl">&times;</button>
          </div>

          <div className="space-y-4">
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
                {loading ? 'Saving...' : 'Save Changes'}
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