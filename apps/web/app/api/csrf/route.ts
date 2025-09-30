import { NextResponse } from "next/server";
import { issueCsrf } from "@/lib/csrf";

export async function GET() {
  try {
    const token = await issueCsrf();
    return NextResponse.json({ csrf: token });
  } catch (err) {
    console.error("CSRF error:", err);
    return NextResponse.json(
      { error: "Erro ao gerar token CSRF" },
      { status: 500 }
    );
  }
}