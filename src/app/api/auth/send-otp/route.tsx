import { NextResponse } from "next/server";
import { sendOtp } from "@/lib/data"; // если у тебя не настроен @ алиас — используй относительный путь

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    const result = await sendOtp(phone);
    // Возвращаем код в теле для удобства теста (dev only)
    return NextResponse.json({ ok: true, otp: result.code });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
