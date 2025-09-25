import { NextResponse } from "next/server";

// временное хранилище в памяти (после перезапуска сбросится)
let tests: Record<string, any> = {};

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const test = tests[params.id];
  if (!test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }
  return NextResponse.json(test);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  tests[params.id] = body;
  return NextResponse.json({ success: true, test: body });
}
