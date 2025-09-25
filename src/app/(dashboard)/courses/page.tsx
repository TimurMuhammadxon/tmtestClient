"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Breadcrumbs from "@/components/Breadcrumbs";
import { courses as initialCourses } from "@/lib/data";

type Course = {
  id: number;
  name: string;
  description: string;
  image: string;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [newCourse, setNewCourse] = useState<Course>({
    id: Date.now(),
    name: "",
    description: "",
    image: "https://via.placeholder.com/300x200?text=Course",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Добавление курса
  const handleAddCourse = () => {
    setCourses([...courses, { ...newCourse, id: Date.now() }]);
    setNewCourse({
      id: Date.now(),
      name: "",
      description: "",
      image: "https://via.placeholder.com/300x200?text=Course",
    });
    setIsAdding(false);
  };

  // Обновление курса
  const handleUpdateCourse = () => {
    if (!editingCourse) return;
    setCourses(
      courses.map((c) => (c.id === editingCourse.id ? editingCourse : c))
    );
    setEditingCourse(null);
  };

  return (
    <div className="p-6">
      <Breadcrumbs />
      <h1 className="mb-6 text-3xl font-bold text-gray-800">📚 Курсы</h1>

      {/* Кнопка добавить */}
      <button
        onClick={() => setIsAdding(true)}
        className="mb-6 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
      >
        ➕ Добавить курс
      </button>

      {/* Форма добавления */}
      {isAdding && (
        <div className="mb-6 rounded-lg border p-4 shadow">
          <h2 className="mb-2 font-bold">Новый курс</h2>
          <input
            type="text"
            placeholder="Название курса"
            value={newCourse.name}
            onChange={(e) =>
              setNewCourse({ ...newCourse, name: e.target.value })
            }
            className="mb-2 w-full rounded border p-2"
          />
          <textarea
            placeholder="Описание курса"
            value={newCourse.description}
            onChange={(e) =>
              setNewCourse({ ...newCourse, description: e.target.value })
            }
            className="mb-2 w-full rounded border p-2"
          />
          <input
            type="text"
            placeholder="URL картинки"
            value={newCourse.image}
            onChange={(e) =>
              setNewCourse({ ...newCourse, image: e.target.value })
            }
            className="mb-2 w-full rounded border p-2"
          />
          <button
            onClick={handleAddCourse}
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
      {editingCourse && (
        <div className="mb-6 rounded-lg border p-4 shadow">
          <h2 className="mb-2 font-bold">Редактировать курс</h2>
          <input
            type="text"
            value={editingCourse.name}
            onChange={(e) =>
              setEditingCourse({ ...editingCourse, name: e.target.value })
            }
            className="mb-2 w-full rounded border p-2"
          />
          <textarea
            value={editingCourse.description}
            onChange={(e) =>
              setEditingCourse({
                ...editingCourse,
                description: e.target.value,
              })
            }
            className="mb-2 w-full rounded border p-2"
          />
          <input
            type="text"
            value={editingCourse.image}
            onChange={(e) =>
              setEditingCourse({ ...editingCourse, image: e.target.value })
            }
            className="mb-2 w-full rounded border p-2"
          />
          <button
            onClick={handleUpdateCourse}
            className="mr-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            💾 Обновить
          </button>
          <button
            onClick={() => setEditingCourse(null)}
            className="rounded bg-gray-400 px-4 py-2 text-white hover:bg-gray-500"
          >
            ❌ Отмена
          </button>
        </div>
      )}

      {/* Список курсов */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="overflow-hidden rounded-2xl bg-white shadow-md transition hover:shadow-xl"
          >
            <div className="relative h-40 w-full">
              <Image
                src={course.image}
                alt={course.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="p-4">
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                {course.name}
              </h2>
              <p className="mb-4 text-sm text-gray-600 line-clamp-3">
                {course.description}
              </p>

              <div className="flex justify-between">
                <Link
                  href={`/courses/${course.id}`}
                  className="rounded-lg bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                >
                  Перейти →
                </Link>
                <button
                  onClick={() => setEditingCourse(course)}
                  className="rounded-lg bg-yellow-500 px-3 py-1 text-white hover:bg-yellow-600"
                >
                  ✏️ Редактировать
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
