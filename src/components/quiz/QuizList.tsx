import React from "react";

interface Quiz {
  _id: string;
  title: string;
  status: "draft" | "published";
  link: string;
}

interface QuizListProps {
  quizzes: Quiz[];
  onEdit: (quiz: Quiz) => void;
  onDelete: (quiz: Quiz) => void;
  onPublish: (quiz: Quiz, status: "published" | "draft") => void;
  onCopyLink: (quiz: Quiz) => void;
  onViewResponses?: (quiz: Quiz) => void;
}

export default function QuizList({ quizzes, onEdit, onDelete, onPublish, onCopyLink, onViewResponses }: QuizListProps) {
  return (
    <div className="space-y-4">
      {quizzes.length === 0 && <div className="text-gray-500">No quizzes yet.</div>}
      {quizzes.map((quiz) => (
        <div key={quiz._id} className="flex items-center justify-between bg-gray-50 border rounded p-4">
          <div>
            <div className="font-semibold text-lg">{quiz.title}</div>
            <div className="text-xs text-gray-500">Status: {quiz.status}</div>
            {quiz.status === "published" && (
              <div className="text-xs mt-1">
                Link: <span className="font-mono bg-gray-200 px-1 py-0.5 rounded">{`${window.location.origin}/quiz/${quiz.link}`}</span>
                <button onClick={() => onCopyLink(quiz)} className="ml-2 text-blue-600 hover:underline text-xs">Copy</button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(quiz)} className="px-3 py-1 rounded bg-blue-500 text-white text-sm hover:bg-blue-600">Edit</button>
            <button onClick={() => onDelete(quiz)} className="px-3 py-1 rounded bg-red-500 text-white text-sm hover:bg-red-600">Delete</button>
            {quiz.status === "draft" ? (
              <button onClick={() => onPublish(quiz, "published")}
                className="px-3 py-1 rounded bg-green-500 text-white text-sm hover:bg-green-600">Publish</button>
            ) : (
              <button onClick={() => onPublish(quiz, "draft")}
                className="px-3 py-1 rounded bg-yellow-500 text-white text-sm hover:bg-yellow-600">Unpublish</button>
            )}
            {onViewResponses && (
              <button onClick={() => onViewResponses(quiz)} className="px-3 py-1 rounded bg-purple-500 text-white text-sm hover:bg-purple-600">View Responses</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 