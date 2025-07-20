import React from 'react';

interface QuizListProps {
  quizzes: any[];
  onEdit: (quiz: any) => void;
  onDelete: (quiz: any) => void;
  onPublish: (quiz: any, status: "published" | "draft") => void;
  onCopyLink: (quiz: any) => void;
  onViewResponses: (quiz: any) => void;
}

export default function QuizList({ quizzes, onEdit, onDelete, onPublish, onCopyLink, onViewResponses }: QuizListProps) {
  if (quizzes.length === 0) {
    return <p className="text-gray-500">No quizzes created yet.</p>;
  }

  return (
    <div className="space-y-4">
      {quizzes.map(quiz => (
        <div key={quiz.id} className="flex items-center justify-between bg-gray-50 border rounded p-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{quiz.title}</h3>
            {quiz.description && (
              <p className="text-gray-600 text-sm mt-1">{quiz.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className={`px-2 py-1 rounded ${quiz.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {quiz.status}
              </span>
              <span>{quiz.questions?.length || 0} questions</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(quiz)} className="btn btn-primary">Edit</button>
            <button onClick={() => onPublish(quiz, quiz.status === 'published' ? 'draft' : 'published')} className="btn btn-info">
              {quiz.status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
            {quiz.status === 'published' && (
              <>
                <button onClick={() => onCopyLink(quiz)} className="btn btn-success">Copy Link</button>
                <button onClick={() => onViewResponses(quiz)} className="btn btn-warning">Responses</button>
              </>
            )}
            <button onClick={() => onDelete(quiz)} className="btn btn-danger">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
} 