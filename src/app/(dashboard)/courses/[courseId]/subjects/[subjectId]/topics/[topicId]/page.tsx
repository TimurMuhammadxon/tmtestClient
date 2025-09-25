import Link from "next/link";
import { courses } from "@/lib/data";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function TopicPage({
  params,
}: {
  params: { courseId: string; subjectId: string; topicId: string };
}) {
  const course = courses.find((c) => c.id === Number(params.courseId));
  const subject = course?.subjects.find((s) => s.id === Number(params.subjectId));
  const topic = subject?.topics.find((t) => t.id === Number(params.topicId));

  if (!topic) return <div>Тема не найдена</div>;

  return (
    <div className="p-6">
      <Breadcrumbs/>
      <h1 className="mb-6 text-xl font-bold">{topic.name}</h1>
      <ul className="list-disc pl-6">
        {topic.tests.map((test) => (
          <li key={test.id}>
            <Link
              href={`/courses/${course?.id}/subjects/${subject?.id}/topics/${topic.id}/tests/${test.id}`}
            >
              {test.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
