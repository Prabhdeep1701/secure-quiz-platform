import React from 'react';

interface QuizResponsesProps {
  responses: any[];
  quiz: any;
}

function toCSV(responses: any[], quiz: any) {
  const headers = ['Name', 'Email', 'Score', ...quiz.questions.map((q: any, i: number) => `Q${i + 1}`)];
  const rows = responses.map(r => [
    r.student?.name || '',
    r.student?.email || '',
    r.score ?? '',
    ...quiz.questions.map((_: any, i: number) => JSON.stringify(r.answers[i]))
  ]);
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export default function QuizResponses({ responses, quiz }: QuizResponsesProps) {
  const handleDownload = () => {
    const csv = toCSV(responses, quiz);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quiz.title.replace(/\s+/g, '_')}_responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-lg">Student Responses</h3>
        <button onClick={handleDownload} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Download CSV</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">Score</th>
              {quiz.questions.map((q: any, i: number) => (
                <th key={i} className="border px-2 py-1">Q{i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {responses.map((r, idx) => (
              <tr key={r._id || idx}>
                <td className="border px-2 py-1">{r.student?.name || '-'}</td>
                <td className="border px-2 py-1">{r.student?.email || '-'}</td>
                <td className="border px-2 py-1">{r.score ?? '-'}</td>
                {quiz.questions.map((q: any, i: number) => {
                  const ans = r.answers[i];
                  let display = '';
                  if (q.type === 'multiple-choice' && typeof ans === 'number' && q.options) {
                    display = q.options[ans] ?? '-';
                  } else if (q.type === 'checkbox' && Array.isArray(ans) && q.options) {
                    display = ans.map((idx: number) => q.options[idx]).filter(Boolean).join(', ');
                  } else if (q.type === 'short-answer' || q.type === 'paragraph') {
                    display = ans ?? '-';
                  } else {
                    display = ans !== undefined ? JSON.stringify(ans) : '-';
                  }
                  return <td key={i} className="border px-2 py-1">{display}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 