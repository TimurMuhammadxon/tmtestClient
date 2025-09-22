"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { courses } from "@/lib/data"; // твои данные

// Функция для получения названия вместо ID
function getLabel(segments: string[], index: number): string {
  const seg = segments[index];

  // если сегмент число → пробуем найти в данных
  if (!isNaN(Number(seg))) {
    const courseId = Number(segments[1]);
    const subjectId = Number(segments[3]);
    const topicId = Number(segments[5]);
    const testId = Number(segments[7]);

    // уровни
    if (index === 1) {
      return courses.find((c) => c.id === courseId)?.name || seg;
    }
    if (index === 3) {
      return courses
        .find((c) => c.id === courseId)
        ?.subjects.find((s) => s.id === subjectId)?.name || seg;
    }
    if (index === 5) {
      return courses
        .find((c) => c.id === courseId)
        ?.subjects.find((s) => s.id === subjectId)
        ?.topics.find((t) => t.id === topicId)?.name || seg;
    }
    if (index === 7) {
      return courses
        .find((c) => c.id === courseId)
        ?.subjects.find((s) => s.id === subjectId)
        ?.topics.find((t) => t.id === topicId)
        ?.tests.find((t) => t.id === testId)?.title || seg;
    }
  }

  // иначе выводим сам сегмент
  return seg;
}

export default function Breadcrumbs() {
  const pathname = usePathname(); // например: /courses/1/subjects/2/topics/3/tests/5
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="mb-4 text-sm text-gray-600">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/" className="text-blue-600 hover:underline">
            Главная
          </Link>
        </li>

        {segments.map((seg, idx) => {
          const href = "/" + segments.slice(0, idx + 1).join("/");
          const isLast = idx === segments.length - 1;
          const label = getLabel(segments, idx);

          return (
            <li key={idx} className="flex items-center">
              <span className="mx-2">/</span>
              {isLast ? (
                <span className="font-medium text-gray-800">{label}</span>
              ) : (
                <Link href={href} className="text-blue-600 hover:underline">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
