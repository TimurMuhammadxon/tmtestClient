// app/courses/[courseId]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { courses } from "@/lib/data";
import Breadcrumbs from "@/components/BreadCrumbs";

type Props = {
  params: {
    courseId: string;
  };
};

export default function CoursePage({ params }: Props) {
  const courseId = parseInt(params.courseId);
  const course = courses.find((c) => c.id === courseId);

  if (!course) {
    notFound(); // если курс не найден — 404
  }

  return (
    <div className="p-6">
      <Breadcrumbs/>
      {/* Заголовок курса */}
      <h1 className="text-3xl font-bold mb-4">{course?.name}</h1>
      <p className="text-gray-600 mb-6">{course?.description}</p>
      <img
        src={course?.image}
        alt={course?.name}
        className="w-64 h-40 object-cover rounded-xl mb-6"
      />

      {/* Список предметов */}
      <h2 className="text-2xl font-semibold mb-4">Fanlar</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {course?.subjects.map((subject) => (
          <Link
            key={subject.id}
            href={`/courses/${course.id}/subjects/${subject.id}`}
            className="block p-5 border rounded-xl shadow-md hover:shadow-xl hover:border-purple-500 transition duration-300 bg-white"
          >
            <h3 className="text-lg font-semibold mb-2">{subject.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-3">
              {subject.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
