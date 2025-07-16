import React from "react";

interface Lesson {
  _id: string;
  title: string;
  description?: string;
  status: "draft" | "published";
  aiGenerated: boolean;
  createdAt: string;
}

interface LessonListProps {
  lessons: Lesson[];
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  onPublish: (lesson: Lesson, status: "published" | "draft") => void;
  onViewAnalytics?: (lessonId: string) => void;
}

export default function LessonList({ lessons, onEdit, onDelete, onPublish, onViewAnalytics }: LessonListProps) {
  return (
    <div className="space-y-4">
      {lessons.length === 0 && <div className="text-gray-500">No lessons yet.</div>}
      {lessons.map((lesson) => (
        <div key={lesson._id} className="flex items-center justify-between bg-gray-50 border rounded p-4">
          <div>
            <div className="font-semibold text-lg">{lesson.title}</div>
            <div className="text-sm text-gray-600 mb-1">{lesson.description}</div>
            <div className="text-xs text-gray-500">
              Status: {lesson.status} 
              {lesson.aiGenerated && <span className="ml-2 text-blue-600">• AI Generated</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(lesson)} className="btn btn-primary">Edit</button>
            <button onClick={() => onDelete(lesson)} className="btn btn-danger">Delete</button>
            {lesson.status === "published" && onViewAnalytics && (
              <button onClick={() => onViewAnalytics(lesson._id)} className="btn btn-info">Analytics</button>
            )}
            {lesson.status === "draft" ? (
              <button onClick={() => onPublish(lesson, "published")}
                className="btn btn-success">Publish</button>
            ) : (
              <button onClick={() => onPublish(lesson, "draft")}
                className="btn btn-warning">Unpublish</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 