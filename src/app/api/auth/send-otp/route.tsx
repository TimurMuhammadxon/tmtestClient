import { NextResponse } from "next/server";
import { sendOtp } from "@/lib/data"; 

export async function POST(req: Request) {
  try {
    const { identifier, method } = await req.json();
    if (!identifier || !method) {
      return NextResponse.json({ ok: false, error: "Missing identifier or method" }, { status: 400 });
    }
    const result = await sendOtp(identifier, method);
    
    // Возвращаем код в теле для удобства теста (dev only)
    return NextResponse.json({ ok: true, otp: result.code });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
