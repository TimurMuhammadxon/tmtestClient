import { NextResponse } from "next/server";
import { loginWithEmail } from "@/lib/data";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const res = await loginWithEmail(email, password);
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
