import Link from "next/link";
import { courses } from "@/lib/data";

export default function CoursesPage() {
  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">📚 Курсы</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="overflow-hidden rounded-2xl bg-white shadow-md transition hover:shadow-xl"
          >
            {/* Картинка */}
            <img
              src={course.image}
              alt={course.name}
              className="h-40 w-full object-cover"
            />

            {/* Контент */}
            <div className="p-4">
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                {course.name}
              </h2>
              <p className="mb-4 text-sm text-gray-600 line-clamp-3">
                {course.description}
              </p>

              <Link
                href={`/courses/${course.id}`}
                className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
              >
                Перейти →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
