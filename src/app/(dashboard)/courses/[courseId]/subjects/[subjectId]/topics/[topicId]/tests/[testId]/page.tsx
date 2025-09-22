"use client";

import Breadcrumbs from "@/components/BreadCrumbs";
import { useState } from "react";
import { FaTrash, FaCopy, FaPlus, FaImage } from "react-icons/fa";

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
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: Date.now(),
      text: "",
      options: Array.from({ length: 4 }, (_, i) => ({
        id: Date.now() + i + 1,
        text: "",
      })),
    },
  ]);
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Добавить вопрос (с 4 вариантами)
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

  const updateQuestionText = (qId: number, value: string) => {
    setQuestions(questions.map((q) => (q.id === qId ? { ...q, text: value } : q)));
  };

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

  const setCorrectOption = (qId: number, optId: number) => {
    setQuestions(
      questions.map((q) => (q.id === qId ? { ...q, correctOptionId: optId } : q))
    );
  };

  const deleteQuestion = (qId: number) => {
    setQuestions(questions.filter((q) => q.id !== qId));
  };

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

  // Загрузка картинок
  const uploadQuestionImage = (qId: number, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setQuestions(
        questions.map((q) => (q.id === qId ? { ...q, image: reader.result as string } : q))
      );
    };
    reader.readAsDataURL(file);
  };

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

  const publishTest = () => {
    const testData = { title: testTitle, questions };
    console.log("📤 Отправка на сервер:", testData);
    alert("✅ Тест опубликован!");
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs/>
      <h1 className="text-2xl font-bold">Редактор теста</h1>

      {/* Название теста */}
      <input
        type="text"
        placeholder="Название теста"
        value={testTitle}
        onChange={(e) => setTestTitle(e.target.value)}
        className="w-full border-b p-2 text-lg font-semibold focus:outline-none"
      />

      {/* Кнопки управления */}
      <div className="flex gap-4">
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
        >
          {previewMode ? "✏ Редактировать" : "👀 Предпросмотр"}
        </button>
        <button
          onClick={publishTest}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          🚀 Опубликовать
        </button>
      </div>

      {/* Редактирование */}
      {!previewMode &&
        questions.map((q) => (
          <div
            key={q.id}
            className="rounded-lg border bg-white p-3 shadow space-y-3"
          >
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

      {/* Добавить вопрос */}
      {!previewMode && (
        <button
          onClick={addQuestion}
          className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <FaPlus /> Добавить вопрос
        </button>
      )}

      {/* Предпросмотр */}
      {previewMode && (
        <div className="space-y-4 rounded-lg border bg-gray-50 p-4">
          <h2 className="text-xl font-bold">{testTitle || "Без названия"}</h2>
          {questions.map((q, idx) => (
            <div key={q.id} className="space-y-2 border-b pb-3">
              <p className="text-base font-medium">{idx + 1}. {q.text}</p>
              {q.image && <img src={q.image} alt="question" className="h-32 rounded object-cover" />}
              <ul className="space-y-1">
                {q.options.map((opt) => (
                  <li key={opt.id} className="flex items-center gap-2 rounded border p-2">
                    <input type="radio" disabled />
                    <span>{opt.text}</span>
                    {opt.image && (
                      <img src={opt.image} alt="option" className="h-12 rounded object-cover" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
