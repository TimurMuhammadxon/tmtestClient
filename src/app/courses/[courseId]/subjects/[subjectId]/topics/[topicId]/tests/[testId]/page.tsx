"use client";

import { useState } from "react";
import { courses } from "@/lib/data";

export default function TestPage({
  params,
}: {
  params: { courseId: string; subjectId: string; topicId: string; testId: string };
}) {
  const course = courses.find((c) => c.id === Number(params.courseId));
  const subject = course?.subjects.find((s) => s.id === Number(params.subjectId));
  const topic = subject?.topics.find((t) => t.id === Number(params.topicId));
  const test = topic?.tests.find((t) => t.id === Number(params.testId));

  const [answers, setAnswers] = useState<Record<number, number>>({});

  if (!test) return <div>Тест не найден</div>;

  const handleAnswer = (qId: number, optionIdx: number) => {
    setAnswers({ ...answers, [qId]: optionIdx });
  };

  const checkResult = () => {
    let score = 0;
    test.questions.forEach((q) => {
      if (answers[q.id] === q.answer) score++;
    });
    alert(`Ваш результат: ${score} / ${test.questions.length}`);
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-bold">{test.title}</h1>
      <div className="space-y-6">
        {test.questions.map((q) => (
          <div key={q.id} className="rounded bg-white p-4 shadow">
            <p className="font-medium">{q.text}</p>
            <ul className="mt-2 space-y-2">
              {q.options.map((opt, idx) => (
                <li key={idx}>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={idx}
                      checked={answers[q.id] === idx}
                      onChange={() => handleAnswer(q.id, idx)}
                    />
                    {opt}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <button
        onClick={checkResult}
        className="mt-6 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Проверить результат
      </button>
    </div>
  );
}
