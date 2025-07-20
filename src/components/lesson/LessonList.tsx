import React from 'react';

interface LessonListProps {
  lessons: any[];
  onEdit: (lesson: any) => void;
  onDelete: (lesson: any) => void;
  onPublish: (lesson: any, status: "published" | "draft") => void;
  onViewAnalytics: (lessonId: string) => void;
}

export default function LessonList({ lessons, onEdit, onDelete, onPublish, onViewAnalytics }: LessonListProps) {
  if (lessons.length === 0) {
    return <p className="text-gray-500">No lessons created yet.</p>;
  }

  return (
    <div className="space-y-4">
      {lessons.map(lesson => (
        <div key={lesson.id} className="flex items-center justify-between bg-gray-50 border rounded p-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{lesson.title}</h3>
            {lesson.description && (
              <p className="text-gray-600 text-sm mt-1">{lesson.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className={`px-2 py-1 rounded ${lesson.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {lesson.status}
              </span>
              {lesson.aiGenerated && <span className="text-blue-600">AI Generated</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(lesson)} className="btn btn-primary">Edit</button>
            <button onClick={() => onPublish(lesson, lesson.status === 'published' ? 'draft' : 'published')} className="btn btn-info">
              {lesson.status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
            <button onClick={() => onViewAnalytics(lesson.id)} className="btn btn-info">Analytics</button>
            <button onClick={() => onDelete(lesson)} className="btn btn-danger">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
} 