"use client";
import { useState } from "react";
import { authenticatedFetch } from "@/lib/api-client";

interface AIQuizBuilderProps {
  onClose: () => void;
  onSave: (quiz: any) => void;
}

export default function AIQuizBuilder({ onClose, onSave }: AIQuizBuilderProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await authenticatedFetch("/api/quizzes/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedQuiz(data.quiz);
        setShowEditor(true);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to generate quiz");
      }
    } catch {
      setError("Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (generatedQuiz) {
      onSave(generatedQuiz);
    }
  };

  if (showEditor && generatedQuiz) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Edit AI Generated Quiz</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Quiz Title</label>
            <input
              type="text"
              value={generatedQuiz.title}
              onChange={(e) => setGeneratedQuiz({ ...generatedQuiz, title: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={generatedQuiz.description || ""}
              onChange={(e) => setGeneratedQuiz({ ...generatedQuiz, description: e.target.value })}
              className="w-full border rounded px-3 py-2 h-20"
            />
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Questions</h3>
            <div className="space-y-4">
              {generatedQuiz.questions.map((question: any, index: number) => (
                <div key={index} className="border rounded p-4">
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-2">Question {index + 1}</label>
                    <textarea
                      value={question.question}
                      onChange={(e) => {
                        const updatedQuestions = [...generatedQuiz.questions];
                        updatedQuestions[index] = { ...question, question: e.target.value };
                        setGeneratedQuiz({ ...generatedQuiz, questions: updatedQuestions });
                      }}
                      className="w-full border rounded px-3 py-2"
                      rows={3}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-2">Question Type</label>
                    <select
                      value={question.type}
                      onChange={(e) => {
                        const updatedQuestions = [...generatedQuiz.questions];
                        updatedQuestions[index] = { 
                          ...question, 
                          type: e.target.value,
                          options: e.target.value === 'multiple-choice' || e.target.value === 'checkbox' ? question.options : undefined,
                          correctAnswers: e.target.value === 'multiple-choice' || e.target.value === 'checkbox' ? question.correctAnswers : undefined
                        };
                        setGeneratedQuiz({ ...generatedQuiz, questions: updatedQuestions });
                      }}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="short-answer">Short Answer</option>
                      <option value="paragraph">Paragraph</option>
                    </select>
                  </div>

                  {(question.type === 'multiple-choice' || question.type === 'checkbox') && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-2">Options</label>
                      {question.options?.map((option: string, optIndex: number) => (
                        <div key={optIndex} className="flex items-center mb-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const updatedQuestions = [...generatedQuiz.questions];
                              const updatedOptions = [...(updatedQuestions[index].options || [])];
                              updatedOptions[optIndex] = e.target.value;
                              updatedQuestions[index] = { ...updatedQuestions[index], options: updatedOptions };
                              setGeneratedQuiz({ ...generatedQuiz, questions: updatedQuestions });
                            }}
                            className="flex-1 border rounded px-3 py-2 mr-2"
                          />
                          <input
                            type="checkbox"
                            checked={question.correctAnswers?.includes(optIndex)}
                            onChange={(e) => {
                              const updatedQuestions = [...generatedQuiz.questions];
                              const correctAnswers = [...(updatedQuestions[index].correctAnswers || [])];
                              if (e.target.checked) {
                                correctAnswers.push(optIndex);
                              } else {
                                const indexToRemove = correctAnswers.indexOf(optIndex);
                                if (indexToRemove > -1) {
                                  correctAnswers.splice(indexToRemove, 1);
                                }
                              }
                              updatedQuestions[index] = { ...updatedQuestions[index], correctAnswers };
                              setGeneratedQuiz({ ...generatedQuiz, questions: updatedQuestions });
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-600">Correct</span>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const updatedQuestions = [...generatedQuiz.questions];
                          const updatedOptions = [...(updatedQuestions[index].options || []), ""];
                          updatedQuestions[index] = { ...updatedQuestions[index], options: updatedOptions };
                          setGeneratedQuiz({ ...generatedQuiz, questions: updatedQuestions });
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        + Add Option
                      </button>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) => {
                          const updatedQuestions = [...generatedQuiz.questions];
                          updatedQuestions[index] = { ...question, required: e.target.checked };
                          setGeneratedQuiz({ ...generatedQuiz, questions: updatedQuestions });
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">Required</span>
                    </label>
                  </div>

                  <button
                    onClick={() => {
                      const updatedQuestions = generatedQuiz.questions.filter((_: any, i: number) => i !== index);
                      setGeneratedQuiz({ ...generatedQuiz, questions: updatedQuestions });
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove Question
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                const newQuestion = {
                  type: 'multiple-choice',
                  question: '',
                  options: ['', ''],
                  correctAnswers: [],
                  required: false
                };
                setGeneratedQuiz({
                  ...generatedQuiz,
                  questions: [...generatedQuiz.questions, newQuestion]
                });
              }}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              + Add Question
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              className="btn btn-primary"
            >
              Save Quiz
            </button>
            <button
              onClick={() => setShowEditor(false)}
              className="btn btn-secondary"
            >
              Back to Generator
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">AI Quiz Generator</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Quiz Generation Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the quiz you want to create. For example: 'Create a quiz about JavaScript fundamentals with 5 multiple choice questions covering variables, functions, and arrays. Include 2 short answer questions about best practices.'"
            className="w-full border rounded px-3 py-2 h-32"
          />
          <p className="text-sm text-gray-600 mt-2">
            Be specific about the topic, number of questions, question types, and difficulty level.
          </p>
        </div>

        {error && (
          <div className="mb-4 text-red-600 text-sm">{error}</div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? "Generating..." : "Generate Quiz"}
          </button>
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 