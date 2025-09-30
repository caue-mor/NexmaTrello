import { NextResponse } from "next/server";
import { lucia } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("auth_session")?.value;

    if (sessionId) {
      await lucia.invalidateSession(sessionId);
    }

    const blankSessionCookie = lucia.createBlankSessionCookie();

    const res = NextResponse.json({ ok: true });
    res.headers.set("Set-Cookie", blankSessionCookie.serialize());

    return res;
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json(
      { error: "Erro ao fazer logout" },
      { status: 500 }
    );
  }
}