import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/data";

export async function POST(req: Request) {
  try {
    const { identifier, code, method, isRegister } = await req.json();
    if (!identifier || !code || !method) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }
    const res = await verifyOtp(identifier, code, method, isRegister); 
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
