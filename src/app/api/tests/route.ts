import { NextResponse } from "next/server";

// In-memory store – resets on server restart.
// Replace with a real DB (Postgres, Mongo, etc.) for production.
export const testsStore: any[] = [];

export async function GET() {
  return NextResponse.json({ ok: true, tests: testsStore });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { title, description, questions, createdBy, createdByRole } = body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Название и хотя бы один вопрос обязательны" },
        { status: 400 }
      );
    }

    const test = {
      id: `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title,
      description: description || "",
      questions,
      createdBy: createdBy || "unknown",
      createdByRole: createdByRole || "unknown",
      createdAt: new Date().toISOString(),
    };

    testsStore.push(test);

    return NextResponse.json({ ok: true, test }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || "Server error" },
      { status: 500 }
    );
  }
}
