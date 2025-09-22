import Link from "next/link";
import { courses } from "@/lib/data";
import Breadcrumbs from "@/components/BreadCrumbs";

export default function SubjectPage({
  params,
}: {
  params: { courseId: string; subjectId: string };
}) {
  const course = courses.find((c) => c.id === Number(params.courseId));
  const subject = course?.subjects.find((s) => s.id === Number(params.subjectId));
  if (!subject) return <div>Предмет не найден</div>;

  return (
    <div className="p-6">
      <Breadcrumbs/>
      <h1 className="mb-6 text-xl font-bold">{subject.name}</h1>
      <ul className="list-disc pl-6">
        {subject.topics.map((topic) => (
          <li key={topic.id}>
            <Link
              href={`/courses/${course?.id}/subjects/${subject.id}/topics/${topic.id}`}
            >
              {topic.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
