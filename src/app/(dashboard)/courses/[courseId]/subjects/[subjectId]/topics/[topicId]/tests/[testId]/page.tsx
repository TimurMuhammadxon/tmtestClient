"use client";

import { useEffect, useState } from "react";
import { FaTrash, FaCopy, FaPlus, FaImage } from "react-icons/fa";
import Breadcrumbs from "@/components/Breadcrumbs";

// маленький debounce-хук (чтобы не дергать сервер на каждый символ)
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}

type Option = {
  id: number;
  text: string;
  image?: string;
};

type Question = {
  id: number;
  text: string;
  image?: string;
  options: Option[];
  correctOptionId?: number;
};

export default function TestEditorPage() {
  const [testTitle, setTestTitle] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  // откладываемое значение для автосохранения
const debouncedData = useDebounce({ title: testTitle, questions }, 600);

// автосохранение на сервер при изменениях
useEffect(() => {
  // сохраняем тест на сервере
  const saveTest = async () => {
    const testData = { title: testTitle, questions };
    await fetch("/api/tests/1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testData),
    });
  };
  saveTest();
}, [testTitle, questions]);

  // ⚡ Имитация загрузки с сервера
  useEffect(() => {
    setTimeout(() => {
      const fakeData = {
        title: "Тест по математике",
        questions: [
          {
            id: 1,
            text: "Сколько будет 2+2?",
            options: [
              { id: 11, text: "3" },
              { id: 12, text: "4" },
              { id: 13, text: "5" },
              { id: 14, text: "22" },
            ],
            correctOptionId: 12,
          },
        ],
      };
      setTestTitle(fakeData.title);
      setQuestions(fakeData.questions);
      setLoading(false);
    }, 1000);
  }, []);

  // 👉 добавить вопрос
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        text: "",
        options: Array.from({ length: 4 }, (_, i) => ({
          id: Date.now() + i + 1,
          text: "",
        })),
      },
    ]);
  };

  // 👉 обновить текст вопроса
  const updateQuestionText = (qId: number, value: string) => {
    setQuestions(questions.map((q) => (q.id === qId ? { ...q, text: value } : q)));
  };

  // 👉 обновить текст варианта
  const updateOptionText = (qId: number, optId: number, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: q.options.map((opt) =>
                opt.id === optId ? { ...opt, text: value } : opt
              ),
            }
          : q
      )
    );
  };

  // 👉 назначить правильный вариант
  const setCorrectOption = (qId: number, optId: number) => {
    setQuestions(
      questions.map((q) => (q.id === qId ? { ...q, correctOptionId: optId } : q))
    );
  };

  // 👉 удалить вопрос
  const deleteQuestion = (qId: number) => {
    setQuestions(questions.filter((q) => q.id !== qId));
  };

  // 👉 дублировать вопрос
  const duplicateQuestion = (qId: number) => {
    const q = questions.find((q) => q.id === qId);
    if (!q) return;
    const clone: Question = {
      ...q,
      id: Date.now(),
      options: q.options.map((opt) => ({
        ...opt,
        id: Date.now() + Math.random(),
      })),
    };
    setQuestions([...questions, clone]);
  };

  // 👉 загрузка картинки для вопроса
  const uploadQuestionImage = (qId: number, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setQuestions(
        questions.map((q) =>
          q.id === qId ? { ...q, image: reader.result as string } : q
        )
      );
    };
    reader.readAsDataURL(file);
  };

  // 👉 загрузка картинки для варианта
  const uploadOptionImage = (qId: number, optId: number, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setQuestions(
        questions.map((q) =>
          q.id === qId
            ? {
                ...q,
                options: q.options.map((opt) =>
                  opt.id === optId ? { ...opt, image: reader.result as string } : opt
                ),
              }
            : q
        )
      );
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <p className="p-6">⏳ Загружаем тест...</p>;

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs />
      <h1 className="text-2xl font-bold">Редактор теста</h1>

      {/* Название теста */}
      <input
        type="text"
        placeholder="Название теста"
        value={testTitle}
        onChange={(e) => setTestTitle(e.target.value)}
        className="w-full border-b p-2 text-lg font-semibold focus:outline-none"
      />

      {/* Если нет вопросов */}
      {!previewMode && questions.length === 0 && (
        <div className="rounded-lg border bg-white p-3 shadow space-y-3">
          <p className="text-gray-500">Пока нет вопросов. Добавьте первый:</p>
          <button
            onClick={addQuestion}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <FaPlus /> Добавить первый вопрос
          </button>
        </div>
      )}

      {/* Если вопросы уже есть */}
      {!previewMode &&
        questions.map((q) => (
          <div
            key={q.id}
            className="rounded-lg border bg-white p-3 shadow space-y-3"
          >
            {/* Текст вопроса */}
            <input
              type="text"
              placeholder="Введите вопрос"
              value={q.text}
              onChange={(e) => updateQuestionText(q.id, e.target.value)}
              className="w-full border-b p-2 text-base focus:outline-none"
            />

            {/* Загрузка картинки для вопроса */}
            <label className="flex items-center gap-2 cursor-pointer text-sm text-blue-600">
              <FaImage />
              <span>Добавить картинку</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files && uploadQuestionImage(q.id, e.target.files[0])
                }
              />
            </label>
            {q.image && (
              <img src={q.image} alt="question" className="h-28 rounded object-cover" />
            )}

            {/* Варианты */}
            <div className="space-y-2">
              {q.options.map((opt) => (
                <div key={opt.id} className="flex flex-col gap-1 border p-2 rounded">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={q.correctOptionId === opt.id}
                      onChange={() => setCorrectOption(q.id, opt.id)}
                    />
                    <input
                      type="text"
                      placeholder="Вариант ответа"
                      value={opt.text}
                      onChange={(e) => updateOptionText(q.id, opt.id, e.target.value)}
                      className="flex-1 rounded border p-1 text-sm"
                    />
                    {/* Иконка для картинки */}
                    <label className="cursor-pointer text-blue-600">
                      <FaImage />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files &&
                          uploadOptionImage(q.id, opt.id, e.target.files[0])
                        }
                      />
                    </label>
                  </div>
                  {opt.image && (
                    <img
                      src={opt.image}
                      alt="option"
                      className="h-16 rounded object-cover"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Кнопки для вопроса */}
            <div className="flex gap-3">
              <button
                onClick={() => duplicateQuestion(q.id)}
                className="flex items-center gap-1 rounded bg-yellow-500 px-3 py-1 text-white hover:bg-yellow-600"
              >
                <FaCopy /> Дублировать
              </button>
              <button
                onClick={() => deleteQuestion(q.id)}
                className="flex items-center gap-1 rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
              >
                <FaTrash /> Удалить
              </button>
            </div>
          </div>
        ))}

      {/* Кнопка добавить вопрос (только если есть вопросы) */}
      {!previewMode && questions.length > 0 && (
        <button
          onClick={addQuestion}
          className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <FaPlus /> Добавить вопрос
        </button>
      )}
    </div>
  );
}
