// app/courses/[courseId]/page.tsx
import { notFound } from "next/navigation";
import { courses } from "@/lib/data";

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
      <h1 className="text-3xl font-bold mb-4">{course?.name}</h1>
      <p className="text-gray-600 mb-6">{course?.description}</p>
      <img
        src={course?.image}
        alt={course?.name}
        className="w-64 h-40 object-cover rounded-xl mb-6"
      />

      <h2 className="text-2xl font-semibold mb-4">Subjects</h2>
      <ul className="space-y-4">
        {course?.subjects.map((subject) => (
          <li key={subject.id} className="p-4 border rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold">{subject.name}</h3>
            <p className="text-gray-500 mb-2">{subject.description}</p>

            <ul className="list-disc list-inside ml-4">
              {subject.topics.map((topic) => (
                <li key={topic.id}>
                  <span className="font-medium">{topic.title}</span> —{" "}
                  {topic.description}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
