import Link from "next/link";
import { courses } from "@/lib/data";

export default function CoursePage({ params }: { params: { courseId: string } }) {
  const course = courses.find((c) => c.id === Number(params.courseId));
  if (!course) return <div>Курс не найден</div>;

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-bold">{course.name}</h1>
      <ul className="list-disc pl-6">
        {course.subjects.map((subject) => (
          <li key={subject.id}>
            <Link href={`/courses/${course.id}/subjects/${subject.id}`}>
              {subject.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
