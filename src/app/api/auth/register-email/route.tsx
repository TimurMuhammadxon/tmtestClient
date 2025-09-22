import { NextResponse } from "next/server";
import { registerWithEmail } from "@/lib/data";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const res = await registerWithEmail(email, password);
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
