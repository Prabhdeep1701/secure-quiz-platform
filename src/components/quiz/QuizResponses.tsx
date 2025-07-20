import React, { useState } from 'react';
import { authenticatedFetch } from '@/lib/api-client';

interface QuizResponsesProps {
  responses: any[];
  quiz: any;
  onClose: () => void;
}

export default function QuizResponses({ responses, quiz, onClose }: QuizResponsesProps) {
  const [gradingResponse, setGradingResponse] = useState<any>(null);
  const [manualScore, setManualScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString();
  };

  const getCorrectAnswer = (question: any) => {
    if (question.type === 'multiple-choice') {
      const correctIndex = question.correctAnswers?.[0]; // Use first correct answer for single choice
      if (correctIndex === undefined || correctIndex === null) {
        return 'No correct answer set';
      }
      return question.options && question.options[correctIndex] 
        ? question.options[correctIndex] 
        : `Option ${correctIndex + 1}`;
    } else if (question.type === 'checkbox') {
      const correctIndices = question.correctAnswers || [];
      if (correctIndices.length === 0) {
        return 'No correct answers set';
      }
      return correctIndices.map((idx: number) => 
        question.options && question.options[idx] 
          ? question.options[idx] 
          : `Option ${idx + 1}`
      ).join(', ');
    } else {
      return 'Text answer - manual grading required';
    }
  };

  const isAnswerCorrect = (question: any, studentAnswer: any) => {
    if (question.type === 'multiple-choice') {
      const correctAnswer = question.correctAnswers?.[0]; // Use first correct answer for single choice
      return correctAnswer === studentAnswer;
    } else if (question.type === 'checkbox') {
      const correctAnswers = (question.correctAnswers || []).sort().join(',');
      const givenAnswers = Array.isArray(studentAnswer) ? studentAnswer.sort().join(',') : String(studentAnswer);
      return correctAnswers === givenAnswers;
    }
    return false; // Text answers need manual grading
  };

  const handleGradeResponse = (response: any) => {
    setGradingResponse(response);
    setManualScore(response.manualScore?.toString() || response.finalScore?.toString() || '');
    setFeedback(response.feedback || '');
    setIsPublished(response.isPublished || false);
  };

  const handleSaveGrade = async () => {
    if (!gradingResponse) return;

    setLoading(true);
    try {
      const res = await authenticatedFetch(`/api/responses/${gradingResponse.id}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manualScore: manualScore ? parseInt(manualScore) : null,
          feedback: feedback.trim() || null,
          isPublished
        }),
      });

      if (res.ok) {
        // Refresh the responses by calling onClose with refresh flag
        onClose();
        setGradingResponse(null);
        setManualScore('');
        setFeedback('');
        setIsPublished(false);
      } else {
        alert('Failed to save grade');
      }
    } catch (_) {
      alert('Failed to save grade');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (responses.length === 0) return;

    // Create CSV headers
    const headers = ['Student Name', 'Student Email', 'Auto Score', 'Manual Score', 'Final Score', 'Percentage', 'Feedback', 'Published', 'Submitted At'];
    
    // Add question headers
    quiz.questions?.forEach((question: any, index: number) => {
      headers.push(`Q${index + 1} - Student Answer`);
      headers.push(`Q${index + 1} - Correct Answer`);
      headers.push(`Q${index + 1} - Correct?`);
    });

    // Create CSV rows
    const rows = responses.map(response => {
      const row = [
        response.studentName || 'Unknown',
        response.studentEmail || 'No email',
        response.score || 'Not graded',
        response.manualScore || 'Not graded',
        response.finalScore || 0,
        response.finalScore > 0 ? ((response.finalScore / (quiz.questions?.length || 1)) * 100).toFixed(1) + '%' : 'Not graded',
        response.feedback || '',
        response.isPublished ? 'Yes' : 'No',
        formatDate(response.submittedAt)
      ];

      // Add answers and correct answers
      quiz.questions?.forEach((question: any, index: number) => {
        const studentAnswer = response.readableAnswers?.[index] || 'No answer';
        const correctAnswer = getCorrectAnswer(question);
        const isCorrect = isAnswerCorrect(question, response.answers?.[index]);
        
        row.push(studentAnswer);
        row.push(correctAnswer);
        row.push(isCorrect ? 'Yes' : 'No');
      });

      return row;
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${quiz.title.replace(/[^a-z0-9]/gi, '_')}_responses.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Quiz Responses: {quiz.title}</h2>
            <div className="flex gap-2">
              {responses.length > 0 && (
                <button onClick={downloadCSV} className="btn btn-success">
                  Download CSV
                </button>
              )}
              <button onClick={onClose} className="btn btn-secondary">Close</button>
            </div>
          </div>
          
          {responses.length === 0 ? (
            <p className="text-gray-500">No responses yet.</p>
          ) : (
            <div className="space-y-6">
              {responses.map((response, responseIndex) => (
                <div key={response.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{response.studentName}</h3>
                      <p className="text-sm text-gray-600">{response.studentEmail}</p>
                      <p className="text-sm text-gray-500">
                        Submitted: {formatDate(response.submittedAt)}
                      </p>
                      {response.gradedAt && (
                        <p className="text-sm text-gray-500">
                          Graded: {formatDate(response.gradedAt)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {response.finalScore > 0 ? (
                        <>
                          <div className="text-2xl font-bold text-blue-600">
                            {response.finalScore}/{quiz.questions?.length || 0}
                          </div>
                          <div className="text-sm text-gray-600">
                            {((response.finalScore / (quiz.questions?.length || 1)) * 100).toFixed(1)}%
                          </div>
                          {response.manualScore !== null && response.manualScore !== undefined && (
                            <div className="text-xs text-gray-500">
                              Auto: {response.score || 'Not graded'} | Manual: {response.manualScore}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-lg text-gray-500">Not graded</div>
                      )}
                      {response.isPublished && (
                        <div className="text-xs text-green-600 font-medium">Published</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {quiz.questions?.map((question: any, questionIndex: number) => {
                      const studentAnswer = response.readableAnswers?.[questionIndex] || 'No answer';
                      const correctAnswer = getCorrectAnswer(question);
                      const isCorrect = isAnswerCorrect(question, response.answers?.[questionIndex]);
                      
                      return (
                        <div key={questionIndex} className="bg-white p-3 rounded border">
                          <div className="font-medium mb-2">
                            Q{questionIndex + 1}: {question.question}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Student&apos;s Answer: </span>
                              <span className={`${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                {studentAnswer}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Correct Answer: </span>
                              <span className="text-green-600 font-medium">
                                {correctAnswer}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              isCorrect 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={() => handleGradeResponse(response)}
                      className="btn btn-primary"
                    >
                      Grade Response
                    </button>
                    {response.feedback && (
                      <div className="text-sm text-gray-600">
                        <strong>Feedback:</strong> {response.feedback}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grading Modal */}
      {gradingResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              Grade Response - {gradingResponse.studentName}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Auto Score</label>
                <div className="text-gray-600">
                  {gradingResponse.score ? `${gradingResponse.score}/${quiz.questions?.length || 0}` : 'Not graded'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Manual Score</label>
                <input
                  type="number"
                  min="0"
                  max={quiz.questions?.length || 0}
                  value={manualScore}
                  onChange={(e) => setManualScore(e.target.value)}
                  className="input w-full"
                  placeholder="Enter manual score"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Feedback</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="input w-full"
                  rows={3}
                  placeholder="Enter feedback for the student"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="publish"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="publish" className="text-sm font-medium">
                  Publish grade to student
                </label>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveGrade}
                disabled={loading}
                className="btn btn-success"
              >
                {loading ? 'Saving...' : 'Save Grade'}
              </button>
              <button
                onClick={() => {
                  setGradingResponse(null);
                  setManualScore('');
                  setFeedback('');
                  setIsPublished(false);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 