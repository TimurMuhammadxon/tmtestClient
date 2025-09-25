"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { courses as initialCourses } from "@/lib/data";

type Subject = {
  id: number;
  name: string;
  description: string;
};

export default function CoursePage({ params }: { params: { courseId: string } }) {
  const courseId = parseInt(params.courseId);
  const courseData = initialCourses.find((c) => c.id === courseId);

  if (!courseData) notFound();

  // локальное состояние
  const [subjects, setSubjects] = useState<Subject[]>(courseData?.subjects || []);
  const [isAdding, setIsAdding] = useState(false);
  const [newSubject, setNewSubject] = useState<Subject>({
    id: Date.now(),
    name: "",
    description: "",
  });
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // добавить предмет
  const handleAddSubject = () => {
    setSubjects([...subjects, { ...newSubject, id: Date.now() }]);
    setNewSubject({ id: Date.now(), name: "", description: "" });
    setIsAdding(false);
  };

  // обновить предмет
  const handleUpdateSubject = () => {
    if (!editingSubject) return;
    setSubjects(subjects.map((s) => (s.id === editingSubject.id ? editingSubject : s)));
    setEditingSubject(null);
  };

  // удалить предмет
  const handleDeleteSubject = (id: number) => {
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  return (
    <div className="p-6">
      <Breadcrumbs />

      {/* Заголовок курса */}
      <h1 className="text-3xl font-bold mb-4">{courseData?.name}</h1>
      <p className="text-gray-600 mb-6">{courseData?.description}</p>
      <img
        src={courseData?.image}
        alt={courseData?.name}
        className="w-64 h-40 object-cover rounded-xl mb-6"
      />

      {/* Кнопка добавить */}
      <button
        onClick={() => setIsAdding(true)}
        className="mb-6 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
      >
        ➕ Добавить предмет
      </button>

      {/* Форма добавления */}
      {isAdding && (
        <div className="mb-6 rounded-lg border p-4 shadow">
          <h2 className="mb-2 font-bold">Новый предмет</h2>
          <input
            type="text"
            placeholder="Название предмета"
            value={newSubject.name}
            onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
            className="mb-2 w-full rounded border p-2"
          />
          <textarea
            placeholder="Описание предмета"
            value={newSubject.description}
            onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
            className="mb-2 w-full rounded border p-2"
          />
          <button
            onClick={handleAddSubject}
            className="mr-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            ✅ Сохранить
          </button>
          <button
            onClick={() => setIsAdding(false)}
            className="rounded bg-gray-400 px-4 py-2 text-white hover:bg-gray-500"
          >
            ❌ Отмена
          </button>
        </div>
      )}

      {/* Форма редактирования */}
      {editingSubject && (
        <div className="mb-6 rounded-lg border p-4 shadow">
          <h2 className="mb-2 font-bold">Редактировать предмет</h2>
          <input
            type="text"
            value={editingSubject.name}
            onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
            className="mb-2 w-full rounded border p-2"
          />
          <textarea
            value={editingSubject.description}
            onChange={(e) =>
              setEditingSubject({ ...editingSubject, description: e.target.value })
            }
            className="mb-2 w-full rounded border p-2"
          />
          <button
            onClick={handleUpdateSubject}
            className="mr-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            💾 Обновить
          </button>
          <button
            onClick={() => setEditingSubject(null)}
            className="rounded bg-gray-400 px-4 py-2 text-white hover:bg-gray-500"
          >
            ❌ Отмена
          </button>
        </div>
      )}

      {/* Список предметов */}
      <h2 className="text-2xl font-semibold mb-4">📘 Предметы</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="block p-5 border rounded-xl shadow-md bg-white hover:shadow-xl transition duration-300"
          >
            <h3 className="text-lg font-semibold mb-2">{subject.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-3">{subject.description}</p>

            <div className="mt-4 flex justify-between">
              <Link
                href={`/courses/${courseData?.id}/subjects/${subject.id}`}
                className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
              >
                Перейти →
              </Link>
              <button
                onClick={() => setEditingSubject(subject)}
                className="rounded bg-yellow-500 px-3 py-1 text-white hover:bg-yellow-600"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDeleteSubject(subject.id)}
                className="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
