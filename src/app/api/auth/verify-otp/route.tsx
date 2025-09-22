import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/data";

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();
    const res = await verifyOtp(phone, code); // res уже содержит role
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
